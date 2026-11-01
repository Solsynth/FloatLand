<template>
  <NuxtLayout name="app">
    <div class="min-w-0">
      <!-- Header -->
      <PageHeader :title="t('realms.title')" :description="t('realms.subtitle')">
        <template #actions>
          <div
            v-if="auth.isAuthenticated.value && realms.length > 0"
            class="flex items-center gap-0.5 rounded-card bg-base-200/60 p-1"
          >
            <button
              type="button"
              class="btn btn-xs px-1.5"
              :class="displayMode === 'card' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
              :title="t('common.gridView')"
              :aria-pressed="displayMode === 'card'"
              @click="setDisplayMode('card')"
            >
              <IconLayoutGrid class="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="btn btn-xs px-1.5"
              :class="displayMode === 'list' ? 'bg-base-300 text-base-content' : 'btn-quiet'"
              :title="t('common.listView')"
              :aria-pressed="displayMode === 'list'"
              @click="setDisplayMode('list')"
            >
              <IconList class="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <button
            v-if="auth.isAuthenticated.value"
            type="button"
            class="btn btn-primary btn-xs"
            @click="showCreateModal = true"
          >
            <IconPlus class="size-3.5" aria-hidden="true" />
            {{ t("realms.createRealm") }}
          </button>
        </template>
      </PageHeader>

      <!-- Auth required -->
      <div
        v-if="requiresAuth || !auth.isAuthenticated.value"
        class="plate overflow-hidden"
      >
        <div class="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div
            class="grid size-10 place-items-center rounded-chip bg-base-200/70"
          >
            <IconLogIn class="size-5 text-faint" aria-hidden="true" />
          </div>
          <p class="text-[13px] font-semibold text-base-content">
            {{ t("realms.signInToView") }}
          </p>
          <p class="voice max-w-sm text-[12.5px]">
            {{ t("realms.signInToViewDesc") }}
          </p>
          <a :href="signInUrl('/realms')" class="btn btn-primary btn-xs mt-1">
            <IconLogIn class="size-3.5" aria-hidden="true" />
            {{ t("nav.signIn") }}
          </a>
        </div>
      </div>

      <!-- Loading -->
      <ConsolePanel v-else-if="status === 'pending' && realms.length === 0" flush>
        <LoadingSkeleton variant="rows" :rows="5" />
      </ConsolePanel>

      <!-- Error -->
      <div
        v-else-if="error"
        class="plate flex flex-col items-center gap-3 px-6 py-12 text-center"
      >
        <IconAlertCircle class="size-4 text-error" aria-hidden="true" />
        <p class="text-sm text-base-content/70">{{ error }}</p>
      </div>

      <!-- Realms list shell -->
      <div
        v-else-if="realms.length > 0"
        class="plate overflow-hidden"
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
        class="plate overflow-hidden"
      >
        <div class="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div
            class="grid size-10 place-items-center rounded-chip bg-base-200/70"
          >
            <IconUsers class="size-5 text-faint" aria-hidden="true" />
          </div>
          <p class="text-[13px] font-semibold text-base-content">
            {{ t("realms.emptyTitle") }}
          </p>
          <p class="voice max-w-sm text-[12.5px]">
            {{ t("realms.emptyDesc") }}
          </p>
          <button
            type="button"
            class="btn btn-primary btn-xs mt-1"
            @click="showCreateModal = true"
          >
            <IconPlus class="size-3.5" aria-hidden="true" />
            {{ t("realms.createYourFirst") }}
          </button>
        </div>
      </div>
      <RealmCreateModal
        v-model:open="showCreateModal"
        @created="handleRealmCreated"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Realm } from "~/types/realm";
import { fetchRealms, signInUrl } from "~/utils/api";
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
