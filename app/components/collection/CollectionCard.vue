<template>
  <button
    type="button"
    class="group relative block aspect-[16/7] w-full overflow-hidden rounded-box bg-base-200 text-left transition-shadow hover:shadow-md"
    @click="emit('select', collection)"
  >
    <FileImage
      v-if="collection.background"
      :file="collection.background"
      :alt="title"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <div v-else class="absolute inset-0 bg-gradient-to-br from-base-300 to-base-200" />

    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
      <div class="flex items-end gap-3">
        <div class="h-10 w-10 shrink-0 overflow-hidden rounded-box bg-base-100/90 shadow-sm">
          <FileImage
            v-if="collection.icon"
            :file="collection.icon"
            :alt="title"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-primary">
            <IconFolder class="h-5 w-5" />
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold leading-tight text-white drop-shadow">
            {{ title }}
          </p>
          <p
            v-if="collection.description"
            class="mt-0.5 line-clamp-2 text-xs text-white/80 drop-shadow"
          >
            {{ collection.description }}
          </p>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { PostCollection } from '~/types/post'
import { IconFolder } from '#components'

const props = defineProps<{
  collection: PostCollection
}>()

const emit = defineEmits<{
  select: [collection: PostCollection]
}>()

const title = computed(() => props.collection.name || props.collection.slug)
</script>
