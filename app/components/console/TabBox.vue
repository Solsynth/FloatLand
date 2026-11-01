<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"

/**
 * The console's boxed tab strip: 1 px border, hairline dividers, the active tab
 * filled with `base-300`. A tab with a `to` is a route link; one without is a
 * local view switch and renders a toggle button, so both read as the same
 * control without a second set of classes.
 */
export interface ConsoleTab {
  key: string
  label: string
  /** Present for route tabs; absent for local view switches. */
  to?: string
}

const props = withDefaults(
  defineProps<{
    tabs: ConsoleTab[]
    active: string
    label: string
    /** Drop the strip's bottom margin when the caller spaces it itself. */
    flush?: boolean
  }>(),
  { flush: false },
)

const emit = defineEmits<{ select: [key: string] }>()

const root = ref<HTMLElement | null>(null)

const tabClass = (current: boolean) =>
  current ? "bg-base-300 text-base-content" : "text-faint hover:bg-base-300/50 hover:text-dim"

/**
 * The strip scrolls instead of wrapping once the tabs are wider than the card,
 * which on a narrow viewport would leave the current tab past the right edge:
 * the page would open showing no tab that names where you are. Reveal it when
 * the strip mounts, whenever the selection moves, and when the strip resizes
 * (a window narrowed under a selection that used to fit).
 */
function revealActive() {
  const nav = root.value
  if (!nav) return
  const current = nav.querySelector<HTMLElement>('[aria-current="page"], [aria-pressed="true"]')
  if (!current) return
  const strip = nav.getBoundingClientRect()
  const tab = current.getBoundingClientRect()
  if (tab.left < strip.left) nav.scrollLeft -= strip.left - tab.left
  else if (tab.right > strip.right) nav.scrollLeft += tab.right - strip.right
}

// A strip that fit on a wide window can start overflowing when the window
// narrows, pushing the current tab out of view without the selection changing.
// The observer is created on mount because the server has no ResizeObserver.
let resize: ResizeObserver | null = null

onMounted(() => {
  revealActive()
  if (!root.value) return
  resize = new ResizeObserver(revealActive)
  resize.observe(root.value)
})

watch(
  () => props.active,
  () => nextTick(revealActive),
)

onBeforeUnmount(() => resize?.disconnect())
</script>

<template>
  <nav
    ref="root"
    class="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-card border border-line bg-base-200/30 p-1 scrollbar-none"
    :class="flush ? '' : 'mb-6'"
    :aria-label="label"
  >
    <template v-for="tab in tabs" :key="tab.key">
      <NuxtLink
        v-if="tab.to"
        :to="tab.to"
        class="whitespace-nowrap rounded-control px-3.5 py-1.5 text-2xs tracking-[0.02em] transition-colors"
        :class="tabClass(active === tab.key)"
        :aria-current="active === tab.key ? 'page' : undefined"
      >
        {{ tab.label }}
      </NuxtLink>
      <button
        v-else
        type="button"
        class="whitespace-nowrap rounded-control px-3.5 py-1.5 text-2xs tracking-[0.02em] transition-colors"
        :class="tabClass(active === tab.key)"
        :aria-pressed="active === tab.key"
        @click="emit('select', tab.key)"
      >
        {{ tab.label }}
      </button>
    </template>
  </nav>
</template>
