<template>
  <NuxtLayout name="app">
    <div class="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <div class="mb-4">
        <NuxtLink to="/tickets" class="btn btn-ghost btn-sm gap-1 -ml-2">
          <IconArrowLeft class="w-4 h-4" />
          {{ t('tickets.backToList') }}
        </NuxtLink>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <div v-else-if="!ticket" class="flex flex-col items-center py-16 text-center">
        <IconTicket class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50">{{ t('tickets.notFound') }}</p>
        <NuxtLink to="/tickets" class="btn btn-sm btn-ghost mt-3">{{ t('tickets.backToList') }}</NuxtLink>
      </div>

      <template v-else>
        <div class="mb-4 rounded-box bg-base-100 p-5">
          <h1 class="text-xl font-bold tracking-tight">{{ ticket.title }}</h1>
          <div class="flex flex-wrap items-center gap-1.5 mt-3">
            <span class="badge badge-sm" :class="ticketStatusBadgeClass(ticket.status)">
              {{ statusLabel(ticket.status) }}
            </span>
            <span class="badge badge-sm bg-base-200">{{ typeLabel(ticket.type) }}</span>
            <span class="badge badge-sm" :class="ticketPriorityBadgeClass(ticket.priority)">
              {{ priorityLabel(ticket.priority) }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <span class="text-xs text-base-content/40 uppercase tracking-wider">{{ t('tickets.fields.created') }}</span>
              <p class="mt-0.5">{{ formatDateTime(ticket.createdAt) }}</p>
            </div>
            <div v-if="ticket.updatedAt">
              <span class="text-xs text-base-content/40 uppercase tracking-wider">{{ t('tickets.fields.updated') }}</span>
              <p class="mt-0.5">{{ formatDateTime(ticket.updatedAt) }}</p>
            </div>
            <div v-if="ticket.assignee">
              <span class="text-xs text-base-content/40 uppercase tracking-wider">{{ t('tickets.fields.assignee') }}</span>
              <p class="mt-0.5">{{ ticket.assignee.nick || ticket.assignee.name }}</p>
            </div>
            <div v-if="ticket.resolvedAt">
              <span class="text-xs text-base-content/40 uppercase tracking-wider">{{ t('tickets.fields.resolved') }}</span>
              <p class="mt-0.5">{{ formatDateTime(ticket.resolvedAt) }}</p>
            </div>
          </div>
          <div v-if="ticket.resources?.filter(Boolean).length" class="mt-4">
            <span class="text-xs text-base-content/40 uppercase tracking-wider">{{ t('tickets.fields.resources') }}</span>
            <ul class="mt-1 space-y-1">
              <li v-for="(res, i) in ticket.resources!.filter(Boolean)" :key="i">
                <a
                  v-if="isUrl(res!)"
                  :href="res!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary text-sm break-all"
                >{{ res }}</a>
                <span v-else class="text-sm font-mono break-all">{{ res }}</span>
              </li>
            </ul>
          </div>
          <p class="text-[11px] text-base-content/30 font-mono mt-4">{{ ticket.id }}</p>
        </div>

        <div
          v-if="isWaiting"
          class="mb-4 rounded-box bg-warning/10 p-4 text-sm"
        >
          {{ t('tickets.waitingNotice') }}
        </div>

        <h2 class="text-sm font-semibold mb-3">{{ t('tickets.conversation') }}</h2>
        <div class="space-y-3">
          <div
            v-for="msg in sortedMessages"
            :key="msg.id"
            class="rounded-box p-4"
            :class="isMine(msg)
              ? 'ml-4 bg-primary/10 sm:ml-12'
              : 'mr-4 bg-base-100 sm:mr-12'"
          >
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xs font-semibold">
                {{ senderLabel(msg) }}
              </span>
              <span class="text-[11px] text-base-content/40">{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
            <AttachmentGrid
              v-if="msg.files?.length"
              class="mt-3"
              :attachments="toFileAttachments(msg.files)"
              :max-height="360"
            />
          </div>
          <p v-if="!sortedMessages.length" class="text-sm text-base-content/40 text-center py-8">
            {{ t('tickets.noMessages') }}
          </p>
        </div>

        <!-- Reply -->
        <div class="mt-4 rounded-box bg-base-100 p-4">
          <textarea
            v-model="reply"
            class="textarea textarea-sm w-full rounded-box border-0 bg-base-200"
            rows="4"
            maxlength="16384"
            :placeholder="t('tickets.reply.placeholder')"
          />
          <div class="flex justify-end mt-3">
            <button
              class="btn btn-sm btn-primary"
              :disabled="sending || !reply.trim()"
              @click="sendReply"
            >
              <span v-if="sending" class="loading loading-spinner loading-xs" />
              <span v-else>{{ t('tickets.reply.submit') }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconTicket } from '#components'
import type { SnTicket, SnTicketMessage } from '~/types/ticket'
import {
  fetchTicket,
  addTicketMessage,
  ticketTypeLabel,
  ticketStatusLabel,
  ticketPriorityLabel,
  ticketStatusBadgeClass,
  ticketPriorityBadgeClass,
  toFileAttachments,
} from '~/utils/tickets'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const route = useRoute()
const { user } = useAuth()

const ticket = ref<SnTicket | null>(null)
const loading = ref(true)
const reply = ref('')
const sending = ref(false)

const sortedMessages = computed(() => {
  const msgs = [...(ticket.value?.messages ?? [])]
  return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const isWaiting = computed(() => {
  const s = Number(ticket.value?.status)
  return s === 4 || s === 5
})

useSolarSeo({
  title: () => ticket.value?.title || t('tickets.title'),
})

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

function isMine(msg: SnTicketMessage) {
  return msg.senderId === user.value?.id || msg.senderId === ticket.value?.creatorId
}

function senderLabel(msg: SnTicketMessage) {
  if (msg.senderId === user.value?.id || msg.senderId === ticket.value?.creatorId) {
    return t('tickets.you')
  }
  if (msg.sender?.nick || msg.sender?.name) {
    return msg.sender.nick || msg.sender.name
  }
  return t('tickets.staff')
}

function formatDateTime(date: string) {
  try {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return date
  }
}

function isUrl(s: string) {
  return /^https?:\/\//i.test(s)
}

async function sendReply() {
  if (!ticket.value || !reply.value.trim() || sending.value) return
  sending.value = true
  try {
    await addTicketMessage(ticket.value.id, { content: reply.value.trim() })
    reply.value = ''
    ticket.value = await fetchTicket(route.params.id as string)
  } catch {
    useNuxtApp().$toast.error(t('tickets.errors.replyFailed'))
  } finally {
    sending.value = false
  }
}

async function load() {
  loading.value = true
  try {
    ticket.value = await fetchTicket(route.params.id as string)
  } catch {
    ticket.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
