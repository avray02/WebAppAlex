import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@dailyme/auth'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Flag,
  Gauge,
  Mountain,
  Route,
  Save,
  Timer,
} from 'lucide-react'
import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import {
  activityOptions,
  sportOptions,
} from '../performances/performanceCatalog'
import { savePerformance } from '../performances/performanceRepository'
import type { Metric, Performance } from '../../types/performance'
import {
  performanceWizardSchema,
  type PerformanceWizardValues,
} from '../../validation/performanceSchema'

type PerformanceFormProps = {
  performance?: Performance
}

export function PerformanceForm({ performance }: PerformanceFormProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ownerUid = user?.uid ?? 'local-demo-user'
  const isEditing = Boolean(performance)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PerformanceWizardValues>({
    resolver: zodResolver(
      performanceWizardSchema,
    ) as Resolver<PerformanceWizardValues>,
    mode: 'onBlur',
    defaultValues: getDefaultValues(performance),
  })
  const selectedSport = watch('sport')
  const selectedActivity = watch('activityKind')

  useEffect(() => {
    reset(getDefaultValues(performance))
  }, [performance, reset])

  const saveMutation = useMutation({
    mutationFn: savePerformance,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['performances', ownerUid],
      })
      navigate('/', {
        replace: true,
        state: {
          notice: isEditing
            ? 'Performance mise a jour.'
            : 'Performance ajoutee.',
        },
      })
    },
  })

  function onSubmit(values: PerformanceWizardValues) {
    saveMutation.mutate(
      buildPerformance({
        values,
        ownerUid,
        existing: performance,
      }),
    )
  }

  return (
    <section className="form-page" aria-labelledby="performance-form-title">
      <header className="page-heading form-page-heading">
        <div>
          <Link className="back-link" to="/">
            <ArrowLeft size={17} aria-hidden="true" />
            Performances
          </Link>
          <p className="eyebrow">
            {isEditing ? 'Modifier une activite' : 'Nouvelle activite'}
          </p>
          <h1 id="performance-form-title">
            {isEditing ? performance?.title : 'Ajouter une performance'}
          </h1>
        </div>
        <p>
          Renseigne les informations utiles pour retrouver et comparer
          facilement cette activite.
        </p>
      </header>

      <form className="performance-form" onSubmit={handleSubmit(onSubmit)}>
        <section className="form-section" aria-labelledby="sport-section-title">
          <div className="section-heading">
            <span className="section-number">01</span>
            <div>
              <h2 id="sport-section-title">Discipline</h2>
              <p>Selectionne le sport et la nature de l'activite.</p>
            </div>
          </div>

          <div className="sport-choice-grid" role="group" aria-label="Sport">
            {sportOptions.map((sport) => {
              const Icon = sport.icon

              return (
                <button
                  className={
                    selectedSport === sport.key
                      ? 'sport-choice is-selected'
                      : 'sport-choice'
                  }
                  key={sport.key}
                  type="button"
                  aria-pressed={selectedSport === sport.key}
                  onClick={() =>
                    setValue('sport', sport.key, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{sport.label}</span>
                </button>
              )
            })}
          </div>

          <div
            className="segmented-control"
            role="group"
            aria-label="Type d'activite"
          >
            {activityOptions.map((activity) => (
              <button
                className={
                  selectedActivity === activity.key ? 'is-selected' : ''
                }
                key={activity.key}
                type="button"
                aria-pressed={selectedActivity === activity.key}
                onClick={() =>
                  setValue('activityKind', activity.key, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                {activity.label}
              </button>
            ))}
          </div>
        </section>

        <section className="form-section" aria-labelledby="identity-section-title">
          <div className="section-heading">
            <span className="section-number">02</span>
            <div>
              <h2 id="identity-section-title">Identification</h2>
              <p>Ajoute un nom clair et la date de realisation.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="wide-field">
              <span>Nom de l'activite</span>
              <input
                autoFocus
                placeholder="Ex. Semi-marathon de Lyon"
                {...register('title')}
              />
              {errors.title ? <small>{errors.title.message}</small> : null}
            </label>

            <label>
              <span>
                <CalendarDays size={16} aria-hidden="true" />
                Annee
              </span>
              <input type="number" min="2000" max="2100" {...register('year')} />
              {errors.year ? <small>{errors.year.message}</small> : null}
            </label>

            <label>
              <span>Mois</span>
              <select {...register('month')}>
                <option value="">Non precise</option>
                {monthOptions.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              {errors.month ? <small>{errors.month.message}</small> : null}
            </label>

            <label>
              <span>Jour</span>
              <input type="number" min="1" max="31" {...register('day')} />
              {errors.day ? <small>{errors.day.message}</small> : null}
            </label>
          </div>
        </section>

        <section className="form-section" aria-labelledby="result-section-title">
          <div className="section-heading">
            <span className="section-number">03</span>
            <div>
              <h2 id="result-section-title">Resultats</h2>
              <p>Les valeurs renseignees seront visibles sur la carte.</p>
            </div>
          </div>

          <div className="form-grid metric-fields">
            <label>
              <span>
                <Route size={16} aria-hidden="true" />
                Distance
              </span>
              <input placeholder="21,1 km" {...register('distance')} />
              {errors.distance ? (
                <small>{errors.distance.message}</small>
              ) : null}
            </label>

            <label>
              <span>
                <Timer size={16} aria-hidden="true" />
                Temps
              </span>
              <input placeholder="1 h 32 min 18 s" {...register('duration')} />
              {errors.duration ? (
                <small>{errors.duration.message}</small>
              ) : null}
            </label>

            <label>
              <span>
                <Mountain size={16} aria-hidden="true" />
                Denivele positif
              </span>
              <input placeholder="727 m" {...register('elevation')} />
              {errors.elevation ? (
                <small>{errors.elevation.message}</small>
              ) : null}
            </label>

            <label>
              <span>
                <Flag size={16} aria-hidden="true" />
                Classement
              </span>
              <input placeholder="12e / 136" {...register('position')} />
              {errors.position ? (
                <small>{errors.position.message}</small>
              ) : null}
            </label>

            <label className="wide-field">
              <span>
                <Gauge size={16} aria-hidden="true" />
                Notes
              </span>
              <textarea
                rows={5}
                placeholder="Contexte, sensations, conditions..."
                {...register('notes')}
              />
              {errors.notes ? <small>{errors.notes.message}</small> : null}
            </label>
          </div>
        </section>

        {saveMutation.isError ? (
          <p className="form-error" role="alert">
            L'enregistrement a echoue. Verifie ta connexion puis reessaie.
          </p>
        ) : null}

        <footer className="form-actions">
          <Link className="secondary-button" to="/">
            Annuler
          </Link>
          <button
            className="primary-button"
            type="submit"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Check size={17} aria-hidden="true" />
            ) : isEditing ? (
              <Save size={17} aria-hidden="true" />
            ) : (
              <Check size={17} aria-hidden="true" />
            )}
            {saveMutation.isPending
              ? 'Enregistrement...'
              : isEditing
                ? 'Enregistrer'
                : 'Ajouter la performance'}
          </button>
        </footer>
      </form>
    </section>
  )
}

function getDefaultValues(
  performance?: Performance,
): PerformanceWizardValues {
  return {
    sport: performance?.sport ?? 'running',
    activityKind: performance?.activityKind ?? 'performance',
    title: performance?.title ?? '',
    year: performance?.date.year ?? new Date().getFullYear(),
    month: performance?.date.month,
    day: performance?.date.day,
    distance: findMetric(performance, 'distance'),
    duration: findMetric(performance, 'duration'),
    elevation: findMetric(performance, 'elevation'),
    position:
      performance?.result?.positionLabel ??
      findMetric(performance, 'rank'),
    notes: performance?.notes ?? '',
  }
}

function buildPerformance({
  values,
  ownerUid,
  existing,
}: {
  values: PerformanceWizardValues
  ownerUid: string
  existing?: Performance
}): Performance {
  const now = new Date().toISOString()
  const position = clean(values.position)
  const notes = clean(values.notes)
  const metrics = buildMetrics(values)
  const performance: Performance = {
    id: existing?.id ?? crypto.randomUUID(),
    ownerUid,
    title: values.title.trim(),
    sport: values.sport,
    activityKind: values.activityKind,
    status: 'completed',
    date: {
      year: values.year,
      ...(values.month ? { month: values.month } : {}),
      ...(values.day ? { day: values.day } : {}),
    },
    ...(position ? { result: { positionLabel: position } } : {}),
    metrics,
    ...(existing?.segments?.length ? { segments: existing.segments } : {}),
    ...(notes ? { notes } : {}),
    tags: [values.sport, values.activityKind],
    searchKeywords: [
      values.title,
      values.sport,
      values.activityKind,
      String(values.year),
      clean(values.distance),
      clean(values.duration),
      clean(values.elevation),
      position,
      notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .split(/\s+/),
    source: { type: 'manual' },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  return performance
}

function buildMetrics(values: PerformanceWizardValues): Metric[] {
  const entries: Array<[Metric['key'], string, string | undefined]> = [
    ['distance', 'Distance', clean(values.distance)],
    ['duration', 'Temps', clean(values.duration)],
    ['elevation', 'D+', clean(values.elevation)],
    ['rank', 'Classement', clean(values.position)],
  ]

  return entries
    .filter((entry): entry is [Metric['key'], string, string] =>
      Boolean(entry[2]),
    )
    .map(([key, label, value]) => ({ key, label, value }))
}

function findMetric(
  performance: Performance | undefined,
  key: Metric['key'],
) {
  return performance?.metrics.find((metric) => metric.key === key)?.value ?? ''
}

function clean(value?: string) {
  const cleaned = value?.trim()
  return cleaned || undefined
}

const monthOptions = [
  'Janvier',
  'Fevrier',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Decembre',
]
