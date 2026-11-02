<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { IconChevronLeft, IconChevronRight, IconRotateCw } from "#components";
import type { MarketplaceApp } from "~/types/marketplace";
import {
  fetchMarketplaceApps,
  getProductName,
  getPublisherDisplayName,
  getReleasePublishedAt,
} from "~/utils/marketplace";
import { formatRelativeTime } from "~/utils/datetime";

const { t, locale } = useI18n();

useSeoMeta({
  title: () => t("catalog.title"),
  description: () => t("catalog.description"),
  ogTitle: () => t("catalog.title"),
  ogDescription: () => t("catalog.description"),
});

const apps = ref<MarketplaceApp[]>([]);
const total = ref(0);
const loading = ref(true);
const error = ref("");
const page = ref(0);
const pageSize = 20;

const sort = ref<"updated_at" | "name" | "created_at">("updated_at");
const order = ref<"desc" | "asc">("desc");

const offset = computed(() => page.value * pageSize);
const lastPage = computed(() => Math.max(0, Math.ceil(total.value / pageSize) - 1));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await fetchMarketplaceApps({
      sort: sort.value,
      order: order.value,
      limit: pageSize,
      offset: offset.value,
    });
    apps.value = result.data ?? [];
    total.value = result.total ?? 0;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : t("catalog.error");
  } finally {
    loading.value = false;
  }
}

function go(next: number) {
  page.value = Math.min(Math.max(0, next), lastPage.value);
  void load();
}

watch([sort, order], () => {
  page.value = 0;
  void load();
});

function productName(app: MarketplaceApp): string {
  return getProductName(app.product, locale.value);
}

function publisherName(app: MarketplaceApp): string {
  return getPublisherDisplayName(app.publisher);
}

function releaseTime(app: MarketplaceApp): string {
  const publishedAt = getReleasePublishedAt(app.latest);
  if (!publishedAt) return "";
  return formatRelativeTime(publishedAt);
}

onMounted(load);
</script>

<template>
  <NuxtLayout name="app">
    <div class="page-measure min-w-0">
      <PageHeader :title="t('catalog.title')" :description="t('catalog.description')">
        <template #actions>
          <label class="flex items-center gap-1.5 text-2xs text-faint whitespace-nowrap">
            <span>{{ t("catalog.sort") }}</span>
            <select v-model="sort" class="select select-xs control-select">
              <option value="updated_at">{{ t("catalog.sortUpdated") }}</option>
              <option value="name">{{ t("catalog.sortName") }}</option>
              <option value="created_at">{{ t("catalog.sortCreated") }}</option>
            </select>
          </label>
          <label class="flex items-center gap-1.5 text-2xs text-faint whitespace-nowrap">
            <span>{{ t("catalog.order") }}</span>
            <select v-model="order" class="select select-xs control-select">
              <option value="desc">{{ t("catalog.descending") }}</option>
              <option value="asc">{{ t("catalog.ascending") }}</option>
            </select>
          </label>
          <IconButton :label="t('common.refresh')" :disabled="loading" @click="load">
            <IconRotateCw class="size-3.5" :class="{ 'animate-spin': loading }" aria-hidden="true" />
          </IconButton>
        </template>
      </PageHeader>

      <p v-if="error" class="note note-error mb-4">{{ error }}</p>

      <ConsolePanel
        :title="t('catalog.latest')"
        :note="loading ? undefined : t('catalog.total', { n: total })"
      >
        <LoadingSkeleton v-if="loading" :rows="6" variant="rows" />

        <div v-else-if="!apps.length" class="py-6">
          <p class="voice">{{ t("catalog.empty") }}</p>
          <p class="voice mt-1 text-[12px] text-faint">{{ t("catalog.emptyBody") }}</p>
        </div>

        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="app in apps"
            :key="app.product.id"
            class="rounded-chip bg-raised transition-colors hover:bg-raised-hover"
          >
            <NuxtLink
              :to="`/marketplace/${app.product.slug || app.product.id}`"
              class="flex items-start gap-3 p-3.5"
            >
              <AppMark :picture="app.product.icon" :name="productName(app)" flat />
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline justify-between gap-3">
                  <p class="min-w-0 truncate text-[13px] font-semibold text-base-content">
                    {{ productName(app) }}
                  </p>
                  <p v-if="app.latest" class="shrink-0 font-mono text-xs tabular-nums text-dim">
                    {{ app.latest.version }}
                  </p>
                </div>
                <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p class="text-2xs text-faint">
                    {{ t("product.by", { publisher: publisherName(app) }) }}
                  </p>
                  <p v-if="app.latest" class="shrink-0 text-2xs text-faint">
                    {{ t("catalog.published", { when: releaseTime(app) }) }}
                  </p>
                  <p v-else class="shrink-0 text-2xs text-faint">
                    {{ t("catalog.unreleased") }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </li>
        </ul>

        <template #footer>
          <div class="flex items-center justify-between text-2xs text-faint">
            <span />
            <div class="flex items-center gap-3">
              <span v-if="!loading" class="tabular-nums">
                {{ Math.min(offset + 1, total) }}–{{ Math.min(offset + pageSize, total) }} / {{ total }}
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-xs px-1 text-dim disabled:text-faint"
                :aria-label="t('common.previous')"
                :title="t('common.previous')"
                :disabled="page === 0 || loading"
                @click="go(page - 1)"
              >
                <IconChevronLeft class="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs px-1 text-dim disabled:text-faint"
                :aria-label="t('common.next')"
                :title="t('common.next')"
                :disabled="page >= lastPage || loading"
                @click="go(page + 1)"
              >
                <IconChevronRight class="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </template>
      </ConsolePanel>
    </div>
  </NuxtLayout>
</template>
