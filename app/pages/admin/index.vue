<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Dashboard" description="Platform administration overview">
      <template #actions>
        <button class="btn btn-sm btn-ghost" :disabled="loading" @click="loadAll">
          <IconRefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </template>
    </AdminPageHeader>

    <!-- Primary stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AdminStatsCard
        label="Accounts"
        :value="passportStats?.totalProfiledAccounts ?? '—'"
        :icon="IconUsers"
        color="primary"
        clickable
        @click="go('/admin/accounts')"
      />
      <AdminStatsCard
        label="Posts"
        :value="sphereStats?.totalPosts ?? '—'"
        :icon="IconFileText"
        color="info"
        clickable
        @click="go('/admin/posts')"
      />
      <AdminStatsCard
        label="Transactions"
        :value="walletStats?.totalTransactions ?? '—'"
        :icon="IconWallet"
        color="success"
        clickable
        @click="go('/admin/wallet')"
      />
      <AdminStatsCard
        label="Notifications"
        :value="ringStats?.totalNotifications ?? '—'"
        :icon="IconBell"
        color="warning"
        clickable
        @click="go('/admin/notifications')"
      />
    </div>

    <!-- Activity metrics -->
    <AdminCard class="mb-6" no-padding>
      <div class="flex items-center justify-between gap-3 px-5 py-3">
        <div class="flex items-center gap-3">
          <IconActivity class="w-4 h-4 text-primary" />
          <span class="text-sm font-semibold">Account Activity</span>
        </div>
        <span v-if="activity?.calculatedAt" class="text-[11px] text-base-content/35">
          as of {{ formatDateTime(activity.calculatedAt) }}
        </span>
      </div>
      <div v-if="activity" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 px-5 py-4">
        <div v-for="metric in activityMetrics" :key="metric.label" class="text-center">
          <div class="text-lg font-bold">{{ formatNum(metric.value) }}</div>
          <div class="text-xs text-base-content/40">{{ metric.label }}</div>
          <div
            v-if="metric.delta !== undefined"
            class="text-[10px] mt-0.5"
            :class="deltaClass(metric.delta)"
          >
            {{ metric.delta > 0 ? '+' : '' }}{{ metric.delta }} vs prev
          </div>
        </div>
      </div>
      <div v-else-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-sm" />
      </div>
      <div v-else class="px-5 py-6 text-sm text-base-content/40 text-center">
        Activity metrics unavailable
      </div>
    </AdminCard>

    <!-- Geography overview (Padlock GeoIP aggregates) -->
    <AdminGeographyMap class="mb-6" />

    <!-- Service breakdowns -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <AdminCard v-for="panel in servicePanels" :key="panel.title" no-padding>
        <div class="flex items-center gap-3 px-5 py-3">
          <component :is="panel.icon" class="w-4 h-4" :class="panel.iconClass" />
          <span class="text-sm font-semibold">{{ panel.title }}</span>
        </div>
        <div v-if="panel.rows" class="grid grid-cols-2 gap-3 px-5 py-4 text-sm">
          <div
            v-for="row in panel.rows"
            :key="row.label"
            class="flex items-center justify-between gap-2"
          >
            <span class="text-xs text-base-content/45">{{ row.label }}</span>
            <span class="text-sm font-semibold tabular-nums">{{ formatNum(row.value) }}</span>
          </div>
        </div>
        <p v-else class="px-5 py-6 text-xs text-base-content/40">{{ panel.empty }}</p>
      </AdminCard>
    </div>

    <!-- Navigation grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <AdminCard
        v-for="section in sections"
        :key="section.href"
        class="group cursor-pointer transition-colors hover:bg-base-200"
        @click="go(section.href)"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-box bg-primary/10">
              <component :is="section.icon" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">{{ section.label }}</h3>
              <p class="text-xs text-base-content/40 mt-0.5">{{ section.description }}</p>
            </div>
          </div>
          <IconArrowRight class="w-4 h-4 text-base-content/20 group-hover:text-primary transition-colors" />
        </div>
      </AdminCard>
    </div>

    <!-- Cache Stats Quick View -->
    <AdminCard v-if="cacheStats" no-padding>
      <div class="flex items-center gap-3 px-5 py-3">
        <IconDatabase class="w-4 h-4 text-primary" />
        <span class="text-sm font-semibold">Cache Status</span>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-4 px-5 py-4">
        <div class="text-center">
          <div class="text-lg font-bold text-success">
            {{ cacheStats.hitRatio ? (cacheStats.hitRatio * 100).toFixed(1) + '%' : '0%' }}
          </div>
          <div class="text-xs text-base-content/40">Hit Ratio</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold">{{ formatNum(cacheStats.keyspaceHits) }}</div>
          <div class="text-xs text-base-content/40">Hits</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold">{{ formatNum(cacheStats.keyspaceMisses) }}</div>
          <div class="text-xs text-base-content/40">Misses</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold">{{ formatMemory(cacheStats.usedMemoryBytes) }}</div>
          <div class="text-xs text-base-content/40">Memory</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold">{{ cacheStats.connectedClients }}</div>
          <div class="text-xs text-base-content/40">Connections</div>
        </div>
      </div>
    </AdminCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconUsers,
  IconShieldAlert,
  IconFileText,
  IconWallet,
  IconBell,
  IconMail,
  IconActivity,
  IconDatabase,
  IconArrowRight,
  IconRefreshCw,
  IconKeyRound,
  IconTicket,
  IconHash,
  IconFolder,
  IconLayers,
  IconBuilding2,
  IconGlobe,
} from '#components'
import type {
  CacheStats,
  PassportAdminStats,
  SphereAdminStats,
  WalletAdminStats,
  RingAdminStats,
  AccountActivityMetrics,
} from '~/types/admin'
import {
  fetchCacheStats,
  fetchPassportAdminStats,
  fetchSphereAdminStats,
  fetchWalletAdminStats,
  fetchRingAdminStats,
  fetchAccountActivityMetrics,
} from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const loading = ref(false)
const cacheStats = ref<CacheStats | null>(null)
const passportStats = ref<PassportAdminStats | null>(null)
const sphereStats = ref<SphereAdminStats | null>(null)
const walletStats = ref<WalletAdminStats | null>(null)
const ringStats = ref<RingAdminStats | null>(null)
const activity = ref<AccountActivityMetrics | null>(null)

