<template>
  <DrawerRoot v-model:open="open">
    <DrawerPortal>
      <DrawerOverlay class="fixed inset-0 z-[60] bg-black/40" />
      <DrawerContent
        class="fixed bottom-0 left-0 right-0 z-[60] mx-auto flex max-h-[40vh] max-w-md flex-col overflow-hidden rounded-t-box bg-base-100 shadow-sm outline-none"
      >
        <div class="flex justify-center pb-1 pt-3">
          <div class="h-1 w-10 rounded-full bg-base-content/20" />
        </div>
        <div class="flex items-center justify-between px-5 pb-3">
          <h3 class="font-semibold">{{ t('compose.selectPublisher') }}</h3>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square"
            @click="open = false"
          >
            <IconX class="h-4 w-4" />
          </button>
        </div>

        <!-- Empty state (mirrors Flutter publishersEmpty) -->
        <div
          v-if="publishers.length === 0"
          class="flex flex-col items-center gap-2 px-6 pb-8 text-center"
        >
          <p class="text-base font-bold">{{ t('compose.publishersEmpty') }}</p>
          <p class="text-sm text-base-content/60">
            {{ t('compose.publishersEmptyDescription') }}
          </p>
          <NuxtLink
            :to="'/creators'"
            class="btn btn-primary btn-sm mt-3"
            @click="open = false"
          >
            {{ t('creator.createPublisher') }}
          </NuxtLink>
        </div>

        <!-- Publisher list (mirrors Flutter ListTiles) -->
        <div v-else class="flex-1 overflow-y-auto px-2 pb-3">
          <button
            v-for="pub in publishers"
            :key="pub.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-base-200"
            :class="{ 'bg-primary/10': currentPublisherId === pub.id }"
            @click="select(pub)"
          >
            <div class="avatar">
              <div class="h-10 w-10 rounded-full">
                <FileImage
                  v-if="pub.picture?.id"
                  :file="pub.picture"
                  :alt="pub.nick || pub.name"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-base-200 text-xs font-bold"
                >
                  {{ getInitials(pub.nick || pub.name) }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">
                {{ pub.nick || pub.name }}
              </div>
              <div class="truncate text-xs text-base-content/40">
                @{{ pub.name }}
              </div>
            </div>
            <IconCheck
              v-if="currentPublisherId === pub.id"
              class="h-4 w-4 shrink-0 text-primary"
            />
          </button>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<script setup lang="ts">
import type { Publisher } from '~/types/post'
import { getInitials } from '~/utils/identity'
import { IconX, IconCheck } from '#components'
import {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
} from 'vaul-vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    publishers: Publisher[]
    currentPublisherId?: string | null
  }>(),
  { currentPublisherId: null },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
  select: [publisher: Publisher]
}>()

const { t } = useI18n()

const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

function select(pub: Publisher) {
  emit('select', pub)
  open.value = false
}
</script>
