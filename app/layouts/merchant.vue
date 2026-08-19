<template>
  <div class="min-h-screen bg-base-200">
    <AdminHeader
      class="hidden lg:block"
      :breadcrumbs="breadcrumbs"
      :page-title="pageTitle"
    />

    <!-- Desktop Merchant Layout -->
    <div class="hidden min-h-[calc(100vh-3.5rem)] lg:flex">
      <!-- Sidebar -->
      <aside
        class="sticky top-14 z-40 h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r border-base-300 scrollbar-none transition-[width] duration-200 ease-out motion-reduce:transition-none"
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
import { IconArrowLeft, IconMenu } from "#components";

const { t } = useI18n();
const route = useRoute();
const merchant = useMerchant();
const { collapsed: sidebarCollapsed, toggleSidebar } = useBackstageSidebar();
const { currentPublisher } = merchant;

const mobileMenuOpen = ref(false);

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

const pageTitle = computed(() => {
  const last = breadcrumbs.value[breadcrumbs.value.length - 1];
  return last ? last.label : t("merchant.title");
});

const contentWidthClass = computed(() => {
  return "";
});
</script>
