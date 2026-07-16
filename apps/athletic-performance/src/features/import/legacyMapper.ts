import type {
  ActivityKind,
  MediaRef,
  Metric,
  Performance,
  Segment,
  SportKey,
} from '../../types/performance'

type LegacyValue = string | Record<string, string> | undefined

type LegacyPerformance = {
  sport?: string
  year?: number
  month?: number
  type?: string
  activity_type?: string
  name?: string
  distance?: LegacyValue
  time?: LegacyValue
  elevation?: LegacyValue
  position?: string
  main_image?: string
  bib_image?: string
  details?: string
  is_top?: boolean
}

const sportMap: Record<string, SportKey> = {
  running: 'running',
  trail: 'trail',
  triathlon: 'triathlon',
  cycling: 'cycling',
  hiking: 'hiking',
  skiing: 'skiing',
  'backcountry skiing': 'backcountry-skiing',
  swimming: 'swimming',
}

const segmentLabels: Record<string, { sport: SportKey; label: string }> = {
  swim: { sport: 'swimming', label: 'Natation' },
  bike: { sport: 'cycling', label: 'Velo' },
  run: { sport: 'running', label: 'Course' },
  total: { sport: 'triathlon', label: 'Total' },
}

export async function loadLegacyPerformances(ownerUid: string) {
  const response = await fetch(`${import.meta.env.BASE_URL}legacy/performances.json`)

  if (!response.ok) {
    throw new Error('Legacy performances could not be loaded')
  }

  const payload = (await response.json()) as { performances: LegacyPerformance[] }

  return payload.performances.map((legacy, index) =>
    mapLegacyPerformance(legacy, ownerUid, index),
  )
}

function mapLegacyPerformance(
  legacy: LegacyPerformance,
  ownerUid: string,
  index: number,
): Performance {
  const sport = normalizeSport(legacy.sport)
  const activityKind = normalizeActivityKind(legacy.activity_type, legacy.type)
  const id = [
    legacy.year ?? 'unknown',
    legacy.month ?? '00',
    sport,
    slugify(legacy.name ?? `performance-${index}`),
  ].join('-')
  const createdAt = new Date(Date.UTC(legacy.year ?? 2024, 0, 1)).toISOString()
  const metrics = buildMetrics(legacy)
  const segments = buildSegments(legacy)
  const main = buildMediaRef(id, 'main', legacy.main_image)
  const bib = buildMediaRef(id, 'bib', legacy.bib_image)
  const searchKeywords = [
    legacy.name,
    legacy.sport,
    legacy.activity_type,
    legacy.details,
    legacy.position,
    String(legacy.year ?? ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/\s+/)

  return {
    id,
    ownerUid,
    title: legacy.name ?? 'Performance sans titre',
    sport,
    activityKind,
    status: 'completed',
    date: {
      year: legacy.year ?? new Date().getFullYear(),
      month: legacy.month,
    },
    result: legacy.position
      ? {
          positionLabel: legacy.position,
          dnf: legacy.position.toLowerCase().includes('dnf'),
        }
      : undefined,
    metrics,
    segments,
    media: {
      main,
      bib,
      gallery: [],
    },
    notes: legacy.details || undefined,
    tags: [
      sport,
      activityKind,
      legacy.is_top ? 'highlight' : '',
      legacy.type ?? '',
    ].filter(Boolean),
    searchKeywords,
    source: {
      type: 'legacy-import',
      raw: legacy,
    },
    createdAt,
    updatedAt: createdAt,
  }
}

function normalizeSport(sport = ''): SportKey {
  return sportMap[sport.toLowerCase()] ?? 'other'
}

function normalizeActivityKind(
  activityType?: string,
  type?: string,
): ActivityKind {
  if (activityType === 'adventure' || type === 'adventure') {
    return 'adventure'
  }

  if (activityType === 'solidarity') {
    return 'solidarity'
  }

  return 'performance'
}

function buildMetrics(legacy: LegacyPerformance): Metric[] {
  const metrics: Metric[] = []

  addStringMetric(metrics, 'distance', 'Distance', legacy.distance)
  addStringMetric(metrics, 'duration', 'Temps', legacy.time)
  addStringMetric(metrics, 'elevation', 'D+', legacy.elevation)

  if (legacy.position) {
    metrics.push({
      key: 'rank',
      label: 'Classement',
      value: legacy.position,
    })
  }

  return metrics
}

function buildSegments(legacy: LegacyPerformance): Segment[] | undefined {
  if (legacy.sport !== 'triathlon') {
    return undefined
  }

  const distances = toRecord(legacy.distance)
  const times = toRecord(legacy.time)
  const elevations = toRecord(legacy.elevation)
  const segmentKeys = Array.from(
    new Set([
      ...Object.keys(distances),
      ...Object.keys(times),
      ...Object.keys(elevations),
    ]),
  )

  return segmentKeys.map((key) => {
    const definition = segmentLabels[key] ?? {
      sport: 'other' as SportKey,
      label: key,
    }
    const metrics: Metric[] = []

    addStringMetric(metrics, 'distance', 'Distance', distances[key])
    addStringMetric(metrics, 'duration', 'Temps', times[key])
    addStringMetric(metrics, 'elevation', 'D+', elevations[key])

    return {
      id: key,
      sport: definition.sport,
      label: definition.label,
      metrics,
    }
  })
}

function addStringMetric(
  metrics: Metric[],
  key: Metric['key'],
  label: string,
  value?: LegacyValue,
) {
  if (!value) {
    return
  }

  if (typeof value === 'object') {
    const values = Object.values(value).filter(Boolean)
    const preferredValue = value.total ?? values.join(' / ')

    if (!preferredValue) {
      return
    }

    metrics.push({
      key,
      label,
      value: preferredValue,
    })
    return
  }

  metrics.push({
    key,
    label,
    value,
  })
}

function toRecord(value?: LegacyValue) {
  return value && typeof value === 'object' ? value : {}
}

function buildMediaRef(
  performanceId: string,
  role: MediaRef['role'],
  value?: string,
): MediaRef | undefined {
  if (!value) {
    return undefined
  }

  return {
    id: `${performanceId}-${role}`,
    role,
    url: `${import.meta.env.BASE_URL}legacy/${value}`,
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
