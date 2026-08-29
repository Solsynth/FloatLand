<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">{{ t('creator.collections.title') }}</h1>
        <button class="btn btn-primary btn-sm" @click="openEditor(null)">
          <IconPlus class="w-4 h-4" />
          {{ t('creator.collections.create') }}
        </button>
      </div>

      <ConfuseSpinner v-if="status === 'pending'" />

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <div v-else-if="!collections?.length" class="text-center py-12 text-base-content/50">
        {{ t('creator.collections.empty') }}
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="col in collections"
          :key="col.slug"
          class="card bg-base-100 shadow-sm cursor-pointer transition-all hover:shadow-md"
          @click="openDetail(col)"
        >
          <div class="card-body p-4 flex-row items-center gap-4">
            <div class="avatar">
              <div class="w-10 rounded">
                <FileImage v-if="col.icon" :file="col.icon" :alt="col.name || col.slug" />
                <div v-else class="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
                  <IconFolder class="w-5 h-5" />
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium">{{ col.name || col.slug }}</div>
              <div class="text-sm text-base-content/50">{{ col.slug }}</div>
            </div>
            <IconChevronRight class="w-4 h-4 text-base-content/30" />
          </div>
        </div>
      </div>

      <!-- Editor Drawer -->
      <AdminDrawer
        :open="editorModalOpen"
        :title="editingCollection ? t('creator.edit') : t('creator.collections.create')"
        @update:open="editorModalOpen = $event"
      >
        <CollectionForm
          :collection="editingCollection"
          :pub-name="pubName"
          @close="closeEditor"
          @saved="handleSaved"
        />
      </AdminDrawer>

      <!-- Detail Drawer -->
      <AdminDrawer
        :open="detailModalOpen"
        @update:open="detailModalOpen = $event"
      >
        <template #header>
          <h3 class="font-bold text-lg truncate">{{ detailCollection?.name || detailCollection?.slug }}</h3>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" @click="openEditor(detailCollection); closeDetail()">
              <IconPencil class="w-4 h-4" />
            </button>
            <button class="btn btn-ghost btn-sm text-error" @click="handleDelete">
              <IconTrash class="w-4 h-4" />
            </button>
          </div>
        </template>
        <p v-if="detailCollection?.description" class="text-sm text-base-content/70 mb-4">
          {{ detailCollection.description }}
        </p>
        <div class="text-center py-4 text-base-content/50 text-sm">
          {{ t('creator.posts.title') }}
        </div>
      </AdminDrawer>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconPlus,
  IconFolder,
  IconChevronRight,
  IconPencil,
  IconTrash,
  IconX,
} from '#components'
import type { SnPostCollection } from '~/types/creator'
import { fetchCollections, deleteCollection } from '~/utils/creator'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher } = creator

defineOgImage('UniOgImage', { title: computed(() => `${t('creator.collections.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

useSolarSeo({ title: computed(() => `${t('creator.collections.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

const { data: collections, status, error, refresh } = await useAsyncData(
  `creator-collections-${pubName.value}`,
  () => fetchCollections(pubName.value),
)

const editingCollection = ref<SnPostCollection | null>(null)
const detailCollection = ref<SnPostCollection | null>(null)
const editorModalOpen = ref(false)
const detailModalOpen = ref(false)

function openEditor(col: SnPostCollection | null) {
  editingCollection.value = col
  editorModalOpen.value = true
}

function closeEditor() {
  editorModalOpen.value = false
}

function openDetail(col: SnPostCollection) {
  detailCollection.value = col
  detailModalOpen.value = true
}

function closeDetail() {
  detailModalOpen.value = false
}

function handleSaved() {
  closeEditor()
  refresh()
}

async function handleDelete() {
  if (!detailCollection.value) return
  if (!(await useAlert().confirm('Confirm', t('creator.collections.deleteConfirm')))) return
  try {
    await deleteCollection(pubName.value, detailCollection.value.slug)
    closeDetail()
    refresh()
  } catch (e) {
    console.error(e)
  }
}
</script>
