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

export type ActivityTypeKey = 'competition' | 'adventure' | 'charity'

export type ActivityDefinitionId = 'running__competition'

export type RankingKey = 'overall' | 'sex' | 'category'

export type RankingResult = {
  rank?: number
  participantCount?: number
}

export type RunningCompetitionData = {
  distanceMeters: number
  elevationGainMeters: number
  durationSeconds: number
  rankings: Record<RankingKey, RankingResult>
  dnfComment?: string
}

export type ActivityData = RunningCompetitionData | Record<string, unknown>

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

export type Performance = {
  id: string
  ownerUid: string
  activityDefinitionId: ActivityDefinitionId | string
  schemaVersion: number
  title: string
  sportKey: SportKey
  activityTypeKey: ActivityTypeKey
  status: 'draft' | 'planned' | 'completed'
  date: {
    year: number
    month?: number
    day?: number
  }
  data: ActivityData
  notes?: string
  tags: string[]
  searchKeywords: string[]
  createdAt: string
  updatedAt: string
}

export type SportDefinition = {
  key: SportKey
  label: string
  accent: string
  metrics: MetricKey[]
}

export type ActivityFieldDefinition = {
  key: string
  label: string
  valueType: 'integer' | 'duration' | 'rankings' | 'text'
  required: boolean
  storageUnit?: 'm' | 's'
  displayFormat?: 'adaptive-distance' | 'meters' | 'hms' | 'rankings'
}

export type ActivityDefinition = {
  id: ActivityDefinitionId
  sportKey: SportKey
  sportLabel: string
  activityTypeKey: ActivityTypeKey
  activityTypeLabel: string
  active: boolean
  schemaVersion: number
  fields: ActivityFieldDefinition[]
}
