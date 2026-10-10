import type { MaybeRefOrGetter } from 'vue'
import type {
  DistributionArtifact,
  DistributionChannel,
  DistributionCloudFileReference,
  DistributionLocalizedText,
  DistributionMetrics,
  DistributionProduct,
  DistributionRelease,
  DistributionUploadApiKey,
} from '~/types/distribution'
import {
  associateDistributionArtifact,
  createDistributionChannel,
  createDistributionRelease,
  createDistributionUploadApiKey,
  deleteDistributionChannel,
  deleteDistributionProduct,
  deleteDistributionRelease,
  deleteDistributionUploadApiKey,
  fetchDistributionChannels,
  fetchDistributionManagedReleases,
  fetchDistributionMetrics,
  fetchDistributionProducts,
  fetchDistributionUploadApiKeys,
  localizedDistributionText,
  prepareDistributionUpload,
  publishDistributionRelease,
  updateDistributionChannel,
  updateDistributionProduct,
  updateDistributionRelease,
  uploadDistributionArtifact,
  yankDistributionRelease,
} from '~/utils/distribution'

/**
 * Solsynth Express data layer.
 *
 * One instance per product page: owns the product, its channels, releases,
 * metrics and upload keys, plus every mutation. Pages keep their own form state
 * and drawer flags, and pass form payloads into the `save*` functions here.
 */

/* ------------------------------------------------------------------ models */

export type ProductLocalizationEntry = {
  id: string
  locale: string
  name: string
  description: string
}

export type ChannelLocalizationEntry = {
  id: string
  locale: string
  displayName: string
  description: string
}

export type ReleaseLocalizationEntry = {
  id: string
  locale: string
  title: string
  description: string
}

export type ReleaseArtifactEntry = {
  id: string
  file: File | null
  isExisting: boolean
  objectKey?: string
  downloadUrl: string
  fileName: string
  mimeType: string
  size: string
  hash: string
  slug: string
  meta: string
  platform: string
  architecture: string
}

export type ReleaseMetadataEntry = {
  id: string
  key: string
  value: string
}

export type ProductFormState = {
  slug: string
  localizations: ProductLocalizationEntry[]
  icon: DistributionCloudFileReference | null
  background: DistributionCloudFileReference | null
  previews: DistributionCloudFileReference[]
}

export type ChannelFormState = {
  name: string
  localizations: ChannelLocalizationEntry[]
  usePlatformDefault: boolean
  artifactRetention: number
}

export type ReleaseFormState = {
  version: string
  localizations: ReleaseLocalizationEntry[]
  metadataEntries: ReleaseMetadataEntry[]
  forceUpdate: boolean
  artifacts: ReleaseArtifactEntry[]
  attachments: DistributionCloudFileReference[]
}

export type MetricGroup = {
  key: string
  label: string
  entries: Array<{ key: string; count: number }>
}

export const MAX_METRIC_ENTRIES = 8

/* --------------------------------------------------------------- factories */

export function emptyProductForm(localeCode: string): ProductFormState {
  return { slug: '', localizations: [newProductLocalization(localeCode)], icon: null, background: null, previews: [] }
}

export function emptyChannelForm(localeCode: string): ChannelFormState {
  return { name: '', localizations: [newChannelLocalization(localeCode)], usePlatformDefault: true, artifactRetention: 0 }
}

export function emptyReleaseForm(localeCode: string): ReleaseFormState {
  return {
    version: '',
    localizations: [newReleaseLocalization(localeCode)],
    metadataEntries: [],
    forceUpdate: false,
    artifacts: [],
    attachments: [],
  }
}

export function newProductLocalization(localeCode = 'en-US'): ProductLocalizationEntry {
  return { id: crypto.randomUUID(), locale: localeCode, name: '', description: '' }
}

export function newChannelLocalization(localeCode = 'en-US'): ChannelLocalizationEntry {
  return { id: crypto.randomUUID(), locale: localeCode, displayName: '', description: '' }
}

