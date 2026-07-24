import { db, firebaseMode } from '@dailyme/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import type { Performance } from '../../types/performance'
import {
  isRunningCharityData,
  isRunningCompetitionData,
} from './performanceCatalog'

const localStorageKey = 'athletic-performance.records-v2'

export async function listPerformances(ownerUid: string) {
  if (firebaseMode === 'firebase' && db) {
    const performancesQuery = query(
      collection(db, 'performances'),
      where('ownerUid', '==', ownerUid),
    )
    const snapshot = await getDocs(performancesQuery)

    return snapshot.docs
      .map((performanceDocument) =>
        parsePerformance(performanceDocument.data(), performanceDocument.id),
      )
      .filter((performance): performance is Performance => Boolean(performance))
      .sort(sortByDateDesc)
  }

  return loadLocalPerformances()
}

export async function getPerformance(
  ownerUid: string,
  performanceId: string,
) {
  if (firebaseMode === 'firebase' && db) {
    const snapshot = await getDoc(doc(db, 'performances', performanceId))

    if (!snapshot.exists()) {
      return null
    }

    const performance = parsePerformance(snapshot.data(), snapshot.id)
    return performance?.ownerUid === ownerUid ? performance : null
  }

  const performances = await loadLocalPerformances()
  return (
    performances.find((performance) => performance.id === performanceId) ?? null
  )
}

export async function savePerformance(performance: Performance) {
  if (firebaseMode === 'firebase' && db) {
    await setDoc(doc(db, 'performances', performance.id), {
      ...performance,
      updatedAt: serverTimestamp(),
    })
    return
  }

  const performances = await loadLocalPerformances()
  const next = [
    performance,
    ...performances.filter((item) => item.id !== performance.id),
  ]
  localStorage.setItem(localStorageKey, JSON.stringify(next))
}

export async function deletePerformance(performanceId: string) {
  if (firebaseMode === 'firebase' && db) {
    await deleteDoc(doc(db, 'performances', performanceId))
    return
  }

  const performances = await loadLocalPerformances()
  localStorage.setItem(
    localStorageKey,
    JSON.stringify(performances.filter((item) => item.id !== performanceId)),
  )
}

function loadLocalPerformances() {
  const raw = localStorage.getItem(localStorageKey)

  if (!raw) {
    return []
  }

  return (JSON.parse(raw) as Record<string, unknown>[])
    .map((performance) =>
      parsePerformance(
        performance,
        typeof performance.id === 'string' ? performance.id : '',
      ),
    )
    .filter((performance): performance is Performance => Boolean(performance))
    .sort(sortByDateDesc)
}

function parsePerformance(
  data: Record<string, unknown>,
  id: string,
): Performance | null {
  if (
    !id ||
    typeof data.ownerUid !== 'string' ||
    typeof data.title !== 'string' ||
    data.sportKey !== 'running' ||
    !isValidDateRange(data.date) ||
    !isSupportedData(data)
  ) {
    return null
  }

  return {
    ...data,
    id,
  } as Performance
}

function sortByDateDesc(left: Performance, right: Performance) {
  if (left.date.start.year !== right.date.start.year) {
    return right.date.start.year - left.date.start.year
  }

  if (left.date.start.month !== right.date.start.month) {
    return right.date.start.month - left.date.start.month
  }

  return right.date.start.day - left.date.start.day
}

function isSupportedData(data: Record<string, unknown>) {
  if (
    data.activityDefinitionId === 'running__competition' &&
    data.activityTypeKey === 'competition' &&
    data.schemaVersion === 2
  ) {
    return isRunningCompetitionData(data.data)
  }

  if (
    data.activityDefinitionId === 'running__charity' &&
    data.activityTypeKey === 'charity' &&
    data.schemaVersion === 1
  ) {
    return isRunningCharityData(data.data)
  }

  return false
}

function isValidDateRange(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const range = value as {
    start?: unknown
    end?: unknown
  }

  if (!isValidCalendarDate(range.start)) {
    return false
  }

  if (typeof range.end === 'undefined') {
    return true
  }

  return (
    isValidCalendarDate(range.end) &&
    toTimestamp(range.end) >= toTimestamp(range.start)
  )
}

function isValidCalendarDate(value: unknown): value is {
  year: number
  month: number
  day: number
} {
  if (!value || typeof value !== 'object') {
    return false
  }

  const date = value as {
    year?: unknown
    month?: unknown
    day?: unknown
  }

  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day)
  ) {
    return false
  }

  const timestamp = new Date(
    Date.UTC(Number(date.year), Number(date.month) - 1, Number(date.day)),
  )

  return (
    timestamp.getUTCFullYear() === date.year &&
    timestamp.getUTCMonth() === Number(date.month) - 1 &&
    timestamp.getUTCDate() === date.day
  )
}

function toTimestamp(date: { year: number; month: number; day: number }) {
  return Date.UTC(date.year, date.month - 1, date.day)
}
