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
import { loadLegacyPerformances } from '../import/legacyMapper'

const localStorageKey = 'athletic-performance.manual-records'
const deletedLegacyKey = 'athletic-performance.deleted-legacy-records'

export async function listPerformances(ownerUid: string) {
  if (firebaseMode === 'firebase' && db) {
    const performancesQuery = query(
      collection(db, 'performances'),
      where('ownerUid', '==', ownerUid),
    )
    const snapshot = await getDocs(performancesQuery)

    return snapshot.docs
      .map(
        (document) =>
          ({
            ...document.data(),
            id: document.id,
          }) as Performance,
      )
      .sort(sortByDateDesc)
  }

  const [legacy, manual, deletedLegacyIds] = await Promise.all([
    loadLegacyPerformances(ownerUid),
    loadManualPerformances(),
    loadDeletedLegacyIds(),
  ])
  const performances = new Map(
    legacy
      .filter((performance) => !deletedLegacyIds.has(performance.id))
      .map((performance) => [performance.id, performance]),
  )

  manual.forEach((performance) => performances.set(performance.id, performance))

  return Array.from(performances.values()).sort(sortByDateDesc)
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

    const performance = {
      ...snapshot.data(),
      id: snapshot.id,
    } as Performance

    return performance.ownerUid === ownerUid ? performance : null
  }

  const performances = await listPerformances(ownerUid)
  return performances.find((performance) => performance.id === performanceId) ?? null
}

export async function savePerformance(performance: Performance) {
  if (firebaseMode === 'firebase' && db) {
    await setDoc(doc(db, 'performances', performance.id), {
      ...performance,
      updatedAt: serverTimestamp(),
    })
    return
  }

  const performances = await loadManualPerformances()
  const next = [
    performance,
    ...performances.filter((item) => item.id !== performance.id),
  ]
  localStorage.setItem(localStorageKey, JSON.stringify(next))
  const deletedLegacyIds = await loadDeletedLegacyIds()
  deletedLegacyIds.delete(performance.id)
  saveDeletedLegacyIds(deletedLegacyIds)
}

export async function deletePerformance(performanceId: string) {
  if (firebaseMode === 'firebase' && db) {
    await deleteDoc(doc(db, 'performances', performanceId))
    return
  }

  const performances = await loadManualPerformances()
  localStorage.setItem(
    localStorageKey,
    JSON.stringify(performances.filter((item) => item.id !== performanceId)),
  )
  const deletedLegacyIds = await loadDeletedLegacyIds()
  deletedLegacyIds.add(performanceId)
  saveDeletedLegacyIds(deletedLegacyIds)
}

async function loadManualPerformances() {
  const raw = localStorage.getItem(localStorageKey)

  if (!raw) {
    return []
  }

  return JSON.parse(raw) as Performance[]
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

async function loadDeletedLegacyIds() {
  const raw = localStorage.getItem(deletedLegacyKey)

  if (!raw) {
    return new Set<string>()
  }

  return new Set(JSON.parse(raw) as string[])
}

function saveDeletedLegacyIds(ids: Set<string>) {
  localStorage.setItem(deletedLegacyKey, JSON.stringify(Array.from(ids)))
}
