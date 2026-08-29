<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center px-4">
    <!-- Not Found State -->
    <div
      v-if="notFound"
      class="w-full max-w-md rounded-box bg-base-100 p-8 text-center shadow-sm"
    >
      <IconUsers class="mx-auto text-base-content/50 w-9 h-9" />
      <h1 class="mt-3 text-xl font-black">{{ t("realms.notFound") }}</h1>
    </div>

    <!-- Error State -->
    <div
      v-else-if="!realm"
      class="w-full max-w-md rounded-box bg-base-100 p-8 shadow-sm"
    >
      <div class="alert alert-error">
        <span>{{ error || t("realms.failedToLoadInvite") }}</span>
      </div>
    </div>

    <!-- Invite Card -->
    <div
      v-else
      class="w-full max-w-lg overflow-hidden rounded-box bg-base-100 shadow-sm"
    >
      <!-- Banner -->
      <div class="h-28 w-full bg-base-200">
        <FileImage
          v-if="bgUrl"
          :file="bgUrl"
          :alt="`${realm.name} background`"
          class="h-full w-full object-cover"
        />
      </div>

      <div class="p-6 md:p-8">
        <p
          class="mb-3 text-xs font-semibold tracking-[0.2em] text-base-content/60 uppercase"
        >
          {{ t("realms.youreInvited") }}
        </p>

        <!-- Realm Info -->
        <div class="mb-6 flex items-center gap-3">
          <div v-if="avatarUrl" class="avatar">
            <div
              class="h-14 w-14 rounded-box ring ring-base-300 ring-offset-2 ring-offset-base-100"
            >
              <FileImage :file="avatarUrl" :alt="realm.name" />
            </div>
          </div>
          <div v-else class="avatar avatar-placeholder">
            <div
              class="h-14 w-14 rounded-box bg-primary text-primary-content ring ring-base-300 ring-offset-2 ring-offset-base-100"
            >
              <span class="text-base font-semibold">{{
                getInitials(realm.name)
              }}</span>
            </div>
          </div>
          <div class="min-w-0">
            <p class="text-sm text-base-content/60">{{ t("realms.joinTheRealm") }}</p>
            <h1 class="truncate text-2xl font-black">{{ realm.name }}</h1>
            <p class="truncate text-sm text-base-content/60">
              @{{ realm.slug }}
            </p>
          </div>
        </div>

        <!-- Description -->
        <p v-if="realm.description" class="mb-4 text-sm text-base-content/80">
          {{ realm.description }}
        </p>

        <!-- Badges -->
        <div class="mb-3 flex flex-wrap gap-2">
          <span class="badge gap-1 border-info/30 bg-info/15 text-info">
            <IconUsers class="w-3 h-3" />
            <span v-if="realm.isCommunity">{{ t("realms.community") }}</span>
            <span v-else>{{ t("realms.organization") }}</span>
          </span>
          <span
            :class="`badge gap-1 ${
              realm.isPublic
                ? 'border-success/30 bg-success/15 text-success'
                : 'border-warning/30 bg-warning/20 text-warning'
            }`"
          >
            <IconGlobe v-if="realm.isPublic" class="w-3 h-3" />
            <IconLock v-else class="w-3 h-3" />
            <span v-if="realm.isPublic">{{ t("realms.realmPublic") }}</span>
            <span v-else>{{ t("realms.realmPrivate") }}</span>
          </span>
        </div>

        <!-- Error -->
        <div v-if="error" class="mb-4 alert alert-error">
          <span>{{ error }}</span>
        </div>

        <!-- Actions -->
        <button
          v-if="isMember"
          class="btn w-full btn-success"
          @click="navigateTo(`/realms/${realm.slug}`)"
        >
          <IconCheck class="w-4 h-4" />
          {{ t("realms.openRealm") }}
        </button>
        <button
          v-else
          class="btn w-full btn-primary"
          :disabled="isJoining || isCheckingMembership"
          @click="joinRealm"
        >
          <IconLoader
            v-if="isJoining || isCheckingMembership"
            class="w-4 h-4 animate-spin"
          />
          <IconUserPlus v-else class="w-4 h-4" />
          {{ t("realms.joinRealm") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetchRealm, apiFetch } from "~/utils/api";
import type { Realm } from "~/types/realm";
import {
  IconUsers,
  IconGlobe,
  IconLock,
  IconCheck,
  IconLoader,
  IconUserPlus,
} from "#components";

definePageMeta({ layout: false });

const { t } = useI18n();

defineOgImage('UniOgImage', { title: t("realms.inviteSeoTitle"), description: t("realms.inviteSeoDescription") })

useSolarSeo({
    title: t("realms.inviteSeoTitle"),
    description: t("realms.inviteSeoDescription"),
});

const route = useRoute();
const realmSlug = computed(() => route.params.slug as string);

const realm = ref<Realm | null>(null);
const notFound = ref(false);
const error = ref<string | null>(null);
const isJoining = ref(false);
const isCheckingMembership = ref(false);
const isMember = ref(false);

const bgUrl = computed(() => realm.value?.background ?? null);
const avatarUrl = computed(() => realm.value?.picture ?? null);

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

async function checkMembership() {
  if (!realm.value?.slug || isCheckingMembership.value) return;
  isCheckingMembership.value = true;
  try {
    await apiFetch(
      `/passport/realms/${encodeURIComponent(realm.value.slug)}/members/me`,
    );
    isMember.value = true;
  } catch {
    isMember.value = false;
  } finally {
    isCheckingMembership.value = false;
  }
}

async function joinRealm() {
  if (!realm.value?.slug || isJoining.value) return;
  isJoining.value = true;
  error.value = null;
  try {
    await apiFetch(
      `/passport/realms/${encodeURIComponent(realm.value.slug)}/members/me`,
      {
        method: "POST",
      },
    );
    isMember.value = true;
    navigateTo(`/realms/${realm.value.slug}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("realms.failedToJoinRealm");
  } finally {
    isJoining.value = false;
  }
}

onMounted(async () => {
  try {
    const data = await fetchRealm(realmSlug.value);
    realm.value = data;
    await checkMembership();
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      notFound.value = true;
    } else {
      error.value =
        err instanceof Error ? err.message : t("realms.failedToLoadInvite");
    }
  }
});
</script>