const activityMetrics = computed(() => {
  const a = activity.value
  if (!a) return []
  return [
    { label: 'DAU', value: a.dailyActiveUsers, delta: a.dailyActiveUsers - a.previousDailyActiveUsers },
    { label: 'WAU', value: a.weeklyActiveUsers, delta: a.weeklyActiveUsers - a.previousWeeklyActiveUsers },
    { label: 'MAU', value: a.monthlyActiveUsers, delta: a.monthlyActiveUsers - a.previousMonthlyActiveUsers },
    { label: 'New today', value: a.newAccountsToday },
    { label: 'New this week', value: a.newAccountsThisWeek },
    { label: 'New this month', value: a.newAccountsThisMonth },
  ]
})

const servicePanels = computed(() => [
  {
    title: 'Passport',
    icon: IconUsers,
    iconClass: 'text-primary',
    empty: 'Unavailable (needs accounts.view)',
    rows: passportStats.value
      ? [
          { label: 'Profiled accounts', value: passportStats.value.totalProfiledAccounts },
          { label: 'Active (1d)', value: passportStats.value.activeUsersLastDay },
          { label: 'Active (7d)', value: passportStats.value.activeUsersLastWeek },
          { label: 'Active (30d)', value: passportStats.value.activeUsersLastMonth },
          { label: 'Registered (1d)', value: passportStats.value.registeredUsersLastDay },
          { label: 'Registered (7d)', value: passportStats.value.registeredUsersLastWeek },
          { label: 'Registered (30d)', value: passportStats.value.registeredUsersLastMonth },
        ]
      : null,
  },
  {
    title: 'Sphere',
    icon: IconFileText,
    iconClass: 'text-info',
    empty: 'Unavailable (needs posts.moderate)',
    rows: sphereStats.value
      ? [
          { label: 'Total posts', value: sphereStats.value.totalPosts },
          { label: 'Published', value: sphereStats.value.publishedPosts },
          { label: 'Drafts', value: sphereStats.value.draftPosts },
          { label: 'Posts (1d)', value: sphereStats.value.postsLastDay },
          { label: 'Posts (7d)', value: sphereStats.value.postsLastWeek },
          { label: 'Posts (30d)', value: sphereStats.value.postsLastMonth },
          { label: 'Publishers', value: sphereStats.value.totalPublishers },
          { label: 'Reactions', value: sphereStats.value.totalReactions },
          { label: 'Bookmarks', value: sphereStats.value.totalBookmarks },
        ]
      : null,
  },
  {
    title: 'Wallet',
    icon: IconWallet,
    iconClass: 'text-success',
    empty: 'Unavailable (needs wallets.transactions.manage)',
    rows: walletStats.value
      ? [
          { label: 'Wallets', value: walletStats.value.totalWallets },
          { label: 'Transactions', value: walletStats.value.totalTransactions },
          { label: 'Confirmed', value: walletStats.value.confirmedTransactions },
          { label: 'Pending', value: walletStats.value.pendingTransactions },
          { label: 'Tx (1d)', value: walletStats.value.transactionsLastDay },
          { label: 'Tx (7d)', value: walletStats.value.transactionsLastWeek },
          { label: 'Orders', value: walletStats.value.totalOrders },
          { label: 'Paid orders', value: walletStats.value.paidOrders },
          { label: 'Subscriptions', value: walletStats.value.totalSubscriptions },
        ]
      : null,
  },
  {
    title: 'Ring',
    icon: IconBell,
    iconClass: 'text-warning',
    empty: 'Unavailable (needs notifications.send)',
    rows: ringStats.value
      ? [
          { label: 'Notifications', value: ringStats.value.totalNotifications },
          { label: 'Unread', value: ringStats.value.unreadNotifications },
          { label: 'Notifs (1d)', value: ringStats.value.notificationsLastDay },
          { label: 'Notifs (7d)', value: ringStats.value.notificationsLastWeek },
          { label: 'Push subs', value: ringStats.value.totalPushSubscriptions },
          { label: 'Active push', value: ringStats.value.activePushSubscriptions },
          { label: 'Send requests', value: ringStats.value.totalSendRequests },
          { label: 'Delivery attempts', value: ringStats.value.totalDeliveryAttempts },
        ]
      : null,
  },
])

