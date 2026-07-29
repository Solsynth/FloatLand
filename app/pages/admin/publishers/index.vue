<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Publishers" description="Moderate publishers, shadowbans, and verification" />

    <AdminCard class="mb-6">
      <div class="flex flex-col gap-3">
        <div class="relative">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search publishers by name, nick, or bio..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <select v-model="filters.type" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">All types</option>
            <option value="individual">Individual</option>
            <option value="organizational">Organizational</option>
          </select>
          <select v-model="filters.shadowbanned" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any shadowban</option>
            <option value="true">Shadowbanned</option>
            <option value="false">Not shadowbanned</option>
          </select>
          <select v-model="filters.gatekept" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any gatekeep</option>
            <option value="true">Gatekept</option>
            <option value="false">Open follows</option>
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
              <th class="pl-5">Publisher</th>
              <th>Type</th>
              <th>Rating</th>
              <th>Status</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pub in publishers" :key="pub.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <NuxtLink :to="`/admin/publishers/${pub.name}`" class="flex items-center gap-3">
                  <div class="avatar">
                    <div class="w-8 rounded-full">
                      <img
                        v-if="getFileUrl(pub.picture?.id)"
                        :src="getFileUrl(pub.picture?.id) ?? ''"
                        :alt="pub.nick || pub.name"
                      />
                      <div
                        v-else
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
                      >
                        {{ (pub.nick || pub.name).slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate">{{ pub.nick || pub.name }}</div>
                    <div class="text-xs text-base-content/40">@{{ pub.name }}</div>
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
                  <span
                    v-if="isShadowbanned(pub.shadowbanReason)"
                    class="badge badge-error badge-xs"
                  >
                    {{ formatShadowban(pub.shadowbanReason) }}
                  </span>
                  <span v-if="pub.gatekeptFollows" class="badge badge-warning badge-xs">Gatekept</span>
                  <span v-if="pub.verification" class="badge badge-success badge-xs">Verified</span>
                </div>
              </td>
              <td class="pr-5 text-right">
                <NuxtLink :to="`/admin/publishers/${pub.name}`" class="btn btn-ghost btn-xs">
                  <IconExternalLink class="w-3.5 h-3.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="publishers.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconUsers class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No publishers found</p>
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
  try {
    const result = await fetchAdminPublishers({
      query: searchQuery.value || undefined,
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
