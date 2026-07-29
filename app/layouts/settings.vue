<template>
    <div class="min-h-screen bg-base-200">
        <div class="app-shell mx-auto max-w-7xl">
            <!-- Desktop Layout -->
            <div class="hidden lg:grid lg:grid-cols-[16rem_1fr] lg:gap-6 lg:px-4">
                <!-- Settings Sidebar -->
                <aside class="settings-sidebar">
                    <div class="p-4">
                            <h2 class="text-lg font-bold mb-4">{{ t("settings.title") }}</h2>
                            <nav class="space-y-1">
                                <NuxtLink
                                    v-for="item in menuItems"
                                    :key="item.to"
                                    :to="item.to"
                                    class="settings-nav-item"
                                    :class="isActiveRoute(item.to) ? 'settings-nav-item--active' : ''"
                                >
                                    <component :is="item.icon" class="w-5 h-5" />
                                    <span>{{ item.label }}</span>
                                </NuxtLink>
                            </nav>

                            <NuxtLink
                                :to="`/@${user?.name}`"
                                class="settings-nav-item mt-4"
                            >
                                <IconArrowLeft class="w-5 h-5" />
                                <span>{{ t("settings.backToProfile") }}</span>
                            </NuxtLink>
                    </div>
                </aside>

                <!-- Main Content -->
                <main class="min-h-screen py-4">
                    <slot />
                </main>
            </div>

            <!-- Mobile Layout -->
            <div class="lg:hidden flex flex-col min-h-screen">
                <!-- Mobile Header -->
                <header class="sticky top-0 z-50 bg-base-100 shadow-sm">
                    <div class="flex items-center justify-between px-4 h-14">
                        <NuxtLink to="/" class="flex items-center gap-2">
                            <img src="/favicon.png" alt="Solar Network" class="w-8 h-8" >
                            <span class="font-bold text-lg">{{ t("settings.title") }}</span>
                        </NuxtLink>
                    </div>
                </header>

                <!-- Mobile Settings Menu -->
                <main class="flex-1 px-4 py-4 pb-20">
                    <slot />
                </main>

                <!-- Mobile Bottom Navigation -->
                <nav class="fixed bottom-0 left-0 right-0 z-50 bg-base-100 shadow-sm safe-area-pb">
                    <div class="flex items-center justify-around h-16">
                        <NuxtLink
                            :to="`/@${user?.name}`"
                            class="flex flex-col items-center gap-0.5 p-2 text-base-content/60 hover:text-primary"
                        >
                            <IconArrowLeft class="w-5 h-5" />
                            <span class="text-xs">{{ t("settings.back") }}</span>
                        </NuxtLink>
                    </div>
                </nav>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    IconUser,
    IconShield,
    IconBell,
    IconPalette,
    IconArrowLeft,
    IconSend,
    IconAlertTriangle,
} from "#components";

const { t } = useI18n();
const route = useRoute();
const { user } = useAuth();

/** Mirrors Island account_settings.dart sections (web-relevant). */
const menuItems = [
    { to: "/accounts/me/settings", label: t("settings.profile"), icon: IconUser },
    { to: "/accounts/me/settings/publishing", label: t("settings.publishing"), icon: IconSend },
    { to: "/accounts/me/settings/notifications", label: t("settings.notifications"), icon: IconBell },
    { to: "/accounts/me/settings/security", label: t("settings.security"), icon: IconShield },
    { to: "/accounts/me/settings/appearance", label: t("settings.appearance"), icon: IconPalette },
    { to: "/accounts/me/settings/account", label: t("settings.account"), icon: IconAlertTriangle },
];

function isActiveRoute(path: string): boolean {
    if (path === "/accounts/me/settings") {
        return route.path === path || route.path === `${path}/`;
    }
    return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<style scoped>
.safe-area-pb {
    padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
