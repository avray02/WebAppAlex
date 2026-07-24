import {
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  Snowflake,
  Trophy,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityKind, SportKey } from '../../types/performance'

export type SportOption = {
  key: SportKey
  label: string
  icon: LucideIcon
}

export const sportOptions: SportOption[] = [
  { key: 'running', label: 'Running', icon: Footprints },
  { key: 'trail', label: 'Trail', icon: Mountain },
  { key: 'triathlon', label: 'Triathlon', icon: Waves },
  { key: 'cycling', label: 'Cyclisme', icon: Bike },
  { key: 'swimming', label: 'Natation', icon: Waves },
  { key: 'strength', label: 'Musculation', icon: Dumbbell },
  { key: 'hiking', label: 'Randonnee', icon: Mountain },
  { key: 'skiing', label: 'Ski', icon: Snowflake },
  { key: 'backcountry-skiing', label: 'Ski rando', icon: Snowflake },
  { key: 'other', label: 'Autre', icon: Trophy },
]

export const activityOptions: Array<{
  key: ActivityKind
  label: string
}> = [
  { key: 'performance', label: 'Performance' },
  { key: 'adventure', label: 'Aventure' },
  { key: 'solidarity', label: 'Solidaire' },
]

export const sportByKey = Object.fromEntries(
  sportOptions.map((sport) => [sport.key, sport]),
) as Record<SportKey, SportOption>

export const activityLabels: Record<ActivityKind, string> = {
  performance: 'Performance',
  adventure: 'Aventure',
  solidarity: 'Solidaire',
}
