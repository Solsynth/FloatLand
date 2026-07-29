<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Posts" description="Review and moderate posts across the platform">
      <template #actions>
        <div v-if="selectedIds.size" class="flex items-center gap-2">
          <span class="text-xs text-base-content/50">{{ selectedIds.size }} selected</span>
          <button class="btn btn-sm btn-ghost" :disabled="batchLoading" @click="batchLock">
            <IconLock class="w-3.5 h-3.5" /> Lock
          </button>
          <button class="btn btn-sm btn-ghost" :disabled="batchLoading" @click="batchUnlock">
            <IconLockOpen class="w-3.5 h-3.5" /> Unlock
          </button>
          <button class="btn btn-sm btn-ghost" @click="selectedIds.clear()">Clear</button>
        </div>
      </template>
    </AdminPageHeader>

    <!-- Search & Filters -->
    <AdminCard class="mb-6">
      <div class="flex flex-col gap-3">
        <div class="relative">
          <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search posts by title, description, or content..."
            class="input input-sm w-full rounded-box border-0 bg-base-200 pl-9"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <select v-model="filters.visibility" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">All Visibility</option>
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
            <option value="close_friends_only">Close Friends</option>
            <option value="quiet_public">Quiet Public</option>
          </select>
          <select v-model="filters.shadowbanReason" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">All Shadowban</option>
            <option value="spam">Spam</option>
            <option value="advertising">Advertising</option>
            <option value="harassment">Harassment</option>
            <option value="hate_speech">Hate Speech</option>
            <option value="misinformation">Misinformation</option>
            <option value="illegal">Illegal</option>
            <option value="other">Other</option>
          </select>
          <select v-model="filters.locked" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any Lock</option>
            <option value="true">Locked</option>
            <option value="false">Unlocked</option>
          </select>
          <select v-model="filters.drafted" class="select select-sm rounded-box border-0 bg-base-200" @change="handleSearch">
            <option value="">Any Draft</option>
            <option value="true">Drafts</option>
            <option value="false">Published only</option>
          </select>
          <input
            v-model="filters.publisherId"
            type="text"
            placeholder="Publisher ID..."
            class="input input-sm w-40 rounded-box border-0 bg-base-200"
            @keyup.enter="handleSearch"
          />
          <input
            v-model="filters.realmId"
            type="text"
            placeholder="Realm ID..."
            class="input input-sm w-40 rounded-box border-0 bg-base-200"
            @keyup.enter="handleSearch"
          />
          <button class="btn btn-sm btn-primary" @click="handleSearch">
            <IconSearch class="w-4 h-4" />
            Search
          </button>
        </div>
      </div>
    </AdminCard>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Posts Table -->
    <AdminCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="table table-sm table-zebra">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase tracking-wider">
              <th class="pl-5 w-8">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  :checked="allSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th>Post</th>
              <th>Publisher</th>
              <th>Visibility</th>
              <th>Status</th>
              <th>Realm</th>
              <th class="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.id" class="hover:bg-base-200/50 transition-colors">
              <td class="pl-5">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  :checked="selectedIds.has(post.id)"
                  @change="toggleSelect(post.id)"
                />
              </td>
              <td>
                <NuxtLink :to="`/admin/posts/${post.id}`" class="block">
                  <div class="text-sm font-medium truncate max-w-[16rem]">
                    {{ post.title || '(Untitled)' }}
                  </div>
                  <div class="text-xs text-base-content/40 truncate max-w-[16rem]">
                    {{ post.description || stripHtml(post.content || '').slice(0, 80) }}
                  </div>
                </NuxtLink>
              </td>
              <td>
                <span class="text-sm text-base-content/60">
                  {{ post.publisher?.nick || post.publisher?.name || '—' }}
                </span>
              </td>
              <td>
                <span class="badge badge-xs" :class="visibilityClass(post.visibility)">
                  {{ formatVisibility(post.visibility) }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span v-if="post.lockedAt" class="badge badge-warning badge-xs">Locked</span>
                  <span
                    v-if="isShadowbanned(post.shadowbanReason)"
                    class="badge badge-error badge-xs"
                  >
                    {{ formatShadowban(post.shadowbanReason) }}
                  </span>
                  <span v-if="post.draftedAt" class="badge badge-ghost badge-xs">Draft</span>
                </div>
              </td>
              <td>
                <span class="text-xs text-base-content/60">
                  {{ post.realm?.nick || post.realm?.name || post.realm?.slug || '—' }}
                </span>
              </td>
              <td class="pr-5 text-right">
                <NuxtLink :to="`/admin/posts/${post.id}`" class="btn btn-ghost btn-xs">
                  <IconExternalLink class="w-3.5 h-3.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="posts.length === 0" class="flex flex-col items-center py-16 text-center">
        <IconFileText class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/50 mb-1">No posts found</p>
        <p class="text-xs text-base-content/30">Try adjusting your search or filters</p>
      </div>

      <div v-if="hasMore || total > pageSize" class="flex items-center justify-between px-5 py-3">
        <span class="text-xs text-base-content/40">
          Showing {{ offset + 1 }}–{{ Math.min(offset + pageSize, total) }} of {{ total || 'many' }}
        </span>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-xs" :disabled="offset === 0" @click="prevPage">
            <IconChevronLeft class="w-3.5 h-3.5" />
          </button>
          <button class="btn btn-ghost btn-xs" :disabled="!hasMore && offset + pageSize >= total" @click="nextPage">
            <IconChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </AdminCard>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconExternalLink,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconLock,
  IconLockOpen,
} from '#components'
import type { PostVisibility, PostShadowbanReason, AdminPost } from '~/types/admin'
import { fetchAdminPosts, batchLockPosts, batchUnlockPosts } from '~/utils/admin'

