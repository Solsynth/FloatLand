<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Collections" description="Review and moderate publisher post collections" />

    <AdminCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search collections or publishers..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <input
          v-model="publisherId"
          type="text"
          placeholder="Publisher ID..."
          class="input input-sm w-48 rounded-box border-0 bg-base-200 font-mono"
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-sm btn-primary" @click="handleSearch">
          <IconSearch class="w-4 h-4" />
          Search
        </button>
      </div>
    </AdminCard>

    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5">Collection</th>
              <th>Publisher</th>
              <th>Items</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="col in collections" :key="col.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <div class="text-sm font-medium">{{ col.name || col.slug }}</div>
                <div class="text-xs text-base-content/40 font-mono">{{ col.slug }}</div>
                <div v-if="col.description" class="text-xs text-base-content/40 truncate max-w-[18rem] mt-0.5">
                  {{ col.description }}
                </div>
              </td>
              <td>
                <NuxtLink
                  v-if="col.publisher"
                  :to="`/admin/publishers/${col.publisher.name}`"
                  class="text-sm link link-hover"
                >
                  {{ col.publisher.nick || col.publisher.name }}
                </NuxtLink>
                <span v-else class="text-sm text-base-content/40">—</span>
              </td>
              <td>
                <span class="text-sm tabular-nums">{{ col.itemCount ?? 0 }}</span>
              </td>
              <td class="pr-5 text-right">
                <div class="flex justify-end gap-1">
                  <button class="btn btn-ghost btn-xs" @click="openEdit(col)">
                    <IconPencil class="w-3.5 h-3.5" />
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" @click="remove(col)">
                    <IconTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="collections.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconLayers class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No collections found</p>
      </div>

      <div v-if="total > pageSize" class="flex items-center justify-between px-5 py-3">
        <span class="text-xs text-base-content/40">
          Showing {{ offset + 1 }}–{{ Math.min(offset + pageSize, total) }} of {{ total }}
        </span>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-xs" :disabled="offset === 0" @click="prevPage">
            <IconChevronLeft class="w-3.5 h-3.5" />
          </button>
          <button class="btn btn-ghost btn-xs" :disabled="offset + pageSize >= total" @click="nextPage">
            <IconChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </AdminCard>

    <AdminDrawer :open="drawerOpen" title="Edit Collection" @update:open="drawerOpen = $event">
      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text text-xs mb-1">Name</span>
          <input v-model="form.name" class="input input-sm rounded-box border-0 bg-base-200" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">Description</span>
          <textarea v-model="form.description" class="textarea textarea-sm rounded-box border-0 bg-base-200" rows="4" />
        </label>
        <button class="btn btn-sm btn-primary w-full" :disabled="saving" @click="save">
          {{ saving ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </AdminDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconPencil,
  IconTrash2,
  IconLayers,
  IconChevronLeft,
  IconChevronRight,
} from '#components'
import type { AdminCollection } from '~/types/admin'
import {
  fetchAdminCollections,
  updateAdminCollection,
  deleteAdminCollection,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const { destructive } = useAlert()
const collections = ref<AdminCollection[]>([])
const total = ref(0)
const isLoading = ref(false)
const pageSize = 50
const offset = ref(0)
const searchQuery = ref('')
const publisherId = ref('')

const drawerOpen = ref(false)
const editing = ref<AdminCollection | null>(null)
const saving = ref(false)
const form = ref({ name: '', description: '' })

async function load() {
  isLoading.value = true
  try {
    const result = await fetchAdminCollections({
      query: searchQuery.value || undefined,
      publisherId: publisherId.value || undefined,
      take: pageSize,
      offset: offset.value,
    })
    collections.value = result.items
    total.value = result.total
  } catch {
    collections.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

function openEdit(col: AdminCollection) {
  editing.value = col
  form.value = {
    name: col.name || '',
    description: col.description || '',
  }
  drawerOpen.value = true
}

async function save() {
  if (!editing.value || saving.value) return
  saving.value = true
  try {
    await updateAdminCollection(editing.value.id, {
      name: form.value.name || undefined,
      description: form.value.description || undefined,
    })
    useNuxtApp().$toast.success('Collection updated')
    drawerOpen.value = false
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function remove(col: AdminCollection) {
  const ok = await destructive(
    'Delete collection',
    `Delete “${col.name || col.slug}”? This cannot be undone.`,
  )
  if (!ok) return
  try {
    await deleteAdminCollection(col.id)
    useNuxtApp().$toast.success('Collection deleted')
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Delete failed')
  }
}

function handleSearch() {
  offset.value = 0
  load()
}

function prevPage() {
  offset.value = Math.max(0, offset.value - pageSize)
  load()
}

function nextPage() {
  offset.value += pageSize
  load()
}

onMounted(() => load())
</script>
