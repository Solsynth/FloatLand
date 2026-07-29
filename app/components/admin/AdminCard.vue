<template>
  <div
    class="rounded-box bg-base-100 shadow-sm"
    :class="[
      hoverable
        ? 'cursor-pointer transition-colors duration-150 hover:bg-base-200'
        : '',
    ]"
  >
    <!-- Header -->
    <div
      v-if="$slots.header || $slots.actions || title"
      class="flex items-center justify-between gap-3 bg-base-200/60"
      :class="[compact ? 'px-4 py-3' : 'px-5 py-3.5']"
    >
      <div v-if="title" class="min-w-0">
        <h3 class="font-semibold text-sm text-base-content leading-snug">
          {{ title }}
        </h3>
        <p
          v-if="description"
          class="text-xs text-base-content/45 mt-0.5 leading-relaxed"
        >
          {{ description }}
        </p>
      </div>
      <slot name="header" />
      <div v-if="$slots.actions" class="shrink-0 flex items-center gap-1">
        <slot name="actions" />
      </div>
    </div>

    <!-- Body -->
    <div :class="[noPadding ? 'p-0' : compact ? 'p-4' : 'p-5']">
      <slot />
    </div>

    <!-- Footer -->
    <div
      v-if="$slots.footer"
      class="bg-base-200"
      :class="[compact ? 'px-4 py-3' : 'px-5 py-3.5']"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    compact?: boolean
    hoverable?: boolean
    noPadding?: boolean
  }>(),
  {
    compact: false,
    hoverable: false,
    noPadding: false,
  },
)
</script>
