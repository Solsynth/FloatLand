<template>
  <NuxtLayout name="app">
    <ConfuseSpinner
      v-if="accountStatus === 'pending'"
      message="Loading account..."
    />

    <!-- Not Found State -->
    <div v-else-if="notFound" class="mx-auto max-w-2xl p-6">
      <div class="card">
        <div class="card-body items-center text-center">
          <IconUserX class="text-base-content/50 w-10 h-10" />
          <h1 class="text-xl font-bold">Account not found</h1>
          <p class="text-base-content/60">
            The profile you requested does not exist.
          </p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mx-auto max-w-2xl p-6">
      <div class="alert alert-error">
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Account Profile -->
    <div v-else-if="account" class="mx-auto max-w-6xl min-w-0">
      <!-- Header Section -->
      <section class="relative overflow-hidden px-4 pt-4 lg:px-6">
        <div
          class="h-40 w-full overflow-hidden rounded-box bg-base-200 sm:h-52"
        >
          <img
            v-if="backgroundUrl"
            :src="backgroundUrl"
            :alt="`${displayName} background`"
            class="h-full w-full object-cover"
          />
        </div>
        <div
          class="mx-auto -mt-12 flex max-w-5xl flex-col gap-3 px-4 pb-4 sm:-mt-20 sm:flex-row sm:items-end sm:gap-4"
        >
          <div class="shrink-0">
            <div v-if="avatarUrl" class="avatar">
              <div
                class="h-24 w-24 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-28 sm:w-28 sm:mb-8"
              >
                <img :src="avatarUrl" :alt="displayName" />
              </div>
            </div>
            <div v-else class="avatar avatar-placeholder">
              <div
                class="h-24 w-24 rounded-box bg-primary text-primary-content ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-28 sm:w-28 sm:mb-8"
              >
                <span class="text-2xl font-semibold">
                  {{ getInitials(displayName) }}
                </span>
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1 sm:pt-24">
            <div class="flex flex-wrap items-center gap-2 min-w-0">
              <h1 class="truncate text-2xl font-black sm:text-3xl">
                {{ displayName }}
              </h1>
              <span
                v-if="account.profile?.verification"
                class="badge gap-1 badge-primary"
              >
                <IconShieldCheck class="w-3 h-3" />
                {{ account.profile.verification.title || "Verified" }}
              </span>
            </div>
            <p class="truncate text-sm text-base-content/60">
              @{{ account.name }}
            </p>
            <ActivityPresence :account="account" class="mt-2" />
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <template v-if="isAuthenticated && !isCurrentUser">
              <button
                v-if="relationship?.isFriend"
                class="btn btn-primary gap-2"
                disabled
              >
                <IconUserCheck class="w-4 h-4" />
                Friends
              </button>
              <button
                v-else
                class="btn btn-primary gap-2"
                :disabled="isActionLoading"
                @click="addFriend"
              >
                <IconLoader
                  v-if="isActionLoading"
                  class="w-4 h-4 animate-spin"
                />
                <IconUserPlus v-else class="w-4 h-4" />
                Add Friend
              </button>
              <button
                v-if="relationship?.isBlocked"
                class="btn bg-base-200 gap-2"
                :disabled="isActionLoading"
                @click="unblock"
              >
                <IconUserX class="w-4 h-4" />
                Unblock
              </button>
              <button
                v-else
                class="btn btn-ghost gap-2 text-error"
                :disabled="isActionLoading"
                @click="block"
              >
                <IconBan class="w-4 h-4" />
                Block
              </button>
              <button
                class="btn btn-primary gap-2"
                :disabled="isActionLoading"
                @click="sendMessage"
              >
                <IconMessageCircle class="w-4 h-4" />
                Message
              </button>
            </template>

            <template v-if="isCurrentUser">
              <NuxtLink
                to="/accounts/me/settings"
                class="btn btn-primary gap-2"
              >
                <IconSettings class="w-4 h-4" />
                Edit Profile
              </NuxtLink>
            </template>

            <button class="btn btn-ghost btn-square bg-base-200" @click="shareProfile">
              <IconShare2 class="w-4 h-4" />
            </button>

            <button
              v-if="isAuthenticated && !isCurrentUser"
              class="btn btn-ghost btn-square text-error"
              @click="reportUser"
            >
              <IconFlag class="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <!-- Two-column body: board/activity (main) + bio sidebar on desktop -->
      <div
        class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-4 lg:gap-6 px-4 lg:px-6 pb-8 items-start"
      >
        <!-- Main column: tabs + board / activity -->
        <div class="min-w-0 order-2 lg:order-1 space-y-3">
          <div role="tablist" class="tabs tabs-box w-fit">
            <button
              role="tab"
              class="tab"
              :class="{ 'tab-active': activeTab === 'board' }"
              @click="activeTab = 'board'"
            >
              Board
            </button>
            <button
              role="tab"
              class="tab"
              :class="{ 'tab-active': activeTab === 'activity' }"
              @click="activeTab = 'activity'"
            >
              Activity
            </button>
          </div>

          <!-- Board tab -->
          <div v-show="activeTab === 'board'" class="space-y-3 w-full min-w-0">
            <div
              v-if="boardLoading"
              class="flex items-center gap-2 text-sm text-base-content/60 py-4"
            >
              <IconLoader class="w-3.5 h-3.5 animate-spin" />
              <span>Loading board...</span>
            </div>
            <AccountBoard
              v-else
              :account="account"
              :items="boardItems"
              :uname="accountName"
              :publishers="publishers"
              :badge-manifest="badgeManifestStore.manifest"
            />
          </div>

          <!-- Activity timeline tab -->
          <section v-show="activeTab === 'activity'" class="space-y-3 w-full min-w-0">
            <div
              v-if="isLoadingTimeline && timelineItems.length === 0"
              class="flex items-center gap-2 text-sm text-base-content/60"
            >
              <IconLoader class="w-3.5 h-3.5 animate-spin" />
              <span>Loading activity...</span>
            </div>

            <div
              v-if="timelineItems.length > 0"
              class="space-y-2"
              :class="isLoadingTimeline ? 'opacity-60' : 'opacity-100'"
            >
              <AccountTimelineItem
                v-for="item in groupedTimelineItems"
                :key="item.id"
                :item="item.item"
                :duplicate-count="item.count"
              />
            </div>

            <div v-if="timelineItems.length > 0" class="py-2 text-center">
              <button
                v-if="hasMoreTimeline"
                class="btn btn-ghost btn-sm bg-base-200"
                :disabled="isLoadingTimeline"
                @click="loadMoreTimeline"
              >
                <IconLoader
                  v-if="isLoadingTimeline"
                  class="w-4 h-4 animate-spin"
                />
                <span>Load more</span>
              </button>
              <p v-else class="text-xs text-base-content/50">No more activity</p>
            </div>

            <div
              v-else-if="!isLoadingTimeline"
              class="py-8 text-center text-sm text-base-content/50"
            >
              No activity yet.
            </div>
          </section>
        </div>

        <!-- Sidebar: bio + meta (right on desktop, above content on mobile) -->
        <aside
          class="order-1 lg:order-2 space-y-3 w-full min-w-0 lg:sticky lg:top-20 lg:self-start"
        >
          <div v-if="account.profile?.bio" class="card">
            <div class="card-body p-4">
              <div class="flex items-start justify-between gap-2">
                <template v-if="isBioExpanded">
                  <div
                    class="prose prose-sm max-w-none break-words flex-1 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                    v-html="bioHtml"
                    @click="handleMarkdownClick"
                  />
                </template>
                <p v-else class="text-sm text-base-content/80 flex-1">
                  {{ bioFirstLine }}
                </p>
                <button
                  class="btn btn-ghost btn-xs text-primary shrink-0"
                  @click="isBioExpanded = !isBioExpanded"
                >
                  {{ isBioExpanded ? "Collapse" : "Expand" }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="botDeveloper?.publisher" class="card bg-base-200">
            <div class="card-body p-4">
              <div class="flex items-center gap-2">
                <IconBot class="w-4 h-4 text-primary shrink-0" />
                <span class="text-sm">
                  Automated by
                  <NuxtLink
                    :to="`/publishers/${botDeveloper.publisher.name}`"
                    class="font-semibold link link-hover"
                  >
                    {{
                      botDeveloper.publisher.nick || botDeveloper.publisher.name
                    }}
                  </NuxtLink>
                </span>
              </div>
            </div>
          </div>

          <div v-if="punishment" class="card bg-error/5 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-box bg-error/10 flex items-center justify-center shrink-0"
                >
                  <IconAlertTriangle class="w-5 h-5 text-error" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-semibold">Account Restrictions</h3>
                  <p class="text-xs text-base-content/50">
                    This account has active restrictions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type {
  SnAccount,
  SnAccountPunishment,
  SnAccountTimelineItem,
  AccountBoardItem,
} from "~/types/auth";
import type { Publisher } from "~/types/post";
import {
  fetchAccount,
  fetchAccountActivityTimeline,
  fetchAccountRelationship,
  addAccountAsFriend,
  blockAccount,
  unblockAccount,
  fetchAccountPunishment,
  fetchAccountBotDeveloper,
  fetchPublicAccountBoard,
  fetchAccountPublishers,
  defaultAccountBoard,
} from "~/utils/api";
import { getFileUrl } from "~/utils/files";
import { renderMarkdown } from "~/utils/markdown";

const route = useRoute();
const auth = useAuth();
const { notify, confirm } = useAlert();
const accountName = computed(() => route.params.name as string);

const account = ref<SnAccount | null>(null);
const publishers = ref<Publisher[]>([]);
const boardItems = ref<AccountBoardItem[]>(defaultAccountBoard());
const boardLoading = ref(true);
const timelineItems = ref<SnAccountTimelineItem[]>([]);
const relationship = ref<{
  status: number;
  isFriend: boolean;
  isBlocked: boolean;
} | null>(null);
const notFound = ref(false);
const error = ref<string | null>(null);
const isLoadingTimeline = ref(false);
const isActionLoading = ref(false);
const timelineOffset = ref(0);
const hasMoreTimeline = ref(false);
const isBioExpanded = ref(false);
const botDeveloper = ref<{
  publisher?: { name: string; nick?: string };
} | null>(null);
const punishment = ref<SnAccountPunishment | null>(null);
const badgeManifestStore = useBadgeManifestStore();
const activeTab = ref<"board" | "activity">("board");

const accountStatus = computed(() =>
  account.value ? "success" : error.value ? "error" : "pending",
);
const isAuthenticated = computed(() => auth.isAuthenticated.value);
const isCurrentUser = computed(() => {
  if (!auth.user.value || !account.value) return false;
  return auth.user.value.id === account.value.id;
});
const displayName = computed(
  () => account.value?.nick || account.value?.name || "Unknown",
);
const avatarUrl = computed(() =>
  getFileUrl(account.value?.profile?.picture?.id),
);
const backgroundUrl = computed(() =>
  getFileUrl(account.value?.profile?.background?.id),
);
const bioHtml = computed(() => {
  if (!account.value?.profile?.bio) return "";
  return renderMarkdown(account.value.profile.bio);
});
const bioFirstLine = computed(() => {
  if (!account.value?.profile?.bio) return "No bio yet.";
  const lines = account.value.profile.bio.split("\n");
  return lines[0]?.trim() || "No bio yet.";
});

const {
  data: accountData,
  error: fetchError,
} = await useAsyncData(
  `account-${accountName.value}`,
  () => fetchAccount(accountName.value),
  { watch: [accountName] },
);

watch(
  accountData,
  (data) => {
    if (data) {
      account.value = data;
      notFound.value = false;
      error.value = null;
    }
  },
  { immediate: true },
);

watch(
  fetchError,
  (err) => {
    if (err) {
      if (err.message?.includes("404")) {
        notFound.value = true;
      } else {
        error.value = err.message || "Failed to load account";
      }
    }
  },
  { immediate: true },
);

const seoTitle = computed(() =>
  account.value ? `${displayName.value} (@${account.value.name})` : "",
);
const seoDescription = computed(
  () =>
    account.value?.profile?.bio ||
    `View profile for @${account.value?.name}`,
);
const seoImage = computed(
  () => getFileUrl(account.value?.profile?.picture?.id) || undefined,
);
const seoUrl = computed(() => `https://solian.app/@${account.value?.name}`);

defineOgImage("AccountOgImage", {
  accountName: computed(() => route.params.name as string),
});

useSolarSeo({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  image: () => seoImage.value,
  url: () => seoUrl.value,
  type: "profile",
  breadcrumbs: () => [
    { name: "Home", item: "https://solian.app" },
    { name: seoTitle.value, item: seoUrl.value },
  ],
});

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
}

function handleMarkdownClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest(".mention-chip")) {
    e.preventDefault();
    const href = target.closest("a")?.getAttribute("href");
    if (href) navigateTo(href);
    return;
  }
  if (target.classList.contains("spoiler")) {
    target.classList.toggle("revealed");
  }
}

const groupedTimelineItems = computed(() => {
  const items = timelineItems.value;
  if (items.length === 0) return [];

  const grouped: {
    id: string;
    item: SnAccountTimelineItem;
    count: number;
  }[] = [];
  let currentGroup: { item: SnAccountTimelineItem; count: number } | null =
    null;

  for (const item of items) {
    if (!currentGroup || !canGroupItems(currentGroup.item, item)) {
      currentGroup = { item, count: 1 };
      grouped.push({ id: item.id, item, count: 1 });
    } else {
      currentGroup.count++;
      const lastEntry = grouped[grouped.length - 1];
      if (lastEntry) lastEntry.count = currentGroup.count;
    }
  }

  return grouped;
});

function canGroupItems(
  a: SnAccountTimelineItem,
  b: SnAccountTimelineItem,
): boolean {
  if (a.eventType !== b.eventType) return false;
  if (a.eventType === 0) return false;
  if (a.eventType === 1 && a.activity && b.activity) {
    if (
      a.activity.manualId === "spotify" ||
      b.activity.manualId === "spotify"
    )
      return false;
    if (
      a.activity.manualId !== b.activity.manualId ||
      a.activity.type !== b.activity.type
    )
      return false;
    if (
      a.activity.manualId === "steam" &&
      a.activity.meta &&
      b.activity.meta
    ) {
      return a.activity.meta.game_id === b.activity.meta.game_id;
    }
    return a.activity.title === b.activity.title;
  }
  return false;
}

