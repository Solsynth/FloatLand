<template>
  <NuxtLayout name="merchant">
    <div class="mx-auto max-w-4xl">
      <!-- Merchant Publishers Card -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <div v-if="isLoading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else>
            <!-- Publisher List -->
            <div v-if="managedPublishers.length > 0" class="space-y-1">
              <NuxtLink
                v-for="pub in managedPublishers"
                :key="pub.id"
                :to="`/merchants/${pub.name}`"
                class="flex items-center gap-4 rounded-box p-3 transition-colors hover:bg-base-200"
              >
                <div class="avatar">
                  <div class="w-10 rounded-full">
                    <img
                      v-if="getFileUrl(pub.picture?.id)"
                      :src="getFileUrl(pub.picture?.id)"
                      :alt="pub.nick"
                    />
                    <div
                      v-else
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-content text-sm font-bold"
                    >
                      {{ pub.nick?.slice(0, 2).toUpperCase() }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{{ pub.nick }}</div>
                  <div class="text-sm text-base-content/50">@{{ pub.name }}</div>
                </div>
                <IconChevronRight class="w-5 h-5 text-base-content/30" />
              </NuxtLink>
            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center py-8 text-center">
              <IconInfo class="w-12 h-12 text-base-content/20 mb-4" />
              <p class="text-base-content/60 mb-4">{{ t('merchant.noPublishers') }}</p>
            </div>
          </template>
        </div>
      </div>
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
