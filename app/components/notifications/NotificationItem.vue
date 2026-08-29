<template>
  <button
    class="flex w-full items-start gap-3 rounded-box p-3 text-left transition-colors hover:bg-base-200"
    :class="{ 'bg-primary/5': !notification.viewedAt }"
    @click="handleClick"
  >
    <!-- Icon / Avatar -->
    <div class="shrink-0">
      <div
        v-if="pfpUrl"
        class="avatar"
      >
        <div class="w-10 rounded-full">
          <FileImage :src="pfpUrl" alt="" />
        </div>
      </div>
      <div
        v-else
        class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        <component :is="iconComponent" class="h-5 w-5" />
      </div>
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-semibold leading-tight">
          {{ notification.title }}
        </p>
        <span
          v-if="!notification.viewedAt"
          class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
        />
      </div>
      <p
        v-if="notification.subtitle"
        class="mt-0.5 text-xs font-medium text-base-content/70"
      >
        {{ notification.subtitle }}
      </p>
      <p class="mt-1 text-xs text-base-content/50 line-clamp-2">
        {{ notification.body || notification.content || notification.subtitle }}
      </p>
      <p class="mt-1.5 text-[11px] text-base-content/40">
        {{ relativeTime }}
      </p>
    </div>
  </button>
</template>

<script setup lang="ts">
import {
  IconMessageCircle,
  IconWallet,
  IconUserPlus,
  IconMail,
  IconBuilding,
  IconLogIn,
  IconFileText,
  IconShoppingBag,
  IconSmile,
  IconBell,
} from '#components'
import type { SnNotification } from '~/types/notification'
import { getFileUrl } from '~/utils/files'
import { formatRelativeTime } from '~/utils/datetime'

const props = defineProps<{
  notification: SnNotification
}>()

const emit = defineEmits<{
  click: [notification: SnNotification]
}>()

const router = useRouter()

const pfpUrl = computed(() => {
  const pfp = props.notification.meta?.pfp as string | undefined
  return pfp ? getFileUrl(pfp) : null
})

const iconComponent = computed(() => {
  const topic = props.notification.topic
  switch (topic) {
    case 'post.replies':
      return IconMessageCircle
    case 'wallet.transactions':
    case 'wallet.orders.paid':
      return IconWallet
    case 'relationships.friends.request':
      return IconUserPlus
    case 'invites.chat':
      return IconMail
    case 'invites.realm':
      return IconBuilding
    case 'auth.login':
      return IconLogIn
    case 'posts.new':
      return IconFileText
    case 'posts.reactions.new':
      return IconSmile
    default:
      return IconBell
  }
})

// Use datetime utility for proper local time conversion
const relativeTime = computed(() => formatRelativeTime(props.notification.createdAt))

function handleClick() {
  emit('click', props.notification)

  // Navigate to action URI if present
  const actionUri = props.notification.meta?.action_uri as string | undefined
  if (actionUri) {
    if (actionUri.startsWith('/')) {
      router.push(actionUri)
    } else {
      window.open(actionUri, '_blank')
    }
  }
}
</script>
