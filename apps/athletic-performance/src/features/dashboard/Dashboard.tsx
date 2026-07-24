import { useAuth } from '@dailyme/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Award,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Filter,
  Gauge,
  Medal,
  Mountain,
  Pencil,
  Route,
  Search,
  Timer,
  Trash2,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  activityLabels,
  activityOptions,
  sportByKey,
  sportOptions,
} from '../performances/performanceCatalog'
import {
  deletePerformance,
  listPerformances,
} from '../performances/performanceRepository'
import {
  getStatusComment,
  getPerformanceMetrics,
  hasRanking,
} from '../performances/performanceMetrics'
import type {
  ActivityTypeKey,
  Metric,
  Performance,
  SportKey,
} from '../../types/performance'

type DashboardNotice = {
  notice?: string
}

const metricIcons: Record<Metric['key'], LucideIcon> = {
  distance: Route,
  duration: Timer,
  elevation: Mountain,
  rank: Award,
  pace: Gauge,
  speed: Gauge,
  custom: Activity,
}

export function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState<SportKey | 'all'>('all')
  const [activity, setActivity] = useState<ActivityTypeKey | 'all'>('all')
  const [selected, setSelected] = useState<Performance | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Performance | null>(null)
  const [notice, setNotice] = useState(
    (location.state as DashboardNotice | null)?.notice ?? '',
  )
  const ownerUid = user?.uid ?? 'local-demo-user'

  const performancesQuery = useQuery({
    queryKey: ['performances', ownerUid],
    queryFn: () => listPerformances(ownerUid),
  })
  const performances = useMemo(
    () => performancesQuery.data ?? [],
    [performancesQuery.data],
  )
  const availableSports = useMemo(
    () =>
      sportOptions.filter((option) =>
        performances.some((performance) => performance.sportKey === option.key),
      ),
    [performances],
  )
  const availableActivities = useMemo(
    () =>
      activityOptions.filter((option) =>
        performances.some(
          (performance) => performance.activityTypeKey === option.key,
        ),
      ),
    [performances],
  )
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return performances.filter((performance) => {
      const metrics = getPerformanceMetrics(performance)
      const searchText = [
        performance.title,
        ...performance.searchKeywords,
        ...metrics.flatMap((metric) => [
          metric.label,
          metric.value,
        ]),
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch =
        !normalizedSearch || searchText.includes(normalizedSearch)
      const matchesSport = sport === 'all' || performance.sportKey === sport
      const matchesActivity =
        activity === 'all' || performance.activityTypeKey === activity

      return matchesSearch && matchesSport && matchesActivity
    })
  }, [activity, performances, search, sport])
  const yearGroups = useMemo(
    () =>
      filtered.reduce<Record<string, Performance[]>>((groups, performance) => {
        const year = String(performance.date.start.year)
        groups[year] = groups[year] ?? []
        groups[year].push(performance)
        return groups
      }, {}),
    [filtered],
  )
  const sortedYears = Object.keys(yearGroups).sort(
    (left, right) => Number(right) - Number(left),
  )
  const currentYear = new Date().getFullYear()
  const currentYearCount = performances.filter(
    (performance) => performance.date.start.year === currentYear,
  ).length
  const rankedCount = performances.filter(hasRanking).length

  const deleteMutation = useMutation({
    mutationFn: deletePerformance,
    onSuccess: async (_, performanceId) => {
      if (selected?.id === performanceId) {
        setSelected(null)
      }

      setDeleteTarget(null)
      setNotice('Performance supprimee.')
      queryClient.removeQueries({
        queryKey: ['performance', ownerUid, performanceId],
      })
      await queryClient.invalidateQueries({
        queryKey: ['performances', ownerUid],
      })
    },
  })

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      if (deleteTarget) {
        setDeleteTarget(null)
      } else {
        setSelected(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [deleteTarget])

  return (
    <>
      <section className="dashboard-header" aria-labelledby="dashboard-title">
        <div className="page-heading">
          <p className="eyebrow">Journal sportif</p>
          <h1 id="dashboard-title">Mes performances</h1>
          <p>
            Retrouve chaque activite, ses resultats et son evolution au fil des
            saisons.
          </p>
        </div>
        <Link className="primary-button" to="/new">
          <CirclePlus size={18} aria-hidden="true" />
          Ajouter une activite
        </Link>
      </section>

      <section className="summary-strip" aria-label="Resume">
        <SummaryItem label="Total" value={performances.length} />
        <SummaryItem label={String(currentYear)} value={currentYearCount} />
        <SummaryItem
          label="Disciplines"
          value={new Set(performances.map((item) => item.sportKey)).size}
        />
        <SummaryItem label="Classements" value={rankedCount} />
      </section>

      {notice ? (
        <div className="notice-banner" role="status">
          <span>{notice}</span>
          <button
            className="subtle-icon-button"
            type="button"
            title="Fermer"
            aria-label="Fermer la notification"
            onClick={() => setNotice('')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <section className="control-panel" aria-label="Filtres performances">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Rechercher une course, une valeur, une annee..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="filter-group">
          <span className="filter-label">
            <Filter size={16} aria-hidden="true" />
            Sport
          </span>
          <div className="filter-row" role="group" aria-label="Sport">
            <FilterButton
              active={sport === 'all'}
              onClick={() => setSport('all')}
            >
              Tous
            </FilterButton>
            {availableSports.map((option) => (
              <FilterButton
                key={option.key}
                active={sport === option.key}
                onClick={() => setSport(option.key)}
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Type</span>
          <div className="filter-row" role="group" aria-label="Type">
            <FilterButton
              active={activity === 'all'}
              onClick={() => setActivity('all')}
            >
              Tous
            </FilterButton>
            {availableActivities.map((option) => (
              <FilterButton
                key={option.key}
                active={activity === option.key}
                onClick={() => setActivity(option.key)}
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
        </div>
      </section>

      {performancesQuery.isLoading ? (
        <p className="state-message">Chargement des performances...</p>
      ) : null}

      {performancesQuery.isError ? (
        <section className="state-message">
          <h2>Chargement impossible</h2>
          <p>Verifie la connexion Firebase puis reessaie.</p>
        </section>
      ) : null}

      {!performancesQuery.isLoading &&
      !performancesQuery.isError &&
      sortedYears.length === 0 ? (
        <EmptyState hasPerformances={performances.length > 0} />
      ) : null}

      <section className="timeline" aria-label="Timeline des performances">
        {sortedYears.map((year) => (
          <section className="year-group" key={year} aria-labelledby={`year-${year}`}>
            <header className="year-marker">
              <h2 id={`year-${year}`}>{year}</h2>
              <span>
                {yearGroups[year].length} activite
                {yearGroups[year].length > 1 ? 's' : ''}
              </span>
            </header>
            <div className="performance-grid">
              {yearGroups[year].map((performance, index) => (
                <PerformanceCard
                  key={performance.id}
                  performance={performance}
                  index={index}
                  onSelect={() => setSelected(performance)}
                  onDelete={() => setDeleteTarget(performance)}
                />
              ))}
            </div>
          </section>
        ))}
      </section>

      <AnimatePresence>
        {selected ? (
          <PerformanceDrawer
            performance={selected}
            onClose={() => setSelected(null)}
            onDelete={() => setDeleteTarget(selected)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <DeleteDialog
            performance={deleteTarget}
            isDeleting={deleteMutation.isPending}
            hasError={deleteMutation.isError}
            onCancel={() => {
              deleteMutation.reset()
              setDeleteTarget(null)
            }}
            onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      className={active ? 'filter-button is-active' : 'filter-button'}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function PerformanceCard({
  performance,
  index,
  onSelect,
  onDelete,
}: {
  performance: Performance
  index: number
  onSelect: () => void
  onDelete: () => void
}) {
  const sport = sportByKey[performance.sportKey]
  const SportIcon = sport.icon
  const visibleMetrics = getPerformanceMetrics(performance).slice(0, 4)

  return (
    <motion.article
      className={`performance-card sport-${performance.sportKey}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px' }}
      transition={{ delay: Math.min(index * 0.03, 0.18), duration: 0.28 }}
    >
      <header className="performance-card-header">
        <span className="sport-icon" aria-hidden="true">
          <SportIcon size={19} />
        </span>
        <div className="card-actions">
          <Link
            className="subtle-icon-button"
            to={`/edit/${performance.id}`}
            title="Modifier"
            aria-label={`Modifier ${performance.title}`}
          >
            <Pencil size={16} aria-hidden="true" />
          </Link>
          <button
            className="subtle-icon-button is-danger"
            type="button"
            title="Supprimer"
            aria-label={`Supprimer ${performance.title}`}
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <button className="performance-card-main" type="button" onClick={onSelect}>
        <div className="card-meta">
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            {formatDate(performance)}
          </span>
          <span className="activity-badge">
            {activityLabels[performance.activityTypeKey]}
          </span>
        </div>
        <h3>{performance.title}</h3>
        <p className="sport-label">{sport.label}</p>

        {visibleMetrics.length ? (
          <div className="card-metrics">
            {visibleMetrics.map((metric, metricIndex) => (
              <MetricValue
                key={`${metric.key}-${metric.label}-${metricIndex}`}
                metric={metric}
              />
            ))}
          </div>
        ) : (
          <p className="empty-metrics">Aucune mesure renseignee</p>
        )}

        <span className="details-link">
          Voir les details
          <ChevronRight size={16} aria-hidden="true" />
        </span>
      </button>
    </motion.article>
  )
}

function MetricValue({ metric }: { metric: Metric }) {
  const Icon = metricIcons[metric.key]

  return (
    <span className="metric-value">
      <Icon size={16} aria-hidden="true" />
      <span>
        <small>{metric.label}</small>
        <span className="metric-result">
          <strong>{metric.value}</strong>
          {metric.medal ? (
            <span
              className={`medal-icon medal-${metric.medal}`}
              title={medalLabel(metric.medal)}
            >
              <Medal size={16} aria-hidden="true" />
              <span className="sr-only">{medalLabel(metric.medal)}</span>
            </span>
          ) : null}
        </span>
      </span>
    </span>
  )
}

function PerformanceDrawer({
  performance,
  onClose,
  onDelete,
}: {
  performance: Performance
  onClose: () => void
  onDelete: () => void
}) {
  const sport = sportByKey[performance.sportKey]
  const SportIcon = sport.icon
  const metrics = getPerformanceMetrics(performance)
  const statusComment = getStatusComment(performance)

  return (
    <motion.aside
      className="detail-drawer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-label={`Details de ${performance.title}`}
    >
      <button
        className="drawer-backdrop"
        type="button"
        aria-label="Fermer les details"
        onClick={onClose}
      />
      <motion.div
        className={`drawer-panel sport-${performance.sportKey}`}
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      >
        <header className="drawer-toolbar">
          <span className="sport-icon" aria-hidden="true">
            <SportIcon size={19} />
          </span>
          <div className="drawer-toolbar-actions">
            <Link
              className="subtle-icon-button"
              to={`/edit/${performance.id}`}
              title="Modifier"
              aria-label={`Modifier ${performance.title}`}
            >
              <Pencil size={17} aria-hidden="true" />
            </Link>
            <button
              className="subtle-icon-button is-danger"
              type="button"
              title="Supprimer"
              aria-label={`Supprimer ${performance.title}`}
              onClick={onDelete}
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
            <button
              className="subtle-icon-button"
              type="button"
              title="Fermer"
              aria-label="Fermer les details"
              onClick={onClose}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <p className="eyebrow">{sport.label}</p>
        <h2>{performance.title}</h2>
        <div className="drawer-meta">
          <span>
            <CalendarDays size={16} aria-hidden="true" />
            {formatDate(performance)}
          </span>
          <span>{activityLabels[performance.activityTypeKey]}</span>
        </div>

        {metrics.length ? (
          <section className="drawer-section" aria-labelledby="metrics-title">
            <h3 id="metrics-title">Resultats</h3>
            <div className="drawer-metrics">
              {metrics.map((metric, index) => (
                <MetricValue
                  key={`${metric.key}-${metric.label}-${index}`}
                  metric={metric}
                />
              ))}
            </div>
          </section>
        ) : null}

        {statusComment ? (
          <section
            className="drawer-section"
            aria-labelledby="status-comment-title"
          >
            <h3 id="status-comment-title">Commentaire de statut</h3>
            <p className="drawer-notes">{statusComment}</p>
          </section>
        ) : null}

        {performance.notes ? (
          <section className="drawer-section" aria-labelledby="notes-title">
            <h3 id="notes-title">Notes</h3>
            <p className="drawer-notes">{performance.notes}</p>
          </section>
        ) : null}
      </motion.div>
    </motion.aside>
  )
}

function DeleteDialog({
  performance,
  isDeleting,
  hasError,
  onCancel,
  onConfirm,
}: {
  performance: Performance
  isDeleting: boolean
  hasError: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <motion.div
      className="dialog-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
      >
        <span className="dialog-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </span>
        <div>
          <h2 id="delete-dialog-title">Supprimer cette performance ?</h2>
          <p>
            <strong>{performance.title}</strong> sera retiree definitivement de
            ton compte.
          </p>
        </div>
        {hasError ? (
          <p className="form-error" role="alert">
            La suppression a echoue. Reessaie dans quelques instants.
          </p>
        ) : null}
        <div className="dialog-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            <Trash2 size={17} aria-hidden="true" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function EmptyState({ hasPerformances }: { hasPerformances: boolean }) {
  return (
    <section className="empty-state">
      <Trophy size={28} aria-hidden="true" />
      <h2>
        {hasPerformances
          ? 'Aucune performance ne correspond aux filtres.'
          : 'Aucune performance enregistree.'}
      </h2>
      <p>
        {hasPerformances
          ? 'Modifie la recherche ou selectionne un autre filtre.'
          : 'Ajoute ta premiere activite pour commencer ton historique.'}
      </p>
      {!hasPerformances ? (
        <Link className="primary-button" to="/new">
          <CirclePlus size={18} aria-hidden="true" />
          Ajouter une activite
        </Link>
      ) : null}
    </section>
  )
}

function formatDate(performance: Performance) {
  const start = formatCalendarDate(performance.date.start)

  if (!performance.date.end) {
    return start
  }

  return `${start} - ${formatCalendarDate(performance.date.end)}`
}

function formatCalendarDate(date: {
  year: number
  month: number
  day: number
}) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date.year, date.month - 1, date.day))
}

function medalLabel(medal: NonNullable<Metric['medal']>) {
  return {
    gold: 'Medaille d or',
    silver: 'Medaille d argent',
    bronze: 'Medaille de bronze',
    chocolate: 'Medaille en chocolat',
  }[medal]
}
