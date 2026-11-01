<script setup lang="ts">
import { IconAlertTriangle } from "#components"

/**
 * The one confirmation surface. A destructive action states what it destroys
 * in the body and repeats the verb on the button, so the two never disagree.
 */
const props = withDefaults(
  defineProps<{
    title: string
    body: string
    action: string
    tone?: "error" | "neutral"
    busy?: boolean
  }>(),
  { tone: "neutral", busy: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
    role="presentation"
    @click.self="emit('cancel')"
  >
    <div
      class="modal-box w-full max-w-sm overflow-hidden p-0"
      role="alertdialog"
      aria-modal="true"
      :aria-label="props.title"
    >
      <div class="px-6 py-5">
        <h2 class="flex items-center gap-2 text-sm font-semibold text-base-content">
          <IconAlertTriangle
            v-if="props.tone === 'error'"
            class="size-4 shrink-0 text-error"
            aria-hidden="true"
          />
          {{ props.title }}
        </h2>
        <p class="voice mt-2">{{ props.body }}</p>
      </div>
      <footer class="flex items-center justify-end gap-2 bg-base-200/50 px-5 py-3">
        <button
          type="button"
          class="btn btn-quiet btn-xs"
          :disabled="props.busy"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-xs"
          :class="props.tone === 'error' ? 'btn-error' : 'btn-primary'"
          :disabled="props.busy"
          @click="emit('confirm')"
        >
          {{ props.action }}
        </button>
      </footer>
    </div>
  </div>
</template>