const sections = [
  {
    icon: IconUsers,
    label: 'Accounts',
    href: '/admin/accounts',
    description: 'Manage platform accounts, sessions, and punishments',
  },
  {
    icon: IconKeyRound,
    label: 'Permissions',
    href: '/admin/permissions',
    description: 'Manage permission groups, nodes, and memberships',
  },
  {
    icon: IconShieldAlert,
    label: 'Punishments',
    href: '/admin/punishments',
    description: 'View and manage account punishments',
  },
  {
    icon: IconFileText,
    label: 'Posts',
    href: '/admin/posts',
    description: 'Review and moderate posts across the platform',
  },
  {
    icon: IconBuilding2,
    label: 'Publishers',
    href: '/admin/publishers',
    description: 'Shadowban, verify, and manage publishers',
  },
  {
    icon: IconGlobe,
    label: 'Realms',
    href: '/admin/realms',
    description: 'Moderate realms, members, and verification',
  },
  {
    icon: IconHash,
    label: 'Tags',
    href: '/admin/tags',
    description: 'Ownership, protection, and event tags',
  },
  {
    icon: IconFolder,
    label: 'Categories',
    href: '/admin/categories',
    description: 'Create and maintain global categories',
  },
  {
    icon: IconLayers,
    label: 'Collections',
    href: '/admin/collections',
    description: 'Review publisher collections platform-wide',
  },
  {
    icon: IconWallet,
    label: 'Wallet',
    href: '/admin/wallet',
    description: 'Manage transactions, orders, and subscriptions',
  },
  {
    icon: IconTicket,
    label: 'Tickets',
    href: '/admin/tickets',
    description: 'Support tickets, replies, and assignment',
  },
  {
    icon: IconBell,
    label: 'Notifications',
    href: '/admin/notifications',
    description: 'Send push notifications to accounts',
  },
  {
    icon: IconMail,
    label: 'Emails',
    href: '/admin/emails',
    description: 'Send emails to accounts',
  },
  {
    icon: IconActivity,
    label: 'Presence Scan',
    href: '/admin/presence',
    description: 'Scan Steam presence for accounts',
  },
  {
    icon: IconDatabase,
    label: 'Cache',
    href: '/admin/cache',
    description: 'Inspect and manage platform cache',
  },
]

function formatNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function formatMemory(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let i = -1
  let size = bytes
  do {
    size /= 1024
    i++
  } while (size >= 1024 && i < units.length - 1)
  return size.toFixed(1) + ' ' + units[i]
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function deltaClass(delta: number): string {
  if (delta > 0) return 'text-success'
  if (delta < 0) return 'text-error'
  return 'text-base-content/30'
}

function go(path: string) {
  return navigateTo(path)
}

async function loadAll() {
  loading.value = true
  const results = await Promise.allSettled([
    fetchPassportAdminStats(),
    fetchSphereAdminStats(),
    fetchWalletAdminStats(),
    fetchRingAdminStats(),
    fetchAccountActivityMetrics(),
    fetchCacheStats(),
  ])
  passportStats.value = results[0].status === 'fulfilled' ? results[0].value : null
  sphereStats.value = results[1].status === 'fulfilled' ? results[1].value : null
  walletStats.value = results[2].status === 'fulfilled' ? results[2].value : null
  ringStats.value = results[3].status === 'fulfilled' ? results[3].value : null
  activity.value = results[4].status === 'fulfilled' ? results[4].value : null
  cacheStats.value = results[5].status === 'fulfilled' ? results[5].value : null
  loading.value = false
}

onMounted(loadAll)
</script>
