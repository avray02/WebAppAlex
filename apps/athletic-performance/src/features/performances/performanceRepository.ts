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
import { isRunningCompetitionData } from './performanceCatalog'

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
    data.activityDefinitionId !== 'running__competition' ||
    data.schemaVersion !== 1 ||
    typeof data.title !== 'string' ||
    data.sportKey !== 'running' ||
    data.activityTypeKey !== 'competition' ||
    !isRunningCompetitionData(data.data)
  ) {
    return null
  }

  return {
    ...data,
    id,
  } as Performance
}

function sortByDateDesc(left: Performance, right: Performance) {
  if (left.date.year !== right.date.year) {
    return right.date.year - left.date.year
  }

  if ((left.date.month ?? 0) !== (right.date.month ?? 0)) {
    return (right.date.month ?? 0) - (left.date.month ?? 0)
  }

  return (right.date.day ?? 0) - (left.date.day ?? 0)
}
