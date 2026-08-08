<template>
  <AlertDialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-[100] bg-black/40 transition-opacity duration-200 ease-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
      <AlertDialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-base-100 rounded-box p-6 w-[90vw] max-w-md shadow-lg transition-[opacity,transform] duration-200 ease-out data-[state=open]:scale-100 data-[state=open]:opacity-100 data-[state=closed]:scale-95 data-[state=closed]:opacity-0"
      >
        <AlertDialogTitle class="text-lg font-semibold mb-2">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="text-sm text-base-content/70 mb-6">
          {{ description }}
        </AlertDialogDescription>
        <div class="flex justify-end gap-3">
          <AlertDialogCancel
            v-if="cancelText"
            class="btn btn-ghost"
            @click="$emit('cancel')"
          >
            {{ cancelText }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="btn"
            :class="variant === 'danger' ? 'btn-error' : 'btn-primary'"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}>(), {
  confirmText: 'OK',
  cancelText: '',
  variant: 'default',
})

defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()
</script>
