<template>
  <NuxtLayout name="app">
    <main class="mx-auto max-w-2xl px-4 py-6">
      <div v-if="pending" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg" /></div>
      <div v-else-if="attempt" class="border border-base-300 p-6">
        <h1 class="text-xl font-semibold">{{ attempt.title || 'Test result' }}</h1>
        <p class="mt-2 text-sm text-base-content/60">{{ resultMessage }}</p>
        <dl class="mt-6 space-y-2 text-sm">
          <div v-if="attempt.score !== null && attempt.score !== undefined"><dt class="inline text-base-content/60">Score: </dt><dd class="inline font-medium">{{ attempt.score.toFixed(1) }}%</dd></div>
          <div><dt class="inline text-base-content/60">Status: </dt><dd class="inline">{{ statusLabel }}</dd></div>
        </dl>
        <section v-if="hasReview" class="mt-6 border-t border-base-300 pt-5">
          <h2 class="text-base font-semibold">Answer review</h2>
          <div class="mt-4 space-y-4">
            <article v-for="question in attempt.questions" :key="question.id" class="border border-base-300 p-4">
              <div class="flex flex-wrap items-start justify-between gap-2"><p class="font-medium">{{ question.content }}</p><span v-if="answerFor(question.id)?.isCorrect === true" class="text-sm text-success">Correct</span><span v-else-if="answerFor(question.id)?.isCorrect === false" class="text-sm text-error">Incorrect</span><span v-else-if="hasAnswer(question.id)" class="text-sm text-base-content/60">{{ attempt.status === 1 ? 'Awaiting review' : 'Answer recorded' }}</span><span v-else class="text-sm text-base-content/60">Not answered</span></div>
              <p v-if="selectedChoices(question.id).length" class="mt-3 text-sm"><span class="text-base-content/60">Your answer: </span>{{ selectedChoices(question.id).join(', ') }}</p>
              <p v-else-if="answerFor(question.id)?.value?.text" class="mt-3 whitespace-pre-wrap text-sm"><span class="text-base-content/60">Your answer: </span>{{ answerFor(question.id)?.value?.text }}</p>
              <p v-else class="mt-3 text-sm text-base-content/60">No answer</p>
              <p v-if="answerFor(question.id)?.reviewNote" class="mt-2 whitespace-pre-wrap text-sm"><span class="text-base-content/60">Reviewer note: </span>{{ answerFor(question.id)?.reviewNote }}</p>
            </article>
          </div>
        </section>
        <div class="mt-6 flex justify-end"><NuxtLink :to="attempt.isTrial ? '/admin/tests' : '/accounts/me/activation'" class="btn btn-primary">{{ attempt.isTrial ? 'Back to tests' : 'View activation progress' }}</NuxtLink></div>
      </div>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { ParticipantAttempt } from '~/types/test'

const attemptId = useRoute().params.attemptId as string
const attempt = ref<ParticipantAttempt | null>(null)
const pending = ref(true)

try {
  attempt.value = await safeJsonParse<ParticipantAttempt>(await apiFetch(`/passport/tests/attempts/${attemptId}`))
} finally {
  pending.value = false
}

const statusLabel = computed(() => ['In progress', 'Pending review', 'Passed', 'Failed', 'Expired'][attempt.value?.status ?? 0] ?? 'Unknown')
const resultMessage = computed(() => {
  if (!attempt.value) return ''
  if (attempt.value.status === 1) return 'Your answers are awaiting manual review.'
  if (attempt.value.status === 2) return attempt.value.isTrial ? 'Trial completed. This did not affect your account.' : 'You passed this test.'
  if (attempt.value.status === 3) return 'This attempt did not reach the passing score.'
  if (attempt.value.status === 4) return 'This attempt expired before it was submitted.'
  return 'Your attempt has been recorded.'
})
const hasReview = computed(() => attempt.value?.status !== 0)
function answerFor(questionId: string) { return attempt.value?.answers?.find(answer => answer.questionId === questionId) }
function selectedChoices(questionId: string) {
  const selected = answerFor(questionId)?.value?.choiceIds ?? []
  return attempt.value?.questions.find(question => question.id === questionId)?.choices.filter(choice => selected.includes(choice.id)).map(choice => choice.content) ?? []
}
function hasAnswer(questionId: string) { const answer = answerFor(questionId); return (answer?.value?.choiceIds?.length ?? 0) > 0 || Boolean(answer?.value?.text?.trim()) }
</script>
