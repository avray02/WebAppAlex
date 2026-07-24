import { useEffect } from 'react'
import {
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import { Route, Trash2 } from 'lucide-react'
import type { SimplifiedGpxTrack } from '../../types/performance'

type GpxTrackPreviewProps = {
  track: SimplifiedGpxTrack
  onRemove?: () => void
}

export function GpxTrackPreview({
  track,
  onRemove,
}: GpxTrackPreviewProps) {
  const positions = track.points.map(
    (point) => [point.latitude, point.longitude] as [number, number],
  )

  return (
    <div className="gpx-preview">
      <header>
        <span>
          <Route size={17} aria-hidden="true" />
          <strong>{track.fileName}</strong>
          <small>{track.originalPointCount} points source</small>
        </span>
        {onRemove ? (
          <button
            className="icon-button"
            type="button"
            title="Retirer le GPX"
            aria-label="Retirer le GPX"
            onClick={onRemove}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <div className="gpx-visuals">
        <div className="gpx-map" aria-label="Trace GPX">
          <MapContainer
            center={positions[0]}
            zoom={12}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline
              positions={positions}
              pathOptions={{ color: '#087f73', weight: 4 }}
            />
            <FitTrackBounds positions={positions} />
          </MapContainer>
        </div>
        <ElevationProfile track={track} />
      </div>
    </div>
  )
}

function FitTrackBounds({
  positions,
}: {
  positions: LatLngBoundsExpression
}) {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(positions, { padding: [20, 20] })
  }, [map, positions])

  return null
}

function ElevationProfile({ track }: { track: SimplifiedGpxTrack }) {
  const elevations = track.points
    .map((point) => point.elevationMeters)
    .filter((value): value is number => typeof value === 'number')

  if (elevations.length < 2) {
    return (
      <div className="elevation-profile is-empty">
        Profil d'altitude indisponible
      </div>
    )
  }

  const minimum = Math.min(...elevations)
  const maximum = Math.max(...elevations)
  const range = Math.max(maximum - minimum, 1)
  const path = elevations
    .map((elevation, index) => {
      const x = (index / (elevations.length - 1)) * 100
      const y = 90 - ((elevation - minimum) / range) * 75
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <figure className="elevation-profile">
      <figcaption>
        <strong>Profil d'altitude</strong>
        <span>
          {Math.round(minimum)} m - {Math.round(maximum)} m
        </span>
      </figcaption>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Altitude de ${Math.round(minimum)} a ${Math.round(maximum)} metres`}
      >
        <path d={path} />
      </svg>
    </figure>
  )
}
