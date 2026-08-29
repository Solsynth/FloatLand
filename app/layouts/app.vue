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

        <nav
          ref="navRef"
          class="navbar-center hidden items-center gap-1 lg:flex"
          aria-label="Primary"
          @keydown.esc="closeNavDropdown"
        >
          <details
            v-for="group in navGroups"
            :key="group.key"
            class="dropdown dropdown-bottom"
          >
            <summary
              class="btn btn-ghost h-10 min-h-10 list-none gap-2 px-3 [&::-webkit-details-marker]:hidden"
              :class="isNavGroupActive(group) ? 'bg-primary/10 text-primary' : ''"
              aria-haspopup="menu"
              @click="handleNavDropdownClick"
            >
              <component :is="group.icon" class="h-4 w-4" />
              <span>{{ group.label }}</span>
            </summary>
            <ul
              class="dropdown-content menu z-50 mt-2 w-60 rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-lg"
            >
              <li v-for="item in group.items" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  :class="isNavActive(item.to) ? 'bg-primary/10 text-primary' : ''"
                  :aria-current="isNavActive(item.to) ? 'page' : undefined"
                  @click="closeNavDropdown"
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
          </details>
          <NuxtLink
            :to="realmsNavItem.to"
            class="btn btn-ghost h-10 min-h-10 gap-2 px-3"
            :class="isNavActive(realmsNavItem.to) ? 'bg-primary/10 text-primary' : ''"
            :aria-current="isNavActive(realmsNavItem.to) ? 'page' : undefined"
          >
            <component :is="realmsNavItem.icon" class="h-4 w-4" />
            <span>{{ realmsNavItem.label }}</span>
          </NuxtLink>
          <NuxtLink
            :to="driveNavItem.to"
            class="btn btn-ghost h-10 min-h-10 gap-2 px-3"
            :class="isNavActive(driveNavItem.to) ? 'bg-primary/10 text-primary' : ''"
            :aria-current="isNavActive(driveNavItem.to) ? 'page' : undefined"
          >
            <component :is="driveNavItem.icon" class="h-4 w-4" />
            <span>{{ driveNavItem.label }}</span>
          </NuxtLink>
          <details
            class="dropdown dropdown-end dropdown-bottom"
          >
            <summary
              class="btn btn-ghost h-10 min-h-10 list-none gap-2 px-3 [&::-webkit-details-marker]:hidden"
              :class="isBackstageActive ? 'bg-primary/10 text-primary' : ''"
              aria-haspopup="menu"
              @click="handleNavDropdownClick"
            >
              <component :is="backstageEntry.icon" class="h-4 w-4" />
              <span>{{ t(backstageEntry.labelKey) }}</span>
            </summary>
            <ul
              class="dropdown-content menu z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-lg"
            >
              <li v-for="item in backstageNavItems" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  :class="isNavActive(item.to) ? 'bg-primary/10 text-primary' : ''"
                  :aria-current="isNavActive(item.to) ? 'page' : undefined"
                  @click="closeNavDropdown"
                >
                  <component :is="item.icon" class="h-4 w-4" />
                  {{ item.label }}
                </NuxtLink>
              </li>
            </ul>
          </details>
        </nav>
        <div class="navbar-end gap-1">
          <NotificationBell v-if="isAuthenticated && user" />
          <div v-if="isAuthenticated && user" class="hidden sm:block">
            <DropdownMenuRoot v-model:open="profileMenuOpen">
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  class="btn btn-ghost h-auto min-h-10 gap-2 px-2"
                >
                  <div v-if="avatarUrl" class="avatar">
                    <div class="w-8 rounded-full">
                      <FileImage :file="avatarUrl" :alt="user.name" />
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
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  align="end"
                  :side-offset="8"
                  class="z-50 w-52 rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-lg"
                >
                  <DropdownMenuItem as-child>
                    <NuxtLink to="/accounts/me" class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200">
                      <IconUser class="h-4 w-4" />
                      {{ t("nav.account") }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <NuxtLink to="/workspaces" class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200">
                      <IconBriefcaseBusiness class="h-4 w-4" />
                      {{ t("nav.workspaces") }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <NuxtLink to="/wallets" class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200">
                      <IconWallet class="h-4 w-4" />
                      {{ t("nav.wallet") }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <NuxtLink to="/pricing" class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200">
                      <IconCreditCard class="h-4 w-4" />
                      {{ t("nav.pricing") }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <NuxtLink to="/accounts/me/settings" class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200">
                      <IconSettings class="h-4 w-4" />
                      {{ t("nav.settings") }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <NuxtLink to="/tickets" class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200">
                      <IconTicket class="h-4 w-4" />
                      {{ t("nav.tickets") }}
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <button type="button" @click="handleLogout" class="mt-1 flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-error/10 data-[highlighted]:bg-error/10 text-error">
                      <IconLogOut class="h-4 w-4" />
                      {{ t("nav.logout") }}
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
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
            :to="realmsNavItem.to"
            class="mb-3 flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive(realmsNavItem.to) ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <component :is="realmsNavItem.icon" class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ realmsNavItem.label }}</span>
          </NuxtLink>
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
              <FileImage :file="avatarUrl" :alt="user.name" />
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
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";
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
const profileMenuOpen = ref(false);
const navRef = ref<HTMLElement | null>(null);

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
const navGroups = computed<TopbarNavGroup[]>(() => [
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
]);

const realmsNavItem = computed<TopbarNavItem>(() =>
  navItems.value.find((item) => item.to === "/realms") || {
    to: "/realms",
    label: t("nav.realms"),
    icon: IconCompass,
  },
);

const driveNavItem = computed<TopbarNavItem>(() => ({
  to: "/drive",
  label: t("nav.storage"),
  icon: IconHardDrive,
}));

const displayName = computed(() => user.value?.nick || user.value?.name || "");
const avatarUrl = computed(() => user.value?.profile?.picture ?? null);
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
  profileMenuOpen.value = false;
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
  profileMenuOpen.value = false;
}

function closeNavDropdown() {
  if (!import.meta.client) {
    return;
  }

  document
    .querySelectorAll("header nav details[open]")
    .forEach((details) => details.removeAttribute("open"));
}

function handleNavDropdownClick(event: MouseEvent) {
  const current = event.currentTarget as HTMLDetailsElement | null;
  if (!current || !navRef.value) {
    return;
  }

  navRef.value.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
    if (details !== current) {
      details.removeAttribute("open");
    }
  });
}

function handleNavOutsideClick(event: MouseEvent) {
  if (!(event.target instanceof Node) || navRef.value?.contains(event.target)) {
    return;
  }

  closeNavDropdown();
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


watch(() => route.path, () => {
  closeMenu();
  closeNavDropdown();
});

onMounted(() => {
  window.addEventListener("open-compose", handleOpenComposeEvent);
  document.addEventListener("click", handleNavOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener("open-compose", handleOpenComposeEvent);
  document.removeEventListener("click", handleNavOutsideClick);
});

</script>

