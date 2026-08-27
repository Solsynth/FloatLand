<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Tags" description="Moderate post tags, ownership, and protection">
      <template #actions>
        <button class="btn btn-sm btn-primary" @click="showCreate = true">
          <IconPlus class="w-4 h-4" />
          New Tag
        </button>
      </template>
    </AdminPageHeader>

    <AdminCard class="mb-6">
      <div class="flex flex-col gap-3">
        <div class="relative">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 z-10" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tags by slug, name, or description..."
            class="input input-sm w-full pl-9 bg-base-200/60 border-0 rounded-xl"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <select v-model="filters.order" class="select select-sm bg-base-200/60 border-0 rounded-xl" @change="handleSearch">
            <option value="">Recently updated</option>
            <option value="usage">Most used</option>
            <option value="name">Name A–Z</option>
            <option value="created">Newest</option>
          </select>
          <select v-model="filters.isProtected" class="select select-sm bg-base-200/60 border-0 rounded-xl" @change="handleSearch">
            <option value="">Any protection</option>
            <option value="true">Protected</option>
            <option value="false">Unprotected</option>
          </select>
          <select v-model="filters.isEvent" class="select select-sm bg-base-200/60 border-0 rounded-xl" @change="handleSearch">
            <option value="">Any event</option>
            <option value="true">Event tags</option>
            <option value="false">Non-event</option>
          </select>
          <select v-model="filters.unowned" class="select select-sm bg-base-200/60 border-0 rounded-xl" @change="handleSearch">
            <option value="">Any ownership</option>
            <option value="true">Unowned only</option>
          </select>
          <button class="btn btn-sm btn-primary" @click="handleSearch">
            <IconSearch class="w-4 h-4" />
            Search
          </button>
        </div>
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
              <th class="pl-5">Tag</th>
              <th>Owner</th>
              <th>Usage</th>
              <th>Flags</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tag in tags" :key="tag.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <NuxtLink :to="`/admin/tags/${tag.slug}`" class="block">
                  <div class="text-sm font-medium">{{ tag.name || tag.slug }}</div>
                  <div class="text-xs text-base-content/40 font-mono">#{{ tag.slug }}</div>
                </NuxtLink>
              </td>
              <td>
                <span class="text-sm text-base-content/60">
                  {{ tag.ownerPublisher?.nick || tag.ownerPublisher?.name || '—' }}
                </span>
              </td>
              <td>
                <span class="text-sm tabular-nums">{{ tag.usage ?? 0 }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-if="tag.isProtected" class="badge badge-warning badge-xs">Protected</span>
                  <span v-if="tag.isEvent" class="badge badge-info badge-xs">Event</span>
                  <span v-if="!tag.ownerPublisherId" class="badge badge-ghost badge-xs">Unowned</span>
                </div>
              </td>
              <td class="pr-5 text-right">
                <NuxtLink :to="`/admin/tags/${tag.slug}`" class="btn btn-ghost btn-xs">
                  <IconExternalLink class="w-3.5 h-3.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="tags.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconHash class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No tags found</p>
        <p class="text-xs text-base-content/30">Try adjusting your search or filters</p>
      </div>

      <div v-if="total > pageSize" class="flex items-center justify-between px-5 py-3 border-t border-base-300/20">
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

    <AdminDrawer :open="showCreate" title="Create Tag" @update:open="showCreate = $event">
      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text text-xs mb-1">Slug</span>
          <input v-model="createForm.slug" class="input input-sm bg-base-200/60 border-0 rounded-xl" placeholder="photography" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">Name</span>
          <input v-model="createForm.name" class="input input-sm bg-base-200/60 border-0 rounded-xl" placeholder="Photography" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">Description</span>
          <textarea v-model="createForm.description" class="textarea textarea-sm bg-base-200/60 border-0 rounded-xl" rows="3" />
        </label>
        <label class="form-control">
          <span class="label-text text-xs mb-1">Owner publisher ID (optional)</span>
          <input v-model="createForm.ownerPublisherId" class="input input-sm bg-base-200/60 border-0 rounded-xl font-mono" placeholder="UUID..." />
        </label>
        <button class="btn btn-sm btn-primary w-full" :disabled="creating || !createForm.slug" @click="createTag">
          {{ creating ? 'Creating...' : 'Create Tag' }}
        </button>
      </div>
    </AdminDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconPlus,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
  IconHash,
} from '#components'
import type { AdminTag } from '~/types/admin'
import { fetchAdminTags, createAdminTag } from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const tags = ref<AdminTag[]>([])
const total = ref(0)
const isLoading = ref(false)
const pageSize = 50
const offset = ref(0)
const searchQuery = ref('')
const filters = ref({
  order: '',
  isProtected: '',
  isEvent: '',
  unowned: '',
})

const showCreate = ref(false)
const creating = ref(false)
const createForm = ref({
  slug: '',
  name: '',
  description: '',
  ownerPublisherId: '',
})

async function loadTags() {
  isLoading.value = true
  try {
    const result = await fetchAdminTags({
      query: searchQuery.value || undefined,
      order: filters.value.order || undefined,
      isProtected: filters.value.isProtected ? filters.value.isProtected === 'true' : undefined,
      isEvent: filters.value.isEvent ? filters.value.isEvent === 'true' : undefined,
      unowned: filters.value.unowned ? filters.value.unowned === 'true' : undefined,
      take: pageSize,
      offset: offset.value,
    })
    tags.value = result.items
    total.value = result.total
  } catch {
    tags.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

async function createTag() {
  if (!createForm.value.slug || creating.value) return
  creating.value = true
  try {
    const tag = await createAdminTag({
      slug: createForm.value.slug,
      name: createForm.value.name || undefined,
      description: createForm.value.description || undefined,
      ownerPublisherId: createForm.value.ownerPublisherId || undefined,
    })
    showCreate.value = false
    createForm.value = { slug: '', name: '', description: '', ownerPublisherId: '' }
    useNuxtApp().$toast.success('Tag created')
    await navigateTo(`/admin/tags/${tag.slug}`)
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed to create tag')
  } finally {
    creating.value = false
  }
}

function handleSearch() {
  offset.value = 0
  loadTags()
}

function prevPage() {
  offset.value = Math.max(0, offset.value - pageSize)
  loadTags()
}

function nextPage() {
  offset.value += pageSize
  loadTags()
}

onMounted(() => loadTags())
</script>
