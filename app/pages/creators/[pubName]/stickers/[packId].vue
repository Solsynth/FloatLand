<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <NuxtLink :to="`/creators/${pubName}/stickers`" class="btn btn-ghost btn-sm btn-circle">
            <IconArrowLeft class="w-4 h-4" />
          </NuxtLink>
          <h1 class="text-xl font-bold">{{ pack?.name || t('common.loading') }}</h1>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" @click="openStickerModal()">
            <IconPlus class="w-4 h-4" />
          </button>
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
              <IconMoreVertical class="w-4 h-4" />
            </label>
            <ul tabindex="0" class="dropdown-content menu z-[1] w-52 rounded-box bg-base-100 p-2 shadow">
              <li>
                <button @click="openPackModal">
                  <IconPencil class="w-4 h-4" /> {{ t('creator.edit') }}
                </button>
              </li>
              <li>
                <button class="text-error" @click="handleDeletePack">
                  <IconTrash class="w-4 h-4" /> {{ t('creator.stickers.deletePack') }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ConfuseSpinner v-if="packStatus === 'pending'" />

      <template v-else-if="pack">
        <!-- Pack Info -->
        <div class="card bg-base-100 shadow-sm mb-4">
          <div class="card-body p-4">
            <p class="text-sm text-base-content/70">{{ pack.description }}</p>
            <div class="flex flex-wrap gap-4 text-xs text-base-content/50 mt-2">
              <span class="flex items-center gap-1">
                <IconFolder class="w-3 h-3" />
                {{ t('creator.stickers.count', { count: stickers.length }) }}
              </span>
              <span class="flex items-center gap-1 font-mono">
                <IconTag class="w-3 h-3" />
                :{{ pack.prefix }}+slug:
              </span>
              <span class="flex items-center gap-1 font-mono">
                <IconHash class="w-3 h-3" />
                {{ pack.id }}
              </span>
            </div>
          </div>
        </div>

        <!-- Batch Actions Bar -->
        <div v-if="selectedIds.size > 0" class="alert alert-info mb-4">
          <span>{{ t('creator.common.selected', { count: selectedIds.size }) }}</span>
          <div class="flex gap-2">
            <button class="btn btn-sm" @click="openBatchModal">{{ t('creator.stickers.batchEdit') }}</button>
            <button class="btn btn-ghost btn-sm" @click="selectedIds = new Set()">{{ t('creator.common.clear')
              }}</button>
          </div>
        </div>

        <!-- Reorder Bar -->
        <div v-if="pendingOrder" class="alert alert-warning mb-4">
          <span>{{ t('creator.common.reordered', { count: pendingOrder.length }) }}</span>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" @click="pendingOrder = null">{{ t('creator.common.reset') }}</button>
            <button class="btn btn-primary btn-sm" @click="saveOrder">
              <IconSave class="w-4 h-4" /> {{ t('creator.common.saveOrder') }}
            </button>
          </div>
        </div>

        <!-- Stickers Table -->
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th class="w-10"></th>
                <th>{{ t('creator.common.preview') }}</th>
                <th>{{ t('creator.common.name') }}</th>
                <th>{{ t('creator.common.slug') }}</th>
                <th>{{ t('creator.common.code') }}</th>
                <th>{{ t('creator.stickers.size') }}</th>
                <th>{{ t('creator.stickers.mode') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sticker, idx) in displayList" :key="sticker.id" class="hover">
                <td>
                  <input type="checkbox" class="checkbox checkbox-xs" :checked="selectedIds.has(sticker.id)"
                    @change="toggleSelect(sticker.id)" />
                </td>
                <td>
                  <div class="w-10 h-10 rounded bg-base-200 overflow-hidden">
                    <FileImage v-if="sticker.image" :file="sticker.image"
                      class="w-full h-full object-contain" :alt="sticker.name || sticker.slug" />
                  </div>
                </td>
                <td class="max-w-[140px] truncate">{{ sticker.name || '-' }}</td>
                <td class="font-mono text-xs">{{ sticker.slug }}</td>
                <td class="font-mono text-xs">:{{ pack.prefix }}+{{ sticker.slug }}:</td>
                <td class="text-xs">{{ sizeLabel(sticker.size) }}</td>
                <td class="text-xs">{{ modeLabel(sticker.mode) }}</td>
                <td>
                  <div class="flex gap-1">
                    <button v-if="idx > 0" class="btn btn-ghost btn-xs" @click="moveItem(idx, idx - 1)">
                      <IconArrowUp class="w-3 h-3" />
                    </button>
                    <button v-if="idx < displayList.length - 1" class="btn btn-ghost btn-xs"
                      @click="moveItem(idx, idx + 1)">
                      <IconArrowDown class="w-3 h-3" />
                    </button>
                    <button class="btn btn-ghost btn-xs" @click="editSticker(sticker)">
                      <IconPencil class="w-3 h-3" />
                    </button>
                    <button class="btn btn-ghost btn-xs text-error" @click="handleDeleteSticker(sticker.id)">
                      <IconTrash class="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Add/Edit Sticker Drawer -->
      <AdminDrawer :open="stickerModalOpen" :title="editingSticker ? t('creator.edit') : t('creator.stickers.create')"
        @update:open="stickerModalOpen = $event">
        <StickerForm :pack-id="packId" :sticker="editingSticker" @close="closeStickerModal"
          @saved="handleStickerSaved" />
      </AdminDrawer>

      <!-- Edit Pack Drawer -->
      <AdminDrawer :open="packModalOpen" :title="t('creator.edit')" @update:open="packModalOpen = $event">
        <StickerPackForm :pub-name="pubName" :pack="pack" @close="closePackModal" @saved="handlePackSaved" />
      </AdminDrawer>

      <!-- Batch Edit Drawer -->
      <AdminDrawer :open="batchModalOpen" :title="t('creator.stickers.batchEdit')"
        @update:open="batchModalOpen = $event">
        <BatchStickerEdit :pack-id="packId" :sticker-ids="Array.from(selectedIds)" @close="closeBatchModal"
          @saved="handleBatchSaved" />
      </AdminDrawer>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconPlus,
  IconMoreVertical,
  IconPencil,
  IconTrash,
  IconFolder,
  IconTag,
  IconHash,
  IconArrowUp,
  IconArrowDown,
  IconSave,
} from '#components'
import type { SnSticker } from '~/types/creator'
import {
  fetchStickerPack,
  fetchStickerPackContent,
  deleteStickerPack,
  deleteSticker,
  reorderStickers,
} from '~/utils/creator'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)
const packId = computed(() => route.params.packId as string)

