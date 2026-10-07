<template>
  <NuxtLayout name="app">
    <div class="w-full">
      <!-- Hero: full-bleed band (the app shell only drops its max-width on `/`),
           copy first, client art below. -->
      <section
        class="landing-hero -mx-4 -mt-4 border-b border-base-300 px-4 pb-14 pt-16 md:pt-20 lg:-mx-6 lg:px-6"
      >
        <div class="mx-auto max-w-3xl text-center">
          <p
            class="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/70 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-base-content/60"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {{ t("landing.eyebrow") }}
          </p>
          <h1
            class="mt-6 text-[clamp(2.25rem,6vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight text-base-content"
          >
            {{ t("landing.heroTitle") }}
          </h1>
          <p
            class="mx-auto mt-5 max-w-2xl text-base leading-7 text-base-content/70 md:text-lg md:leading-8"
          >
            {{ t("landing.heroDescription") }}
          </p>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <NuxtLink
              v-if="!isAuthenticated"
              to="/auth/create-account"
              class="btn btn-primary gap-2"
            >
              {{ t("landing.getStarted") }}
              <IconArrowRight class="h-4 w-4" />
            </NuxtLink>
            <NuxtLink
              to="/timeline"
              class="gap-2"
              :class="isAuthenticated ? 'btn btn-primary' : 'btn btn-ghost border border-base-300'"
            >
              {{ isAuthenticated ? t("landing.openApp") : t("landing.explore") }}
            </NuxtLink>
          </div>
          <p v-if="!isAuthenticated" class="mt-4 text-xs text-base-content/55">
            {{ t("landing.haveAccount") }}
            <NuxtLink to="/auth/login" class="link link-primary font-medium">
              {{ t("landing.signIn") }}
            </NuxtLink>
            <span class="px-1 text-base-content/30">·</span>
            <a
              href="https://web.solian.app"
              target="_blank"
              rel="noopener noreferrer"
              class="link"
            >
              {{ t("landing.trySolian") }}
            </a>
          </p>
        </div>

        <img
          src="/images/main-visual.jpg"
          :alt="t('landing.heroTitle')"
          width="1280"
          height="720"
          class="mx-auto mt-12 w-full max-w-4xl rounded-box border border-base-300 object-cover shadow-sm"
        >
      </section>

      <!-- Modules: one card per surface the web client ships with -->
      <section class="px-4 py-16 lg:px-6">
        <header class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-extrabold tracking-tight text-base-content md:text-3xl">
            {{ t("landing.featuresTitle") }}
          </h2>
          <p class="mt-3 text-sm leading-6 text-base-content/65 md:text-base">
            {{ t("landing.featuresDescription") }}
          </p>
        </header>
        <div class="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="feature in features"
            :key="feature.href"
            :to="feature.href"
            class="rounded-box border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary/40 hover:bg-base-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-box bg-primary/10 text-primary"
            >
              <component :is="feature.icon" class="h-5 w-5" />
            </span>
            <h3 class="mt-3.5 text-sm font-bold text-base-content">
              {{ feature.title }}
            </h3>
            <p class="mt-1.5 text-sm leading-6 text-base-content/65">
              {{ feature.description }}
            </p>
          </NuxtLink>
        </div>
      </section>

      <!-- Hubs: the same platform serves publishers, developers and merchants -->
      <section class="border-t border-base-300 px-4 py-16 lg:px-6">
        <header class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-extrabold tracking-tight text-base-content md:text-3xl">
            {{ t("landing.hubsTitle") }}
          </h2>
          <p class="mt-3 text-sm leading-6 text-base-content/65 md:text-base">
            {{ t("landing.hubsDescription") }}
          </p>
        </header>
        <div class="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          <NuxtLink
            v-for="hub in hubs"
            :key="hub.href"
            :to="hub.href"
            class="rounded-box border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary/40 hover:bg-base-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-box bg-primary/10 text-primary"
            >
              <component :is="hub.icon" class="h-5 w-5" />
            </span>
            <h3 class="mt-3.5 text-sm font-bold text-base-content">
              {{ hub.title }}
            </h3>
            <p class="mt-1.5 text-sm leading-6 text-base-content/65">
              {{ hub.description }}
            </p>
          </NuxtLink>
        </div>
      </section>

      <!-- Membership: optional tiers, quiet single band -->
      <section class="px-4 pb-16 lg:px-6">
        <div
          class="mx-auto flex max-w-5xl flex-col items-start gap-6 rounded-box border border-base-300 bg-base-100 p-8 md:flex-row md:items-center md:justify-between"
        >
          <div class="max-w-xl">
            <h2 class="text-xl font-extrabold tracking-tight text-base-content md:text-2xl">
              {{ t("landing.membershipTitle") }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-base-content/65">
              {{ t("landing.membershipDescription") }}
            </p>
          </div>
          <NuxtLink to="/pricing" class="btn btn-primary shrink-0 gap-2">
            {{ t("landing.membershipCta") }}
            <IconSparkles class="h-4 w-4" />
          </NuxtLink>
        </div>
      </section>

      <footer class="border-t border-base-300 px-4 py-10 lg:px-6">
        <div
          class="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex items-center gap-2.5">
            <img src="/favicon.png" alt="" width="32" height="32" class="h-8 w-8">
            <div>
              <p class="text-sm font-semibold text-base-content">Solar Network</p>
              <p class="text-xs text-base-content/55">
                {{ t("landing.footer.copyright", { year: currentYear }) }}
              </p>
            </div>
          </div>
          <nav
            class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-base-content/65"
            :aria-label="t('landing.footer.links')"
          >
            <NuxtLink to="/pricing" class="hover:text-base-content">
              {{ t("landing.footer.pricing") }}
            </NuxtLink>
            <NuxtLink to="/realms" class="hover:text-base-content">
              {{ t("landing.footer.realms") }}
            </NuxtLink>
            <NuxtLink to="/developers" class="hover:text-base-content">
              {{ t("landing.footer.developers") }}
            </NuxtLink>
            <NuxtLink to="/tickets" class="hover:text-base-content">
              {{ t("landing.footer.support") }}
            </NuxtLink>
            <a
              href="https://github.com/solsynth"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-base-content"
            >
              {{ t("landing.footer.sourceCode") }}
            </a>
            <a
              href="https://web.solian.app"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-base-content"
            >
              {{ t("landing.footer.mobile") }}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowRight,
  IconBriefcaseBusiness,
  IconBuilding,
  IconCode,
  IconCompass,
  IconHardDrive,
  IconMail,
  IconMessagesSquare,
  IconPalette,
  IconPawPrint,
  IconSparkles,
  IconTrendingUp,
  IconWallet,
} from "#components";