async function loadTimeline() {
  if (!accountName.value) return;
  isLoadingTimeline.value = true;
  try {
    const result = await fetchAccountActivityTimeline(
      accountName.value,
      20,
      timelineOffset.value,
    );
    if (timelineOffset.value === 0) {
      timelineItems.value = result.items;
    } else {
      timelineItems.value.push(...result.items);
    }
    timelineOffset.value += result.items.length;
    hasMoreTimeline.value = timelineItems.value.length < result.total;
  } catch (err) {
    console.error("Failed to load timeline:", err);
  } finally {
    isLoadingTimeline.value = false;
  }
}

async function loadMoreTimeline() {
  await loadTimeline();
}

async function loadRelationship() {
  if (!account.value?.id || isCurrentUser.value) return;
  try {
    relationship.value = await fetchAccountRelationship(account.value.id);
  } catch {
    relationship.value = null;
  }
}

async function loadBotDeveloper() {
  if (!account.value?.automatedId) {
    botDeveloper.value = null;
    return;
  }
  try {
    botDeveloper.value = await fetchAccountBotDeveloper(
      account.value.automatedId,
    );
  } catch {
    botDeveloper.value = null;
  }
}

async function loadPunishment() {
  if (!accountName.value) return;
  try {
    punishment.value = await fetchAccountPunishment(accountName.value);
  } catch {
    punishment.value = null;
  }
}

