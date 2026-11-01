<template>
  <div class="flex min-h-dvh flex-col bg-base-100">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-chip focus:bg-base-300 focus:px-3 focus:py-2 focus:text-xs"
    >
      {{ t("nav.skipToContent") }}
    </a>

    <!--
      The header is the whole persistent chrome: the mark names the product,
      the tab strip names the shelf you are on, and the right rail holds the two
      things a reader actually needs at any scroll position — search and the
      account. Everything else lives on the page it belongs to.
    -->
    <header class="sticky top-0 z-40 border-b border-line bg-base-100/85 backdrop-blur">
      <div
        class="mx-auto flex h-13 w-full max-w-6xl items-center gap-5 px-page sm:px-page-wide"
      >
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2.5" aria-label="Solar Network">
          <span class="brand-mark h-[21px] w-[21px] shrink-0" aria-hidden="true" />
          <span class="text-[12.5px] font-bold tracking-[0.14em] text-base-content">
            EXPLORE
          </span>
        </NuxtLink>

        <nav
          v-if="showNav"
          class="scrollbar-none -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1"
          :aria-label="t('nav.primary')"
        >
          <NuxtLink
            v-for="item in items"
            :key="item.href"
            :to="item.href"
            class="flex shrink-0 items-center gap-1.5 rounded-control px-2.5 py-1.5 text-2xs tracking-[0.02em] transition-colors"
            :class="
              isActive(item.match)
                ? 'bg-base-300 text-base-content'
                : 'text-faint hover:bg-base-200 hover:text-dim'
            "
            :aria-current="isActive(item.match) ? 'page' : undefined"
          >
            <component :is="item.icon" class="size-3.5 shrink-0" aria-hidden="true" />
            {{ t(item.labelKey) }}
          </NuxtLink>
        </nav>
        <div v-else class="flex-1" />

        <div class="flex shrink-0 items-center gap-1.5">
          <NuxtLink
            to="/search"
            class="btn btn-quiet btn-xs px-1.5"
            :title="t('common.search')"
            :aria-label="t('common.search')"
            :class="route.path.startsWith('/search') ? 'bg-base-300 text-base-content' : ''"
          >
            <IconSearch class="size-4" aria-hidden="true" />
          </NuxtLink>

          <button
            type="button"
            class="btn btn-quiet btn-xs px-1.5"
            :title="isDark ? t('nav.switchToLight') : t('nav.switchToDark')"
            :aria-label="isDark ? t('nav.switchToLight') : t('nav.switchToDark')"
            @click="toggle()"
          >
            <IconSun v-if="isDark" class="size-4" aria-hidden="true" />
            <IconMoon v-else class="size-4" aria-hidden="true" />
          </button>

          <NotificationBell v-if="isAuthenticated" />

          <div v-if="isAuthenticated && user" ref="menuRoot" class="relative">
            <button
              type="button"
              class="flex items-center rounded-control p-0.5 transition-colors hover:bg-base-200"
              :title="displayName"
              :aria-label="displayName"
              aria-haspopup="menu"
              :aria-expanded="menuOpen"
              @click="menuOpen = !menuOpen"
            >
              <UserAvatar
                :picture-id="user.profile?.picture?.id"
                :name="displayName"
                size="sm"
                class="pointer-events-none"
              />
            </button>

            <ul
              v-if="menuOpen"
              class="absolute right-0 top-full z-50 mt-2 w-48 rounded-card border border-line bg-base-200 p-1.5 text-xs"
              role="menu"
            >
              <li class="border-b border-line-soft px-2.5 pb-2 pt-1.5">
                <p class="truncate font-semibold text-base-content">{{ displayName }}</p>
                <p class="truncate text-2xs text-faint">@{{ user.name }}</p>
              </li>
              <li v-for="entry in accountMenu" :key="entry.to">
                <NuxtLink
                  :to="entry.to"
                  class="flex items-center gap-2 rounded-control px-2.5 py-1.5 text-dim transition-colors hover:bg-base-300 hover:text-base-content"
                  role="menuitem"
                  @click="menuOpen = false"
                >
                  <component :is="entry.icon" class="size-3.5 shrink-0" aria-hidden="true" />
                  {{ t(entry.labelKey) }}
                </NuxtLink>
              </li>
              <li class="mt-1 border-t border-line-soft pt-1">
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-control px-2.5 py-1.5 text-dim transition-colors hover:bg-error/10 hover:text-error"
                  role="menuitem"
                  @click="handleLogout"
                >
                  <IconLogOut class="size-3.5 shrink-0" aria-hidden="true" />
                  {{ t("nav.logout") }}
                </button>
              </li>
            </ul>
          </div>

          <a v-else :href="signInHref" class="btn btn-primary btn-xs">
            {{ t("nav.signIn") }}
          </a>
        </div>
      </div>
    </header>

    <main id="main" class="mx-auto w-full max-w-6xl flex-1 px-page py-6 sm:px-page-wide sm:py-8">
      <slot />
    </main>

    <footer class="mx-auto w-full max-w-6xl px-page pb-8 sm:px-page-wide">
      <div
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4 text-2xs text-faint"
      >
        <span>{{ t("sidebar.copyright", { year: currentYear }) }}</span>
        <nav class="flex flex-wrap items-center gap-x-4 gap-y-1" :aria-label="t('nav.footer')">
          <a
            v-for="link in legalLinks"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors hover:text-dim"
          >
            {{ t(link.labelKey) }}
          </a>
        </nav>
      </div>
    </footer>

    <LazyComposeDialog
      v-if="composeOpen"
      :open="composeOpen"
      @close="composeOpen = false"
      @submit="composeOpen = false"
    />
    <LazyLightboxViewer v-if="lightboxState.isOpen" />
    <LazyNotificationDrawer v-if="notificationDrawerOpen" />
    <WebSocketStatus />
  </div>
