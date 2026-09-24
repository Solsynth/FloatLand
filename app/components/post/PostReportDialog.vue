<template>
  <DialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[100] bg-black/40" />
      <DialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-base-100 rounded-box p-6 w-[90vw] max-w-md shadow-lg"
      >
        <DialogTitle class="text-lg font-semibold mb-1">
          {{ t('post.reportTitle') }}
        </DialogTitle>
        <DialogDescription class="text-sm text-base-content/60 mb-4">
          {{ t('post.reportHint') }}
        </DialogDescription>

        <form @submit.prevent="submit">
          <label class="label label-text font-medium">
            {{ t('post.reportReason') }}
          </label>
          <textarea
            v-model="reason"
            rows="4"
            class="textarea textarea-bordered w-full resize-none"
            :placeholder="t('post.reportReasonPlaceholder')"
            :maxlength="500"
          />
          <p v-if="error" class="mt-2 text-xs text-error">
            {{ error }}
          </p>

          <div class="mt-5 flex justify-end gap-3">
            <button
              type="button"
              class="btn btn-ghost"
              :disabled="submitting"
              @click="$emit('update:open', false)"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-error gap-1.5"
              :disabled="!reason.trim() || submitting"
            >
              <IconLoader v-if="submitting" class="h-4 w-4 animate-spin" />
              <IconFlag v-else class="h-4 w-4" />
              {{ submitting ? t('post.reporting') : t('post.reportSubmit') }}
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { IconFlag, IconLoader } from '#components'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { createTicket } from '~/utils/tickets'
import { TicketType } from '~/types/ticket'

const props = defineProps<{
  open: boolean
  postId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submitted: []
}>()

const { t } = useI18n()
const { $toast } = useNuxtApp()

const reason = ref('')
const submitting = ref(false)
const error = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) {
      reason.value = ''
      error.value = ''
    }
  },
)

async function submit() {
  if (!reason.value.trim() || submitting.value) return
  submitting.value = true
  error.value = ''

  try {
    await createTicket({
      title: t('post.reportTitle'),
      content: reason.value.trim(),
      type: TicketType.Support,
      resources: [`post:${props.postId}`],
    })
    emit('submitted')
    emit('update:open', false)
    $toast.success(t('post.reportSubmitted'))
  } catch (e) {
    console.error('Failed to report post:', e)
    error.value = t('post.reportFailed')
  } finally {
    submitting.value = false
  }
}
</script>
