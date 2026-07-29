<template>
  <div class="w-full space-y-3">
    <!-- Mobile horizontal strip -->
    <div
      class="flex gap-2 overflow-x-auto pb-1 xl:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        class="w-40 shrink-0 rounded-box bg-primary/5 p-3"
      >
        <div class="mb-1.5 flex items-center gap-1.5">
          <IconRocket class="h-3.5 w-3.5 text-primary" />
          <span class="text-xs font-semibold">
            {{ t("realms.lv", { level: boostStatus?.boostLevel || 0 }) }}
          </span>
        </div>
        <div v-if="boostStatus" class="text-sm font-bold tabular-nums">
          {{ boostStatus.boostPoints.toLocaleString() }}
          <span class="text-xs font-normal text-base-content/50">{{
            t("realms.points")
          }}</span>
        </div>
        <NuxtLink
          :to="`/realms/${realmSlug}/boost`"
          class="btn btn-primary btn-xs mt-2 w-full"
        >
          <IconZap class="h-3 w-3" />
          {{ t("realms.boostRealm") }}
        </NuxtLink>
      </div>

      <NuxtLink
        :to="`/realms/${realmSlug}/members`"
        class="flex w-28 shrink-0 flex-col items-center justify-center rounded-box bg-base-100 p-3 transition-colors hover:bg-base-200"
      >
        <IconUsers class="mb-1 h-5 w-5 text-base-content/55" />
        <span class="text-xs font-medium">{{ t("realms.membersLink") }}</span>
      </NuxtLink>

      <button
        v-if="isMember"
        type="button"
        class="flex w-28 shrink-0 flex-col items-center justify-center rounded-box bg-base-100 p-3 transition-colors hover:bg-base-200"
        @click="copyInviteLink"
      >
        <IconLink class="mb-1 h-5 w-5 text-base-content/55" />
        <span class="text-xs font-medium">{{ t("realms.inviteBtn") }}</span>
      </button>
    </div>

    <!-- Desktop rail cards -->
    <div class="hidden space-y-3 xl:block">
      <!-- Boost -->
      <div
        class="overflow-hidden rounded-box bg-base-100"
      >
        <div class="bg-base-200/70 px-3 py-2.5">
          <div class="flex items-center gap-2">
            <IconRocket class="h-4 w-4 text-primary" />
            <h3 class="text-sm font-semibold">{{ t("realms.boostStatus") }}</h3>
          </div>
        </div>
        <div class="p-3">
          <div v-if="boostStatus" class="space-y-3">
            <div class="flex items-end justify-between">
              <div>
                <div class="text-2xl font-bold tabular-nums">
                  {{ boostStatus.boostLevel }}
                </div>
                <div class="text-[11px] text-base-content/50">
                  {{ t("realms.currentLevel") }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-semibold tabular-nums">
                  {{ boostStatus.boostPoints.toLocaleString() }}
                </div>
                <div class="text-[11px] text-base-content/50">
                  {{ t("realms.points") }}
                </div>
              </div>
            </div>
            <div class="space-y-1">
              <div
                class="flex justify-between text-[11px] text-base-content/50"
              >
                <span>{{ t("realms.progressToNextLevel") }}</span>
                <span>{{ progressPercent }}%</span>
              </div>
              <progress
                class="progress progress-primary h-1.5 w-full"
                :value="progressPercent"
                max="100"
              />
            </div>
            <NuxtLink
              :to="`/realms/${realmSlug}/boost`"
              class="btn btn-primary btn-sm w-full"
            >
              <IconZap class="h-4 w-4" />
              {{ t("realms.boostRealm") }}
            </NuxtLink>
          </div>
          <div v-else-if="isLoadingBoost" class="py-6 text-center">
            <span class="loading loading-spinner loading-sm" />
          </div>
          <div
            v-else
            class="py-4 text-center text-xs text-base-content/50"
          >
            {{ t("realms.failedToLoadBoost") }}
          </div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div
        v-if="leaderboard.length > 0"
        class="overflow-hidden rounded-box bg-base-100"
      >
        <div
          class="flex items-center justify-between bg-base-200/70 px-3 py-2.5"
        >
          <div class="flex items-center gap-2">
            <IconTrophy class="h-4 w-4 text-primary" />
            <h3 class="text-sm font-semibold">{{ t("realms.topBoosters") }}</h3>
          </div>
          <NuxtLink
            :to="`/realms/${realmSlug}/boost`"
            class="text-xs text-primary hover:underline"
          >
            {{ t("realms.viewAll") }}
          </NuxtLink>
        </div>
        <div class="space-y-1 p-1">
          <div
            v-for="(entry, index) in leaderboard.slice(0, 5)"
            :key="entry.accountId"
            class="flex items-center gap-2.5 rounded-box px-2 py-2"
          >
            <span
              class="w-5 text-center text-xs font-bold text-base-content/35"
            >
              {{ index + 1 }}
            </span>
            <div class="avatar shrink-0">
              <div class="h-7 w-7 rounded-md">
                <img
                  v-if="entry.account?.profile?.picture?.id"
                  :src="getFileUrl(entry.account.profile.picture.id)!"
                  :alt="entry.account.nick || entry.account.name"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-base-200 text-[10px] font-bold"
                >
                  {{
                    getInitials(
                      entry.account?.nick || entry.account?.name || "?",
                    )
                  }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1 truncate text-xs font-medium">
              {{ entry.account?.nick || entry.account?.name }}
            </div>
            <div class="text-xs font-semibold tabular-nums text-primary">
              {{ entry.totalPoints.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick links -->
      <div
        class="overflow-hidden rounded-box bg-base-100"
      >
        <div class="bg-base-200/70 px-3 py-2.5">
          <h3 class="text-sm font-semibold">{{ t("realms.quickLinks") }}</h3>
        </div>
        <div class="p-1.5">
          <NuxtLink
            :to="`/realms/${realmSlug}/members`"
            class="flex items-center gap-2.5 rounded-box px-2.5 py-2 text-sm transition-colors hover:bg-base-200"
          >
            <IconUsers class="h-4 w-4 text-base-content/50" />
            {{ t("realms.membersLink") }}
          </NuxtLink>
          <NuxtLink
            v-if="isMember"
            :to="`/realms/${realmSlug}/settings`"
            class="flex items-center gap-2.5 rounded-box px-2.5 py-2 text-sm transition-colors hover:bg-base-200"
          >
            <IconSettings class="h-4 w-4 text-base-content/50" />
            {{ t("realms.settings") }}
          </NuxtLink>
          <button
            v-if="isMember"
            type="button"
            class="flex w-full items-center gap-2.5 rounded-box px-2.5 py-2 text-left text-sm transition-colors hover:bg-base-200"
            @click="copyInviteLink"
          >
            <IconLink class="h-4 w-4 text-base-content/50" />
            {{ t("realms.copyInviteLink") }}
          </button>
        </div>
      </div>

      <!-- My identity -->
      <div
        v-if="membership"
        class="overflow-hidden rounded-box bg-base-100"
      >
        <div class="bg-base-200/70 px-3 py-2.5">
          <h3 class="text-sm font-semibold">{{ t("realms.myIdentity") }}</h3>
        </div>
        <div class="p-3">
          <div class="flex items-start gap-2.5">
            <div class="avatar shrink-0">
              <div class="h-9 w-9 rounded-box">
                <img
                  v-if="auth.user.value?.profile?.picture?.id"
                  :src="getFileUrl(auth.user.value.profile.picture.id)!"
                  :alt="membership.nick || auth.user.value.name"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-primary text-xs font-bold text-primary-content"
                >
                  {{
                    getInitials(
                      membership.nick || auth.user.value?.name || "?",
                    )
                  }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">
                {{
                  membership.nick ||
                  auth.user.value?.nick ||
                  auth.user.value?.name
                }}
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-1">
                <span
                  class="badge badge-xs"
                  :class="getRoleBadgeClass(membership.role)"
                >
                  {{ getRoleLabel(membership.role) }}
                </span>
                <span
                  v-if="membership.label"
                  class="badge badge-xs badge-ghost"
                >
                  {{ membership.label.name }}
                </span>
              </div>
              <div class="mt-1.5 text-[11px] text-base-content/45">
                {{ t("realms.lv", { level: membership.level }) }}
                ·
                {{ t("realms.xp", { xp: membership.experience }) }}
              </div>
              <div
                v-if="membership.levelingProgress != null"
                class="mt-2"
              >
                <progress
                  class="progress progress-primary h-1 w-full"
                  :value="Math.round(membership.levelingProgress * 100)"
                  max="100"
                />
              </div>
            </div>
          </div>
          <NuxtLink
            v-if="isMember"
            :to="`/realms/${realmSlug}/identity`"
            class="btn btn-ghost btn-xs mt-3 w-full"
          >
            <IconPencil class="h-3 w-3" />
            {{ t("realms.editIdentity") }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div
      v-if="showCopied"
      class="fixed bottom-4 right-4 z-50 rounded-box bg-success px-3 py-2 text-sm text-success-content shadow-sm"
    >
      {{ t("realms.inviteLinkCopied") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  RealmBoostStatus,
  RealmBoostLeaderboardEntry,
  RealmMember,
  RealmLabel,
} from "~/types/realm";
import {
  fetchRealmBoostStatus,
  fetchRealmBoostLeaderboard,
  fetchRealmLabels,
} from "~/utils/api";
import { getFileUrl } from "~/utils/files";
import {
  IconRocket,
  IconZap,
  IconUsers,
  IconLink,
  IconTrophy,
  IconSettings,
  IconPencil,
} from "#components";

const { t } = useI18n();

const props = defineProps<{
  realmSlug: string;
  isMember: boolean;
  membership: RealmMember | null;
}>();

const auth = useAuth();

const boostStatus = ref<RealmBoostStatus | null>(null);
const leaderboard = ref<RealmBoostLeaderboardEntry[]>([]);
const labels = ref<RealmLabel[]>([]);
const isLoadingBoost = ref(false);
const showCopied = ref(false);

const progressPercent = computed(() => {
  if (!boostStatus.value) return 0;
  // Align with Flutter thresholds-ish estimate
  const level = boostStatus.value.boostLevel;
  const points = boostStatus.value.boostPoints;
  const pointsForNextLevel = Math.pow(level + 1, 2) * 100;
  const pointsForCurrentLevel = Math.pow(level, 2) * 100;
  const denom = pointsForNextLevel - pointsForCurrentLevel;
  if (denom <= 0) return 0;
  const progress =
    ((points - pointsForCurrentLevel) / denom) * 100;
  return Math.min(Math.max(Math.round(progress), 0), 100);
});

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
}

/** Flutter role scale: >=100 owner, >=50 moderator, else member */
function getRoleLabel(role: number): string {
  if (role >= 100) return t("realms.roleOwner");
  if (role >= 50) return t("realms.roleModerator");
  return t("realms.roleMember");
}

function getRoleBadgeClass(role: number): string {
  if (role >= 100) return "badge-primary";
  if (role >= 50) return "badge-secondary";
  return "badge-ghost";
}

function copyInviteLink() {
  const link = `${window.location.origin}/realms/${props.realmSlug}/invite`;
  navigator.clipboard.writeText(link);
  showCopied.value = true;
  setTimeout(() => (showCopied.value = false), 2000);
}

async function loadBoostData() {
  isLoadingBoost.value = true;
  try {
    const [status, board] = await Promise.all([
      fetchRealmBoostStatus(props.realmSlug),
      fetchRealmBoostLeaderboard(props.realmSlug, 10),
    ]);
    boostStatus.value = status;
    leaderboard.value = board;
  } catch (err) {
    console.error("Failed to load boost data:", err);
  } finally {
    isLoadingBoost.value = false;
  }
}

async function loadLabels() {
  try {
    labels.value = await fetchRealmLabels(props.realmSlug);
  } catch (err) {
    console.error("Failed to load labels:", err);
  }
}

onMounted(() => {
  loadBoostData();
  if (props.isMember) loadLabels();
});

watch(
  () => props.isMember,
  (member) => {
    if (member) loadLabels();
  },
);
</script>
