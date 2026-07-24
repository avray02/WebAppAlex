import type {
  MedalKind,
  Metric,
  Performance,
  PerformanceStage,
  RankingKey,
  RankingResult,
} from '../../types/performance'
import {
  isRoadCyclingCompetitionData,
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
  const runningCompetition = isRunningCompetitionData(performance.data)
    ? performance.data
    : undefined
  const runningCharity = isRunningCharityData(performance.data)
    ? performance.data
    : undefined
  const roadCyclingCompetition = isRoadCyclingCompetitionData(performance.data)
    ? performance.data
    : undefined

  const data =
    runningCompetition ?? runningCharity ?? roadCyclingCompetition
  const competitionData = runningCompetition ?? roadCyclingCompetition

  if (!data) {
    return []
  }
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

  if (roadCyclingCompetition) {
    metrics.push({
      key: 'speed',
      label: 'Vitesse moyenne',
      value: formatSpeed(
        roadCyclingCompetition.distanceMeters,
        roadCyclingCompetition.durationSeconds,
      ),
    })

    if (typeof roadCyclingCompetition.averagePowerWatts === 'number') {
      metrics.push({
        key: 'power',
        label: 'Puissance moyenne',
        value: `${formatInteger(roadCyclingCompetition.averagePowerWatts)} W`,
        normalizedValue: roadCyclingCompetition.averagePowerWatts,
      })
    }

    if (typeof roadCyclingCompetition.stageCount === 'number') {
      metrics.push({
        key: 'stages',
        label: "Nombre d'etapes",
        value: `${formatInteger(roadCyclingCompetition.stageCount)} etape${roadCyclingCompetition.stageCount > 1 ? 's' : ''}`,
        normalizedValue: roadCyclingCompetition.stageCount,
      })
    }
  }

  if (competitionData) {
    for (const key of ['overall', 'sex', 'category'] as RankingKey[]) {
      const ranking = competitionData.rankings[key]

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

export function getPerformanceStageMetrics(stage: PerformanceStage): Metric[] {
  const metrics: Metric[] = [
    {
      key: 'distance',
      label: 'Distance',
      value: formatDistance(stage.data.distanceMeters),
      normalizedValue: stage.data.distanceMeters,
    },
    {
      key: 'elevation',
      label: 'Denivele positif',
      value: `${formatInteger(stage.data.elevationGainMeters)} m`,
      normalizedValue: stage.data.elevationGainMeters,
    },
    {
      key: 'duration',
      label: 'Temps',
      value: formatDuration(stage.data.durationSeconds),
      normalizedValue: stage.data.durationSeconds,
    },
    {
      key: 'speed',
      label: 'Vitesse moyenne',
      value: formatSpeed(
        stage.data.distanceMeters,
        stage.data.durationSeconds,
      ),
    },
  ]

  if (typeof stage.data.averagePowerWatts === 'number') {
    metrics.push({
      key: 'power',
      label: 'Puissance moyenne',
      value: `${formatInteger(stage.data.averagePowerWatts)} W`,
      normalizedValue: stage.data.averagePowerWatts,
    })
  }

  for (const key of ['overall', 'sex', 'category'] as RankingKey[]) {
    const ranking = stage.data.rankings[key]

    if (typeof ranking.rank === 'number') {
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
  if (
    isRunningCompetitionData(performance.data) ||
    isRoadCyclingCompetitionData(performance.data)
  ) {
    return performance.data.statusComment
  }

  return undefined
}

export function hasRanking(performance: Performance) {
  return (
    (isRunningCompetitionData(performance.data) ||
      isRoadCyclingCompetitionData(performance.data)) &&
    Object.values(performance.data.rankings).some(
      (ranking) => typeof ranking.rank === 'number',
    )
  )
}

function formatSpeed(distanceMeters: number, durationSeconds: number) {
  const kilometersPerHour =
    (distanceMeters / 1000) / (durationSeconds / 3600)

  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(kilometersPerHour)} km/h`
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
