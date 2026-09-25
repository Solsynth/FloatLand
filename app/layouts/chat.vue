<template>
  <div class="flex h-screen flex-col overflow-hidden bg-base-200">
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
            class="hidden min-w-0 items-center gap-1 text-sm md:flex"
            aria-label="Breadcrumb"
          >
            <NuxtLink
              to="/chat"
              class="max-w-[10rem] truncate text-base-content/45 transition-colors duration-150 hover:text-base-content"
            >
              {{ t("nav.chat") }}
            </NuxtLink>
            <IconChevronRight
              v-if="roomTitle"
              class="h-3.5 w-3.5 shrink-0 text-base-content/25"
            />
            <span
              v-if="roomTitle"
              class="max-w-[14rem] truncate font-semibold text-base-content"
              aria-current="page"
            >
              {{ roomTitle }}
            </span>
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

    <!-- Desktop Chat Layout -->
    <div class="hidden min-h-0 flex-1 lg:flex">
      <!-- Room list column -->
      <aside
        class="z-40 h-full shrink-0 overflow-y-auto border-r border-base-300 bg-[#f7f7f8] scrollbar-none"
        :style="{ width: `${sidebarWidth}px` }"
      >
        <ChatSidebar />
      </aside>

      <!-- Drag divider -->
      <div
        class="group relative z-50 -mx-0.5 w-1 shrink-0 cursor-col-resize"
        role="separator"
        aria-orientation="vertical"
        :aria-valuenow="sidebarWidth"
        aria-valuemin="200"
        aria-valuemax="380"
        tabindex="0"
        @pointerdown="onResizeStart"
      >
        <span class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-transparent transition-colors group-hover:bg-primary/50" />
      </div>

      <!-- Messages column -->
      <main class="min-w-0 flex-1 overflow-hidden bg-base-100">
        <div class="h-full">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden flex min-h-0 flex-1 flex-col">
      <!-- Mobile Header -->
      <header
        v-if="!isRoom"
        class="fixed top-0 left-0 right-0 z-50 border-b border-base-300 bg-base-100"
      >
        <div class="flex h-14 items-center justify-between px-4">
          <NuxtLink to="/" class="btn btn-circle btn-ghost btn-sm" :title="t('common.back')">
            <IconArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <span class="min-w-0 flex-1 truncate px-2 text-sm font-semibold">{{ t("nav.chat") }}</span>
          <button
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
          class="fixed right-0 top-14 bottom-0 z-50 w-72 overflow-y-auto border-l border-base-300 bg-base-100 p-4 shadow-sm scrollbar-none"
          @click.stop
        >
          <ChatSidebar @navigated="mobileMenuOpen = false" />
        </div>
      </Transition>

      <!-- Mobile Main Content -->
      <main :class="isRoom ? 'min-h-0 flex-1' : 'min-h-0 flex-1 pt-18'">
        <div class="h-full">
          <slot />
        </div>
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
const { state, roomTitle: resolveRoomTitle } = useChat();
const auth = useAuth();
const { user, displayName: authDisplayName, logout } = auth;

const mobileMenuOpen = ref(false);
const profileMenuOpen = ref(false);

// ── Resizable room-list column (desktop) ─────────────────────────────────
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 380;
const sidebarWidth = ref(280);
let dragStartX = 0;
let dragStartWidth = 280;
let dragging = false;

function clampSidebar(value: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, value));
}

function onResizeStart(event: PointerEvent): void {
  if (window.innerWidth < 1024) return;
  dragging = true;
  dragStartX = event.clientX;
  dragStartWidth = sidebarWidth.value;
  document.body.classList.add("select-none", "cursor-col-resize");
  window.addEventListener("pointermove", onResizeMove);
  window.addEventListener("pointerup", onResizeEnd);
}

function onResizeMove(event: PointerEvent): void {
  if (!dragging) return;
  sidebarWidth.value = clampSidebar(dragStartWidth + (event.clientX - dragStartX));
}

function onResizeEnd(): void {
  if (!dragging) return;
  dragging = false;
  document.body.classList.remove("select-none", "cursor-col-resize");
  window.removeEventListener("pointermove", onResizeMove);
  window.removeEventListener("pointerup", onResizeEnd);
  try {
    localStorage.setItem("chat.sidebarWidth", String(sidebarWidth.value));
  } catch {
    // Persistence is best-effort.
  }
}

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem("chat.sidebarWidth"));
    if (Number.isFinite(saved) && saved > 0) sidebarWidth.value = clampSidebar(saved);
  } catch {
    // Best-effort.
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onResizeMove);
  window.removeEventListener("pointerup", onResizeEnd);
});

const displayName = computed(() => authDisplayName.value || user.value?.nick || user.value?.name || "");
const avatarUrl = computed(() => user.value?.profile?.picture ?? null);

const roomId = computed(() => {
  const param = route.params.roomId
  return typeof param === "string" ? param : ""
})

const isRoom = computed(() => Boolean(roomId.value))

const roomTitle = computed(() => {
  if (!roomId.value) return ""
  const room = state.rooms.find((candidate) => candidate.id === roomId.value)
  return room ? resolveRoomTitle(room) : ""
})

function handleLogout() {
  logout();
  navigateTo("/");
}
</script>
