<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Realms" description="Moderate realms, visibility, and verification" />

    <AdminCard class="mb-6">
      <div class="flex flex-col gap-3">
        <div class="relative">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search realms by slug, name, or description..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <select v-model="filters.isPublic" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any visibility</option>
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
          <select v-model="filters.isCommunity" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any type</option>
            <option value="true">Community</option>
            <option value="false">Invite-only</option>
          </select>
          <select v-model="filters.verified" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
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
              <th class="pl-5">Realm</th>
              <th>Flags</th>
              <th>Boost</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="realm in realms" :key="realm.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <NuxtLink :to="`/admin/realms/${realm.slug}`" class="flex items-center gap-3">
                  <div class="avatar">
                    <div class="w-8 rounded-full">
                      <img
                        v-if="getFileUrl(realm.picture?.id)"
                        :src="getFileUrl(realm.picture?.id) ?? ''"
                        :alt="realm.name"
                      />
                      <div
                        v-else
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
                      >
                        {{ realm.name.slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate">{{ realm.name }}</div>
                    <div class="text-xs text-base-content/40 font-mono">/{{ realm.slug }}</div>
                  </div>
                </NuxtLink>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-if="realm.isPublic" class="badge badge-success badge-xs">Public</span>
                  <span v-else class="badge badge-ghost badge-xs">Private</span>
                  <span v-if="realm.isCommunity" class="badge badge-primary badge-xs">Community</span>
                  <span v-if="realm.verification" class="badge badge-success badge-xs">Verified</span>
                </div>
              </td>
              <td>
                <span class="text-sm tabular-nums">L{{ realm.boostLevel ?? 0 }}</span>
                <span class="text-xs text-base-content/40 ml-1">({{ realm.boostPoints ?? 0 }})</span>
              </td>
              <td class="pr-5 text-right">
                <NuxtLink :to="`/admin/realms/${realm.slug}`" class="btn btn-ghost btn-xs">
                  <IconExternalLink class="w-3.5 h-3.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="realms.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconGlobe class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No realms found</p>
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
  IconGlobe,
} from '#components'
import type { AdminRealm } from '~/types/admin'
import { fetchAdminRealms } from '~/utils/admin'
import { getFileUrl } from '~/utils/files'

definePageMeta({ middleware: 'auth' })

const realms = ref<AdminRealm[]>([])
const total = ref(0)
const isLoading = ref(false)
const pageSize = 50
const offset = ref(0)
const searchQuery = ref('')
const filters = ref({
  isPublic: '',
  isCommunity: '',
  verified: '',
})

async function load() {
  isLoading.value = true
  try {
    const result = await fetchAdminRealms({
      query: searchQuery.value || undefined,
      isPublic: filters.value.isPublic ? filters.value.isPublic === 'true' : undefined,
      isCommunity: filters.value.isCommunity ? filters.value.isCommunity === 'true' : undefined,
      verified: filters.value.verified ? filters.value.verified === 'true' : undefined,
      take: pageSize,
      offset: offset.value,
    })
    realms.value = result.items
    total.value = result.total
  } catch {
    realms.value = []
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
