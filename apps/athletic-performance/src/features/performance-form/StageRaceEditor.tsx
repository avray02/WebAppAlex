import {
  CalendarDays,
  Check,
  FileUp,
  Flag,
  Gauge,
  ListOrdered,
  Medal,
  Mountain,
  Plus,
  Route,
  Timer,
  Trash2,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  useWatch,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFormReturn,
} from 'react-hook-form'
import type {
  RankingKey,
  ResultStatus,
} from '../../types/performance'
import type {
  PerformanceStageValues,
  PerformanceWizardValues,
} from '../../validation/performanceSchema'
import {
  resultStatusLabels,
} from '../performances/performanceCatalog'
import {
  formatDistance,
  formatDuration,
  getMedalForRank,
} from '../performances/performanceMetrics'
import { GpxTrackPreview } from './GpxTrackPreview'
import { parseGpxFile } from './gpxTrack'
import { calculateStageTotals } from './stageRaceTotals'

type StageRaceEditorProps = {
  form: UseFormReturn<PerformanceWizardValues>
  fields: FieldArrayWithId<
    PerformanceWizardValues,
    'stages',
    'formKey'
  >[]
  append: UseFieldArrayAppend<PerformanceWizardValues, 'stages'>
  remove: UseFieldArrayRemove
  createStage: () => PerformanceStageValues
}

const resultStatuses: ResultStatus[] = ['ranked', 'dnf', 'dsq', 'dns']
const rankingGroups: Array<{
  key: RankingKey
  label: string
  rankField: 'overallRank' | 'sexRank' | 'categoryRank'
  participantField:
    | 'overallParticipants'
    | 'sexParticipants'
    | 'categoryParticipants'
}> = [
  {
    key: 'overall',
    label: 'Classement general',
    rankField: 'overallRank',
    participantField: 'overallParticipants',
  },
  {
    key: 'sex',
    label: 'Classement par sexe',
    rankField: 'sexRank',
    participantField: 'sexParticipants',
  },
  {
    key: 'category',
    label: 'Classement par categorie',
    rankField: 'categoryRank',
    participantField: 'categoryParticipants',
  },
]

