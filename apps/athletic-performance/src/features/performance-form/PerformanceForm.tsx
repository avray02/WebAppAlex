import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@dailyme/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Flag,
  Footprints,
  Mountain,
  Route,
  Save,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import type {
  Performance,
  RankingKey,
  RankingResult,
  RunningCompetitionData,
} from '../../types/performance'
import {
  performanceWizardSchema,
  type PerformanceWizardValues,
} from '../../validation/performanceSchema'
import { listActivityDefinitions } from '../performances/activityDefinitionRepository'
import {
  activityDefinitions,
  isRunningCompetitionData,
} from '../performances/performanceCatalog'
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

export function PerformanceForm({ performance }: PerformanceFormProps) {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ownerUid = user?.uid ?? 'local-demo-user'
  const isEditing = Boolean(performance)
  const unsupportedPerformance =
    performance && !isRunningCompetitionData(performance.data)
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
    watch,
    formState: { errors },
  } = useForm<PerformanceWizardValues>({
    resolver: zodResolver(
      performanceWizardSchema,
    ) as Resolver<PerformanceWizardValues>,
    mode: 'onBlur',
    defaultValues: getDefaultValues(performance),
  })
  const selectedDefinitionId = watch('activityDefinitionId')
  const dnf = watch('dnf')

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

  if (unsupportedPerformance) {
    return (
      <section className="state-message">
        <h1>Ancien format de performance</h1>
        <p>
          Cette activite reste visible, mais elle ne peut pas encore etre
          modifiee avec le schema Course a pied / Competition.
        </p>
        <Link className="secondary-button" to="/">
          <ArrowLeft size={17} aria-hidden="true" />
          Retour aux performances
        </Link>
      </section>
    )
  }

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
          Les valeurs sont enregistrees dans leur unite de reference puis
          adaptees automatiquement a l'affichage.
        </p>
      </header>

      <form className="performance-form" onSubmit={handleSubmit(onSubmit)}>
        <section className="form-section" aria-labelledby="sport-section-title">
          <div className="section-heading">
            <span className="section-number">01</span>
            <div>
              <h2 id="sport-section-title">Activite</h2>
              <p>Selectionne une paire sport et type disponible.</p>
            </div>
          </div>

          <div
            className="definition-choice-grid"
            role="group"
            aria-label="Sport et type d'activite"
          >
            {definitions.map((definition) => (
              <button
                className={
                  selectedDefinitionId === definition.id
                    ? 'definition-choice is-selected'
                    : 'definition-choice'
                }
                key={definition.id}
                type="button"
                aria-pressed={selectedDefinitionId === definition.id}
                onClick={() =>
                  setValue('activityDefinitionId', definition.id, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <Footprints size={20} aria-hidden="true" />
                <span>
                  <strong>{definition.sportLabel}</strong>
                  <small>{definition.activityTypeLabel}</small>
                </span>
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
              <span>Nom de la competition</span>
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
              <p>Distance, denivele et temps sont obligatoires.</p>
            </div>
          </div>

          <div className="form-grid metric-fields">
            <label>
              <span>
                <Route size={16} aria-hidden="true" />
                Distance (m)
              </span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="10000"
                {...register('distanceMeters')}
              />
              {errors.distanceMeters ? (
                <small>{errors.distanceMeters.message}</small>
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

            <fieldset className="duration-field wide-field">
              <legend>
                <Timer size={16} aria-hidden="true" />
                Temps
              </legend>
              <div className="duration-inputs">
                <label>
                  <span>Heures</span>
                  <input
                    type="number"
                    min="0"
                    max="999"
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
          </div>
        </section>

        <section className="form-section" aria-labelledby="ranking-section-title">
          <div className="section-heading">
            <span className="section-number">04</span>
            <div>
              <h2 id="ranking-section-title">Classements</h2>
              <p>Les trois classements restent facultatifs.</p>
            </div>
          </div>

          <div className="ranking-fields">
            <label className="dnf-toggle">
              <input type="checkbox" {...register('dnf')} />
              <span>
                <Flag size={18} aria-hidden="true" />
                <span>
                  <strong>DNF</strong>
                  <small>La competition n'a pas ete terminee</small>
                </span>
              </span>
            </label>

            {dnf ? (
              <label className="dnf-comment">
                <span>Commentaire DNF</span>
                <textarea
                  rows={4}
                  placeholder="Raison de l'abandon, contexte..."
                  {...register('dnfComment')}
                />
                {errors.dnfComment ? (
                  <small>{errors.dnfComment.message}</small>
                ) : null}
              </label>
            ) : (
              <div className="ranking-grid">
                {rankingGroups.map((group) => (
                  <fieldset className="ranking-group" key={group.key}>
                    <legend>
                      <Trophy size={16} aria-hidden="true" />
                      {group.label}
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
                        step="1"
                        placeholder="500"
                        {...register(group.participantField)}
                      />
                      {errors[group.participantField] ? (
                        <small>{errors[group.participantField]?.message}</small>
                      ) : null}
                    </label>
                  </fieldset>
                ))}
              </div>
            )}
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

function getDefaultValues(
  performance?: Performance,
): PerformanceWizardValues {
  const data = isRunningCompetitionData(performance?.data)
    ? performance.data
    : undefined
  const durationSeconds = data?.durationSeconds ?? 0
  const isDnf = data
    ? Object.values(data.rankings).every((ranking) => ranking.rank === -1)
    : false

  return {
    activityDefinitionId: 'running__competition',
    title: performance?.title ?? '',
    year: performance?.date.year ?? new Date().getFullYear(),
    month: performance?.date.month,
    day: performance?.date.day,
    distanceMeters:
      data?.distanceMeters ?? (undefined as unknown as number),
    elevationGainMeters:
      data?.elevationGainMeters ?? (undefined as unknown as number),
    durationHours: Math.floor(durationSeconds / 3600),
    durationMinutes: Math.floor((durationSeconds % 3600) / 60),
    durationSeconds: durationSeconds % 60,
    dnf: isDnf,
    dnfComment: data?.dnfComment ?? '',
    overallRank: rankedValue(data?.rankings.overall),
    overallParticipants: data?.rankings.overall.participantCount,
    sexRank: rankedValue(data?.rankings.sex),
    sexParticipants: data?.rankings.sex.participantCount,
    categoryRank: rankedValue(data?.rankings.category),
    categoryParticipants: data?.rankings.category.participantCount,
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
  const notes = clean(values.notes)
  const dnfComment = values.dnf ? clean(values.dnfComment) : undefined
  const data: RunningCompetitionData = {
    distanceMeters: values.distanceMeters,
    elevationGainMeters: values.elevationGainMeters,
    durationSeconds:
      values.durationHours * 3600 +
      values.durationMinutes * 60 +
      values.durationSeconds,
    rankings: values.dnf
      ? {
          overall: { rank: -1 },
          sex: { rank: -1 },
          category: { rank: -1 },
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
    ...(dnfComment ? { dnfComment } : {}),
  }
  const searchKeywords = [
    values.title,
    'running',
    'course',
    'competition',
    String(values.year),
    String(values.distanceMeters),
    String(values.elevationGainMeters),
    notes,
    dnfComment,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/\s+/)

  return {
    id: existing?.id ?? crypto.randomUUID(),
    ownerUid,
    activityDefinitionId: values.activityDefinitionId,
    schemaVersion: 1,
    title: values.title.trim(),
    sportKey: 'running',
    activityTypeKey: 'competition',
    status: 'completed',
    date: {
      year: values.year,
      ...(values.month ? { month: values.month } : {}),
      ...(values.day ? { day: values.day } : {}),
    },
    data,
    ...(notes ? { notes } : {}),
    tags: ['running', 'competition'],
    searchKeywords,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
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
