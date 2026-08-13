<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <!-- Quota Card -->
      <AdminCard v-if="quota" class="mb-5" compact>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold">
            {{
              t("creator.quota.used", {
                used: quota.used,
                total: quota.total,
              })
            }}
          </h3>
        </div>
        <progress
          class="progress progress-primary w-full h-2"
          :value="quota.used"
          :max="quota.total"
        />
      </AdminCard>

      <!-- Managed Publishers -->
      <AdminCard no-padding>
        <div class="p-2">
          <div v-if="isLoading" class="flex justify-center py-10">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else>
            <!-- Publisher List -->
            <div v-if="managedPublishers.length > 0" class="space-y-0.5">
              <NuxtLink
                v-for="pub in managedPublishers"
                :key="pub.id"
                :to="`/creators/${pub.name}`"
                class="flex items-center gap-3 rounded-box px-3 py-2.5 transition-colors duration-150 hover:bg-base-200"
              >
                <div class="avatar shrink-0">
                  <div class="w-10 rounded-full">
                    <img
                      v-if="getFileUrl(pub.picture?.id)"
                      :src="getFileUrl(pub.picture?.id)"
                      :alt="pub.nick"
                    >
                    <div
                      v-else
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold"
                    >
                      {{ pub.nick?.slice(0, 2).toUpperCase() }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-sm">{{ pub.nick }}</div>
                  <div class="text-xs text-base-content/50">
                    @{{ pub.name }}
                  </div>
                </div>
                <IconChevronRight class="w-4 h-4 text-base-content/30" />
              </NuxtLink>
            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center py-10 text-center px-4">
              <IconInfo class="w-10 h-10 text-base-content/20 mb-3" />
              <p class="text-sm text-base-content/55">
                {{ t("creator.noResults") }}
              </p>
            </div>

            <div class="h-2" />

            <!-- Invites -->
            <NuxtLink
              to="/creators"
              class="flex items-center gap-3 rounded-box px-3 py-2.5 transition-colors duration-150 hover:bg-base-200"
            >
              <div class="avatar avatar-placeholder shrink-0">
                <div
                  class="w-10 rounded-full bg-primary/10 text-primary"
                >
                  <IconMail class="w-5 h-5" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-medium text-sm">{{ t("creator.invites.title") }}</div>
                <div class="text-xs text-base-content/50">
                  {{ t("creator.invites.count", { count: invites.length }) }}
                </div>
              </div>
              <IconChevronRight class="w-4 h-4 text-base-content/30" />
            </NuxtLink>

            <!-- Create Publisher -->
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-box px-3 py-2.5 transition-colors duration-150 hover:bg-base-200"
              @click="openCreateModal"
            >
              <div class="avatar avatar-placeholder shrink-0">
                <div class="w-10 rounded-full bg-primary/10 text-primary">
                  <IconPlus class="w-5 h-5" />
                </div>
              </div>
              <div class="text-left min-w-0 flex-1">
                <div class="font-medium text-sm">
                  {{ t("creator.createPublisher") }}
                </div>
              </div>
              <IconChevronRight class="w-4 h-4 text-base-content/30" />
            </button>
          </template>
        </div>
      </AdminCard>

      <!-- Invites Sheet -->
      <AdminCard
        v-if="invites.length > 0"
        class="mt-4"
        :title="t('creator.invites.title')"
        compact
      >
        <div class="space-y-2">
          <div
            v-for="invite in invites"
            :key="invite.id"
            class="flex items-center gap-3 rounded-box bg-base-200 px-3 py-2.5"
          >
            <div class="avatar shrink-0">
              <div class="w-9 rounded-full">
                <img
                  v-if="getFileUrl(invite.publisher?.picture?.id)"
                  :src="getFileUrl(invite.publisher?.picture?.id)"
                  :alt="invite.publisher?.nick"
                >
                <div
                  v-else
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
                >
                  {{ invite.publisher?.nick?.slice(0, 2).toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium text-sm">
                {{ invite.publisher?.nick }}
              </div>
              <div class="text-xs text-base-content/50">
                {{
                  invite.role >= 100
                    ? t("creator.members.owner")
                    : invite.role >= 50
                      ? t("creator.members.moderator")
                      : t("creator.members.member")
                }}
              </div>
            </div>
            <div class="flex gap-1 shrink-0">
              <button
                type="button"
                class="btn btn-success btn-xs"
                @click="handleAcceptInvite(invite.publisher!.name)"
              >
                <IconCheck class="w-3 h-3" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                @click="handleDeclineInvite(invite.publisher!.name)"
              >
                <IconX class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </AdminCard>

      <!-- Create Publisher Drawer -->
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
