import { FileUp } from 'lucide-react'
import { useState } from 'react'
import type { SimplifiedGpxTrack } from '../../types/performance'
import { GpxTrackPreview } from './GpxTrackPreview'
import { parseGpxFile } from './gpxTrack'

type GpxTrackFieldProps = {
  track?: SimplifiedGpxTrack
  error?: string
  onChange: (track?: SimplifiedGpxTrack) => void
}

export function GpxTrackField({
  track,
  error,
  onChange,
}: GpxTrackFieldProps) {
  const [fileError, setFileError] = useState('')

  async function loadGpx(file?: File) {
    if (!file) {
      return
    }

    setFileError('')

    try {
      onChange(await parseGpxFile(file))
    } catch (loadError) {
      setFileError(
        loadError instanceof Error
          ? loadError.message
          : 'Lecture du GPX impossible',
      )
    }
  }

  return (
    <>
      <label className="gpx-upload">
        <FileUp size={20} aria-hidden="true" />
        <span>
          <strong>Charger un fichier GPX</strong>
          <small>Le trace sera simplifie avant enregistrement.</small>
        </span>
        <input
          type="file"
          accept=".gpx,application/gpx+xml"
          onChange={(event) => {
            void loadGpx(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </label>
      {fileError || error ? (
        <p className="form-error" role="alert">
          {fileError || error}
        </p>
      ) : null}
      {track ? (
        <GpxTrackPreview track={track} onRemove={() => onChange(undefined)} />
      ) : null}
    </>
  )
}
