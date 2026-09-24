const FILE_BASE_URL = 'https://api.solian.app/drive/files'

export function getFileUrl(fileId: string | null | undefined, variant?: string): string | null {
  if (!fileId) return null
  const url = `${FILE_BASE_URL}/${fileId}`
  if (!variant) return url
  return url + `?${variant}=true`
}

/**
 * Resolve image dimensions from possibly-partial metadata. The backend may
 * return only one of width/height, with the aspect ratio (width/height)
 * filling the gap. Returns null when neither full dimensions nor a
 * computable pair is available.
 */
export function resolveImageDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
  ratio: number | null | undefined,
): { width: number; height: number } | null {
  if (width && height) return { width, height }
  if (width && ratio && ratio > 0) {
    return { width, height: Math.round(width / ratio) }
  }
  if (height && ratio && ratio > 0) {
    return { width: Math.round(height * ratio), height }
  }
  return null
}
