<template>
  <div class="mb-6 flex flex-col gap-3 border-b border-base-300/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <slot name="pre-title" />
        <h1 class="text-2xl font-black tracking-tight text-base-content leading-tight">
          {{ title }}
        </h1>
      </div>
      <p v-if="description" class="mt-1 text-sm leading-relaxed text-base-content/50">
        {{ description }}
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>
