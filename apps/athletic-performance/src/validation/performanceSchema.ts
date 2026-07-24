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

export const performanceWizardSchema = z
  .object({
    title: z.string().trim().min(2, 'Nom trop court').max(120, 'Nom trop long'),
    sport: z.enum([
      'running',
      'trail',
      'triathlon',
      'cycling',
      'swimming',
      'strength',
      'hiking',
      'skiing',
      'backcountry-skiing',
      'other',
    ]),
    activityKind: z.enum(['performance', 'adventure', 'solidarity']),
    year: z.coerce
      .number()
      .int()
      .min(2000, 'Annee invalide')
      .max(2100, 'Annee invalide'),
    month: optionalNumber(1, 12, 'Mois invalide'),
    day: optionalNumber(1, 31, 'Jour invalide'),
    distance: z.string().trim().max(40, 'Valeur trop longue').optional(),
    duration: z.string().trim().max(40, 'Valeur trop longue').optional(),
    elevation: z.string().trim().max(40, 'Valeur trop longue').optional(),
    position: z.string().trim().max(80, 'Valeur trop longue').optional(),
    notes: z.string().trim().max(1500, 'Notes trop longues').optional(),
  })
  .refine((values) => !values.day || Boolean(values.month), {
    message: 'Indique le mois avant le jour',
    path: ['month'],
  })

export type PerformanceWizardValues = z.infer<typeof performanceWizardSchema>
