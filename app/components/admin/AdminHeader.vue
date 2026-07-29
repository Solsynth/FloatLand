<template>
  <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100">
    <div class="flex items-center h-14 px-4 lg:px-6">
      <!-- Left: Breadcrumbs + Page Title -->
      <div class="flex items-center gap-2.5 min-w-0">
        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-sm lg:hidden"
          @click="$emit('toggleMobileMenu')"
        >
          <IconMenu class="w-5 h-5" />
        </button>

        <!-- Breadcrumbs -->
        <nav
          v-if="breadcrumbs && breadcrumbs.length > 0"
          class="hidden sm:flex items-center gap-1 text-sm min-w-0"
          aria-label="Breadcrumb"
        >
          <template v-for="(crumb, ci) in breadcrumbs" :key="ci">
            <NuxtLink
              v-if="ci < breadcrumbs.length - 1"
              :to="crumb.href"
              class="truncate text-base-content/45 hover:text-base-content transition-colors duration-150 max-w-[10rem]"
            >
              {{ crumb.label }}
            </NuxtLink>
            <span
              v-else
              class="truncate font-semibold text-base-content max-w-[14rem]"
              aria-current="page"
            >
              {{ crumb.label }}
            </span>
            <IconChevronRight
              v-if="ci < breadcrumbs.length - 1"
              class="w-3.5 h-3.5 shrink-0 text-base-content/25"
            />
          </template>
        </nav>

        <!-- Page Title (mobile) -->
        <h1 class="sm:hidden text-sm font-semibold truncate">
          {{ pageTitle || '' }}
        </h1>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { IconMenu, IconChevronRight } from '#components'

defineProps<{
  breadcrumbs?: Array<{ label: string; href: string }>
  pageTitle?: string
}>()

defineEmits<{
  toggleMobileMenu: []
}>()
</script>
