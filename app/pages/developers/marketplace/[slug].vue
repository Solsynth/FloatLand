<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-3xl">
      <NuxtLink to="/developers/marketplace" class="btn btn-ghost btn-sm mb-4"
        ><IconArrowLeft class="w-4 h-4" /> Marketplace</NuxtLink
      >
      <div v-if="plugin" class="card bg-base-100 shadow-sm">
        <div class="card-body p-6">
          <div class="flex items-start gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-content"
            >
              <IconPuzzle class="w-7 h-7" />
            </div>
            <div>
              <h1 class="text-2xl font-bold">
                {{ plugin.name || plugin.manifest?.name || plugin.slug }}
              </h1>
              <p class="text-base-content/50">
                {{
                  plugin.publisher?.nick ||
                  plugin.author ||
                  "Unknown publisher"
                }}
              </p>
            </div>
          </div>
          <p class="mt-5 text-base-content/80">
            {{ plugin.description || plugin.manifest?.description }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <span class="badge">{{ plugin.slug }}</span
            ><span class="badge"
              >v{{
                plugin.version || plugin.manifest?.version || "unversioned"
              }}</span
            >
          </div>
          <a
            v-if="plugin.packageUrl"
            :href="plugin.packageUrl"
            class="btn btn-primary mt-6"
            target="_blank"
            rel="noopener"
            >Download package</a
          <a
            v-if="plugin.homepage || plugin.manifest?.homepage"
            :href="plugin.homepage || plugin.manifest?.homepage"
            class="btn btn-ghost mt-2"
            target="_blank"
            rel="noopener"
            >Homepage</a
          >
        </div>
      </div>
      <div v-else-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg" />
      </div>
      <p v-else class="text-center py-12 text-base-content/50">
        Plugin not found.
      </p>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowLeft as IconArrowLeft, Puzzle as IconPuzzle } from "@lucide/vue";
import type { MarketplacePlugin } from "~/types/developer";
import { fetchMarketplacePlugin } from "~/utils/developer";
definePageMeta({ middleware: "developer" });
const route = useRoute();
const plugin = ref<MarketplacePlugin | null>(null);
const loading = ref(true);
async function load() {
  loading.value = true;
  try {
    plugin.value = await fetchMarketplacePlugin(route.params.slug as string);
  } catch {
    plugin.value = null;
  } finally {
    loading.value = false;
  }
}
watch(() => route.params.slug, load, { immediate: true });
</script>
