<template>
  <NuxtLayout name="app">
    <main class="mx-auto max-w-2xl px-4 py-6">
      <NuxtLink to="/accounts/me/activation" class="btn btn-ghost btn-sm mb-4">Leave attempt</NuxtLink>
      <div v-if="pending" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg" /></div>
      <form v-else-if="attempt" class="space-y-5" @submit.prevent="submit">
        <div class="flex flex-wrap items-start justify-between gap-3"><div><h1 class="text-2xl font-bold">{{ attempt.title || 'Test attempt' }}</h1><p class="mt-1 text-sm text-base-content/60">{{ attempt.isTrial ? 'Trial attempt — results do not affect your account.' : 'You may leave any question unanswered.' }}</p></div><div v-if="remainingSeconds !== null" class="text-right"><div class="text-xs text-base-content/60">Time remaining</div><div class="font-mono text-lg font-semibold" :class="{ 'text-error': remainingSeconds === 0 }">{{ formatRemaining(remainingSeconds) }}</div></div></div>
        <section v-for="(question, index) in attempt.questions" :key="question.id" class="card border border-base-300">
          <div class="card-body">
            <div class="flex flex-wrap items-center justify-between gap-2"><p class="font-medium">{{ index + 1 }}. {{ question.content }}</p><p class="text-xs text-base-content/60">{{ question.points }} points · difficulty {{ question.difficulty }}</p></div>
            <div v-if="question.type !== 2" class="space-y-2">
              <label v-for="choice in question.choices" :key="choice.id" class="flex gap-3">
                <input v-if="question.type === 0" :name="question.id" type="radio" class="radio radio-primary" :checked="answers[question.id]?.includes(choice.id)" @change="answers[question.id] = [choice.id]">
                <input v-else v-model="answers[question.id]" type="checkbox" :value="choice.id" class="checkbox checkbox-primary">
                {{ choice.content }}
              </label>
            </div>
            <textarea v-else v-model="texts[question.id]" class="textarea textarea-bordered w-full" />
          </div>
        </section>
        <div class="flex justify-end"><button class="btn btn-primary" :class="{ loading: submitting }" :disabled="submitting || remainingSeconds === 0">Submit test</button></div>
      </form>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { ParticipantAttempt } from '~/types/test'

const attemptId = useRoute().params.attemptId as string
const attempt = ref<ParticipantAttempt | null>(null)
const pending = ref(true)
const submitting = ref(false)
const answers = reactive<Record<string, string[]>>({})
const texts = reactive<Record<string, string>>({})
const now = ref<number | null>(null)
let countdownTimer: ReturnType<typeof setInterval> | undefined
const remainingSeconds = computed(() => {
  if (!attempt.value?.deadlineAt || now.value === null) return null
  return Math.max(0, Math.ceil((new Date(attempt.value.deadlineAt).getTime() - now.value) / 1000))
})

try {
  attempt.value = await safeJsonParse<ParticipantAttempt>(await apiFetch(`/passport/tests/attempts/${attemptId}`))
  attempt.value.questions.forEach(question => { answers[question.id] = [] })
} finally {
  pending.value = false
}

async function submit() {
  if (!attempt.value || submitting.value) return
  submitting.value = true
  try {
    await apiFetch(`/passport/tests/attempts/${attempt.value.id}/submit`, { method: 'POST', body: JSON.stringify({ answers: attempt.value.questions.map(question => ({ question_id: question.id, choice_ids: answers[question.id], text: texts[question.id] })) }) })
    await navigateTo(`/accounts/tests/results/${attempt.value.id}`)
  } finally {
    submitting.value = false
  }
}

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

onMounted(() => {
  now.value = Date.now()
  countdownTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>
