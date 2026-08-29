<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">{{ t('creator.stickers.title') }}</h1>
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          <IconPlus class="w-4 h-4" />
          {{ t('creator.stickers.create') }}
        </button>
      </div>

      <ConfuseSpinner v-if="status === 'pending'" />

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <div v-else class="space-y-2">
        <NuxtLink
          v-for="pack in packs"
          :key="pack.id"
          :to="`/creators/${pubName}/stickers/${pack.id}`"
          class="card bg-base-100 shadow-sm cursor-pointer transition-all hover:shadow-md block"
        >
          <div class="card-body p-4 flex-row items-center gap-4">
            <div class="avatar">
              <div class="w-12 rounded-lg">
                <FileImage v-if="pack.icon" :file="pack.icon" :alt="pack.name" />
                <div v-else class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconSticker class="w-6 h-6" />
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium">{{ pack.name }}</div>
              <div class="text-sm text-base-content/50 line-clamp-1">{{ pack.description }}</div>
              <div class="text-xs text-base-content/40 font-mono mt-1">:{{ pack.prefix }}+slug:</div>
            </div>
            <IconChevronRight class="w-4 h-4 text-base-content/30" />
          </div>
        </NuxtLink>

        <div v-if="hasMore" class="flex justify-center py-4">
          <button class="btn btn-ghost btn-sm" @click="loadMore">
            {{ t('common.loadMore') }}
          </button>
        </div>
      </div>

      <!-- Create Drawer -->
      <AdminDrawer
        :open="createModalOpen"
        :title="t('creator.stickers.create')"
        @update:open="createModalOpen = $event"
      >
        <StickerPackForm :pub-name="pubName" @close="closeCreateModal" @saved="handlePackCreated" />
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconPlus, IconSticker, IconChevronRight } from '#components'
import type { SnStickerPack } from '~/types/creator'
import { fetchStickerPacks } from '~/utils/creator'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher } = creator

defineOgImage('UniOgImage', { title: computed(() => `${t('creator.stickers.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

useSolarSeo({ title: computed(() => `${t('creator.stickers.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

const packs = ref<SnStickerPack[]>([])
const offset = ref(0)
const total = ref(0)
const hasMore = computed(() => packs.value.length < total.value)
const createModalOpen = ref(false)

const { status, error } = await useAsyncData(
  `creator-sticker-packs-${pubName.value}`,
  async () => {
    const result = await fetchStickerPacks(pubName.value)
    packs.value = result.items
    total.value = result.total
    offset.value = result.items.length
    return result
  },
)

function openCreateModal() {
  createModalOpen.value = true
}

function closeCreateModal() {
  createModalOpen.value = false
}

async function loadMore() {
  const result = await fetchStickerPacks(pubName.value, offset.value)
  packs.value = [...packs.value, ...result.items]
  offset.value += result.items.length
}

function handlePackCreated() {
  closeCreateModal()
  offset.value = 0
  fetchStickerPacks(pubName.value).then((result) => {
    packs.value = result.items
    total.value = result.total
    offset.value = result.items.length
  })
}
</script>
