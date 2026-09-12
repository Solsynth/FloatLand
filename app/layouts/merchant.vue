<template>
  <div class="min-h-screen bg-base-200">
    <header
      class="sticky top-0 z-40 w-full border-b border-base-300 bg-base-100"
    >
      <div class="navbar w-full min-h-16 px-4 lg:px-6">
        <!-- Left: Icon + Breadcrumbs -->
        <div class="navbar-start gap-6">
          <NuxtLink to="/" class="flex shrink-0 items-center" aria-label="Home">
            <img src="/favicon.png" alt="Solar Network" class="w-8 h-8 shrink-0" />
          </NuxtLink>
          <nav
            v-if="breadcrumbs.length > 0"
            class="hidden min-w-0 items-center gap-1 text-sm md:flex"
            aria-label="Breadcrumb"
          >
            <template v-for="(crumb, ci) in breadcrumbs" :key="ci">
              <NuxtLink
                v-if="ci < breadcrumbs.length - 1"
                :to="crumb.href"
                class="max-w-[10rem] truncate text-base-content/45 transition-colors duration-150 hover:text-base-content"
              >
                {{ crumb.label }}
              </NuxtLink>
              <span
                v-else
                class="max-w-[14rem] truncate font-semibold text-base-content"
                aria-current="page"
              >
                {{ crumb.label }}
              </span>
              <IconChevronRight
                v-if="ci < breadcrumbs.length - 1"
                class="h-3.5 w-3.5 shrink-0 text-base-content/25"
              />
            </template>
          </nav>
        </div>

        <!-- Center: empty -->
        <div class="navbar-center hidden lg:flex" />

        <!-- Right: AppSwitcher + Profile -->
        <div class="navbar-end gap-1">
          <AppSwitcher />
          <NotificationBell v-if="user" />
          <div v-if="user" class="hidden sm:block">
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
                    <NuxtLink to="/accounts/me/settings" class="flex items-center gap-2 rounded-box px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-base-200 data-[highlighted]:bg-base-200">
                      <IconSettings class="h-4 w-4" />
                      {{ t("nav.settings") }}
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
        </div>
      </div>
    </header>

    <!-- Desktop Merchant Layout -->
    <div class="hidden min-h-[calc(100vh-3.5rem)] lg:flex">
      <!-- Sidebar -->
      <aside
        class="sticky top-16 z-40 h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r border-base-300 scrollbar-none transition-[width] duration-200 ease-out motion-reduce:transition-none"
        :class="sidebarCollapsed ? 'w-16' : 'w-[16.5rem]'"
      >
        <MerchantSidebar
          :collapsed="sidebarCollapsed"
          :collapsible="true"
          @toggle-collapse="toggleSidebar"
        />
      </aside>

      <!-- Main Area -->
      <main
        class="min-w-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6 lg:py-6 scrollbar-none"
      >
        <div class="mx-auto" :class="contentWidthClass">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden flex flex-col min-h-screen">
      <!-- Mobile Header -->
      <header
        class="fixed top-0 left-0 right-0 z-50 border-b border-base-300 bg-base-100"
      >
        <div class="flex h-14 items-center justify-between px-4">
          <NuxtLink to="/merchants" class="btn btn-circle btn-ghost btn-sm">
            <IconArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <span class="text-sm font-semibold truncate px-2">{{
            publisherName || t("merchant.title")
          }}</span>
          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <IconMenu class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Mobile Nav Backdrop -->
      <Transition name="drawer-fade">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-40 bg-black/40"
          @click="mobileMenuOpen = false"
        />
      </Transition>

      <!-- Mobile Nav Panel -->
      <Transition name="drawer-slide">
        <div
          v-if="mobileMenuOpen"
          class="fixed right-0 top-14 bottom-0 z-50 w-72 overflow-y-auto border-l border-base-300 bg-base-100 shadow-sm scrollbar-none"
          @click.stop
        >
          <MerchantSidebar
            :collapsed="false"
            :collapsible="false"
            :show-account="true"
            @navigate="mobileMenuOpen = false"
          />
        </div>
      </Transition>

      <!-- Mobile Main Content -->
      <main class="flex-1 px-4 py-4 pt-[4.5rem]">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconMenu, IconUser, IconSettings, IconLogOut, IconLogIn, IconChevronRight } from "#components";
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
const merchant = useMerchant();
const { collapsed: sidebarCollapsed, toggleSidebar } = useBackstageSidebar();
const { currentPublisher } = merchant;
const auth = useAuth();
const { user, displayName: authDisplayName, logout } = auth;

const mobileMenuOpen = ref(false);
const profileMenuOpen = ref(false);

const displayName = computed(() => authDisplayName.value || user.value?.nick || user.value?.name || "");
const avatarUrl = computed(() => user.value?.profile?.picture ?? null);

function handleLogout() {
  logout();
  navigateTo("/");
}

const publisherName = computed(() => {
  const name = route.params.pubName;
  return typeof name === "string" ? name : null;
});

const segmentLabels = computed<Record<string, string>>(() => ({
  settings: t("merchant.settings"),
  settlements: t("merchant.settlements"),
  orders: t("merchant.orders"),
  ads: t("merchant.ads"),
  stats: t("merchant.dashboard"),
}));

const nickLabel = computed(
  () =>
    currentPublisher.value?.nick ||
    (typeof route.params.pubName === "string" ? route.params.pubName : ""),
);

const breadcrumbs = computed(() => {
  const parts: Array<{ label: string; href: string }> = [
    { label: t('merchant.hub'), href: "/merchants" },
  ];
  const segments = route.path.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[1] === route.params.pubName) {
    parts.push({ label: nickLabel.value, href: `/merchants/${segments[1]}` });
  }
  for (let i = 2; i < segments.length; i++) {
    const seg = segments[i] as string;
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = segmentLabels.value[seg] || seg;
    parts.push({ label, href });
  }
  return parts;
});

const contentWidthClass = computed(() => {
  return "";
});
</script>
