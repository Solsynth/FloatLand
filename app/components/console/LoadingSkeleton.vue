<script setup lang="ts">
import { computed } from "vue"

/**
 * Loading placeholder: the shape of the content that is about to render.
 *
 * A surface that has not resolved yet shows the same row height, column count
 * and spacing as its loaded state, so a reader sees that something is arriving
 * instead of a page that looks broken, and the real content lands where the
 * placeholder was. Bars are `aria-hidden` and carry no text, so assistive
 * technology never reads a placeholder row as content. The sweep is one
 * opacity animation that the global reduced-motion rule neutralizes.
 *
 * `variant="columns"` is a table: one bar per column, split by the supplied
 * width ratios. `variant="rows"` is a feed list: an avatar tile, a name line
 * and two body lines, matching a post card.
 */
const props = withDefaults(
  defineProps<{
    /** Row count. */
    rows?: number
    /** Flex width ratios per column, e.g. `[3, 2, 1]`. */
    columns?: number[]
    /** Bar height for body rows. */
    height?: string
    /** Draw hairline row separators, matching `table.ledger`. */
    rules?: boolean
    /** Show a header row of shorter bars above the body rows. */
    header?: boolean
    /** Shape to draw: table columns, two-tier list rows, or feed cards. */
    variant?: "columns" | "rows" | "feed"
    /** Center the placeholder inside a min-height box. */
    compact?: boolean
  }>(),
  {
    rows: 4,
    columns: () => [3, 2],
    height: "h-3",
    rules: true,
    header: false,
    variant: "columns",
    compact: false,
  },
)

const total = computed(() => props.columns.reduce((sum, width) => sum + width, 0))
const widthOf = (width: number) => `${(width / total.value) * 100}%`
</script>

<template>
  <div :class="compact ? 'flex min-h-32 items-center' : ''">
    <div class="w-full">
      <div v-if="variant === 'feed'" class="flex flex-col gap-2.5">
        <div
          v-for="row in rows"
          :key="`feed-${row}`"
          class="flex gap-3 px-4 py-4"
          :class="rules ? 'rounded-card bg-raised' : ''"
        >
          <span class="skeleton size-9 shrink-0 rounded-full" aria-hidden="true" />
          <div class="min-w-0 flex-1 space-y-2.5">
            <div class="flex items-center gap-2">
              <span class="skeleton h-2.5 w-28" aria-hidden="true" />
              <span class="skeleton h-2.5 w-16" aria-hidden="true" />
            </div>
            <span class="skeleton h-2" :style="{ width: `${68 + ((row * 7) % 27)}%` }" aria-hidden="true" />
            <span class="skeleton h-2 w-1/2" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div v-else-if="variant === 'rows'" class="flex flex-col gap-1.5">
        <div
          v-for="row in rows"
          :key="`row-${row}`"
          class="space-y-2 px-2 py-3"
          :class="rules ? 'rounded-chip bg-raised' : ''"
        >
          <div class="flex items-center gap-2">
            <span class="skeleton h-3 w-32" aria-hidden="true" />
            <span class="skeleton h-4 w-14" aria-hidden="true" />
          </div>
          <span class="skeleton h-2 w-full max-w-md" aria-hidden="true" />
          <span class="skeleton h-2 w-24" aria-hidden="true" />
        </div>
      </div>

      <template v-else>
        <div v-if="header" class="flex gap-4 pb-2">
          <span
            v-for="(width, index) in columns"
            :key="`head-${index}`"
            class="skeleton h-2"
            :style="{ width: widthOf(width) }"
            aria-hidden="true"
          />
        </div>
        <div
          v-for="row in rows"
          :key="row"
          class="flex items-center gap-4 px-3 py-3"
          :class="rules ? 'rounded-chip bg-raised' : ''"
        >
          <span
            v-for="(width, index) in columns"
            :key="`${row}-${index}`"
            class="skeleton"
            :class="height"
            :style="{ width: widthOf(width) }"
            aria-hidden="true"
          />
        </div>
      </template>
    </div>
  </div>
</template>
