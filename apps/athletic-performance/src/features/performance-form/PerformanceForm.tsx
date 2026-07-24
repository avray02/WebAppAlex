import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@dailyme/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Flag,
  Medal,
  Mountain,
  Route,
  Save,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import type {
  ActivityDefinition,
  Performance,
  RankingKey,
  RankingResult,
  ResultStatus,
  RunningCharityData,
  RunningCompetitionData,
  SportKey,
} from '../../types/performance'
import {
  performanceWizardSchema,
  type PerformanceWizardValues,
} from '../../validation/performanceSchema'
import { listActivityDefinitions } from '../performances/activityDefinitionRepository'
import {
  activityDefinitions,
  isRunningCharityData,
  isRunningCompetitionData,
  resultSentinels,
  resultStatusLabels,
  sportByKey,
} from '../performances/performanceCatalog'
import { getMedalForRank } from '../performances/performanceMetrics'
import { savePerformance } from '../performances/performanceRepository'

type PerformanceFormProps = {
  performance?: Performance
}

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

const resultStatuses: ResultStatus[] = ['ranked', 'dnf', 'dsq', 'dns']

export function PerformanceForm({ performance }: PerformanceFormProps) {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ownerUid = user?.uid ?? 'local-demo-user'
  const isEditing = Boolean(performance)
  const definitionsQuery = useQuery({
    queryKey: ['activity-definitions'],
    queryFn: () => listActivityDefinitions(isAdmin),
  })
  const definitions = definitionsQuery.data ?? activityDefinitions
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<PerformanceWizardValues>({
    resolver: zodResolver(
      performanceWizardSchema,
    ) as Resolver<PerformanceWizardValues>,
    mode: 'onBlur',
    defaultValues: getDefaultValues(performance),
  })
  const selectedSport = watch('sportKey')
  const selectedType = watch('activityTypeKey')
  const resultStatus = watch('resultStatus')
  const multiDay = watch('multiDay')
  const distanceUnit = watch('distanceUnit')
  const startYear = watch('startYear')
  const startMonth = watch('startMonth')
  const startDay = watch('startDay')
  const endYear = watch('endYear')
  const endMonth = watch('endMonth')
  const endDay = watch('endDay')
  const availableSports = useMemo(
    () =>
      Array.from(new Set(definitions.map((definition) => definition.sportKey)))
        .map((sportKey) => sportByKey[sportKey])
        .filter(Boolean),
    [definitions],
  )
  const availableTypes = useMemo(
    () =>
      definitions.filter(
        (definition) => definition.sportKey === selectedSport,
      ),
    [definitions, selectedSport],
  )
  const selectedDefinition = definitions.find(
    (definition) =>
      definition.sportKey === selectedSport &&
      definition.activityTypeKey === selectedType,
  )

  useEffect(() => {
    reset(getDefaultValues(performance))
  }, [performance, reset])

  useEffect(() => {
    clampDay(startYear, startMonth, startDay, (day) => {
      setValue('startDay', day)
      clearErrors('startDay')
    })
  }, [clearErrors, setValue, startDay, startMonth, startYear])

  useEffect(() => {
    if (!multiDay || !endYear || !endMonth || !endDay) {
      return
    }

    clampDay(endYear, endMonth, endDay, (day) => {
      setValue('endDay', day)
      clearErrors('endDay')
    })
  }, [clearErrors, endDay, endMonth, endYear, multiDay, setValue])

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

  function selectSport(sportKey: SportKey) {
    if (sportKey !== 'running') {
      return
    }

    const firstDefinition = definitions.find(
      (definition) => definition.sportKey === sportKey,
    )

    if (!firstDefinition || firstDefinition.activityTypeKey === 'adventure') {
      return
    }

    setValue('sportKey', sportKey, { shouldDirty: true })
    selectType(firstDefinition)
  }

  function selectType(definition: ActivityDefinition) {
    if (
      definition.activityTypeKey !== 'competition' &&
      definition.activityTypeKey !== 'charity'
    ) {
      return
    }

    setValue('activityTypeKey', definition.activityTypeKey, {
      shouldDirty: true,
    })
    setValue('activityDefinitionId', definition.id, {
      shouldDirty: true,
    })
    clearErrors([
      'activityTypeKey',
      'activityDefinitionId',
      'durationHours',
      'durationMinutes',
      'durationSeconds',
      'resultStatus',
      'statusComment',
      'overallRank',
      'overallParticipants',
      'sexRank',
      'sexParticipants',
      'categoryRank',
      'categoryParticipants',
    ])
  }

  function setMultiDay(enabled: boolean) {
    setValue('multiDay', enabled, {
      shouldDirty: true,
    })
    clearErrors(['endYear', 'endMonth', 'endDay'])

    if (!enabled) {
      setValue('endYear', undefined)
      setValue('endMonth', undefined)
      setValue('endDay', undefined)
      return
    }

    setValue('endYear', startYear)
    setValue('endMonth', startMonth)
    setValue('endDay', startDay)
  }

  function onSubmit(values: PerformanceWizardValues) {
    saveMutation.mutate(
      buildPerformance({
        values,
        ownerUid,
        existing: performance,
        definition: selectedDefinition,
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
          Choisis d'abord le sport puis le type d'activite correspondant.
        </p>
      </header>

      <form className="performance-form" onSubmit={handleSubmit(onSubmit)}>
        <section className="form-section" aria-labelledby="sport-section-title">
          <div className="section-heading">
            <span className="section-number">01</span>
            <div>
              <h2 id="sport-section-title">Activite</h2>
              <p>Les types proposes dependent du sport selectionne.</p>
            </div>
          </div>

          <div className="activity-selection">
            <div>
              <span className="field-group-label">Sport</span>
              <div
                className="selection-grid"
                role="group"
                aria-label="Sport"
              >
                {availableSports.map((sport) => {
                  const Icon = sport.icon

                  return (
                    <button
                      className={
                        selectedSport === sport.key
                          ? 'selection-choice is-selected'
                          : 'selection-choice'
                      }
                      key={sport.key}
                      type="button"
                      aria-pressed={selectedSport === sport.key}
                      onClick={() => selectSport(sport.key)}
                    >
                      <Icon size={19} aria-hidden="true" />
                      <strong>{sport.label}</strong>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="field-group-label">Type d'activite</span>
              <div
                className="type-choice-row"
                role="group"
                aria-label="Type d'activite"
              >
                {availableTypes.map((definition) => (
                  <button
                    className={
                      selectedType === definition.activityTypeKey
                        ? 'type-choice is-selected'
                        : 'type-choice'
                    }
                    key={definition.id}
                    type="button"
                    aria-pressed={
                      selectedType === definition.activityTypeKey
                    }
                    onClick={() => selectType(definition)}
                  >
                    {definition.activityTypeLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="form-section" aria-labelledby="identity-section-title">
          <div className="section-heading">
            <span className="section-number">02</span>
            <div>
              <h2 id="identity-section-title">Identification</h2>
              <p>Ajoute un nom et la periode exacte de l'epreuve.</p>
            </div>
          </div>

          <div className="form-grid identification-grid">
            <label className="wide-field">
              <span>Nom de l'activite</span>
              <input
                placeholder="Ex. Semi-marathon de Lyon"
                {...register('title')}
              />
              {errors.title ? <small>{errors.title.message}</small> : null}
            </label>

            <DateSelector
              label="Date de debut"
              yearField="startYear"
              monthField="startMonth"
              dayField="startDay"
              year={startYear}
              month={startMonth}
              errors={{
                year: errors.startYear?.message,
                month: errors.startMonth?.message,
                day: errors.startDay?.message,
              }}
              register={register}
            />

            <label className="multi-day-toggle wide-field">
              <input
                type="checkbox"
                checked={multiDay}
                onChange={(event) => setMultiDay(event.target.checked)}
              />
              <span>
                <CalendarDays size={17} aria-hidden="true" />
                Cette epreuve se deroule sur plusieurs jours
              </span>
            </label>

            {multiDay ? (
              <DateSelector
                label="Date de fin"
                yearField="endYear"
                monthField="endMonth"
                dayField="endDay"
                year={endYear ?? startYear}
                month={endMonth ?? startMonth}
                errors={{
                  year: errors.endYear?.message,
                  month: errors.endMonth?.message,
                  day: errors.endDay?.message,
                }}
                register={register}
              />
            ) : null}
          </div>
        </section>

        <section
          className="form-section"
          aria-labelledby="description-section-title"
        >
          <div className="section-heading">
            <span className="section-number">03</span>
            <div>
              <h2 id="description-section-title">Description</h2>
              <p>Decris le parcours et ses caracteristiques.</p>
            </div>
          </div>

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
                  step={distanceUnit === 'km' ? '0.01' : '1'}
                  placeholder={distanceUnit === 'km' ? '10' : '10000'}
                  {...register('distanceValue')}
                />
                <select
                  aria-label="Unite de distance"
                  {...register('distanceUnit')}
                >
                  <option value="km">km</option>
                  <option value="m">m</option>
                </select>
              </span>
              {errors.distanceValue ? (
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
                placeholder="120"
                {...register('elevationGainMeters')}
              />
              {errors.elevationGainMeters ? (
                <small>{errors.elevationGainMeters.message}</small>
              ) : null}
            </label>
          </div>
        </section>

        <section className="form-section" aria-labelledby="result-section-title">
          <div className="section-heading">
            <span className="section-number">04</span>
            <div>
              <h2 id="result-section-title">Resultats</h2>
              <p>
                {selectedType === 'competition'
                  ? 'Le temps est obligatoire et les classements sont facultatifs.'
                  : 'Le temps est facultatif pour une activite caritative.'}
              </p>
            </div>
          </div>

          <div className="result-fields">
            <fieldset className="duration-field">
              <legend>
                <Timer size={16} aria-hidden="true" />
                Temps
                {selectedType === 'charity' ? (
                  <small>Facultatif</small>
                ) : null}
              </legend>
              <div className="duration-inputs">
                <label>
                  <span>Heures</span>
                  <input
                    type="number"
                    min="0"
                    {...register('durationHours')}
                  />
                  {errors.durationHours ? (
                    <small>{errors.durationHours.message}</small>
                  ) : null}
                </label>
                <label>
                  <span>Minutes</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    {...register('durationMinutes')}
                  />
                  {errors.durationMinutes ? (
                    <small>{errors.durationMinutes.message}</small>
                  ) : null}
                </label>
                <label>
                  <span>Secondes</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    {...register('durationSeconds')}
                  />
                  {errors.durationSeconds ? (
                    <small>{errors.durationSeconds.message}</small>
                  ) : null}
                </label>
              </div>
            </fieldset>

            {selectedType === 'competition' ? (
              <>
                <div>
                  <span className="field-group-label">Statut du resultat</span>
                  <div
                    className="result-status-row"
                    role="group"
                    aria-label="Statut du resultat"
                  >
                    {resultStatuses.map((status) => (
                      <button
                        className={
                          resultStatus === status ? 'is-selected' : ''
                        }
                        key={status}
                        type="button"
                        aria-pressed={resultStatus === status}
                        onClick={() => {
                          setValue('resultStatus', status, {
                            shouldDirty: true,
                          })
                          clearErrors([
                            'resultStatus',
                            'statusComment',
                            'overallRank',
                            'overallParticipants',
                            'sexRank',
                            'sexParticipants',
                            'categoryRank',
                            'categoryParticipants',
                          ])
                        }}
                      >
                        {resultStatusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>

                {resultStatus === 'ranked' ? (
                  <div className="ranking-grid">
                    {rankingGroups.map((group) => {
                      const rank = watch(group.rankField)
                      const medal = getMedalForRank(rank)

                      return (
                        <fieldset className="ranking-group" key={group.key}>
                          <legend>
                            <Trophy size={16} aria-hidden="true" />
                            {group.label}
                            {medal ? (
                              <span
                                className={`medal-badge medal-${medal}`}
                                title={medalLabel(medal)}
                              >
                                <Medal size={15} aria-hidden="true" />
                                <span className="sr-only">
                                  {medalLabel(medal)}
                                </span>
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
                              step="1"
                              placeholder="42"
                              {...register(group.rankField)}
                            />
                            {errors[group.rankField] ? (
                              <small>
                                {errors[group.rankField]?.message}
                              </small>
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
                              step="1"
                              placeholder="500"
                              {...register(group.participantField)}
                            />
                            {errors[group.participantField] ? (
                              <small>
                                {errors[group.participantField]?.message}
                              </small>
                            ) : null}
                          </label>
                        </fieldset>
                      )
                    })}
                  </div>
                ) : (
                  <label className="status-comment">
                    <span>
                      Commentaire {resultStatusLabels[resultStatus]}
                    </span>
                    <textarea
                      rows={4}
                      placeholder="Contexte ou raison..."
                      {...register('statusComment')}
                    />
                    {errors.statusComment ? (
                      <small>{errors.statusComment.message}</small>
                    ) : null}
                  </label>
                )}
              </>
            ) : null}
          </div>
        </section>

        <section className="form-section" aria-labelledby="notes-section-title">
          <div className="section-heading">
            <span className="section-number">05</span>
            <div>
              <h2 id="notes-section-title">Notes</h2>
              <p>Ajoute librement le contexte ou les sensations.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="wide-field">
              <span>Commentaire general</span>
              <textarea
                rows={5}
                placeholder="Conditions, sensations, objectifs..."
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

type DateFieldName =
  | 'startYear'
  | 'startMonth'
  | 'startDay'
  | 'endYear'
  | 'endMonth'
  | 'endDay'

function DateSelector({
  label,
  yearField,
  monthField,
  dayField,
  year,
  month,
  errors,
  register,
}: {
  label: string
  yearField: DateFieldName
  monthField: DateFieldName
  dayField: DateFieldName
  year: number
  month: number
  errors: {
    year?: string
    month?: string
    day?: string
  }
  register: ReturnType<typeof useForm<PerformanceWizardValues>>['register']
}) {
  const dayCount = daysInMonth(year, month)

  return (
    <fieldset className="date-selector wide-field">
      <legend>
        <CalendarDays size={16} aria-hidden="true" />
        {label}
      </legend>
      <div>
        <label>
          <span>Annee</span>
          <select {...register(yearField)}>
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.year ? <small>{errors.year}</small> : null}
        </label>
        <label>
          <span>Mois</span>
          <select {...register(monthField)}>
            {monthOptions.map((option, index) => (
              <option key={option} value={index + 1}>
                {option}
              </option>
            ))}
          </select>
          {errors.month ? <small>{errors.month}</small> : null}
        </label>
        <label>
          <span>Jour</span>
          <select {...register(dayField)}>
            {Array.from({ length: dayCount }, (_, index) => index + 1).map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ),
            )}
          </select>
          {errors.day ? <small>{errors.day}</small> : null}
        </label>
      </div>
    </fieldset>
  )
}

function getDefaultValues(
  performance?: Performance,
): PerformanceWizardValues {
  const competitionData = isRunningCompetitionData(performance?.data)
    ? performance.data
    : undefined
  const charityData = isRunningCharityData(performance?.data)
    ? performance.data
    : undefined
  const data = competitionData ?? charityData
  const durationSeconds = data?.durationSeconds ?? 0
  const now = new Date()
  const start = performance?.date.start ?? {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }
  const end = performance?.date.end
  const activityTypeKey =
    performance?.activityTypeKey === 'charity' ? 'charity' : 'competition'

  return {
    activityDefinitionId:
      activityTypeKey === 'charity'
        ? 'running__charity'
        : 'running__competition',
    sportKey: 'running',
    activityTypeKey,
    title: performance?.title ?? '',
    startYear: start.year,
    startMonth: start.month,
    startDay: start.day,
    multiDay: Boolean(end),
    endYear: end?.year,
    endMonth: end?.month,
    endDay: end?.day,
    distanceValue:
      typeof data?.distanceMeters === 'number'
        ? data.distanceMeters / 1000
        : (undefined as unknown as number),
    distanceUnit: 'km',
    elevationGainMeters:
      data?.elevationGainMeters ?? (undefined as unknown as number),
    durationHours: Math.floor(durationSeconds / 3600),
    durationMinutes: Math.floor((durationSeconds % 3600) / 60),
    durationSeconds: durationSeconds % 60,
    resultStatus: competitionData?.resultStatus ?? 'ranked',
    statusComment: competitionData?.statusComment ?? '',
    overallRank: rankedValue(competitionData?.rankings.overall),
    overallParticipants: competitionData?.rankings.overall.participantCount,
    sexRank: rankedValue(competitionData?.rankings.sex),
    sexParticipants: competitionData?.rankings.sex.participantCount,
    categoryRank: rankedValue(competitionData?.rankings.category),
    categoryParticipants: competitionData?.rankings.category.participantCount,
    notes: performance?.notes ?? '',
  }
}

function buildPerformance({
  values,
  ownerUid,
  existing,
  definition,
}: {
  values: PerformanceWizardValues
  ownerUid: string
  existing?: Performance
  definition?: ActivityDefinition
}): Performance {
  const now = new Date().toISOString()
  const notes = clean(values.notes)
  const distanceMeters = Math.round(
    values.distanceUnit === 'km'
      ? values.distanceValue * 1000
      : values.distanceValue,
  )
  const durationSeconds =
    values.durationHours * 3600 +
    values.durationMinutes * 60 +
    values.durationSeconds
  const data =
    values.activityTypeKey === 'competition'
      ? buildCompetitionData(values, distanceMeters, durationSeconds)
      : buildCharityData(values, distanceMeters, durationSeconds)
  const searchKeywords = [
    values.title,
    values.sportKey,
    values.activityTypeKey,
    String(values.startYear),
    String(distanceMeters),
    String(values.elevationGainMeters),
    notes,
    values.statusComment,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/\s+/)

  return {
    id: existing?.id ?? crypto.randomUUID(),
    ownerUid,
    activityDefinitionId: values.activityDefinitionId,
    schemaVersion:
      definition?.schemaVersion ??
      (values.activityTypeKey === 'competition' ? 2 : 1),
    title: values.title.trim(),
    sportKey: values.sportKey,
    activityTypeKey: values.activityTypeKey,
    status: 'completed',
    date: {
      start: {
        year: values.startYear,
        month: values.startMonth,
        day: values.startDay,
      },
      ...(values.multiDay && values.endYear && values.endMonth && values.endDay
        ? {
            end: {
              year: values.endYear,
              month: values.endMonth,
              day: values.endDay,
            },
          }
        : {}),
    },
    data,
    ...(notes ? { notes } : {}),
    tags: [values.sportKey, values.activityTypeKey],
    searchKeywords,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

function buildCompetitionData(
  values: PerformanceWizardValues,
  distanceMeters: number,
  durationSeconds: number,
): RunningCompetitionData {
  const statusComment =
    values.resultStatus === 'ranked' ? undefined : clean(values.statusComment)
  const sentinel =
    values.resultStatus === 'ranked'
      ? undefined
      : resultSentinels[values.resultStatus]

  return {
    distanceMeters,
    elevationGainMeters: values.elevationGainMeters,
    durationSeconds,
    resultStatus: values.resultStatus,
    rankings:
      typeof sentinel === 'number'
        ? {
            overall: { rank: sentinel },
            sex: { rank: sentinel },
            category: { rank: sentinel },
          }
        : {
            overall: buildRanking(
              values.overallRank,
              values.overallParticipants,
            ),
            sex: buildRanking(values.sexRank, values.sexParticipants),
            category: buildRanking(
              values.categoryRank,
              values.categoryParticipants,
            ),
          },
    ...(statusComment ? { statusComment } : {}),
  }
}

function buildCharityData(
  values: PerformanceWizardValues,
  distanceMeters: number,
  durationSeconds: number,
): RunningCharityData {
  return {
    distanceMeters,
    elevationGainMeters: values.elevationGainMeters,
    ...(durationSeconds > 0 ? { durationSeconds } : {}),
  }
}

function buildRanking(
  rank: number | undefined,
  participantCount: number | undefined,
): RankingResult {
  return {
    ...(typeof rank === 'number' ? { rank } : {}),
    ...(typeof participantCount === 'number' ? { participantCount } : {}),
  }
}

function rankedValue(ranking?: RankingResult) {
  return ranking?.rank && ranking.rank > 0 ? ranking.rank : undefined
}

function clean(value?: string) {
  const cleaned = value?.trim()
  return cleaned || undefined
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function clampDay(
  year: number,
  month: number,
  day: number,
  update: (day: number) => void,
) {
  const maximum = daysInMonth(year, month)

  if (day > maximum) {
    update(maximum)
  }
}

function medalLabel(medal: 'gold' | 'silver' | 'bronze' | 'chocolate') {
  return {
    gold: 'Or',
    silver: 'Argent',
    bronze: 'Bronze',
    chocolate: 'Chocolat',
  }[medal]
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

const yearOptions = Array.from(
  { length: new Date().getFullYear() + 11 - 1950 },
  (_, index) => new Date().getFullYear() + 10 - index,
)
