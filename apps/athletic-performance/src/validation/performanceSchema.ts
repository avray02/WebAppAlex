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
  z.coerce
    .number({ error: message })
    .int(message)
    .min(minimum, message)
    .max(maximum, message)

export const performanceWizardSchema = z
  .object({
    activityDefinitionId: z.literal('running__competition'),
    title: z.string().trim().min(2, 'Nom trop court').max(120, 'Nom trop long'),
    year: z.coerce
      .number()
      .int()
      .min(2000, 'Annee invalide')
      .max(2100, 'Annee invalide'),
    month: optionalNumber(1, 12, 'Mois invalide'),
    day: optionalNumber(1, 31, 'Jour invalide'),
    distanceMeters: requiredInteger(
      1,
      1_000_000,
      'Indique une distance en metres',
    ),
    elevationGainMeters: requiredInteger(
      0,
      100_000,
      'Indique un denivele en metres',
    ),
    durationHours: requiredInteger(0, 999, 'Heures invalides'),
    durationMinutes: requiredInteger(0, 59, 'Minutes invalides'),
    durationSeconds: requiredInteger(0, 59, 'Secondes invalides'),
    dnf: z.boolean(),
    dnfComment: z
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
    if (values.day && !values.month) {
      context.addIssue({
        code: 'custom',
        message: 'Indique le mois avant le jour',
        path: ['month'],
      })
    }

    if (
      values.durationHours * 3600 +
        values.durationMinutes * 60 +
        values.durationSeconds ===
      0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Le temps doit etre superieur a zero',
        path: ['durationSeconds'],
      })
    }

    if (values.dnf) {
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
