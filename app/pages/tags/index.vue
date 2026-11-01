<template>
  <NuxtLayout name="app">
    <div class="page-measure">
      <PageHeader title="Tags" description="Every tag in use on the network, most used first." />

      <div class="min-w-0">
        <ConsolePanel :title="t('tags.title')" :note="isLoading ? undefined : String(tags.length)">
          <LoadingSkeleton v-if="isLoading && tags.length === 0" variant="rows" :rows="5" />

          <p v-else-if="tags.length === 0" class="voice py-6">{{ t("tags.noTags") }}</p>

          <div v-else class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="tag in tags"
              :key="tag.id"
              :to="`/tags/${tag.slug}`"
              class="chip"
            >
              #{{ tag.name || tag.slug }}
              <span class="chip-count">{{ tag.usage }}</span>
            </NuxtLink>
          </div>

          <template #footer>
            <div class="flex justify-center">
              <span v-if="isLoading" class="mono-id">{{ t("common.loading") }}</span>
              <button
                v-else-if="hasMore"
                type="button"
                class="btn btn-quiet btn-xs"
                @click="loadMore"
              >
                {{ t("tags.loadMore") }}
              </button>
            </div>
          </template>
        </ConsolePanel>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { fetchTags, type PostTag } from "~/utils/api";

const { t } = useI18n();

defineOgImage("UniOgImage", { title: "Tags", description: "Browse tags on Solar Network." });

useSolarSeo({
  title: "Tags",
  description: "Browse tags on Solar Network.",
});

const tags = ref<PostTag[]>([]);
const offset = ref(0);
const total = ref(0);
const isLoading = ref(false);

const hasMore = computed(() => tags.value.length < total.value);

async function loadTags() {
  isLoading.value = true;
  try {
    const result = await fetchTags(50, offset.value);
    tags.value = [...tags.value, ...result.tags];
    offset.value += result.tags.length;
    total.value = result.total;
  } catch (e) {
    console.error("Failed to load tags:", e);
  } finally {
    isLoading.value = false;
  }
}

async function loadMore() {
  await loadTags();
}

onMounted(loadTags);
</script>