defineOgImage('UniOgImage', { title: t('creator.stickers.title') })

useSolarSeo({ title: t('creator.stickers.title') })

const { data: pack, status: packStatus } = await useAsyncData(
  `sticker-pack-${packId.value}`,
  () => fetchStickerPack(packId.value),
)

const { data: stickers, refresh: refreshStickers } = await useAsyncData(
  `sticker-pack-content-${packId.value}`,
  () => fetchStickerPackContent(packId.value),
)

const selectedIds = ref<Set<string>>(new Set())
const pendingOrder = ref<string[] | null>(null)
const editingSticker = ref<SnSticker | null>(null)
const stickerModalOpen = ref(false)
const packModalOpen = ref(false)
const batchModalOpen = ref(false)

const displayList = computed(() => {
  const order = pendingOrder.value
  const items = stickers.value ?? []
  if (!order) return items
  return order.map((id) => items.find((s) => s.id === id)).filter(Boolean) as SnSticker[]
})

function openStickerModal(sticker?: SnSticker) {
  editingSticker.value = sticker ?? null
  stickerModalOpen.value = true
}

function closeStickerModal() {
  stickerModalOpen.value = false
}

function openPackModal() {
  packModalOpen.value = true
}

function closePackModal() {
  packModalOpen.value = false
}

function openBatchModal() {
  batchModalOpen.value = true
}

function closeBatchModal() {
  batchModalOpen.value = false
}

function handleStickerSaved() {
  closeStickerModal()
  refreshStickers()
}

function handlePackSaved() {
  closePackModal()
  refreshNuxtData(`sticker-pack-${packId.value}`)
}

function handleBatchSaved() {
  closeBatchModal()
  selectedIds.value = new Set()
  refreshStickers()
}

async function handleDeletePack() {
  if (!(await useAlert().confirm('Confirm', t('creator.stickers.deletePackConfirm')))) return
  await deleteStickerPack(packId.value)
  navigateTo(`/creators/${pubName.value}/stickers`)
}

async function handleDeleteSticker(stickerId: string) {
  if (!(await useAlert().confirm('Confirm', t('creator.stickers.deleteSticker')))) return
  await deleteSticker(packId.value, stickerId)
  await refreshStickers()
}
</script>
