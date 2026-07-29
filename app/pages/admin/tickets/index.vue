<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Tickets" description="Support tickets across the platform">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :disabled="loading" @click="reload">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </template>
    </AdminPageHeader>

    <!-- Counts -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <AdminCard class="!p-3">
        <div class="text-lg font-bold">{{ counts.total ?? '—' }}</div>
        <div class="text-[11px] text-base-content/40">Total</div>
      </AdminCard>
      <AdminCard class="!p-3">
        <div class="text-lg font-bold text-info">{{ counts.open ?? '—' }}</div>
        <div class="text-[11px] text-base-content/40">Open</div>
      </AdminCard>
      <AdminCard class="!p-3">
        <div class="text-lg font-bold text-primary">{{ counts.inProgress ?? '—' }}</div>
        <div class="text-[11px] text-base-content/40">In progress</div>
      </AdminCard>
      <AdminCard class="!p-3">
        <div class="text-lg font-bold text-warning">{{ counts.waiting ?? '—' }}</div>
        <div class="text-[11px] text-base-content/40">Waiting on user</div>
      </AdminCard>
    </div>

    <!-- Filters -->
    <AdminCard class="mb-6">
      <div class="flex flex-wrap gap-2">
        <select v-model="filters.status" class="select select-sm rounded-box border-0 bg-base-200" @change="reload">
          <option value="">All statuses</option>
          <option :value="0">Open</option>
          <option :value="1">In progress</option>
          <option :value="2">Resolved</option>
          <option :value="3">Closed</option>
          <option :value="4">Waiting for customer</option>
          <option :value="5">Needs more information</option>
        </select>
        <select v-model="filters.type" class="select select-sm rounded-box border-0 bg-base-200" @change="reload">
          <option value="">All types</option>
          <option :value="0">Support</option>
          <option :value="1">Bug report</option>
          <option :value="2">Feature request</option>
          <option :value="3">Billing</option>
          <option :value="4">Other</option>
        </select>
        <select v-model="filters.priority" class="select select-sm rounded-box border-0 bg-base-200" @change="reload">
          <option value="">All priorities</option>
          <option :value="0">Low</option>
          <option :value="1">Medium</option>
          <option :value="2">High</option>
          <option :value="3">Critical</option>
        </select>
        <input
          v-model="filters.creatorId"
          type="text"
          placeholder="Creator ID..."
          class="input input-sm w-44 rounded-box border-0 bg-base-200 font-mono"
          @keyup.enter="reload"
        />
        <input
          v-model="filters.assigneeId"
          type="text"
          placeholder="Assignee ID..."
          class="input input-sm w-44 rounded-box border-0 bg-base-200 font-mono"
          @keyup.enter="reload"
        />
        <button class="btn btn-sm btn-primary" @click="reload">Filter</button>
      </div>
    </AdminCard>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5">Ticket</th>
              <th>Creator</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Created</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="hover:bg-base-200/50 transition-colors"
            >
              <td class="pl-5">
                <NuxtLink :to="`/admin/tickets/${ticket.id}`" class="block">
                  <div class="text-sm font-medium truncate max-w-[16rem]">{{ ticket.title }}</div>
                  <div class="text-[10px] text-base-content/35 font-mono">{{ ticket.id.slice(0, 8) }}…</div>
                </NuxtLink>
              </td>
              <td>
                <span class="text-sm text-base-content/60">
                  {{ ticket.creator?.nick || ticket.creator?.name || shortId(ticket.creatorId) }}
                </span>
              </td>
              <td>
                <span class="badge badge-xs badge-outline">{{ ticketTypeLabel(ticket.type) }}</span>
              </td>
              <td>
                <span class="badge badge-xs" :class="ticketStatusBadgeClass(ticket.status)">
                  {{ ticketStatusLabelAdmin(ticket.status) }}
                </span>
              </td>
              <td>
                <span class="badge badge-xs" :class="ticketPriorityBadgeClass(ticket.priority)">
                  {{ ticketPriorityLabel(ticket.priority) }}
                </span>
              </td>
              <td>
                <span class="text-xs text-base-content/50">
                  {{ ticket.assignee?.nick || ticket.assignee?.name || (ticket.assigneeId ? shortId(ticket.assigneeId) : '—') }}
                </span>
              </td>
              <td>
                <span class="text-xs text-base-content/40">{{ formatDate(ticket.createdAt) }}</span>
              </td>
              <td class="pr-5 text-right">
                <NuxtLink :to="`/admin/tickets/${ticket.id}`" class="btn btn-ghost btn-xs">
                  <IconExternalLink class="w-3.5 h-3.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!tickets.length" class="flex flex-col items-center py-16 text-center">
        <IconTicket class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50">No tickets found</p>
      </div>

      <div v-if="hasMore || total > pageSize" class="flex items-center justify-between px-5 py-3">
        <span class="text-xs text-base-content/40">
          Showing {{ offset + 1 }}–{{ Math.min(offset + pageSize, total || offset + tickets.length) }}
          <template v-if="total"> of {{ total }}</template>
        </span>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-xs" :disabled="offset === 0 || loading" @click="prevPage">
            <IconChevronLeft class="w-3.5 h-3.5" />
          </button>
          <button
            class="btn btn-ghost btn-xs"
            :disabled="(!hasMore && (!total || offset + pageSize >= total)) || loading"
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
  IconRefreshCw,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
  IconTicket,
} from '#components'
import type { SnTicket } from '~/types/ticket'
import {
  fetchTickets,
  fetchTicketCount,
  ticketTypeLabel,
  ticketPriorityLabel,
  ticketStatusLabelAdmin,
  ticketStatusBadgeClass,
  ticketPriorityBadgeClass,
} from '~/utils/tickets'

