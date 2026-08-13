<template>
  <header class="sticky top-0 z-50 border-b border-base-300 bg-base-100">
    <div class="flex min-h-14 items-center gap-6 px-4 lg:px-6">
      <!-- Branding -->
      <NuxtLink to="/" class="flex shrink-0 items-center" aria-label="Solar Network">
        <img src="/favicon.png" alt="Solar Network" class="h-8 w-8" />
      </NuxtLink>

      <!-- Left: Breadcrumbs + Page Title -->
      <div class="flex min-w-0 items-center gap-2.5">
        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-sm lg:hidden"
          @click="$emit('toggleMobileMenu')"
        >
          <IconMenu class="h-5 w-5" />
        </button>

        <!-- Breadcrumbs -->
        <nav
          v-if="breadcrumbs && breadcrumbs.length > 0"
          class="hidden min-w-0 items-center gap-1 text-sm sm:flex"
          aria-label="Breadcrumb"
        >
          <template v-for="(crumb, ci) in breadcrumbs" :key="ci">
            <NuxtLink
              v-if="ci < breadcrumbs.length - 1"
              :to="crumb.href"
              class="max-w-[10rem] truncate text-base-content/45 transition-colors duration-150 hover:text-base-content"
            >
              {{ crumb.label }}
            </NuxtLink>
            <span
              v-else
              class="max-w-[14rem] truncate font-semibold text-base-content"
              aria-current="page"
            >
              {{ crumb.label }}
            </span>
            <IconChevronRight
              v-if="ci < breadcrumbs.length - 1"
              class="h-3.5 w-3.5 shrink-0 text-base-content/25"
            />
          </template>
        </nav>

        <!-- Page Title (mobile) -->
        <h1 class="truncate text-sm font-semibold sm:hidden">
          {{ pageTitle || "" }}
        </h1>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { IconMenu, IconChevronRight } from "#components";

defineProps<{
  breadcrumbs?: Array<{ label: string; href: string }>;
  pageTitle?: string;
}>();

defineEmits<{
  toggleMobileMenu: [];
}>();
</script>
