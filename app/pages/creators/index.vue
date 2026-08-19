<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-5xl space-y-5">
      <header class="relative isolate overflow-hidden rounded-box bg-base-100 px-5 py-6 shadow-sm sm:px-7">
        <div class="absolute inset-y-0 right-0 -z-10 w-1/3 bg-primary/[0.06]" aria-hidden="true">
          <div class="absolute inset-y-0 left-0 w-px bg-primary/15" />
          <div class="absolute inset-y-0 left-5 w-px bg-primary/10" />
          <div class="absolute inset-y-0 left-10 w-px bg-primary/10" />
        </div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">{{ t("creator.studio") }}</p>
        <div class="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-2xl font-black tracking-tight sm:text-3xl">{{ t("creator.title") }}</h1>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-base-content/60">
              {{ t("creator.selectPublisher") }}
            </p>
          </div>
          <div class="flex items-end gap-5">
            <div class="text-right">
              <div class="text-3xl font-black tabular-nums text-primary">{{ managedPublishers.length }}</div>
              <div class="text-[11px] font-semibold uppercase tracking-wide text-base-content/40">Publishers</div>
            </div>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              @click="openCreateModal"
            >
              <IconPlus class="h-4 w-4" aria-hidden="true" />
              {{ t("creator.createPublisher") }}
            </button>
          </div>
        </div>
      </header>

      <AdminCard v-if="quota" compact>
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{{ t("creator.quota.title") }}</p>
            <h2 class="mt-1 text-sm font-semibold">
              {{ t("creator.quota.used", { used: quota.used, total: quota.total }) }}
            </h2>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs"
            :aria-expanded="showQuotaInfo"
            @click="showQuotaInfo = !showQuotaInfo"
          >
            {{ showQuotaInfo ? t("common.close") : t("common.viewAll") }}
          </button>
        </div>
        <progress
          class="progress progress-primary mt-3 h-2 w-full"
          :value="quota.used"
          :max="quota.total"
        />
        <p v-if="showQuotaInfo" class="mt-2 text-xs leading-relaxed text-base-content/55">
          {{ t("creator.quota.info") }}
        </p>
      </AdminCard>

      <section aria-labelledby="managed-publishers-title" class="overflow-hidden rounded-box bg-base-100 shadow-sm">
        <div class="border-b border-base-300/60 px-5 py-4">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{{ t("creator.studio") }}</p>
          <h2 id="managed-publishers-title" class="mt-1 text-lg font-bold">{{ t("creator.selectPublisher") }}</h2>
        </div>

        <div v-if="isLoading" class="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2" aria-busy="true" :aria-label="t('common.loading')">
          <div v-for="item in 4" :key="item" class="flex items-center gap-3 rounded-box p-3">
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
            :to="`/creators/${encodeURIComponent(pub.name)}`"
            class="group flex items-center gap-3 rounded-box border border-base-300/60 p-3 outline-offset-2 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div class="avatar shrink-0">
              <div class="w-10 rounded-full">
                <img
                  v-if="pub.picture?.id"
                  :src="getFileUrl(pub.picture.id)!"
                  :alt="pub.nick"
                  loading="lazy"
                  decoding="async"
                >
                <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
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
          <IconInfo class="mb-3 h-10 w-10 text-base-content/20" aria-hidden="true" />
          <p class="max-w-sm text-sm leading-relaxed text-base-content/55">{{ t("creator.noResults") }}</p>
        </div>
      </section>

      <AdminCard v-if="invites.length > 0" :title="t('creator.invites.title')" compact>
        <div class="space-y-2">
          <div
            v-for="invite in invites"
            :key="invite.id"
            class="flex items-center gap-3 rounded-box bg-base-200 px-3 py-2.5"
          >
            <div class="avatar shrink-0">
              <div class="w-9 rounded-full">
                <img
                  v-if="invite.publisher?.picture?.id"
                  :src="getFileUrl(invite.publisher.picture.id)!"
                  :alt="invite.publisher?.nick"
                  loading="lazy"
                  decoding="async"
                >
                <div v-else class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {{ invite.publisher?.nick?.slice(0, 2).toUpperCase() || '?' }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-bold">{{ invite.publisher?.nick }}</div>
              <div class="text-xs text-base-content/50">
                {{ invite.role >= 100 ? t("creator.members.owner") : invite.role >= 50 ? t("creator.members.moderator") : t("creator.members.member") }}
              </div>
            </div>
            <div class="flex shrink-0 gap-1">
              <button
                type="button"
                class="btn btn-success btn-square btn-xs"
                :aria-label="t('common.confirm')"
                @click="handleAcceptInvite(invite.publisher!.name)"
              >
                <IconCheck class="h-3 w-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-square btn-xs"
                :aria-label="t('common.cancel')"
                @click="handleDeclineInvite(invite.publisher!.name)"
              >
                <IconX class="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminDrawer
        :open="createModalOpen"
        :title="t('creator.createPublisher')"
        @update:open="createModalOpen = $event"
      >
        <PublisherForm
          @close="closeCreateModal"
          @created="handlePublisherCreated"
        />
      </AdminDrawer>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconInfo,
  IconChevronRight,
  IconMail,
  IconPlus,
  IconCheck,
  IconX,
} from "#components";
import { getFileUrl } from "~/utils/files";
import {
  fetchPublisherQuota,
  acceptInvite,
  declineInvite,
} from "~/utils/creator";
import type { PublisherQuotaInfo } from "~/types/creator";

definePageMeta({ middleware: "creator" });

const { t } = useI18n();
const creator = useCreator();
const { managedPublishers, invites, isLoading } = creator;

const quota = ref<PublisherQuotaInfo | null>(null);
const showQuotaInfo = ref(false);
const createModalOpen = ref(false);

defineOgImage("UniOgImage", { title: t("creator.title") });

useSolarSeo({
  title: t("creator.title"),
  breadcrumbs: [
    { name: "Home", item: "https://solian.app" },
    { name: "Creators", item: "https://solian.app/creators" },
  ],
});

function openCreateModal() {
  createModalOpen.value = true;
}

function closeCreateModal() {
  createModalOpen.value = false;
}

onMounted(async () => {
  await Promise.all([creator.loadManagedPublishers(), creator.loadInvites()]);
  try {
    quota.value = await fetchPublisherQuota();
  } catch {
    // ignore
  }
});

async function handleAcceptInvite(pubName: string) {
  try {
    await acceptInvite(pubName);
    await Promise.all([creator.loadManagedPublishers(), creator.loadInvites()]);
  } catch (e) {
    console.error(e);
  }
}

async function handleDeclineInvite(pubName: string) {
  try {
    await declineInvite(pubName);
    await creator.loadInvites();
  } catch (e) {
    console.error(e);
  }
}

function handlePublisherCreated() {
  closeCreateModal();
  creator.loadManagedPublishers();
}
</script>
