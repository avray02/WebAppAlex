import { gpx } from '@tmcw/togeojson'
import type {
  SimplifiedGpxTrack,
  TrackPoint,
} from '../../types/performance'

const maximumStoredPoints = 500
const maximumFileSize = 10 * 1024 * 1024

export async function parseGpxFile(
  file: File,
): Promise<SimplifiedGpxTrack> {
  if (!file.name.toLowerCase().endsWith('.gpx')) {
    throw new Error('Selectionne un fichier .gpx')
  }

  if (file.size > maximumFileSize) {
    throw new Error('Le fichier GPX ne doit pas depasser 10 Mo')
  }

  const document = new DOMParser().parseFromString(
    await file.text(),
    'application/xml',
  )

  if (document.querySelector('parsererror')) {
    throw new Error('Le fichier GPX est invalide')
  }

  const geoJson = gpx(document)
  const points = geoJson.features.flatMap((feature) => {
    if (feature.geometry?.type === 'LineString') {
      return feature.geometry.coordinates.map(toTrackPoint)
    }

    if (feature.geometry?.type === 'MultiLineString') {
      return feature.geometry.coordinates.flatMap((line) =>
        line.map(toTrackPoint),
      )
    }

    return []
  })

  if (points.length < 2) {
    throw new Error('Aucun trace exploitable trouve dans ce GPX')
  }

  return {
    fileName: file.name.slice(0, 200),
    originalPointCount: points.length,
    points: simplifyPoints(points),
  }
}

function toTrackPoint(coordinates: number[]): TrackPoint {
  const [longitude, latitude, elevationMeters] = coordinates

  return {
    latitude,
    longitude,
    ...(Number.isFinite(elevationMeters) ? { elevationMeters } : {}),
  }
}

function simplifyPoints(points: TrackPoint[]) {
  if (points.length <= maximumStoredPoints) {
    return points
  }

  return Array.from({ length: maximumStoredPoints }, (_, index) => {
    const sourceIndex = Math.round(
      (index * (points.length - 1)) / (maximumStoredPoints - 1),
    )
    return points[sourceIndex]
  })
}
