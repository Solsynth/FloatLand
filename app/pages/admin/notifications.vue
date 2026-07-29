<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Notifications" description="Send push notifications to accounts" />

    <TabsRoot v-model="activeTab" default-value="send">
      <TabsList class="mb-6 flex gap-1 rounded-box bg-base-200 p-1">
        <TabsTrigger
          value="send"
          class="flex items-center gap-2 rounded-box px-4 py-2 text-sm font-medium text-base-content/60 transition-colors hover:text-base-content data-[state=active]:bg-base-100 data-[state=active]:text-primary"
        >
          <IconSend class="w-4 h-4" />
          Send
        </TabsTrigger>
        <TabsTrigger
          value="observability"
          class="flex items-center gap-2 rounded-box px-4 py-2 text-sm font-medium text-base-content/60 transition-colors hover:text-base-content data-[state=active]:bg-base-100 data-[state=active]:text-primary"
        >
          <IconActivity class="w-4 h-4" />
          Observability
        </TabsTrigger>
      </TabsList>

      <TabsContent value="send">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Form -->
          <div class="lg:col-span-2">
            <AdminCard title="Compose Notification">
              <form class="space-y-4" @submit.prevent="handleSendNotification">
                <!-- Targeting -->
                <div>
                  <label class="label label-text text-sm font-medium">Target Mode</label>
                  <div class="flex gap-2 rounded-box bg-base-200 p-1">
                    <button
                      type="button"
                      class="flex-1 rounded-box px-3 py-1.5 text-xs font-semibold transition-colors"
                      :class="targetMode === 'accounts' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="targetMode = 'accounts'"
                    >
                      Specific Accounts
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-box px-3 py-1.5 text-xs font-semibold transition-colors"
                      :class="targetMode === 'broadcast' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="targetMode = 'broadcast'"
                    >
                      Broadcast All
                    </button>
                  </div>
                </div>

                <!-- Account Targeting -->
                <div v-if="targetMode === 'accounts'">
                  <label class="label label-text text-sm font-medium">Target Accounts</label>
                  <div v-if="selectedAccounts.length" class="flex flex-wrap gap-1.5 mb-2">
                    <span
                      v-for="acc in selectedAccounts"
                      :key="acc.id"
                      class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary"
                    >
                      {{ acc.nick || acc.name }}
                      <button class="hover:text-error" @click="removeSelectedAccount(acc.id)">
                        <IconX class="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm w-full bg-base-200"
                    @click="openAccountPicker"
                  >
                    <IconUsers class="w-4 h-4" />
                    {{ selectedAccounts.length ? 'Add More Accounts' : 'Select Accounts' }}
                  </button>
                </div>

                <!-- Notification Content -->
                <div>
                  <label class="label label-text text-sm font-medium">Topic</label>
                  <input v-model="form.topic" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" placeholder="admin.notice" />
                </div>
                <div>
                  <label class="label label-text text-sm font-medium">Title</label>
                  <input v-model="form.title" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" placeholder="Notification title" />
                </div>
                <div>
                  <label class="label label-text text-sm font-medium">Subtitle</label>
                  <input v-model="form.subtitle" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" placeholder="Optional subtitle" />
                </div>
                <div>
                  <label class="label label-text text-sm font-medium">Body</label>
                  <textarea
                    v-model="form.body"
                    class="textarea textarea-sm w-full rounded-box border-0 bg-base-200"
                    rows="3"
                    placeholder="Notification body..."
                  />
                </div>
                <div>
                  <label class="label label-text text-sm font-medium">Action URI</label>
                  <input v-model="form.actionUri" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" placeholder="solian://path/to/content" />
                </div>
                <div>
                  <label class="label label-text text-sm font-medium">Push Type</label>
                  <input v-model="form.pushType" type="text" class="input input-sm w-full rounded-box border-0 bg-base-200" placeholder="alert" />
                  <p class="text-xs text-base-content/40 mt-1">e.g. alert — forwarded on the Ring push path</p>
                </div>
                <div>
                  <label class="label label-text text-sm font-medium">
                    Meta (JSON)
                    <span class="font-normal text-base-content/40">optional</span>
                  </label>
                  <textarea
                    v-model="metaJson"
                    class="textarea textarea-sm w-full rounded-box border-0 bg-base-200 text-sm font-mono"
                    rows="3"
                    placeholder='{ "category": "maintenance" }'
                  />
                  <p v-if="metaError" class="text-xs text-error mt-1">{{ metaError }}</p>
                </div>

                <!-- Options -->
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="form.isSilent" type="checkbox" class="checkbox checkbox-sm" />
                    <span class="text-sm">Silent</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="form.isSavable" type="checkbox" class="checkbox checkbox-sm" />
                    <span class="text-sm">Savable</span>
                  </label>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-full"
                  :disabled="isSending || !form.title || !form.body"
                >
                  <span v-if="isSending" class="loading loading-spinner loading-xs" />
                  <span v-else>Send Notification</span>
                </button>

                <!-- Result -->
                <div v-if="result" class="rounded-box bg-success/10 p-3">
                  <p class="text-sm text-success font-medium">Delivered successfully</p>
                  <p class="text-xs text-base-content/60 mt-1">
                    Requested: {{ result.requested }} • Sent: {{ result.sent }} • Skipped: {{ result.skipped }}
                  </p>
                </div>
              </form>
            </AdminCard>
          </div>

          <!-- Info -->
          <div>
            <AdminCard title="About Push Notifications">
              <div class="space-y-2 text-sm text-base-content/60">
                <p>
                  Send targeted push notifications or broadcast to all non-deleted accounts.
                  Delivery reuses the Ring push path.
                </p>
                <ul class="list-disc list-inside text-xs space-y-1 ml-2">
                  <li>Requires <code class="text-xs">notifications.send</code></li>
                  <li>Target with <code class="text-xs">account_ids</code> or <code class="text-xs">broadcast_to_all</code></li>
                  <li>Optional <code class="text-xs">push_type</code>, <code class="text-xs">meta</code>, silent / savable flags</li>
                </ul>
              </div>
            </AdminCard>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="observability">
        <div class="space-y-6">
          <!-- Range controls -->
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex gap-1 rounded-box bg-base-200 p-1">
              <button
                v-for="preset in rangePresets"
                :key="preset.days"
                type="button"
                class="rounded-box px-3 py-1.5 text-xs font-semibold transition-colors"
                :class="obsRangeDays === preset.days ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                @click="setObsRangeDays(preset.days)"
              >
                {{ preset.label }}
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              :disabled="isLoadingObs"
              @click="loadObservability(true)"
            >
              <span v-if="isLoadingObs" class="loading loading-spinner loading-xs" />
              <IconRefreshCw v-else class="w-4 h-4" />
              Refresh
            </button>
            <p class="text-xs text-base-content/40 ml-auto">
              Built-in Ring records · last {{ obsRangeDays }} days · no OTLP required
            </p>
          </div>

          <div v-if="isLoadingObs && !observability" class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else-if="observability">
            <!-- Summary Stats -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Send Requests</p>
                  <p class="text-2xl font-bold mt-1">{{ formatNumber(observability.sendRequests) }}</p>
                  <p class="text-[10px] text-base-content/40 mt-1">queued / batch targets</p>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Deliveries</p>
                  <p class="text-2xl font-bold mt-1">{{ formatNumber(observability.summary.total) }}</p>
                  <p class="text-[10px] text-base-content/40 mt-1">channel attempts</p>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Successful</p>
                  <p class="text-2xl font-bold mt-1 text-success">{{ formatNumber(observability.summary.successful) }}</p>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Failed / Invalid</p>
                  <p class="text-2xl font-bold mt-1">
                    <span class="text-error">{{ formatNumber(observability.summary.failed) }}</span>
                    <span class="text-base-content/30 text-lg mx-0.5">/</span>
                    <span class="text-warning">{{ formatNumber(observability.summary.invalidToken) }}</span>
                  </p>
                  <p class="text-[10px] text-base-content/40 mt-1">
                    skipped {{ formatNumber(observability.summary.skipped) }}
                  </p>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Success Rate</p>
                  <p
                    class="text-2xl font-bold mt-1"
                    :class="getSuccessRateClass(observability.summary.successRate)"
                  >
                    {{ formatSuccessRate(observability.summary.successRate) }}
                  </p>
                  <p class="text-[10px] text-base-content/40 mt-1">excludes skipped</p>
                </div>
              </div>
            </div>

            <!-- Provider Breakdown -->
            <AdminCard title="Delivery by Provider">
              <p class="text-xs text-base-content/50 mb-4">
                websocket · google · apple · appk · unifiedpush · sop (skipped when no provider push)
              </p>
              <div v-if="observability.byProvider.length" class="space-y-4">
                <div
                  v-for="row in observability.byProvider"
                  :key="row.key"
                  class="space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm capitalize">{{ row.key }}</span>
                      <span class="badge badge-xs badge-ghost">{{ formatNumber(row.total) }} total</span>
                    </div>
                    <span
                      class="text-sm font-semibold"
                      :class="getSuccessRateClass(row.successRate)"
                    >
                      {{ formatSuccessRate(row.successRate) }}
                    </span>
                  </div>
                  <div class="flex gap-1 h-2 rounded-full overflow-hidden bg-base-200">
                    <div
                      class="bg-success rounded-full transition-all"
                      :style="{ width: barWidth(row.successful, row.total) }"
                    />
                    <div
                      class="bg-error rounded-full transition-all"
                      :style="{ width: barWidth(row.failed, row.total) }"
                    />
                    <div
                      class="bg-warning rounded-full transition-all"
                      :style="{ width: barWidth(row.invalidToken, row.total) }"
                    />
                    <div
                      class="bg-base-content/30 rounded-full transition-all"
                      :style="{ width: barWidth(row.skipped, row.total) }"
                    />
                  </div>
                  <div class="flex flex-wrap gap-3 text-[10px] text-base-content/50">
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-success" /> Success: {{ formatNumber(row.successful) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-error" /> Failure: {{ formatNumber(row.failed) }}
                    </span>
                    <span v-if="row.invalidToken" class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-warning" /> Invalid: {{ formatNumber(row.invalidToken) }}
                    </span>
                    <span v-if="row.skipped" class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-base-content/30" /> Skipped: {{ formatNumber(row.skipped) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="py-6 text-center text-base-content/40 text-sm">
                No delivery records in this range
              </div>
            </AdminCard>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Send requests by topic -->
              <AdminCard title="Send Requests by Topic">
                <div v-if="observability.sendRequestsByTopic.length" class="space-y-3">
                  <div
                    v-for="topic in observability.sendRequestsByTopic.slice(0, 10)"
                    :key="topic.key"
                    class="flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <IconBell class="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                      <span class="text-sm font-mono truncate">{{ topic.key }}</span>
                    </div>
                    <span class="text-xs font-medium shrink-0">{{ formatNumber(topic.total) }}</span>
                  </div>
                </div>
                <div v-else class="py-6 text-center text-base-content/40 text-sm">
                  No send requests recorded yet
                </div>
              </AdminCard>

              <!-- Delivery by topic -->
              <AdminCard title="Deliveries by Topic">
                <div v-if="observability.byTopic.length" class="space-y-3">
                  <div
                    v-for="topic in observability.byTopic.slice(0, 10)"
                    :key="topic.key"
                    class="flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <IconBell class="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                      <span class="text-sm font-mono truncate">{{ topic.key }}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs text-base-content/50">{{ formatNumber(topic.total) }}</span>
                      <span
                        class="text-xs font-semibold"
                        :class="getSuccessRateClass(topic.successRate)"
                      >
                        {{ formatSuccessRate(topic.successRate) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="py-6 text-center text-base-content/40 text-sm">
                  No topic deliveries recorded yet
                </div>
              </AdminCard>
            </div>

            <AdminCard title="How rates are calculated">
              <div class="space-y-2 text-sm text-base-content/60">
                <p>
                  <code class="text-xs">success_rate = success / (success + failure + invalid_token)</code>
                </p>
                <p>
                  <code class="text-xs">skipped</code> is excluded from the denominator (e.g. SOP-only subscriptions).
                  Provider success means the channel accepted the attempt, not that a user saw the notification.
                </p>
                <p class="text-xs text-base-content/40">
                  Records exclude account IDs, device IDs, tokens, titles, and contents.
                </p>
              </div>
            </AdminCard>
          </template>

          <div v-else class="card bg-base-100 shadow-sm">
            <div class="card-body py-12 text-center">
              <IconActivity class="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p class="text-sm text-base-content/40">No observability data available</p>
              <p class="text-xs text-base-content/30 mt-1">Metrics will appear once notifications are sent</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </TabsRoot>

    <AccountPickerDrawer
      :open="pickerOpen"
      :allow-multiple="true"
      title="Select Target Accounts"
      placeholder="Search by name or nick..."
      @select="picker.handleSelect"
      @update:open="pickerOpen = $event"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import { IconActivity, IconBell, IconRefreshCw, IconSend, IconUsers, IconX } from '#components'
import { fetchNotificationDeliveryObservability, sendAdminNotifications } from '~/utils/admin'
import { useAccountPicker } from '~/composables/useAccountPicker'
import AccountPickerDrawer from '~/components/shared/AccountPickerDrawer.vue'
import type { BulkDeliveryResult, NotificationDeliveryOverview, NotificationPayload } from '~/types/admin'
import type { SnAccount } from '~/types/auth'

definePageMeta({ middleware: 'auth' })

const activeTab = ref<'send' | 'observability'>('send')

const isSending = ref(false)
const targetMode = ref<'accounts' | 'broadcast'>('accounts')
const result = ref<BulkDeliveryResult | null>(null)
const selectedAccounts = ref<SnAccount[]>([])

const picker = useAccountPicker()
const pickerOpen = computed({
  get: () => picker.isOpen.value,
  set: (val: boolean) => { picker.isOpen.value = val },
})

const form = ref({
  topic: 'admin.notice',
  title: '',
  subtitle: '',
  body: '',
  actionUri: '',
  pushType: 'alert',
  isSilent: false,
  isSavable: true,
})

const metaJson = ref('')
const metaError = ref('')

// Observability (Ring built-in delivery records)
const isLoadingObs = ref(false)
const observability = ref<NotificationDeliveryOverview | null>(null)
const obsRangeDays = ref(30)
const rangePresets = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
] as const

function setObsRangeDays(days: number) {
  if (obsRangeDays.value === days) return
  obsRangeDays.value = days
  loadObservability(true)
}

function obsFromInstant(): string {
  const ms = Date.now() - obsRangeDays.value * 24 * 60 * 60 * 1000
  return new Date(ms).toISOString()
}

let obsLoadSeq = 0

async function loadObservability(force = false) {
  if (!force && observability.value) return
  const seq = ++obsLoadSeq
  isLoadingObs.value = true
  try {
    const data = await fetchNotificationDeliveryObservability({
      from: obsFromInstant(),
    })
    if (seq !== obsLoadSeq) return
    observability.value = data
  } catch {
    if (seq !== obsLoadSeq) return
    useNuxtApp().$toast.error('Failed to load observability data')
  } finally {
    if (seq === obsLoadSeq) {
      isLoadingObs.value = false
    }
  }
}

watch(activeTab, (tab) => {
  if (tab === 'observability') {
    loadObservability()
  }
})

async function openAccountPicker() {
  const accounts = await picker.open({ allowMultiple: true, title: 'Select Target Accounts' })
  if (accounts && Array.isArray(accounts)) {
    for (const acc of accounts) {
      if (!selectedAccounts.value.find(a => a.id === acc.id)) {
        selectedAccounts.value.push(acc)
      }
    }
  }
}

function removeSelectedAccount(id: string) {
  selectedAccounts.value = selectedAccounts.value.filter(a => a.id !== id)
}

async function handleSendNotification() {
  isSending.value = true
  result.value = null
  metaError.value = ''

  let meta: Record<string, unknown> | undefined
  if (metaJson.value.trim()) {
    try {
      meta = JSON.parse(metaJson.value)
    } catch {
      metaError.value = 'Invalid JSON in meta field'
      isSending.value = false
      return
    }
  }

  const accountIds = targetMode.value === 'accounts'
    ? selectedAccounts.value.map(a => a.id)
    : undefined

  if (targetMode.value === 'accounts' && (!accountIds || accountIds.length === 0)) {
    useNuxtApp().$toast.error('Select at least one account')
    isSending.value = false
    return
  }

  const payload: NotificationPayload = {
    topic: form.value.topic,
    title: form.value.title,
    subtitle: form.value.subtitle || undefined,
    body: form.value.body,
    actionUri: form.value.actionUri || undefined,
    pushType: form.value.pushType || undefined,
    isSilent: form.value.isSilent,
    isSavable: form.value.isSavable,
    meta,
    broadcastToAll: targetMode.value === 'broadcast',
    accountIds: targetMode.value === 'accounts' ? accountIds : undefined,
  }

  try {
    result.value = await sendAdminNotifications(payload)
    if (result.value.sent > 0) {
      selectedAccounts.value = []
    }
  } catch {
    useNuxtApp().$toast.error('Failed to send notifications')
  } finally {
    isSending.value = false
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatSuccessRate(rate: number | null | undefined): string {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(1)}%`
}

function getSuccessRateClass(rate: number | null | undefined): string {
  if (rate == null) return 'text-base-content/40'
  if (rate >= 0.95) return 'text-success'
  if (rate >= 0.8) return 'text-warning'
  return 'text-error'
}

function barWidth(part: number, total: number): string {
  if (!total || part <= 0) return '0%'
  return `${(part / total) * 100}%`
}
</script>
