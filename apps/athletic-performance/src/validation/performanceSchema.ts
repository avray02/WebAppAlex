import { z } from 'zod'

const optionalNumber = (minimum: number, maximum: number, message: string) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || typeof value === 'undefined') {
        return undefined
      }

      return value
    },
    z.coerce
      .number()
      .int()
      .min(minimum, message)
      .max(maximum, message)
      .optional(),
  )

const requiredInteger = (
  minimum: number,
  maximum: number,
  message: string,
) =>
  z.preprocess(
    (value) =>
      value === '' || value === null || typeof value === 'undefined'
        ? undefined
        : value,
    z.coerce
      .number({ error: message })
      .int(message)
      .min(minimum, message)
      .max(maximum, message),
  )

export const performanceWizardSchema = z
  .object({
    activityDefinitionId: z.enum([
      'running__competition',
      'running__charity',
    ]),
    sportKey: z.literal('running'),
    activityTypeKey: z.enum(['competition', 'charity']),
    title: z.string().trim().min(2, 'Nom trop court').max(120, 'Nom trop long'),
    startYear: requiredInteger(1900, 2100, 'Annee invalide'),
    startMonth: requiredInteger(1, 12, 'Mois invalide'),
    startDay: requiredInteger(1, 31, 'Jour invalide'),
    multiDay: z.boolean(),
    endYear: optionalNumber(1900, 2100, 'Annee invalide'),
    endMonth: optionalNumber(1, 12, 'Mois invalide'),
    endDay: optionalNumber(1, 31, 'Jour invalide'),
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
    notes: z.string().trim().max(1500, 'Notes trop longues').optional(),
  })
  .superRefine((values, context) => {
    validateDefinition(values, context)
    validateDates(values, context)

    const duration =
      values.durationHours * 3600 +
      values.durationMinutes * 60 +
      values.durationSeconds

    if (values.activityTypeKey === 'competition' && duration === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Le temps est obligatoire pour une competition',
        path: ['durationSeconds'],
      })
    }

    if (
      values.activityTypeKey !== 'competition' ||
      values.resultStatus !== 'ranked'
    ) {
      return
    }

    validateRanking(
      values.overallRank,
      values.overallParticipants,
      'overallRank',
      'overallParticipants',
      context,
    )
    validateRanking(
      values.sexRank,
      values.sexParticipants,
      'sexRank',
      'sexParticipants',
      context,
    )
    validateRanking(
      values.categoryRank,
      values.categoryParticipants,
      'categoryRank',
      'categoryParticipants',
      context,
    )
  })

export type PerformanceWizardValues = z.infer<typeof performanceWizardSchema>

function validateDefinition(
  values: PerformanceWizardValues,
  context: z.RefinementCtx,
) {
  const expectedDefinition =
    values.activityTypeKey === 'competition'
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
) {
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
    return
  }

  if (!values.multiDay) {
    return
  }

  if (!values.endYear || !values.endMonth || !values.endDay) {
    context.addIssue({
      code: 'custom',
      message: 'Indique la date de fin',
      path: ['endDay'],
    })
    return
  }

  const end = toComparableDate(values.endYear, values.endMonth, values.endDay)

  if (!end || end < start) {
    context.addIssue({
      code: 'custom',
      message: 'La fin doit etre posterieure ou egale au debut',
      path: ['endDay'],
    })
  }
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

function validateRanking(
  rank: number | undefined,
  participantCount: number | undefined,
  rankPath: string,
  participantPath: string,
  context: z.RefinementCtx,
) {
  if (typeof participantCount === 'number' && typeof rank !== 'number') {
    context.addIssue({
      code: 'custom',
      message: 'Indique le classement correspondant',
      path: [rankPath],
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
      path: [participantPath],
    })
  }
}