async function loadBoard() {
  if (!accountName.value) return;
  boardLoading.value = true;
  try {
    boardItems.value = await fetchPublicAccountBoard(accountName.value);
  } catch {
    boardItems.value = defaultAccountBoard();
  } finally {
    boardLoading.value = false;
  }
}

async function loadPublishers() {
  if (!account.value?.id) return;
  try {
    publishers.value = await fetchAccountPublishers(account.value.id);
  } catch {
    publishers.value = [];
  }
}

async function addFriend() {
  if (!account.value?.id) return;
  isActionLoading.value = true;
  try {
    await addAccountAsFriend(account.value.id);
    await loadRelationship();
  } catch (err) {
    await notify(err instanceof Error ? err.message : "Failed to add friend");
  } finally {
    isActionLoading.value = false;
  }
}

async function block() {
  if (!account.value?.id) return;
  if (!(await confirm("Confirm", "Block this user?"))) return;
  isActionLoading.value = true;
  try {
    await blockAccount(account.value.id);
    await loadRelationship();
  } catch (err) {
    await notify(err instanceof Error ? err.message : "Failed to block");
  } finally {
    isActionLoading.value = false;
  }
}

async function unblock() {
  if (!account.value?.id) return;
  isActionLoading.value = true;
  try {
    await unblockAccount(account.value.id);
    await loadRelationship();
  } catch (err) {
    await notify(err instanceof Error ? err.message : "Failed to unblock");
  } finally {
    isActionLoading.value = false;
  }
}

async function sendMessage() {
  if (!account.value?.id) return;
  isActionLoading.value = true;
  try {
    await notify("Direct message feature coming soon!");
  } finally {
    isActionLoading.value = false;
  }
}

async function shareProfile() {
  if (account.value?.name) {
    const url = `https://solian.app/@${account.value.name}`;
    if (navigator.share) {
      await navigator.share({ title: displayName.value, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }
}

async function reportUser() {
  await notify("Report feature coming soon!");
}

// Lazy-load timeline when switching to activity tab
watch(activeTab, (tab) => {
  if (tab === "activity" && timelineItems.value.length === 0) {
    loadTimeline();
  }
});

onMounted(() => {
  badgeManifestStore.fetchManifest().catch(() => {});
});

// Reload board when account name changes
watch(
  accountName,
  async () => {
    timelineItems.value = [];
    timelineOffset.value = 0;
    activeTab.value = "board";
    try {
      await Promise.all([loadBoard(), loadPunishment()]);
    } catch (err) {
      console.error("Failed to load board:", err);
    }
  },
  { immediate: true },
);

// Publishers / relationship / bot info depend on loaded account
watch(
  () => account.value?.id,
  async (id) => {
    if (!id) return;
    try {
      await Promise.all([
        loadPublishers(),
        loadRelationship(),
        loadBotDeveloper(),
      ]);
    } catch (err) {
      console.error("Failed to load account extras:", err);
    }
  },
  { immediate: true },
);
</script>
