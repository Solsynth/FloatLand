<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Storage" description="Manage DysonFS storage pools, nodes, and migrations">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :disabled="loading" @click="loadAll">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </template>
    </AdminPageHeader>

    <!-- Pool Configuration -->
    <AdminCard class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold flex items-center gap-2">
          <IconHardDrive class="w-4 h-4" />
          Storage Pools
        </h3>
      </div>
      <div v-if="poolsLoading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md" />
      </div>
      <div v-else-if="pools.length === 0" class="text-sm text-base-content/40 text-center py-6">
        No pools configured
      </div>
      <div v-else class="space-y-4">
        <div v-for="pool in pools" :key="pool.id" class="rounded-box bg-base-200 p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">{{ pool.name }}</span>
                <span v-if="pool.is_hidden" class="badge badge-xs badge-ghost">hidden</span>
              </div>
              <p class="text-xs text-base-content/40 mt-0.5">{{ pool.description }}</p>
              <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-mono text-base-content/50">
                <span>Endpoint: {{ pool.storage_config.endpoint }}</span>
                <span>Bucket: {{ pool.storage_config.bucket }}</span>
                <span>SSL: {{ pool.storage_config.enable_ssl ? 'yes' : 'no' }}</span>
                <span>Signed: {{ pool.storage_config.enable_signed ? 'yes' : 'no' }}</span>
                <span>ID: {{ pool.secret_id_configured ? 'configured' : 'not set' }}</span>
                <span>Key: {{ pool.secret_key_configured ? 'configured' : 'not set' }}</span>
              </div>
              <div class="flex gap-3 mt-2 text-xs text-base-content/40">
                <span>Cost multiplier: {{ pool.billing_config?.cost_multiplier ?? 1 }}</span>
                <span>Public usable: {{ pool.policy_config?.public_usable ? 'yes' : 'no' }}</span>
              </div>
            </div>
            <button class="btn btn-sm btn-ghost shrink-0" @click="openPoolEditor(pool)">
              Edit
            </button>
          </div>
        </div>
      </div>
    </AdminCard>

    <!-- Pool Editor Modal -->
    <Teleport to="body">
      <div
        v-if="editingPool"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="editingPool = null"
      >
        <div class="w-full max-w-lg mx-4 rounded-box bg-base-100 p-6 shadow-lg">
          <h3 class="text-sm font-semibold mb-4">Edit Pool: {{ editingPool.name }}</h3>
          <div class="space-y-3">
            <label class="block text-xs font-medium text-base-content/60">Endpoint</label>
            <input v-model="poolForm.endpoint" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" />

            <label class="block text-xs font-medium text-base-content/60">Bucket</label>
            <input v-model="poolForm.bucket" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" />

            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-xs">
                <input v-model="poolForm.enable_ssl" type="checkbox" class="checkbox checkbox-xs" />
                Enable SSL
              </label>
              <label class="flex items-center gap-2 text-xs">
                <input v-model="poolForm.enable_signed" type="checkbox" class="checkbox checkbox-xs" />
                Enable Signed
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button class="btn btn-sm btn-ghost" @click="editingPool = null">Cancel</button>
            <button class="btn btn-sm btn-primary" :disabled="savingPool" @click="handleSavePool">
              {{ savingPool ? 'Saving...' : 'Save' }}
            </button>
          </div>
          <p v-if="poolSaveError" class="text-xs text-error mt-3">{{ poolSaveError }}</p>
          <p v-if="poolSaveSuccess" class="text-xs text-success mt-3">Pool configuration updated</p>
        </div>
      </div>
    </Teleport>

    <!-- Storage Health -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <AdminCard>
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <IconHeart class="w-4 h-4 text-success" />
          Health Status
        </h3>
        <div v-if="healthLoading" class="flex justify-center py-4">
          <span class="loading loading-spinner loading-sm" />
        </div>
        <div v-else-if="health">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="w-2 h-2 rounded-full"
              :class="health.status === 'healthy' ? 'bg-success' : health.status === 'degraded' ? 'bg-warning' : 'bg-error'"
            />
            <span class="text-sm font-semibold capitalize">{{ health.status }}</span>
          </div>
          <div class="text-xs text-base-content/40">
            {{ health.healthy_nodes }} / {{ health.total_nodes }} nodes healthy
          </div>
          <div class="text-[10px] text-base-content/30 mt-1">
            checked {{ formatDateTime(health.checked_at) }}
          </div>
        </div>
        <p v-else class="text-xs text-base-content/40">Unavailable</p>
      </AdminCard>

      <AdminCard>
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <IconBarChart3 class="w-4 h-4 text-info" />
          Storage Stats
        </h3>
        <div v-if="statsLoading" class="flex justify-center py-4">
          <span class="loading loading-spinner loading-sm" />
        </div>
        <div v-else-if="stats">
          <div v-for="pool in stats.pools" :key="pool.pool_id" class="mb-2">
            <div class="text-xs font-semibold">{{ pool.pool_id }}</div>
            <div class="text-xs text-base-content/40">
              {{ pool.file_count }} files · {{ formatBytes(pool.used_bytes) }}
            </div>
          </div>
          <div class="text-[10px] text-base-content/30 mt-1">
            calculated {{ formatDateTime(stats.calculated_at) }}
          </div>
        </div>
        <p v-else class="text-xs text-base-content/40">Unavailable</p>
      </AdminCard>

      <AdminCard>
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <IconServer class="w-4 h-4 text-warning" />
          Nodes
        </h3>
        <div v-if="nodesLoading" class="flex justify-center py-4">
          <span class="loading loading-spinner loading-sm" />
        </div>
        <div v-else-if="nodes">
          <div class="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
            <div v-for="node in nodes.nodes" :key="node.id" class="flex items-center gap-2 text-xs">
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="node.healthy ? 'bg-success' : 'bg-error'"
              />
              <span class="font-mono truncate">{{ node.name }}</span>
              <span class="text-base-content/30 ml-auto">{{ node.status }}</span>
            </div>
          </div>
          <div class="text-[10px] text-base-content/30 mt-1">
            checked {{ formatDateTime(nodes.checked_at) }}
          </div>
        </div>
        <p v-else class="text-xs text-base-content/40">Unavailable</p>
      </AdminCard>
    </div>

    <!-- Failures -->
    <AdminCard class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold flex items-center gap-2">
          <IconAlertTriangle class="w-4 h-4 text-error" />
          Recent Failures
        </h3>
      </div>
      <div v-if="failuresLoading" class="flex justify-center py-4">
        <span class="loading loading-spinner loading-sm" />
      </div>
      <div v-else-if="failures.length === 0" class="text-xs text-base-content/40 text-center py-4">
        No recent failures
      </div>
      <div v-else class="space-y-2 max-h-60 overflow-y-auto scrollbar-none">
        <div v-for="event in failures" :key="event.id" class="rounded-box bg-base-200 px-3 py-2 text-xs">
          <div class="text-base-content/30 font-mono">{{ event.message }}</div>
          <div class="text-[10px] text-base-content/20 mt-0.5">{{ formatDateTime(event.occurred_at) }}</div>
        </div>
      </div>
    </AdminCard>

    <!-- Pool Migration -->
    <AdminCard class="mb-6">
      <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
        <IconArrowRightLeft class="w-4 h-4 text-primary" />
        Pool Migration
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-base-content/60 mb-1">Source Pool ID</label>
          <input v-model="migrationForm.source_pool_id" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" />
        </div>
        <div>
          <label class="block text-xs font-medium text-base-content/60 mb-1">Target Pool ID</label>
          <input v-model="migrationForm.target_pool_id" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" />
        </div>
      </div>
      <div class="mt-4 flex items-center gap-4">
        <button class="btn btn-sm btn-primary" :disabled="migrationLoading || !migrationForm.source_pool_id || !migrationForm.target_pool_id" @click="handleStartMigration">
          {{ migrationLoading ? 'Starting...' : 'Start Migration' }}
        </button>
        <div v-if="migrationResult" class="text-xs" :class="migrationResult.status === 'failed' ? 'text-error' : 'text-success'">
          Task {{ migrationResult.status }} — {{ (migrationResult.progress * 100).toFixed(0) }}% ({{ migrationResult.chunks_uploaded }}/{{ migrationResult.chunks_count }})
        </div>
      </div>
      <p v-if="migrationError" class="text-xs text-error mt-2">{{ migrationError }}</p>

      <hr class="my-4 border-base-300" />

      <div class="flex gap-2">
        <input v-model="migrationTaskId" type="text" placeholder="Task ID to check progress..." class="input input-sm flex-1 rounded-box border-0 bg-base-200" />
        <button class="btn btn-sm btn-ghost" :disabled="!migrationTaskId" @click="handleCheckMigration">
          Check
        </button>
      </div>
      <div v-if="checkedTask" class="mt-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-base-content/40">Status:</span>
          <span :class="checkedTask.status === 'completed' ? 'text-success' : checkedTask.status === 'failed' ? 'text-error' : ''" class="font-semibold capitalize">{{ checkedTask.status }}</span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-base-content/40">Progress:</span>
          <span>{{ (checkedTask.progress * 100).toFixed(0) }}% ({{ checkedTask.chunks_uploaded }}/{{ checkedTask.chunks_count }})</span>
        </div>
        <div v-if="checkedTask.parameters" class="mt-1 text-base-content/30">
          {{ checkedTask.parameters.source_pool_id }} → {{ checkedTask.parameters.target_pool_id }}
        </div>
        <div v-if="checkedTask.error_message" class="text-error mt-1">{{ checkedTask.error_message }}</div>
      </div>
    </AdminCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconRefreshCw,
  IconHardDrive,
  IconHeart,
  IconBarChart3,
  IconServer,
  IconAlertTriangle,
  IconArrowRightLeft,
} from '#components'
import type {
  StoragePoolConfig,
  StoragePoolUpdatePayload,
  StorageNodeHealth,
  StorageHealthSummary,
  StorageStats,
  StorageFailureEvent,
  PoolMigrationPayload,
  PoolMigrationTask,
} from '~/types/admin'
import {
  fetchStoragePoolConfigs,
  updateStoragePoolConfig,
  fetchStorageNodeStatus,
  fetchStorageHealth,
  fetchStorageStats,
  fetchStorageFailures,
  createPoolMigration,
  fetchPoolMigrationTask,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const loading = ref(false)

// Pool configs
const pools = ref<StoragePoolConfig[]>([])
const poolsLoading = ref(false)

// Pool editor
const editingPool = ref<StoragePoolConfig | null>(null)
const savingPool = ref(false)
const poolSaveError = ref('')
const poolSaveSuccess = ref(false)
const poolForm = reactive({
  endpoint: '',
  bucket: '',
  enable_ssl: true,
  enable_signed: true,
})

// Health
const health = ref<StorageHealthSummary | null>(null)
const healthLoading = ref(false)

// Nodes
const nodes = ref<StorageNodeHealth | null>(null)
const nodesLoading = ref(false)

// Stats
const stats = ref<StorageStats | null>(null)
const statsLoading = ref(false)

// Failures
const failures = ref<StorageFailureEvent[]>([])
const failuresLoading = ref(false)

// Migration
const migrationForm = reactive<PoolMigrationPayload>({
  source_pool_id: '',
  target_pool_id: '',
})
const migrationLoading = ref(false)
const migrationResult = ref<PoolMigrationTask | null>(null)
const migrationError = ref('')
const migrationTaskId = ref('')
const checkedTask = ref<PoolMigrationTask | null>(null)

function openPoolEditor(pool: StoragePoolConfig) {
  editingPool.value = pool
  poolForm.endpoint = pool.storage_config.endpoint
  poolForm.bucket = pool.storage_config.bucket
  poolForm.enable_ssl = pool.storage_config.enable_ssl
  poolForm.enable_signed = pool.storage_config.enable_signed
  poolSaveError.value = ''
  poolSaveSuccess.value = false
}

async function handleSavePool() {
  if (!editingPool.value) return
  savingPool.value = true
  poolSaveError.value = ''
  poolSaveSuccess.value = false
  try {
    const payload: StoragePoolUpdatePayload = {
      storage_config: {
        endpoint: poolForm.endpoint,
        bucket: poolForm.bucket,
        enable_ssl: poolForm.enable_ssl,
        enable_signed: poolForm.enable_signed,
      },
    }
    const updated = await updateStoragePoolConfig(editingPool.value.id, payload)
    const idx = pools.value.findIndex(p => p.id === editingPool.value!.id)
    if (idx !== -1) pools.value[idx] = updated
    poolSaveSuccess.value = true
    setTimeout(() => { editingPool.value = null }, 1200)
  } catch {
    poolSaveError.value = 'Failed to update pool configuration'
  } finally {
    savingPool.value = false
  }
}

async function handleStartMigration() {
  migrationLoading.value = true
  migrationResult.value = null
  migrationError.value = ''
  try {
    migrationResult.value = await createPoolMigration({
      source_pool_id: migrationForm.source_pool_id,
      target_pool_id: migrationForm.target_pool_id,
    })
  } catch {
    migrationError.value = 'Failed to start migration'
  } finally {
    migrationLoading.value = false
  }
}

async function handleCheckMigration() {
  if (!migrationTaskId.value) return
  try {
    checkedTask.value = await fetchPoolMigrationTask(migrationTaskId.value)
  } catch {
    checkedTask.value = null
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let i = -1
  let size = bytes
  do { size /= 1024; i++ } while (size >= 1024 && i < units.length - 1)
  return size.toFixed(1) + ' ' + units[i]
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

async function loadAll() {
  loading.value = true
  const results = await Promise.allSettled([
    fetchStoragePoolConfigs(),
    fetchStorageHealth(),
    fetchStorageNodeStatus(),
    fetchStorageStats(),
    fetchStorageFailures(50),
  ])
  pools.value = results[0].status === 'fulfilled' ? results[0].value : []
  health.value = results[1].status === 'fulfilled' ? results[1].value : null
  nodes.value = results[2].status === 'fulfilled' ? results[2].value : null
  stats.value = results[3].status === 'fulfilled' ? results[3].value : null
  failures.value = results[4].status === 'fulfilled' ? results[4].value : []
  loading.value = false
}

onMounted(loadAll)
</script>
