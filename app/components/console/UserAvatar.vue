<script setup lang="ts">
import { IconUser } from "#components"

/**
 * Round identity mark. One component for accounts and publishers, because both
 * carry a display name and an optional picture and the two are often rendered
 * side by side in a list.
 *
 * A missing picture and a broken image both fall back to initials, and failing
 * that to a neutral glyph, so a stale file reference never leaves a hole. The
 * failure latch is keyed on the source, so a row reused for a different
 * identity retries while one that already failed never re-requests.
 */
const props = withDefaults(
  defineProps<{
    /** Direct image URL; wins over `pictureId`. */
    src?: string
    /** File id resolved through the CDN helper. */
    pictureId?: string | null
    /** Name used for the accessible label and the initials fallback. */
    name?: string | null
    size?: "xs" | "sm" | "md" | "lg"
    /** Square corners for a list tile rather than a person. */
    square?: boolean
  }>(),
  { size: "sm", square: false },
)

const { getFileUrl } = useFileUrls()

const failed = ref(false)

const resolved = computed(() => {
  if (props.src) return props.src
  return props.pictureId ? (getFileUrl(props.pictureId) ?? "") : ""
})

const showImage = computed(() => Boolean(resolved.value) && !failed.value)

const box = computed(
  () =>
    ({
      xs: "size-5 text-[9px]",
      sm: "size-7 text-[10px]",
      md: "size-9 text-xs",
      lg: "size-12 text-sm",
    })[props.size],
)

const initials = computed(() =>
  (props.name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join(""),
)

// A replaced picture must get a fresh chance to load, so the latch is keyed on
// the source rather than on the component's lifetime.
watch(resolved, () => {
  failed.value = false
})
</script>

<template>
  <span
    class="grid shrink-0 place-items-center overflow-hidden border border-line bg-base-300/40 select-none"
    :class="[box, square ? 'rounded-mark' : 'rounded-full', showImage ? '' : 'text-dim']"
  >
    <img
      v-if="showImage"
      :src="resolved"
      :alt="props.name ?? ''"
      class="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <span v-else-if="initials" class="font-semibold" aria-hidden="true">{{ initials }}</span>
    <IconUser v-else class="size-3.5 opacity-70" aria-hidden="true" />
  </span>
</template>
