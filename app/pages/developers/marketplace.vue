<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-5xl">
      <div class="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 class="text-2xl font-bold">Plugin Marketplace</h2>
          <p class="text-sm text-base-content/50">
            Production plugins published by developers
          </p>
        </div>
        <div class="join">
          <input
            v-model="search"
            class="input input-bordered join-item"
            placeholder="Search plugins"
            @keyup.enter="load"
          /><button class="btn btn-primary join-item" @click="load">
            Search
          </button>
        </div>
      </div>
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg" />
      </div>
      <div
        v-else-if="plugins.length"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <NuxtLink
          v-for="plugin in plugins"
          :key="plugin.id"
          :to="`/developers/marketplace/${plugin.slug}`"
          class="card bg-base-100 shadow-sm hover:shadow-md"
          ><div class="card-body">
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-content"
              >
                <IconPuzzle class="w-6 h-6" />
              </div>
              <div class="min-w-0">
                <h3 class="font-bold truncate">
                  {{ plugin.name || plugin.manifest?.name || plugin.slug }}
                </h3>
                <p class="text-xs text-base-content/50">
                  {{
                    plugin.publisher?.nick ||
                    plugin.author ||
                    "Unknown publisher"
                  }}
                </p>
              </div>
            </div>
            <p class="text-sm text-base-content/70 mt-3">
              {{
                plugin.description ||
                plugin.manifest?.description ||
                "No description"
              }}
            </p>
            <div class="mt-3 text-xs text-base-content/50">
              {{ plugin.slug }} · v{{
                plugin.version || plugin.manifest?.version || "unversioned"
              }}
            </div>
          </div></NuxtLink
        >
      </div>
      <div v-else class="text-center py-12 text-base-content/50">
        No production plugins found.
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Puzzle as IconPuzzle } from "@lucide/vue";
import type { MarketplacePlugin } from "~/types/developer";
import { fetchMarketplacePlugins } from "~/utils/developer";
definePageMeta({ middleware: "developer" });
const search = ref("");
const plugins = ref<MarketplacePlugin[]>([]);
const loading = ref(false);
async function load() {
  loading.value = true;
  try {
    plugins.value = (
      await fetchMarketplacePlugins({ take: 20, search: search.value })
    ).items;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>
