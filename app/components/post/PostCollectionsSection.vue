<template>
  <section v-if="collections.length > 0" class="card bg-base-100 shadow-sm">
    <div class="card-body gap-3 p-4">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          {{ t('post.collections.title') }}
        </p>
        <span class="text-xs text-base-content/45">{{ t('post.collections.hint') }}</span>
      </div>

      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-box bg-base-200/60 p-3 text-left transition-colors hover:bg-base-200"
        @click="openCollection(first)"
      >
        <div class="h-10 w-10 shrink-0 overflow-hidden rounded-box bg-base-100">
          <FileImage
            v-if="first.icon"
            :file="first.icon"
            :alt="titleOf(first)"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-primary">
            <IconFolder class="h-4 w-4" />
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">{{ titleOf(first) }}</p>
          <p v-if="first.description" class="truncate text-xs text-base-content/60">
            {{ first.description }}
          </p>
        </div>
        <IconChevronRight class="h-4 w-4 shrink-0 text-base-content/30" />
      </button>

      <button
        v-if="collections.length > 1"
        type="button"
        class="btn btn-ghost btn-sm gap-1.5 self-start"
        @click="browserOpen = true"
      >
        <IconLayers class="h-4 w-4" />
        {{ t('post.collections.more', { count: collections.length - 1 }) }}
      </button>
    </div>

    <CollectionDetailDrawer
      v-model:open="detailOpen"
      :publisher-name="publisherName"
      :collection="active"
      :show-publisher="true"
    />

    <AdminDrawer
      v-model:open="browserOpen"
      :title="t('post.collections.title')"
      direction="bottom"
    >
      <div class="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
        <CollectionCard
          v-for="collection in collections"
          :key="collection.slug"
          :collection="collection"
          @select="openCollection"
        />
      </div>
    </AdminDrawer>
  </section>
</template>

<script setup lang="ts">
import type { Post, PostCollection } from '~/types/post'
import { IconFolder, IconChevronRight, IconLayers } from '#components'

const props = defineProps<{
  post: Post
}>()

const { t } = useI18n()

const collections = computed<PostCollection[]>(() => props.post.publisherCollections ?? [])
const publisherName = computed(() => props.post.publisher?.name ?? '')
const first = computed(() => collections.value[0]!)

const active = ref<PostCollection | null>(null)
const detailOpen = ref(false)
const browserOpen = ref(false)

function titleOf(collection: PostCollection) {
  return collection.name || collection.slug
}

function openCollection(collection: PostCollection) {
  active.value = collection
  browserOpen.value = false
  detailOpen.value = true
}
</script>
