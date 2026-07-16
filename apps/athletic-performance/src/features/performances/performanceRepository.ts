import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db, firebaseMode } from '../../lib/firebase/config'
import type { Performance } from '../../types/performance'
import { loadLegacyPerformances } from '../import/legacyMapper'

const localStorageKey = 'athletic-performance.manual-records'

export async function listPerformances(ownerUid: string) {
  if (firebaseMode === 'firebase' && db) {
    const performancesQuery = query(
      collection(db, 'performances'),
      where('ownerUid', '==', ownerUid),
      orderBy('date.year', 'desc'),
    )
    const snapshot = await getDocs(performancesQuery)

    return snapshot.docs.map((document) => document.data() as Performance)
  }

  const [legacy, manual] = await Promise.all([
    loadLegacyPerformances(ownerUid),
    loadManualPerformances(),
  ])

  return [...manual, ...legacy].sort(sortByDateDesc)
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

  return (right.date.month ?? 0) - (left.date.month ?? 0)
}
