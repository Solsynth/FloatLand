<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">{{ t('creator.subscribers.title') }}</h1>
        <button v-if="isManager" class="btn btn-primary btn-sm" @click="openAddModal">
          <IconUserPlus class="w-4 h-4" />
          {{ t('creator.subscribers.add') }}
        </button>
      </div>

      <!-- Follow Requests -->
      <div v-if="followRequests.length > 0" class="card bg-base-100 shadow-sm mb-4">
        <div class="card-body p-4">
          <h3 class="font-semibold text-sm mb-3 flex items-center gap-2">
            <IconUserPlus class="w-4 h-4" />
            {{ t('creator.subscribers.requests') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="req in followRequests"
              :key="req.id"
              class="flex items-center gap-3 rounded-lg p-3 bg-base-200"
            >
              <div class="avatar">
                <div class="w-9 rounded-full">
                  <img v-if="getFileUrl(req.account?.profile?.picture?.id)" :src="getFileUrl(req.account?.profile?.picture?.id)" :alt="req.account?.nick" />
                  <div v-else class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-bold">
                    {{ (req.account?.nick || '?').slice(0, 2).toUpperCase() }}
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-medium text-sm">{{ req.account?.nick }}</div>
                <div class="text-xs text-base-content/50">@{{ req.account?.name }}</div>
              </div>
              <div class="flex gap-1">
                <button class="btn btn-success btn-xs" @click="handleApprove(req.id)">
                  <IconCheck class="w-3 h-3" />
                </button>
                <button class="btn btn-error btn-xs" @click="handleReject(req.id)">
                  <IconX class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscribers List -->
      <ConfuseSpinner v-if="subStatus === 'pending'" />

      <div v-else-if="subError" class="alert alert-error">
        <span>{{ String(subError) }}</span>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="sub in subscribers"
          :key="sub.subscription.accountId"
          class="card bg-base-100 shadow-sm"
        >
          <div class="card-body p-4 flex-row items-center gap-4">
            <div class="avatar">
              <div class="w-10 rounded-full">
                <img v-if="getFileUrl(sub.account?.profile?.picture?.id)" :src="getFileUrl(sub.account?.profile?.picture?.id)" :alt="sub.account?.nick" />
                <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold">
                  {{ (sub.account?.nick || '?').slice(0, 2).toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium">{{ sub.account?.nick }}</div>
              <div class="text-sm text-base-content/50 flex items-center gap-1">
                @{{ sub.account?.name }}
                <IconBellOff v-if="!sub.subscription.notify" class="w-3 h-3" />
              </div>
            </div>
            <button
              v-if="isManager"
              class="btn btn-ghost btn-xs text-error"
              @click="handleRemoveSubscriber(sub.subscription.accountId)"
            >
              <IconTrash class="w-3 h-3" />
            </button>
          </div>
        </div>

        <div v-if="hasMore" class="flex justify-center py-4">
          <button class="btn btn-ghost btn-sm" @click="loadMore">
            {{ t('common.loadMore') }}
          </button>
        </div>
      </div>

      <!-- Add Subscriber sheet -->
      <AdminDrawer
        :open="addModalOpen"
        :title="t('creator.subscribers.add')"
        direction="bottom"
        @update:open="addModalOpen = $event"
      >
        <AccountPicker @select="handleAddSubscriber" />
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconUserPlus,
  IconCheck,
  IconX,
  IconTrash,
  IconBellOff,
} from '#components'
import type { PublisherSubscriber } from '~/types/creator'
import type { SnAccount } from '~/types/auth'
import {
  fetchPublisherSubscribers,
  fetchFollowRequests,
  approveFollowRequest,
  rejectFollowRequest,
  addSubscriber,
  removeSubscriber,
} from '~/utils/creator'
import { getFileUrl } from '~/utils/files'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher, isManager } = creator

defineOgImage('UniOgImage', { title: computed(() => `${t('creator.subscribers.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

useSolarSeo({ title: computed(() => `${t('creator.subscribers.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

const subscribers = ref<PublisherSubscriber[]>([])
const subOffset = ref(0)
const subTotal = ref(0)
const hasMore = computed(() => subscribers.value.length < subTotal.value)

const { status: subStatus, error: subError } = await useAsyncData(
  `creator-subscribers-${pubName.value}`,
  async () => {
    const result = await fetchPublisherSubscribers(pubName.value)
    subscribers.value = result.items
    subTotal.value = result.total
    subOffset.value = result.items.length
    return result
  },
)

const { data: followRequests } = await useAsyncData(
  `creator-follow-requests-${pubName.value}`,
  () => fetchFollowRequests(pubName.value),
)

const addModalOpen = ref(false)

function openAddModal() {
  addModalOpen.value = true
}

function closeAddModal() {
  addModalRef.value?.close()
}

async function handleApprove(requestId: string) {
  await approveFollowRequest(pubName.value, requestId)
  refreshNuxtData(`creator-follow-requests-${pubName.value}`)
}

async function handleReject(requestId: string) {
  await rejectFollowRequest(pubName.value, requestId)
  refreshNuxtData(`creator-follow-requests-${pubName.value}`)
}

async function handleAddSubscriber(account: SnAccount) {
  await addSubscriber(pubName.value, account.id)
  closeAddModal()
  await refreshSubscribers()
}

async function handleRemoveSubscriber(accountId: string) {
  if (!(await useAlert().confirm('Confirm', t('creator.subscribers.removeConfirm')))) return
  await removeSubscriber(pubName.value, accountId)
  await refreshSubscribers()
}

async function loadMore() {
  const result = await fetchPublisherSubscribers(pubName.value, subOffset.value)
  subscribers.value = [...subscribers.value, ...result.items]
  subOffset.value += result.items.length
}

async function refreshSubscribers() {
  const result = await fetchPublisherSubscribers(pubName.value)
  subscribers.value = result.items
  subTotal.value = result.total
  subOffset.value = result.items.length
}
</script>
