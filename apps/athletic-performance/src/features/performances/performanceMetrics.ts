import type {
  MedalKind,
  Metric,
  Performance,
  RankingKey,
  RankingResult,
} from '../../types/performance'
import {
  isRunningCharityData,
  isRunningCompetitionData,
  resultStatusLabels,
} from './performanceCatalog'

const rankingLabels: Record<RankingKey, string> = {
  overall: 'Classement general',
  sex: 'Classement sexe',
  category: 'Classement categorie',
}

export function getPerformanceMetrics(performance: Performance): Metric[] {
  if (
    !isRunningCompetitionData(performance.data) &&
    !isRunningCharityData(performance.data)
  ) {
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
  ]

  if (typeof data.durationSeconds === 'number') {
    metrics.push({
      key: 'duration',
      label: 'Temps',
      value: formatDuration(data.durationSeconds),
      normalizedValue: data.durationSeconds,
    })
  }

  if (isRunningCompetitionData(data)) {
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
        medal: getMedalForRank(ranking.rank),
      })
    }
  }

  return metrics
}

export function getStatusComment(performance: Performance) {
  return isRunningCompetitionData(performance.data)
    ? performance.data.statusComment
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

  return `${hours} H : ${padTime(minutes)} M : ${padTime(seconds)} S`
}

function formatRanking(ranking: RankingResult) {
  if (ranking.rank === -1) {
    return resultStatusLabels.dnf
  }

  if (ranking.rank === -2) {
    return resultStatusLabels.dsq
  }

  if (ranking.rank === -3) {
    return resultStatusLabels.dns
  }

  if (typeof ranking.rank !== 'number') {
    return ''
  }

  return ranking.participantCount
    ? `${formatInteger(ranking.rank)} / ${formatInteger(ranking.participantCount)}`
    : formatInteger(ranking.rank)
}

export function getMedalForRank(rank?: number): MedalKind | undefined {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  if (rank === 4) return 'chocolate'
  return undefined
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)
}

function padTime(value: number) {
  return String(value).padStart(2, '0')
}
