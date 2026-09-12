<template>
  <div class="min-h-screen bg-base-200">
    <header
      class="sticky top-0 z-40 w-full border-b border-base-300 bg-base-100"
    >
      <div class="navbar w-full min-h-16 px-4 lg:px-6">
        <!-- Left: Icon + Title -->
        <div class="navbar-start gap-1">
          <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5" aria-label="Home">
            <img src="/favicon.png" alt="Solar Network" class="h-8 w-8 shrink-0" />
            <span class="truncate text-lg font-semibold text-base-content">Solar Network</span>
          </NuxtLink>
        </div>

        <!-- Center: empty for Google-style minimal navbar -->
        <div class="navbar-center hidden lg:flex" />

        <!-- Right: AppSwitcher + Notifications + Profile -->
        <div class="navbar-end gap-1">
          <AppSwitcher v-if="isAuthenticated" />
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
                    <button type="button" class="mt-1 flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-error/10 data-[highlighted]:bg-error/10 text-error" @click="handleLogout">
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
          <NuxtLink
            to="/"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconLayoutDashboard class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.dashboard") }}</span>
          </NuxtLink>
          <NuxtLink
            to="/timeline"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/timeline') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconCompass class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.explore") }}</span>
          </NuxtLink>
          <NuxtLink
            to="/realms"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/realms') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconBuilding class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.realms") }}</span>
          </NuxtLink>
          <NuxtLink
            to="/workspaces"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/workspaces') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconBriefcaseBusiness class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.workspaces") }}</span>
          </NuxtLink>
          <NuxtLink
            to="/drive"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/drive') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconHardDrive class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.drive") }}</span>
          </NuxtLink>
          <NuxtLink
            v-if="isAuthenticated"
            to="/mail"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/mail') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconMail class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.mail") }}</span>
          </NuxtLink>
          <NuxtLink
            to="/wallets"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/wallets') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconWallet class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.wallet") }}</span>
          </NuxtLink>
          <NuxtLink
            v-if="isAuthenticated"
            to="/tickets"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/tickets') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconTicket class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.tickets") }}</span>
          </NuxtLink>
          <div class="divider -mx-4 my-2" />
          <div class="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-base-content/40">
            {{ t("nav.backstage") }}
          </div>
          <NuxtLink
            to="/creators"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/creators') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconPalette class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.creatorHub") }}</span>
          </NuxtLink>
          <NuxtLink
            to="/developers"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/developers') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconCode class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.developerHub") }}</span>
          </NuxtLink>
          <NuxtLink
            to="/merchants"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/merchants') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconTrendingUp class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.merchantHub") }}</span>
          </NuxtLink>
          <NuxtLink
            v-if="isAuthenticated"
            to="/pet"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/pet') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconPawPrint class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.pet") }}</span>
          </NuxtLink>
          <NuxtLink
            v-if="isSuperuser"
            to="/admin"
            class="flex h-12 min-h-12 items-center gap-3 rounded-box px-3 py-0 text-base leading-5"
            :class="isNavActive('/admin') ? 'bg-primary/10 text-primary' : ''"
            @click="closeMenu"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconShield class="h-5 w-5" />
            </span>
            <span class="flex h-5 items-center leading-5">{{ t("nav.adminPanel") }}</span>
          </NuxtLink>
        </nav>

        <div v-if="isAuthenticated && user" class="divider -mx-4 my-2" />
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
    <div
      class="app-shell"
      :class="route.path === '/' ? 'w-full' : 'mx-auto max-w-7xl'"
    >

      <main class="min-h-[calc(100dvh-65px)] px-4 py-4 lg:px-6">
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
  IconCompass,
  IconBuilding,
  IconBriefcaseBusiness,
  IconHardDrive,
  IconMail,
  IconWallet,
  IconTicket,
  IconPalette,
  IconCode,
  IconTrendingUp,
  IconPawPrint,
  IconShield,
  IconCreditCard,
  IconLayoutDashboard,
  IconMenu,
  IconUser,
  IconSettings,
  IconLogOut,
  IconLogIn,
} from "#components";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";
import AppSwitcher from "~/components/layout/AppSwitcher.vue";

const { t } = useI18n();
const route = useRoute();

const auth = useAuth();
const { isAuthenticated, user, isSuperuser } = auth;

const menuOpen = ref(false);
const composeOpen = ref(false);
const profileMenuOpen = ref(false);

const { state: lightboxState } = useLightbox();
const { drawerOpen: notificationDrawerOpen } = useNotifications();

const displayName = computed(() => user.value?.nick || user.value?.name || "");
const avatarUrl = computed(() => user.value?.profile?.picture ?? null);

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
});

onMounted(() => {
  window.addEventListener("open-compose", handleOpenComposeEvent);
});

onUnmounted(() => {
  window.removeEventListener("open-compose", handleOpenComposeEvent);
});

</script>

