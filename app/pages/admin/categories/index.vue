<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Categories" description="Manage global post categories">
      <template #actions>
        <button class="btn btn-sm btn-primary" @click="openCreate">
          <IconPlus class="w-4 h-4" />
          New Category
        </button>
      </template>
    </AdminPageHeader>

    <AdminCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search categories..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <select v-model="order" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
          <option value="">Recently updated</option>
          <option value="usage">Most used</option>
          <option value="name">Name A–Z</option>
          <option value="created">Newest</option>
        </select>
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
              <th class="pl-5">Category</th>
              <th>Slug</th>
              <th>Usage</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <div class="text-sm font-medium">{{ cat.name || cat.slug }}</div>
              </td>
              <td>
                <span class="text-xs font-mono text-base-content/50">{{ cat.slug }}</span>
              </td>
              <td>
                <span class="text-sm tabular-nums">{{ cat.usage ?? 0 }}</span>
              </td>
              <td class="pr-5 text-right">
                <div class="flex justify-end gap-1">
                  <button class="btn btn-ghost btn-xs" @click="openEdit(cat)">
                    <IconPencil class="w-3.5 h-3.5" />
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" @click="remove(cat)">
                    <IconTrash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="categories.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconFolder class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No categories found</p>
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

    <AdminDrawer :open="drawerOpen" :title="editing ? 'Edit Category' : 'Create Category'" @update:open="drawerOpen = $event">
      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text text-xs mb-1">Slug</span>
          <input v-model="form.slug" class="input input-sm rounded-box border-0 bg-base-200" :disabled="!!editing" placeholder="tech" />
        </label>
        <label v-if="editing" class="form-control">
          <span class="label-text text-xs mb-1">New slug (optional rename)</span>
          <input v-model="form.newSlug" class="input input-sm rounded-box border-0 bg-base-200" placeholder="technology" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">Name</span>
          <input v-model="form.name" class="input input-sm rounded-box border-0 bg-base-200" placeholder="Technology" />
        </label>
        <button class="btn btn-sm btn-primary w-full" :disabled="saving || !form.slug" @click="save">
          {{ saving ? 'Saving...' : editing ? 'Save changes' : 'Create category' }}
        </button>
      </div>
    </AdminDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconPlus,
  IconPencil,
  IconTrash2,
  IconFolder,
  IconChevronLeft,
  IconChevronRight,
} from '#components'
import type { AdminCategory } from '~/types/admin'
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const { destructive } = useAlert()
const categories = ref<AdminCategory[]>([])
const total = ref(0)
const isLoading = ref(false)
const pageSize = 50
const offset = ref(0)
const searchQuery = ref('')
const order = ref('')

const drawerOpen = ref(false)
const editing = ref<AdminCategory | null>(null)
const saving = ref(false)
const form = ref({ slug: '', newSlug: '', name: '' })

async function load() {
  isLoading.value = true
  try {
    const result = await fetchAdminCategories({
      query: searchQuery.value || undefined,
      order: order.value || undefined,
      take: pageSize,
      offset: offset.value,
    })
    categories.value = result.items
    total.value = result.total
  } catch {
    categories.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { slug: '', newSlug: '', name: '' }
  drawerOpen.value = true
}

function openEdit(cat: AdminCategory) {
  editing.value = cat
  form.value = { slug: cat.slug, newSlug: '', name: cat.name || '' }
  drawerOpen.value = true
}

async function save() {
  if (!form.value.slug || saving.value) return
  saving.value = true
  try {
    if (editing.value) {
      await updateAdminCategory(editing.value.slug, {
        slug: form.value.newSlug || undefined,
        name: form.value.name || undefined,
      })
      useNuxtApp().$toast.success('Category updated')
    } else {
      await createAdminCategory({
        slug: form.value.slug,
        name: form.value.name || undefined,
      })
      useNuxtApp().$toast.success('Category created')
    }
    drawerOpen.value = false
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function remove(cat: AdminCategory) {
  const ok = await destructive(
    'Delete category',
    `Delete “${cat.name || cat.slug}”? It will be removed from all posts.`,
  )
  if (!ok) return
  try {
    await deleteAdminCategory(cat.slug)
    useNuxtApp().$toast.success('Category deleted')
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
