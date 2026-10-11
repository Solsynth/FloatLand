<template>
  <div class="space-y-3">
    <ConfuseSpinner v-if="status === 'pending'" />

    <div v-else-if="status === 'error'" class="alert alert-error text-sm">
      <span>{{ t('post.collections.postsFailed') }}</span>
      <button type="button" class="btn btn-ghost btn-xs" @click="reload">
        {{ t('common.retry') }}
      </button>
    </div>

    <template v-else-if="posts.length > 0">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @refresh="reload"
      />

      <div class="flex justify-center pt-1">
        <button
          v-if="hasMore"
          type="button"
          class="btn btn-outline btn-sm"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <IconLoader v-if="loadingMore" class="h-4 w-4 animate-spin" />
          {{ t('common.loadMore') }}
        </button>
        <p v-else class="text-xs text-base-content/45">{{ t('common.noMore') }}</p>
      </div>
    </template>

    <p v-else class="py-10 text-center text-sm text-base-content/50">
      {{ t('post.collections.postsEmpty') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'
import { fetchCollectionPosts } from '~/utils/api'
import { IconLoader } from '#components'

const props = withDefaults(defineProps<{
  publisherName: string
  slug: string
  pageSize?: number
}>(), {
  pageSize: 20,
})

const { t } = useI18n()
const toast = useAppToast()

const posts = ref<Post[]>([])
const total = ref(0)
const status = ref<'pending' | 'success' | 'error'>('pending')
const loadingMore = ref(false)

const hasMore = computed(() => posts.value.length < total.value)

async function reload() {
  if (!props.publisherName || !props.slug) return
  status.value = 'pending'
  try {
    const result = await fetchCollectionPosts(
      props.publisherName,
      props.slug,
      props.pageSize,
      0,
    )
    posts.value = result.posts
    total.value = result.total
    status.value = 'success'
  } catch {
    posts.value = []
    total.value = 0
    status.value = 'error'
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const result = await fetchCollectionPosts(
      props.publisherName,
      props.slug,
      props.pageSize,
      posts.value.length,
    )
    posts.value = [...posts.value, ...result.posts]
    total.value = result.total
  } catch {
    toast.error(t('post.collections.postsFailed'))
  } finally {
    loadingMore.value = false
  }
}

// The drawer body is client-only, so the fetch starts on open rather than SSR.
watch(() => [props.publisherName, props.slug], reload, { immediate: true })
</script>