definePageMeta({
  // `/` is the public landing page — signed-in visitors belong in the app.
  middleware: () => {
    if (useAuth().isAuthenticated.value) {
      return navigateTo("/timeline");
    }
  },
});

const { t } = useI18n();
const { isAuthenticated } = useAuth();

const currentYear = new Date().getFullYear();

const features = computed(() => [
  {
    href: "/timeline",
    icon: IconCompass,
    title: t("landing.features.timeline.title"),
    description: t("landing.features.timeline.description"),
  },
  {
    href: "/realms",
    icon: IconBuilding,
    title: t("landing.features.realms.title"),
    description: t("landing.features.realms.description"),
  },
  {
    href: "/workspaces",
    icon: IconBriefcaseBusiness,
    title: t("landing.features.workspaces.title"),
    description: t("landing.features.workspaces.description"),
  },
  {
    href: "/drive",
    icon: IconHardDrive,
    title: t("landing.features.drive.title"),
    description: t("landing.features.drive.description"),
  },
  {
    href: "/mail",
    icon: IconMail,
    title: t("landing.features.mail.title"),
    description: t("landing.features.mail.description"),
  },
  {
    href: "/chat",
    icon: IconMessagesSquare,
    title: t("landing.features.chat.title"),
    description: t("landing.features.chat.description"),
  },
  {
    href: "/wallets",
    icon: IconWallet,
    title: t("landing.features.wallet.title"),
    description: t("landing.features.wallet.description"),
  },
  {
    href: "/pet",
    icon: IconPawPrint,
    title: t("landing.features.pet.title"),
    description: t("landing.features.pet.description"),
  },
]);

const hubs = computed(() => [
  {
    href: "/creators",
    icon: IconPalette,
    title: t("landing.hubs.creators.title"),
    description: t("landing.hubs.creators.description"),
  },
  {
    href: "/developers",
    icon: IconCode,
    title: t("landing.hubs.developers.title"),
    description: t("landing.hubs.developers.description"),
  },
  {
    href: "/merchants",
    icon: IconTrendingUp,
    title: t("landing.hubs.merchants.title"),
    description: t("landing.hubs.merchants.description"),
  },
]);

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
