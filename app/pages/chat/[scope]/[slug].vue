<script setup lang="ts">
import {
  fetchChatRoomBySlug,
  getMyRealmMembership,
  joinRealm,
  fetchRealmMembers,
} from "~/utils/api";
import { getFileUrl } from "~/utils/files";
import type { SnChatRoom } from "~/types/chat";
import type { Realm, RealmMember } from "~/types/realm";
import {
  IconUsers,
  IconExternalLink,
  IconSearchX,
  IconLoader,
  IconAlertCircle,
} from "#components";

definePageMeta({ layout: false });

const { t } = useI18n();

defineOgImage("UniOgImage", {
  title: t("chat.inviteSeoTitle"),
  description: t("chat.inviteSeoDescription"),
});

useSolarSeo({
  title: t("chat.inviteSeoTitle"),
  description: t("chat.inviteSeoDescription"),
});

const route = useRoute();

const scope = computed(() => String(route.params.scope ?? ""));
const slug = computed(() => String(route.params.slug ?? ""));

const room = ref<SnChatRoom | null>(null);
const notFound = ref(false);
const error = ref<string | null>(null);
const loading = ref(true);
const actionBusy = ref(false);
const isMember = ref(false);
const memberCount = ref(0);

// Room constants (from the Flutter client)
const ROOM_TYPE_DM = 1;

const isDirect = computed(() => room.value?.type === ROOM_TYPE_DM);

// Room avatar; fall back to the realm avatar since by-slug returns room.picture
// as null for realm rooms.
const avatarUrl = computed(() =>
  getFileUrl(room.value?.picture?.id ?? room.value?.realm?.picture?.id),
);

// Card banner: the room's own background, or the realm's when unset.
const backgroundUrl = computed(() =>
  getFileUrl(room.value?.background?.id ?? room.value?.realm?.background?.id),
);

const displayName = computed(() => {
  if (!room.value) return "";
  if (isDirect.value && !room.value.name) return t("chat.directMessage");
  return room.value.name || t("chat.unnamedRoom");
});

const realm = computed<Realm | null>(() => room.value?.realm ?? null);

const appDeepLink = computed(() => {
  const roomId = room.value?.id;
  return roomId ? `solian://chat/${roomId}` : null;
});

// Realm identity: check membership, then member count + avatars for the stack.
async function loadRealmIdentity() {
  if (!realm.value?.slug) return;
  try {
    const [membership, membersResult] = await Promise.all([
      getMyRealmMembership(realm.value.slug),
      fetchRealmMembers(realm.value.slug, 50, 0).catch(() => ({
        members: [] as RealmMember[],
        total: 0,
      })),
    ]);
    isMember.value = !!membership;
    memberCount.value = membersResult.total;
    realmMembers.value = membersResult.members;
  } catch (err) {
    console.error("[ChatInvite] Failed to load realm identity:", err);
  }
}

const realmMembers = ref<RealmMember[]>([]);

const realmMemberAvatars = computed(() =>
  realmMembers.value
    .map((m) => ({
      id: m.accountId,
      url: getFileUrl(m.account?.profile?.picture?.id),
      name:
        m.nick ||
        m.account?.nick ||
        m.account?.name ||
        m.accountId.slice(0, 8),
    }))
    .filter((m) => m.url),
);

const visibleRealmMemberAvatars = computed(() =>
  realmMemberAvatars.value.slice(0, 4),
);
const hiddenRealmMemberCount = computed(() =>
  Math.max(0, realmMemberAvatars.value.length - visibleRealmMemberAvatars.value.length),
);

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

// Two-step: (1) identity already fetched on load. (2) join the realm only if
// not a member, then wake the client.
async function openChat() {
  if (!room.value || actionBusy.value) return;
  const realmSlug = realm.value?.slug;
  if (!realmSlug) {
    window.location.href = appDeepLink.value!;
    return;
  }

  actionBusy.value = true;
  error.value = null;
  try {
    if (!isMember.value) {
      await joinRealm(realmSlug);
      isMember.value = true;
    }
    window.location.href = appDeepLink.value!;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : t("chat.inviteLoadFailed");
  } finally {
    actionBusy.value = false;
  }
}

