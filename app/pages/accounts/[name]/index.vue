<template>
  <NuxtLayout name="app">
    <ConsolePanel v-if="accountStatus === 'pending'" flush>
      <LoadingSkeleton variant="feed" :rows="3" />
    </ConsolePanel>

    <!-- Not Found State -->
    <div v-else-if="notFound" class="mx-auto max-w-2xl p-6">
      <div class="plate flex flex-col items-center gap-2 p-8 text-center">
          <IconUserX class="text-dim w-10 h-10" />
          <h1 class="text-xl font-bold">Account not found</h1>
          <p class="voice text-[13px]">
            The profile you requested does not exist.
          </p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mx-auto max-w-2xl p-6">
      <div class="alert alert-error">
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Account Profile -->
    <div v-else-if="account" class="mx-auto min-w-0">
      <!-- Header Section -->
      <section class="rise rounded-card bg-raised">
        <div
          class="relative h-40 w-full overflow-hidden rounded-t-card bg-base-200 sm:h-56"
        >
          <FileImage
            v-if="backgroundUrl"
            :file="backgroundUrl"
            :alt="`${displayName} background`"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="absolute inset-0 grid place-items-center overflow-hidden bg-tint"
          >
            <span
              class="select-none text-[clamp(96px,14vw,150px)] font-extrabold leading-none tracking-[-0.07em] text-primary/15"
              aria-hidden="true"
            >
              {{ getInitials(displayName) }}
            </span>
          </div>
        </div>

        <div
          class="flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-end sm:gap-5 sm:px-6 sm:pb-5"
        >
          <div class="shrink-0">
            <div v-if="avatarUrl" class="avatar">
              <div
                class="-mt-10 h-24 w-24 rounded-full border-4 border-raised bg-base-300 sm:-mt-12 sm:h-28 sm:w-28"
              >
                <FileImage :file="avatarUrl" :alt="displayName" />
              </div>
            </div>
            <div v-else class="avatar avatar-placeholder">
              <div
                class="-mt-10 grid h-24 w-24 place-items-center rounded-full border-4 border-raised bg-base-300 text-dim sm:-mt-12 sm:h-28 sm:w-28"
              >
                <span class="text-2xl font-semibold">
                  {{ getInitials(displayName) }}
                </span>
              </div>
            </div>
          </div>

          <div class="min-w-0 flex-1 sm:pb-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1
                class="title truncate text-[28px] leading-none tracking-[-0.03em] text-base-content sm:text-[34px]"
              >
                {{ displayName }}
              </h1>
              <span
                v-if="account.profile?.verification"
                class="chip chip-active gap-1"
              >
                <IconShieldCheck class="size-3" />
                {{ account.profile.verification.title || "Verified" }}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="mono-id truncate">@{{ account.name }}</span>
              <ActivityPresence :account="account" />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-end gap-2 sm:pb-1">
            <template v-if="isAuthenticated && !isCurrentUser">
              <span v-if="relationship?.isBlocked" class="chip gap-1.5">
                <IconBan class="size-3" />
                Blocked
              </span>
              <span
                v-else-if="relationship?.isFriend"
                class="chip chip-active gap-1.5"
              >
                <IconUserCheck class="size-3" />
                Friends
              </span>
              <button
                v-else
                type="button"
                class="btn btn-primary gap-2"
                :disabled="isActionLoading"
                @click="addFriend"
              >
                <IconLoader
                  v-if="isActionLoading"
                  class="w-4 h-4 animate-spin"
                />
                <IconUserPlus v-else class="size-3.5" />
                Add friend
              </button>
              <button
                type="button"
                class="btn btn-ghost gap-2 bg-base-200"
                :disabled="isActionLoading"
                @click="sendMessage"
              >
                <IconMessageCircle class="size-3.5" />
                Message
              </button>
            </template>

            <button
              type="button"
              class="btn btn-ghost btn-square bg-base-200"
              aria-label="Share profile"
              @click="shareProfile"
            >
              <IconShare2 class="size-3.5" />
            </button>

            <details
              v-if="isAuthenticated && !isCurrentUser"
              ref="actionsMenu"
              class="dropdown dropdown-end"
            >
              <summary
                class="btn btn-ghost btn-square list-none bg-base-200 marker:content-none [&::-webkit-details-marker]:hidden"
                aria-label="More actions"
              >
                <IconMoreHorizontal class="size-4" />
              </summary>
              <ul
                class="menu-plate dropdown-content z-50 mt-2 w-44 p-1.5 text-xs"
                @click="closeActionMenu"
              >
                <li>
                  <button
                    v-if="relationship?.isBlocked"
                    type="button"
                    class="post-menu-row"
                    @click="unblock"
                  >
                    <IconUserCheck class="size-3.5" />
                    Unblock account
                  </button>
                  <button
                    v-else
                    type="button"
                    class="post-menu-row text-error"
                    @click="block"
                  >
                    <IconBan class="size-3.5" />
                    Block account
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    class="post-menu-row text-error"
                    @click="reportUser"
                  >
                    <IconFlag class="size-3.5" />
                    Report account
                  </button>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </section>

      <!-- Two-column body: board/activity (main) + bio sidebar on desktop -->
      <div
        class="grid grid-cols-1 gap-4 py-4 lg:grid-cols-3 items-start"
      >
        <!-- Main column: tabs + board / activity -->
        <div
          class="order-2 min-w-0 space-y-4 lg:order-1"
          :class="hasSidebar ? 'lg:col-span-2' : 'lg:col-span-3'"
        >
          <div
            role="tablist"
            aria-label="Profile sections"
            class="grid grid-cols-3 gap-0.5 rounded-card bg-base-200/60 p-1"
          >
            <button
              type="button"
              role="tab"
              class="btn btn-sm justify-center gap-1.5"
              :class="activeTab === 'board' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
              :aria-selected="activeTab === 'board'"
              aria-controls="profile-board"
              @click="activeTab = 'board'"
            >
              <IconLayoutGrid class="size-3.5" aria-hidden="true" />
              Board
            </button>
            <button
              type="button"
              role="tab"
              class="btn btn-sm justify-center gap-1.5"
              :class="activeTab === 'activity' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
              :aria-selected="activeTab === 'activity'"
              aria-controls="profile-activity"
              @click="activeTab = 'activity'"
            >
              <IconActivity class="size-3.5" aria-hidden="true" />
              Activity
            </button>
            <button
              type="button"
              role="tab"
              class="btn btn-sm justify-center gap-1.5"
              :class="activeTab === 'media' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
              :aria-selected="activeTab === 'media'"
              aria-controls="profile-media"
              @click="activeTab = 'media'"
            >
              <IconMusic class="size-3.5" aria-hidden="true" />
              Media
            </button>
          </div>

          <!-- Board tab -->
          <div
            v-show="activeTab === 'board'"
            id="profile-board"
            role="tabpanel"
            class="w-full min-w-0"
          >
            <div v-if="boardLoading" class="space-y-3" aria-busy="true">
              <LoadingSkeleton variant="feed" :rows="2" />
            </div>
            <AccountBoard
              v-if="!boardLoading"
              :account="account"
              :items="boardItems"
              :uname="accountName"
              :publishers="publishers"
              :badge-manifest="badgeManifestStore.manifest"
            />
          </div>

          <!-- Activity timeline tab -->
          <section
            v-show="activeTab === 'activity'"
            id="profile-activity"
            role="tabpanel"
            class="space-y-3 w-full min-w-0"
          >
            <div
              v-if="isLoadingTimeline && timelineItems.length === 0"
              class="space-y-2"
              aria-busy="true"
            >
              <LoadingSkeleton variant="rows" :rows="3" />
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
                type="button"
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
              <p v-else class="mono-id">No more activity</p>
            </div>

            <div
              v-else-if="!isLoadingTimeline"
              class="plate px-4 py-10 text-center"
            >
              <p class="text-sm font-semibold">No activity yet</p>
              <p class="mt-1 text-xs text-dim">
                Status changes and media scrobbles will appear here.
              </p>
            </div>
          </section>

          <!-- Media / Pulsar tab -->
          <section
            v-if="activeTab === 'media'"
            id="profile-media"
            role="tabpanel"
            class="w-full min-w-0"
          >
            <PulsarProfileTab :username="account.name" />
          </section>
        </div>

        <!-- Sidebar: bio + meta (right on desktop, above content on mobile) -->
        <aside
          v-if="hasSidebar"
          class="order-1 lg:order-2 space-y-3 w-full min-w-0 lg:sticky lg:top-20 lg:self-start"
        >
          <div v-if="account.profile?.bio" class="plate p-4">
            <div
              v-if="!isBioExpanded"
              class="markdown markdown-compact line-clamp-3"
              @click="handleMarkdownClick"
              v-html="bioHtml"
            />
            <div
              v-else
              class="markdown markdown-compact"
              @click="handleMarkdownClick"
              v-html="bioHtml"
            />
            <button
              v-if="bioNeedsExpand"
              type="button"
              class="mt-2 text-xs font-semibold text-primary hover:underline"
              @click="isBioExpanded = !isBioExpanded"
            >
              {{ isBioExpanded ? "Show less" : "Read more" }}
            </button>
          </div>

          <div v-if="botDeveloper?.publisher" class="plate p-4">
            <div class="flex items-center gap-3">
              <div
                class="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary"
              >
                <IconBot class="size-4" />
              </div>
              <p class="min-w-0 text-sm text-dim">
                Automated by
                <NuxtLink
                  :to="`/publishers/${botDeveloper.publisher.name}`"
                  class="font-semibold text-base-content link link-hover"
                >
                  {{
                    botDeveloper.publisher.nick || botDeveloper.publisher.name
                  }}
                </NuxtLink>
              </p>
            </div>
          </div>

          <div v-if="punishment" class="rounded-card bg-error/8 p-4">
            <div class="flex items-start gap-3">
              <div
                class="grid size-9 shrink-0 place-items-center rounded-full bg-error/12 text-error"
              >
                <IconAlertTriangle class="size-4" />
              </div>
              <div class="min-w-0">
                <h2 class="text-sm font-semibold">Account restrictions</h2>
                <p class="mt-0.5 text-xs leading-relaxed text-dim">
                  This account has active restrictions.
                </p>
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

