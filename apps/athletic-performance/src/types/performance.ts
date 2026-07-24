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

export type ActivityDefinitionId =
  | 'running__competition'
  | 'running__charity'

export type RankingKey = 'overall' | 'sex' | 'category'
export type ResultStatus = 'ranked' | 'dnf' | 'dsq' | 'dns'
export type MedalKind = 'gold' | 'silver' | 'bronze' | 'chocolate'

export type RankingResult = {
  rank?: number
  participantCount?: number
}

export type RunningDescriptionData = {
  distanceMeters: number
  elevationGainMeters: number
}

export type RunningCompetitionData = RunningDescriptionData & {
  durationSeconds: number
  resultStatus: ResultStatus
  rankings: Record<RankingKey, RankingResult>
  statusComment?: string
}

export type RunningCharityData = RunningDescriptionData & {
  durationSeconds?: number
}

export type ActivityData = RunningCompetitionData | RunningCharityData

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
  medal?: MedalKind
}

export type CalendarDate = {
  year: number
  month: number
  day: number
}

export type ActivityDateRange = {
  start: CalendarDate
  end?: CalendarDate
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
  date: ActivityDateRange
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
  section: 'description' | 'results'
  valueType: 'distance' | 'integer' | 'duration' | 'status' | 'rankings' | 'text'
  required: boolean
  storageUnit?: 'm' | 's'
  inputUnits?: Array<'m' | 'km'>
  displayFormat?:
    | 'adaptive-distance'
    | 'meters'
    | 'hms'
    | 'status'
    | 'rankings'
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
