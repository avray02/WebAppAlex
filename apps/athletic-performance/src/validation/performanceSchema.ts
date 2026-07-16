import { z } from 'zod'

export const performanceWizardSchema = z.object({
  title: z.string().min(2, 'Nom trop court'),
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
  month: z.coerce.number().int().min(1).max(12).optional(),
  distance: z.string().optional(),
  duration: z.string().optional(),
  elevation: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
})

export type PerformanceWizardValues = z.infer<typeof performanceWizardSchema>
