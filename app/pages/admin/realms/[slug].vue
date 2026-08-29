<template>
  <NuxtLayout name="admin">
    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <template v-else-if="detail">
      <AdminPageHeader :title="detail.realm.name" :description="`/${detail.realm.slug}`">
        <template #actions>
          <button class="btn btn-sm btn-error" :disabled="actLoading" @click="deleteRealm">
            <IconTrash2 class="w-4 h-4" />
            Delete
          </button>
        </template>
      </AdminPageHeader>

      <AdminCard class="mb-4">
        <div class="flex items-start gap-4">
          <div class="avatar shrink-0">
            <div class="w-14 rounded-full">
              <FileImage
                v-if="detail.realm.picture"
                :file="detail.realm.picture"
                :alt="detail.realm.name"
              />
              <div
                v-else
                class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold"
              >
                {{ detail.realm.name.slice(0, 2).toUpperCase() }}
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Members</span>
              <p class="mt-1 font-semibold tabular-nums">{{ detail.memberCount }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Pending invites</span>
              <p class="mt-1 tabular-nums">{{ detail.pendingInviteCount }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Labels</span>
              <p class="mt-1 tabular-nums">{{ detail.labelCount }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Boost</span>
              <p class="mt-1">
                L{{ detail.realm.boostLevel ?? 0 }}
                <span class="text-base-content/40 text-xs">({{ detail.realm.boostPoints ?? 0 }} pts)</span>
              </p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Public</span>
              <p class="mt-1">{{ detail.realm.isPublic ? 'Yes' : 'No' }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Community</span>
              <p class="mt-1">{{ detail.realm.isCommunity ? 'Yes' : 'No' }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Owner account</span>
              <p class="mt-1 font-mono text-xs truncate">{{ detail.realm.accountId || '—' }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Active boosts</span>
              <p class="mt-1 tabular-nums">{{ detail.activeBoostContributionCount }}</p>
            </div>
          </div>
        </div>
        <p v-if="detail.realm.description" class="text-sm text-base-content/60 mt-4">
          {{ detail.realm.description }}
        </p>
      </AdminCard>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <AdminCard>
          <h3 class="text-sm font-semibold mb-3">Profile</h3>
          <div class="space-y-3">
            <input v-model="editForm.name" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" placeholder="Name" />
            <input v-model="editForm.slug" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl font-mono" placeholder="slug" />
            <textarea v-model="editForm.description" class="textarea textarea-sm w-full bg-base-200/60 border-0 rounded-xl" rows="3" placeholder="Description" />
            <input v-model="editForm.accountId" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl font-mono" placeholder="Owner account UUID" />
            <label class="flex items-center gap-2 text-sm">
              <input v-model="editForm.isPublic" type="checkbox" class="checkbox checkbox-sm" />
              Public
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="editForm.isCommunity" type="checkbox" class="checkbox checkbox-sm" />
              Community (open join)
            </label>
            <button class="btn btn-sm btn-primary" :disabled="actLoading" @click="saveProfile">
              Save profile
            </button>
          </div>
        </AdminCard>

        <AdminCard>
          <h3 class="text-sm font-semibold mb-3">Verification</h3>
          <div v-if="detail.realm.verification" class="mb-3 text-sm">
            <span class="badge badge-success badge-sm mr-2">{{ detail.realm.verification.type }}</span>
            <span>{{ detail.realm.verification.title || 'Verified' }}</span>
          </div>
          <div class="space-y-3">
            <select v-model="verifyForm.type" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
              <option value="organization">Organization</option>
              <option value="official">Official</option>
              <option value="creator">Creator</option>
              <option value="developer">Developer</option>
              <option value="individual">Individual</option>
              <option value="government">Government</option>
              <option value="parody">Parody</option>
            </select>
            <input v-model="verifyForm.title" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" placeholder="Title" />
            <input v-model="verifyForm.verifiedBy" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" placeholder="Verified by" />
            <input v-model="verifyForm.description" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" placeholder="Description" />
            <div class="flex flex-wrap gap-2">
              <button class="btn btn-sm btn-primary" :disabled="actLoading" @click="setVerification">
                Set verification
              </button>
              <button
                v-if="detail.realm.verification"
                class="btn btn-sm btn-ghost"
                :disabled="actLoading"
                @click="clearVerification"
              >
                Clear
              </button>
            </div>
          </div>
        </AdminCard>
      </div>

      <!-- Members -->
      <AdminCard no-padding class="mb-4">
        <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-base-300/20">
          <h3 class="text-sm font-semibold">Members</h3>
          <div class="flex flex-wrap gap-2">
            <select v-model="memberRoleFilter" class="select select-xs bg-base-200/60 border-0 rounded-lg" @change="loadMembers">
              <option value="">All roles</option>
              <option value="100">Owner</option>
              <option value="50">Moderator</option>
              <option value="0">Normal</option>
            </select>
            <label class="flex items-center gap-1.5 text-xs">
              <input v-model="pendingOnly" type="checkbox" class="checkbox checkbox-xs" @change="loadMembers" />
              Pending only
            </label>
          </div>
        </div>

        <div v-if="membersLoading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-sm" />
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                <th class="pl-5">Member</th>
                <th>Role</th>
                <th>Level</th>
                <th class="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in members" :key="m.accountId">
                <td class="pl-5">
                  <div class="text-sm font-medium">
                    {{ m.account?.nick || m.nick || m.account?.name || m.accountId.slice(0, 8) }}
                  </div>
                  <div class="text-xs text-base-content/40 font-mono">
                    {{ m.account?.name ? `@${m.account.name}` : m.accountId }}
                  </div>
                </td>
                <td>
                  <select
                    class="select select-xs bg-base-200/60 border-0 rounded-lg"
                    :value="m.role"
                    :disabled="actLoading"
                    @change="onRoleChange(m, ($event.target as HTMLSelectElement).value)"
                  >
                    <option :value="0">Normal</option>
                    <option :value="50">Moderator</option>
                    <option :value="100">Owner</option>
                  </select>
                </td>
                <td>
                  <span class="text-sm tabular-nums">{{ m.level ?? 0 }}</span>
                </td>
                <td class="pr-5 text-right">
                  <button class="btn btn-ghost btn-xs text-error" :disabled="actLoading" @click="kickMember(m)">
                    <IconUserMinus class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="members.length === 0" class="px-5 py-8 text-center text-sm text-base-content/40">
            No members
          </div>
        </div>
      </AdminCard>

      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/admin/posts?realmId=${detail.realm.id}`" class="btn btn-sm btn-ghost">
          View posts
        </NuxtLink>
        <NuxtLink :to="`/realms/${detail.realm.slug}`" class="btn btn-sm btn-ghost" target="_blank">
          Public page
        </NuxtLink>
      </div>
    </template>

    <div v-else class="flex flex-col items-center py-16 text-center">
      <IconAlertTriangle class="w-12 h-12 text-base-content/20 mb-4" />
      <p class="text-base-content/50">Realm not found</p>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconTrash2, IconUserMinus, IconAlertTriangle } from '#components'
import type { AdminRealmDetail, AdminRealmMember } from '~/types/admin'
import {
  fetchAdminRealm,
  updateAdminRealm,
  setAdminRealmVerification,
  clearAdminRealmVerification,
  fetchAdminRealmMembers,
  updateAdminRealmMemberRole,
  removeAdminRealmMember,
  deleteAdminRealm,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { destructive } = useAlert()
const detail = ref<AdminRealmDetail | null>(null)
const isLoading = ref(true)
const actLoading = ref(false)
const members = ref<AdminRealmMember[]>([])
const membersLoading = ref(false)
const memberRoleFilter = ref('')
const pendingOnly = ref(false)

const editForm = ref({
  name: '',
  slug: '',
  description: '',
  accountId: '',
  isPublic: false,
  isCommunity: false,
})

const verifyForm = ref({
  type: 'organization',
  title: '',
  description: '',
  verifiedBy: 'admin',
})

async function load() {
  isLoading.value = true
  try {
    detail.value = await fetchAdminRealm(route.params.slug as string)
    const r = detail.value.realm
    editForm.value = {
      name: r.name,
      slug: r.slug,
      description: r.description || '',
      accountId: r.accountId || '',
      isPublic: !!r.isPublic,
      isCommunity: !!r.isCommunity,
    }
    await loadMembers()
  } catch {
    detail.value = null
  } finally {
    isLoading.value = false
  }
}

async function loadMembers() {
  if (!detail.value) return
  membersLoading.value = true
  try {
    const result = await fetchAdminRealmMembers(detail.value.realm.slug, {
      role: memberRoleFilter.value !== '' ? Number(memberRoleFilter.value) : undefined,
      pendingOnly: pendingOnly.value || undefined,
      take: 100,
    })
    members.value = result.items
  } catch {
    members.value = []
  } finally {
    membersLoading.value = false
  }
}

async function saveProfile() {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await updateAdminRealm(detail.value.realm.slug, {
      name: editForm.value.name || undefined,
      slug: editForm.value.slug || undefined,
      description: editForm.value.description || undefined,
      accountId: editForm.value.accountId || undefined,
      isPublic: editForm.value.isPublic,
      isCommunity: editForm.value.isCommunity,
    })
    detail.value.realm = { ...detail.value.realm, ...updated }
    if (updated.slug && updated.slug !== route.params.slug) {
      await navigateTo(`/admin/realms/${updated.slug}`, { replace: true })
    }
    useNuxtApp().$toast.success('Realm updated')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Update failed')
  } finally {
    actLoading.value = false
  }
}

async function setVerification() {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await setAdminRealmVerification(detail.value.realm.slug, {
      type: verifyForm.value.type,
      title: verifyForm.value.title || undefined,
      description: verifyForm.value.description || undefined,
      verifiedBy: verifyForm.value.verifiedBy || undefined,
    })
    detail.value.realm = { ...detail.value.realm, ...updated }
    useNuxtApp().$toast.success('Verification set')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed')
  } finally {
    actLoading.value = false
  }
}

async function clearVerification() {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await clearAdminRealmVerification(detail.value.realm.slug)
    detail.value.realm = { ...detail.value.realm, ...updated }
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed')
  } finally {
    actLoading.value = false
  }
}

async function onRoleChange(member: AdminRealmMember, roleValue: string) {
  if (!detail.value || actLoading.value) return
  const role = Number(roleValue)
  if (role === member.role) return
  actLoading.value = true
  try {
    await updateAdminRealmMemberRole(detail.value.realm.slug, member.accountId, { role })
    member.role = role
    useNuxtApp().$toast.success('Role updated')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Role update failed')
    await loadMembers()
  } finally {
    actLoading.value = false
  }
}

async function kickMember(member: AdminRealmMember) {
  if (!detail.value) return
  const label = member.account?.name || member.accountId
  const ok = await destructive('Remove member', `Remove ${label} from this realm?`)
  if (!ok) return
  actLoading.value = true
  try {
    await removeAdminRealmMember(detail.value.realm.slug, member.accountId)
    useNuxtApp().$toast.success('Member removed')
    await loadMembers()
    detail.value.memberCount = Math.max(0, detail.value.memberCount - 1)
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed')
  } finally {
    actLoading.value = false
  }
}

async function deleteRealm() {
  if (!detail.value) return
  const ok = await destructive(
    'Delete realm',
    `Permanently delete /${detail.value.realm.slug}? This is destructive.`,
  )
  if (!ok) return
  actLoading.value = true
  try {
    await deleteAdminRealm(detail.value.realm.slug)
    useNuxtApp().$toast.success('Realm deleted')
    await navigateTo('/admin/realms')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Delete failed')
  } finally {
    actLoading.value = false
  }
}

onMounted(() => load())
</script>
