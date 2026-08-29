<template>
  <UnLazyImage
    v-if="imageSrc"
    :src="imageSrc"
    :blurhash="blurhashValue"
    :placeholder-ratio="placeholderRatio"
    :loading="loading"
    :class="{ 'file-image-loaded': loaded }"
    @image-load="handleImageLoad"
    v-bind="$attrs"
  />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
import type { FileAttachment } from '~/types/post'

interface FileLike {
  id?: string | null
  blurhash?: string | null
  width?: number | null
  height?: number | null
  url?: string | null
  ratio?: number | null
  fileMeta?: { blurhash?: string | null; width?: number | null; height?: number | null } & Record<string, unknown>
}

interface Props {
  /**
   * A Solian file object (FileAttachment, SnCloudFile, realm/chat picture,
   * wallet app image, …). URL is derived from its id via getFileUrl, and its
   * blurhash (when present) powers the unlazy blurry placeholder.
   */
  file?: FileLike | null
  /**
   * Direct image URL. Takes precedence over `file`.
   */
  src?: string
  /**
   * Loading strategy for the underlying image.
   */
  loading?: 'lazy' | 'eager'
}

const props = withDefaults(defineProps<Props>(), {
  file: null,
  src: '',
  loading: 'lazy',
})

const { getFileUrl } = useFileUrls()

// Fade the real image in once unlazy swaps the placeholder for it.
const loaded = ref(false)

const imageSrc = computed(() => {
  if (props.src) return props.src
  if (props.file?.url) return props.file.url
  return props.file?.id ? getFileUrl(props.file.id) : null
})

const blurhashValue = computed(() => {
  if (!props.file) return undefined
  const meta = props.file.fileMeta
  return props.file.blurhash || meta?.blurhash || undefined
})

// Aspect ratio for SSR blurhash decoding; avoids layout shift before load.
const placeholderRatio = computed(() => {
  const file = props.file
  if (!file) return undefined
  const meta = file.fileMeta
  const width = file.width ?? meta?.width ?? undefined
  const height = file.height ?? meta?.height ?? undefined
  if (width && height && height > 0) return width / height
  if (file.ratio && file.ratio > 0) return file.ratio
  return undefined
})

// Reset on source change so a recycled component fades again.
watch(imageSrc, () => {
  loaded.value = false
})

function handleImageLoad() {
  loaded.value = true
}
</script>
