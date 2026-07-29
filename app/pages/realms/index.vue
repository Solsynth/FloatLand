<template>
  <NuxtLayout name="app">
    <div class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6">
      <div class="min-w-0">
        <!-- Header -->
        <div
          class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <h1 class="text-xl font-bold sm:text-2xl">{{ t("realms.title") }}</h1>
            <p class="text-sm text-base-content/50">{{ t("realms.subtitle") }}</p>
          </div>
          <div class="flex items-center gap-2">
            <div
              v-if="auth.isAuthenticated.value && realms.length > 0"
              class="join rounded-box bg-base-200 p-0.5"
            >
              <button
                type="button"
                class="btn btn-sm join-item btn-ghost"
                :class="{ 'bg-base-200': displayMode === 'card' }"
                :title="t('common.gridView')"
                @click="setDisplayMode('card')"
              >
                <IconLayoutGrid class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn btn-sm join-item btn-ghost"
                :class="{ 'bg-base-200': displayMode === 'list' }"
                :title="t('common.listView')"
                @click="setDisplayMode('list')"
              >
                <IconList class="h-4 w-4" />
              </button>
            </div>
            <button
              v-if="auth.isAuthenticated.value"
              type="button"
              class="btn btn-primary btn-sm"
              @click="showCreateModal = true"
            >
              <IconPlus class="h-4 w-4" />
              {{ t("realms.createRealm") }}
            </button>
          </div>
        </div>

        <!-- Auth required -->
        <div
          v-if="requiresAuth || !auth.isAuthenticated.value"
          class="overflow-hidden rounded-box bg-base-100"
        >
          <div class="flex flex-col items-center gap-3 px-4 py-14 text-center">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-base-200"
            >
              <IconLogIn class="h-6 w-6 text-base-content/40" />
            </div>
            <p class="text-sm font-medium text-base-content/75">
              {{ t("realms.signInToView") }}
            </p>
            <p class="max-w-sm text-xs leading-relaxed text-base-content/45">
              {{ t("realms.signInToViewDesc") }}
            </p>
            <NuxtLink to="/auth/login" class="btn btn-primary btn-sm mt-1">
              <IconLogIn class="h-4 w-4" />
              {{ t("nav.signIn") }}
            </NuxtLink>
          </div>
        </div>

        <!-- Loading -->
        <div
          v-else-if="status === 'pending' && realms.length === 0"
          class="flex justify-center py-16"
        >
          <ConfuseSpinner :message="t('realms.loading')" />
        </div>

        <!-- Error -->
        <div
          v-else-if="error"
          class="flex flex-col items-center gap-3 rounded-box bg-base-100 px-4 py-12 text-center"
        >
          <IconAlertCircle class="h-5 w-5 text-error" />
          <p class="text-sm text-base-content/70">{{ error }}</p>
        </div>

        <!-- Realms list shell -->
        <div
          v-else-if="realms.length > 0"
          class="overflow-hidden rounded-box bg-base-100"
        >
          <!-- Card grid -->
          <div
            v-if="displayMode === 'card'"
            class="grid gap-3 p-3 sm:grid-cols-2 sm:p-4"
          >
            <RealmListTile
              v-for="realm in realms"
              :key="realm.id"
              :realm="realm"
            />
          </div>

          <!-- Compact list (Flutter RealmTile) -->
          <div v-else class="space-y-2 p-3 sm:p-4">
            <RealmListRow
              v-for="realm in realms"
              :key="realm.id"
              :realm="realm"
            />
          </div>
        </div>

        <!-- Empty -->
        <div
          v-else
          class="overflow-hidden rounded-box bg-base-100"
        >
          <div class="flex flex-col items-center gap-3 px-4 py-14 text-center">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-base-200"
            >
              <IconUsers class="h-6 w-6 text-base-content/40" />
            </div>
            <p class="text-sm font-medium text-base-content/75">
              {{ t("realms.emptyTitle") }}
            </p>
            <p class="max-w-sm text-xs leading-relaxed text-base-content/45">
              {{ t("realms.emptyDesc") }}
            </p>
            <button
              type="button"
              class="btn btn-primary btn-sm mt-1"
              @click="showCreateModal = true"
            >
              <IconPlus class="h-4 w-4" />
              {{ t("realms.createYourFirst") }}
            </button>
          </div>
        </div>
      </div>

      <aside class="hidden w-full self-start sticky top-4 xl:block">
        <RightSidebar />
      </aside>

      <RealmCreateModal
        v-model:open="showCreateModal"
        @created="handleRealmCreated"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Realm } from "~/types/realm";
import { fetchRealms } from "~/utils/api";
import {
  IconPlus,
  IconLogIn,
  IconAlertCircle,
  IconUsers,
  IconLayoutGrid,
  IconList,
} from "#components";

const { t } = useI18n();

defineOgImage("UniOgImage", {
  title: t("realms.title"),
  description: t("realms.seoDescription"),
});

useSolarSeo({
  title: t("realms.title"),
  description: t("realms.seoDescription"),
  breadcrumbs: [
    { name: "Home", item: "https://solian.app" },
    { name: t("realms.title"), item: "https://solian.app/realms" },
  ],
});

const auth = useAuth();
const realms = useState<Realm[]>("realms-list", () => []);
const showCreateModal = ref(false);
const requiresAuth = ref(false);

const DISPLAY_KEY = "realm_display_mode";
const displayMode = ref<"card" | "list">("card");

function loadDisplayMode() {
  if (!import.meta.client) return;
  try {
    const stored = localStorage.getItem(DISPLAY_KEY);
    if (stored === "list" || stored === "card") displayMode.value = stored;
  } catch {
    // ignore
  }
}

function setDisplayMode(mode: "card" | "list") {
  displayMode.value = mode;
  try {
    localStorage.setItem(DISPLAY_KEY, mode);
  } catch {
    // ignore
  }
}

onMounted(loadDisplayMode);

const { data: initialData, status, error } = await useAsyncData(
  "realms-list-fetch",
  async () => {
    if (!auth.isAuthenticated.value) {
      requiresAuth.value = true;
      return [] as Realm[];
    }
    try {
      return await fetchRealms();
    } catch (err: unknown) {
      if (
        (err as Error)?.message?.includes("401") ||
        (err as Error)?.message?.includes("Unauthorized")
      ) {
        requiresAuth.value = true;
        return [] as Realm[];
      }
      throw err;
    }
  },
  {
    default: () => [] as Realm[],
    server: false,
  },
);

watch(
  initialData,
  (data) => {
    if (data) realms.value = data;
  },
  { immediate: true },
);

function handleRealmCreated(newRealm: Realm) {
  realms.value.unshift(newRealm);
  navigateTo(`/realms/${newRealm.slug}`);
}
</script>
