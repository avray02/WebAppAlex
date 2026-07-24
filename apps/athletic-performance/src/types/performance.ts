export type SportKey =
  | 'running'
  | 'trail'
  | 'triathlon'
  | 'cycling'
  | 'road-cycling'
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
  | 'road-cycling__competition'

export type RankingKey = 'overall' | 'sex' | 'category'
export type ResultStatus = 'ranked' | 'dnf' | 'dsq' | 'dns'
export type MedalKind = 'gold' | 'silver' | 'bronze' | 'chocolate'
export type EventFormat = 'single' | 'stage-race'

export type RankingResult = {
  rank?: number
  participantCount?: number
}

export type DistanceElevationData = {
  distanceMeters: number
  elevationGainMeters: number
}

export type CompetitionResultData = {
  durationSeconds: number
  resultStatus: ResultStatus
  rankings: Record<RankingKey, RankingResult>
  statusComment?: string
}

export type RunningCompetitionData = DistanceElevationData &
  CompetitionResultData

export type RunningCharityData = DistanceElevationData & {
  durationSeconds?: number
}

export type RoadCyclingCompetitionData = DistanceElevationData &
  CompetitionResultData & {
    eventFormat: EventFormat
    stageCount?: number
    averagePowerWatts?: number
  }

export type ActivityData =
  | RunningCompetitionData
  | RunningCharityData
  | RoadCyclingCompetitionData

export type MetricKey =
  | 'distance'
  | 'duration'
  | 'elevation'
  | 'rank'
  | 'pace'
  | 'speed'
  | 'power'
  | 'stages'
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

export type TrackPoint = {
  latitude: number
  longitude: number
  elevationMeters?: number
}

export type SimplifiedGpxTrack = {
  fileName: string
  originalPointCount: number
  points: TrackPoint[]
}

export type PerformanceStageData = DistanceElevationData &
  CompetitionResultData & {
    averagePowerWatts?: number
  }

export type PerformanceStage = {
  id: string
  performanceId: string
  ownerUid: string
  order: number
  title: string
  date: CalendarDate
  data: PerformanceStageData
  track?: SimplifiedGpxTrack
  createdAt: string
  updatedAt: string
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
  valueType:
    | 'distance'
    | 'integer'
    | 'duration'
    | 'status'
    | 'rankings'
    | 'text'
    | 'choice'
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
