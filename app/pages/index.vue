<template>
  <NuxtLayout name="app">
    <!--
      The landing is a table of contents for the explorer, not a brochure. The
      hero states what the product reads; the shelves below are the actual
      routes; and the newest posts are shown live, because a reader arriving
      with no query is best served by content rather than a promise of it.
    -->
    <section class="border-b border-line pb-10 pt-6">
      <div class="max-w-3xl">
        <p class="eyebrow flex items-center gap-2">
          <span class="dot bg-primary" aria-hidden="true" />
          {{ t("landing.eyebrow") }}
        </p>
        <h1 class="title mt-4 text-[clamp(1.85rem,4.5vw,2.75rem)] leading-[1.1] text-base-content">
          {{ t("landing.heroTitle") }}
        </h1>
        <p class="voice mt-4 max-w-2xl text-[15px]">
          {{ t("landing.heroDescription") }}
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-2">
          <NuxtLink to="/timeline" class="btn btn-primary btn-sm gap-1.5">
            {{ t("landing.explore") }}
            <IconArrowRight class="size-3.5" aria-hidden="true" />
          </NuxtLink>
          <a v-if="!isAuthenticated" :href="signInHref" class="btn btn-quiet btn-sm">
            {{ t("landing.getStarted") }}
          </a>
          <NuxtLink v-else :to="`/accounts/${user?.name ?? ''}`" class="btn btn-quiet btn-sm">
            {{ t("nav.account") }}
          </NuxtLink>
          <span v-if="!isAuthenticated" class="text-2xs text-faint">
            {{ t("landing.haveAccount") }}
            <a :href="signInHref" class="link-quiet">{{ t("landing.signIn") }}</a>
          </span>
        </div>
      </div>
    </section>

    <!-- Shelves -->
    <section class="py-10">
      <header class="mb-5">
        <h2 class="title text-base text-base-content">{{ t("landing.surfacesTitle") }}</h2>
        <p class="voice mt-1 text-[13px]">{{ t("landing.surfacesDescription") }}</p>
      </header>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="surface in surfaces"
          :key="surface.href"
          :to="surface.href"
          class="plate group p-4 transition-colors hover:bg-base-200/60"
        >
          <span
            class="grid size-8 place-items-center rounded-chip border border-line bg-base-200/40 text-dim transition-colors group-hover:text-base-content"
          >
            <component :is="surface.icon" class="size-4" aria-hidden="true" />
          </span>
          <h3 class="mt-3 text-[13px] font-semibold text-base-content">
            {{ surface.title }}
          </h3>
          <p class="mt-1 text-2xs leading-relaxed text-faint">
            {{ surface.description }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- Newest posts -->
    <section class="border-t border-line py-10">
      <header class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 class="title text-base text-base-content">{{ t("landing.latestTitle") }}</h2>
          <p class="voice mt-1 text-[13px]">{{ t("landing.latestDescription") }}</p>
        </div>
        <NuxtLink to="/timeline" class="text-2xs text-faint transition-colors hover:text-dim">
          {{ t("sidebar.viewAll") }}
        </NuxtLink>
      </header>

      <ConsolePanel flush>
        <LoadingSkeleton v-if="status === 'pending'" variant="feed" :rows="4" />

        <p v-else-if="!latest.length" class="voice px-6 py-10 text-center">
          {{ t("home.emptyDesc") }}
        </p>

        <template v-else>
          <PostCard v-for="post in latest" :key="post.id" :post="post" variant="feed" />
        </template>
      </ConsolePanel>
    </section>

  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowRight,
  IconCompass,
  IconSearch,
  IconTag,
  IconBuilding,
} from "#components";
import { fetchPosts, signInUrl } from "~/utils/api";
import type { Post } from "~/types/post";

definePageMeta({
  // `/` is the public landing page — signed-in visitors belong in the feed.
  middleware: () => {
    if (useAuth().isAuthenticated.value) {
      return navigateTo("/timeline");
    }
  },
});

const { t } = useI18n();
const { isAuthenticated, user } = useAuth();

const signInHref = signInUrl("/");

const surfaces = computed(() => [
  {
    href: "/timeline",
    icon: IconCompass,
    title: t("landing.surfaces.feed.title"),
    description: t("landing.surfaces.feed.description"),
  },
  {
    href: "/search",
    icon: IconSearch,
    title: t("landing.surfaces.search.title"),
    description: t("landing.surfaces.search.description"),
  },
  {
    href: "/tags",
    icon: IconTag,
    title: t("landing.surfaces.tags.title"),
    description: t("landing.surfaces.tags.description"),
  },
  {
    href: "/realms",
    icon: IconBuilding,
    title: t("landing.surfaces.realms.title"),
    description: t("landing.surfaces.realms.description"),
  },
]);

// The newest public posts, rendered on the server so the landing carries real
// content in its first HTML response rather than a placeholder that fills in.
const { data: latestPosts, status } = await useAsyncData(
  "landing-latest-posts",
  async () => {
    try {
      const result = await fetchPosts(6, 0, { orderDesc: true });
      return result.posts;
    } catch (error) {
      console.error("Failed to load the newest posts:", error);
      return [] as Post[];
    }
  },
  { default: () => [] as Post[] },
);

const latest = computed(() => latestPosts.value ?? []);

defineOgImage("UniOgImage", {
  title: "Solar Network",
  description: t("landing.seoDescription"),
});

useSolarSeo({
  title: t("landing.seoTitle"),
  description: t("landing.seoDescription"),
  url: "https://solian.app",
  breadcrumbs: [{ name: "Home", item: "https://solian.app" }],
});
</script>
