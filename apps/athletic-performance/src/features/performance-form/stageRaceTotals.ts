import type { PerformanceStageValues } from '../../validation/performanceSchema'

export function calculateStageTotals(stages: PerformanceStageValues[]) {
  const normalized = stages.map((stage) => {
    const distanceValue = Number(stage.distanceValue) || 0
    const distanceMeters = Math.round(
      stage.distanceUnit === 'km' ? distanceValue * 1000 : distanceValue,
    )
    const durationSeconds =
      (Number(stage.durationHours) || 0) * 3600 +
      (Number(stage.durationMinutes) || 0) * 60 +
      (Number(stage.durationSeconds) || 0)

    return {
      distanceMeters,
      elevationGainMeters: Number(stage.elevationGainMeters) || 0,
      durationSeconds,
      averagePowerWatts: Number(stage.averagePowerWatts) || undefined,
    }
  })
  const distanceMeters = normalized.reduce(
    (total, stage) => total + stage.distanceMeters,
    0,
  )
  const elevationGainMeters = normalized.reduce(
    (total, stage) => total + stage.elevationGainMeters,
    0,
  )
  const durationSeconds = normalized.reduce(
    (total, stage) => total + stage.durationSeconds,
    0,
  )
  const allPowerValuesPresent =
    normalized.length > 0 &&
    normalized.every(
      (stage) =>
        typeof stage.averagePowerWatts === 'number' &&
        stage.durationSeconds > 0,
    )
  const averagePowerWatts =
    allPowerValuesPresent && durationSeconds > 0
      ? Math.round(
          normalized.reduce(
            (total, stage) =>
              total +
              Number(stage.averagePowerWatts) * stage.durationSeconds,
            0,
          ) / durationSeconds,
        )
      : undefined

  return {
    stageCount: stages.length,
    distanceMeters,
    elevationGainMeters,
    durationSeconds,
    averagePowerWatts,
    speedKmh:
      durationSeconds > 0
        ? (distanceMeters / 1000) / (durationSeconds / 3600)
        : undefined,
  }
}
