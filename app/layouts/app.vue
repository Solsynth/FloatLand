<template>
  <div class="min-h-screen bg-base-200">
    <div class="app-shell mx-auto max-w-7xl">
      <!-- Desktop Layout -->
      <div
        class="hidden lg:grid lg:gap-6 lg:px-4"
        :class="
          collapsed
            ? 'lg:grid-cols-[5rem_1fr]'
            : 'lg:grid-cols-[16rem_1fr]'
        "
      >
        <aside class="app-sidebar">
          <Sidebar />
        </aside>
        <main class="min-h-screen py-4">
          <slot />
        </main>
      </div>

      <!-- Mobile Layout -->
      <div class="lg:hidden flex flex-col min-h-screen">
        <!-- Mobile Header -->
        <header
          class="fixed top-0 left-0 right-0 z-50 bg-base-100 shadow-sm"
        >
          <div class="mx-auto max-w-2xl px-4">
            <div class="flex h-14 items-center justify-between">
              <!-- Left: Home -->
              <NuxtLink to="/" class="btn btn-circle btn-ghost btn-sm">
                <IconHome class="w-5 h-5" />
              </NuxtLink>

              <!-- Center: Logo -->
              <NuxtLink to="/">
                <img src="/favicon.png" alt="Solar Network" class="w-8 h-8" />
              </NuxtLink>

              <!-- Right: Menu -->
              <div ref="menuContainer" class="relative flex items-center gap-1">
                <button
                  class="btn btn-circle btn-ghost btn-sm"
                  aria-label="Menu"
                  @click="toggleMenu"
                >
                  <IconMenu class="w-5 h-5" />
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="menuOpen"
                  class="app-mobile-menu absolute top-full right-0 z-50 mt-2 w-56 py-2"
                >
                  <template v-if="isAuthenticated && user">
                    <NuxtLink
                      v-for="item in navItems"
                      :key="item.to"
                      :to="item.to"
                      class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200"
                      @click="closeMenu"
                    >
                      <component
                        :is="item.icon"
                        class="w-5 h-5 text-base-content/70"
                      />
                      <span class="font-medium">{{ item.label }}</span>
                    </NuxtLink>

                    <!-- Backstage section -->
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-base-200"
                      @click="backstageOpen = !backstageOpen"
                    >
                      <component
                        :is="backstageEntry.icon"
                        class="w-5 h-5 text-base-content/70"
                      />
                      <span class="font-medium">{{
                        t(backstageEntry.labelKey)
                      }}</span>
                    </button>
                    <div v-if="backstageOpen" class="pb-1">
                      <NuxtLink
                        v-for="item in backstageNavItems"
                        :key="item.to"
                        :to="item.to"
                        class="flex items-center gap-3 py-2.5 pe-4 ps-11 transition-colors hover:bg-base-200"
                        @click="closeMenu"
                      >
                        <component
                          :is="item.icon"
                          class="w-4 h-4 text-base-content/60"
                        />
                        <span class="text-sm font-medium">{{
                          item.label
                        }}</span>
                      </NuxtLink>
                    </div>

                    <div class="mt-2 px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div v-if="avatarUrl" class="avatar">
                          <div class="w-9 rounded-full">
                            <img :src="avatarUrl" :alt="user.name" />
                          </div>
                        </div>
                        <div v-else class="avatar avatar-placeholder">
                          <div
                            class="w-9 rounded-full bg-primary text-primary-content"
                          >
                            <span class="text-xs font-medium">
                              {{ (user.name || "?").slice(0, 2).toUpperCase() }}
                            </span>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <p class="truncate font-medium">{{ displayName }}</p>
                          <p class="truncate text-sm text-base-content/60">
                            @{{ user.name }}
                          </p>
                        </div>
                      </div>
                    </div>
                    <NuxtLink
                      to="/accounts/me"
                      class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200"
                      @click="closeMenu"
                    >
                      <IconUser class="w-5 h-5 text-base-content/70" />
                      <span class="font-medium">{{ t("nav.account") }}</span>
                    </NuxtLink>
                    <NuxtLink
                      to="/accounts/me/settings"
                      class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200"
                      @click="closeMenu"
                    >
                      <IconSettings class="w-5 h-5 text-base-content/70" />
                      <span class="font-medium">{{ t("nav.settings") }}</span>
                    </NuxtLink>
                    <button
                      class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-base-200"
                      @click="handleLogout"
                    >
                      <IconLogOut class="w-5 h-5 text-base-content/70" />
                      <span class="font-medium">{{ t("nav.logout") }}</span>
                    </button>
                  </template>
                  <template v-else>
                    <NuxtLink
                      v-for="item in navItems"
                      :key="item.to"
                      :to="item.to"
                      class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200"
                      @click="closeMenu"
                    >
                      <component
                        :is="item.icon"
                        class="w-5 h-5 text-base-content/70"
                      />
                      <span class="font-medium">{{ item.label }}</span>
                    </NuxtLink>

                    <!-- Backstage section -->
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-base-200"
                      @click="backstageOpen = !backstageOpen"
                    >
                      <component
                        :is="backstageEntry.icon"
                        class="w-5 h-5 text-base-content/70"
                      />
                      <span class="font-medium">{{
                        t(backstageEntry.labelKey)
                      }}</span>
                    </button>
                    <div v-if="backstageOpen" class="pb-1">
                      <NuxtLink
                        v-for="item in backstageNavItems"
                        :key="item.to"
                        :to="item.to"
                        class="flex items-center gap-3 py-2.5 pe-4 ps-11 transition-colors hover:bg-base-200"
                        @click="closeMenu"
                      >
                        <component
                          :is="item.icon"
                          class="w-4 h-4 text-base-content/60"
                        />
                        <span class="text-sm font-medium">{{
                          item.label
                        }}</span>
                      </NuxtLink>
                    </div>

                    <div class="divider my-1" />
                    <NuxtLink
                      to="/auth/login"
                      class="flex items-center gap-3 px-4 py-3 text-primary transition-colors hover:bg-base-200"
                      @click="closeMenu"
                    >
                      <IconLogIn class="w-5 h-5" />
                      <span class="font-medium">{{ t("nav.signIn") }}</span>
                    </NuxtLink>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Mobile Main Content -->
        <main class="flex-1 px-4 py-3 pt-[4.5rem]">
          <slot />
        </main>
      </div>

      <!-- Floating Compose Button (Mobile) -->
      <button
        class="btn btn-circle btn-primary fixed right-5 bottom-5 z-40 h-12 w-12 shadow-sm lg:hidden"
        @click="openCompose"
      >
        <IconPlus class="w-6 h-6" />
      </button>

      <!-- Lightbox Viewer -->
      <ComposeDialog
        :open="composeOpen"
        @close="composeOpen = false"
        @submit="handleComposeSubmit"
      />

      <!-- Lightbox Viewer -->
      <LightboxViewer />

      <!-- Notification Drawer -->
      <NotificationDrawer />

      <!-- WebSocket Status -->
      <WebSocketStatus />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFileUrl } from "~/utils/files";
