import {
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  Snowflake,
  Trophy,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type {
  ActivityDefinition,
  ActivityTypeKey,
  ResultStatus,
  RunningCharityData,
  RunningCompetitionData,
  SportKey,
} from '../../types/performance'

export type SportOption = {
  key: SportKey
  label: string
  icon: LucideIcon
}

export const sportOptions: SportOption[] = [
  { key: 'running', label: 'Course a pied', icon: Footprints },
  { key: 'trail', label: 'Trail', icon: Mountain },
  { key: 'triathlon', label: 'Triathlon', icon: Waves },
  { key: 'cycling', label: 'Cyclisme', icon: Bike },
  { key: 'swimming', label: 'Natation', icon: Waves },
  { key: 'strength', label: 'Musculation', icon: Dumbbell },
  { key: 'hiking', label: 'Randonnee', icon: Mountain },
  { key: 'skiing', label: 'Ski', icon: Snowflake },
  { key: 'backcountry-skiing', label: 'Ski rando', icon: Snowflake },
  { key: 'other', label: 'Autre', icon: Trophy },
]

export const activityOptions: Array<{
  key: ActivityTypeKey
  label: string
}> = [
  { key: 'competition', label: 'Competition' },
  { key: 'adventure', label: 'Aventure' },
  { key: 'charity', label: 'Caritatif' },
]

export const sportByKey = Object.fromEntries(
  sportOptions.map((sport) => [sport.key, sport]),
) as Record<SportKey, SportOption>

export const activityLabels: Record<ActivityTypeKey, string> = {
  competition: 'Competition',
  adventure: 'Aventure',
  charity: 'Caritatif',
}

export const activityDefinitions: ActivityDefinition[] = [
  {
    id: 'running__competition',
    sportKey: 'running',
    sportLabel: 'Course a pied',
    activityTypeKey: 'competition',
    activityTypeLabel: 'Competition',
    active: true,
    schemaVersion: 2,
    fields: [
      {
        key: 'distanceMeters',
        label: 'Distance',
        section: 'description',
        valueType: 'distance',
        required: true,
        storageUnit: 'm',
        inputUnits: ['km', 'm'],
        displayFormat: 'adaptive-distance',
      },
      {
        key: 'elevationGainMeters',
        label: 'Denivele positif',
        section: 'description',
        valueType: 'integer',
        required: true,
        storageUnit: 'm',
        displayFormat: 'meters',
      },
      {
        key: 'durationSeconds',
        label: 'Temps',
        section: 'results',
        valueType: 'duration',
        required: true,
        storageUnit: 's',
        displayFormat: 'hms',
      },
      {
        key: 'resultStatus',
        label: 'Statut du resultat',
        section: 'results',
        valueType: 'status',
        required: true,
        displayFormat: 'status',
      },
      {
        key: 'rankings',
        label: 'Classements',
        section: 'results',
        valueType: 'rankings',
        required: false,
        displayFormat: 'rankings',
      },
      {
        key: 'statusComment',
        label: 'Commentaire de statut',
        section: 'results',
        valueType: 'text',
        required: false,
      },
    ],
  },
  {
    id: 'running__charity',
    sportKey: 'running',
    sportLabel: 'Course a pied',
    activityTypeKey: 'charity',
    activityTypeLabel: 'Caritatif',
    active: true,
    schemaVersion: 1,
    fields: [
      {
        key: 'distanceMeters',
        label: 'Distance',
        section: 'description',
        valueType: 'distance',
        required: true,
        storageUnit: 'm',
        inputUnits: ['km', 'm'],
        displayFormat: 'adaptive-distance',
      },
      {
        key: 'elevationGainMeters',
        label: 'Denivele positif',
        section: 'description',
        valueType: 'integer',
        required: true,
        storageUnit: 'm',
        displayFormat: 'meters',
      },
      {
        key: 'durationSeconds',
        label: 'Temps',
        section: 'results',
        valueType: 'duration',
        required: false,
        storageUnit: 's',
        displayFormat: 'hms',
      },
    ],
  },
]

export const runningCompetitionDefinition = activityDefinitions[0]
export const runningCharityDefinition = activityDefinitions[1]

export const resultSentinels: Record<Exclude<ResultStatus, 'ranked'>, number> = {
  dnf: -1,
  dsq: -2,
  dns: -3,
}

export const resultStatusLabels: Record<ResultStatus, string> = {
  ranked: 'Classe',
  dnf: 'DNF',
  dsq: 'DSQ',
  dns: 'DNS',
}

export function isRunningCompetitionData(
  value: unknown,
): value is RunningCompetitionData {
  if (!value || typeof value !== 'object') {
    return false
  }

  const data = value as Partial<RunningCompetitionData>
  const rankings = data.rankings as
    | Partial<RunningCompetitionData['rankings']>
    | undefined

  if (
    !Number.isInteger(data.distanceMeters) ||
    Number(data.distanceMeters) <= 0 ||
    !Number.isInteger(data.elevationGainMeters) ||
    Number(data.elevationGainMeters) < 0 ||
    !Number.isInteger(data.durationSeconds) ||
    Number(data.durationSeconds) <= 0 ||
    !isResultStatus(data.resultStatus) ||
    !rankings
  ) {
    return false
  }

  const rankingValues = [
    rankings.overall,
    rankings.sex,
    rankings.category,
  ]

  if (data.resultStatus === 'ranked') {
    return (
      rankingValues.every((ranking) => isValidRankedResult(ranking)) &&
      typeof data.statusComment === 'undefined'
    )
  }

  const sentinel = resultSentinels[data.resultStatus]
  return (
    rankingValues.every(
      (ranking) =>
        ranking?.rank === sentinel &&
        typeof ranking.participantCount === 'undefined',
    ) &&
    (typeof data.statusComment === 'undefined' ||
      typeof data.statusComment === 'string')
  )
}

export function isRunningCharityData(
  value: unknown,
): value is RunningCharityData {
  if (!value || typeof value !== 'object') {
    return false
  }

  const data = value as Partial<RunningCharityData>

  return (
    hasValidRunningDescription(data) &&
    (typeof data.durationSeconds === 'undefined' ||
      (Number.isInteger(data.durationSeconds) &&
        Number(data.durationSeconds) > 0)) &&
    !('rankings' in data) &&
    !('resultStatus' in data)
  )
}

function hasValidRunningDescription(value: {
  distanceMeters?: unknown
  elevationGainMeters?: unknown
}) {
  return (
    Number.isInteger(value.distanceMeters) &&
    Number(value.distanceMeters) > 0 &&
    Number.isInteger(value.elevationGainMeters) &&
    Number(value.elevationGainMeters) >= 0
  )
}

function isResultStatus(value: unknown): value is ResultStatus {
  return (
    value === 'ranked' ||
    value === 'dnf' ||
    value === 'dsq' ||
    value === 'dns'
  )
}

function isValidRankedResult(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const ranking = value as {
    rank?: unknown
    participantCount?: unknown
  }
  const hasRank = typeof ranking.rank !== 'undefined'
  const hasParticipants = typeof ranking.participantCount !== 'undefined'

  if (hasRank && (!Number.isInteger(ranking.rank) || Number(ranking.rank) <= 0)) {
    return false
  }

  if (
    hasParticipants &&
    (!Number.isInteger(ranking.participantCount) ||
      Number(ranking.participantCount) <= 0 ||
      !hasRank ||
      Number(ranking.participantCount) < Number(ranking.rank))
  ) {
    return false
  }

  return true
}
