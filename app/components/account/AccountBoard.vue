<template>
  <div class="space-y-3 w-full min-w-0">
    <template v-for="item in enabledItems" :key="itemKey(item)">
      <!-- Custom app widget: image/background handled inside layout (hero/grid/etc.), not as an outer banner -->
      <div
        v-if="isCustomApp(item)"
        class="card w-full overflow-hidden"
      >
        <div
          class="relative w-full min-w-0"
          :class="customAppNeedsPadding(item) ? 'p-4' : ''"
        >
          <AccountBoardCustomWidget
            :app-id="item.customAppId || ''"
            :widget-key="item.customAppWidgetKey || ''"
            :payload="item.payload || {}"
            :background="payloadString(item.payload, 'background')"
            :image="payloadString(item.payload, 'image')"
            :apps="boardApps"
          />
        </div>
      </div>

      <!-- Prebuilt: image (no padding) -->
      <div
        v-else-if="widgetKey(item) === 'image'"
        class="card w-full overflow-hidden"
      >
        <BoardImageWidget :file-ids="payloadFileIds(item.payload)" />
      </div>

      <!-- Fortune already ships its own card chrome -->
      <FortuneTrendCard
        v-else-if="widgetKey(item) === 'fortune'"
        :username="uname"
      />

      <!-- Prebuilt widgets with card chrome -->
      <div v-else class="card w-full overflow-hidden relative">
        <img
          v-if="payloadString(item.payload, 'background')"
          :src="resolveImageSrc(payloadString(item.payload, 'background')!)"
          alt=""
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          v-if="payloadString(item.payload, 'background')"
          class="absolute inset-0 bg-base-100/85"
        />
        <div
          v-if="payloadImage(item.payload)"
          class="relative aspect-[16/5] w-full overflow-hidden"
        >
          <img
            :src="resolveImageSrc(payloadImage(item.payload)!)"
            alt=""
            class="h-full w-full object-cover"
          />
        </div>
        <div class="card-body p-4 relative">
          <!-- Badges -->
          <template v-if="widgetKey(item) === 'badges'">
            <div class="flex items-center gap-2 mb-3">
              <IconStars class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Badges</h3>
              <span
                v-if="showCount(item) && (account.badges?.length || 0) > 0"
                class="badge badge-sm badge-primary"
              >
                {{ account.badges?.length }}
              </span>
            </div>
            <div v-if="account.badges?.length" class="flex flex-wrap gap-2">
              <div
                v-for="badge in account.badges"
                :key="badge.id"
                class="tooltip"
                :data-tip="badgeTooltip(badge)"
              >
                <BadgeIcon
                  :badge="badge"
                  :manifest="badgeManifest"
                  size="md"
                />
              </div>
            </div>
            <p v-else class="text-sm text-base-content/50">No badges yet</p>
          </template>

          <!-- Bio -->
          <template v-else-if="widgetKey(item) === 'bio'">
            <div class="flex items-center gap-2 mb-2">
              <IconFileText class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Bio</h3>
            </div>
            <div
              v-if="bioHtml"
              class="prose prose-sm max-w-none break-words prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              v-html="bioHtml"
              @click="onMarkdownClick"
            />
            <p v-else class="text-sm text-base-content/50">No bio yet</p>
          </template>

          <!-- Links -->
          <template v-else-if="widgetKey(item) === 'links'">
            <div class="flex items-center gap-2 mb-3">
              <IconLink class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Links</h3>
            </div>
            <div v-if="account.profile?.links?.length" class="space-y-2">
              <a
                v-for="link in account.profile.links"
                :key="link.name || link.url"
                :href="normalizeUrl(link.url)"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-start gap-2 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors"
              >
                <IconExternalLink
                  v-if="showIcons(item)"
                  class="w-3.5 h-3.5 text-primary mt-0.5 shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium capitalize truncate">
                    {{ link.name || link.label || "Link" }}
                  </p>
                  <p class="text-xs text-base-content/50 truncate">
                    {{ displayHost(link.url) }}
                  </p>
                </div>
                <IconArrowUpRight class="w-3.5 h-3.5 text-base-content/30 mt-0.5" />
              </a>
            </div>
            <p v-else class="text-sm text-base-content/50">No links</p>
          </template>

          <!-- Notable days -->
          <template v-else-if="widgetKey(item) === 'notable_days'">
            <div class="flex items-center gap-2 mb-3">
              <IconCalendar class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Notable Days</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-if="payloadBool(item.payload, 'show_joined', true)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-box bg-base-200/70 text-sm"
              >
                <IconCalendarDays class="w-3.5 h-3.5 text-base-content/50" />
                Joined {{ formatDateShort(account.createdAt) }}
              </span>
              <template
                v-if="
                  payloadBool(item.payload, 'show_birthday', true) &&
                  account.profile?.birthday
                "
              >
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-box bg-base-200/70 text-sm"
                >
                  <IconCake class="w-3.5 h-3.5 text-base-content/50" />
                  {{ formatDateShort(account.profile.birthday) }}
                </span>
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-box bg-base-200/70 text-sm"
                >
                  <IconTimer class="w-3.5 h-3.5 text-base-content/50" />
                  {{ getAge(account.profile.birthday) }} yrs
                </span>
              </template>
              <span
                v-if="account.profile?.timeZone"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-box bg-base-200/70 text-sm"
              >
                <IconClock class="w-3.5 h-3.5 text-base-content/50" />
                {{ account.profile.timeZone }}
                <span
                  v-if="currentTimeInTz"
                  class="badge badge-xs badge-primary"
                >
                  {{ currentTimeInTz }}
                </span>
              </span>
            </div>
          </template>

          <!-- Social credits -->
          <template v-else-if="widgetKey(item) === 'social_credits'">
            <div class="flex items-center gap-2 mb-3">
              <IconUsers class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Social Credits</h3>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-14 h-14 rounded-box bg-primary/15 flex items-center justify-center"
              >
                <IconStar class="w-7 h-7 text-primary" />
              </div>
              <div>
                <p
                  class="text-2xl font-bold text-primary"
                >
                  {{ (account.profile?.socialCredits ?? 0).toFixed(2) }}
                </p>
                <p class="text-sm text-base-content/50">
                  {{ getCreditsLevelLabel(account.profile?.socialCreditsLevel) }}
                </p>
              </div>
            </div>
            <progress
              v-if="payloadBool(item.payload, 'show_graph', false)"
              class="progress progress-primary w-full mt-4 h-1.5"
              :value="Math.min(100, Math.max(0, account.profile?.socialCredits ?? 0))"
              max="100"
            />
          </template>

          <!-- Leveling -->
          <template v-else-if="widgetKey(item) === 'leveling'">
            <div class="flex items-center gap-2 mb-3">
              <IconTrendingUp class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Leveling</h3>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-14 h-14 rounded-box bg-primary/15 flex items-center justify-center"
              >
                <span class="text-xl font-bold text-primary">
                  {{ account.profile?.level ?? 0 }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold">
                  Level {{ account.profile?.level ?? 0 }}
                </p>
                <progress
                  class="progress progress-primary w-full h-1.5 mt-1"
                  :value="(account.profile?.levelingProgress ?? 0) * 100"
                  max="100"
                />
                <p class="text-xs text-base-content/50 mt-0.5">
                  {{ formatExp(account.profile?.experience ?? 0) }} XP
                </p>
              </div>
            </div>
          </template>

          <!-- Verification -->
          <template v-else-if="widgetKey(item) === 'verification'">
            <div class="flex items-center gap-2 mb-3">
              <IconShieldCheck class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Verification</h3>
            </div>
            <div v-if="account.profile?.verification" class="space-y-1">
              <p class="font-semibold">
                {{ account.profile.verification.title || "Verified" }}
              </p>
              <p
                v-if="account.profile.verification.description"
                class="text-sm text-base-content/70"
              >
                {{ account.profile.verification.description }}
              </p>
              <p
                v-if="account.profile.verification.verifiedBy"
                class="text-xs text-base-content/50"
              >
                Verified by {{ account.profile.verification.verifiedBy }}
              </p>
            </div>
            <p v-else class="text-sm text-base-content/50">Not verified</p>
          </template>

          <!-- Contacts -->
          <template v-else-if="widgetKey(item) === 'contacts'">
            <div class="flex items-center gap-2 mb-3">
              <IconContact class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Contact Methods</h3>
            </div>
            <div v-if="publicContacts.length" class="space-y-2">
              <a
                v-for="contact in publicContacts"
                :key="contact.id"
                :href="contactHref(contact)"
                class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors"
                @click="onContactClick($event, contact)"
              >
                <IconMail
                  v-if="contact.type === 0"
                  class="w-4 h-4 text-primary shrink-0"
                />
                <IconSmartphone
                  v-else-if="contact.type === 1"
                  class="w-4 h-4 text-primary shrink-0"
                />
                <IconHome v-else class="w-4 h-4 text-primary shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate">{{ contact.content }}</p>
                  <p class="text-xs text-base-content/50">
                    {{
                      contact.type === 0
                        ? "Email"
                        : contact.type === 1
                          ? "Phone"
                          : "Address"
                    }}
                  </p>
                </div>
                <IconChevronRight class="w-4 h-4 text-base-content/30" />
              </a>
            </div>
            <p v-else class="text-sm text-base-content/50">No public contacts</p>
          </template>

          <!-- Connections -->
          <template v-else-if="widgetKey(item) === 'connections'">
            <div class="flex items-center gap-2 mb-3">
              <IconLink class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Connections</h3>
            </div>
            <div v-if="connectionsLoading" class="py-2">
              <span class="loading loading-spinner loading-xs" />
            </div>
            <div v-else-if="connections.length" class="space-y-2">
              <component
                :is="conn.url ? 'a' : 'div'"
                v-for="(conn, i) in connections"
                :key="`${conn.provider}-${conn.providedIdentifier}-${i}`"
                :href="conn.url || undefined"
                :target="conn.url ? '_blank' : undefined"
                :rel="conn.url ? 'noopener noreferrer' : undefined"
                class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50"
                :class="conn.url ? 'hover:bg-base-200 transition-colors cursor-pointer' : ''"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                >
                  <IconLink class="w-4 h-4 text-primary" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium capitalize truncate">
                    {{ formatProvider(conn.provider) }}
                  </p>
                  <p class="text-xs text-base-content/50 truncate">
                    {{ conn.url || conn.providedIdentifier }}
                  </p>
                </div>
                <IconArrowUpRight
                  v-if="conn.url"
                  class="w-3.5 h-3.5 text-base-content/30"
                />
              </component>
            </div>
            <p v-else class="text-sm text-base-content/50">No connections</p>
          </template>

          <!-- Publishers -->
          <template v-else-if="widgetKey(item) === 'publishers'">
            <div class="flex items-center gap-2 mb-3">
              <IconBot class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Publishers</h3>
            </div>
            <div v-if="publishers.length" class="space-y-2">
              <NuxtLink
                v-for="pub in publishers"
                :key="pub.id"
                :to="`/publishers/${pub.name}`"
                class="flex items-center gap-3 p-2 rounded-lg bg-base-200/50 hover:bg-base-200 transition-colors"
              >
                <div class="avatar">
                  <div class="w-9 h-9 rounded-full">
                    <img
                      v-if="pub.picture?.id"
                      :src="getFileUrl(pub.picture.id) ?? undefined"
                      :alt="pub.nick ?? undefined"
                    />
                    <div
                      v-else
                      class="bg-primary text-primary-content flex items-center justify-center text-sm font-bold w-full h-full"
                    >
                      {{ pub.nick?.[0] || "?" }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate">{{ pub.nick }}</p>
                  <p class="text-xs text-base-content/50 truncate">
                    @{{ pub.name }}
                  </p>
                </div>
                <IconArrowUpRight class="w-3.5 h-3.5 text-base-content/30" />
              </NuxtLink>
            </div>
            <p v-else class="text-sm text-base-content/50">No publishers</p>
          </template>

          <!-- Activity presence -->
          <template v-else-if="widgetKey(item) === 'activity'">
            <div class="flex items-center gap-2 mb-3">
              <IconRadio class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold">Activity</h3>
            </div>
            <ActivityPresence :account="account" show-last-seen />
          </template>

          <!-- Prebuilt text -->
          <template v-else-if="widgetKey(item) === 'text'">
            <div
              class="prose prose-sm max-w-none"
              v-html="renderMarkdown(payloadString(item.payload, 'content') || '')"
            />
          </template>

          <!-- Unknown -->
          <template v-else>
            <div class="flex items-center gap-2 text-error text-sm">
              <IconHelpCircle class="w-4 h-4" />
              Unknown widget: {{ widgetKey(item) }}
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  AccountBoardItem,
  AccountBoardPayload,
  PublicAccountConnection,
  SnAccount,
  SnAccountBadge,
  SnContactMethod,
} from "~/types/auth";
import type { Publisher } from "~/types/post";
import type { BoardAppDiscoveryResponse } from "~/types/developer";
import type { BadgeManifestEntry } from "~/utils/badges";
import { getBadgeName, getBadgeDescription } from "~/utils/badges";
import { getFileUrl } from "~/utils/files";
import { renderMarkdown } from "~/utils/markdown";
import { fetchPublicAccountConnections } from "~/utils/api";
import { discoverBoardWidgets } from "~/utils/developer";

const props = defineProps<{
  account: SnAccount;
  items: AccountBoardItem[];
  uname: string;
  publishers?: Publisher[];
  badgeManifest?: Record<string, BadgeManifestEntry> | null;
}>();

const publishers = computed(() => props.publishers ?? []);
const badgeManifest = computed(() => props.badgeManifest ?? null);

const enabledItems = computed(() =>
  [...props.items]
    .filter((i) => i.isEnabled !== false)
    .sort((a, b) => a.order - b.order),
);

const connections = ref<PublicAccountConnection[]>([]);
const connectionsLoading = ref(false);
const boardApps = ref<BoardAppDiscoveryResponse[]>([]);
const currentTimeInTz = ref("");

const publicContacts = computed(
  () =>
    props.account.contacts?.filter((c: SnContactMethod) => c.isPublic) ?? [],
);

const bioHtml = computed(() => {
  const bio = props.account.profile?.bio;
  if (!bio) return "";
  return renderMarkdown(bio);
});

function itemKey(item: AccountBoardItem) {
  return (
    item.id ||
    `${item.kind}-${item.widgetKey || item.customAppWidgetKey || "x"}-${item.order}`
  );
}

function isCustomApp(item: AccountBoardItem) {
  return item.kind === "custom_app" || item.kind === 1;
}

function widgetKey(item: AccountBoardItem) {
  return item.widgetKey || "";
}

function customAppNeedsPadding(item: AccountBoardItem) {
  // Legacy standalone text/attachment keep padded card chrome.
  // Configured custom apps match Flutter: no outer padding — each
  // renderer (hero/grid/list/inline/data) owns image/background spacing.
  return !item.customAppId;
}

function payloadString(
  payload: AccountBoardPayload | undefined,
  key: string,
): string | null {
  if (!payload) return null;
  const value = payload[key];
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) {
    const v = (value as { value?: unknown }).value;
    if (typeof v === "string") return v;
  }
  return null;
}

