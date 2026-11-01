<template>
  <NuxtLayout name="app">
    <div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="min-w-0">
        <p v-if="error" class="note note-error mb-4">{{ error }}</p>

        <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-chip border border-line bg-base-200/40 text-primary">
              <IconTag class="size-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h1 class="title truncate text-xl text-base-content">
                #{{ tag?.name || slug }}
              </h1>
              <p class="voice mt-0.5 text-[13px]">
                {{ t("tags.seoDescription") }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-xs"
            :class="isSubscribed ? 'btn-error' : 'btn-primary'"
            :disabled="isSubscribing"
            @click="isSubscribed ? handleUnsubscribe() : handleSubscribe()"
          >
            <IconUserMinus v-if="isSubscribed" class="size-3.5" aria-hidden="true" />
            <IconUserPlus v-else class="size-3.5" aria-hidden="true" />
            {{ isSubscribed ? t("tags.unsubscribe") : t("tags.subscribe") }}
          </button>
        </div>

        <ConsolePanel flush>
          <LoadingSkeleton v-if="isLoading || (isLoadingPosts && posts.length === 0)" variant="feed" :rows="4" />

          <p v-else-if="posts.length === 0" class="voice px-6 py-10 text-center">
            {{ t("tags.noPosts") }}
          </p>

          <template v-else>
            <PostCard v-for="post in posts" :key="post.id" :post="post" variant="feed" />

            <div class="flex justify-center border-t border-line-soft px-6 py-4">
              <span v-if="isLoadingPosts" class="mono-id">{{ t("common.loading") }}</span>
              <button
                v-else-if="hasMorePosts"
                type="button"
                class="btn btn-quiet btn-xs"
                @click="loadMorePosts"
              >
                {{ t("tags.loadMore") }}
              </button>
            </div>
          </template>
        </ConsolePanel>
      </div>

      <aside class="hidden min-w-0 lg:block">
        <div class="sticky top-20">
          <ExploreDiscovery />
        </div>
      </aside>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  fetchTag,
  fetchTagSubscription,
  subscribeToTag,
  unsubscribeFromTag,
  fetchPostsByTag,
  type PostTag,
  type CategorySubscription,
} from '~/utils/api'
import type { Post } from '~/types/post'
import { IconTag, IconUserPlus, IconUserMinus } from "#components"

const { t } = useI18n()

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// State
const tag = ref<PostTag | null>(null)
const subscription = ref<CategorySubscription | null>(null)
const posts = ref<Post[]>([])
const isLoading = ref(true)
const isLoadingPosts = ref(false)
const isSubscribing = ref(false)
const error = ref<string | null>(null)
const postsOffset = ref(0)
const totalPosts = ref(0)

defineOgImage('UniOgImage', { title: computed(() => tag.value?.name || 'Tag'), description: computed(() => `Browse posts tagged with ${tag.value?.name || 'this tag'} on Solar Network.`) })

useSolarSeo({
  title: computed(() => tag.value?.name || 'Tag'),
  description: computed(() => `Browse posts tagged with ${tag.value?.name || 'this tag'} on Solar Network.`),
})

const hasMorePosts = computed(() => posts.value.length < totalPosts.value)
const isSubscribed = computed(() => subscription.value !== null)

async function loadTag() {
  try {
    tag.value = await fetchTag(slug.value)
  } catch (e) {
    error.value = 'Failed to load tag'
    throw e
  }
}

async function loadSubscription() {
  try {
    subscription.value = await fetchTagSubscription(slug.value)
  } catch {
    subscription.value = null
  }
}

async function loadPosts() {
  isLoadingPosts.value = true
  try {
    const result = await fetchPostsByTag(slug.value, 20, postsOffset.value)
    posts.value = [...posts.value, ...result.posts]
    postsOffset.value += result.posts.length
    totalPosts.value = result.total
  } catch (e) {
    console.error('Failed to load posts:', e)
  } finally {
    isLoadingPosts.value = false
  }
}

async function loadMorePosts() {
  await loadPosts()
}

async function loadData() {
  isLoading.value = true
  error.value = null
  posts.value = []
  postsOffset.value = 0

  try {
    await Promise.all([
      loadTag(),
      loadSubscription(),
    ])
    await loadPosts()
  } finally {
    isLoading.value = false
  }
}

async function handleSubscribe() {
  isSubscribing.value = true
  try {
    await subscribeToTag(slug.value)
    await loadSubscription()
  } catch (e) {
    console.error('Failed to subscribe:', e)
  } finally {
    isSubscribing.value = false
  }
}

async function handleUnsubscribe() {
  isSubscribing.value = true
  try {
    await unsubscribeFromTag(slug.value)
    await loadSubscription()
  } catch (e) {
    console.error('Failed to unsubscribe:', e)
  } finally {
    isSubscribing.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadData()
})
</script>