export function newReleaseLocalization(localeCode = 'en-US'): ReleaseLocalizationEntry {
  return { id: crypto.randomUUID(), locale: localeCode, title: '', description: '' }
}

export function newArtifact(): ReleaseArtifactEntry {
  return {
    id: crypto.randomUUID(),
    file: null,
    isExisting: false,
    objectKey: undefined,
    downloadUrl: '',
    fileName: '',
    mimeType: '',
    size: '',
    hash: '',
    slug: '',
    meta: '',
    platform: '',
    architecture: '',
  }
}

export function newReleaseMetadataEntry(): ReleaseMetadataEntry {
  return { id: crypto.randomUUID(), key: '', value: '' }
}

export function releaseArtifactEntries(artifacts: DistributionArtifact[]): ReleaseArtifactEntry[] {
  return artifacts.length
    ? artifacts.map((artifact) => ({
        id: artifact.id || crypto.randomUUID(),
        file: null,
        isExisting: true,
        objectKey: artifact.objectKey,
        downloadUrl: artifact.downloadUrl || '',
        fileName: artifact.fileName || '',
        mimeType: artifact.mimeType || '',
        size: artifact.size ? String(artifact.size) : '',
        hash: artifact.hash || '',
        slug: artifact.slug || '',
        meta: artifact.meta ? JSON.stringify(artifact.meta, null, 2) : '',
        platform: artifact.platform,
        architecture: artifact.architecture,
      }))
    : [newArtifact()]
}

export function releaseMetadataEntries(metadata: Record<string, unknown> | undefined): ReleaseMetadataEntry[] {
  return Object.entries(metadata || {}).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }))
}

/* ----------------------------------------------------------- presentation */

export function isBuiltinChannelName(name: string) {
  return name === 'stable' || name === 'beta' || name === 'nightly' || name === 'rolling'
}

export function releaseStatusClass(status: string) {
  if (status === 'published') return 'bg-success/10 text-success'
  if (status === 'yanked') return 'bg-error/10 text-error'
  return 'bg-warning/10 text-warning'
}

/** A release is effectively expired when every artifact was removed by retention cleanup. */
export function isReleaseExpired(release: DistributionRelease) {
  return release.artifacts.length > 0 && release.artifacts.every((artifact) => artifact.expired)
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const formatted = unit === 0 || value >= 10 ? Math.round(value) : value.toFixed(1)
  return `${formatted} ${units[unit]}`
}

export function cloudFileReference(file: {
  id: string
  name?: string | null
  mimeType?: string | null
  hash?: string | null
  size?: number | null
  blurhash?: string | null
  usage?: string | null
  applicationType?: string | null
  hasCompression?: boolean | null
  fileMeta?: Record<string, unknown> | null
}): DistributionCloudFileReference {
  return {
    id: file.id,
    name: file.name ?? undefined,
    mimeType: file.mimeType ?? undefined,
    hash: file.hash || undefined,
    size: file.size ?? undefined,
    width: (file.fileMeta?.width as number | undefined) ?? null,
    height: (file.fileMeta?.height as number | undefined) ?? null,
    blurhash: file.blurhash || undefined,
    usage: file.usage || undefined,
    applicationType: file.applicationType || undefined,
    hasCompression: file.hasCompression ?? false,
  }
}

/* --------------------------------------------------------------- composable */

