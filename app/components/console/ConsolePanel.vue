<script setup lang="ts">
/**
 * A grouped region of a page: a tonal plate with a caption, a body, and an
 * optional footer. Separation comes from the surface tone and the space
 * around it, never from a rule inside the body; a table that reaches the panel
 * edge closes itself with its own header rule (`.table-bleed`).
 *
 * `flush` drops the body inset so a full-bleed list can meet the card edge
 * while the header keeps the panel rhythm.
 */
withDefaults(
  defineProps<{
    title?: string
    note?: string
    /** Remove the body's horizontal and vertical inset. */
    flush?: boolean
  }>(),
  { flush: false },
)
</script>

<template>
  <section class="overflow-hidden rounded-card border border-line bg-base-200/30">
    <header
      v-if="title || note || $slots.header"
      class="flex flex-wrap items-baseline justify-between gap-2 px-6 pb-1.5 pt-5"
    >
      <h2 v-if="title" class="text-2xs uppercase tracking-[0.16em] text-dim">{{ title }}</h2>
      <span v-if="note" class="text-2xs text-faint">{{ note }}</span>
      <slot name="header" />
    </header>
    <div :class="flush ? (title ? 'pb-4' : '') : 'px-6 py-5'">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="px-6 pb-4 pt-1">
      <slot name="footer" />
    </footer>
  </section>
</template>