function payloadBool(
  payload: AccountBoardPayload | undefined,
  key: string,
  fallback: boolean,
): boolean {
  if (!payload || !(key in payload)) return fallback;
  const value = payload[key];
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "value" in value) {
    return Boolean((value as { value?: unknown }).value);
  }
  return Boolean(value);
}

function payloadImage(payload: AccountBoardPayload | undefined) {
  return payloadString(payload, "image");
}

function payloadFileIds(payload: AccountBoardPayload | undefined): string[] {
  if (!payload) return [];
  const fileIds = payload.file_ids ?? payload.fileIds;
  if (Array.isArray(fileIds)) {
    return fileIds.filter((id): id is string => typeof id === "string");
  }
  const single = payload.file_id ?? payload.fileId;
  if (typeof single === "string") return [single];
  if (single && typeof single === "object" && "value" in single) {
    const v = (single as { value?: unknown }).value;
    if (typeof v === "string") return [v];
    if (Array.isArray(v)) return v.filter((id): id is string => typeof id === "string");
  }
  return [];
}

function showCount(item: AccountBoardItem) {
  return payloadBool(item.payload, "show_count", true);
}

function showIcons(item: AccountBoardItem) {
  return payloadBool(item.payload, "show_icons", true);
}

function isRemoteUri(value: string) {
  try {
    const uri = new URL(value);
    return uri.protocol === "http:" || uri.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveImageSrc(source: string) {
  if (isRemoteUri(source)) return source;
  return getFileUrl(source) || source;
}

function normalizeUrl(url: string) {
  if (!url.startsWith("http") && !url.includes("://")) return `https://${url}`;
  return url;
}

function displayHost(url: string) {
  try {
    const u = new URL(normalizeUrl(url));
    return u.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDateShort(dateStr?: string | null) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-CA"); // yyyy-mm-dd
}

function getAge(birthday: string) {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

function getCreditsLevelLabel(level?: number) {
  switch (level) {
    case -1:
      return "Poor";
    case 0:
      return "Normal";
    case 1:
      return "Good";
    case 2:
      return "Excellent";
    default:
      return "Unknown";
  }
}

function formatExp(exp: number) {
  if (exp >= 1_000_000) return `${(exp / 1_000_000).toFixed(1)}M`;
  if (exp >= 1_000) return `${(exp / 1_000).toFixed(1)}K`;
  return String(exp);
}

function contactHref(contact: SnContactMethod) {
  if (contact.type === 0) return `mailto:${contact.content}`;
  if (contact.type === 1) return `tel:${contact.content}`;
  return "#";
}

function onContactClick(e: MouseEvent, contact: SnContactMethod) {
  if (contact.type >= 2) {
    e.preventDefault();
    navigator.clipboard.writeText(contact.content);
  }
}

function formatProvider(provider: string) {
  return provider.replace(/[_-]/g, " ");
}

function badgeTooltip(badge: SnAccountBadge) {
  const manifest = badgeManifest.value ?? undefined;
  const name = getBadgeName(badge, manifest);
  const desc = getBadgeDescription(badge, manifest);
  return desc ? `${name}\n${desc}` : name;
}

function onMarkdownClick(e: MouseEvent) {
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

function updateTimezone() {
  const tz = props.account.profile?.timeZone;
  if (!tz) {
    currentTimeInTz.value = "";
    return;
  }
  try {
    currentTimeInTz.value = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    currentTimeInTz.value = "";
  }
}

const needsConnections = computed(() =>
  enabledItems.value.some((i) => !isCustomApp(i) && widgetKey(i) === "connections"),
);
const needsBoardApps = computed(() =>
  enabledItems.value.some((i) => isCustomApp(i) && i.customAppId),
);

async function loadConnections() {
  if (!needsConnections.value) return;
  connectionsLoading.value = true;
  try {
    connections.value = await fetchPublicAccountConnections(props.uname);
  } catch {
    connections.value = [];
  } finally {
    connectionsLoading.value = false;
  }
}

async function loadBoardApps() {
  if (!needsBoardApps.value) return;
  try {
    boardApps.value = await discoverBoardWidgets();
  } catch {
    boardApps.value = [];
  }
}

watch(
  () => props.uname,
  () => {
    loadConnections();
  },
);

onMounted(() => {
  updateTimezone();
  const interval = setInterval(updateTimezone, 60_000);
  onUnmounted(() => clearInterval(interval));
  loadConnections();
  loadBoardApps();
});

watch(needsBoardApps, (v) => {
  if (v && boardApps.value.length === 0) loadBoardApps();
});
</script>
