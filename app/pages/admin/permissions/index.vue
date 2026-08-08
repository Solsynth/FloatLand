<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Permissions" description="Manage permission groups, nodes, and memberships">
      <template #actions>
        <button class="btn btn-sm btn-primary" @click="openCreateGroup">
          <IconPlus class="w-4 h-4" />
          New Group
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Groups list -->
      <div class="lg:col-span-1 space-y-4">
        <AdminCard>
          <div class="relative">
            <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              v-model="groupQuery"
              type="text"
              placeholder="Search groups..."
              class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
              @keyup.enter="loadGroups"
            />
          </div>
        </AdminCard>

        <div v-if="groupsLoading" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-md" />
        </div>

        <AdminCard
          v-for="group in groups"
          :key="group.id"
          class="cursor-pointer transition-all"
          :class="selectedGroupId === group.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-base-200'"
          @click="selectGroup(group.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold truncate">{{ group.key }}</span>
                <span v-if="group.key === 'default'" class="badge badge-ghost badge-xs">default</span>
              </div>
              <div class="text-xs text-base-content/40 mt-1">
                {{ group.nodeCount }} nodes · {{ group.memberCount }} members
              </div>
            </div>
            <IconChevronRight class="w-4 h-4 text-base-content/30 shrink-0" />
          </div>
        </AdminCard>

        <div v-if="!groupsLoading && groups.length === 0" class="text-center py-8 text-sm text-base-content/40">
          No permission groups found
        </div>
      </div>

      <!-- Group detail -->
      <div class="lg:col-span-2 space-y-4">
        <div v-if="!selectedGroupId" class="flex flex-col items-center py-20 text-center">
          <IconKeyRound class="w-12 h-12 text-base-content/20 mb-4" />
          <p class="text-base-content/50">Select a permission group</p>
          <p class="text-xs text-base-content/30 mt-1">Or inspect permissions for an actor below</p>
        </div>

        <template v-else-if="detail">
          <AdminCard>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-bold">{{ detail.group.key }}</h2>
                <p class="text-xs text-base-content/40 font-mono mt-0.5">{{ detail.group.id }}</p>
              </div>
              <div class="flex flex-wrap gap-1">
                <button
                  class="btn btn-ghost btn-xs"
                  :disabled="detail.group.key === 'default'"
                  @click="openRenameGroup"
                >
                  <IconPencil class="w-3.5 h-3.5" /> Rename
                </button>
                <button
                  class="btn btn-ghost btn-xs text-error"
                  :disabled="detail.group.key === 'default'"
                  @click="doDeleteGroup"
                >
                  <IconTrash2 class="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </AdminCard>

          <!-- Nodes -->
          <AdminCard :title="`Permission Nodes (${detail.nodeTotal})`">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="openAddNode">
                <IconPlus class="w-3.5 h-3.5" /> Add
              </button>
            </template>
            <div v-if="detail.nodes.length" class="space-y-2">
              <div
                v-for="node in detail.nodes"
                :key="node.id"
                class="flex items-start gap-3 p-3 rounded-lg bg-base-200/50"
              >
                <IconShield class="w-4 h-4 text-base-content/40 shrink-0 mt-0.5" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium font-mono">{{ node.key }}</div>
                  <div class="text-xs text-base-content/50 mt-0.5 break-all">
                    value: {{ formatNodeValue(node.value) }}
                  </div>
                  <div class="flex flex-wrap gap-x-3 text-[10px] text-base-content/35 mt-1">
                    <span v-if="node.affectedAt">affected {{ formatDate(node.affectedAt) }}</span>
                    <span v-if="node.expiredAt">expires {{ formatDate(node.expiredAt) }}</span>
                    <span v-else>no expiry</span>
                  </div>
                </div>
                <button class="btn btn-ghost btn-xs text-error" @click="doDeleteNode(node.key)">
                  <IconTrash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
            <div v-if="detail.nodes.length < detail.nodeTotal" class="pt-3">
              <button class="btn btn-ghost btn-sm" :disabled="nodesLoading" @click="loadMoreNodes">
                {{ nodesLoading ? 'Loading...' : `Load more (${detail.nodeTotal - detail.nodes.length} remaining)` }}
              </button>
            </div>
            <p v-else class="text-sm text-base-content/40">No permission nodes</p>
          </AdminCard>

          <!-- Members -->
          <AdminCard :title="`Members (${detail.memberTotal})`">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="openAddMember">
                <IconPlus class="w-3.5 h-3.5" /> Add
              </button>
            </template>
            <div v-if="detail.members.length" class="space-y-2">
              <div
                v-for="member in detail.members"
                :key="member.actor"
                class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50"
              >
                <IconUser class="w-4 h-4 text-base-content/40 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-mono truncate">{{ member.actor }}</div>
                  <div class="text-[10px] text-base-content/35 mt-0.5">
                    <span v-if="member.expiredAt">expires {{ formatDate(member.expiredAt) }}</span>
                    <span v-else>no expiry</span>
                  </div>
                </div>
                <button class="btn btn-ghost btn-xs" @click="inspectActor(member.actor)">Inspect</button>
                <button class="btn btn-ghost btn-xs text-error" @click="doRemoveMember(member.actor)">
                  <IconTrash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
            <div v-if="detail.members.length < detail.memberTotal" class="pt-3">
              <button class="btn btn-ghost btn-sm" :disabled="membersLoading" @click="loadMoreMembers">
                {{ membersLoading ? 'Loading...' : `Load more (${detail.memberTotal - detail.members.length} remaining)` }}
              </button>
            </div>
            <p v-else class="text-sm text-base-content/40">No members</p>
          </AdminCard>
        </template>

        <div v-else-if="detailLoading" class="flex justify-center py-16">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <!-- Actor inspection -->
        <AdminCard title="Inspect Actor Permissions">
          <div class="flex gap-2 mb-4">
            <input
              v-model="actorQuery"
              type="text"
              placeholder="account:uuid or actor string..."
              class="input input-sm flex-1 rounded-box border-0 bg-base-200 font-mono"
              @keyup.enter="loadActor"
            />
            <button class="btn btn-sm btn-primary" :disabled="actorLoading" @click="loadActor">
              Lookup
            </button>
          </div>
          <div v-if="actorLoading" class="flex justify-center py-6">
            <span class="loading loading-spinner loading-sm" />
          </div>
          <div v-else-if="actorPerms" class="space-y-4">
            <div>
              <p class="text-xs uppercase tracking-wider text-base-content/40 mb-2">Groups</p>
              <div v-if="actorPerms.groups.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="g in actorPerms.groups"
                  :key="g.groupId + g.actor"
                  class="badge badge-outline badge-sm"
                >
                  {{ g.groupId.slice(0, 8) }}…
                </span>
              </div>
              <p v-else class="text-xs text-base-content/40">No group memberships</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wider text-base-content/40 mb-2">
                Direct ({{ actorPerms.directPermissions.length }})
              </p>
              <div class="space-y-1 max-h-40 overflow-y-auto">
                <div
                  v-for="n in actorPerms.directPermissions"
                  :key="n.id"
                  class="text-xs font-mono p-2 rounded bg-base-200/50"
                >
                  {{ n.key }} = {{ formatNodeValue(n.value) }}
                </div>
                <p v-if="!actorPerms.directPermissions.length" class="text-xs text-base-content/40">None</p>
              </div>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wider text-base-content/40 mb-2">
                Effective ({{ actorPerms.effectivePermissions.length }})
              </p>
              <div class="space-y-1 max-h-48 overflow-y-auto">
                <div
                  v-for="n in actorPerms.effectivePermissions"
                  :key="n.id + n.key"
                  class="text-xs font-mono p-2 rounded bg-base-200/50"
                >
                  {{ n.key }} = {{ formatNodeValue(n.value) }}
                </div>
                <p v-if="!actorPerms.effectivePermissions.length" class="text-xs text-base-content/40">None</p>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>

    <!-- Create group drawer -->
    <AdminDrawer :open="createOpen" title="New Permission Group" @update:open="createOpen = $event">
      <form class="space-y-3" @submit.prevent="doCreateGroup">
        <div>
          <label class="text-xs text-base-content/50">Group key</label>
          <input
            v-model="createKey"
            type="text"
            class="input input-sm w-full rounded-box border-0 bg-base-200 font-mono"
            placeholder="moderators"
            required
          />
        </div>
        <button class="btn btn-sm btn-primary w-full" :disabled="saving">
          {{ saving ? 'Creating...' : 'Create Group' }}
        </button>
      </form>
    </AdminDrawer>

    <!-- Rename group drawer -->
    <AdminDrawer :open="renameOpen" title="Rename Group" @update:open="renameOpen = $event">
      <form class="space-y-3" @submit.prevent="doRenameGroup">
        <div>
          <label class="text-xs text-base-content/50">New key</label>
          <input
            v-model="renameKey"
            type="text"
            class="input input-sm w-full rounded-box border-0 bg-base-200 font-mono"
            required
          />
        </div>
        <button class="btn btn-sm btn-primary w-full" :disabled="saving">
          {{ saving ? 'Saving...' : 'Rename' }}
        </button>
      </form>
    </AdminDrawer>

    <!-- Add node drawer -->
    <AdminDrawer :open="nodeOpen" title="Add Permission Node" @update:open="nodeOpen = $event">
      <form class="space-y-3" @submit.prevent="doAddNode">
        <div>
          <label class="text-xs text-base-content/50">Permission key</label>
          <input
            v-model="nodeForm.key"
            type="text"
            class="input input-sm w-full rounded-box border-0 bg-base-200 font-mono"
            placeholder="posts.moderate"
            required
          />
        </div>
        <div>
          <label class="text-xs text-base-content/50">Value (JSON)</label>
          <input
            v-model="nodeForm.valueText"
            type="text"
            class="input input-sm w-full rounded-box border-0 bg-base-200 font-mono"
            placeholder="true"
          />
        </div>
        <div>
          <label class="text-xs text-base-content/50">Expires at (optional)</label>
          <input v-model="nodeForm.expiredAt" type="datetime-local" class="input input-sm w-full rounded-box border-0 bg-base-200" />
        </div>
        <button class="btn btn-sm btn-primary w-full" :disabled="saving">
          {{ saving ? 'Saving...' : 'Upsert Node' }}
        </button>
      </form>
    </AdminDrawer>

    <!-- Add member drawer -->
    <AdminDrawer :open="memberOpen" title="Add Group Member" @update:open="memberOpen = $event">
      <form class="space-y-3" @submit.prevent="doAddMember">
        <div>
          <label class="text-xs text-base-content/50">Actor</label>
          <input
            v-model="memberForm.actor"
            type="text"
            class="input input-sm w-full rounded-box border-0 bg-base-200 font-mono"
            placeholder="account:550e8400-..."
            required
          />
          <p class="text-[10px] text-base-content/35 mt-1">Usually <code>account:{guid}</code></p>
        </div>
        <div>
          <label class="text-xs text-base-content/50">Expires at (optional)</label>
          <input v-model="memberForm.expiredAt" type="datetime-local" class="input input-sm w-full rounded-box border-0 bg-base-200" />
        </div>
        <button class="btn btn-sm btn-primary w-full" :disabled="saving">
          {{ saving ? 'Saving...' : 'Add Member' }}
        </button>
      </form>
    </AdminDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconPlus,
  IconSearch,
  IconChevronRight,
  IconKeyRound,
  IconPencil,
  IconTrash2,
  IconShield,
  IconUser,
} from '#components'
import type {
  PermissionGroupSummary,
  PermissionGroupDetail,
  ActorPermissions,
} from '~/types/admin'
import {
  fetchPermissionGroups,
  fetchPermissionGroup,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  upsertGroupPermission,
  deleteGroupPermission,
  upsertGroupMember,
  deleteGroupMember,
  fetchActorPermissions,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const groups = ref<PermissionGroupSummary[]>([])
const groupsLoading = ref(false)
const groupQuery = ref('')
const selectedGroupId = ref<string | null>(null)
const detail = ref<PermissionGroupDetail | null>(null)
const detailLoading = ref(false)
const nodesLoading = ref(false)
const membersLoading = ref(false)
const saving = ref(false)

const createOpen = ref(false)
const createKey = ref('')
const renameOpen = ref(false)
const renameKey = ref('')
const nodeOpen = ref(false)
const nodeForm = ref({ key: '', valueText: 'true', expiredAt: '' })
const memberOpen = ref(false)
const memberForm = ref({ actor: '', expiredAt: '' })

const actorQuery = ref('')
const actorLoading = ref(false)
const actorPerms = ref<ActorPermissions | null>(null)

function formatNodeValue(value: unknown): string {
  if (value === undefined || value === null) return 'null'
  if (typeof value === 'object') {
    try {
      // JsonDocument may deserialize oddly
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function toIsoOrUndefined(local: string): string | undefined {
  if (!local) return undefined
  return new Date(local).toISOString()
}

async function loadGroups() {
  groupsLoading.value = true
  try {
    groups.value = await fetchPermissionGroups(groupQuery.value || undefined)
  } catch {
    groups.value = []
    useNuxtApp().$toast.error('Failed to load permission groups')
  } finally {
    groupsLoading.value = false
  }
}

async function selectGroup(id: string) {
  selectedGroupId.value = id
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await fetchPermissionGroup(id)
  } catch {
    detail.value = null
    useNuxtApp().$toast.error('Failed to load group detail')
  } finally {
    detailLoading.value = false
  }
}

async function loadMoreNodes() {
  if (!selectedGroupId.value || !detail.value) return
  nodesLoading.value = true
  try {
    const page = await fetchPermissionGroup(selectedGroupId.value, {
      nodesOffset: detail.value.nodes.length,
      membersTake: 0,
    })
    detail.value.nodes.push(...page.nodes)
    detail.value.nodeTotal = page.nodeTotal
  } catch {
    useNuxtApp().$toast.error('Failed to load more permission nodes')
  } finally {
    nodesLoading.value = false
  }
}

async function loadMoreMembers() {
  if (!selectedGroupId.value || !detail.value) return
  membersLoading.value = true
  try {
    const page = await fetchPermissionGroup(selectedGroupId.value, {
      nodesTake: 0,
      membersOffset: detail.value.members.length,
    })
    detail.value.members.push(...page.members)
    detail.value.memberTotal = page.memberTotal
  } catch {
    useNuxtApp().$toast.error('Failed to load more members')
  } finally {
    membersLoading.value = false
  }
}

function openCreateGroup() {
  createKey.value = ''
  createOpen.value = true
}

async function doCreateGroup() {
  saving.value = true
  try {
    const group = await createPermissionGroup(createKey.value.trim())
    createOpen.value = false
    await loadGroups()
    if (group?.id) await selectGroup(group.id)
  } catch {
    useNuxtApp().$toast.error('Failed to create group')
  } finally {
    saving.value = false
  }
}

function openRenameGroup() {
  if (!detail.value) return
  renameKey.value = detail.value.group.key
  renameOpen.value = true
}

async function doRenameGroup() {
  if (!selectedGroupId.value) return
  saving.value = true
  try {
    await updatePermissionGroup(selectedGroupId.value, renameKey.value.trim())
    renameOpen.value = false
    await loadGroups()
    await selectGroup(selectedGroupId.value)
  } catch {
    useNuxtApp().$toast.error('Failed to rename group')
  } finally {
    saving.value = false
  }
}

async function doDeleteGroup() {
  if (!selectedGroupId.value || !detail.value) return
  if (detail.value.group.key === 'default') return
  if (!(await useAlert().confirm('Confirm', `Delete permission group "${detail.value.group.key}"?`))) return
  try {
    await deletePermissionGroup(selectedGroupId.value)
    selectedGroupId.value = null
    detail.value = null
    await loadGroups()
  } catch {
    useNuxtApp().$toast.error('Failed to delete group')
  }
}

function openAddNode() {
  nodeForm.value = { key: '', valueText: 'true', expiredAt: '' }
  nodeOpen.value = true
}

async function doAddNode() {
  if (!selectedGroupId.value) return
  saving.value = true
  try {
    let value: unknown = true
    const raw = nodeForm.value.valueText.trim()
    try {
      value = JSON.parse(raw)
    } catch {
      value = raw
    }
    await upsertGroupPermission(selectedGroupId.value, nodeForm.value.key.trim(), {
      value,
      expiredAt: toIsoOrUndefined(nodeForm.value.expiredAt) ?? null,
    })
    nodeOpen.value = false
    await selectGroup(selectedGroupId.value)
  } catch {
    useNuxtApp().$toast.error('Failed to upsert permission')
  } finally {
    saving.value = false
  }
}

async function doDeleteNode(key: string) {
  if (!selectedGroupId.value) return
  if (!(await useAlert().confirm('Confirm', `Remove permission node "${key}"?`))) return
  try {
    await deleteGroupPermission(selectedGroupId.value, key)
    await selectGroup(selectedGroupId.value)
  } catch {
    useNuxtApp().$toast.error('Failed to delete permission')
  }
}

function openAddMember() {
  memberForm.value = { actor: '', expiredAt: '' }
  memberOpen.value = true
}

async function doAddMember() {
  if (!selectedGroupId.value) return
  saving.value = true
  try {
    await upsertGroupMember(selectedGroupId.value, memberForm.value.actor.trim(), {
      expiredAt: toIsoOrUndefined(memberForm.value.expiredAt) ?? null,
    })
    memberOpen.value = false
    await selectGroup(selectedGroupId.value)
    await loadGroups()
  } catch {
    useNuxtApp().$toast.error('Failed to add member')
  } finally {
    saving.value = false
  }
}

async function doRemoveMember(actor: string) {
  if (!selectedGroupId.value) return
  if (!(await useAlert().confirm('Confirm', `Remove ${actor} from this group?`))) return
  try {
    await deleteGroupMember(selectedGroupId.value, actor)
    await selectGroup(selectedGroupId.value)
    await loadGroups()
  } catch {
    useNuxtApp().$toast.error('Failed to remove member')
  }
}

function inspectActor(actor: string) {
  actorQuery.value = actor
  loadActor()
}

async function loadActor() {
  const actor = actorQuery.value.trim()
  if (!actor) return
  actorLoading.value = true
  actorPerms.value = null
  try {
    actorPerms.value = await fetchActorPermissions(actor)
  } catch {
    useNuxtApp().$toast.error('Failed to load actor permissions')
  } finally {
    actorLoading.value = false
  }
}

onMounted(loadGroups)
</script>
