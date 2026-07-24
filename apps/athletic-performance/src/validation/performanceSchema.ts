import { z } from 'zod'
import type { SimplifiedGpxTrack } from '../types/performance'

const blankToUndefined = (value: unknown) =>
  value === '' || value === null || typeof value === 'undefined'
    ? undefined
    : value

const optionalNumber = (minimum: number, maximum: number, message: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number()
      .int()
      .min(minimum, message)
      .max(maximum, message)
      .optional(),
  )

const optionalPositiveNumber = (message: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().positive(message).optional(),
  )

const optionalPositiveInteger = (message: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().int(message).positive(message).optional(),
  )

const optionalNonNegativeInteger = (message: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().int(message).nonnegative(message).optional(),
  )

const requiredInteger = (
  minimum: number,
  maximum: number,
  message: string,
) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: message })
      .int(message)
      .min(minimum, message)
      .max(maximum, message),
  )

const rankingShape = {
  resultStatus: z.enum(['ranked', 'dnf', 'dsq', 'dns']),
  statusComment: z
    .string()
    .trim()
    .max(1000, 'Commentaire trop long')
    .optional(),
  overallRank: optionalNumber(1, 10_000_000, 'Classement invalide'),
  overallParticipants: optionalNumber(
    1,
    10_000_000,
    'Nombre de participants invalide',
  ),
  sexRank: optionalNumber(1, 10_000_000, 'Classement invalide'),
  sexParticipants: optionalNumber(
    1,
    10_000_000,
    'Nombre de participants invalide',
  ),
  categoryRank: optionalNumber(1, 10_000_000, 'Classement invalide'),
  categoryParticipants: optionalNumber(
    1,
    10_000_000,
    'Nombre de participants invalide',
  ),
}

export const performanceStageSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2, 'Nom trop court').max(120, 'Nom trop long'),
  year: requiredInteger(1900, 2100, 'Annee invalide'),
  month: requiredInteger(1, 12, 'Mois invalide'),
  day: requiredInteger(1, 31, 'Jour invalide'),
  distanceValue: z.coerce
    .number({ error: 'Indique une distance' })
    .positive('La distance doit etre superieure a zero')
    .max(1_000_000, 'Distance trop importante'),
  distanceUnit: z.enum(['km', 'm']),
  elevationGainMeters: requiredInteger(
    0,
    100_000,
    'Indique un denivele en metres',
  ),
  durationHours: requiredInteger(0, 9999, 'Heures invalides'),
  durationMinutes: requiredInteger(0, 59, 'Valeur attendue entre 0 et 59'),
  durationSeconds: requiredInteger(0, 59, 'Valeur attendue entre 0 et 59'),
  averagePowerWatts: optionalPositiveInteger(
    'La puissance doit etre un entier positif',
  ),
  ...rankingShape,
  track: z
    .custom<SimplifiedGpxTrack>(isSimplifiedTrack, {
      message: 'Trace GPX invalide',
    })
    .optional(),
})

