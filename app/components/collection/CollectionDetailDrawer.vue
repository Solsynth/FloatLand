<template>
  <AdminDrawer :open="open" @update:open="emit('update:open', $event)">
    <template #header>
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <div class="h-9 w-9 shrink-0 overflow-hidden rounded-box bg-base-200">
          <FileImage
            v-if="collection?.icon"
            :file="collection.icon"
            :alt="title"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-primary">
            <IconFolder class="h-4 w-4" />
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-base font-bold">{{ title }}</h3>
          <p class="truncate text-xs text-base-content/50">
            {{ publisherName }} · {{ collection?.slug }}
          </p>
        </div>
        <slot name="actions" />
      </div>
    </template>

    <div class="space-y-4">
      <div v-if="collection?.background" class="aspect-[16/7] overflow-hidden rounded-box">
        <FileImage
          :file="collection.background"
          :alt="title"
          class="h-full w-full object-cover"
        />
      </div>

      <p v-if="collection?.description" class="text-sm leading-relaxed text-base-content/70">
        {{ collection.description }}
      </p>

      <NuxtLink
        v-if="showPublisher && publisher"
        :to="`/publishers/${publisher.name}`"
        class="flex items-center gap-3 rounded-box bg-base-200/60 p-3 transition-colors hover:bg-base-200"
      >
        <PublisherAvatar :publisher="publisher" />
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium">{{ getDisplayName(publisher) }}</p>
          <p class="truncate text-xs text-base-content/50">@{{ publisher.name }}</p>
          <p v-if="publisher.bio" class="mt-1 line-clamp-2 text-xs text-base-content/60">
            {{ publisher.bio }}
          </p>
        </div>
        <IconExternalLink class="h-4 w-4 shrink-0 text-base-content/30" />
      </NuxtLink>

      <CollectionPostList
        v-if="collection"
        :publisher-name="publisherName"
        :slug="collection.slug"
      />
    </div>
  </AdminDrawer>
</template>

<script setup lang="ts">
import type { PostCollection, Publisher } from '~/types/post'
import { fetchPublisher } from '~/utils/api'
import { getDisplayName } from '~/utils/identity'
import { IconFolder, IconExternalLink } from '#components'

const props = withDefaults(defineProps<{
  open: boolean
  publisherName: string
  collection: PostCollection | null
  /** Show the owning publisher card (redundant on the publisher's own page). */
  showPublisher?: boolean
}>(), {
  showPublisher: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const title = computed(() => props.collection?.name || props.collection?.slug || '')

const publisher = ref<Publisher | null>(null)

async function loadPublisher() {
  if (!props.showPublisher || !props.open || !props.publisherName) return
  if (publisher.value?.name === props.publisherName) return
  try {
    publisher.value = await fetchPublisher(props.publisherName)
  } catch {
    publisher.value = null
  }
}

watch(
  () => [props.showPublisher, props.open, props.publisherName] as const,
  loadPublisher,
  { immediate: true },
)
</script>
