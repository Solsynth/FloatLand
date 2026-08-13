<template>
  <NuxtLayout name="app">
    <div class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6">
      <!-- Main Content -->
      <div class="space-y-4 min-w-0">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-12">
          <IconLoader class="w-8 h-8 animate-spin text-primary" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-error">
          <IconAlertCircle class="h-5 w-5" />
          <span>{{ error }}</span>
          <button class="btn btn-sm btn-ghost" @click="loadData">Retry</button>
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Header Card -->
          <div class="card bg-base-100">
            <div class="card-body p-6">
              <div class="flex items-start gap-4">
                <div
                  v-if="isCategory"
                  class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: category?.color || '#6366f1' }"
                >
                  <IconFolder class="w-6 h-6 text-white" />
                </div>
                <div v-else class="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <IconTag class="w-6 h-6 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <h1 class="text-2xl font-bold mb-1">
                    {{ isCategory ? category?.name : (tag?.name || '#' + slug) }}
                  </h1>
                  <p class="text-base-content/60">
                    {{ isCategory ? (category?.description || 'A category') : 'A tag' }}
                  </p>
                </div>
              </div>

              <!-- Subscribe Button -->
              <div class="mt-4">
                <button
                  v-if="isSubscribed"
                  class="btn btn-error btn-outline btn-sm"
                  :disabled="isSubscribing"
                  @click="handleUnsubscribe"
                >
                  <IconUserMinus class="w-4 h-4 mr-2" />
                  Unsubscribe
                </button>
                <button
                  v-else
                  class="btn btn-primary btn-sm"
                  :disabled="isSubscribing"
                  @click="handleSubscribe"
                >
                  <IconUserPlus class="w-4 h-4 mr-2" />
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <!-- Posts Section -->
          <div v-if="isLoadingPosts && posts.length === 0" class="flex justify-center py-8">
            <IconLoader class="w-6 h-6 animate-spin text-primary" />
          </div>

          <div v-else-if="posts.length === 0" class="text-center py-8">
            <IconFileText class="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p class="text-base-content/60">No posts found</p>
          </div>

          <template v-else>
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
            />
          </template>

          <!-- Load More -->
          <div
            v-if="hasMorePosts && !isLoadingPosts"
            class="flex justify-center"
          >
            <button class="btn btn-outline" @click="loadMorePosts">
              Load More
            </button>
          </div>
        </template>
      </div>

      <!-- Right Sidebar (Desktop only) -->
      <aside class="hidden w-full self-start sticky top-20 xl:block">
        <ExploreSidebar />
      </aside>
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
  type Post,
} from '~/utils/api'
import {
  IconFolder,
  IconTag,
  IconLoader,
  IconAlertCircle,
  IconUserPlus,
  IconUserMinus,
  IconFileText,
} from '#components'

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
