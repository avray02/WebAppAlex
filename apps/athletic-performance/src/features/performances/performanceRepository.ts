import { db, firebaseMode } from '@dailyme/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  writeBatch,
  where,
} from 'firebase/firestore'
import type {
  Performance,
  PerformanceStage,
  SimplifiedGpxTrack,
} from '../../types/performance'
import {
  isPerformanceStageData,
  isRoadCyclingCompetitionData,
  isRunningCharityData,
  isRunningCompetitionData,
} from './performanceCatalog'

const localStorageKey = 'athletic-performance.records-v2'
const localStagesStorageKey = 'athletic-performance.stages-v1'

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

export async function getPerformanceStages(
  ownerUid: string,
  performanceId: string,
) {
  if (firebaseMode === 'firebase' && db) {
    const snapshot = await getDocs(
      query(
        collection(db, 'performances', performanceId, 'stages'),
        where('ownerUid', '==', ownerUid),
      ),
    )

    return snapshot.docs
      .map((stageDocument) =>
        parsePerformanceStage(stageDocument.data(), stageDocument.id),
      )
      .filter(
        (stage): stage is PerformanceStage =>
          stage !== null &&
          stage.ownerUid === ownerUid &&
          stage.performanceId === performanceId,
      )
      .sort((left, right) => left.order - right.order)
  }

  return loadLocalStages()
    .filter(
      (stage) =>
        stage.ownerUid === ownerUid &&
        stage.performanceId === performanceId,
    )
    .sort((left, right) => left.order - right.order)
}

export async function savePerformanceBundle({
  performance,
  stages,
}: {
  performance: Performance
  stages: PerformanceStage[]
}) {
  if (firebaseMode === 'firebase' && db) {
    const performanceReference = doc(db, 'performances', performance.id)
    const stagesCollection = collection(
      db,
      'performances',
      performance.id,
      'stages',
    )
    const existingStages = await getDocs(
      query(stagesCollection, where('ownerUid', '==', performance.ownerUid)),
    )
    const batch = writeBatch(db)
    const nextStageIds = new Set(stages.map((stage) => stage.id))

    batch.set(performanceReference, {
      ...performance,
      updatedAt: serverTimestamp(),
    })

    for (const stage of stages) {
      batch.set(doc(stagesCollection, stage.id), {
        ...stage,
        updatedAt: serverTimestamp(),
      })
    }

    for (const existingStage of existingStages.docs) {
      if (!nextStageIds.has(existingStage.id)) {
        batch.delete(existingStage.ref)
      }
    }

    await batch.commit()
    return
  }

  const performances = await loadLocalPerformances()
  const next = [
    performance,
    ...performances.filter((item) => item.id !== performance.id),
  ]
  localStorage.setItem(localStorageKey, JSON.stringify(next))
  const localStages = loadLocalStages()
  localStorage.setItem(
    localStagesStorageKey,
    JSON.stringify([
      ...stages,
      ...localStages.filter(
        (stage) => stage.performanceId !== performance.id,
      ),
    ]),
  )
}

export async function deletePerformance(
  performanceId: string,
  ownerUid: string,
) {
  if (firebaseMode === 'firebase' && db) {
    const stageSnapshot = await getDocs(
      query(
        collection(db, 'performances', performanceId, 'stages'),
        where('ownerUid', '==', ownerUid),
      ),
    )
    const batch = writeBatch(db)

    for (const stageDocument of stageSnapshot.docs) {
      batch.delete(stageDocument.ref)
    }

    batch.delete(doc(db, 'performances', performanceId))
    await batch.commit()
    return
  }

  const performances = await loadLocalPerformances()
  localStorage.setItem(
    localStorageKey,
    JSON.stringify(performances.filter((item) => item.id !== performanceId)),
  )
  localStorage.setItem(
    localStagesStorageKey,
    JSON.stringify(
      loadLocalStages().filter(
        (stage) => stage.performanceId !== performanceId,
      ),
    ),
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

function loadLocalStages() {
  const raw = localStorage.getItem(localStagesStorageKey)

  if (!raw) {
    return []
  }

  return (JSON.parse(raw) as Record<string, unknown>[])
    .map((stage) =>
      parsePerformanceStage(
        stage,
        typeof stage.id === 'string' ? stage.id : '',
      ),
    )
    .filter((stage): stage is PerformanceStage => Boolean(stage))
}

function parsePerformance(
  data: Record<string, unknown>,
  id: string,
): Performance | null {
  if (
    !id ||
    typeof data.ownerUid !== 'string' ||
    typeof data.title !== 'string' ||
    (data.sportKey !== 'running' && data.sportKey !== 'road-cycling') ||
    !isValidDateRange(data.date) ||
    !isSupportedData(data) ||
    (typeof data.track !== 'undefined' && !isValidTrack(data.track))
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
    data.sportKey === 'running' &&
    data.activityTypeKey === 'competition' &&
    data.schemaVersion === 2
  ) {
    return isRunningCompetitionData(data.data)
  }

  if (
    data.activityDefinitionId === 'running__charity' &&
    data.sportKey === 'running' &&
    data.activityTypeKey === 'charity' &&
    data.schemaVersion === 1
  ) {
    return isRunningCharityData(data.data)
  }

  if (
    data.activityDefinitionId === 'road-cycling__competition' &&
    data.sportKey === 'road-cycling' &&
    data.activityTypeKey === 'competition' &&
    data.schemaVersion === 1
  ) {
    return (
      isRoadCyclingCompetitionData(data.data)
    )
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

function parsePerformanceStage(
  data: Record<string, unknown>,
  id: string,
): PerformanceStage | null {
  if (
    !id ||
    typeof data.performanceId !== 'string' ||
    typeof data.ownerUid !== 'string' ||
    typeof data.title !== 'string' ||
    !Number.isInteger(data.order) ||
    Number(data.order) < 0 ||
    !isValidCalendarDate(data.date) ||
    !isPerformanceStageData(data.data) ||
    (typeof data.track !== 'undefined' && !isValidTrack(data.track))
  ) {
    return null
  }

  return {
    ...data,
    id,
  } as PerformanceStage
}

function isValidTrack(value: unknown): value is SimplifiedGpxTrack {
  if (!value || typeof value !== 'object') {
    return false
  }

  const track = value as Partial<SimplifiedGpxTrack>

  return (
    typeof track.fileName === 'string' &&
    track.fileName.length > 0 &&
    track.fileName.length <= 200 &&
    Number.isInteger(track.originalPointCount) &&
    Array.isArray(track.points) &&
    track.points.length >= 2 &&
    track.points.length <= 500 &&
    track.points.every(
      (point) =>
        point &&
        typeof point === 'object' &&
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude) &&
        (typeof point.elevationMeters === 'undefined' ||
          Number.isFinite(point.elevationMeters)),
    )
  )
}
