<template>
  <NuxtLayout name="app">
    <div class="feed-layout">
      <!-- Main Content -->
      <div class="space-y-4 min-w-0">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Categories & Tags</h1>
        </div>

        <!-- Tabs -->
        <div class="search-tabs">
          <button
            class="search-tabs__item"
            :class="{ 'search-tabs__item--active': activeTab === 'categories' }"
            @click="selectTab('categories')"
          >
            <IconFolder class="w-4 h-4 mr-2" />
            Categories
          </button>
          <button
            class="search-tabs__item"
            :class="{ 'search-tabs__item--active': activeTab === 'tags' }"
            @click="selectTab('tags')"
          >
            <IconTag class="w-4 h-4 mr-2" />
            Tags
          </button>
        </div>

        <!-- Categories Tab -->
        <div v-if="activeTab === 'categories'">
          <div v-if="isLoadingCategories" class="flex justify-center py-12">
            <IconLoader class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="categories.length === 0" class="text-center py-12">
            <IconFolder class="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p class="text-base-content/60">No categories found</p>
          </div>

          <div v-else class="space-y-2">
            <NuxtLink
              v-for="category in categories"
              :key="category.id"
              :to="`/categories/${category.slug}`"
              class="search-result-row cursor-pointer"
            >
              <div class="card-body p-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200 text-primary"
                  >
                    <IconFolder class="w-5 h-5" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold truncate">{{ category.name }}</h3>
                    <p v-if="category.description" class="text-sm text-base-content/60 truncate">
                      {{ category.description }}
                    </p>
                  </div>
                  <div class="text-sm text-base-content/50">
                    {{ category.usage }} posts
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Load More -->
          <div
            v-if="hasMoreCategories && !isLoadingCategories"
            class="flex justify-center mt-6"
          >
            <button class="btn btn-outline" @click="loadMoreCategories">
              Load More
            </button>
          </div>
        </div>

        <!-- Tags Tab -->
        <div v-if="activeTab === 'tags'">
          <div v-if="isLoadingTags" class="flex justify-center py-12">
            <IconLoader class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="tags.length === 0" class="text-center py-12">
            <IconTag class="w-12 h-12 mx-auto mb-4 text-base-content/30" />
            <p class="text-base-content/60">No tags found</p>
          </div>

          <div v-else class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="tag in tags"
              :key="tag.id"
              :to="`/tags/${tag.slug}`"
              class="badge badge-lg badge-outline hover:badge-primary transition-colors cursor-pointer"
            >
              #{{ tag.name || tag.slug }}
              <span class="ml-1 opacity-60">({{ tag.usage }})</span>
            </NuxtLink>
          </div>

          <!-- Load More -->
          <div
            v-if="hasMoreTags && !isLoadingTags"
            class="flex justify-center mt-6"
          >
            <button class="btn btn-outline" @click="loadMoreTags">
              Load More
            </button>
          </div>
        </div>
      </div>

      <!-- Right Sidebar (Desktop only) -->
      <aside class="feed-sidebar">
        <ExploreSidebar />
      </aside>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  fetchCategories,
  fetchTags,
  type PostCategory,
  type PostTag,
} from '~/utils/api'
import {
  IconFolder,
  IconTag,
  IconLoader,
} from '#components'

defineOgImage('UniOgImage', { title: 'Categories & Tags', description: 'Browse categories and tags on Solar Network.' })

useSolarSeo({
  title: 'Categories & Tags',
  description: 'Browse categories and tags on Solar Network.',
})

const route = useRoute()
const activeTab = ref<'categories' | 'tags'>(
  route.query.tab === 'tags' ? 'tags' : 'categories',
)

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tab === 'tags' ? 'tags' : 'categories'
  },
)

function selectTab(tab: 'categories' | 'tags') {
  activeTab.value = tab
  void navigateTo(
    { query: tab === 'tags' ? { tab } : {} },
    { replace: true },
  )
}

// Categories state
const categories = ref<PostCategory[]>([])
const categoriesOffset = ref(0)
const totalCategories = ref(0)
const isLoadingCategories = ref(false)
const hasMoreCategories = computed(() => categories.value.length < totalCategories.value)

// Tags state
const tags = ref<PostTag[]>([])
const tagsOffset = ref(0)
const totalTags = ref(0)
const isLoadingTags = ref(false)
const hasMoreTags = computed(() => tags.value.length < totalTags.value)

async function loadCategories() {
  isLoadingCategories.value = true
  try {
    const result = await fetchCategories(20, categoriesOffset.value)
    categories.value = [...categories.value, ...result.categories]
    categoriesOffset.value += result.categories.length
    totalCategories.value = result.total
  } catch (e) {
    console.error('Failed to load categories:', e)
  } finally {
    isLoadingCategories.value = false
  }
}

async function loadMoreCategories() {
  await loadCategories()
}

async function loadTags() {
  isLoadingTags.value = true
  try {
    const result = await fetchTags(50, tagsOffset.value)
    tags.value = [...tags.value, ...result.tags]
    tagsOffset.value += result.tags.length
    totalTags.value = result.total
  } catch (e) {
    console.error('Failed to load tags:', e)
  } finally {
    isLoadingTags.value = false
  }
}

async function loadMoreTags() {
  await loadTags()
}

// Load initial data
onMounted(() => {
  loadCategories()
  loadTags()
})
</script>
