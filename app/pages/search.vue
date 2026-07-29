<template>
  <NuxtLayout name="app">
    <div class="feed-layout">
      <!-- Main Content -->
      <div class="space-y-4 min-w-0">
        <!-- Search Bar -->
        <div class="relative">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="rail-search input w-full pl-10 pr-10"
            @input="onInput"
            @keyup.enter="onSubmit"
          >
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
            @click="clearSearch"
          >
            <IconX class="h-4 w-4" />
          </button>
        </div>

        <!-- Mode Switcher -->
        <div class="search-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="search-tabs__item"
            :class="activeTab === tab.key ? 'search-tabs__item--active' : ''"
            @click="activeTab = tab.key as SearchTab"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="!debouncedQuery" class="text-center py-16">
          <IconSearch class="w-16 h-16 mx-auto mb-4 text-base-content/20" />
          <p class="text-base-content/50 text-lg">{{ t('search.emptyState') }}</p>
        </div>

        <!-- Posts Tab -->
        <template v-else-if="activeTab === 'posts'">
          <div v-if="postsLoading && posts.length === 0" class="flex justify-center py-12">
            <IconLoader class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="posts.length === 0 && !postsLoading" class="text-center py-12">
            <IconFileText class="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p class="text-base-content/60">{{ t('search.noPosts') }}</p>
          </div>

          <template v-else>
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
            />

            <div v-if="postsLoading" class="flex justify-center py-4">
              <IconLoader class="w-6 h-6 animate-spin text-primary" />
            </div>

            <div v-else-if="!hasMorePosts && posts.length > 0" class="text-center py-4">
              <p class="text-base-content/40 text-sm">{{ t('search.noMoreResults') }}</p>
            </div>
          </template>
        </template>

        <!-- Accounts Tab -->
        <template v-else-if="activeTab === 'accounts'">
          <div v-if="accountsLoading && allAccountResults.length === 0" class="flex justify-center py-12">
            <IconLoader class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="allAccountResults.length === 0 && !accountsLoading" class="text-center py-12">
            <IconUsers class="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p class="text-base-content/60">{{ t('search.noAccounts') }}</p>
          </div>

          <div v-else class="space-y-2">
            <NuxtLink
              v-for="result in allAccountResults"
              :key="`${result.type}-${result.data.id || result.data.name}`"
              :to="result.type === 'publisher' ? `/publishers/${result.data.name}` : `/accounts/${result.data.name}`"
              class="search-result-row group"
            >
              <!-- Avatar -->
              <div class="shrink-0">
                <div v-if="getAvatarUrl(result)" class="avatar">
                  <div class="w-12 h-12 rounded-full">
                    <img :src="getAvatarUrl(result)" :alt="getName(result)" class="object-cover">
                  </div>
                </div>
                <div v-else class="avatar avatar-placeholder">
                  <div class="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                    {{ getInitials(result) }}
                  </div>
                </div>
              </div>

              <!-- Info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm truncate">{{ getDisplayName(result) }}</span>
                  <span v-if="result.type === 'publisher'" class="badge badge-xs badge-outline">{{ t('search.publisherBadge') }}</span>
                </div>
                <p class="text-xs text-base-content/60 truncate">
                  @{{ result.data.name }}
                </p>
                <!-- eslint-disable vue/no-v-html -->
                <div
                  v-if="getBio(result)"
                  class="prose prose-xs max-w-none break-words line-clamp-1 prose-headings:mb-0 prose-headings:text-xs prose-p:my-0 prose-a:text-primary prose-a:no-underline prose-code:text-primary prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs mt-0.5"
                  v-html="renderMarkdown(getBio(result))"
                />
                <!-- eslint-enable vue/no-v-html -->
              </div>

              <!-- Arrow -->
              <IconChevronRight class="w-4 h-4 text-base-content/30 group-hover:text-base-content/60 transition-colors shrink-0" />
            </NuxtLink>
          </div>
        </template>

        <!-- Realms Tab -->
        <template v-else-if="activeTab === 'realms'">
          <div v-if="realmsLoading && realms.length === 0" class="flex justify-center py-12">
            <IconLoader class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="realms.length === 0 && !realmsLoading" class="text-center py-12">
            <IconCastle class="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p class="text-base-content/60">{{ t('search.noRealms') }}</p>
          </div>

          <div v-else class="space-y-2">
            <RealmListTile
              v-for="realm in realms"
              :key="realm.id"
              :realm="realm"
            />
          </div>
        </template>
      </div>

      <!-- Right Sidebar (Desktop only) -->
      <aside class="feed-sidebar">
        <RightSidebar />
      </aside>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  fetchPosts,
  searchAccounts,
  searchPublishers,
  searchRealms,
  type Publisher,
} from '~/utils/api'
import { renderMarkdown } from '~/utils/markdown'
import type { SnAccount } from '~/types/auth'
import type { Realm } from '~/types/realm'
import type { Post } from '~/types/post'
import {
  IconSearch,
  IconX,
  IconLoader,
  IconFileText,
  IconUsers,
  IconCastle,
  IconChevronRight,
  IconFileCode,
  IconUser,
} from '#components'

type SearchTab = 'posts' | 'accounts' | 'realms'

const { t } = useI18n()

defineOgImage('UniOgImage', { title: t('search.seoTitle'), description: t('search.seoDescription') })

