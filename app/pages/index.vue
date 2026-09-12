<template>
  <NuxtLayout name="app">
    <!-- Fluid container: hero spans the full viewport width -->
    <div class="w-full px-4 pb-20 lg:px-6">
      <!-- Hero: the resting clock, vertically centered in the first viewport
           (~50% from the top), everything below scrolls. -->
      <section class="flex min-h-[calc(100svh-6rem)] flex-col items-center justify-center gap-10 py-10 text-center">
        <DashboardHero class="dash-hero-fade" />
        <DashboardQuickLinks class="dash-hero-fade" />
      </section>

      <!-- Widgets: fluid, but capped so cards stay readable on ultra-wide -->
      <div class="mx-auto grid w-full max-w-[100rem] gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardWeather />
        <DashboardOracle v-if="isAuthenticated" />
        <DashboardNotifications v-if="isAuthenticated" />
      </div>

      <div class="mx-auto mt-4 w-full max-w-[100rem]">
        <DashboardFeatured />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const { t } = useI18n();
const auth = useAuth();
const { isAuthenticated } = auth;

const seoTitle = computed(() => t("dashboard.seoTitle"));
const seoDescription = computed(() => t("dashboard.seoDescription"));

useSolarSeo({
  title: seoTitle,
  description: seoDescription,
  url: "https://solian.app",
  breadcrumbs: [{ name: "Dashboard", item: "https://solian.app" }],
});
</script>