export const performanceWizardSchema = z
  .object({
    activityDefinitionId: z.enum([
      'running__competition',
      'running__charity',
      'road-cycling__competition',
    ]),
    sportKey: z.enum(['running', 'road-cycling']),
    activityTypeKey: z.enum(['competition', 'charity']),
    eventFormat: z.enum(['single', 'stage-race']),
    title: z.string().trim().min(2, 'Nom trop court').max(120, 'Nom trop long'),
    startYear: requiredInteger(1900, 2100, 'Annee invalide'),
    startMonth: requiredInteger(1, 12, 'Mois invalide'),
    startDay: requiredInteger(1, 31, 'Jour invalide'),
    multiDay: z.boolean(),
    endYear: optionalNumber(1900, 2100, 'Annee invalide'),
    endMonth: optionalNumber(1, 12, 'Mois invalide'),
    endDay: optionalNumber(1, 31, 'Jour invalide'),
    distanceValue: optionalPositiveNumber(
      'La distance doit etre superieure a zero',
    ),
    distanceUnit: z.enum(['km', 'm']),
    elevationGainMeters: optionalNonNegativeInteger(
      'Indique un denivele en metres',
    ),
    durationHours: requiredInteger(0, 9999, 'Heures invalides'),
    durationMinutes: requiredInteger(0, 59, 'Valeur attendue entre 0 et 59'),
    durationSeconds: requiredInteger(0, 59, 'Valeur attendue entre 0 et 59'),
    averagePowerWatts: optionalPositiveInteger(
      'La puissance doit etre un entier positif',
    ),
    ...rankingShape,
    track: z
      .custom<SimplifiedGpxTrack>(isSimplifiedTrack, {
        message: 'Trace GPX invalide',
      })
      .optional(),
    stages: z.array(performanceStageSchema).max(50, 'Maximum 50 etapes'),
    notes: z.string().trim().max(1500, 'Notes trop longues').optional(),
  })
  .superRefine((values, context) => {
    validateDefinition(values, context)
    const range = validateDates(values, context)
    const isStageRace =
      values.sportKey === 'road-cycling' &&
      values.stages.length >= 2

    if (
      values.eventFormat !== (isStageRace ? 'stage-race' : 'single')
    ) {
      context.addIssue({
        code: 'custom',
        message: "Le format ne correspond pas au nombre d'etapes",
        path: ['eventFormat'],
      })
    }

    if (isStageRace) {
      validateStages(values, range, context)
      if (values.track) {
        context.addIssue({
          code: 'custom',
          message: 'Le GPX doit etre associe a une etape',
          path: ['track'],
        })
      }
    } else {
      validateSinglePerformance(values, context)
    }

    if (values.activityTypeKey === 'competition') {
      validateRankings(values, [], context)
    }
  })

export type PerformanceStageValues = z.infer<typeof performanceStageSchema>
export type PerformanceWizardValues = z.infer<typeof performanceWizardSchema>

type DateRangeTimestamps = {
  start: number
  end: number
} | null

function validateDefinition(
  values: PerformanceWizardValues,
  context: z.RefinementCtx,
) {
  const expectedDefinition =
    values.sportKey === 'road-cycling'
      ? 'road-cycling__competition'
      : values.activityTypeKey === 'competition'
        ? 'running__competition'
        : 'running__charity'

  if (values.activityDefinitionId !== expectedDefinition) {
    context.addIssue({
      code: 'custom',
      message: 'Cette combinaison sport et type est invalide',
      path: ['activityTypeKey'],
    })
  }
}

function validateDates(
  values: PerformanceWizardValues,
  context: z.RefinementCtx,
): DateRangeTimestamps {
  const start = toComparableDate(
    values.startYear,
    values.startMonth,
    values.startDay,
  )

  if (!start) {
    context.addIssue({
      code: 'custom',
      message: 'Date de debut invalide',
      path: ['startDay'],
    })
    return null
  }

  if (!values.multiDay) {
    return { start, end: start }
  }

  if (!values.endYear || !values.endMonth || !values.endDay) {
    context.addIssue({
      code: 'custom',
      message: 'Indique la date de fin',
      path: ['endDay'],
    })
    return null
  }

  const end = toComparableDate(values.endYear, values.endMonth, values.endDay)

  if (!end || end < start) {
    context.addIssue({
      code: 'custom',
      message: 'La fin doit etre posterieure ou egale au debut',
      path: ['endDay'],
    })
    return null
  }

  return { start, end }
}

function validateSinglePerformance(
  values: PerformanceWizardValues,
  context: z.RefinementCtx,
) {
  if (typeof values.distanceValue !== 'number') {
    context.addIssue({
      code: 'custom',
      message: 'Indique une distance',
      path: ['distanceValue'],
    })
  }

  if (typeof values.elevationGainMeters !== 'number') {
    context.addIssue({
      code: 'custom',
      message: 'Indique un denivele en metres',
      path: ['elevationGainMeters'],
    })
  }

  const duration = toDurationSeconds(values)

  if (values.activityTypeKey === 'competition' && duration === 0) {
    context.addIssue({
      code: 'custom',
      message: 'Le temps est obligatoire pour une competition',
      path: ['durationSeconds'],
    })
  }

  if (values.stages.length > 0) {
    context.addIssue({
      code: 'custom',
      message: 'Les etapes sont reservees aux courses par etapes',
      path: ['stages'],
    })
  }
}