onMounted(async () => {
  try {
    const data = await fetchChatRoomBySlug(scope.value, slug.value);
    if (!data) {
      notFound.value = true;
      return;
    }
    room.value = data;
    await loadRealmIdentity();
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      notFound.value = true;
    } else {
      error.value =
        err instanceof Error ? err.message : t("chat.inviteLoadFailed");
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-200 px-4"
  >
    <!-- Soft ambient glow behind the card -->
    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      aria-hidden="true"
    />

    <!-- Not Found State -->
    <div
      v-if="notFound"
      class="relative w-full max-w-md rounded-3xl border border-base-content/5 bg-base-100 p-10 text-center shadow-xl shadow-base-content/5"
    >
      <IconSearchX class="mx-auto h-9 w-9 text-base-content/50" />
      <h1 class="mt-4 text-xl font-black">{{ t("chat.roomNotFoundTitle") }}</h1>
      <p class="mt-2 text-sm text-base-content/60">
        {{ t("chat.inviteLoadFailed") }}
      </p>
    </div>

    <!-- Loading skeleton -->
    <div
      v-else-if="loading"
      class="relative w-full max-w-md overflow-hidden rounded-3xl border border-base-content/5 bg-base-100 shadow-xl shadow-base-content/5"
      aria-busy="true"
      aria-label="Loading chat invite"
    >
      <div class="skeleton aspect-[16/7] w-full rounded-none" />
      <div class="flex flex-col items-center p-8 md:p-10">
        <div class="skeleton h-3 w-24" />
        <div class="skeleton mt-6 h-20 w-20 rounded-2xl" />
        <div class="skeleton mt-5 h-7 w-44" />
        <div class="skeleton mt-2 h-4 w-64" />
        <div class="mt-6 flex gap-2">
          <div class="skeleton h-7 w-28 rounded-full" />
          <div class="skeleton h-7 w-16 rounded-full" />
        </div>
        <div class="skeleton mt-8 h-12 w-full rounded-btn" />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="!room"
      class="relative w-full max-w-md rounded-3xl border border-base-content/5 bg-base-100 p-10 shadow-xl shadow-base-content/5"
    >
      <div class="alert alert-error">
        <IconAlertCircle class="h-5 w-5 shrink-0" />
        <span>{{ error || t("chat.inviteLoadFailed") }}</span>
      </div>
    </div>

    <!-- Invite Card -->
    <div
      v-else
      class="relative w-full max-w-md overflow-hidden rounded-3xl border border-base-content/5 bg-base-100 shadow-xl shadow-base-content/5"
    >
      <!-- Background banner (16:7) -->
      <div
        v-if="backgroundUrl"
        class="relative aspect-[16/7] w-full"
      >
        <img
          :src="backgroundUrl"
          :alt="room.realm?.name ?? displayName"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        >
        <div
          class="absolute inset-0 bg-gradient-to-b from-black/10 via-base-100/20 to-base-100"
          aria-hidden="true"
        />
      </div>

      <div class="p-8 md:p-10">
        <!-- Eyebrow -->
        <p
          class="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/40"
        >
          {{ t("chat.youreInvited") }}
        </p>

        <!-- Room hero -->
        <div class="mt-6 flex flex-col items-center text-center">
          <div class="avatar">
            <div
              v-if="avatarUrl"
              class="h-20 w-20 rounded-2xl"
            >
              <img
                :src="avatarUrl"
                :alt="displayName"
                class="rounded-2xl"
                loading="lazy"
                decoding="async"
              >
            </div>
            <div
              v-else
              class="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-content"
            >
              {{ getInitials(displayName) }}
            </div>
          </div>

          <h1 class="mt-4 text-2xl font-black tracking-tight">
            {{ displayName }}
          </h1>

          <p
            v-if="room.description"
            class="mt-2 line-clamp-2 text-sm leading-relaxed text-base-content/60"
          >
            {{ room.description }}
          </p>
        </div>

        <!-- Realm chip + members -->
        <div
          v-if="realm"
          class="mb-8 mt-6 flex flex-col items-center gap-6"
        >
          <NuxtLink
            :to="`/realms/${realm.slug}`"
            class="inline-flex items-center gap-2 rounded-full border border-base-content/10 bg-base-200/70 px-3 py-1.5 text-xs font-medium text-base-content/70 transition-colors hover:border-primary/30 hover:bg-base-200"
            :aria-label="`${realm.name} ${t('chat.openRealm')}`"
          >
            <img
              v-if="realm.picture"
              :src="getFileUrl(realm.picture.id)"
              :alt="realm.name"
              class="h-4 w-4 rounded-full"
              loading="lazy"
              decoding="async"
            >
            <span
              v-else
              class="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary"
            >
              {{ getInitials(realm.name) }}
            </span>
            {{ realm.name }}
          </NuxtLink>

          <!-- Avatar stack -->
          <div class="flex items-center gap-2.5">
            <div
              v-if="visibleRealmMemberAvatars.length > 0"
              class="flex -space-x-2"
            >
              <img
                v-for="m in visibleRealmMemberAvatars"
                :key="m.id"
                :src="m.url"
                :alt="m.name"
                :title="m.name"
                class="h-8 w-8 rounded-full border-2 border-base-100 object-cover"
                loading="lazy"
                decoding="async"
              >
              <span
                v-if="hiddenRealmMemberCount > 0"
                class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-base-100 bg-base-200 text-[11px] font-semibold text-base-content/60"
              >
                +{{ hiddenRealmMemberCount }}
              </span>
            </div>
            <span
              class="inline-flex items-center gap-1.5 text-xs font-medium text-base-content/60"
            >
              <IconUsers class="h-3.5 w-3.5" />
              {{ memberCount }}
            </span>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="error"
          class="mt-5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {{ error }}
        </div>

        <!-- Action -->
        <div class="mt-8">
          <button
            type="button"
            class="btn btn-primary btn-lg w-full"
            :disabled="actionBusy || !appDeepLink"
            @click="openChat"
          >
            <IconLoader
              v-if="actionBusy"
              class="h-4 w-4 animate-spin"
            />
            <IconExternalLink
              v-else
              class="h-4 w-4"
            />
            {{
              realm && !isDirect
                ? isMember
                  ? t("chat.openInApp")
                  : t("chat.joinRealmToOpen")
                : t("chat.openInApp")
            }}
          </button>
          <p
            v-if="realm && !isDirect && !isMember"
            class="mt-3 text-center text-xs text-base-content/50"
          >
            {{ t("chat.joinHint", { name: realm.name }) }}
          </p>
          <p
            v-else-if="realm && !isDirect && isMember"
            class="mt-3 text-center text-xs text-base-content/50"
          >
            {{ t("chat.alreadyJoined") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
