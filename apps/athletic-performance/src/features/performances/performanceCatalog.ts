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
    schemaVersion: 1,
    fields: [
      {
        key: 'distanceMeters',
        label: 'Distance',
        valueType: 'integer',
        required: true,
        storageUnit: 'm',
        displayFormat: 'adaptive-distance',
      },
      {
        key: 'elevationGainMeters',
        label: 'Denivele positif',
        valueType: 'integer',
        required: true,
        storageUnit: 'm',
        displayFormat: 'meters',
      },
      {
        key: 'durationSeconds',
        label: 'Temps',
        valueType: 'duration',
        required: true,
        storageUnit: 's',
        displayFormat: 'hms',
      },
      {
        key: 'rankings',
        label: 'Classements',
        valueType: 'rankings',
        required: false,
        displayFormat: 'rankings',
      },
      {
        key: 'dnfComment',
        label: 'Commentaire DNF',
        valueType: 'text',
        required: false,
      },
    ],
  },
]

export const runningCompetitionDefinition = activityDefinitions[0]

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
    !rankings
  ) {
    return false
  }

  const rankingValues = [
    rankings.overall,
    rankings.sex,
    rankings.category,
  ]

  if (rankingValues.some((ranking) => !isValidRanking(ranking))) {
    return false
  }

  const dnfCount = rankingValues.filter((ranking) => ranking?.rank === -1).length

  return (
    (dnfCount === 0 || dnfCount === rankingValues.length) &&
    (typeof data.dnfComment !== 'string' || dnfCount === rankingValues.length)
  )
}

function isValidRanking(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false
  }

  const ranking = value as {
    rank?: unknown
    participantCount?: unknown
  }
  const hasRank = typeof ranking.rank !== 'undefined'
  const hasParticipants = typeof ranking.participantCount !== 'undefined'

  if (
    hasRank &&
    (!Number.isInteger(ranking.rank) ||
      (Number(ranking.rank) !== -1 && Number(ranking.rank) <= 0))
  ) {
    return false
  }

  if (
    hasParticipants &&
    (!Number.isInteger(ranking.participantCount) ||
      Number(ranking.participantCount) <= 0 ||
      !hasRank ||
      Number(ranking.rank) === -1 ||
      Number(ranking.participantCount) < Number(ranking.rank))
  ) {
    return false
  }

  return true
}
