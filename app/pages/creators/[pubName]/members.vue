<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">{{ t('creator.members.title') }}</h1>
        <button v-if="isManager" class="btn btn-primary btn-sm" @click="openInviteModal">
          <IconUserPlus class="w-4 h-4" />
          {{ t('creator.members.invite') }}
        </button>
      </div>

      <ConfuseSpinner v-if="status === 'pending'" />

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="member in members"
          :key="member.id"
          class="card bg-base-100 shadow-sm"
        >
          <div class="card-body p-4 flex-row items-center gap-4">
            <div class="avatar">
              <div class="w-10 rounded-full">
                <img v-if="getFileUrl(member.account?.profile?.picture?.id)" :src="getFileUrl(member.account?.profile?.picture?.id)" :alt="member.account?.nick" />
                <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold">
                  {{ (member.account?.nick || '?').slice(0, 2).toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ member.account?.nick }}</span>
                <span v-if="!member.joinedAt" class="badge badge-warning badge-xs">{{ t('creator.members.pending') }}</span>
              </div>
              <div class="text-sm text-base-content/50">
                {{ roleLabel(member.role) }} &middot; @{{ member.account?.name }}
              </div>
            </div>
            <div v-if="isManager" class="flex gap-1">
              <button class="btn btn-ghost btn-xs" @click="openRoleEditor(member)">
                <IconPencil class="w-3 h-3" />
              </button>
              <button class="btn btn-ghost btn-xs text-error" @click="handleRemove(member.accountId)">
                <IconTrash class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="flex justify-center py-4">
          <button class="btn btn-ghost btn-sm" @click="loadMore">
            {{ t('common.loadMore') }}
          </button>
        </div>
      </div>

      <!-- Role Editor Drawer -->
      <AdminDrawer
        :open="roleModalOpen"
        @update:open="roleModalOpen = $event"
      >
        <template #header>
          <h3 class="font-bold text-lg">{{ t('creator.members.role') }}: {{ editingMember?.account?.name }}</h3>
        </template>
        <fieldset class="fieldset mb-6">
          <legend class="fieldset-legend">{{ t('creator.members.role') }}</legend>
          <select v-model="editRole" class="select w-full">
            <option :value="0">{{ t('creator.members.member') }}</option>
            <option :value="50">{{ t('creator.members.moderator') }}</option>
            <option :value="100">{{ t('creator.members.owner') }}</option>
          </select>
        </fieldset>
        <template #footer>
          <div class="flex items-center justify-between">
            <button class="btn btn-ghost" @click="closeRoleEditor">{{ t('creator.cancel') }}</button>
            <button class="btn btn-primary" @click="saveRole">
              <IconSave class="w-4 h-4" /> {{ t('creator.save') }}
            </button>
          </div>
        </template>
      </AdminDrawer>

      <!-- Invite sheet -->
      <AdminDrawer
        :open="inviteModalOpen"
        :title="t('creator.members.invite')"
        direction="bottom"
        @update:open="inviteModalOpen = $event"
      >
        <AccountPicker @select="handleInviteSelect" />
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconUserPlus, IconPencil, IconTrash, IconSave } from '#components'
import type { PublisherMember } from '~/types/creator'
import type { SnAccount } from '~/types/auth'
import {
  fetchPublisherMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from '~/utils/creator'
import { getFileUrl } from '~/utils/files'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher, isManager } = creator

defineOgImage('UniOgImage', { title: computed(() => `${t('creator.members.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

useSolarSeo({ title: computed(() => `${t('creator.members.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

const members = ref<PublisherMember[]>([])
const offset = ref(0)
const total = ref(0)
const hasMore = computed(() => members.value.length < total.value)

const { status, error } = await useAsyncData(
  `creator-members-${pubName.value}`,
  async () => {
    const result = await fetchPublisherMembers(pubName.value)
    members.value = result.items
    total.value = result.total
    offset.value = result.items.length
    return result
  },
)

const editingMember = ref<PublisherMember | null>(null)
const editRole = ref(0)
const roleModalOpen = ref(false)
const inviteModalOpen = ref(false)

function openRoleEditor(member: PublisherMember) {
  editingMember.value = member
  editRole.value = member.role
  roleModalOpen.value = true
}

function closeRoleEditor() {
  roleModalOpen.value = false
}

function openInviteModal() {
  inviteModalOpen.value = true
}

function closeInviteModal() {
  inviteModalOpen.value = false
}

function roleLabel(role: number): string {
  if (role >= 100) return t('creator.members.owner')
  if (role >= 50) return t('creator.members.moderator')
  return t('creator.members.member')
}

async function saveRole() {
  if (!editingMember.value) return
  await updateMemberRole(pubName.value, editingMember.value.accountId, editRole.value)
  closeRoleEditor()
  await refreshMembers()
}

async function handleRemove(accountId: string) {
  if (!(await useAlert().confirm('Confirm', t('creator.members.removeConfirm')))) return
  await removeMember(pubName.value, accountId)
  await refreshMembers()
}

async function handleInviteSelect(account: SnAccount) {
  await inviteMember(pubName.value, account.id)
  closeInviteModal()
  await refreshMembers()
}

async function loadMore() {
  const result = await fetchPublisherMembers(pubName.value, offset.value)
  members.value = [...members.value, ...result.items]
  offset.value += result.items.length
}

async function refreshMembers() {
  const result = await fetchPublisherMembers(pubName.value)
  members.value = result.items
  total.value = result.total
  offset.value = result.items.length
}
</script>
