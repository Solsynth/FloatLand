<template>
  <NuxtLayout name="app">
    <div class="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 class="text-xl font-bold tracking-tight">{{ t('tickets.title') }}</h1>
          <p class="text-sm text-base-content/50 mt-1">{{ t('tickets.description') }}</p>
        </div>
        <button class="btn btn-sm btn-primary" @click="createOpen = true">
          <IconPlus class="w-4 h-4" />
          {{ t('tickets.newTicket') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mb-4">
        <select
          v-model="statusFilter"
          class="select select-sm rounded-box border-0 bg-base-200"
          @change="reload"
        >
          <option value="">{{ t('tickets.allStatuses') }}</option>
          <option :value="0">{{ t('tickets.status.open') }}</option>
          <option :value="1">{{ t('tickets.status.inProgress') }}</option>
          <option :value="2">{{ t('tickets.status.resolved') }}</option>
          <option :value="3">{{ t('tickets.status.closed') }}</option>
          <option :value="4">{{ t('tickets.status.waitingForCustomer') }}</option>
          <option :value="5">{{ t('tickets.status.waitingForInfo') }}</option>
        </select>
        <button class="btn btn-sm btn-ghost" :disabled="loading" @click="reload">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>

      <div v-if="loading && !tickets.length" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <div v-else-if="!tickets.length" class="flex flex-col items-center py-16 text-center">
        <IconTicket class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">{{ t('tickets.empty') }}</p>
        <p class="text-xs text-base-content/30 mb-4">{{ t('tickets.emptyHint') }}</p>
        <button class="btn btn-sm btn-primary" @click="createOpen = true">
          {{ t('tickets.newTicket') }}
        </button>
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="ticket in tickets"
          :key="ticket.id"
          :to="`/tickets/${ticket.id}`"
          class="block rounded-box bg-base-100 p-4 transition-colors hover:bg-base-200"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h2 class="text-sm font-semibold truncate">{{ ticket.title }}</h2>
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <span class="badge badge-xs" :class="ticketStatusBadgeClass(ticket.status)">
                  {{ statusLabel(ticket.status) }}
                </span>
                <span class="badge badge-xs bg-base-200">
                  {{ typeLabel(ticket.type) }}
                </span>
                <span class="badge badge-xs" :class="ticketPriorityBadgeClass(ticket.priority)">
                  {{ priorityLabel(ticket.priority) }}
                </span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <p class="text-xs text-base-content/40">{{ formatDate(ticket.createdAt) }}</p>
              <p v-if="ticket.messages?.length" class="text-[11px] text-base-content/30 mt-1">
                {{ t('tickets.messageCount', { count: ticket.messages.length }) }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div v-if="hasMore" class="flex justify-center mt-6">
        <button class="btn btn-sm btn-ghost" :disabled="loading" @click="loadMore">
          {{ loading ? t('common.loading') : t('common.loadMore') }}
        </button>
      </div>
    </div>

    <!-- Create drawer -->
    <div
      v-if="createOpen"
      class="fixed inset-0 z-50 flex justify-end"
    >
      <div class="absolute inset-0 bg-black/40" @click="createOpen = false" />
      <div class="relative h-full w-full max-w-md overflow-y-auto bg-base-100 shadow-lg">
        <div class="flex items-center justify-between px-5 py-4">
          <h3 class="text-sm font-semibold">{{ t('tickets.newTicket') }}</h3>
          <button class="btn btn-ghost btn-circle btn-sm" @click="createOpen = false">
            <IconX class="w-4 h-4" />
          </button>
        </div>
        <form class="p-5 space-y-4" @submit.prevent="submitCreate">
          <div>
            <label class="text-xs text-base-content/50">{{ t('tickets.form.title') }}</label>
            <input
              v-model="form.title"
              type="text"
              class="input input-sm mt-1 w-full rounded-box border-0 bg-base-200"
              :placeholder="t('tickets.form.titlePlaceholder')"
              minlength="3"
              maxlength="256"
              required
            />
          </div>
          <div>
            <label class="text-xs text-base-content/50">{{ t('tickets.form.type') }}</label>
            <select v-model.number="form.type" class="select select-sm mt-1 w-full rounded-box border-0 bg-base-200">
              <option :value="0">{{ t('tickets.type.support') }}</option>
              <option :value="1">{{ t('tickets.type.bug') }}</option>
              <option :value="2">{{ t('tickets.type.feature') }}</option>
              <option :value="3">{{ t('tickets.type.billing') }}</option>
              <option :value="4">{{ t('tickets.type.other') }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-base-content/50">{{ t('tickets.form.priority') }}</label>
            <select v-model.number="form.priority" class="select select-sm mt-1 w-full rounded-box border-0 bg-base-200">
              <option :value="0">{{ t('tickets.priority.low') }}</option>
              <option :value="1">{{ t('tickets.priority.medium') }}</option>
              <option :value="2">{{ t('tickets.priority.high') }}</option>
              <option :value="3">{{ t('tickets.priority.critical') }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-base-content/50">{{ t('tickets.form.content') }}</label>
            <textarea
              v-model="form.content"
              class="textarea textarea-sm mt-1 w-full rounded-box border-0 bg-base-200"
              rows="6"
              maxlength="16384"
              :placeholder="t('tickets.form.contentPlaceholder')"
              required
            />
          </div>
          <div>
            <label class="text-xs text-base-content/50">{{ t('tickets.form.resources') }}</label>
            <textarea
              v-model="resourcesText"
              class="textarea textarea-sm mt-1 w-full rounded-box border-0 bg-base-200 font-mono text-xs"
              rows="3"
              :placeholder="t('tickets.form.resourcesPlaceholder')"
            />
            <p class="text-[10px] text-base-content/35 mt-1">{{ t('tickets.form.resourcesHint') }}</p>
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="creating">
            <span v-if="creating" class="loading loading-spinner loading-xs" />
            <span v-else>{{ t('tickets.form.submit') }}</span>
          </button>
        </form>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconPlus, IconRefreshCw, IconTicket, IconX } from '#components'
import type { SnTicket } from '~/types/ticket'
import {
  fetchMyTickets,
  createTicket,
  ticketTypeLabel,
  ticketStatusLabel,
  ticketPriorityLabel,
  ticketStatusBadgeClass,
  ticketPriorityBadgeClass,
} from '~/utils/tickets'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
useSolarSeo({ title: () => t('tickets.title') })

const tickets = ref<SnTicket[]>([])
const loading = ref(false)
const creating = ref(false)
const createOpen = ref(false)
const statusFilter = ref<string | number>('')
const offset = ref(0)
const pageSize = 20
const hasMore = ref(false)

const form = ref({
  title: '',
  content: '',
  type: 0,
  priority: 1,
})
const resourcesText = ref('')

function typeLabel(type: number) {
  const keys = ['support', 'bug', 'feature', 'billing', 'other'] as const
  const key = keys[Number(type)]
  return key ? t(`tickets.type.${key}`) : ticketTypeLabel(type)
}

function statusLabel(status: number) {
  const keys = ['open', 'inProgress', 'resolved', 'closed', 'waitingForCustomer', 'waitingForInfo'] as const
  const key = keys[Number(status)]
  return key ? t(`tickets.status.${key}`) : ticketStatusLabel(status)
}

function priorityLabel(priority: number) {
  const keys = ['low', 'medium', 'high', 'critical'] as const
  const key = keys[Number(priority)]
  return key ? t(`tickets.priority.${key}`) : ticketPriorityLabel(priority)
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

async function load(reset = false) {
  if (reset) {
    offset.value = 0
    tickets.value = []
  }
  loading.value = true
  try {
    const status = statusFilter.value === '' ? undefined : Number(statusFilter.value)
    const batch = await fetchMyTickets({
      status,
      offset: offset.value,
      take: pageSize,
    })
    tickets.value = reset ? batch : [...tickets.value, ...batch]
    hasMore.value = batch.length >= pageSize
  } catch {
    if (reset) tickets.value = []
    try {
      useNuxtApp().$toast.error(t('tickets.errors.loadFailed'))
    } catch { /* toast may be unavailable */ }
  } finally {
    loading.value = false
  }
}

function reload() {
  load(true)
}

function loadMore() {
  offset.value += pageSize
  load(false)
}

async function submitCreate() {
  creating.value = true
  try {
    const resources = resourcesText.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const ticket = await createTicket({
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      type: form.value.type,
      priority: form.value.priority,
      resources: resources.length ? resources : undefined,
    })
    createOpen.value = false
    form.value = { title: '', content: '', type: 0, priority: 1 }
    resourcesText.value = ''
    useNuxtApp().$toast.success(t('tickets.created'))
    await navigateTo(`/tickets/${ticket.id}`)
  } catch {
    useNuxtApp().$toast.error(t('tickets.errors.createFailed'))
  } finally {
    creating.value = false
  }
}

onMounted(() => load(true))
</script>