</template>

<script setup lang="ts">
import {
  IconSearch,
  IconSun,
  IconMoon,
  IconLogOut,
  IconUser,
} from "#components";
import type { Component } from "vue";
import { signInUrl } from "~/utils/api";

const { t } = useI18n();
const route = useRoute();

const auth = useAuth();
const { isAuthenticated, user } = auth;
const { items } = useMainNav();
const { isDark, toggle } = useTheme();

// Signing in happens on the console that owns the session; this app only sends
// the browser there and takes it back.
const signInHref = signInUrl("/");

const menuOpen = ref(false);
const menuRoot = ref<HTMLElement | null>(null);
const composeOpen = ref(false);

const { state: lightboxState } = useLightbox();
const { drawerOpen: notificationDrawerOpen } = useNotifications();

const displayName = computed(() => user.value?.nick || user.value?.name || "");

const currentYear = new Date().getFullYear();

/** The nav names reading surfaces only, so it is shown whenever a reader is
 * signed in — the explorer reads public content either way, and hiding the
 * shelf from a guest would leave the header with a lone mark. */
const showNav = computed(() => !route.path.startsWith("/auth/"));

interface AccountEntry {
  to: string;
  labelKey: string;
  icon: Component;
}

const accountMenu = computed<AccountEntry[]>(() => [
  { to: `/accounts/${user.value?.name ?? ""}`, labelKey: "nav.account", icon: IconUser },
]);

const legalLinks = [
  { href: "https://solsynth.dev/products-solar-network", labelKey: "sidebar.about" },
  { href: "https://solsynth.dev/legal/privacy-policy", labelKey: "sidebar.privacy" },
  { href: "https://solsynth.dev/legal/user-agreements", labelKey: "sidebar.terms" },
  { href: "https://kb.solsynth.dev/solar-network/", labelKey: "sidebar.help" },
];

const isActive = (match: string) =>
  route.path === match || route.path.startsWith(`${match}/`);

function closeMenuOutside(event: MouseEvent) {
  if (menuOpen.value && !menuRoot.value?.contains(event.target as Node)) menuOpen.value = false;
}

function handleLogout() {
  menuOpen.value = false;
  auth.logout();
  void navigateTo("/");
}

function handleOpenCompose() {
  composeOpen.value = true;
}

onMounted(() => {
  document.addEventListener("click", closeMenuOutside);
  window.addEventListener("open-compose", handleOpenCompose);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeMenuOutside);
  window.removeEventListener("open-compose", handleOpenCompose);
});

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  },
);
</script>
