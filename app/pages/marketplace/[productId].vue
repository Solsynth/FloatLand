<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  IconArrowLeft,
  IconDownload,
  IconExternalLink,
} from "#components";
import type {
  MarketplaceArtifact,
  MarketplaceChannel,
  MarketplaceRelease,
  ProductDetail,
} from "~/types/marketplace";
import {
  findBestDownload,
  formatTargetLabel,
  getArtifactDownloadUrl,
  getFileName,
  getChannelDisplayName,
  getProductDescription,
  getProductName,
  getPublisherDisplayName,
  getReleaseNotes,
  getReleasePublishedAt,
  getReleaseTitle,
  resolveProductBySlug,
  fetchProductChannels,
  type MatchOutcome,
} from "~/utils/marketplace";

const { t, locale } = useI18n();
const route = useRoute();

const detail = ref<ProductDetail | null>(null);
const channels = ref<MarketplaceChannel[]>([]);
const loading = ref(true);
const error = ref("");
const missing = ref(false);

const productId = computed(() => String(route.params.productId ?? ""));

const productName = computed(() =>
  detail.value ? getProductName(detail.value.product, locale.value) : "",
);

const description = computed(() =>
  detail.value ? getProductDescription(detail.value.product, locale.value) : "",
);

const publisherName = computed(() =>
  getPublisherDisplayName(detail.value?.publisher),
);

const publishedChannels = computed(() =>
  channels.value.filter((channel) => channel.latest),
);

const allCandidateReleases = computed(() => {
  const list: MarketplaceRelease[] = [];
  if (detail.value?.latest) list.push(detail.value.latest);
  for (const ch of publishedChannels.value) {
    if (ch.latest) list.push(ch.latest);
  }
  return list;
});

const match = computed<MatchOutcome>(() => {
  return findBestDownload(
    detail.value?.latest,
    publishedChannels.value.map((c) => c.latest),
  );
});

const totalArtifactsCount = computed(() => {
  let count = 0;
  for (const r of allCandidateReleases.value) {
    count += r.artifacts?.length ?? 0;
  }
  return count;
});

const downloadButtonLabel = computed(() => {
  if (!match.value.artifact || !getArtifactDownloadUrl(match.value.artifact)) {
    return t("product.downloadUnavailable");
  }
  if (match.value.isExactMatch && match.value.platformLabel) {
    return t("product.downloadFor", { platform: match.value.platformLabel });
  }
  if (match.value.release?.version) {
    return t("product.downloadVersion", { version: match.value.release.version });
  }
  return t("product.download");
});

function channelLabel(channel: MarketplaceChannel): string {
  return getChannelDisplayName(channel, locale.value);
}

function releaseTitleText(release: MarketplaceRelease): string {
  return getReleaseTitle(release, locale.value);
}

function releaseNotesText(release: MarketplaceRelease): string {
  return getReleaseNotes(release, locale.value);
}

function targetLabel(platform?: string, arch?: string): string {
  return formatTargetLabel(platform, arch);
}

function artifactUrl(artifact: MarketplaceArtifact): string | undefined {
  return getDownloadUrl(artifact);
}

