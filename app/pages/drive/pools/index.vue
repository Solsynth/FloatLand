<template>
  <NuxtLayout name="drive">
    <div class="min-h-full px-5 py-6 sm:px-8 lg:px-10">
      <div class="mx-auto max-w-5xl">
        <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
              {{ t("drive.storageManagement") }}
            </p>
            <h1 class="text-2xl font-semibold tracking-tight text-base-content sm:text-3xl">
              {{ t("drive.pools") }}
            </h1>
            <p class="mt-2 max-w-xl text-sm leading-6 text-base-content/55">
              {{ t("drive.poolsDescription") }}
            </p>
          </div>
          <NuxtLink to="/drive/nodes" class="btn btn-primary btn-sm rounded-full px-4">
            <IconServer class="h-4 w-4" />
            {{ t("drive.manageNodes") }}
          </NuxtLink>
        </header>

        <div v-if="loading" class="flex items-center justify-center rounded-3xl border border-base-300/70 bg-base-100/70 py-24">
          <span class="loading loading-spinner loading-md text-primary" />
        </div>

        <div v-else-if="error" class="rounded-3xl border border-error/20 bg-error/5 px-6 py-10 text-center">
          <p class="text-sm text-error">{{ error }}</p>
          <button class="btn btn-ghost btn-sm mt-4 rounded-full" @click="loadPools">
            <IconRefreshCw class="h-4 w-4" />
            {{ t("common.retry") }}
          </button>
        </div>

        <div v-else-if="pools.length === 0" class="rounded-3xl border border-dashed border-base-300 bg-base-100/50 px-6 py-16 text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IconDatabase class="h-7 w-7" />
          </div>
          <h2 class="mt-5 text-lg font-semibold">{{ t("drive.noPools") }}</h2>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-base-content/55">
            {{ t("drive.noPoolsHint") }}
          </p>
          <NuxtLink to="/drive/nodes" class="btn btn-primary btn-sm mt-6 rounded-full px-5">
            <IconPlus class="h-4 w-4" />
            {{ t("drive.addNode") }}
          </NuxtLink>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <article
            v-for="pool in pools"
            :key="pool.id"
            class="group rounded-3xl border border-base-300/70 bg-base-100 p-5 transition-colors hover:border-primary/30"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <IconDatabase class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <h2 class="truncate font-semibold">{{ pool.name }}</h2>
                  <p v-if="pool.description" class="mt-0.5 truncate text-xs text-base-content/45">
                    {{ pool.description }}
                  </p>
                </div>
              </div>
              <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-success" :title="t('drive.online')" />
            </div>

            <div class="mt-6 space-y-2 border-t border-base-200 pt-4 text-xs text-base-content/50">
              <div class="flex items-center justify-between gap-4">
                <span>{{ t("drive.poolId") }}</span>
                <span class="max-w-[14rem] truncate font-mono text-[11px] text-base-content/65">{{ pool.id }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span>{{ t("drive.createdAt") }}</span>
                <span class="text-base-content/65">{{ formatDate(pool.createdAt) }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { fetchDrivePools } from "~/utils/api";
import type { SnFilePool } from "~/types/drive";

const { t } = useI18n();
const { $toast } = useNuxtApp();

const pools = ref<SnFilePool[]>([]);
const loading = ref(true);
const error = ref("");

useSolarSeo({
  title: t("drive.pools"),
  description: t("drive.poolsDescription"),
});

definePageMeta({ middleware: "auth" });

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

async function loadPools() {
  loading.value = true;
  error.value = "";
  try {
    pools.value = await fetchDrivePools();
  } catch {
    error.value = t("drive.loadPoolsFailed");
    $toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPools);
</script>
