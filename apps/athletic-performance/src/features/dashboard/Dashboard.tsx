import { useAuth } from '@webappalex/auth'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bike,
  CalendarDays,
  Dumbbell,
  Filter,
  Footprints,
  Mountain,
  Search,
  Shield,
  Snowflake,
  Timer,
  Trophy,
  Waves,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPerformances } from '../performances/performanceRepository'
import type { Performance, SportKey } from '../../types/performance'

const sportLabels: Record<SportKey, string> = {
  running: 'Running',
  trail: 'Trail',
  triathlon: 'Triathlon',
  cycling: 'Cyclisme',
  swimming: 'Natation',
  strength: 'Musculation',
  hiking: 'Randonnee',
  skiing: 'Ski',
  'backcountry-skiing': 'Ski rando',
  other: 'Autre',
}

const sportIcons: Record<SportKey, typeof Trophy> = {
  running: Footprints,
  trail: Mountain,
  triathlon: Waves,
  cycling: Bike,
  swimming: Waves,
  strength: Dumbbell,
  hiking: Mountain,
  skiing: Snowflake,
  'backcountry-skiing': Snowflake,
  other: Trophy,
}

export function Dashboard() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState<SportKey | 'all'>('all')
  const [activity, setActivity] = useState('all')
  const [selected, setSelected] = useState<Performance | null>(null)
  const ownerUid = user?.uid ?? 'local-demo-user'

  const performancesQuery = useQuery({
    queryKey: ['performances', ownerUid],
    queryFn: () => listPerformances(ownerUid),
  })

  const performances = useMemo(
    () => performancesQuery.data ?? [],
    [performancesQuery.data],
  )
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return performances.filter((performance) => {
      const matchesSearch =
        !normalizedQuery ||
        performance.searchKeywords.join(' ').includes(normalizedQuery) ||
        performance.title.toLowerCase().includes(normalizedQuery)
      const matchesSport = sport === 'all' || performance.sport === sport
      const matchesActivity =
        activity === 'all' || performance.activityKind === activity

      return matchesSearch && matchesSport && matchesActivity
    })
  }, [activity, performances, query, sport])

  const years = useMemo(() => {
    return filtered.reduce<Record<string, Performance[]>>((groups, performance) => {
      const year = String(performance.date.year)
      groups[year] = groups[year] ?? []
      groups[year].push(performance)
      return groups
    }, {})
  }, [filtered])
  const sortedYears = Object.keys(years).sort((left, right) => Number(right) - Number(left))
  const completed = performances.filter((performance) => performance.status === 'completed')
  const podiums = performances.filter((performance) =>
    performance.result?.positionLabel?.match(/^(1|2|3|4|5|6|7|8|9|10)e/i),
  )

  return (
    <>
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="eyebrow">Performance management</p>
          <h1 id="dashboard-title">Un cockpit prive pour toutes tes courses.</h1>
          <p>
            Timeline Athletic importee, filtres instantanes, details riches et
            assistant de creation pret pour Firebase.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/new">
              Nouvelle performance
            </Link>
            <a className="secondary-button" href="../portal/index.html">
              Retour portail
            </a>
          </div>
        </motion.div>

        <div className="stats-grid" aria-label="Statistiques">
          <Stat label="Performances" value={performances.length} icon={Trophy} />
          <Stat label="Terminees" value={completed.length} icon={Shield} />
          <Stat label="Top 10" value={podiums.length} icon={Timer} />
          <Stat label="Sports" value={new Set(performances.map((item) => item.sport)).size} icon={Filter} />
        </div>
      </section>

      <section className="control-panel" aria-label="Filtres performances">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Rechercher par course, annee, sport..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="filter-row" role="group" aria-label="Sport">
          <FilterButton active={sport === 'all'} onClick={() => setSport('all')}>
            Tous
          </FilterButton>
          {Object.entries(sportLabels).map(([key, label]) => (
            <FilterButton
              key={key}
              active={sport === key}
              onClick={() => setSport(key as SportKey)}
            >
              {label}
            </FilterButton>
          ))}
        </div>

        <div className="filter-row" role="group" aria-label="Type">
          {['all', 'performance', 'adventure', 'solidarity'].map((value) => (
            <FilterButton
              key={value}
              active={activity === value}
              onClick={() => setActivity(value)}
            >
              {activityLabel(value)}
            </FilterButton>
          ))}
        </div>
      </section>

      {performancesQuery.isLoading ? (
        <p className="state-message">Chargement des performances</p>
      ) : null}

      {performancesQuery.isError ? (
        <p className="state-message">Impossible de charger les performances.</p>
      ) : null}

      <section className="timeline" aria-label="Timeline des performances">
        {sortedYears.map((year) => (
          <div className="year-group" key={year}>
            <div className="year-marker">
              <span>{year}</span>
            </div>
            <div className="performance-grid">
              {years[year].map((performance, index) => (
                <PerformanceCard
                  key={performance.id}
                  performance={performance}
                  index={index}
                  onSelect={() => setSelected(performance)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <AnimatePresence>
        {selected ? (
          <PerformanceDrawer
            performance={selected}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Trophy
}) {
  return (
    <div className="stat-panel">
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
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
}: {
  performance: Performance
  index: number
  onSelect: () => void
}) {
  const SportIcon = sportIcons[performance.sport]
  const highlightMetrics = performance.metrics.slice(0, 4)

  return (
    <motion.article
      className={`performance-card sport-${performance.sport}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.035, 0.22), duration: 0.35 }}
    >
      <button type="button" className="card-hit-area" onClick={onSelect}>
        <div className="media-frame">
          {performance.media.main ? (
            <img src={performance.media.main.url} alt="" loading="lazy" />
          ) : (
            <div className="media-placeholder" />
          )}
          {performance.media.bib ? (
            <img className="bib-preview" src={performance.media.bib.url} alt="" loading="lazy" />
          ) : null}
          <div className="stats-overlay">
            {highlightMetrics.map((metric) => (
              <span key={`${metric.key}-${metric.label}`}>
                <strong>{metric.label}</strong>
                {metric.value}
              </span>
            ))}
          </div>
          <span className="sport-badge">
            <SportIcon size={18} aria-hidden="true" />
          </span>
        </div>

        <div className="card-body">
          <div className="card-meta">
            <span>
              <CalendarDays size={15} aria-hidden="true" />
              {formatDate(performance)}
            </span>
            <span>{activityLabel(performance.activityKind)}</span>
          </div>
          <h3>{performance.title}</h3>
          {performance.result?.positionLabel ? (
            <p className="rank-line">{performance.result.positionLabel}</p>
          ) : (
            <p className="rank-line">{sportLabels[performance.sport]}</p>
          )}
        </div>
      </button>
    </motion.article>
  )
}

function PerformanceDrawer({
  performance,
  onClose,
}: {
  performance: Performance
  onClose: () => void
}) {
  return (
    <motion.aside
      className="detail-drawer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="drawer-panel"
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      >
        <button className="icon-button drawer-close" type="button" onClick={onClose}>
          <X size={18} aria-hidden="true" />
          <span className="sr-only">Fermer</span>
        </button>
        <p className="eyebrow">{sportLabels[performance.sport]}</p>
        <h2>{performance.title}</h2>
        <p className="drawer-date">{formatDate(performance)}</p>

        {performance.media.main ? (
          <img className="drawer-image" src={performance.media.main.url} alt="" />
        ) : null}

        <div className="metric-list">
          {performance.metrics.map((metric) => (
            <div key={`${metric.key}-${metric.label}-${metric.value}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>

        {performance.segments?.length ? (
          <div className="segment-list">
            {performance.segments.map((segment) => (
              <section key={segment.id}>
                <h3>{segment.label}</h3>
                {segment.metrics.map((metric) => (
                  <p key={`${segment.id}-${metric.key}`}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </p>
                ))}
              </section>
            ))}
          </div>
        ) : null}

        {performance.notes ? <p className="drawer-notes">{performance.notes}</p> : null}
      </motion.div>
    </motion.aside>
  )
}

function activityLabel(value: string) {
  const labels: Record<string, string> = {
    all: 'Tous',
    performance: 'Performance',
    adventure: 'Aventure',
    solidarity: 'Solidaire',
  }

  return labels[value] ?? value
}

function formatDate(performance: Performance) {
  if (!performance.date.month) {
    return String(performance.date.year)
  }

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(performance.date.year, performance.date.month - 1, 1))
}