// `/accounts/me` has no page of its own here: this explorer reads other
// people's content, so a signed-in reader is sent to their own public profile
// rather than shown an "account not found" page for the literal name `me`.
watchEffect(() => {
  if (accountName.value !== "me") return;
  const own = useAuth().user.value?.name;
  void navigateTo(own ? `/accounts/${encodeURIComponent(own)}` : "/", { replace: true });
});

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
const actionsMenu = ref<HTMLDetailsElement | null>(null);
const botDeveloper = ref<{
  publisher?: { name: string; nick?: string };
} | null>(null);
const punishment = ref<SnAccountPunishment | null>(null);
const badgeManifestStore = useBadgeManifestStore();
const activeTab = ref<"board" | "activity" | "media">(
  route.query.tab === "media" ? "media" : route.query.tab === "activity" ? "activity" : "board",
);

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
const avatarUrl = computed(() => account.value?.profile?.picture ?? null);
const backgroundUrl = computed(() => account.value?.profile?.background ?? null);
const bioHtml = computed(() => {
  if (!account.value?.profile?.bio) return "";
  return renderMarkdown(account.value.profile.bio);
});
const bioNeedsExpand = computed(() => {
  const bio = account.value?.profile?.bio?.trim();
  if (!bio) return false;
  return bio.length > 180 || bio.includes("\n");
});

const hasSidebar = computed(
  () =>
    Boolean(account.value?.profile?.bio) ||
    Boolean(botDeveloper.value?.publisher) ||
    Boolean(punishment.value),
);

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

function closeActionMenu() {
  if (actionsMenu.value) actionsMenu.value.open = false;
}

function handleActionMenuOutside(e: PointerEvent) {
  const menu = actionsMenu.value;
  if (!menu?.open) return;
  if (e.target instanceof Node && menu.contains(e.target)) return;
  menu.open = false;
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
  document.addEventListener("pointerdown", handleActionMenuOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleActionMenuOutside);
});

// Reload board when account name changes
watch(
  accountName,
  async (_name, previousName) => {
    timelineItems.value = [];
    timelineOffset.value = 0;
    // Keep the tab from the URL on first paint; a real account switch starts
    // at the board so stale timeline entries never linger.
    if (previousName !== undefined) activeTab.value = "board";
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