definePageMeta({ middleware: 'auth' })

const posts = ref<AdminPost[]>([])
const total = ref(0)
const hasMore = ref(false)
const isLoading = ref(false)
const batchLoading = ref(false)
const pageSize = 50
const offset = ref(0)
const searchQuery = ref('')
const selectedIds = ref(new Set<string>())
const filters = ref({
  visibility: '' as string,
  shadowbanReason: '' as string,
  locked: '' as string,
  drafted: '' as string,
  publisherId: '',
  realmId: '',
})

const allSelected = computed(
  () => posts.value.length > 0 && posts.value.every(p => selectedIds.value.has(p.id)),
)

function stripHtml(html: string | null | undefined): string {
  return (html || '').replace(/<[^>]*>/g, '').trim()
}

const VISIBILITY_LABELS = ['public', 'friends', 'unlisted', 'private', 'close_friends_only', 'quiet_public'] as const
const SHADOWBAN_LABELS: Record<number, string> = {
  0: 'none',
  1: 'spam',
  2: 'advertising',
  3: 'harassment',
  4: 'hate_speech',
  5: 'misinformation',
  6: 'illegal',
  99: 'other',
}

function formatVisibility(v: PostVisibility | string | number | undefined): string {
  if (v === undefined || v === null) return '—'
  if (typeof v === 'number') return VISIBILITY_LABELS[v] ?? String(v)
  return String(v)
}

function formatShadowban(v: PostShadowbanReason | string | number | null | undefined): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'number') return SHADOWBAN_LABELS[v] ?? String(v)
  return String(v)
}

function isShadowbanned(v: PostShadowbanReason | string | number | null | undefined): boolean {
  if (v === undefined || v === null || v === 'none' || v === 0) return false
  return true
}

function visibilityClass(v: PostVisibility | string | number): string {
  const key = formatVisibility(v)
  return ({
    public: 'badge-success',
    friends: 'badge-info',
    unlisted: 'badge-warning',
    private: 'badge-error',
    close_friends_only: 'badge-primary',
    quiet_public: 'badge-ghost',
  } as Record<string, string>)[key] || 'badge-ghost'
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(posts.value.map(p => p.id))
  }
}

async function loadPosts() {
  isLoading.value = true
  try {
    const result = await fetchAdminPosts({
      query: searchQuery.value || undefined,
      visibility: (filters.value.visibility || undefined) as PostVisibility | undefined,
      shadowbanReason: (filters.value.shadowbanReason || undefined) as PostShadowbanReason | undefined,
      locked: filters.value.locked ? filters.value.locked === 'true' : undefined,
      drafted: filters.value.drafted ? filters.value.drafted === 'true' : undefined,
      publisherId: filters.value.publisherId || undefined,
      realmId: filters.value.realmId || undefined,
      take: pageSize,
      offset: offset.value,
    })
    posts.value = result.posts
    total.value = result.total
    hasMore.value = result.total > offset.value + result.posts.length || result.posts.length >= pageSize
  } catch {
    posts.value = []
    total.value = 0
    hasMore.value = false
  } finally {
    isLoading.value = false
  }
}

async function batchLock() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  batchLoading.value = true
  try {
    await batchLockPosts(ids)
    selectedIds.value = new Set()
    await loadPosts()
  } catch {
    useNuxtApp().$toast.error('Failed to lock posts')
  } finally {
    batchLoading.value = false
  }
}

async function batchUnlock() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  batchLoading.value = true
  try {
    await batchUnlockPosts(ids)
    selectedIds.value = new Set()
    await loadPosts()
  } catch {
    useNuxtApp().$toast.error('Failed to unlock posts')
  } finally {
    batchLoading.value = false
  }
}

function handleSearch() {
  offset.value = 0
  selectedIds.value = new Set()
  loadPosts()
}

function prevPage() {
  offset.value = Math.max(0, offset.value - pageSize)
  loadPosts()
}

function nextPage() {
  offset.value = offset.value + pageSize
  loadPosts()
}

onMounted(() => {
  loadPosts()
})
</script>
