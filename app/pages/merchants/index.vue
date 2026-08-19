<template>
  <NuxtLayout name="merchant">
    <div class="mx-auto max-w-5xl space-y-5">
      <header class="relative isolate overflow-hidden rounded-box bg-base-100 px-5 py-6 shadow-sm sm:px-7">
        <div class="absolute inset-y-0 right-0 -z-10 w-1/3 bg-primary/[0.06]" aria-hidden="true">
          <div class="absolute inset-y-0 left-0 w-px bg-primary/15" />
          <div class="absolute inset-y-0 left-5 w-px bg-primary/10" />
          <div class="absolute inset-y-0 left-10 w-px bg-primary/10" />
        </div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">{{ t('merchant.title') }}</p>
        <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-2xl font-black tracking-tight sm:text-3xl">{{ t('merchant.title') }}</h1>
            <p class="mt-2 text-sm text-base-content/60">{{ t('merchant.selectPublisher') }}</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-black tabular-nums text-primary">{{ managedPublishers.length }}</div>
            <div class="text-[11px] font-semibold uppercase tracking-wide text-base-content/40">Merchants</div>
          </div>
        </div>
      </header>

      <section aria-labelledby="merchant-publishers-title" class="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <div class="border-b border-base-300/60 px-5 py-4">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{{ t('merchant.title') }}</p>
          <h2 id="merchant-publishers-title" class="mt-1 text-lg font-bold">{{ t('merchant.selectPublisher') }}</h2>
        </div>
        <div v-if="isLoading" class="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2" aria-busy="true" :aria-label="t('common.loading')">
          <div v-for="item in 4" :key="item" class="flex items-center gap-4 rounded-box p-3">
            <div class="skeleton h-10 w-10 shrink-0 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="skeleton h-4 w-32" />
              <div class="skeleton h-3 w-24" />
            </div>
            <div class="skeleton h-4 w-4 rounded-full" />
          </div>
        </div>
        <div v-else-if="managedPublishers.length > 0" class="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
          <NuxtLink
            v-for="pub in managedPublishers"
            :key="pub.id"
            :to="`/merchants/${encodeURIComponent(pub.name)}`"
            class="group flex items-center gap-4 rounded-box border border-base-300/60 p-3 outline-offset-2 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div class="avatar shrink-0">
              <div class="w-10 rounded-full">
                <img v-if="pub.picture?.id" :src="getFileUrl(pub.picture.id)!" :alt="pub.nick" loading="lazy" decoding="async">
                <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
                  {{ pub.nick?.slice(0, 2).toUpperCase() || '?' }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-bold">{{ pub.nick }}</div>
              <div class="truncate text-xs text-base-content/50">@{{ pub.name }}</div>
            </div>
            <IconChevronRight class="h-4 w-4 shrink-0 text-base-content/25 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
        <div v-else class="flex flex-col items-center px-5 py-12 text-center">
          <IconInfo class="mb-4 h-10 w-10 text-base-content/20" aria-hidden="true" />
          <p class="text-sm text-base-content/55">{{ t('merchant.noPublishers') }}</p>
        </div>
      </section>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconInfo,
  IconChevronRight,
} from "#components";
import { getFileUrl } from "~/utils/files";

definePageMeta({ middleware: "merchant" });

const { t } = useI18n();
const merchant = useMerchant();
const { managedPublishers, isLoading } = merchant;

defineOgImage("UniOgImage", { title: t("merchant.title") });

useSolarSeo({
  title: t("merchant.title"),
  breadcrumbs: [
    { name: "Home", item: "https://solian.app" },
    { name: "Merchants", item: "https://solian.app/merchants" },
  ],
});

onMounted(async () => {
  await merchant.loadManagedPublishers();
});
</script>