function validateStages(
  values: PerformanceWizardValues,
  range: DateRangeTimestamps,
  context: z.RefinementCtx,
) {
  if (values.stages.length < 2) {
    context.addIssue({
      code: 'custom',
      message: 'Ajoute au moins deux etapes',
      path: ['stages'],
    })
  }

  values.stages.forEach((stage, index) => {
    const stageDate = toComparableDate(stage.year, stage.month, stage.day)

    if (
      !stageDate ||
      (range && (stageDate < range.start || stageDate > range.end))
    ) {
      context.addIssue({
        code: 'custom',
        message: "La date doit appartenir a la periode de l'epreuve",
        path: ['stages', index, 'day'],
      })
    }

    if (toDurationSeconds(stage) === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Le temps est obligatoire pour une etape',
        path: ['stages', index, 'durationSeconds'],
      })
    }

    validateRankings(stage, ['stages', index], context)
  })
}

function validateRankings(
  values: {
    resultStatus: 'ranked' | 'dnf' | 'dsq' | 'dns'
    overallRank?: number
    overallParticipants?: number
    sexRank?: number
    sexParticipants?: number
    categoryRank?: number
    categoryParticipants?: number
  },
  prefix: Array<string | number>,
  context: z.RefinementCtx,
) {
  if (values.resultStatus !== 'ranked') {
    return
  }

  validateRanking(
    values.overallRank,
    values.overallParticipants,
    [...prefix, 'overallRank'],
    [...prefix, 'overallParticipants'],
    context,
  )
  validateRanking(
    values.sexRank,
    values.sexParticipants,
    [...prefix, 'sexRank'],
    [...prefix, 'sexParticipants'],
    context,
  )
  validateRanking(
    values.categoryRank,
    values.categoryParticipants,
    [...prefix, 'categoryRank'],
    [...prefix, 'categoryParticipants'],
    context,
  )
}

function validateRanking(
  rank: number | undefined,
  participantCount: number | undefined,
  rankPath: Array<string | number>,
  participantPath: Array<string | number>,
  context: z.RefinementCtx,
) {
  if (typeof participantCount === 'number' && typeof rank !== 'number') {
    context.addIssue({
      code: 'custom',
      message: 'Indique le classement correspondant',
      path: rankPath,
    })
  }

  if (
    typeof rank === 'number' &&
    typeof participantCount === 'number' &&
    participantCount < rank
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Le total doit etre superieur ou egal au classement',
      path: participantPath,
    })
  }
}

function toDurationSeconds(values: {
  durationHours: number
  durationMinutes: number
  durationSeconds: number
}) {
  return (
    values.durationHours * 3600 +
    values.durationMinutes * 60 +
    values.durationSeconds
  )
}

function toComparableDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return Date.UTC(year, month - 1, day)
}

function isSimplifiedTrack(value: unknown): value is SimplifiedGpxTrack {
  if (!value || typeof value !== 'object') {
    return false
  }

  const track = value as Partial<SimplifiedGpxTrack>

  return (
    typeof track.fileName === 'string' &&
    track.fileName.length > 0 &&
    track.fileName.length <= 200 &&
    Number.isInteger(track.originalPointCount) &&
    Number(track.originalPointCount) > 0 &&
    Array.isArray(track.points) &&
    track.points.length >= 2 &&
    track.points.length <= 500 &&
    track.points.every(
      (point) =>
        point &&
        typeof point === 'object' &&
        Number.isFinite(point.latitude) &&
        Number(point.latitude) >= -90 &&
        Number(point.latitude) <= 90 &&
        Number.isFinite(point.longitude) &&
        Number(point.longitude) >= -180 &&
        Number(point.longitude) <= 180 &&
        (typeof point.elevationMeters === 'undefined' ||
          Number.isFinite(point.elevationMeters)),
    )
  )
}
