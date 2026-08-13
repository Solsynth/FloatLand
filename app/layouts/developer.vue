<template>
  <div class="min-h-screen bg-base-200">
    <AdminHeader
      class="hidden lg:block"
      :breadcrumbs="breadcrumbs"
      :page-title="pageTitle"
    />

    <!-- Desktop Developer Layout -->
    <div class="hidden min-h-[calc(100vh-3.5rem)] lg:flex">
      <!-- Sidebar -->
      <aside
        class="sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-[16.5rem] shrink-0 overflow-y-auto border-r border-base-300 scrollbar-none"
      >
        <DeveloperSidebar />
      </aside>

      <!-- Main Area -->
      <main
        class="min-w-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6 lg:py-6 scrollbar-none"
      >
        <div class="mx-auto max-w-5xl">
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
          <NuxtLink to="/developers" class="btn btn-circle btn-ghost btn-sm">
            <IconArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <span class="text-sm font-semibold truncate px-2">{{
            publisherName || t("developer.title")
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
          <DeveloperSidebar @navigate="mobileMenuOpen = false" />
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
const developer = useDeveloper();
const { currentDeveloper } = developer;

const mobileMenuOpen = ref(false);

const publisherName = computed(() => {
  return developer.currentPublisherNick.value || null;
});

const segmentLabels: Record<string, string> = {
  settings: "Settings",
  members: "Members",
  posts: "Posts",
  feeds: "Feeds",
  stickers: "Stickers",
  collections: "Collections",
  surveys: "Surveys",
  leaderboard: "Leaderboard",
  subscribers: "Subscribers",
  projects: "Projects",
  apps: "Apps",
  bots: "Bots",
  "api-playground": "API Playground",
  marketplace: "Plugin Marketplace",
  distribution: "Distribution",
};

const nickLabel = computed(
  () =>
    currentDeveloper.value?.publisher?.nick ||
    (typeof route.params.pubName === "string" ? route.params.pubName : ""),
);

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const breadcrumbs = computed(() => {
  const parts: Array<{ label: string; href: string }> = [
    { label: t("developer.console"), href: "/developers" },
  ];
  const segments = route.path.split("/").filter(Boolean);
  const hasPubName =
    typeof route.params.pubName === "string" && route.params.pubName;
  // segments[0] is 'developers', segments[1] is pubName (if present)
  if (
    hasPubName &&
    segments.length >= 2 &&
    segments[1] === route.params.pubName
  ) {
    parts.push({ label: nickLabel.value, href: `/developers/${segments[1]}` });
  }
  // Remaining segments after pubName (or after 'developers' if no pubName)
  const startIdx = hasPubName ? 2 : 1;
  for (let i = startIdx; i < segments.length; i++) {
    const seg = segments[i] as string;
    const href = "/" + segments.slice(0, i + 1).join("/");

    // Resolve UUID segments to names from store
    if (isUuid(seg)) {
      const prevSeg = i > 0 ? segments[i - 1] : "";
      if (
        prevSeg === "projects" &&
        developer.currentProject.value?.id === seg
      ) {
        parts.push({ label: developer.currentProject.value.name, href });
      } else if (prevSeg === "bots" && developer.currentBot.value?.id === seg) {
        parts.push({ label: developer.currentBot.value.name, href });
      } else if (prevSeg === "apps" && developer.currentApp.value?.id === seg) {
        parts.push({ label: developer.currentApp.value.name, href });
      } else {
        parts.push({ label: seg.slice(0, 8), href });
      }
    } else {
      // Skip 'projects' segment when followed by a UUID (no /projects index page)
      const nextSeg = i + 1 < segments.length ? segments[i + 1] : "";
      if (seg === "projects" && isUuid(nextSeg)) continue;

      parts.push({ label: segmentLabels[seg] || seg, href });
    }
  }
  return parts;
});

const pageTitle = computed(() => {
  const last = breadcrumbs.value[breadcrumbs.value.length - 1];
  return last ? last.label : t("developer.title");
});
</script>
