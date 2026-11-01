<script setup lang="ts">
/**
 * Compact icon-only action for row headers and toolbars. The label is both the
 * accessible name and the hover tooltip, so an icon never stands alone without
 * an explanation.
 */
const props = withDefaults(
  defineProps<{
    label: string
    tone?: "neutral" | "danger"
    disabled?: boolean
    /** Button size tier, matching the field it sits beside. */
    size?: "xs" | "sm"
  }>(),
  { tone: "neutral", size: "xs" },
)

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="btn btn-quiet px-1"
    :class="[
      props.size === 'xs' ? 'btn-xs' : 'btn-sm',
      props.tone === 'danger' ? 'hover:text-error' : '',
    ]"
    :title="props.label"
    :aria-label="props.label"
    :disabled="props.disabled"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