export function useDistributionProduct(
  publisherName: MaybeRefOrGetter<string>,
  productSlug: MaybeRefOrGetter<string>,
  sectionLabelKey?: string,
) {
  const { t, locale, locales, localeProperties } = useI18n()
  const toast = useAppToast()
  const { confirm } = useAlert()
  const developer = useDeveloper()

  const product = ref<DistributionProduct | null>(null)
  const isLoadingProduct = ref(false)
  const loadFailed = ref(false)

  // SSR renders the skeleton; keep the first client render identical so hydration
  // is not patched against a data branch that resolved before hydration finished.
  const isHydrated = useHydrated()

  const contentLocale = computed(() => localeProperties.value.language || locale.value || 'en-US')
  const localizationLocales = computed<readonly string[]>(() =>
    [localeProperties.value.language, locale.value].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    ),
  )
  const contentLocaleOptions = computed(() =>
    (locales.value as Array<{ code: string; language?: string; name?: string }>).map((item) => ({
      code: item.language || item.code,
      name: item.name || item.language || item.code,
    })),
  )

  const productId = computed(() => product.value?.id ?? null)
  const productName = computed(() =>
    product.value
      ? localizedDistributionText(product.value.names, product.value.name, localizationLocales.value)
      : '',
  )

  function localeName(localeCode: string) {
    return contentLocaleOptions.value.find((option) => option.code === localeCode)?.name || localeCode
  }

  function localeOptionsFor<T extends { locale: string }>(entries: T[], index: number) {
    const currentLocale = entries[index]?.locale ?? contentLocale.value
    const used = new Set(entries.filter((_, entryIndex) => entryIndex !== index).map((entry) => entry.locale))
    const current = contentLocaleOptions.value.find((option) => option.code === currentLocale) || {
      code: currentLocale,
      name: localeName(currentLocale),
    }
    return [current, ...contentLocaleOptions.value.filter((option) => option.code !== current.code && !used.has(option.code))]
  }

  function availableLocaleOptions<T extends { locale: string }>(entries: T[]) {
    const used = new Set(entries.map((entry) => entry.locale))
    return contentLocaleOptions.value.filter((option) => !used.has(option.code))
  }

  function localizedValue(values: DistributionLocalizedText | undefined, localeCode: string) {
    const normalized = localeCode.trim().replaceAll('_', '-').toLowerCase()
    const entries = Object.entries(values || {}).map(
      ([key, value]) => [key.trim().replaceAll('_', '-').toLowerCase(), value] as const,
    )
    return (
      entries.find(([key]) => key === normalized)?.[1]
      ?? entries.find(([key]) => key.split('-')[0] === normalized.split('-')[0])?.[1]
      ?? ''
    )
  }

  function localizedFormFallback(values: DistributionLocalizedText, fallback: string) {
    return localizedDistributionText(values, fallback, localizationLocales.value)
  }

  function localizedMap<T extends { locale: string }, K extends keyof T>(entries: T[], field: K) {
    return entries.reduce<DistributionLocalizedText>((result, entry) => {
      result[entry.locale] = String(entry[field] ?? '').trim()
      return result
    }, {})
  }

  function channelRetentionLabel(channel: DistributionChannel) {
    if (channel.artifactRetention === 0) return t('developer.apps.distribution.retentionDisabled')
    if (channel.artifactRetention == null) return ''
    return t('developer.apps.distribution.retentionCount', { count: channel.artifactRetention })
  }

  function productLocalizationEntries(
    names: DistributionLocalizedText | undefined,
    descriptions: DistributionLocalizedText | undefined,
    fallbackName: string,
    fallbackDescription: string,
  ) {
    const base = (localeCode: string, index: number): ProductLocalizationEntry => ({
      id: crypto.randomUUID(),
      locale: localeCode,
      name: names?.[localeCode] || (index === 0 ? fallbackName : ''),
      description: descriptions?.[localeCode] || (index === 0 ? fallbackDescription : ''),
    })
    const known = new Set([...Object.keys(names || {}), ...Object.keys(descriptions || {})])
    if (!known.size) known.add(contentLocale.value)
    return [...known].map(base)
  }

  function channelLocalizationEntries(
    displayNames: DistributionLocalizedText | undefined,
    descriptions: DistributionLocalizedText | undefined,
    fallbackName: string,
    fallbackDescription: string,
  ) {
    const known = new Set([...Object.keys(displayNames || {}), ...Object.keys(descriptions || {})])
    if (!known.size) known.add(contentLocale.value)
    return [...known].map((localeCode, index) => ({
      id: crypto.randomUUID(),
      locale: localeCode,
      displayName: localizedValue(displayNames, localeCode) || (index === 0 ? fallbackName : ''),
      description: localizedValue(descriptions, localeCode) || (index === 0 ? fallbackDescription : ''),
    }))
  }

  function releaseLocalizationEntries(
    titles: DistributionLocalizedText | undefined,
    descriptions: DistributionLocalizedText | undefined,
    fallbackTitle: string,
    fallbackDescription: string,
  ) {
    const known = new Set([...Object.keys(titles || {}), ...Object.keys(descriptions || {})])
    if (!known.size) known.add(contentLocale.value)
    return [...known].map((localeCode, index) => ({
      id: crypto.randomUUID(),
      locale: localeCode,
      title: localizedValue(titles, localeCode) || (index === 0 ? fallbackTitle : ''),
      description: localizedValue(descriptions, localeCode) || (index === 0 ? fallbackDescription : ''),
    }))
  }

  /* -------------------------------------------------------------- loading */

  async function loadProduct() {
    const slug = toValue(productSlug)
    isLoadingProduct.value = true
    loadFailed.value = false
    try {
      const publisher = toValue(publisherName)
      const products = await fetchDistributionProducts(publisher)
      product.value = products.find((item) => item.slug === slug) || null
      if (!product.value) loadFailed.value = true
      return product.value
    } catch (error) {
      product.value = null
      loadFailed.value = true
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
      return null
    } finally {
      isLoadingProduct.value = false
    }
  }

  const channels = ref<DistributionChannel[]>([])
  const selectedChannel = ref<DistributionChannel | null>(null)
  const isLoadingChannels = ref(false)
  const deletingChannelId = ref<string | null>(null)
  const isSavingChannel = ref(false)

  async function loadChannels() {
    if (!product.value) {
      channels.value = []
      selectedChannel.value = null
      return
    }
    isLoadingChannels.value = true
    try {
      channels.value = await fetchDistributionChannels(product.value.id)
      selectedChannel.value = channels.value.find((item) => item.id === selectedChannel.value?.id) || channels.value[0] || null
    } catch (error) {
      channels.value = []
      selectedChannel.value = null
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      isLoadingChannels.value = false
    }
  }

  async function selectChannel(channel: DistributionChannel | null) {
    selectedChannel.value = channel
    await loadReleases()
  }

  /* ------------------------------------------------------------- releases */

  const releases = ref<DistributionRelease[]>([])
  const isLoadingReleases = ref(false)
  const isSavingRelease = ref(false)
  const publishingId = ref<string | null>(null)
  const deletingReleaseId = ref<string | null>(null)
  const yankingId = ref<string | null>(null)

  const publishedReleaseCount = computed(() => releases.value.filter((release) => release.status === 'published').length)
  const selectedArtifactCount = computed(() =>
    releases.value.reduce((total, release) => total + (release.artifacts?.length || 0), 0),
  )

  async function loadReleases() {
    if (!product.value || !selectedChannel.value) {
      releases.value = []
      return
    }
    isLoadingReleases.value = true
    try {
      releases.value = await fetchDistributionManagedReleases(product.value.id, selectedChannel.value.name)
    } catch (error) {
      releases.value = []
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      isLoadingReleases.value = false
    }
  }

  async function sha256(file: File) {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  function parseArtifactMeta(value: string) {
    if (!value.trim()) return undefined
    try {
      const parsed = JSON.parse(value)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
      return parsed as Record<string, unknown>
    } catch {
      throw new Error(t('developer.apps.distribution.invalidArtifactMeta'))
    }
  }

  function parseReleaseMetadata(entries: ReleaseMetadataEntry[]) {
    const metadata: Record<string, unknown> = {}
    for (const entry of entries) {
      const key = entry.key.trim()
      const value = entry.value.trim()
      if (!key) {
        if (value) throw new Error(t('developer.apps.distribution.invalidReleaseMetadata'))
        continue
      }
      if (value === 'true' || value === 'false') {
        metadata[key] = value === 'true'
      } else if (value === 'null') {
        metadata[key] = null
      } else if (/^-?\d+$/.test(value)) {
        metadata[key] = Number(value)
      } else {
        metadata[key] = entry.value
      }
    }
    return Object.keys(metadata).length ? metadata : undefined
  }

  async function associateNewReleaseArtifacts(productKey: string, releaseId: string, artifacts: ReleaseArtifactEntry[]) {
    for (const artifact of artifacts) {
      if (artifact.isExisting) continue
      const hasExternalUrl = Boolean(artifact.downloadUrl.trim())
      if (!artifact.file && !hasExternalUrl) {
        if (!artifact.platform.trim() && !artifact.architecture.trim()) continue
        throw new Error(t('developer.apps.distribution.fileRequired'))
      }
      if (!artifact.platform.trim() || !artifact.architecture.trim()) {
        throw new Error(t('developer.apps.distribution.fileRequired'))
      }
      const meta = parseArtifactMeta(artifact.meta)
      if (hasExternalUrl) {
        let externalUrl: URL
        try {
          externalUrl = new URL(artifact.downloadUrl.trim())
        } catch {
          throw new Error(t('developer.apps.distribution.externalUrlInvalid'))
        }
        if (externalUrl.protocol !== 'http:' && externalUrl.protocol !== 'https:') {
          throw new Error(t('developer.apps.distribution.externalUrlInvalid'))
        }
        const size = Number(artifact.size)
        if (!artifact.fileName.trim() || !artifact.mimeType.trim() || !Number.isSafeInteger(size) || size < 0 || !artifact.hash.trim()) {
          throw new Error(t('developer.apps.distribution.externalArtifactRequired'))
        }
        await associateDistributionArtifact(productKey, releaseId, {
          downloadUrl: externalUrl.toString(),
          fileName: artifact.fileName.trim(),
          mimeType: artifact.mimeType.trim(),
          size,
          hash: artifact.hash.trim(),
          platform: artifact.platform.trim(),
          architecture: artifact.architecture.trim(),
          slug: artifact.slug.trim() || undefined,
          meta,
        })
        continue
      }
      const file = artifact.file
      if (!file) continue
      const hash = await sha256(file)
      const upload = await prepareDistributionUpload(productKey, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      })
      await uploadDistributionArtifact(upload, file, file.type || 'application/octet-stream', hash)
      await associateDistributionArtifact(productKey, releaseId, {
        objectKey: upload.objectKey,
        platform: artifact.platform.trim(),
        architecture: artifact.architecture.trim(),
        slug: artifact.slug.trim() || undefined,
        meta,
      })
    }
  }

  /** Create or update a release. Returns true when the drawer should close. */
  async function saveRelease(options: {
    editingId: string | null
    channels: string[]
    form: ReleaseFormState
  }): Promise<boolean> {
    if (!product.value || !options.channels.length) return false
    const { form } = options
    if (!form.localizations.some((entry) => entry.title.trim())) {
      toast.error(t('developer.apps.distribution.releaseTitleRequired'))
      return false
    }
    isSavingRelease.value = true
    try {
      const titles = localizedMap(form.localizations, 'title')
      const descriptions = localizedMap(form.localizations, 'description')
      const payload = {
        version: form.version,
        title: localizedFormFallback(titles, form.version),
        titles,
        channels: options.channels,
        releaseNotes: localizedFormFallback(descriptions, ''),
        descriptions,
        metadata: parseReleaseMetadata(form.metadataEntries),
        forceUpdate: form.forceUpdate,
        attachments: form.attachments,
      }
      if (options.editingId) {
        const release = await updateDistributionRelease(product.value.id, options.editingId, payload)
        await associateNewReleaseArtifacts(product.value.id, release.id, form.artifacts)
        await loadReleases()
      } else {
        const release = await createDistributionRelease(product.value.id, payload)
        releases.value = [release, ...releases.value]
      }
      toast.success(
        t(options.editingId ? 'developer.apps.distribution.releaseUpdated' : 'developer.apps.distribution.draftCreated'),
      )
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
      return false
    } finally {
      isSavingRelease.value = false
    }
  }

  async function publishRelease(releaseId: string) {
    if (!product.value) return
    publishingId.value = releaseId
    try {
      const release = await publishDistributionRelease(product.value.id, releaseId)
      releases.value = releases.value.map((item) => (item.id === release.id ? release : item))
      channels.value = channels.value.map((channel) =>
        channel.id === selectedChannel.value?.id ? { ...channel, latest: release } : channel,
      )
      toast.success(t('developer.apps.distribution.published'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      publishingId.value = null
    }
  }

  async function deleteRelease(release: DistributionRelease) {
    if (!product.value || release.status !== 'draft') return
    if (!(await confirm(
      t('developer.apps.distribution.deleteRelease'),
      t('developer.apps.distribution.deleteReleaseConfirm', { version: release.version }),
    ))) return
    deletingReleaseId.value = release.id
    try {
      await deleteDistributionRelease(product.value.id, release.id)
      releases.value = releases.value.filter((item) => item.id !== release.id)
      toast.success(t('developer.apps.distribution.releaseDeleted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      deletingReleaseId.value = null
    }
  }

  async function yankRelease(release: DistributionRelease) {
    if (!product.value || release.status !== 'published') return
    if (!(await confirm(
      t('developer.apps.distribution.yankRelease'),
      t('developer.apps.distribution.yankReleaseConfirm', { version: release.version }),
    ))) return
    yankingId.value = release.id
    try {
      const updatedRelease = await yankDistributionRelease(product.value.id, release.id)
      releases.value = releases.value.map((item) => (item.id === updatedRelease.id ? updatedRelease : item))
      toast.success(t('developer.apps.distribution.releaseYanked'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      yankingId.value = null
    }
  }

  /* --------------------------------------------------------------- metrics */

  const metrics = ref<DistributionMetrics | null>(null)
  const isLoadingMetrics = ref(false)
  const metricsRangeDays = ref(30)

  async function loadMetrics() {
    if (!product.value) return
    isLoadingMetrics.value = true
    try {
      const to = new Date()
      const from = new Date(to.getTime() - metricsRangeDays.value * 24 * 60 * 60 * 1000)
      metrics.value = await fetchDistributionMetrics(product.value.id, from.toISOString(), to.toISOString())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      isLoadingMetrics.value = false
    }
  }

  const metricGroups = computed<MetricGroup[]>(() => {
    if (!metrics.value) return []
    const entries = (map: Record<string, number> | undefined) =>
      Object.entries(map || {})
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
    return [
      { key: 'byVersion', label: t('developer.apps.distribution.byVersion'), entries: entries(metrics.value.byVersion) },
      { key: 'byChannel', label: t('developer.apps.distribution.channelsBreakdown'), entries: entries(metrics.value.byChannel) },
      { key: 'byPlatform', label: t('developer.apps.distribution.byPlatform'), entries: entries(metrics.value.byPlatform) },
      { key: 'byArchitecture', label: t('developer.apps.distribution.byArchitecture'), entries: entries(metrics.value.byArchitecture) },
      { key: 'byOSVersion', label: t('developer.apps.distribution.byOSVersion'), entries: entries(metrics.value.byOSVersion) },
      { key: 'byClientVersion', label: t('developer.apps.distribution.byClientVersion'), entries: entries(metrics.value.byClientVersion) },
      { key: 'byLocale', label: t('developer.apps.distribution.byLocale'), entries: entries(metrics.value.byLocale) },
    ].filter((group) => group.entries.length)
  })

  /* ---------------------------------------------------------- upload keys */

  const uploadApiKeys = ref<DistributionUploadApiKey[]>([])
  const isLoadingUploadApiKeys = ref(false)
  const isCreatingUploadApiKey = ref(false)
  const oneTimeUploadApiKey = ref('')

  async function loadUploadApiKeys() {
    if (!product.value) return
    isLoadingUploadApiKeys.value = true
    try {
      uploadApiKeys.value = await fetchDistributionUploadApiKeys(product.value.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      isLoadingUploadApiKeys.value = false
    }
  }

  async function createUploadApiKey(name: string) {
    if (!product.value || !name.trim()) return null
    isCreatingUploadApiKey.value = true
    try {
      const created = await createDistributionUploadApiKey(product.value.id, name.trim())
      uploadApiKeys.value = [created, ...uploadApiKeys.value]
      oneTimeUploadApiKey.value = created.key
      toast.success(t('developer.apps.distribution.uploadKeyCreatedToast'))
      return created.key
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
      return null
    } finally {
      isCreatingUploadApiKey.value = false
    }
  }

  async function deleteUploadApiKey(key: DistributionUploadApiKey) {
    if (!product.value) return
    if (!(await confirm(
      t('developer.apps.distribution.deleteUploadKey'),
      t('developer.apps.distribution.deleteUploadKeyConfirm'),
    ))) return
    try {
      await deleteDistributionUploadApiKey(product.value.id, key.id)
      uploadApiKeys.value = uploadApiKeys.value.filter((item) => item.id !== key.id)
      toast.success(t('developer.apps.distribution.uploadKeyDeleted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    }
  }

  /* -------------------------------------------------------- product edits */

  const isSavingProduct = ref(false)
  const isDeletingProduct = ref(false)

  /** Returns true when the drawer should close. */
  async function saveProduct(form: ProductFormState) {
    if (!product.value) return false
    if (!form.localizations.length || form.localizations.some((entry) => !entry.name.trim() || !entry.description.trim())) {
      toast.error(t('developer.apps.distribution.localizationRequired'))
      return false
    }
    isSavingProduct.value = true
    try {
      const names = localizedMap(form.localizations, 'name')
      const descriptions = localizedMap(form.localizations, 'description')
      product.value = await updateDistributionProduct(product.value.id, {
        slug: form.slug,
        name: localizedFormFallback(names, form.slug),
        names,
        description: localizedFormFallback(descriptions, ''),
        descriptions,
        icon: form.icon ?? undefined,
        background: form.background ?? undefined,
        previews: form.previews,
      })
      toast.success(t('developer.apps.distribution.productUpdated'))
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
      return false
    } finally {
      isSavingProduct.value = false
    }
  }

  async function deleteProduct() {
    if (!product.value) return
    if (!(await confirm(
      t('developer.apps.distribution.deleteProduct'),
      t('developer.apps.distribution.deleteProductConfirm', { name: product.value.name || product.value.slug }),
    ))) return
    isDeletingProduct.value = true
    try {
      await deleteDistributionProduct(product.value.id)
      await navigateTo(`/developers/${encodeURIComponent(toValue(publisherName))}/distribution`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      isDeletingProduct.value = false
    }
  }

  /* ---------------------------------------------------------------- channel */

  /** Returns true when the drawer should close. */
  async function saveChannel(options: { editingId: string | null; form: ChannelFormState }) {
    if (!product.value) return false
    const { form } = options
    if (!form.localizations.length || form.localizations.some((entry) => !entry.displayName.trim())) {
      toast.error(t('developer.apps.distribution.localizationRequired'))
      return false
    }
    isSavingChannel.value = true
    try {
      const artifactRetention = form.usePlatformDefault
        ? undefined
        : Math.max(0, Math.floor(Number(form.artifactRetention) || 0))
      const displayNames = localizedMap(form.localizations, 'displayName')
      const descriptions = localizedMap(form.localizations, 'description')
      const input = {
        displayName: localizedFormFallback(displayNames, form.name),
        displayNames,
        description: localizedFormFallback(descriptions, ''),
        descriptions,
        artifactRetention,
      }
      const channel = options.editingId
        ? await updateDistributionChannel(product.value.id, options.editingId, input)
        : await createDistributionChannel(product.value.id, { name: form.name, ...input })
      channels.value = channels.value.some((item) => item.id === channel.id)
        ? channels.value.map((item) => (item.id === channel.id ? channel : item))
        : [...channels.value, channel]
      const wasSelected = selectedChannel.value?.id === channel.id
      if (wasSelected) selectedChannel.value = channel
      await loadReleases()
      toast.success(t(options.editingId ? 'developer.apps.distribution.channelUpdated' : 'developer.apps.distribution.channelCreated'))
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
      return false
    } finally {
      isSavingChannel.value = false
    }
  }

  async function deleteChannel(channel: DistributionChannel) {
    if (!product.value || isBuiltinChannelName(channel.name)) return
    if (!(await confirm(
      t('developer.apps.distribution.deleteChannel'),
      t('developer.apps.distribution.deleteChannelConfirm', { name: channel.displayName || channel.name }),
    ))) return
    deletingChannelId.value = channel.id
    try {
      await deleteDistributionChannel(product.value.id, channel.id)
      channels.value = channels.value.filter((item) => item.id !== channel.id)
      if (selectedChannel.value?.id === channel.id) {
        selectedChannel.value = channels.value[0] || null
        await loadReleases()
      }
      toast.success(t('developer.apps.distribution.channelDeleted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
    } finally {
      deletingChannelId.value = null
    }
  }

  /* ----------------------------------------------------------------- misc */

  async function copyIdentifier(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('developer.apps.distribution.idCopied'))
    } catch {
      toast.error(t('developer.apps.distribution.copyFailed'))
    }
  }

  watch(
    [() => toValue(publisherName), () => toValue(productSlug)],
    async () => {
      product.value = null
      channels.value = []
      selectedChannel.value = null
      releases.value = []
      metrics.value = null
      uploadApiKeys.value = []
      oneTimeUploadApiKey.value = ''
      const publisher = toValue(publisherName)
      try {
        await developer.loadDevelopers()
        developer.selectByPublisherName(publisher)
      } catch {
        // Breadcrumb/portal context only — the product fetch reports real failures.
      }
      await loadProduct()
      await loadChannels()
      await loadReleases()
    },
    { immediate: true },
  )

  watch(metricsRangeDays, () => {
    if (metrics.value) loadMetrics()
  })

  // Breadcrumbs in the developer layout resolve the slug to this name.
  watch(product, (value) => {
    developer.setDistributionProduct(value ? { slug: value.slug, name: productName.value } : null)
  })

  useSolarSeo({
    title: computed(() => {
      const name = productName.value || toValue(productSlug)
      const brand = t('developer.apps.distribution.title')
      return sectionLabelKey ? `${name} · ${t(sectionLabelKey)} · ${brand}` : `${name} · ${brand}`
    }),
  })

  return {
    // identity
    product,
    productId,
    productName,
    isLoadingProduct,
    loadFailed,
    isHydrated,
    localizationLocales,
    contentLocale,
    contentLocaleOptions,
    localeName,
    localeOptionsFor,
    availableLocaleOptions,
    localizedValue,
    localizedFormFallback,
    localizedMap,
    productLocalizationEntries,
    channelLocalizationEntries,
    releaseLocalizationEntries,
    // channels
    channels,
    selectedChannel,
    isLoadingChannels,
    isSavingChannel,
    deletingChannelId,
    loadChannels,
    selectChannel,
    saveChannel,
    deleteChannel,
    channelRetentionLabel,
    // releases
    releases,
    isLoadingReleases,
    isSavingRelease,
    publishingId,
    deletingReleaseId,
    yankingId,
    publishedReleaseCount,
    selectedArtifactCount,
    loadReleases,
    saveRelease,
    publishRelease,
    deleteRelease,
    yankRelease,
    // metrics
    metrics,
    isLoadingMetrics,
    metricsRangeDays,
    loadMetrics,
    metricGroups,
    // upload keys
    uploadApiKeys,
    isLoadingUploadApiKeys,
    isCreatingUploadApiKey,
    oneTimeUploadApiKey,
    loadUploadApiKeys,
    createUploadApiKey,
    deleteUploadApiKey,
    // product edits
    isSavingProduct,
    isDeletingProduct,
    saveProduct,
    deleteProduct,
    // misc
    copyIdentifier,
    loadProduct,
  }
}
