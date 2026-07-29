<template>
    <aside
        class="main-sidebar"
        :class="collapsed ? 'px-2' : 'px-4'"
    >
        <!-- Logo -->
        <div
            class="mb-6 flex px-2"
            :class="collapsed ? 'justify-center' : 'justify-start'"
        >
            <NuxtLink to="/" class="text-2xl font-bold text-primary">
                <img src="/favicon.png" alt="Solar Network" class="h-9 w-9" />
            </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 grow space-y-1">
            <NuxtLink
                v-for="item in navItems"
                :key="item.href"
                :to="item.href"
                class="main-nav-item"
                :class="[
                    collapsed ? 'justify-center px-3' : 'px-3',
                    isNavActive(item.href) ? 'main-nav-item--active' : '',
                ]"
            >
                <div class="relative">
                    <component
                        :is="item.icon"
                        class="h-5 w-5 shrink-0"
                    />
                    <span
                        v-if="item.badge"
                        class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-error-content"
                    >
                        {{ item.badge > 99 ? "99+" : item.badge }}
                    </span>
                </div>
                <span
                    v-if="!collapsed"
                    class="text-sm font-semibold"
                >
                    {{ item.label }}
                </span>
            </NuxtLink>

            <!-- Backstage dropdown (creator / developer / merchant / admin) -->
            <div
                class="dropdown w-full"
                :class="collapsed ? 'dropdown-right dropdown-end' : 'dropdown-end'"
            >
                <button
                    tabindex="0"
                    type="button"
                    class="main-nav-item relative w-full"
                    :class="[
                        collapsed ? 'justify-center px-3' : 'px-3',
                        isBackstageActive ? 'main-nav-item--active' : '',
                    ]"
                    aria-haspopup="menu"
                    :aria-label="backstageLabel"
                >
                    <component
                        :is="backstageEntry.icon"
                        class="h-5 w-5 shrink-0"
                    />
                    <span
                        v-if="!collapsed"
                        class="text-sm font-semibold"
                    >
                        {{ backstageLabel }}
                    </span>
                </button>
                <ul
                    tabindex="0"
                    class="main-sidebar-menu dropdown-content menu z-50 w-52 p-2"
                    :class="collapsed ? 'ms-2' : 'mt-1'"
                >
                    <li v-for="item in backstageNavItems" :key="item.href">
                        <NuxtLink
                            :to="item.href"
                            class="flex items-center gap-3"
                        >
                            <component :is="item.icon" class="h-4.5 w-4.5" />
                            {{ item.label }}
                        </NuxtLink>
                    </li>
                </ul>
            </div>
        </nav>

        <!-- Bottom Section: User Profile -->
        <div
            class="mt-auto flex flex-col items-end gap-2"
            :class="collapsed ? 'px-0' : 'px-2'"
        >
            <!-- Toggle Button + Notification Bell Row (expanded) -->
            <div
                v-if="isAuthenticated && !collapsed"
                class="flex items-center justify-start gap-4 ps-4"
            >
                <button
                    class="btn btn-ghost btn-circle btn-sm"
                    aria-label="Collapse sidebar"
                    @click="toggleSidebar"
                >
                    <IconPanelLeftClose class="h-5 w-5" />
                </button>
                <NotificationBell />
            </div>

            <!-- Toggle Button (expanded, no auth) -->
            <button
                v-if="!isAuthenticated && !collapsed"
                class="btn btn-ghost btn-circle btn-sm"
                aria-label="Collapse sidebar"
                @click="toggleSidebar"
            >
                <IconPanelLeftClose class="h-5 w-5" />
            </button>

            <!-- Notification Bell + Toggle (collapsed) -->
            <template v-if="collapsed">
                <div v-if="isAuthenticated" class="flex justify-center">
                    <NotificationBell />
                </div>
                <div class="flex justify-center">
                    <button
                        class="btn btn-ghost btn-circle btn-sm"
                        aria-label="Expand sidebar"
                        @click="toggleSidebar"
                    >
                        <IconPanelLeftClose class="h-5 w-5 rotate-180" />
                    </button>
                </div>
            </template>

            <!-- User Profile Mini -->
            <div
                v-if="isAuthenticated && user"
                class="dropdown dropdown-end dropdown-top w-full"
            >
                <button
                    class="main-sidebar-profile"
                >
                    <div v-if="avatarUrl" class="avatar shrink-0">
                        <div class="w-10 rounded-full">
                            <img :src="avatarUrl" :alt="username" />
                        </div>
                    </div>
                    <div v-else class="avatar avatar-placeholder shrink-0">
                        <div
                            class="w-10 rounded-full bg-primary text-primary-content"
                        >
                            <span class="text-sm font-medium">{{
                                fallbackInitials
                            }}</span>
                        </div>
                    </div>
                    <div
                        class="min-w-0 flex-1 text-left transition-all duration-300"
                        :class="collapsed ? 'hidden' : ''"
                    >
                        <div class="truncate text-sm font-semibold">
                            {{ displayName }}
                        </div>
                        <div class="truncate text-xs text-base-content/50">
                            @{{ username }}
                        </div>
                    </div>
                </button>
                <ul
                class="main-sidebar-menu dropdown-content menu mb-2 w-52 p-2"
                >
                    <li>
                        <NuxtLink to="/accounts/me">
                            <IconUser class="w-4.5" />
                            {{ t("nav.account") }}
                        </NuxtLink>
                    </li>
                    <li>
                        <NuxtLink to="/accounts/me/settings">
                            <IconSettings class="w-4.5" />
                            {{ t("nav.settings") }}
                        </NuxtLink>
                    </li>
                    <li>
                        <button @click="handleLogout">
                            <IconLogOut class="w-4.5" />
                            {{ t("nav.logout") }}
                        </button>
                    </li>
                </ul>
            </div>
            <NuxtLink
                v-else
                to="/auth/login"
                class="main-sidebar-profile"
            >
                <div class="avatar avatar-placeholder shrink-0">
                    <div
                        class="w-10 rounded-full bg-base-300 text-base-content"
                    >
                        <IconLogIn class="w-5 h-5" />
                    </div>
                </div>
                <div
                    class="text-left transition-all duration-300"
                    :class="collapsed ? 'hidden' : ''"
                >
                    <div class="text-sm font-semibold">
                        {{ t("nav.signIn") }}
                    </div>
                    <div class="text-xs text-base-content/50">
                        {{ t("nav.joinCommunity") }}
                    </div>
                </div>
            </NuxtLink>
        </div>
    </aside>
