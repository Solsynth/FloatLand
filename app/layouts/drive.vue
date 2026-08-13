<template>
  <div class="min-h-screen bg-base-200">
    <AdminHeader
      class="hidden lg:block"
      :breadcrumbs="breadcrumbs"
      :page-title="pageTitle"
    />

    <!-- Desktop Drive Layout -->
    <div class="hidden min-h-[calc(100vh-3.5rem)] lg:flex">
      <!-- Sidebar -->
      <aside
        class="sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-[18rem] shrink-0 overflow-y-auto border-r border-base-300 scrollbar-none"
      >
        <DriveSidebar
          :usage="usage"
          @storage-details="showUsageDetails = true"
        />
      </aside>

      <!-- Main Area -->
      <main class="min-w-0 flex-1 overflow-y-auto scrollbar-none">
        <div class="mx-auto h-full" :class="contentWidthClass">
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
          <NuxtLink to="/" class="btn btn-circle btn-ghost btn-sm">
            <IconArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <span class="text-sm font-semibold">{{ pageTitle }}</span>
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
          <DriveSidebar
            :usage="usage"
            @storage-details="showUsageDetails = true; mobileMenuOpen = false"
          />
        </div>
      </Transition>

      <!-- Mobile Main Content -->
      <main class="flex-1 pt-18">
        <slot />
      </main>
    </div>

    <!-- Dialogs -->
    <UsageDetailsDialog
      :open="showUsageDetails"
      :usage="usage"
      @close="showUsageDetails = false"
    />
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconMenu } from "#components";
import type { DriveUsage } from "~/types/drive";

const { t } = useI18n();
const route = useRoute();
const drive = useDrive();

const mobileMenuOpen = ref(false);
const showUsageDetails = ref(false);

const usage = computed<DriveUsage | null>(() => drive.state.usage ?? null);

// Breadcrumb segments based on current route path
const segmentLabels = computed<Record<string, string>>(() => ({
  drive: t("nav.drive"),
  recent: t("drive.recent"),
  trash: t("drive.trash"),
}));

const breadcrumbs = computed(() => {
  const parts: Array<{ label: string; href: string }> = [
    { label: t("nav.drive"), href: "/drive" },
  ];
  const segments = route.path.split("/").filter(Boolean);
  // segments[0] is 'drive'; skip the first segment
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i] as string;
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = segmentLabels.value[seg] || seg;
    parts.push({ label, href });
  }
  return parts;
});

const pageTitle = computed(() => {
  const last = breadcrumbs.value[breadcrumbs.value.length - 1];
  return last ? last.label : t("nav.drive");
});

const contentWidthClass = computed(() => {
  // No max-width constraint - let pages control their own width
  return "";
});

// Close mobile menu on navigation
watch(() => route.path, () => {
  mobileMenuOpen.value = false;
});

// Load usage on mount
onMounted(async () => {
  try {
    await drive.loadUsage();
  } catch {
    // Usage loading is best-effort
  }
});
</script>
