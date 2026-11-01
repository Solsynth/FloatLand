<template>
  <NuxtLayout name="app">
    <div class="page-measure min-w-0">
      <p v-if="error" class="note note-error mb-4">{{ error }}</p>

      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <span
            v-if="isCategory"
            class="grid size-10 shrink-0 place-items-center rounded-chip bg-base-200/70"
            :style="{ color: category?.color || 'var(--color-primary)' }"
          >
            <IconFolder class="size-5" aria-hidden="true" />
          </span>
          <span
            v-else
            class="grid size-10 shrink-0 place-items-center rounded-chip bg-base-200/70 text-primary"
          >
            <IconTag class="size-5" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <h1 class="title truncate text-xl text-base-content">
              {{ isCategory ? category?.name : `#${tag?.name || slug}` }}
            </h1>
            <p class="voice mt-0.5 text-[13px]">
              {{ isCategory ? (category?.description || t("categories.title")) : t("tags.seoDescription") }}
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

        <div v-else class="feed-stack">
          <PostCard v-for="post in posts" :key="post.id" :post="post" variant="feed" />

          <div class="flex justify-center rounded-card bg-base-200/50 px-6 py-4">
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
        </div>
      </ConsolePanel>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  fetchCategory,
  fetchTag,
  fetchCategorySubscription,
  fetchTagSubscription,
  subscribeToCategory,
  unsubscribeFromCategory,
  subscribeToTag,
  unsubscribeFromTag,
  fetchPostsByCategory,
  fetchPostsByTag,
  type PostCategory,
  type PostTag,
  type CategorySubscription,
} from '~/utils/api'
import type { Post } from '~/types/post'
import { IconFolder, IconTag, IconUserPlus, IconUserMinus } from "#components"

const { t } = useI18n()

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const isCategory = computed(() => route.path.startsWith('/categories/'))

// State
const category = ref<PostCategory | null>(null)
const tag = ref<PostTag | null>(null)
const subscription = ref<CategorySubscription | null>(null)
const posts = ref<Post[]>([])
const isLoading = ref(true)
const isLoadingPosts = ref(false)
const isSubscribing = ref(false)
const error = ref<string | null>(null)
const postsOffset = ref(0)
const totalPosts = ref(0)

const title = computed(() => {
  if (isCategory.value) return category.value?.name || 'Category'
  return tag.value?.name || 'Tag'
})

defineOgImage('UniOgImage', { title: title, description: computed(() => isCategory.value ? (category.value?.description || 'A category') : 'A tag') })

useSolarSeo({
  title: title,
  description: computed(() => isCategory.value ? (category.value?.description || 'A category') : 'A tag'),
})

const hasMorePosts = computed(() => posts.value.length < totalPosts.value)
const isSubscribed = computed(() => subscription.value !== null)

async function loadCategoryOrTag() {
  try {
    if (isCategory.value) {
      category.value = await fetchCategory(slug.value)
    } else {
      tag.value = await fetchTag(slug.value)
    }
  } catch (e) {
    error.value = `Failed to load ${isCategory.value ? 'category' : 'tag'}`
    throw e
  }
}

async function loadSubscription() {
  try {
    if (isCategory.value) {
      subscription.value = await fetchCategorySubscription(slug.value)
    } else {
      subscription.value = await fetchTagSubscription(slug.value)
    }
  } catch {
    subscription.value = null
  }
}

async function loadPosts() {
  isLoadingPosts.value = true
  try {
    let result
    if (isCategory.value) {
      result = await fetchPostsByCategory(slug.value, 20, postsOffset.value)
    } else {
      result = await fetchPostsByTag(slug.value, 20, postsOffset.value)
    }
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
      loadCategoryOrTag(),
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
    if (isCategory.value) {
      await subscribeToCategory(slug.value)
    } else {
      await subscribeToTag(slug.value)
    }
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
    if (isCategory.value) {
      await unsubscribeFromCategory(slug.value)
    } else {
      await unsubscribeFromTag(slug.value)
    }
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
