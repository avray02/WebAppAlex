export type MediaPipelineResult = {
  file: File
  previewUrl: string
  targetFormat: 'webp'
}

export async function prepareMediaForUpload(file: File): Promise<MediaPipelineResult> {
  return {
    file,
    previewUrl: URL.createObjectURL(file),
    targetFormat: 'webp',
  }
}