export function StageRaceEditor({
  form,
  fields,
  append,
  remove,
  createStage,
}: StageRaceEditorProps) {
  const stages = useWatch({ control: form.control, name: 'stages' })
  const [activePanel, setActivePanel] = useState<string>('general')
  const totals = useMemo(() => calculateStageTotals(stages), [stages])

  useEffect(() => {
    if (
      activePanel !== 'general' &&
      !fields.some((field) => field.id === activePanel)
    ) {
      setActivePanel(fields[0]?.id ?? 'general')
    }
  }, [activePanel, fields])

  function addStage() {
    const stage = createStage()
    append(stage)
    setActivePanel(stage.id)
  }

  function deleteStage(index: number) {
    remove(index)
    setActivePanel('general')
  }

  const activeIndex = fields.findIndex(
    (field) => field.id === activePanel,
  )

  return (
    <section className="form-section stage-race-section" aria-labelledby="stage-race-title">
      <div className="section-heading">
        <span className="section-number">03</span>
        <div>
          <h2 id="stage-race-title">Etapes et general</h2>
          <p>Chaque volet conserve ses propres resultats et classements.</p>
        </div>
      </div>

      <div className="stage-tabs" role="tablist" aria-label="Etapes de la course">
        {fields.map((field, index) => (
          <button
            className={activePanel === field.id ? 'is-active' : ''}
            key={field.formKey}
            type="button"
            role="tab"
            aria-selected={activePanel === field.id}
            onClick={() => setActivePanel(field.id)}
          >
            Etape {index + 1}
          </button>
        ))}
        <button
          className={activePanel === 'general' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={activePanel === 'general'}
          onClick={() => setActivePanel('general')}
        >
          General
        </button>
        <button
          className="stage-add-button"
          type="button"
          title="Ajouter une etape"
          aria-label="Ajouter une etape"
          disabled={fields.length >= 50}
          onClick={addStage}
        >
          <Plus size={17} aria-hidden="true" />
        </button>
      </div>

      {activeIndex >= 0 ? (
        <StagePanel
          key={fields[activeIndex].formKey}
          form={form}
          index={activeIndex}
          canDelete={fields.length > 2}
          onDelete={() => deleteStage(activeIndex)}
        />
      ) : (
        <GeneralPanel form={form} totals={totals} />
      )}

      {form.formState.errors.stages?.root?.message ? (
        <p className="form-error" role="alert">
          {form.formState.errors.stages.root.message}
        </p>
      ) : null}
      {typeof form.formState.errors.stages?.message === 'string' ? (
        <p className="form-error" role="alert">
          {form.formState.errors.stages.message}
        </p>
      ) : null}
    </section>
  )
}

function StagePanel({
  form,
  index,
  canDelete,
  onDelete,
}: {
  form: UseFormReturn<PerformanceWizardValues>
  index: number
  canDelete: boolean
  onDelete: () => void
}) {
  const [gpxError, setGpxError] = useState('')
  const stage = useWatch({
    control: form.control,
    name: `stages.${index}`,
  })
  const errors = form.formState.errors.stages?.[index]
  const dayCount = daysInMonth(stage.year, stage.month)
  const path = <Key extends keyof PerformanceStageValues>(key: Key) =>
    `stages.${index}.${key}` as const

  useEffect(() => {
    if (stage.day > dayCount) {
      form.setValue(`stages.${index}.day`, dayCount)
      form.clearErrors(`stages.${index}.day`)
    }
  }, [dayCount, form, index, stage.day])

  async function loadGpx(file?: File) {
    if (!file) {
      return
    }

    setGpxError('')

    try {
      form.setValue(path('track'), await parseGpxFile(file), {
        shouldDirty: true,
        shouldValidate: true,
      })
    } catch (error) {
      setGpxError(
        error instanceof Error ? error.message : 'Lecture du GPX impossible',
      )
    }
  }

  return (
    <div className="stage-panel" role="tabpanel">
      <header className="stage-panel-heading">
        <div>
          <span className="field-group-label">Etape {index + 1}</span>
          <strong>{stage.title || 'Nouvelle etape'}</strong>
        </div>
        <button
          className="danger-button"
          type="button"
          disabled={!canDelete}
          title={
            canDelete
              ? "Supprimer l'etape"
              : 'Une course doit conserver au moins deux etapes'
          }
          onClick={onDelete}
        >
          <Trash2 size={16} aria-hidden="true" />
          Supprimer
        </button>
      </header>

      <div className="stage-block">
        <h3>Identification</h3>
        <div className="form-grid">
          <label className="wide-field">
            <span>Nom de l'etape</span>
            <input
              placeholder={`Ex. Etape ${index + 1} - Col du Galibier`}
              {...form.register(path('title'))}
            />
            {errors?.title ? <small>{errors.title.message}</small> : null}
          </label>

          <fieldset className="date-selector wide-field">
            <legend>
              <CalendarDays size={16} aria-hidden="true" />
              Date de l'etape
            </legend>
            <div>
              <label>
                <span>Annee</span>
                <select {...form.register(path('year'))}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Mois</span>
                <select {...form.register(path('month'))}>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Jour</span>
                <select {...form.register(path('day'))}>
                  {Array.from({ length: dayCount }, (_, day) => day + 1).map(
                    (day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ),
                  )}
                </select>
                {errors?.day ? <small>{errors.day.message}</small> : null}
              </label>
            </div>
          </fieldset>
        </div>
      </div>

      <div className="stage-block">
        <h3>Description</h3>
        <div className="form-grid metric-fields">
          <label>
            <span>
              <Route size={16} aria-hidden="true" />
              Distance
            </span>
            <span className="measurement-input">
              <input
                type="number"
                min="0"
                step={stage.distanceUnit === 'km' ? '0.01' : '1'}
                placeholder={stage.distanceUnit === 'km' ? '120' : '120000'}
                {...form.register(path('distanceValue'))}
              />
              <select
                aria-label={`Unite de distance de l'etape ${index + 1}`}
                {...form.register(path('distanceUnit'))}
              >
                <option value="km">km</option>
                <option value="m">m</option>
              </select>
            </span>
            {errors?.distanceValue ? (
              <small>{errors.distanceValue.message}</small>
            ) : null}
          </label>
          <label>
            <span>
              <Mountain size={16} aria-hidden="true" />
              Denivele positif (m)
            </span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="1800"
              {...form.register(path('elevationGainMeters'))}
            />
            {errors?.elevationGainMeters ? (
              <small>{errors.elevationGainMeters.message}</small>
            ) : null}
          </label>
        </div>
      </div>

      <div className="stage-block">
        <h3>Resultats</h3>
        <StageDurationFields form={form} index={index} errors={errors} />
        <div className="form-grid metric-fields stage-power-field">
          <label>
            <span>
              <Zap size={16} aria-hidden="true" />
              Puissance moyenne (W)
            </span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="245"
              {...form.register(path('averagePowerWatts'))}
            />
            {errors?.averagePowerWatts ? (
              <small>{errors.averagePowerWatts.message}</small>
            ) : null}
          </label>
        </div>
        <StageRankingFields form={form} index={index} errors={errors} />
      </div>

      <div className="stage-block">
        <h3>Trace GPX</h3>
        <label className="gpx-upload">
          <FileUp size={20} aria-hidden="true" />
          <span>
            <strong>Charger un fichier GPX</strong>
            <small>Le trace sera simplifie avant enregistrement.</small>
          </span>
          <input
            type="file"
            accept=".gpx,application/gpx+xml"
            onChange={(event) => {
              void loadGpx(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
        {gpxError ? (
          <p className="form-error" role="alert">
            {gpxError}
          </p>
        ) : null}
        {errors?.track ? (
          <p className="form-error" role="alert">
            {errors.track.message}
          </p>
        ) : null}
        {stage.track ? (
          <GpxTrackPreview
            track={stage.track}
            onRemove={() =>
              form.setValue(path('track'), undefined, {
                shouldDirty: true,
              })
            }
          />
        ) : null}
      </div>
    </div>
  )
}

function StageDurationFields({
  form,
  index,
  errors,
}: {
  form: UseFormReturn<PerformanceWizardValues>
  index: number
  errors:
    | NonNullable<
        UseFormReturn<PerformanceWizardValues>['formState']['errors']['stages']
      >[number]
    | undefined
}) {
  const path = <
    Key extends 'durationHours' | 'durationMinutes' | 'durationSeconds',
  >(
    key: Key,
  ) => `stages.${index}.${key}` as const

  return (
    <fieldset className="duration-field">
      <legend>
        <Timer size={16} aria-hidden="true" />
        Temps
      </legend>
      <div className="duration-inputs">
        <label>
          <span>Heures</span>
          <input type="number" min="0" {...form.register(path('durationHours'))} />
          {errors?.durationHours ? (
            <small>{errors.durationHours.message}</small>
          ) : null}
        </label>
        <label>
          <span>Minutes</span>
          <input
            type="number"
            min="0"
            max="59"
            {...form.register(path('durationMinutes'))}
          />
          {errors?.durationMinutes ? (
            <small>{errors.durationMinutes.message}</small>
          ) : null}
        </label>
        <label>
          <span>Secondes</span>
          <input
            type="number"
            min="0"
            max="59"
            {...form.register(path('durationSeconds'))}
          />
          {errors?.durationSeconds ? (
            <small>{errors.durationSeconds.message}</small>
          ) : null}
        </label>
      </div>
    </fieldset>
  )
}

function StageRankingFields({
  form,
  index,
  errors,
}: {
  form: UseFormReturn<PerformanceWizardValues>
  index: number
  errors:
    | NonNullable<
        UseFormReturn<PerformanceWizardValues>['formState']['errors']['stages']
      >[number]
    | undefined
}) {
  const stage = useWatch({
    control: form.control,
    name: `stages.${index}`,
  })
  const path = <Key extends keyof PerformanceStageValues>(key: Key) =>
    `stages.${index}.${key}` as const

  return (
    <div className="stage-rankings">
      <div>
        <span className="field-group-label">Statut du resultat</span>
        <div className="result-status-row" role="group" aria-label={`Statut de l'etape ${index + 1}`}>
          {resultStatuses.map((status) => (
            <button
              className={stage.resultStatus === status ? 'is-selected' : ''}
              key={status}
              type="button"
              aria-pressed={stage.resultStatus === status}
              onClick={() =>
                form.setValue(path('resultStatus'), status, {
                  shouldDirty: true,
                })
              }
            >
              {resultStatusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {stage.resultStatus === 'ranked' ? (
        <div className="ranking-grid">
          {rankingGroups.map((group) => {
            const medal = getMedalForRank(stage[group.rankField])

            return (
              <fieldset className="ranking-group" key={group.key}>
                <legend>
                  <Trophy size={16} aria-hidden="true" />
                  {group.label}
                  {medal ? (
                    <span className={`medal-badge medal-${medal}`}>
                      <Medal size={15} aria-hidden="true" />
                    </span>
                  ) : null}
                </legend>
                <label>
                  <span>
                    <Flag size={15} aria-hidden="true" />
                    Classement
                  </span>
                  <input
                    type="number"
                    min="1"
                    {...form.register(path(group.rankField))}
                  />
                  {errors?.[group.rankField] ? (
                    <small>{errors[group.rankField]?.message}</small>
                  ) : null}
                </label>
                <label>
                  <span>
                    <Users size={15} aria-hidden="true" />
                    Participants
                  </span>
                  <input
                    type="number"
                    min="1"
                    {...form.register(path(group.participantField))}
                  />
                  {errors?.[group.participantField] ? (
                    <small>{errors[group.participantField]?.message}</small>
                  ) : null}
                </label>
              </fieldset>
            )
          })}
        </div>
      ) : (
        <label className="status-comment">
          <span>Commentaire {resultStatusLabels[stage.resultStatus]}</span>
          <textarea
            rows={4}
            placeholder="Contexte ou raison..."
            {...form.register(path('statusComment'))}
          />
        </label>
      )}
    </div>
  )
}

function GeneralPanel({
  form,
  totals,
}: {
  form: UseFormReturn<PerformanceWizardValues>
  totals: ReturnType<typeof calculateStageTotals>
}) {
  const status = useWatch({ control: form.control, name: 'resultStatus' })
  const values = useWatch({ control: form.control })

  return (
    <div className="stage-panel general-panel" role="tabpanel">
      <div className="general-summary" aria-label="Totaux calcules">
        <SummaryMetric icon={Route} label="Distance" value={formatDistance(totals.distanceMeters)} />
        <SummaryMetric icon={Mountain} label="Denivele positif" value={`${totals.elevationGainMeters} m`} />
        <SummaryMetric icon={Timer} label="Temps general" value={formatDuration(totals.durationSeconds)} />
        <SummaryMetric icon={Gauge} label="Vitesse moyenne" value={totals.speedKmh ? `${totals.speedKmh.toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km/h` : '-'} />
        <SummaryMetric icon={Zap} label="Puissance moyenne" value={totals.averagePowerWatts ? `${totals.averagePowerWatts} W` : '-'} />
        <SummaryMetric icon={ListOrdered} label="Etapes" value={String(totals.stageCount)} />
      </div>

      <div>
        <span className="field-group-label">Statut general</span>
        <div className="result-status-row" role="group" aria-label="Statut general">
          {resultStatuses.map((resultStatus) => (
            <button
              className={status === resultStatus ? 'is-selected' : ''}
              key={resultStatus}
              type="button"
              aria-pressed={status === resultStatus}
              onClick={() =>
                form.setValue('resultStatus', resultStatus, {
                  shouldDirty: true,
                })
              }
            >
              {resultStatusLabels[resultStatus]}
            </button>
          ))}
        </div>
      </div>

      {status === 'ranked' ? (
        <div className="ranking-grid">
          {rankingGroups.map((group) => {
            const rank = values[group.rankField]
            const medal = getMedalForRank(
              typeof rank === 'number' ? rank : undefined,
            )

            return (
              <fieldset className="ranking-group" key={group.key}>
                <legend>
                  <Trophy size={16} aria-hidden="true" />
                  {group.label}
                  {medal ? (
                    <span className={`medal-badge medal-${medal}`}>
                      <Medal size={15} aria-hidden="true" />
                    </span>
                  ) : null}
                </legend>
                <label>
                  <span>
                    <Flag size={15} aria-hidden="true" />
                    Classement
                  </span>
                  <input type="number" min="1" {...form.register(group.rankField)} />
                </label>
                <label>
                  <span>
                    <Users size={15} aria-hidden="true" />
                    Participants
                  </span>
                  <input type="number" min="1" {...form.register(group.participantField)} />
                </label>
              </fieldset>
            )
          })}
        </div>
      ) : (
        <label className="status-comment">
          <span>Commentaire {resultStatusLabels[status]}</span>
          <textarea
            rows={4}
            placeholder="Contexte ou raison..."
            {...form.register('statusComment')}
          />
        </label>
      )}

      <p className="calculated-result">
        <Check size={16} aria-hidden="true" />
        Le temps general est calcule depuis les etapes.
      </p>
    </div>
  )
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route
  label: string
  value: string
}) {
  return (
    <span>
      <Icon size={17} aria-hidden="true" />
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  )
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
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
].map((label, index) => ({ value: index + 1, label }))

const yearOptions = Array.from(
  { length: new Date().getFullYear() + 10 - 1950 + 1 },
  (_, index) => new Date().getFullYear() + 10 - index,
)
