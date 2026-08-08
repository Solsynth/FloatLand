<template>
  <NuxtLayout name="admin">
    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="!ticket" class="flex flex-col items-center py-16 text-center">
      <IconTicket class="w-12 h-12 text-base-content/20 mb-4" />
      <p class="text-base-content/50">Ticket not found</p>
      <NuxtLink to="/admin/tickets" class="btn btn-sm btn-ghost mt-3">Back to tickets</NuxtLink>
    </div>

    <template v-else>
      <div class="flex items-start gap-3 mb-6">
        <NuxtLink to="/admin/tickets" class="btn btn-circle btn-ghost btn-sm mt-0.5">
          <IconArrowLeft class="w-4 h-4" />
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-bold tracking-tight">{{ ticket.title }}</h1>
          <p class="text-xs text-base-content/40 font-mono mt-0.5">{{ ticket.id }}</p>
        </div>
        <button class="btn btn-sm btn-error btn-outline" :disabled="acting" @click="doDelete">
          <IconTrash2 class="w-4 h-4" />
          Delete
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Conversation -->
        <div class="lg:col-span-2 space-y-4">
          <AdminCard title="Conversation">
            <div class="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
              <div
                v-for="msg in sortedMessages"
                :key="msg.id"
                class="rounded-lg p-3 border"
                :class="msg.senderId === ticket.creatorId
                  ? 'bg-base-200/50 border-base-300/40'
                  : 'bg-primary/5 border-primary/15'"
              >
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="text-xs font-semibold">
                    {{ msg.sender?.nick || msg.sender?.name || (msg.senderId === ticket.creatorId ? 'Creator' : 'Staff') }}
                    <span
                      v-if="msg.senderId !== ticket.creatorId"
                      class="badge badge-primary badge-xs ml-1"
                    >Staff</span>
                  </span>
                  <span class="text-[10px] text-base-content/40">{{ formatDateTime(msg.createdAt) }}</span>
                </div>
                <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                <AttachmentGrid
                  v-if="msg.files?.length"
                  class="mt-3"
                  :attachments="toFileAttachments(msg.files)"
                  :max-height="320"
                />
              </div>
              <p v-if="!sortedMessages.length" class="text-sm text-base-content/40 text-center py-6">
                No messages yet
              </p>
            </div>
          </AdminCard>

          <!-- Reply (admin only) -->
          <AdminCard title="Reply as staff">
            <p class="text-xs text-base-content/45 mb-3">
              Replies alone do not email the creator. After saving a reply, set status to
              <strong>Waiting for customer</strong> or <strong>Needs more information</strong>
              to include the latest staff reply in the notification email.
            </p>
            <textarea
              v-model="replyContent"
              class="textarea textarea-sm w-full bg-base-200/60 border-0 rounded-xl"
              rows="4"
              placeholder="Write a staff reply..."
            />
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                class="btn btn-sm btn-primary"
                :disabled="acting || !replyContent.trim()"
                @click="sendReply(false)"
              >
                Send reply
              </button>
              <button
                class="btn btn-sm btn-warning"
                :disabled="acting || !replyContent.trim()"
                @click="sendReply(4)"
              >
                Reply + wait for customer
              </button>
              <button
                class="btn btn-sm btn-outline"
                :disabled="acting || !replyContent.trim()"
                @click="sendReply(5)"
              >
                Reply + need more info
              </button>
            </div>
          </AdminCard>
        </div>

        <!-- Sidebar actions -->
        <div class="space-y-4">
          <AdminCard title="Details">
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/50">Status</span>
                <span class="badge badge-sm" :class="ticketStatusBadgeClass(ticket.status)">
                  {{ ticketStatusLabelAdmin(ticket.status) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/50">Type</span>
                <span class="badge badge-sm badge-outline">{{ ticketTypeLabel(ticket.type) }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/50">Priority</span>
                <span class="badge badge-sm" :class="ticketPriorityBadgeClass(ticket.priority)">
                  {{ ticketPriorityLabel(ticket.priority) }}
                </span>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Creator</span>
                <p class="mt-0.5">
                  <NuxtLink
                    v-if="ticket.creator?.name"
                    :to="`/admin/accounts/${ticket.creator.name}`"
                    class="link link-primary text-sm"
                  >
                    {{ ticket.creator.nick || ticket.creator.name }}
                  </NuxtLink>
                  <span v-else class="font-mono text-xs">{{ ticket.creatorId }}</span>
                </p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Assignee</span>
                <p class="mt-0.5">
                  {{ ticket.assignee?.nick || ticket.assignee?.name || 'Unassigned' }}
                </p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Created</span>
                <p class="mt-0.5 text-xs">{{ formatDateTime(ticket.createdAt) }}</p>
              </div>
              <div v-if="ticket.resolvedAt">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Resolved</span>
                <p class="mt-0.5 text-xs">{{ formatDateTime(ticket.resolvedAt) }}</p>
              </div>
              <div v-if="ticket.resources?.filter(Boolean).length">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Resources</span>
                <ul class="mt-1 space-y-0.5">
                  <li
                    v-for="(res, i) in ticket.resources!.filter(Boolean)"
                    :key="i"
                    class="text-xs font-mono break-all"
                  >
                    {{ res }}
                  </li>
                </ul>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Update status">
            <select v-model.number="statusForm" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl mb-2">
              <option :value="0">Open</option>
              <option :value="1">In progress</option>
              <option :value="2">Resolved</option>
              <option :value="3">Closed</option>
              <option :value="4">Waiting for customer</option>
              <option :value="5">Needs more information</option>
            </select>
            <button class="btn btn-sm btn-primary w-full" :disabled="acting" @click="doUpdateStatus">
              Save status
            </button>
          </AdminCard>

          <AdminCard title="Assign">
            <div v-if="ticket.assignee" class="flex items-center justify-between mb-2">
              <span class="text-sm">{{ ticket.assignee.nick || ticket.assignee.name }}</span>
              <button class="btn btn-ghost btn-xs text-error" :disabled="acting" @click="doAssign(null)">
                Unassign
              </button>
            </div>
            <button class="btn btn-sm btn-outline w-full" :disabled="acting" @click="pickAssignee">
              <IconUser class="w-4 h-4" />
              {{ ticket.assigneeId ? 'Reassign' : 'Assign account' }}
            </button>
            <button
              v-if="user?.id"
              class="btn btn-sm btn-ghost w-full mt-2"
              :disabled="acting"
              @click="doAssign(user.id)"
            >
              Assign to me
            </button>
          </AdminCard>

          <AdminCard title="Edit ticket">
            <form class="space-y-3" @submit.prevent="doUpdate">
              <div>
                <label class="text-xs text-base-content/50">Title</label>
                <input v-model="editForm.title" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" required minlength="3" />
              </div>
              <div>
                <label class="text-xs text-base-content/50">Type</label>
                <select v-model.number="editForm.type" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
                  <option :value="0">Support</option>
                  <option :value="1">Bug report</option>
                  <option :value="2">Feature request</option>
                  <option :value="3">Billing</option>
                  <option :value="4">Other</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-base-content/50">Priority</label>
                <select v-model.number="editForm.priority" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
                  <option :value="0">Low</option>
                  <option :value="1">Medium</option>
                  <option :value="2">High</option>
                  <option :value="3">Critical</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-base-content/50">Resources (one per line)</label>
                <textarea v-model="resourcesText" class="textarea textarea-sm w-full bg-base-200/60 border-0 rounded-xl font-mono text-xs" rows="3" />
              </div>
              <button class="btn btn-sm btn-primary w-full" :disabled="acting">Save changes</button>
            </form>
          </AdminCard>
        </div>
      </div>

      <AccountPickerDrawer
        :open="pickerOpen"
        :allow-multiple="false"
        title="Assign ticket"
        placeholder="Search by name or nick..."
        @select="picker.handleSelect"
        @update:open="pickerOpen = $event"
      />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconTicket,
  IconTrash2,
  IconUser,
} from '#components'
import type { SnTicket } from '~/types/ticket'
import {
  fetchTicket,
  updateTicket,
  deleteTicket,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
  ticketTypeLabel,
  ticketPriorityLabel,
  ticketStatusLabelAdmin,
  ticketStatusBadgeClass,
  ticketPriorityBadgeClass,
  toFileAttachments,
} from '~/utils/tickets'
import { useAccountPicker } from '~/composables/useAccountPicker'
import AccountPickerDrawer from '~/components/shared/AccountPickerDrawer.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { user } = useAuth()
const picker = useAccountPicker()
const pickerOpen = computed({
  get: () => picker.isOpen.value,
  set: (val: boolean) => { picker.isOpen.value = val },
})

const ticket = ref<SnTicket | null>(null)
const loading = ref(true)
const acting = ref(false)
const replyContent = ref('')
const statusForm = ref(0)
const editForm = ref({ title: '', type: 0, priority: 1 })
const resourcesText = ref('')

const sortedMessages = computed(() => {
  const msgs = [...(ticket.value?.messages ?? [])]
  return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

function formatDateTime(date: string) {
  try {
    return new Date(date).toLocaleString()
  } catch {
    return date
  }
}

function syncForms(t: SnTicket) {
  statusForm.value = Number(t.status)
  editForm.value = {
    title: t.title,
    type: Number(t.type),
    priority: Number(t.priority),
  }
  resourcesText.value = (t.resources ?? []).filter(Boolean).join('\n')
}

async function load() {
  loading.value = true
  try {
    ticket.value = await fetchTicket(route.params.id as string)
    if (ticket.value) syncForms(ticket.value)
  } catch {
    ticket.value = null
  } finally {
    loading.value = false
  }
}

async function sendReply(nextStatus: false | number) {
  if (!ticket.value || !replyContent.value.trim()) return
  acting.value = true
  try {
    await addTicketMessage(ticket.value.id, { content: replyContent.value.trim() })
    replyContent.value = ''
    if (typeof nextStatus === 'number') {
      ticket.value = await updateTicketStatus(ticket.value.id, nextStatus)
      syncForms(ticket.value)
    } else {
      ticket.value = await fetchTicket(ticket.value.id)
    }
    useNuxtApp().$toast.success('Reply sent')
  } catch {
    useNuxtApp().$toast.error('Failed to send reply')
  } finally {
    acting.value = false
  }
}

async function doUpdateStatus() {
  if (!ticket.value) return
  acting.value = true
  try {
    ticket.value = await updateTicketStatus(ticket.value.id, statusForm.value)
    syncForms(ticket.value)
    useNuxtApp().$toast.success('Status updated')
  } catch {
    useNuxtApp().$toast.error('Failed to update status')
  } finally {
    acting.value = false
  }
}

async function doAssign(assigneeId: string | null) {
  if (!ticket.value) return
  acting.value = true
  try {
    ticket.value = await assignTicket(ticket.value.id, assigneeId)
    useNuxtApp().$toast.success(assigneeId ? 'Assigned' : 'Unassigned')
  } catch {
    useNuxtApp().$toast.error('Failed to assign ticket')
  } finally {
    acting.value = false
  }
}

async function pickAssignee() {
  const result = await picker.open({ title: 'Assign ticket', allowMultiple: false })
  if (!result || Array.isArray(result)) return
  await doAssign(result.id)
}

async function doUpdate() {
  if (!ticket.value) return
  acting.value = true
  try {
    const resources = resourcesText.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    ticket.value = await updateTicket(ticket.value.id, {
      title: editForm.value.title.trim(),
      type: editForm.value.type,
      priority: editForm.value.priority,
      resources,
    })
    syncForms(ticket.value)
    useNuxtApp().$toast.success('Ticket updated')
  } catch {
    useNuxtApp().$toast.error('Failed to update ticket')
  } finally {
    acting.value = false
  }
}

async function doDelete() {
  if (!ticket.value) return
  if (!(await useAlert().confirm('Confirm', `Delete ticket "${ticket.value.title}"? This cannot be undone.`))) return
  acting.value = true
  try {
    await deleteTicket(ticket.value.id)
    useNuxtApp().$toast.success('Ticket deleted')
    await navigateTo('/admin/tickets')
  } catch {
    useNuxtApp().$toast.error('Failed to delete ticket')
    acting.value = false
  }
}

onMounted(load)
</script>
