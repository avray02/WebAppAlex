import type {
  Metric,
  Performance,
  RankingKey,
  RankingResult,
} from '../../types/performance'
import { isRunningCompetitionData } from './performanceCatalog'

const rankingLabels: Record<RankingKey, string> = {
  overall: 'Classement general',
  sex: 'Classement sexe',
  category: 'Classement categorie',
}

export function getPerformanceMetrics(performance: Performance): Metric[] {
  if (!isRunningCompetitionData(performance.data)) {
    return []
  }

  const data = performance.data
  const metrics: Metric[] = [
    {
      key: 'distance',
      label: 'Distance',
      value: formatDistance(data.distanceMeters),
      normalizedValue: data.distanceMeters,
    },
    {
      key: 'elevation',
      label: 'Denivele positif',
      value: `${formatInteger(data.elevationGainMeters)} m`,
      normalizedValue: data.elevationGainMeters,
    },
    {
      key: 'duration',
      label: 'Temps',
      value: formatDuration(data.durationSeconds),
      normalizedValue: data.durationSeconds,
    },
  ]

  for (const key of ['overall', 'sex', 'category'] as RankingKey[]) {
    const ranking = data.rankings[key]

    if (typeof ranking?.rank !== 'number') {
      continue
    }

    metrics.push({
      key: 'rank',
      label: rankingLabels[key],
      value: formatRanking(ranking),
      normalizedValue: ranking.rank,
    })
  }

  return metrics
}

export function getDnfComment(performance: Performance) {
  return isRunningCompetitionData(performance.data)
    ? performance.data.dnfComment
    : undefined
}

export function hasRanking(performance: Performance) {
  return (
    isRunningCompetitionData(performance.data) &&
    Object.values(performance.data.rankings).some(
      (ranking) => typeof ranking.rank === 'number',
    )
  )
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
    }).format(distanceMeters / 1000)} km`
  }

  return `${formatInteger(distanceMeters)} m`
}

export function formatDuration(durationSeconds: number) {
  const hours = Math.floor(durationSeconds / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)
  const seconds = durationSeconds % 60
  const parts: string[] = []

  if (hours) {
    parts.push(`${hours} h`)
  }

  if (minutes || hours) {
    parts.push(`${minutes} min`)
  }

  parts.push(`${seconds} s`)
  return parts.join(' ')
}

function formatRanking(ranking: RankingResult) {
  if (ranking.rank === -1) {
    return 'DNF'
  }

  if (typeof ranking.rank !== 'number') {
    return ''
  }

  return ranking.participantCount
    ? `${formatInteger(ranking.rank)} / ${formatInteger(ranking.participantCount)}`
    : formatInteger(ranking.rank)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)
}