useSolarSeo({
  title: t('search.seoTitle'),
  description: t('search.seoDescription'),
  breadcrumbs: [
    { name: 'Home', item: 'https://solian.app' },
    { name: 'Search', item: 'https://solian.app/search' }
  ]
})

const route = useRoute()
const searchInputRef = ref<HTMLInputElement | null>(null)

const tabs = [
  { key: 'posts', label: t('search.tabPosts'), icon: IconFileCode },
  { key: 'accounts', label: t('search.tabAccounts'), icon: IconUser },
  { key: 'realms', label: t('search.tabRealms'), icon: IconCastle },
]

// State
const activeTab = ref<SearchTab>('posts')
const searchQuery = ref((route.query.q as string) || '')
const debouncedQuery = ref((route.query.q as string) || '')

// Posts state
const posts = ref<Post[]>([])
const postsLoading = ref(false)
const postsOffset = ref(0)
const postsTotal = ref(0)
const hasMorePosts = computed(() => posts.value.length < postsTotal.value)

// Accounts state
const accountResults = ref<SnAccount[]>([])
const publisherResults = ref<Publisher[]>([])
const accountsLoading = ref(false)

const allAccountResults = computed(() => {
  const results: { type: 'account' | 'publisher'; data: any }[] = [
    ...accountResults.value.map((a) => ({ type: 'account' as const, data: a })),
    ...publisherResults.value.map((p) => ({ type: 'publisher' as const, data: p })),
  ]
  return results
})

// Realms state
const realms = ref<Realm[]>([])
const realmsLoading = ref(false)

// Debounce
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = searchQuery.value
  }, 450)
}

function onSubmit() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debouncedQuery.value = searchQuery.value
  searchInputRef.value?.blur()
}

function clearSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  searchQuery.value = ''
  debouncedQuery.value = ''
  posts.value = []
  accountResults.value = []
  publisherResults.value = []
  realms.value = []
  searchInputRef.value?.focus()
}

// Search functions
async function performPostsSearch() {
  if (!debouncedQuery.value.trim()) return
  postsLoading.value = true
  try {
    const result = await fetchPosts(20, postsOffset.value, {
      queryTerm: debouncedQuery.value.trim(),
    })
    if (postsOffset.value === 0) {
      posts.value = result.posts
    } else {
      posts.value = [...posts.value, ...result.posts]
    }
    postsTotal.value = result.total
  } catch (e) {
    console.error('Posts search failed:', e)
  } finally {
    postsLoading.value = false
  }
}

async function performAccountsSearch() {
  if (!debouncedQuery.value.trim()) return
  accountsLoading.value = true
  try {
    const query = debouncedQuery.value.trim()
    const [accounts, publishers] = await Promise.all([
      searchAccounts(query).catch(() => []),
      searchPublishers(query).catch(() => []),
    ])
    accountResults.value = accounts
    publisherResults.value = publishers
  } catch (e) {
    console.error('Accounts search failed:', e)
  } finally {
    accountsLoading.value = false
  }
}

async function performRealmsSearch() {
  if (!debouncedQuery.value.trim()) return
  realmsLoading.value = true
  try {
    realms.value = await searchRealms(debouncedQuery.value.trim())
  } catch (e) {
    console.error('Realms search failed:', e)
  } finally {
    realmsLoading.value = false
  }
}

// Load more posts
async function loadMorePosts() {
  if (!hasMorePosts.value || postsLoading.value) return
  postsOffset.value += 20
  await performPostsSearch()
}

// Watch for debounced query changes
watch(debouncedQuery, () => {
  resetResults()
  executeSearch()
})

// Watch for tab changes
watch(activeTab, () => {
  if (!debouncedQuery.value.trim()) return

  if (activeTab.value === 'posts' && posts.value.length === 0) {
    postsOffset.value = 0
    performPostsSearch()
  } else if (activeTab.value === 'accounts' && allAccountResults.value.length === 0) {
    performAccountsSearch()
  } else if (activeTab.value === 'realms' && realms.value.length === 0) {
    performRealmsSearch()
  }
})

function resetResults() {
  posts.value = []
  postsOffset.value = 0
  postsTotal.value = 0
  accountResults.value = []
  publisherResults.value = []
  realms.value = []
}

function executeSearch() {
  if (!debouncedQuery.value.trim()) return

  if (activeTab.value === 'posts') {
    performPostsSearch()
  } else if (activeTab.value === 'accounts') {
    performAccountsSearch()
  } else if (activeTab.value === 'realms') {
    performRealmsSearch()
  }
}

// Account result helpers
function getAvatarUrl(result: { type: string; data: any }): string | undefined {
  const fileId = result.data.profile?.picture?.id || result.data.picture?.id
  if (!fileId) return undefined
  return `https://api.solian.app/drive/files/${fileId}`
}

function getName(result: { type: string; data: any }): string {
  return result.data.name || ''
}

function getDisplayName(result: { type: string; data: any }): string {
  if (result.type === 'publisher') {
    return result.data.nick || result.data.name
  }
  return result.data.profile?.nick || result.data.name
}

function getInitials(result: { type: string; data: any }): string {
  const name = getName(result)
  return name.slice(0, 2).toUpperCase()
}

function getBio(result: { type: string; data: any }): string {
  if (result.type === 'publisher') {
    return result.data.bio || ''
  }
  return result.data.profile?.bio || ''
}

// Initialize search if query param exists
onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q as string
    debouncedQuery.value = route.query.q as string
    nextTick(() => executeSearch())
  }
})
</script>
