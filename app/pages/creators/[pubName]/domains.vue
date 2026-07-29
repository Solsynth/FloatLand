<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">{{ t('creator.domains.title') }}</h1>
        <button class="btn btn-primary btn-sm" @click="openAddModal">
          <IconPlus class="w-4 h-4" />
          {{ t('creator.domains.add') }}
        </button>
      </div>

      <ConfuseSpinner v-if="status === 'pending'" />

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <div v-else-if="!domains.length" class="text-center py-12">
        <IconGlobe class="w-12 h-12 mx-auto text-base-content/20 mb-4" />
        <p class="text-base-content/50">{{ t('creator.domains.empty') }}</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="domain in domains"
          :key="domain.id"
          class="card bg-base-100 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0 flex-1">
                <div class="mt-0.5">
                  <component
                    :is="statusIcon(domain.status)"
                    class="w-5 h-5"
                    :class="statusTextColor(domain.status)"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium truncate">{{ domain.domain }}</div>
                  <div class="text-sm text-base-content/60 mt-0.5">
                    {{ statusLabel(domain.status) }}
                  </div>
                  <div v-if="domain.verifiedAt" class="text-xs text-base-content/40 mt-1">
                    {{ t('creator.domains.verifiedAt') }}: {{ formatDate(domain.verifiedAt) }}
                  </div>
                  <div
                    v-if="domain.lastError"
                    class="text-xs text-error mt-1 line-clamp-2"
                  >
                    {{ domain.lastError }}
                  </div>
                </div>
              </div>

              <div class="flex gap-1 shrink-0">
                <button
                  class="btn btn-ghost btn-sm btn-circle"
                  :title="t('creator.domains.recheck')"
                  :disabled="recheckingId === domain.id"
                  @click="handleRecheck(domain.id)"
                >
                  <IconRefreshCw
                    class="w-4 h-4"
                    :class="{ 'animate-spin': recheckingId === domain.id }"
                  />
                </button>
                <button
                  class="btn btn-ghost btn-sm btn-circle text-error"
                  :title="t('creator.domains.remove')"
                  @click="handleRemove(domain.id)"
                >
                  <IconTrash class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Domain Drawer -->
      <AdminDrawer
        :open="addModalOpen"
        :title="t('creator.domains.add')"
        @update:open="addModalOpen = $event"
      >
        <div class="space-y-4">
          <div>
            <label class="label">
              <span class="label-text">{{ t('creator.domains.domainField') }}</span>
            </label>
            <input
              v-model="newDomain"
              type="text"
              :placeholder="t('creator.domains.domainPlaceholder')"
              class="input input-bordered w-full"
              @keyup.enter="handleAdd"
            />
            <p class="text-xs text-base-content/50 mt-2">
              {{ t('creator.domains.hint') }}
            </p>
          </div>

          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm" @click="addModalOpen = false">
              {{ t('common.cancel') }}
            </button>
            <button
              class="btn btn-primary btn-sm"
              :disabled="!newDomain.trim() || adding"
              @click="handleAdd"
            >
              <span v-if="adding" class="loading loading-spinner loading-xs" />
              {{ t('creator.domains.add') }}
            </button>
          </div>
        </div>
      </AdminDrawer>

      <!-- Toast -->
      <div class="toast toast-end">
        <div v-if="toast" class="alert" :class="toastClass">
          <span>{{ toast }}</span>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconPlus,
  IconTrash,
  IconRefreshCw,
  IconGlobe,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconBan,
} from '#components'
import type { SnPublisherVerifiedDomain, DomainVerificationStatus } from '~/types/creator'
import {
  fetchPublisherDomains,
  addDomain,
  removeDomain,
  recheckDomain,
} from '~/utils/creator'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher } = creator

defineOgImage('UniOgImage', {
  title: computed(() => `${t('creator.domains.title')} - ${currentPublisher.value?.nick ?? pubName.value}`),
})

useSolarSeo({
  title: computed(() => `${t('creator.domains.title')} - ${currentPublisher.value?.nick ?? pubName.value}`),
})

// Data
const domains = ref<SnPublisherVerifiedDomain[]>([])
const recheckingId = ref<string | null>(null)

const { status, error } = await useAsyncData(
  `creator-domains-${pubName.value}`,
  async () => {
    const result = await fetchPublisherDomains(pubName.value)
    domains.value = result
    return result
  },
)

async function refresh() {
  const result = await fetchPublisherDomains(pubName.value)
  domains.value = result
}

// Status helpers
function statusIcon(status: DomainVerificationStatus) {
  const icons: Record<string, unknown> = {
    pending: IconClock,
    verified: IconCircleCheck,
    failed: IconCircleX,
    revoked: IconBan,
  }
  return icons[status] ?? IconClock
}

function statusTextColor(status: DomainVerificationStatus) {
  const colors: Record<string, string> = {
    pending: 'text-primary',
    verified: 'text-success',
    failed: 'text-error',
    revoked: 'text-base-content/40',
  }
  return colors[status] ?? 'text-base-content/40'
}

function statusLabel(status: DomainVerificationStatus) {
  const labels: Record<string, string> = {
    pending: t('creator.domains.statusPending'),
    verified: t('creator.domains.statusVerified'),
    failed: t('creator.domains.statusFailed'),
    revoked: t('creator.domains.statusRevoked'),
  }
  return labels[status] ?? status
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

// Add domain
const addModalOpen = ref(false)
const newDomain = ref('')
const adding = ref(false)

function openAddModal() {
  newDomain.value = ''
  addModalOpen.value = true
}

async function handleAdd() {
  const domain = newDomain.value.trim()
  if (!domain) return

  adding.value = true
  try {
    await addDomain(pubName.value, domain)
    await refresh()
    addModalOpen.value = false
    showToast(t('creator.domains.addSuccess'), 'alert-success')
  } catch (e) {
    showToast(String(e), 'alert-error')
  } finally {
    adding.value = false
  }
}

// Remove domain
async function handleRemove(domainId: string) {
  if (!confirm(t('creator.domains.removeConfirm'))) return
  try {
    await removeDomain(pubName.value, domainId)
    await refresh()
    showToast(t('creator.domains.removeSuccess'), 'alert-success')
  } catch (e) {
    showToast(String(e), 'alert-error')
  }
}

// Recheck domain
async function handleRecheck(domainId: string) {
  recheckingId.value = domainId
  try {
    await recheckDomain(pubName.value, domainId)
    await refresh()
    showToast(t('creator.domains.recheckSuccess'), 'alert-success')
  } catch (e) {
    showToast(String(e), 'alert-error')
  } finally {
    recheckingId.value = null
  }
}

// Toast
const toast = ref('')
const toastClass = ref('alert-info')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type = 'alert-info') {
  toast.value = msg
  toastClass.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}
</script>
