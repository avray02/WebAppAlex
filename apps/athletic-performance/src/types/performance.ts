export type SportKey =
  | 'running'
  | 'trail'
  | 'triathlon'
  | 'cycling'
  | 'swimming'
  | 'strength'
  | 'hiking'
  | 'skiing'
  | 'backcountry-skiing'
  | 'other'

export type ActivityKind = 'performance' | 'adventure' | 'solidarity'

export type MetricKey =
  | 'distance'
  | 'duration'
  | 'elevation'
  | 'rank'
  | 'pace'
  | 'speed'
  | 'custom'

export type Metric = {
  key: MetricKey
  label: string
  value: string
  unit?: string
  normalizedValue?: number
}

export type Segment = {
  id: string
  sport: SportKey
  label: string
  metrics: Metric[]
}

export type Performance = {
  id: string
  ownerUid: string
  title: string
  sport: SportKey
  activityKind: ActivityKind
  status: 'draft' | 'planned' | 'completed'
  date: {
    year: number
    month?: number
    day?: number
  }
  result?: {
    positionLabel?: string
    rank?: number
    totalParticipants?: number
    dnf?: boolean
  }
  metrics: Metric[]
  segments?: Segment[]
  notes?: string
  tags: string[]
  searchKeywords: string[]
  source?: {
    type: 'manual' | 'legacy-import'
    raw?: unknown
  }
  createdAt: string
  updatedAt: string
}

export type SportDefinition = {
  key: SportKey
  label: string
  accent: string
  metrics: MetricKey[]
}
