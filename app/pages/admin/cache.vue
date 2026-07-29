<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Cache" description="Inspect and manage platform cache" />

    <!-- Cache Stats -->
    <AdminCard class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold">Cache Statistics</h3>
        <button class="btn btn-sm btn-ghost" @click="loadStats">
          <IconRefreshCw class="w-4 h-4" />
        </button>
      </div>
      <div v-if="statsLoading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md" />
      </div>
      <div v-else-if="stats" class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.hitRatio ? (stats.hitRatio * 100).toFixed(1) + '%' : '0%' }}</div>
          <div class="text-xs text-base-content/40 mt-1">Hit Ratio</div>
        </div>
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold">{{ stats.keyspaceHits }}</div>
          <div class="text-xs text-base-content/40 mt-1">Keyspace Hits</div>
        </div>
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold">{{ stats.keyspaceMisses }}</div>
          <div class="text-xs text-base-content/40 mt-1">Keyspace Misses</div>
        </div>
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold">{{ formatBytes(stats.usedMemoryBytes) }}</div>
          <div class="text-xs text-base-content/40 mt-1">Memory Used</div>
        </div>
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold">{{ stats.connectedClients }}</div>
          <div class="text-xs text-base-content/40 mt-1">Connections</div>
        </div>
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold">{{ stats.totalCommandsProcessed }}</div>
          <div class="text-xs text-base-content/40 mt-1">Commands</div>
        </div>
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold">{{ stats.evictedKeys }}</div>
          <div class="text-xs text-base-content/40 mt-1">Evicted</div>
        </div>
        <div class="rounded-box bg-base-200 p-3 text-center">
          <div class="text-2xl font-bold">{{ stats.expiredKeys }}</div>
          <div class="text-xs text-base-content/40 mt-1">Expired</div>
        </div>
      </div>
      <div v-else class="flex justify-center py-8">
        <p class="text-sm text-base-content/50">Failed to load stats</p>
      </div>
    </AdminCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Clear by Key -->
      <AdminCard>
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <IconKey class="w-4 h-4" />
          Clear by Key
        </h3>
        <div class="flex gap-2">
          <input
            v-model="clearKey"
            type="text"
            placeholder="auth:session:abc123..."
            class="input input-sm flex-1 rounded-box border-0 bg-base-200"
          />
          <button class="btn btn-sm btn-primary" :disabled="keyLoading || !clearKey" @click="handleClearKey">
            {{ keyLoading ? '...' : 'Clear' }}
          </button>
        </div>
        <p v-if="keyResult" class="text-xs text-success mt-2">
          Removed {{ keyResult.removedCount }} key(s)
        </p>
      </AdminCard>

      <!-- Clear by Group -->
      <AdminCard>
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <IconFolderTree class="w-4 h-4" />
          Clear by Group
        </h3>
        <div class="flex gap-2">
          <input
            v-model="clearGroup"
            type="text"
            placeholder="auth:account_sessions:id"
            class="input input-sm flex-1 rounded-box border-0 bg-base-200"
          />
          <button class="btn btn-sm btn-primary" :disabled="groupLoading || !clearGroup" @click="handleClearGroup">
            {{ groupLoading ? '...' : 'Clear' }}
          </button>
        </div>
        <p v-if="groupResult" class="text-xs text-success mt-2">
          Removed {{ groupResult.removedCount }} key(s)
        </p>
      </AdminCard>
    </div>

    <!-- Inspect Group -->
    <AdminCard class="mt-6">
      <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
        <IconSearch class="w-4 h-4" />
        Inspect Group
      </h3>
      <div class="flex gap-2 mb-4">
        <input
          v-model="inspectGroup"
          type="text"
          placeholder="Group name..."
          class="input input-sm flex-1 rounded-box border-0 bg-base-200"
          @keyup.enter="handleInspectGroup"
        />
        <button class="btn btn-sm btn-primary" :disabled="inspectLoading" @click="handleInspectGroup">
          {{ inspectLoading ? '...' : 'Inspect' }}
        </button>
      </div>
      <div v-if="groupInfo" class="space-y-2">
        <div class="flex items-center gap-2 text-sm">
          <span class="text-base-content/40">Group:</span>
          <span class="font-mono text-xs">{{ groupInfo.group }}</span>
          <span class="badge badge-xs">{{ groupInfo.count }} keys</span>
        </div>
        <div class="max-h-48 overflow-y-auto rounded-box bg-base-200 p-3">
          <div v-for="key in groupInfo.keys" :key="key" class="text-xs font-mono text-base-content/60 py-0.5">
            {{ key }}
          </div>
        </div>
      </div>
    </AdminCard>

    <!-- Clear All (danger) -->
    <AdminCard class="mt-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-error">Clear All Cache</h3>
          <p class="text-xs text-base-content/40 mt-1">
            Removes all cache entries in the Dyson namespace. This is a disruptive operator action.
          </p>
        </div>
        <button class="btn btn-sm btn-error" :disabled="clearAllLoading" @click="handleClearAll">
          {{ clearAllLoading ? '...' : 'Clear All' }}
        </button>
      </div>
      <p v-if="clearAllResult" class="text-xs text-success mt-2">
        Removed {{ clearAllResult.removedCount }} key(s)
      </p>
    </AdminCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconRefreshCw,
  IconKey,
  IconFolderTree,
  IconSearch,
} from '#components'
import type { CacheStats, CacheGroupInfo, CacheClearResult } from '~/types/admin'
import {
  fetchCacheStats,
  fetchCacheGroup,
  clearCacheByKey,
  clearCacheByGroup,
  clearAllCache,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let i = -1
  let size = bytes
  do { size /= 1024; i++ } while (size >= 1024 && i < units.length - 1)
  return size.toFixed(1) + ' ' + units[i]
}

const stats = ref<CacheStats | null>(null)
const statsLoading = ref(false)

const clearKey = ref('')
const keyLoading = ref(false)
const keyResult = ref<CacheClearResult | null>(null)

const clearGroup = ref('')
const groupLoading = ref(false)
const groupResult = ref<CacheClearResult | null>(null)

const inspectGroup = ref('')
const inspectLoading = ref(false)
const groupInfo = ref<CacheGroupInfo | null>(null)

const clearAllLoading = ref(false)
const clearAllResult = ref<CacheClearResult | null>(null)

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await fetchCacheStats()
  } catch {
    stats.value = null
  } finally {
    statsLoading.value = false
  }
}

async function handleClearKey() {
  keyLoading.value = true
  keyResult.value = null
  try {
    keyResult.value = await clearCacheByKey({ key: clearKey.value })
    clearKey.value = ''
  } catch { /* ignore */ } finally {
    keyLoading.value = false
  }
}

async function handleClearGroup() {
  groupLoading.value = true
  groupResult.value = null
  try {
    groupResult.value = await clearCacheByGroup({ group: clearGroup.value })
    clearGroup.value = ''
  } catch { /* ignore */ } finally {
    groupLoading.value = false
  }
}

async function handleInspectGroup() {
  inspectLoading.value = true
  groupInfo.value = null
  try {
    groupInfo.value = await fetchCacheGroup(inspectGroup.value)
  } catch {
    groupInfo.value = null
  } finally {
    inspectLoading.value = false
  }
}

async function handleClearAll() {
  clearAllLoading.value = true
  clearAllResult.value = null
  try {
    clearAllResult.value = await clearAllCache()
  } catch { /* ignore */ } finally {
    clearAllLoading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>
