<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Publishers" description="Moderate publishers, shadowbans, and verification" />

    <AdminCard class="mb-6">
      <div class="mb-3 flex items-center justify-between gap-3">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">Directory filters</p>
        <span v-if="total > 0" class="text-xs tabular-nums text-base-content/40">{{ total }} publishers</span>
      </div>
      <form class="space-y-3" @submit.prevent="handleSearch">
        <div class="relative">
          <IconSearch class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search publishers by name, nick, or bio..."
            aria-label="Search publishers"
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
          >
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="filters.type" aria-label="Filter by publisher type" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">All types</option>
            <option value="individual">Individual</option>
            <option value="organizational">Organizational</option>
          </select>
          <select v-model="filters.shadowbanned" aria-label="Filter by shadowban status" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any shadowban</option>
            <option value="true">Shadowbanned</option>
            <option value="false">Not shadowbanned</option>
          </select>
          <select v-model="filters.gatekept" aria-label="Filter by follow gate status" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any gatekeep</option>
            <option value="true">Gatekept</option>
            <option value="false">Open follows</option>
          </select>
          <button type="submit" class="btn btn-sm btn-primary">
            <IconSearch class="h-4 w-4" aria-hidden="true" />
            Search
          </button>
        </div>
      </form>
    </AdminCard>

    <div v-if="isLoading" class="rounded-box bg-base-100 p-5 shadow-sm" aria-busy="true" aria-label="Loading publishers">
      <div class="space-y-3">
        <div v-for="item in 6" :key="item" class="flex items-center gap-4 border-b border-base-300/50 py-3 last:border-0">
          <div class="skeleton h-9 w-9 shrink-0 rounded-full" />
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-40" />
            <div class="skeleton h-3 w-24" />
          </div>
          <div class="skeleton hidden h-5 w-20 sm:block" />
          <div class="skeleton hidden h-5 w-16 sm:block" />
          <div class="skeleton h-7 w-8 rounded-btn" />
        </div>
      </div>
    </div>

    <AdminCard v-else-if="loadError" class="flex flex-col items-center px-5 py-14 text-center">
      <IconUsers class="mb-4 h-12 w-12 text-error/60" aria-hidden="true" />
      <p role="alert" class="text-sm text-base-content/60">Could not load publishers.</p>
      <button type="button" class="btn btn-outline btn-sm mt-4" @click="load">
        Retry
      </button>
    </AdminCard>

    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs uppercase tracking-wider text-base-content/50">
              <th class="pl-5">Publisher</th>
              <th>Type</th>
              <th>Rating</th>
              <th>Status</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pub in publishers" :key="pub.id" class="transition-colors hover:bg-base-200/50">
              <td class="pl-5">
                <NuxtLink
                  :to="`/admin/publishers/${encodeURIComponent(pub.name)}`"
                  class="flex items-center gap-3 rounded-box py-1 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <div class="avatar shrink-0">
                    <div class="w-8 rounded-full">
                      <img
                        v-if="pub.picture?.id"
                        :src="getFileUrl(pub.picture.id) ?? ''"
                        :alt="pub.nick || pub.name"
                        loading="lazy"
                        decoding="async"
                      >
                      <div v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {{ (pub.nick || pub.name).slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium">{{ pub.nick || pub.name }}</div>
                    <div class="truncate text-xs text-base-content/40">@{{ pub.name }}</div>
                  </div>
                </NuxtLink>
              </td>
              <td>
                <span class="badge badge-ghost badge-xs">{{ formatType(pub.type) }}</span>
              </td>
              <td>
                <span class="text-sm tabular-nums">{{ pub.rating?.toFixed?.(0) ?? pub.rating ?? '—' }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-if="isShadowbanned(pub.shadowbanReason)" class="badge badge-error badge-xs">
                    {{ formatShadowban(pub.shadowbanReason) }}
                  </span>
                  <span v-if="pub.gatekeptFollows" class="badge badge-warning badge-xs">Gatekept</span>
                  <span v-if="pub.verification" class="badge badge-success badge-xs">Verified</span>
                  <span v-if="!isShadowbanned(pub.shadowbanReason) && !pub.gatekeptFollows && !pub.verification" class="text-xs text-base-content/35">
                    Clear
                  </span>
                </div>
              </td>
              <td class="pr-5 text-right">
                <NuxtLink
                  :to="`/admin/publishers/${encodeURIComponent(pub.name)}`"
                  class="btn btn-ghost btn-square btn-xs"
                  aria-label="Open publisher"
                >
                  <IconExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="publishers.length === 0" class="flex flex-col items-center px-5 py-16 text-center">
        <IconUsers class="mb-4 h-12 w-12 text-base-content/20" aria-hidden="true" />
        <p class="text-sm text-base-content/50">No publishers found</p>
      </div>

      <div v-if="total > 0" class="flex items-center justify-between gap-4 border-t border-base-300/60 px-5 py-3">
        <span class="text-xs tabular-nums text-base-content/40">
          Showing {{ offset + 1 }}–{{ Math.min(offset + pageSize, total) }} of {{ total }}
        </span>
        <div class="flex gap-1">
          <button type="button" class="btn btn-ghost btn-square btn-xs" aria-label="Previous page" :disabled="offset === 0" @click="prevPage">
            <IconChevronLeft class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button type="button" class="btn btn-ghost btn-square btn-xs" aria-label="Next page" :disabled="offset + pageSize >= total" @click="nextPage">
            <IconChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </AdminCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
  IconUsers,
} from '#components'
import type { AdminPublisherSummary, PublisherShadowbanReason } from '~/types/admin'
import { fetchAdminPublishers } from '~/utils/admin'
import { getFileUrl } from '~/utils/files'

definePageMeta({ middleware: 'auth' })

const publishers = ref<AdminPublisherSummary[]>([])
const total = ref(0)
const isLoading = ref(false)
const loadError = ref(false)
const pageSize = 50
const offset = ref(0)
const searchQuery = ref('')
const filters = ref({
  type: '',
  shadowbanned: '',
  gatekept: '',
})

const SHADOWBAN_LABELS: Record<number, string> = {
  0: 'none',
  1: 'spam',
  2: 'advertising',
  3: 'harassment',
  4: 'hate_speech',
  5: 'misinformation',
  6: 'illegal',
  99: 'other',
}

function formatType(type: unknown): string {
  if (type === 0 || type === 'individual') return 'individual'
  if (type === 1 || type === 'organizational') return 'organizational'
  return String(type ?? '—')
}

function formatShadowban(v: PublisherShadowbanReason | string | number | null | undefined): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'number') return SHADOWBAN_LABELS[v] ?? String(v)
  return String(v)
}

function isShadowbanned(v: PublisherShadowbanReason | string | number | null | undefined): boolean {
  return !(v === undefined || v === null || v === 'none' || v === 0)
}
async function load() {
  isLoading.value = true
  loadError.value = false
  try {
    const result = await fetchAdminPublishers({
      query: searchQuery.value.trim() || undefined,
      type: filters.value.type || undefined,
      shadowbanned: filters.value.shadowbanned ? filters.value.shadowbanned === 'true' : undefined,
      gatekept: filters.value.gatekept ? filters.value.gatekept === 'true' : undefined,
      take: pageSize,
      offset: offset.value,
    })
    publishers.value = result.items
    total.value = result.total
  } catch {
    publishers.value = []
    total.value = 0
    loadError.value = true
  } finally {
    isLoading.value = false
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
