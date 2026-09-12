<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="btn btn-circle btn-ghost btn-sm"
        :aria-label="t('nav.appSwitcher')"
      >
        <IconLayoutGrid class="h-5 w-5" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        :side-offset="8"
        class="z-50 max-h-[70vh] w-[300px] overflow-y-auto rounded-box border border-base-300 bg-base-100 p-4 text-base-content shadow-lg"
      >
        <div class="grid grid-cols-3 gap-3">
          <NuxtLink
            v-for="app in apps"
            :key="app.href"
            :to="app.href"
            class="flex flex-col items-center justify-center gap-1.5 rounded-box p-3 text-center transition-colors hover:bg-base-200"
            :class="isActive(app.href) ? 'bg-primary/10 text-primary' : ''"
            @click="open = false"
          >
            <component :is="app.icon" class="h-6 w-6" />
            <span class="text-xs leading-tight">{{ app.label }}</span>
          </NuxtLink>
        </div>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
  IconCompass,
  IconMail,
  IconHardDrive,
  IconPalette,
  IconCode,
  IconTrendingUp,
  IconBrain,
  IconShield,
  IconBriefcaseBusiness,
  IconWallet,
} from "#components";
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";

const { t } = useI18n();
const route = useRoute();
const auth = useAuth();
const { isAuthenticated, isSuperuser } = auth;

const open = ref(false);

interface AppItem {
  href: string;
  label: string;
  icon: any;
  requiresAuth?: boolean;
  requiresSuperuser?: boolean;
}

const allApps = computed<AppItem[]>(() => {
  const items: AppItem[] = [
    { href: "/", label: t("nav.timeline"), icon: IconCompass },
    { href: "/mail", label: t("nav.mail"), icon: IconMail, requiresAuth: true },
    { href: "/drive", label: t("nav.drive"), icon: IconHardDrive },
    { href: "/creators", label: t("nav.creatorHub"), icon: IconPalette },
    { href: "/developers", label: t("nav.developerHub"), icon: IconCode },
    { href: "/merchants", label: t("nav.merchantHub"), icon: IconTrendingUp },
    { href: "/personality", label: t("nav.aiConsole"), icon: IconBrain, requiresAuth: true },
    { href: "/workspaces", label: t("nav.workspaces"), icon: IconBriefcaseBusiness, requiresAuth: true },
    { href: "/wallets", label: t("nav.wallet"), icon: IconWallet },
  ];

  if (isSuperuser.value) {
    items.push({
      href: "/admin",
      label: t("nav.adminPanel"),
      icon: IconShield,
      requiresSuperuser: true,
    });
  }

  return items.filter(
    (app) =>
      (!app.requiresAuth || isAuthenticated.value) &&
      (!app.requiresSuperuser || isSuperuser.value),
  );
});

const apps = allApps;

function isActive(href: string): boolean {
  return route.path === href || (href !== "/" && route.path.startsWith(`${href}/`));
}
</script>
