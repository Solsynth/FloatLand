<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="On-call Admins" description="Admins who get pinged about new ticket activity">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :disabled="loading" @click="reload">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
        <button class="btn btn-sm btn-primary" :disabled="acting" @click="pickAdmin">
          <IconUserPlus class="w-4 h-4" />
          Add admin
        </button>
      </template>
    </AdminPageHeader>

    <!-- How it works -->
    <AdminCard class="mb-6">
      <p class="text-sm text-base-content/70">
        New tickets, replies, status changes and assignments are pushed to these admins.
        <span class="text-base-content/50">
          When the roster is empty, notifications fall back to all superusers.
        </span>
      </p>
    </AdminCard>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5">Admin</th>
              <th>Role</th>
              <th>On call since</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in roster"
              :key="entry.id"
              class="hover:bg-base-200/50 transition-colors"
            >
              <td class="pl-5">
                <div class="text-sm font-medium">
                  {{ entry.account?.nick || entry.account?.name || shortId(entry.accountId) }}
                </div>
                <div class="text-[10px] text-base-content/35 font-mono">{{ entry.accountId }}</div>
              </td>
              <td>
                <span v-if="entry.account?.isSuperuser" class="badge badge-xs badge-primary">
                  Superuser
                </span>
                <span v-else class="badge badge-xs badge-outline">Admin</span>
              </td>
              <td>
                <span class="text-xs text-base-content/40">{{ formatDate(entry.createdAt) }}</span>
              </td>
              <td class="pr-5 text-right">
                <button
                  class="btn btn-ghost btn-xs text-error"
                  :disabled="acting"
                  @click="doRemove(entry)"
                >
                  <IconTrash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!roster.length" class="flex flex-col items-center py-16 text-center">
        <IconPhoneCall class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50">No admins on call</p>
        <p class="text-xs text-base-content/30 mt-1">
          Add an admin to receive ticket notifications
        </p>
      </div>
    </AdminCard>

    <AccountPickerDrawer
      :open="pickerOpen"
      :allow-multiple="false"
      title="Add on-call admin"
      placeholder="Search by name or nick..."
      @select="picker.handleSelect"
      @update:open="pickerOpen = $event"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconRefreshCw,
  IconUserPlus,
  IconTrash2,
  IconPhoneCall,
} from '#components'
import type { SnTicketOnCallAdmin } from '~/types/ticket'
import {
  fetchOnCallAdmins,
  addOnCallAdmin,
  removeOnCallAdmin,
} from '~/utils/tickets'

definePageMeta({ middleware: 'auth' })

const roster = ref<SnTicketOnCallAdmin[]>([])
const loading = ref(false)
const acting = ref(false)

const picker = useAccountPicker()
const pickerOpen = computed({
  get: () => picker.isOpen.value,
  set: (val: boolean) => { picker.isOpen.value = val },
})

function shortId(id: string) {
  return id.slice(0, 8) + '…'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

async function loadRoster() {
  loading.value = true
  try {
    roster.value = await fetchOnCallAdmins()
  } catch {
    roster.value = []
    try {
      useNuxtApp().$toast.error('Failed to load on-call admins')
    } catch { /* */ }
  } finally {
    loading.value = false
  }
}

function reload() {
  loadRoster()
}

async function pickAdmin() {
  const result = await picker.open({ title: 'Add on-call admin', allowMultiple: false })
  if (!result || Array.isArray(result)) return
  await doAdd(result.id)
}

async function doAdd(accountId: string) {
  if (acting.value) return
  acting.value = true
  try {
    await addOnCallAdmin(accountId)
    useNuxtApp().$toast.success('Admin added to on-call roster')
    await loadRoster()
  } catch {
    useNuxtApp().$toast.error('Failed to add on-call admin')
  } finally {
    acting.value = false
  }
}

async function doRemove(entry: SnTicketOnCallAdmin) {
  if (acting.value) return
  acting.value = true
  try {
    await removeOnCallAdmin(entry.accountId)
    useNuxtApp().$toast.success('Admin removed from on-call roster')
    await loadRoster()
  } catch {
    useNuxtApp().$toast.error('Failed to remove on-call admin')
  } finally {
    acting.value = false
  }
}

onMounted(loadRoster)
</script>