import {
  IconHome,
  IconMenu,
  IconUser,
  IconSettings,
  IconLogOut,
  IconLogIn,
  IconPlus,
} from "#components";

const { t } = useI18n();
const { collapsed } = useSidebar();

const auth = useAuth();
const { isAuthenticated, user } = auth;

const menuOpen = ref(false);
const backstageOpen = ref(false);
const menuContainer = ref<HTMLElement | null>(null);
const composeOpen = ref(false);

const {
  navItems: mainNavItems,
  backstageItems,
  backstageEntry,
} = useMainNav();

const navItems = computed(() =>
  mainNavItems.value.map((item) => ({
    to: item.href,
    label: t(item.labelKey),
    icon: item.icon,
  })),
);

const backstageNavItems = computed(() =>
  backstageItems.value.map((item) => ({
    to: item.href,
    label: t(item.labelKey),
    icon: item.icon,
  })),
);

const displayName = computed(() => user.value?.nick || user.value?.name || "");
const avatarUrl = computed(() => getFileUrl(user.value?.profile?.picture?.id));

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  if (!menuOpen.value) {
    backstageOpen.value = false;
  }
}

function closeMenu() {
  menuOpen.value = false;
  backstageOpen.value = false;
}

function handleLogout() {
  auth.logout();
  menuOpen.value = false;
}

function openCompose() {
  composeOpen.value = true;
}

function handleComposeSubmit() {
  composeOpen.value = false;
}

function handleOpenComposeEvent() {
  composeOpen.value = true;
}

function handleClickOutside(event: MouseEvent) {
  if (
    menuContainer.value &&
    !menuContainer.value.contains(event.target as Node)
  ) {
    menuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("open-compose", handleOpenComposeEvent);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("open-compose", handleOpenComposeEvent);
});
</script>

<style scoped>
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