</template>

<script setup lang="ts">
import {
    IconLogIn,
    IconLogOut,
    IconUser,
    IconSettings,
    IconPanelLeftClose,
} from "#components";
import { getFileUrl } from "~/utils/files";

const { t } = useI18n();
const route = useRoute();
const { collapsed, toggleSidebar } = useSidebar();

const {
    isAuthenticated,
    user,
    logout,
    displayName: authDisplayName,
} = useAuth();

const {
    navItems: mainNavItems,
    backstageItems,
    backstageEntry,
} = useMainNav();

const navItems = computed(() =>
    mainNavItems.value.map((item) => ({
        icon: item.icon,
        label: t(item.labelKey),
        href: item.href,
        badge: item.badge,
    })),
);

const backstageNavItems = computed(() =>
    backstageItems.value.map((item) => ({
        icon: item.icon,
        label: t(item.labelKey),
        href: item.href,
    })),
);

const backstageLabel = computed(() => t(backstageEntry.labelKey));

const isBackstageActive = computed(() =>
    backstageItems.value.some(
        (item) =>
            route.path === item.href || route.path.startsWith(`${item.href}/`),
    ),
);

const displayName = computed(() => authDisplayName.value);
const username = computed(() => user.value?.name || "");
const avatarUrl = computed(() => getFileUrl(user.value?.profile?.picture?.id));
const fallbackInitials = computed(() =>
    (username.value || "?").slice(0, 2).toUpperCase(),
);

function handleLogout() {
    logout();
    navigateTo("/");
}

function isNavActive(href: string) {
    return route.path === href || (href !== "/" && route.path.startsWith(`${href}/`));
}
</script>
