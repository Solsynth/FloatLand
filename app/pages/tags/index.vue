<template>
  <NuxtLayout name="app">
    <div class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6">
      <!-- Main Content -->
      <div class="space-y-4 min-w-0">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Tags</h1>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-12">
          <IconLoader class="w-8 h-8 animate-spin text-primary" />
        </div>

        <!-- Empty State -->
        <div v-else-if="tags.length === 0" class="text-center py-12">
          <IconTag class="w-12 h-12 mx-auto mb-4 text-base-content/30" />
          <p class="text-base-content/60">No tags found</p>
        </div>

        <!-- Tags Grid -->
        <div v-else class="card bg-base-100">
          <div class="card-body p-6">
            <div class="flex flex-wrap gap-3">
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
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMore && !isLoading" class="flex justify-center">
          <button class="btn btn-outline" @click="loadMore">
            Load More
          </button>
        </div>
      </div>

      <!-- Right Sidebar (Desktop only) -->
      <aside class="hidden w-full self-start sticky top-20 xl:block">
        <ExploreSidebar />
      </aside>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { fetchTags, type PostTag } from '~/utils/api'
import { IconTag, IconLoader } from '#components'

defineOgImage('UniOgImage', { title: 'Tags', description: 'Browse tags on Solar Network.' })

useSolarSeo({
  title: 'Tags',
  description: 'Browse tags on Solar Network.',
})

const tags = ref<PostTag[]>([])
const offset = ref(0)
const total = ref(0)
const isLoading = ref(false)

const hasMore = computed(() => tags.value.length < total.value)

async function loadTags() {
  isLoading.value = true
  try {
    const result = await fetchTags(50, offset.value)
    tags.value = [...tags.value, ...result.tags]
    offset.value += result.tags.length
    total.value = result.total
  } catch (e) {
    console.error('Failed to load tags:', e)
  } finally {
    isLoading.value = false
  }
}

async function loadMore() {
  await loadTags()
}

// Load initial data
onMounted(() => {
  loadTags()
})
</script>
