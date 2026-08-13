<template>
  <div class="min-h-screen bg-base-200">
    <header
      class="sticky top-0 z-40 w-full border-b border-base-300 bg-base-100 shadow-sm"
    >
      <div class="navbar mx-auto min-h-16 max-w-7xl px-4 lg:px-6">
        <div class="navbar-start gap-1">
          <NuxtLink to="/" class="flex items-center gap-2" aria-label="Home">
            <img src="/favicon.png" alt="Solar Network" class="h-9 w-9" />
          </NuxtLink>
        </div>

        <nav class="navbar-center hidden lg:flex" aria-label="Primary">
          <ul class="menu menu-horizontal gap-1 p-0">
            <li
              v-for="group in navGroups"
              :key="group.key"
              class="dropdown dropdown-center"
            >
              <button
                type="button"
                class="gap-2"
                :class="isNavGroupActive(group) ? 'bg-primary/10 text-primary' : ''"
                aria-haspopup="menu"
              >
                <component :is="group.icon" class="h-4 w-4" />
                <span>{{ group.label }}</span>
              </button>
              <ul
                tabindex="0"
                class="menu dropdown-content z-50 mt-2 w-60 rounded-box border border-base-300 bg-base-100 text-base-content p-2 shadow-lg"
              >
                <li v-for="item in group.items" :key="item.to">
                  <NuxtLink
                    :to="item.to"
                    :class="isNavActive(item.to) ? 'bg-primary/10 text-primary' : ''"
                  >
                    <span class="relative">
                      <component :is="item.icon" class="h-4 w-4" />
                      <span
                        v-if="item.badge"
                        class="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-error-content"
                      >
                        {{ item.badge > 99 ? "99+" : item.badge }}
                      </span>
                    </span>
                    {{ item.label }}
                  </NuxtLink>
                </li>
              </ul>
            </li>
            <li>
              <NuxtLink
                :to="driveNavItem.to"
                class="gap-2"
                :class="isNavActive(driveNavItem.to) ? 'bg-primary/10 text-primary' : ''"
              >
                <component :is="driveNavItem.icon" class="h-4 w-4" />
                <span>{{ driveNavItem.label }}</span>
              </NuxtLink>
            </li>
            <li class="dropdown dropdown-end">
              <button
                type="button"
                class="gap-2"
                :class="isBackstageActive ? 'bg-primary/10 text-primary' : ''"
                aria-haspopup="menu"
              >
                <component :is="backstageEntry.icon" class="h-4 w-4" />
                <span>{{ t(backstageEntry.labelKey) }}</span>
              </button>
              <ul
                tabindex="0"
                class="menu dropdown-content z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-100 text-base-content p-2 shadow-lg"
              >
                <li v-for="item in backstageNavItems" :key="item.to">
                  <NuxtLink
                    :to="item.to"
                    :class="isNavActive(item.to) ? 'bg-primary/10 text-primary' : ''"
                  >
                    <component :is="item.icon" class="h-4 w-4" />
                    {{ item.label }}
                  </NuxtLink>
                </li>
              </ul>
            </li>
          </ul>
        </nav>

        <div class="navbar-end gap-1">
          <NotificationBell v-if="isAuthenticated && user" />

          <div v-if="isAuthenticated && user" class="dropdown dropdown-end hidden sm:block">
            <button
              type="button"
              class="btn btn-ghost h-auto min-h-10 gap-2 px-2"
              aria-haspopup="menu"
            >
              <div v-if="avatarUrl" class="avatar">
                <div class="w-8 rounded-full">
                  <img :src="avatarUrl" :alt="user.name" />
                </div>
              </div>
              <div v-else class="avatar avatar-placeholder">
                <div class="w-8 rounded-full bg-primary text-primary-content">
                  <span class="text-xs font-medium">
                    {{ (user.name || "?").slice(0, 2).toUpperCase() }}
                  </span>
                </div>
              </div>
              <span class="hidden max-w-32 truncate text-sm font-medium xl:inline">
                {{ displayName }}
              </span>
            </button>
            <ul
              tabindex="0"
              class="menu dropdown-content z-50 mt-2 w-52 gap-1 rounded-box border border-base-300 bg-base-100 text-base-content p-2 shadow-lg"
            >
              <li>
                <NuxtLink to="/accounts/me">
                  <IconUser class="h-4 w-4" />
                  {{ t("nav.account") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/workspaces">
                  <IconBriefcaseBusiness class="h-4 w-4" />
                  {{ t("nav.workspaces") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/wallets">
                  <IconWallet class="h-4 w-4" />
                  {{ t("nav.wallet") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pricing">
                  <IconCreditCard class="h-4 w-4" />
                  {{ t("nav.pricing") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/accounts/me/settings">
                  <IconSettings class="h-4 w-4" />
                  {{ t("nav.settings") }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tickets">
                  <IconTicket class="h-4 w-4" />
                  {{ t("nav.tickets") }}
                </NuxtLink>
              </li>
              <li>
                <button type="button" @click="handleLogout">
                  <IconLogOut class="h-4 w-4" />
                  {{ t("nav.logout") }}
                </button>
              </li>
</ul>
          </div>

          <NuxtLink
            v-else
            to="/auth/login"
            class="btn btn-ghost btn-sm hidden gap-2 sm:inline-flex"
          >
            <IconLogIn class="h-4 w-4" />
            {{ t("nav.signIn") }}
          </NuxtLink>

          <div class="lg:hidden">
            <button
              type="button"
              class="btn btn-ghost btn-circle btn-sm"
              aria-label="Menu"
              :aria-expanded="menuOpen"
              @click="toggleMenu"
            >
              <IconMenu class="h-5 w-5" />
            </button>

          </div>
        </div>
      </div>
    </header>
    <Transition name="drawer-fade">
      <div
        v-if="menuOpen"
        class="fixed inset-x-0 top-[4.0625rem] bottom-0 z-40 bg-black/40 lg:hidden"
        @click="closeMenu"
      />
    </Transition>
    <Transition name="drawer-slide">
      <aside
        v-if="menuOpen"
        class="fixed right-0 top-[4.0625rem] bottom-0 z-50 w-80 overflow-y-auto border-l border-base-300 bg-base-100 p-4 text-base-content shadow-xl scrollbar-none lg:hidden"
        @click.stop
      >
        <nav aria-label="Mobile" class="menu w-full p-0">
          <section v-for="group in navGroups" :key="group.key" class="mb-3">
            <div
              class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base font-semibold leading-6 text-base-content/70"
            >
              <span class="flex h-5 w-5 shrink-0 items-center justify-center">
                <component :is="group.icon" class="h-5 w-5" />
              </span>
              <span class="flex h-6 items-center leading-6">{{ group.label }}</span>
            </div>
            <ul class="menu ms-2 w-auto p-0">
              <li v-for="item in group.items" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="flex h-12 min-h-12 items-center gap-3 ps-12 pe-3 py-0 text-base leading-5"
                  :class="isNavActive(item.to) ? 'bg-primary/10 text-primary' : ''"
                  @click="closeMenu"
                >
                  <span class="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <component :is="item.icon" class="h-4 w-4" />
                    <span
                      v-if="item.badge"
                      class="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-error-content"
                    >
                      {{ item.badge > 99 ? "99+" : item.badge }}
                    </span>
                  </span>
                  <span class="flex h-5 items-center leading-5">{{ item.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </section>
          <NuxtLink
            :to="driveNavItem.to"
            class="mb-3 flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive(driveNavItem.to) ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <component :is="driveNavItem.icon" class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ driveNavItem.label }}</span>
          </NuxtLink>
          <section>
            <div
              class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base font-semibold leading-6 text-base-content/70"
            >
              <span class="flex h-5 w-5 shrink-0 items-center justify-center">
                <component :is="backstageEntry.icon" class="h-5 w-5" />
              </span>
              <span class="flex h-6 items-center leading-6">{{ t(backstageEntry.labelKey) }}</span>
            </div>
            <ul class="menu ms-2 w-auto p-0">
              <li v-for="item in backstageNavItems" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="flex h-12 min-h-12 items-center gap-3 ps-12 pe-3 py-0 text-base leading-5"
                  :class="isNavActive(item.to) ? 'bg-primary/10 text-primary' : ''"
                  @click="closeMenu"
                >
                  <span class="flex h-5 w-5 shrink-0 items-center justify-center">
                    <component :is="item.icon" class="h-4 w-4" />
                  </span>
                  <span class="flex h-5 items-center leading-5">{{ item.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </section>
        </nav>

        <div v-if="isAuthenticated && user" class="divider my-2" />
        <div
          v-if="isAuthenticated && user"
          class="flex items-center gap-3 px-3 py-2"
        >
          <div v-if="avatarUrl" class="avatar shrink-0">
            <div class="w-9 rounded-full">
              <img :src="avatarUrl" :alt="user.name" />
            </div>
          </div>
          <div v-else class="avatar avatar-placeholder shrink-0">
            <div class="w-9 rounded-full bg-primary text-primary-content">
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
        <ul v-if="isAuthenticated && user" class="menu w-full gap-1 p-0">
          <li>
            <NuxtLink to="/accounts/me" class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base leading-5" @click="closeMenu">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconUser class="h-5 w-5" /></span>
              <span class="flex h-5 items-center leading-5">{{ t("nav.account") }}</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/workspaces" class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base leading-5" @click="closeMenu">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconBriefcaseBusiness class="h-5 w-5" /></span>
              <span class="flex h-5 items-center leading-5">{{ t("nav.workspaces") }}</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/wallets" class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base leading-5" @click="closeMenu">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconWallet class="h-5 w-5" /></span>
              <span class="flex h-5 items-center leading-5">{{ t("nav.wallet") }}</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/pricing" class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base leading-5" @click="closeMenu">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconCreditCard class="h-5 w-5" /></span>
              <span class="flex h-5 items-center leading-5">{{ t("nav.pricing") }}</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/accounts/me/settings" class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base leading-5" @click="closeMenu">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconSettings class="h-5 w-5" /></span>
              <span class="flex h-5 items-center leading-5">{{ t("nav.settings") }}</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/tickets" class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base leading-5" @click="closeMenu">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconTicket class="h-5 w-5" /></span>
              <span class="flex h-5 items-center leading-5">{{ t("nav.tickets") }}</span>
            </NuxtLink>
          </li>
          <li>
            <button type="button" class="flex h-12 min-h-12 items-center gap-3 px-3 py-0 text-base leading-5" @click="handleLogout">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconLogOut class="h-5 w-5" /></span>
              <span class="flex h-5 items-center leading-5">{{ t("nav.logout") }}</span>
            </button>
          </li>
        </ul>
        <NuxtLink
          v-else
          to="/auth/login"
          class="mt-2 flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5 text-primary hover:bg-base-200"
          @click="closeMenu"
        >
          <span class="flex h-5 w-5 shrink-0 items-center justify-center"><IconLogIn class="h-5 w-5" /></span>
          <span class="flex h-5 items-center leading-5">{{ t("nav.signIn") }}</span>
        </NuxtLink>
      </aside>
    </Transition>
    <div class="app-shell mx-auto max-w-7xl">

      <main class="min-h-screen px-4 py-4 lg:px-6">
        <slot />
      </main>

      <LazyComposeDialog
        v-if="composeOpen"
        :open="composeOpen"
        @close="composeOpen = false"
        @submit="handleComposeSubmit"
      />

      <LazyLightboxViewer v-if="lightboxState.isOpen" />
      <LazyNotificationDrawer v-if="notificationDrawerOpen" />
      <WebSocketStatus />
      <ClientOnly>
        <LazyOnboardingModal />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFileUrl } from "~/utils/files";
import {
  IconHardDrive,
  IconBriefcaseBusiness,
  IconCreditCard,
  IconCompass,
  IconMenu,
  IconTicket,
  IconUser,
  IconSettings,
  IconLogOut,
  IconLogIn,
  IconSearch,
  IconTags,
} from "#components";
type TopbarNavItem = {
  to: string;
  label: string;
  icon: any;
  badge?: number | null;
};
type TopbarNavGroup = {
  key: string;
  label: string;
  icon: any;
  items: TopbarNavItem[];
};

const { t } = useI18n();
const route = useRoute();

const auth = useAuth();
const { isAuthenticated, user } = auth;

const menuOpen = ref(false);
const composeOpen = ref(false);

const {
  navItems: mainNavItems,
  backstageItems,
  backstageEntry,
} = useMainNav();

const { state: lightboxState } = useLightbox();
const { drawerOpen: notificationDrawerOpen } = useNotifications();

const navItems = computed(() =>
  mainNavItems.value.map((item) => ({
    to: item.href,
    label: t(item.labelKey),
    icon: item.icon,
    badge: item.badge,
  })),
);

const backstageNavItems = computed(() =>
  backstageItems.value.map((item) => ({
    to: item.href,
    label: t(item.labelKey),
    icon: item.icon,
  })),
);
const navGroups = computed<TopbarNavGroup[]>(() => {
  const existing = (href: string, fallback: TopbarNavItem): TopbarNavItem =>
    navItems.value.find((item) => item.to === href) || fallback;

  return [
    {
      key: "explore",
      label: t("nav.explore"),
      icon: IconCompass,
      items: [
        {
          to: "/",
          label: t("nav.timeline"),
          icon: IconCompass,
        },
        {
          to: "/categories",
          label: t("categories.title"),
          icon: IconTags,
        },
        {
          to: "/search",
          label: t("search.seoTitle"),
          icon: IconSearch,
        },
      ],
    },
    {
      key: "community",
      label: t("nav.community"),
      icon: IconUser,
      items: [
        existing("/realms", {
          to: "/realms",
          label: t("nav.realms"),
          icon: IconCompass,
        }),
        existing("/chat", {
          to: "/chat",
          label: t("nav.chat"),
          icon: IconUser,
        }),
      ],
    },
  ];
});

const driveNavItem = computed<TopbarNavItem>(() => ({
  to: "/drive",
  label: t("nav.storage"),
  icon: IconHardDrive,
}));

const displayName = computed(() => user.value?.nick || user.value?.name || "");
const avatarUrl = computed(() => getFileUrl(user.value?.profile?.picture?.id));
const isBackstageActive = computed(() =>
  backstageNavItems.value.some((item) => isNavActive(item.to)),
);
function isNavGroupActive(group: TopbarNavGroup) {
  return group.items.some((item) => isNavActive(item.to));
}


function isNavActive(path: string) {
  return route.path === path || (path !== "/" && route.path.startsWith(`${path}/`));
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handleLogout() {
  auth.logout();
  closeMenu();
}

function handleComposeSubmit() {
  composeOpen.value = false;
}

function handleOpenComposeEvent() {
  composeOpen.value = true;
}


watch(() => route.path, closeMenu);

onMounted(() => {
  window.addEventListener("open-compose", handleOpenComposeEvent);
});

onUnmounted(() => {
  window.removeEventListener("open-compose", handleOpenComposeEvent);
});
</script>

