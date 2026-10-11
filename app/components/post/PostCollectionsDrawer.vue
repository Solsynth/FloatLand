<template>
  <AdminDrawer
    :open="open"
    :title="t('post.collections.manage')"
    @update:open="emit('update:open', $event)"
  >
    <ConfuseSpinner v-if="loading && collections.length === 0" />

    <p
      v-else-if="collections.length === 0"
      class="py-10 text-center text-sm text-base-content/50"
    >
      {{ t('post.collections.empty') }}
    </p>

    <ul v-else class="space-y-1">
      <li v-for="collection in collections" :key="collection.slug">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-box px-3 py-2.5 text-left transition-colors hover:bg-base-200 disabled:opacity-60"
          :disabled="busySlug !== null"
          @click="toggle(collection)"
        >
          <IconLoader
            v-if="busySlug === collection.slug"
            class="h-4 w-4 shrink-0 animate-spin text-primary"
          />
          <IconCircleCheck
            v-else-if="isSelected(collection)"
            class="h-4 w-4 shrink-0 text-primary"
          />
          <IconCircle v-else class="h-4 w-4 shrink-0 text-base-content/30" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">
              {{ collection.name || collection.slug }}
            </span>
            <span
              v-if="collection.description"
              class="block truncate text-xs text-base-content/50"
            >
              {{ collection.description }}
            </span>
          </span>
        </button>
      </li>
    </ul>
  </AdminDrawer>
</template>

<script setup lang="ts">
import type { Post, PostCollection } from '~/types/post'
import {
  addPostToCollection,
  fetchPublisherCollections,
  removePostFromCollection,
} from '~/utils/api'
import { IconLoader, IconCircleCheck, IconCircle } from '#components'

const props = defineProps<{
  open: boolean
  post: Post
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  /** Membership changed server-side; the owner should refetch the post. */
  changed: []
}>()

const { t } = useI18n()
const toast = useAppToast()

const publisherName = computed(() => props.post.publisher?.name ?? '')
const collections = ref<PostCollection[]>([])
const selected = ref<string[]>([])
const loading = ref(false)
const busySlug = ref<string | null>(null)

function isSelected(collection: PostCollection) {
  return selected.value.includes(collection.slug)
}

async function load() {
  if (!publisherName.value) return
  loading.value = true
  try {
    collections.value = await fetchPublisherCollections(publisherName.value)
  } catch {
    collections.value = []
  } finally {
    loading.value = false
  }
}

async function toggle(collection: PostCollection) {
  if (busySlug.value || !publisherName.value) return
  const wasSelected = isSelected(collection)
  busySlug.value = collection.slug
  selected.value = wasSelected
    ? selected.value.filter((slug) => slug !== collection.slug)
    : [...selected.value, collection.slug]
  try {
    if (wasSelected) {
      await removePostFromCollection(publisherName.value, collection.slug, props.post.id)
    } else {
      await addPostToCollection(publisherName.value, collection.slug, props.post.id)
    }
    emit('changed')
  } catch {
    // Roll the optimistic toggle back; the server is the source of truth.
    selected.value = wasSelected
      ? [...selected.value, collection.slug]
      : selected.value.filter((slug) => slug !== collection.slug)
    toast.error(t('post.collections.updateFailed'))
  } finally {
    busySlug.value = null
  }
}

watch(
  () => [props.open, props.post.id, publisherName.value] as const,
  ([open]) => {
    if (!open) return
    selected.value = (props.post.publisherCollections ?? []).map((c) => c.slug)
    load()
  },
  { immediate: true },
)
</script>
