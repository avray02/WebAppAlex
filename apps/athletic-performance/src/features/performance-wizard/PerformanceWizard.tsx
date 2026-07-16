import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ImagePlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { prepareMediaForUpload } from '../media/mediaPipeline'
import { savePerformance } from '../performances/performanceRepository'
import type { Metric, Performance, SportKey } from '../../types/performance'
import {
  performanceWizardSchema,
  type PerformanceWizardValues,
} from '../../validation/performanceSchema'

const steps = ['Sport', 'Activite', 'Mesures', 'Medias', 'Validation']

const sports: Array<{ key: SportKey; label: string }> = [
  { key: 'running', label: 'Running' },
  { key: 'trail', label: 'Trail' },
  { key: 'triathlon', label: 'Triathlon' },
  { key: 'cycling', label: 'Cyclisme' },
  { key: 'swimming', label: 'Natation' },
  { key: 'strength', label: 'Musculation' },
  { key: 'hiking', label: 'Randonnee' },
  { key: 'skiing', label: 'Ski' },
  { key: 'backcountry-skiing', label: 'Ski rando' },
]

export function PerformanceWizard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [previewUrl, setPreviewUrl] = useState('')
  const ownerUid = user?.uid ?? 'local-demo-user'
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<PerformanceWizardValues>({
    resolver: zodResolver(performanceWizardSchema) as Resolver<PerformanceWizardValues>,
    mode: 'onChange',
    defaultValues: {
      sport: 'running',
      activityKind: 'performance',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      title: '',
      distance: '',
      duration: '',
      elevation: '',
      position: '',
      notes: '',
    },
  })
  const values = watch()
  const activeStep = steps[step]

  const saveMutation = useMutation({
    mutationFn: savePerformance,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['performances', ownerUid] })
      navigate('/')
    },
  })

  const visibleMetrics = useMemo(() => {
    if (values.sport === 'strength') {
      return ['duration']
    }

    if (values.sport === 'swimming') {
      return ['distance', 'duration']
    }

    return ['distance', 'duration', 'elevation']
  }, [values.sport])

  async function next() {
    const fieldsByStep: Array<Array<keyof PerformanceWizardValues>> = [
      ['sport'],
      ['activityKind', 'title', 'year', 'month'],
      ['distance', 'duration', 'elevation', 'position'],
      [],
      [],
    ]
    const isValid = await trigger(fieldsByStep[step])

    if (isValid) {
      setStep((current) => Math.min(current + 1, steps.length - 1))
    }
  }

  async function onMediaChange(file?: File) {
    if (!file) {
      return
    }

    const prepared = await prepareMediaForUpload(file)
    setPreviewUrl(prepared.previewUrl)
  }

  function onSubmit(formValues: PerformanceWizardValues) {
    const now = new Date().toISOString()
    const metrics = buildMetrics(formValues)
    const id = `${formValues.year}-${formValues.month ?? 0}-${formValues.sport}-${crypto.randomUUID()}`
    const performance: Performance = {
      id,
      ownerUid,
      title: formValues.title,
      sport: formValues.sport,
      activityKind: formValues.activityKind,
      status: 'completed',
      date: {
        year: formValues.year,
        month: formValues.month,
      },
      result: formValues.position
        ? {
            positionLabel: formValues.position,
          }
        : undefined,
      metrics,
      media: {
        main: previewUrl
          ? {
              id: `${id}-main`,
              role: 'main',
              url: previewUrl,
            }
          : undefined,
        gallery: [],
      },
      notes: formValues.notes,
      tags: [formValues.sport, formValues.activityKind],
      searchKeywords: [
        formValues.title,
        formValues.sport,
        formValues.activityKind,
        String(formValues.year),
        formValues.notes ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .split(/\s+/),
      source: {
        type: 'manual',
      },
      createdAt: now,
      updatedAt: now,
    }

    saveMutation.mutate(performance)
  }

  return (
    <section className="wizard-page" aria-labelledby="wizard-title">
      <div className="wizard-header">
        <Link className="secondary-button" to="/">
          <ArrowLeft size={17} aria-hidden="true" />
          Dashboard
        </Link>
        <div>
          <p className="eyebrow">Assistant intelligent</p>
          <h1 id="wizard-title">Nouvelle performance</h1>
        </div>
      </div>

      <div className="stepper" aria-label="Progression">
        {steps.map((label, index) => (
          <span key={label} className={index <= step ? 'is-active' : ''}>
            {label}
          </span>
        ))}
      </div>

      <form className="wizard-layout" onSubmit={handleSubmit(onSubmit)}>
        <motion.div
          className="wizard-panel"
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 ? (
            <div className="choice-grid">
              {sports.map((sport) => (
                <button
                  className={
                    values.sport === sport.key ? 'choice-button is-selected' : 'choice-button'
                  }
                  key={sport.key}
                  type="button"
                  onClick={() => setValue('sport', sport.key)}
                >
                  {sport.label}
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="form-grid">
              <label>
                <span>Nom</span>
                <input {...register('title')} />
                {errors.title ? <small>{errors.title.message}</small> : null}
              </label>
              <label>
                <span>Type</span>
                <select {...register('activityKind')}>
                  <option value="performance">Performance</option>
                  <option value="adventure">Aventure</option>
                  <option value="solidarity">Solidaire</option>
                </select>
              </label>
              <label>
                <span>Annee</span>
                <input type="number" {...register('year')} />
                {errors.year ? <small>{errors.year.message}</small> : null}
              </label>
              <label>
                <span>Mois</span>
                <input type="number" min={1} max={12} {...register('month')} />
                {errors.month ? <small>{errors.month.message}</small> : null}
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="form-grid">
              {visibleMetrics.includes('distance') ? (
                <label>
                  <span>Distance</span>
                  <input placeholder="21.1 km" {...register('distance')} />
                </label>
              ) : null}
              {visibleMetrics.includes('duration') ? (
                <label>
                  <span>Temps</span>
                  <input placeholder="1h 19min 25s" {...register('duration')} />
                </label>
              ) : null}
              {visibleMetrics.includes('elevation') ? (
                <label>
                  <span>D+</span>
                  <input placeholder="727 m" {...register('elevation')} />
                </label>
              ) : null}
              <label>
                <span>Classement</span>
                <input placeholder="12e/136" {...register('position')} />
              </label>
              <label className="wide-field">
                <span>Notes</span>
                <textarea rows={5} {...register('notes')} />
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="media-upload">
              <label>
                <ImagePlus size={28} aria-hidden="true" />
                <span>Image principale</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) => onMediaChange(event.target.files?.[0])}
                />
              </label>
              {previewUrl ? <img src={previewUrl} alt="" /> : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="review-panel">
              <h2>{values.title || 'Performance sans titre'}</h2>
              <p>
                {values.sport} / {values.activityKind} / {values.month}/{values.year}
              </p>
              <div className="metric-list">
                {buildMetrics(values).map((metric) => (
                  <div key={metric.key}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>

        <div className="wizard-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Retour
          </button>
          {step < steps.length - 1 ? (
            <button className="primary-button" type="button" onClick={next}>
              Suivant
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : (
            <button
              className="primary-button"
              type="submit"
              disabled={saveMutation.isPending}
            >
              <Check size={17} aria-hidden="true" />
              Enregistrer
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function buildMetrics(values: PerformanceWizardValues): Metric[] {
  const entries: Array<[Metric['key'], string, string | undefined]> = [
    ['distance', 'Distance', values.distance],
    ['duration', 'Temps', values.duration],
    ['elevation', 'D+', values.elevation],
    ['rank', 'Classement', values.position],
  ]

  return entries
    .filter(([, , value]) => Boolean(value))
    .map(([key, label, value]) => ({
      key,
      label,
      value: value ?? '',
    }))
}
