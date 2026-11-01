<template>
  <NuxtLayout name="app">
    <PageHeader
      :title="t('categories.title')"
      :description="t('categories.seoDescription')"
    />

    <div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="min-w-0">
        <TabBox :tabs="tabs" :active="activeTab" :label="t('categories.title')" @select="selectTab" />

        <ConsolePanel v-if="activeTab === 'categories'" :note="isLoadingCategories ? undefined : String(totalCategories)">
          <LoadingSkeleton v-if="isLoadingCategories && categories.length === 0" variant="rows" :rows="5" />

          <p v-else-if="categories.length === 0" class="voice py-6">
            {{ t("categories.noCategories") }}
          </p>

          <ul v-else class="-mx-2 divide-y divide-line-soft">
            <li v-for="category in categories" :key="category.id">
              <NuxtLink
                :to="`/categories/${category.slug}`"
                class="-mx-2 flex items-center gap-3 rounded-control px-2 py-2.5 transition-colors hover:bg-base-200/60"
              >
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-chip border border-line"
                  :style="{ color: category.color || 'var(--color-primary)' }"
                >
                  <IconFolder class="size-4" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[13px] font-semibold text-base-content">
                    {{ category.name }}
                  </span>
                  <span v-if="category.description" class="block truncate text-2xs text-faint">
                    {{ category.description }}
                  </span>
                </span>
                <span class="mono-id shrink-0">
                  {{ t("categories.postsCount", { count: category.usage }) }}
                </span>
              </NuxtLink>
            </li>
          </ul>

          <template #footer>
            <div class="flex justify-center">
              <span v-if="isLoadingCategories" class="mono-id">{{ t("common.loading") }}</span>
              <button
                v-else-if="hasMoreCategories"
                type="button"
                class="btn btn-quiet btn-xs"
                @click="loadMoreCategories"
              >
                {{ t("categories.loadMore") }}
              </button>
            </div>
          </template>
        </ConsolePanel>

        <ConsolePanel v-else :note="isLoadingTags ? undefined : String(totalTags)">
          <LoadingSkeleton v-if="isLoadingTags && tags.length === 0" variant="rows" :rows="5" />

          <p v-else-if="tags.length === 0" class="voice py-6">{{ t("categories.noTags") }}</p>

          <div v-else class="flex flex-wrap gap-1.5">
            <NuxtLink v-for="tag in tags" :key="tag.id" :to="`/tags/${tag.slug}`" class="chip">
              #{{ tag.name || tag.slug }}
              <span class="chip-count">{{ tag.usage }}</span>
            </NuxtLink>
          </div>

          <template #footer>
            <div class="flex justify-center">
              <span v-if="isLoadingTags" class="mono-id">{{ t("common.loading") }}</span>
              <button
                v-else-if="hasMoreTags"
                type="button"
                class="btn btn-quiet btn-xs"
                @click="loadMoreTags"
              >
                {{ t("categories.loadMore") }}
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
  fetchCategories,
  fetchTags,
  type PostCategory,
  type PostTag,
} from '~/utils/api'
import { IconFolder } from "#components"

defineOgImage('UniOgImage', { title: 'Categories & Tags', description: 'Browse categories and tags on Solar Network.' })

useSolarSeo({
  title: 'Categories & Tags',
  description: 'Browse categories and tags on Solar Network.',
})

const { t } = useI18n()

const tabs = computed(() => [
  { key: "categories", label: t("categories.categoriesTab") },
  { key: "tags", label: t("categories.tagsTab") },
])

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

function selectTab(key: string) {
  const tab = key === 'tags' ? 'tags' : 'categories'
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
