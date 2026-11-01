<script setup lang="ts">
/**
 * Page title block. The heading is the only display type on the page, so it
 * carries the size; the description is `.voice` because it explains rather
 * than labels.
 */
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <h1 class="title text-xl text-base-content sm:text-2xl">
        {{ title }}
      </h1>
      <p v-if="description" class="voice mt-2.5 max-w-2xl">
        {{ description }}
      </p>
      <slot name="meta" />
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