definePageMeta({ middleware: 'auth' })

const tickets = ref<SnTicket[]>([])
const loading = ref(false)
const pageSize = 20
const offset = ref(0)
const total = ref(0)
const hasMore = ref(false)
const counts = ref<{
  total?: number
  open?: number
  inProgress?: number
  waiting?: number
}>({})

const filters = ref({
  status: '' as string | number,
  type: '' as string | number,
  priority: '' as string | number,
  creatorId: '',
  assigneeId: '',
})

function shortId(id: string) {
  return id.slice(0, 8) + '…'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function listParams() {
  return {
    status: filters.value.status === '' ? undefined : Number(filters.value.status),
    type: filters.value.type === '' ? undefined : Number(filters.value.type),
    priority: filters.value.priority === '' ? undefined : Number(filters.value.priority),
    creatorId: filters.value.creatorId || undefined,
    assigneeId: filters.value.assigneeId || undefined,
    offset: offset.value,
    take: pageSize,
  }
}

async function loadCounts() {
  try {
    const [all, open, inProgress, waiting4, waiting5] = await Promise.all([
      fetchTicketCount(),
      fetchTicketCount({ status: 0 }),
      fetchTicketCount({ status: 1 }),
      fetchTicketCount({ status: 4 }),
      fetchTicketCount({ status: 5 }),
    ])
    counts.value = {
      total: all,
      open,
      inProgress,
      waiting: waiting4 + waiting5,
    }
  } catch {
    counts.value = {}
  }
}

async function loadTickets() {
  loading.value = true
  try {
    const params = listParams()
    const [items, count] = await Promise.all([
      fetchTickets(params),
      fetchTicketCount({
        status: params.status,
        creatorId: params.creatorId,
        assigneeId: params.assigneeId,
      }).catch(() => 0),
    ])
    tickets.value = items
    total.value = count
    hasMore.value = items.length >= pageSize || (count > 0 && offset.value + items.length < count)
  } catch {
    tickets.value = []
    total.value = 0
    hasMore.value = false
    try {
      useNuxtApp().$toast.error('Failed to load tickets')
    } catch { /* */ }
  } finally {
    loading.value = false
  }
}

function reload() {
  offset.value = 0
  loadTickets()
  loadCounts()
}

function prevPage() {
  offset.value = Math.max(0, offset.value - pageSize)
  loadTickets()
}

function nextPage() {
  offset.value += pageSize
  loadTickets()
}

onMounted(() => {
  loadTickets()
  loadCounts()
})
</script>