function artifactName(artifact: MarketplaceArtifact): string {
  return getFileName(artifact);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function formatCount(value?: number): string {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat().format(value);
}

async function load() {
  if (!productId.value) return;
  loading.value = true;
  error.value = "";
  missing.value = false;
  try {
    const result = await resolveProductBySlug(productId.value);
    detail.value = result;
    const channelList = await fetchProductChannels(result.product.id);
    channels.value = channelList;
  } catch (caught: unknown) {
    const status = (caught as { status?: number })?.status;
    if (status === 404 || (caught as Error)?.message?.includes("404")) {
      missing.value = true;
    } else {
      error.value = caught instanceof Error ? caught.message : t("product.error");
    }
  } finally {
    loading.value = false;
  }
}

useSeoMeta({
  title: () => (productName.value ? `${productName.value} · ${t("catalog.title")}` : t("catalog.title")),
  description: () => description.value || t("catalog.description"),
  ogTitle: () => (productName.value ? `${productName.value} · ${t("catalog.title")}` : t("catalog.title")),
  ogDescription: () => description.value || t("catalog.description"),
});

watch(productId, () => void load());
onMounted(load);
</script>

<template>
  <NuxtLayout name="app">
    <div class="min-w-0">
      <!-- Error State -->
      <p v-if="error" class="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8">
        <span class="note note-error mb-4 block">{{ error }}</span>
      </p>

      <!-- Missing / 404 State -->
      <div v-if="missing" class="mx-auto max-w-[1440px] px-4 py-10 sm:px-7">
        <p class="voice">{{ t("product.notFound") }}</p>
        <NuxtLink to="/marketplace" class="btn btn-ghost btn-sm mt-4">
          {{ t("product.backToCatalog") }}
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8">
        <LoadingSkeleton :rows="5" variant="rows" />
      </div>

      <!-- Product Content -->
      <template v-else-if="detail">
        <!-- 16:7 Banner: snapped to screen edge -->
        <div
          v-if="detail.product.background?.id || detail.product.background?.url"
          class="relative w-full aspect-[16/7] max-h-80 overflow-hidden bg-base-200"
        >
          <FileImage
            :file="detail.product.background"
            :alt="productName"
            class="h-full w-full object-cover"
          />
          <!-- Seamless fade into base surface at bottom -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/30 to-transparent pointer-events-none"
          />
          <!-- Back button pinned inside banner -->
          <NuxtLink
            to="/marketplace"
            class="absolute top-4 left-4 sm:top-6 sm:left-7 z-10 inline-flex items-center gap-1.5 rounded-full bg-base-100/80 hover:bg-base-100 backdrop-blur px-3 py-1.5 text-2xs font-medium text-base-content transition-colors"
          >
            <IconArrowLeft class="size-3.5" aria-hidden="true" />
            <span>{{ t("product.backToCatalog") }}</span>
          </NuxtLink>
        </div>

        <!-- Main Page Content -->
        <div
          class="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-7"
          :class="detail.product.background?.id || detail.product.background?.url ? '-mt-10 sm:-mt-14 relative z-10' : 'pt-6 sm:pt-8'"
        >
          <!-- Standalone back button when no banner is present -->
          <NuxtLink
            v-if="!detail.product.background?.id && !detail.product.background?.url"
            to="/marketplace"
            class="mb-6 inline-flex items-center gap-1.5 text-2xs text-faint transition-colors hover:text-dim"
          >
            <IconArrowLeft class="size-3.5" aria-hidden="true" />
            <span>{{ t("product.backToCatalog") }}</span>
          </NuxtLink>

          <!-- Product Hero Header -->
          <header class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between pb-8 mb-8 border-b border-line-soft">
            <div class="flex items-start gap-4 min-w-0 flex-1">
              <AppMark
                :picture="detail.product.icon"
                :name="productName"
                size="lg"
                class="shrink-0 ring-4 ring-base-100 shadow-md bg-base-100"
              />
              <div class="min-w-0 flex-1">
                <h1 class="title text-2xl font-bold text-base-content sm:text-3xl tracking-tight">
                  {{ productName }}
                </h1>
                <p class="mt-1 text-2xs text-faint">
                  <NuxtLink
                    v-if="detail.publisher?.name"
                    :to="`/publishers/${detail.publisher.name}`"
                    class="hover:underline"
                  >
                    {{ t("product.by", { publisher: publisherName }) }}
                  </NuxtLink>
                  <span v-else>{{ t("product.by", { publisher: publisherName }) }}</span>
                  <span class="mx-1 text-line">·</span>
                  <span class="font-mono">{{ detail.product.slug }}</span>
                </p>
                <p class="voice mt-3 max-w-2xl text-sm leading-relaxed text-dim">
                  {{ description || t("product.noDescription") }}
                </p>
              </div>
            </div>

            <!-- Big Download Button with auto-selection -->
            <div class="shrink-0 flex flex-col items-start lg:items-end gap-2">
              <div v-if="match.release" class="text-left lg:text-right">
                <p class="text-2xs uppercase tracking-[0.16em] text-faint">{{ t("catalog.latest") }}</p>
                <p class="mt-0.5 font-mono text-xs text-base-content">{{ match.release.version }}</p>
              </div>

              <a
                v-if="match.artifact && artifactUrl(match.artifact)"
                :href="artifactUrl(match.artifact)"
                :download="artifactName(match.artifact)"
                class="btn btn-primary btn-md gap-2 px-6 shadow-md hover:shadow-lg transition-all text-sm font-medium w-full sm:w-auto"
              >
                <IconDownload class="size-4" aria-hidden="true" />
                <span>{{ downloadButtonLabel }}</span>
              </a>
              <button
                v-else
                type="button"
                disabled
                class="btn btn-primary btn-md btn-disabled gap-2 px-6 w-full sm:w-auto"
              >
                <IconDownload class="size-4" aria-hidden="true" />
                <span>{{ t("product.downloadUnavailable") }}</span>
              </button>

              <div
                v-if="match.artifact"
                class="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-faint"
              >
                <span class="chip font-mono text-dim">{{ match.targetLabel }}</span>
                <span
                  v-if="artifactName(match.artifact)"
                  class="max-w-[200px] truncate"
                  :title="artifactName(match.artifact)"
                >
                  {{ artifactName(match.artifact) }}
                </span>
                <a
                  v-if="totalArtifactsCount > 1"
                  href="#channels"
                  class="link-quiet ml-1 underline hover:text-dim"
                >
                  {{ t("product.otherPlatforms") }}
                </a>
              </div>
            </div>
          </header>

          <!-- Previews strip -->
          <div v-if="detail.product.previews?.length" class="mb-8">
            <div class="flex gap-3 overflow-x-auto pb-2">
              <div
                v-for="preview in detail.product.previews"
                :key="preview.id || preview.url"
                class="h-40 w-64 shrink-0 overflow-hidden rounded-box bg-base-200"
              >
                <FileImage :file="preview" :alt="preview.name ?? ''" class="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <!-- Channels & Releases section -->
          <div id="channels" class="space-y-6">
            <ConsolePanel
              :title="t('product.channels')"
              :note="t('product.targets', { n: channels.length })"
            >
              <p v-if="!publishedChannels.length" class="voice py-4 text-[12px]">
                {{ t("product.noReleases") }}
              </p>
              <ul v-else class="flex flex-col gap-2">
                <li
                  v-for="channel in publishedChannels"
                  :key="channel.id"
                  class="rounded-chip bg-raised p-3.5"
                >
                  <div class="flex items-baseline justify-between gap-3">
                    <p class="min-w-0 truncate text-[13px] font-semibold text-base-content">
                      {{ channelLabel(channel) }}
                      <span
                        v-if="channel.name !== channelLabel(channel)"
                        class="ml-1.5 font-mono text-2xs text-faint font-normal"
                      >
                        {{ channel.name }}
                      </span>
                    </p>
                    <p v-if="channel.latest" class="shrink-0 font-mono text-xs text-dim">
                      {{ channel.latest.version }}
                    </p>
                  </div>
                  <p v-if="channel.latest" class="text-2xs text-faint mt-0.5">
                    {{ releaseTitleText(channel.latest) }}
                    <span class="mx-1 text-line">·</span>
                    {{ formatDate(getReleasePublishedAt(channel.latest)) }}
                  </p>
                  <div v-if="channel.latest?.artifacts?.length" class="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <a
                      v-for="artifact in channel.latest.artifacts"
                      :key="artifact.id"
                      :href="artifactUrl(artifact)"
                      class="chip transition-colors"
                      :class="[
                        artifact.expired ? 'text-faint line-through' : '',
                        artifact.id === match.artifact?.id ? 'chip-active' : '',
                      ]"
                      :title="artifactName(artifact)"
                    >
                      {{ targetLabel(artifact.platform, artifact.architecture) }}
                    </a>
                  </div>
                </li>
              </ul>
            </ConsolePanel>

            <!-- Release Notes -->
            <ConsolePanel
              v-if="detail.latest"
              :title="t('product.notes')"
              :note="releaseTitleText(detail.latest)"
            >
              <p class="whitespace-pre-line text-sm text-dim leading-relaxed">
                {{ releaseNotesText(detail.latest) || t("product.noReleases") }}
              </p>
              <ul v-if="detail.latest.artifacts?.length" class="mt-4 space-y-1.5">
                <li
                  v-for="artifact in detail.latest.artifacts"
                  :key="artifact.id"
                  class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xs"
                  :class="artifact.id === match.artifact?.id ? 'bg-base-200/50 -mx-2 px-2 py-1.5 rounded-chip' : ''"
                >
                  <span class="w-28 shrink-0 font-mono text-dim">
                    {{ targetLabel(artifact.platform, artifact.architecture) }}
                  </span>
                  <span class="min-w-0 flex-1 break-all text-faint" :title="artifactName(artifact)">
                    {{ artifactName(artifact) }}
                  </span>
                  <a
                    v-if="artifactUrl(artifact)"
                    :href="artifactUrl(artifact)"
                    class="link-quiet p-1"
                    :title="artifactName(artifact)"
                    :download="artifactName(artifact)"
                  >
                    <IconDownload class="size-3.5" aria-hidden="true" />
                  </a>
                  <span v-else class="text-faint">{{ t("product.expired") }}</span>
                </li>
              </ul>
              <p class="mt-3 text-2xs text-faint">
                {{ t("product.downloads") }}: {{ formatCount(detail.latest.downloadCount ?? detail.latest.download_count) }}
              </p>
            </ConsolePanel>

            <!-- Action Links -->
            <div class="pt-2">
              <NuxtLink
                v-if="detail.publisher?.name"
                :to="`/publishers/${detail.publisher.name}`"
                class="btn btn-quiet btn-xs"
              >
                <span>{{ publisherName }}</span>
                <IconExternalLink class="size-3 ml-1" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </div>
  </NuxtLayout>
</template>
