export type DistributionMetadata = Record<string, unknown>

/**
 * Reference to a Solar Network Drive cloud file, mirroring the
 * DistributionCenter cloud-file profile object. Either `id` (a Drive file)
 * or `url` (an external file) identifies the asset.
 */
export interface DistributionCloudFileReference {
  id?: string
  name?: string
  fileMeta?: Record<string, unknown>
  userMeta?: Record<string, unknown>
  mimeType?: string
  hash?: string
  size?: number
  hasCompression?: boolean
  url?: string
  width?: number | null
  height?: number | null
  blurhash?: string
  usage?: string
  applicationType?: string
  createdAt?: string
  updatedAt?: string
}

export interface DistributionProduct {
  id: string
  publisherId: string
  slug: string
  name: string
  names?: DistributionLocalizedText
  description: string
  descriptions?: DistributionLocalizedText
  icon?: DistributionCloudFileReference
  background?: DistributionCloudFileReference
  previews?: DistributionCloudFileReference[]
  createdAt: string
  updatedAt: string
}

export interface DistributionUploadApiKey {
  id: string
  name: string
  createdAt?: string
  lastUsedAt?: string | null
}

export interface DistributionCreatedUploadApiKey extends DistributionUploadApiKey {
  key: string
}


export interface DistributionChannel {
  id: string
  name: string
  displayName: string
  displayNames?: DistributionLocalizedText
  description: string
  descriptions?: DistributionLocalizedText
  /**
   * Number of published releases retained for this channel.
   * `undefined` uses the platform default; `0` disables cleanup.
   */
  artifactRetention?: number | null
  latest: DistributionRelease | null
}

export interface DistributionArtifact {
  id?: string
  objectKey?: string
  platform: string
  architecture: string
  fileName: string
  mimeType: string
  size: number
  hash: string
  slug?: string
  meta?: DistributionMetadata
  downloadUrl?: string
  /** Downloads counted by the DistributionCenter download endpoint. */
  downloadCount?: number
  /** True when artifact retention cleanup removed the stored object. */
  expired?: boolean
}

export interface DistributionRelease {
  id: string
  productId: string
  version: string
  title?: string
  titles?: DistributionLocalizedText
  channel?: string
  channels: string[]
  releaseNotes: string
  descriptions?: DistributionLocalizedText
  metadata?: DistributionMetadata
  forceUpdate?: boolean
  status: 'draft' | 'published' | 'yanked' | string
  createdAt?: string
  publishedAt: string | null
  downloadCount?: number
  artifacts: DistributionArtifact[]
  attachments?: DistributionCloudFileReference[]
}

export interface DistributionMetrics {
  from: string
  to: string
  checks: number
  dau: number
  mau: number
  byChannel: Record<string, number>
  byPlatform: Record<string, number>
  byArchitecture: Record<string, number>
  byVersion: Record<string, number>
  byOSVersion: Record<string, number>
  byClientVersion: Record<string, number>
  byLocale: Record<string, number>
}

export interface DistributionUpdateCheckInput {
  version: string
  channel: string
  platform: string
  architecture: string
  installationId: string
  osVersion?: string
  locale?: string
}

export interface DistributionUpdateCheck {
  updateAvailable: boolean
  currentVersion: string
  release: DistributionRelease | null
}

export interface DistributionUpload {
  objectKey: string
  uploadUrl: string
}
