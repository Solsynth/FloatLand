<template>
  <NuxtLayout name="admin">
    <div v-if="isLoadingDetail" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>
    <div v-else-if="loadError" class="rounded-xl bg-error/5 border border-error/20 p-4 text-sm text-error">
      {{ loadError }}
    </div>
    <div v-else-if="detail">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/admin/workspaces" class="btn btn-sm btn-ghost btn-square" title="Back to workspaces">
          <IconArrowLeft class="w-4 h-4" />
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold truncate">{{ workspace.name || workspace.slug }}</h1>
            <span class="badge badge-xs" :class="planBadgeClass(workspace.plan)">{{ planLabel(workspace.plan) }}</span>
            <span v-if="workspace.isBundled" class="badge badge-xs badge-info">Bundled</span>
          </div>
          <p class="text-sm text-base-content/50">/{{ workspace.slug }}</p>
        </div>
        <button class="btn btn-sm btn-ghost" :class="{ 'pointer-events-none opacity-60': refreshLoading }" @click="refresh">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': refreshLoading }" />
          Refresh
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- Workspace info -->
          <AdminCard title="Workspace">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Name</span>
                <p class="mt-1 font-medium">{{ workspace.name || '—' }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Slug</span>
                <p class="mt-1 font-mono text-xs text-base-content/70">{{ workspace.slug || '—' }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Type</span>
                <p class="mt-1">{{ workspace.type === 1 ? 'Organization' : 'Individual' }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Owner Account ID</span>
                <p class="mt-1 font-mono text-xs text-base-content/70 break-all">{{ workspace.ownerAccountId || '—' }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Plan</span>
                <p class="mt-1">{{ planLabel(workspace.plan) }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Plan Expires At</span>
                <p class="mt-1">{{ workspace.planExpiresAt ? formatDateTime(workspace.planExpiresAt) : '—' }}</p>
              </div>
            </div>
          </AdminCard>

          <!-- Edit fields -->
          <AdminCard title="Edit Workspace">
            <div class="space-y-4">
              <label class="form-control">
                <span class="label-text text-xs mb-1">Name</span>
                <input v-model="editForm.name" class="input input-sm rounded-box border-0 bg-base-200" placeholder="Workspace name" />
              </label>
              <label class="form-control">
                <span class="label-text text-xs mb-1">Description</span>
                <textarea v-model="editForm.description" class="textarea textarea-sm rounded-box border-0 bg-base-200" rows="2" placeholder="Short description" />
              </label>
              <label class="form-control">
                <span class="label-text text-xs mb-1">Slug</span>
                <input v-model="editForm.slug" class="input input-sm rounded-box border-0 bg-base-200" placeholder="my-workspace" />
              </label>
              <button class="btn btn-sm btn-primary" :disabled="savingEdit" @click="saveEdit">
                {{ savingEdit ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </AdminCard>
        </div>

        <div class="space-y-6">
          <!-- Change plan -->
          <AdminCard title="Change Plan">
            <div class="space-y-4">
              <label class="form-control">
                <span class="label-text text-xs mb-1">Plan</span>
                <select v-model="planForm.plan" class="select select-sm rounded-box border-0 bg-base-200">
                  <option :value="0">Free</option>
                  <option :value="1">Pro</option>
                  <option :value="2">Enterprise</option>
                </select>
              </label>
              <label class="form-control">
                <span class="label-text text-xs mb-1">Plan Expires At (optional)</span>
                <input v-model="planForm.planExpiresAt" type="datetime-local" class="input input-sm rounded-box border-0 bg-base-200" />
              </label>
              <button class="btn btn-sm btn-primary" :disabled="savingPlan" @click="savePlan">
                {{ savingPlan ? 'Saving...' : 'Update plan' }}
              </button>
            </div>
          </AdminCard>

          <!-- Danger zone -->
          <AdminCard title="Danger Zone">
            <p class="text-sm text-base-content/60 mb-3">Deleting a workspace is permanent and cannot be undone.</p>
            <button class="btn btn-sm btn-error w-full" :disabled="deleting" @click="remove">
              {{ deleting ? 'Deleting...' : 'Delete workspace' }}
            </button>
          </AdminCard>
        </div>
      </div>

      <!-- Members -->
      <AdminCard title="Members" class="mt-6" no-padding>
        <div class="overflow-x-auto">
          <table class="table table-sm table-zebra">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                <th class="pl-5">Account ID</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in detail.members" :key="m.id">
                <td class="pl-5">
                  <span class="text-xs font-mono text-base-content/70">{{ m.accountId }}</span>
                </td>
                <td>
                  <span class="badge badge-xs" :class="roleBadgeClass(m.role)">{{ roleLabel(m.role) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="detail.members.length === 0" class="px-5 py-6 text-sm text-base-content/40 text-center">
          No members
        </div>
      </AdminCard>

      <!-- Role permissions -->
      <AdminCard title="Role Permissions" class="mt-6" no-padding>
        <div class="overflow-x-auto">
          <table class="table table-sm table-zebra">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                <th class="pl-5">Role Level</th>
                <th v-for="flag in permissionFlags" :key="flag">{{ flagName(flag) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rp in detail.rolePermissions" :key="rp.id">
                <td class="pl-5">
                  <span class="badge badge-xs">{{ roleLabel(rp.roleLevel) }}</span>
                </td>
                <td v-for="flag in permissionFlags" :key="flag" class="text-center">
                  <span :class="rp[flag] ? 'text-success' : 'text-base-content/30'">{{ rp[flag] ? '✓' : '—' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="detail.rolePermissions.length === 0" class="px-5 py-6 text-sm text-base-content/40 text-center">
          No role permissions configured
        </div>
      </AdminCard>

      <!-- User permissions -->
      <AdminCard title="User Permissions" class="mt-6" no-padding>
        <div class="overflow-x-auto">
          <table class="table table-sm table-zebra">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                <th class="pl-5">Account ID</th>
                <th v-for="flag in permissionFlags" :key="flag">{{ flagName(flag) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="up in detail.userPermissions" :key="up.id">
                <td class="pl-5">
                  <span class="text-xs font-mono text-base-content/70">{{ up.accountId }}</span>
                </td>
                <td v-for="flag in permissionFlags" :key="flag" class="text-center">
                  <span :class="up[flag] === null || up[flag] === undefined ? 'text-base-content/30' : up[flag] ? 'text-success' : 'text-error'">
                    {{ up[flag] === null || up[flag] === undefined ? '·' : up[flag] ? '✓' : '✕' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="detail.userPermissions.length === 0" class="px-5 py-6 text-sm text-base-content/40 text-center">
          No user permission overrides
        </div>
      </AdminCard>

      <!-- Bundled plans -->
      <AdminCard title="Bundled Plans" class="mt-6" no-padding>
        <div class="overflow-x-auto">
          <table class="table table-sm table-zebra">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                <th class="pl-5">Account ID</th>
                <th>Plan</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bp in detail.bundledPlans" :key="bp.id">
                <td class="pl-5">
                  <span class="text-xs font-mono text-base-content/70">{{ bp.accountId }}</span>
                </td>
                <td>{{ planLabel(bp.plan) }}</td>
                <td>
                  <span class="badge badge-xs" :class="bp.active ? 'badge-success' : 'badge-ghost'">{{ bp.active ? 'Active' : 'Inactive' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="detail.bundledPlans.length === 0" class="px-5 py-6 text-sm text-base-content/40 text-center">
          No bundled plans
        </div>
      </AdminCard>
    </div>
    <div v-else class="flex flex-col items-center py-16 text-center">
      <IconBuilding2 class="w-12 h-12 text-base-content/20 mb-4" />
      <p class="text-base-content/50 mb-1">Workspace not found</p>
      <NuxtLink to="/admin/workspaces" class="btn btn-sm btn-ghost mt-2">
        <IconArrowLeft class="w-4 h-4" />
        Back to workspaces
      </NuxtLink>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconRefreshCw, IconBuilding2 } from '#components'
import type { WorkspaceAdminDetail } from '~/types/admin'
import {
  fetchAdminWorkspace,
  updateAdminWorkspace,
  updateAdminWorkspacePlan,
  deleteAdminWorkspace,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { destructive } = useAlert()

const detail = ref<WorkspaceAdminDetail | null>(null)
const isLoadingDetail = ref(false)
const refreshLoading = ref(false)
const loadError = ref('')

const savingEdit = ref(false)
const savingPlan = ref(false)
const deleting = ref(false)

const editForm = ref({ name: '', description: '', slug: '' })
const planForm = ref<{ plan: number; planExpiresAt: string }>({ plan: 0, planExpiresAt: '' })

const permissionFlags = [
  'canManageWorkspace',
  'canManageMembers',
  'canManageBilling',
  'canCreateProjects',
  'canManageProjects',
  'canUseIdeask',
  'canUseDrive',
] as const

const workspace = computed(() => detail.value?.workspace)

const permissionNames: Record<string, string> = {
  canManageWorkspace: 'Manage Workspace',
  canManageMembers: 'Manage Members',
  canManageBilling: 'Manage Billing',
  canCreateProjects: 'Create Projects',
  canManageProjects: 'Manage Projects',
  canUseIdeask: 'Use Ideask',
  canUseDrive: 'Use Drive',
}

function flagName(flag: string) {
  return permissionNames[flag] || flag
}

function roleLabel(role: number) {
  if (role >= 100) return 'Owner'
  if (role >= 75) return 'Admin'
  if (role >= 50) return 'Member'
  return 'Viewer'
}

function roleBadgeClass(role: number) {
  if (role >= 100) return 'badge-warning'
  if (role >= 75) return 'badge-primary'
  if (role >= 50) return 'badge-info'
  return 'badge-ghost'
}

function planLabel(plan: number) {
  return ['Free', 'Pro', 'Enterprise'][plan] || `Plan ${plan}`
}

function planBadgeClass(plan: number) {
  if (plan === 2) return 'badge-secondary'
  if (plan === 1) return 'badge-primary'
  return 'badge-ghost'
}

function formatDateTime(x: string) {
  try { return new Date(x).toLocaleString() } catch { return x }
}

async function load() {
  refreshLoading.value = true
  isLoadingDetail.value = !detail.value
  loadError.value = ''
  try {
    const d = await fetchAdminWorkspace(String(route.params.id))
    detail.value = d
    editForm.value = {
      name: d.workspace.name || '',
      description: d.workspace.description || '',
      slug: d.workspace.slug || '',
    }
    planForm.value = {
      plan: d.workspace.plan,
      planExpiresAt: d.workspace.planExpiresAt ? toLocalInput(d.workspace.planExpiresAt) : '',
    }
  } catch (e: any) {
    detail.value = null
    loadError.value = (e?.data?.message || e?.message || 'Failed to load workspace. It may not exist or you lack permission.')
  } finally {
    refreshLoading.value = false
    isLoadingDetail.value = false
  }
}

function toLocalInput(value: string) {
  try {
    const d = new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

async function refresh() {
  await load()
}

async function saveEdit() {
  if (savingEdit.value) return
  savingEdit.value = true
  try {
    await updateAdminWorkspace(String(route.params.id), {
      name: editForm.value.name || undefined,
      description: editForm.value.description || undefined,
      slug: editForm.value.slug || undefined,
    })
    useNuxtApp().$toast.success('Workspace updated')
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed to update workspace')
  } finally {
    savingEdit.value = false
  }
}

async function savePlan() {
  if (savingPlan.value) return
  savingPlan.value = true
  try {
    await updateAdminWorkspacePlan(String(route.params.id), {
      plan: planForm.value.plan,
      planExpiresAt: planForm.value.planExpiresAt ? new Date(planForm.value.planExpiresAt).toISOString() : null,
    })
    useNuxtApp().$toast.success('Plan updated')
    await load()
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed to update plan')
  } finally {
    savingPlan.value = false
  }
}

async function remove() {
  const ok = await destructive(
    'Delete workspace',
    `Delete “${workspace.value?.name || workspace.value?.slug || ''}” permanently? This cannot be undone.`,
  )
  if (!ok) return
  deleting.value = true
  try {
    await deleteAdminWorkspace(String(route.params.id))
    useNuxtApp().$toast.success('Workspace deleted')
    await navigateTo('/admin/workspaces')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed to delete workspace')
  } finally {
    deleting.value = false
  }
}

onMounted(() => load())
</script>