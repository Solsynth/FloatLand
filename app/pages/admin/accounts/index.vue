<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Accounts" description="Manage platform accounts and permissions">
      <template #actions>
        <button class="btn btn-sm btn-primary" :disabled="isLoading" @click="reloadAccounts">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </button>
      </template>
    </AdminPageHeader>

    <!-- Search & Filters -->
    <AdminCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 z-10" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search accounts by name or nickname..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <select
          v-model="orderBy"
          class="select select-sm rounded-box border-0 bg-base-200"
          @change="handleSearch"
        >
          <option value="created_at_desc">Newest first</option>
          <option value="name">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
        <button class="btn btn-sm btn-primary" :disabled="isLoading" @click="handleSearch">
          <IconSearch class="w-4 h-4" />
          Search
        </button>
        <button
          v-if="searchQuery"
          class="btn btn-sm btn-ghost"
          :disabled="isLoading"
          @click="clearSearch"
        >
          Clear
        </button>
      </div>
      <div class="flex flex-wrap gap-2 mt-3">
        <select v-model="filterActivated" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
          <option value="">All statuses</option>
          <option value="true">Activated</option>
          <option value="false">Not activated</option>
        </select>
        <select v-model="filterHasPunishment" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
          <option value="">All</option>
          <option value="true">Has punishment</option>
          <option value="false">No punishment</option>
        </select>
        <input v-model="filterCreatedAfter" type="date" class="input input-sm rounded-box border-0 bg-base-200" @change="handleSearch" />
        <input v-model="filterCreatedBefore" type="date" class="input input-sm rounded-box border-0 bg-base-200" @change="handleSearch" />
      </div>
      <p v-if="activeQuery" class="text-xs text-base-content/40 mt-2">
        Filtering by “{{ activeQuery }}” · ordered by {{ orderLabel }}
      </p>
    </AdminCard>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Accounts Table -->
    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5">Account</th>
              <th>Email</th>
              <th>Auth</th>
              <th>Sessions</th>
              <th>Devices</th>
              <th>Status</th>
              <th>Punishment</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in accounts"
              :key="entry.account.id"
              class="hover:bg-base-200/50 transition-colors"
            >
              <td class="pl-5">
                <NuxtLink
                  :to="`/admin/accounts/${entry.account.name}`"
                  class="flex items-center gap-3"
                >
                  <div class="avatar">
                    <div class="w-8 rounded-full">
                      <FileImage
                        v-if="entry.account.profile?.picture"
                        :file="entry.account.profile.picture"
                        :alt="entry.account.nick"
                      />
                      <div
                        v-else
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
                      >
                        {{ (entry.account.nick || entry.account.name).slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <div class="text-sm font-medium truncate max-w-[12rem]">
                        {{ entry.account.nick || entry.account.name }}
                      </div>
                      <span
                        v-if="!entry.account.activatedAt"
                        class="badge badge-ghost badge-xs shrink-0"
                      >Pending</span>
                    </div>
                    <div class="text-xs text-base-content/40 truncate">
                      @{{ entry.account.name }}
                      <span v-if="entry.badgeCount" class="text-base-content/30">
                        · {{ entry.badgeCount }} badge{{ entry.badgeCount === 1 ? '' : 's' }}
                      </span>
                    </div>
                  </div>
                </NuxtLink>
              </td>
              <td>
                <div class="min-w-0">
                  <span class="text-sm text-base-content/60 block truncate max-w-[14rem]">
                    {{ entry.primaryEmail || '—' }}
                  </span>
                  <span v-if="entry.contactCount" class="text-[10px] text-base-content/35">
                    {{ entry.contactCount }} contact{{ entry.contactCount === 1 ? '' : 's' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    class="badge badge-xs"
                    :class="entry.hasPassword ? 'badge-success' : 'badge-ghost'"
                  >
                    {{ entry.hasPassword ? 'Password' : 'No pw' }}
                  </span>
                  <span class="text-xs text-base-content/50">
                    {{ entry.authFactorCount ?? 0 }} factor{{ (entry.authFactorCount ?? 0) === 1 ? '' : 's' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-1.5">
                  <span
                    class="inline-block w-2 h-2 rounded-full"
                    :class="entry.activeSessionCount > 0 ? 'bg-success' : 'bg-base-300'"
                  />
                  <span class="text-sm text-base-content/60">
                    {{ entry.activeSessionCount }}
                  </span>
                </div>
              </td>
              <td>
                <span class="text-sm text-base-content/60">
                  {{ entry.activeDeviceCount ?? '—' }}
                </span>
              </td>
              <td>
                <div v-if="entry.status" class="flex items-center gap-1.5">
                  <span
                    class="inline-block w-2 h-2 rounded-full"
                    :class="entry.status.isOnline ? 'bg-success' : 'bg-base-300'"
                  />
                  <span class="text-xs text-base-content/60">
                    {{ entry.status.label }}
                  </span>
                  <span
                    v-if="entry.activeActivityCount"
                    class="text-[10px] text-base-content/35"
                  >
                    · {{ entry.activeActivityCount }} live
                  </span>
                </div>
                <span v-else class="text-xs text-base-content/30">—</span>
              </td>
              <td>
                <span
                  v-if="entry.activePunishment"
                  class="badge badge-error badge-xs"
                >
                  Active
                </span>
                <span v-else class="text-xs text-base-content/30">—</span>
              </td>
              <td class="pr-5 text-right">
                <NuxtLink
                  :to="`/admin/accounts/${entry.account.name}`"
                  class="btn btn-ghost btn-xs"
                >
                  <IconExternalLink class="w-3.5 h-3.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="accounts.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconUsers class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No accounts found</p>
        <p class="text-xs text-base-content/30">
          {{ activeQuery ? 'Try adjusting your search query' : 'No accounts to show' }}
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="hasMore || totalAccounts > pageSize" class="flex items-center justify-between px-5 py-3">
        <span class="text-xs text-base-content/40">
          Showing {{ offset + 1 }}–{{ Math.min(offset + pageSize, totalAccounts) }} of {{ totalAccounts || 'many' }}
        </span>
        <div class="flex gap-1">
          <button
            class="btn btn-ghost btn-xs"
            :disabled="offset === 0 || isLoading"
            @click="prevPage"
          >
            <IconChevronLeft class="w-3.5 h-3.5" />
          </button>
          <button
            class="btn btn-ghost btn-xs"
            :disabled="(!hasMore && offset + pageSize >= totalAccounts) || isLoading"
            @click="nextPage"
          >
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
  IconRefreshCw,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
  IconUsers,
} from '#components'
import type { AdminAccountQuery, OrderByField } from '~/types/admin'

definePageMeta({ middleware: 'auth' })

const { accounts, totalAccounts, hasMore, isLoading, loadAccounts } = useAdmin()

const searchQuery = ref('')
/** Query last successfully applied to the list (survives typing without search). */
const activeQuery = ref('')
const orderBy = ref<OrderByField>('created_at_desc')
const pageSize = 50
const filterActivated = ref('')
const filterHasPunishment = ref('')
const filterCreatedAfter = ref('')
const filterCreatedBefore = ref('')
const offset = ref(0)

const orderLabel = computed(() => {
  switch (orderBy.value) {
    case 'name': return 'name (A–Z)'
    case 'name_desc': return 'name (Z–A)'
    default: return 'newest first'
  }
})

function listParams(overrides: Partial<AdminAccountQuery> = {}): AdminAccountQuery {
  return {
    query: activeQuery.value || undefined,
    take: pageSize,
    offset: offset.value,
    orderBy: orderBy.value,
    activated: filterActivated.value ? filterActivated.value === 'true' : undefined,
    hasPunishment: filterHasPunishment.value ? filterHasPunishment.value === 'true' : undefined,
    createdAfter: filterCreatedAfter.value || undefined,
    createdBefore: filterCreatedBefore.value || undefined,
    ...overrides,
  }
}

function handleSearch() {
  activeQuery.value = searchQuery.value.trim()
  offset.value = 0
  loadAccounts(listParams({ offset: 0, query: activeQuery.value || undefined }))
}

function clearSearch() {
  searchQuery.value = ''
  activeQuery.value = ''
  filterActivated.value = ''
  filterHasPunishment.value = ''
  filterCreatedAfter.value = ''
  filterCreatedBefore.value = ''
  offset.value = 0
  loadAccounts(listParams({ offset: 0, query: undefined }))
}

function reloadAccounts() {
  loadAccounts(listParams())
}

function prevPage() {
  offset.value = Math.max(0, offset.value - pageSize)
  loadAccounts(listParams())
}

function nextPage() {
  offset.value = offset.value + pageSize
  loadAccounts(listParams())
}

onMounted(() => {
  loadAccounts(listParams({ offset: 0 }))
})
</script>
