<template>
  <div class="w-full max-w-2xl">
    <div class="grid w-full grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-6">
      <NuxtLink
        v-for="item in links"
        :key="item.href"
        :to="item.href"
        class="group flex flex-col items-center gap-2 rounded-box px-2 py-2 transition-colors hover:bg-base-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <component
          :is="item.icon"
          class="h-6 w-6 text-base-content/55 transition-colors group-hover:text-primary"
        />
        <span class="max-w-full text-xs font-medium text-base-content/75 group-hover:text-base-content">
          {{ item.label }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconCreditCard } from "#components";
import { useMainNav } from "~/composables/useMainNav";

const { t } = useI18n();
const auth = useAuth();
const { isAuthenticated, isSuperuser } = auth;

const { navItems, backstageItems } = useMainNav();

const links = computed(() => {
  const items: { href: string; label: string; icon: any; requiresAuth?: boolean }[] = [
    // The dashboard root is the current page; its children are the shortcuts.
    ...navItems.value
      .filter((item) => item.href !== "/")
      .map((item) => ({
        href: item.href,
        label: t(item.labelKey),
        icon: item.icon,
        requiresAuth: item.requiresAuth,
      })),
    ...backstageItems.value
      .filter((item) => item.href !== "/admin" || isSuperuser.value)
      .map((item) => ({
        href: item.href,
        label: t(item.labelKey),
        icon: item.icon,
        requiresAuth: item.requiresAuth,
      })),
    { href: "/pricing", label: t("nav.pricing"), icon: IconCreditCard },
  ];

  return items.filter((item) => !item.requiresAuth || isAuthenticated.value);
});
</script>
