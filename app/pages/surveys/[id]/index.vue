<template>
  <NuxtLayout name="app">
    <div class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6 gap-y-4">
    <!-- Main Content -->
    <div class="min-w-0">
    <!-- Mobile Header -->
    <div class="lg:hidden sticky z-10 -mx-4 -mt-4 top-16 mb-2">
      <div class="flex items-center gap-3 bg-base-100 px-4 py-3">
        <button class="btn btn-circle btn-ghost btn-sm" @click="handleBack">
          <IconArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-bold truncate">{{ survey?.title || t('surveys.title') }}</h1>
      </div>
    </div>

    <div class="max-w-2xl mx-auto py-6 px-4">
      <ConfuseSpinner v-if="pending" />

      <div v-else-if="errorData" class="alert alert-error">
        <span>{{ errorData }}</span>
      </div>

      <template v-else-if="survey">
        <!-- Already answered — read-only summary -->
        <div v-if="existingAnswer && !editing" class="space-y-6">
          <div class="alert alert-success">
            <IconCheckCircle class="w-5 h-5 shrink-0" />
            <span>{{ t('surveys.answered') }}</span>
          </div>

          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-6">
              <h2 class="font-bold text-lg">{{ survey.title || t('surveys.untitled') }}</h2>
              <p v-if="survey.description" class="text-base-content/60 mt-1 whitespace-pre-wrap">{{ survey.description }}</p>

              <div v-if="survey.endedAt" class="flex items-center gap-2 mt-2 text-xs">
                <span v-if="isEnded" class="badge badge-error badge-xs">{{ t('surveys.ended') }}</span>
                <span class="text-base-content/40">{{ t('surveys.endedAt') }} {{ formatDate(survey.endedAt) }}</span>
              </div>

              <div class="h-3" />

              <div class="space-y-4">
                <div v-for="q in survey.questions" :key="q.id" class="space-y-1">
                  <div class="font-medium text-sm">{{ q.title }} <span v-if="q.isRequired" class="text-error">*</span></div>
                  <div class="text-sm text-base-content/80 pl-2">{{ displayAnswer(q, existingAnswer.answer[q.id]) }}</div>
                </div>
              </div>
            </div>
            <div class="card-footer flex gap-2 px-6 py-3">
              <button class="btn btn-ghost btn-sm" @click="editing = true">
                <IconEdit class="w-4 h-4" /> {{ t('common.edit') }}
              </button>
              <button class="btn btn-ghost btn-sm text-error" @click="deleteAnswer">
                <IconTrash class="w-4 h-4" /> {{ t('common.delete') }}
              </button>
            </div>
          </div>


        </div>

        <!-- Ended survey, no answer — show results -->
        <div v-else-if="isEnded && !existingAnswer" class="space-y-6">
          <div class="alert alert-info">
            <IconInfo class="w-5 h-5 shrink-0" />
            <span>{{ t('surveys.endedNoAnswer') }}</span>
          </div>

          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-6">
              <h2 class="font-bold text-lg">{{ survey.title || t('surveys.untitled') }}</h2>
              <p v-if="survey.description" class="text-base-content/60 mt-1 whitespace-pre-wrap">{{ survey.description }}</p>
              <p class="text-xs text-base-content/40 mt-1">{{ t('surveys.endedAt') }} {{ formatDate(survey.endedAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Answer form (or login prompt) -->
        <div v-else>
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-6">
              <h2 class="font-bold text-lg">{{ survey.title || t('surveys.untitled') }}</h2>
              <p v-if="survey.description" class="text-base-content/60 mt-1 whitespace-pre-wrap">{{ survey.description }}</p>
              <p v-if="survey.endedAt" class="text-xs text-base-content/40 mt-1">
                {{ t('surveys.endsAt') }} {{ formatDate(survey.endedAt) }}
              </p>
            </div>
          </div>

          <div v-if="!isAuthenticated" class="card bg-base-100 shadow-sm mt-4">
            <div class="card-body p-6 text-center">
              <p class="text-base-content/60 mb-4">{{ t('surveys.loginPrompt') }}</p>
              <NuxtLink :to="`/auth/login?returnUrl=${returnUrl}`" class="btn btn-primary">
                {{ t('surveys.login') }}
              </NuxtLink>
            </div>
          </div>

          <form v-else @submit.prevent="submitAnswer" class="mt-4 space-y-4">
            <div
              v-for="q in survey.questions"
              :key="q.id"
              class="card bg-base-100 shadow-sm"
            >
              <div class="card-body p-5">
                <div class="font-medium text-sm mb-3">
                  {{ q.title }}
                  <span v-if="q.isRequired" class="text-error">*</span>
                </div>

                <!-- Single Choice -->
                <div v-if="q.type === 0" class="space-y-2">
                  <label
                    v-for="opt in q.options"
                    :key="opt.id"
                    class="flex cursor-pointer items-center gap-3 rounded-box bg-base-200 p-2 transition-colors hover:bg-base-300"
                    :class="{ 'bg-primary/10': answers[q.id] === opt.id }"
                  >
                    <input
                      type="radio"
                      :name="q.id"
                      :value="opt.id"
                      :checked="answers[q.id] === opt.id"
                      class="radio radio-sm"
                      @change="answers[q.id] = opt.id"
                    />
                    <span class="text-sm">{{ opt.label }}</span>
                  </label>
                </div>

                <!-- Multiple Choice -->
                <div v-if="q.type === 1" class="space-y-2">
                  <label
                    v-for="opt in q.options"
                    :key="opt.id"
                    class="flex cursor-pointer items-center gap-3 rounded-box bg-base-200 p-2 transition-colors hover:bg-base-300"
                    :class="{ 'bg-primary/10': (answers[q.id] || []).includes(opt.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="opt.id"
                      :checked="(answers[q.id] || []).includes(opt.id)"
                      class="checkbox checkbox-sm"
                      @change="toggleMulti(q.id, opt.id)"
                    />
                    <span class="text-sm">{{ opt.label }}</span>
                  </label>
                </div>

                <!-- Yes/No -->
                <div v-if="q.type === 2" class="flex gap-4">
                  <label
                    class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-box bg-base-200 p-3 transition-colors hover:bg-base-300"
                    :class="{ 'bg-primary/10': answers[q.id] === true }"
                  >
                    <input
                      type="radio"
                      :name="q.id"
                      :value="true"
                      :checked="answers[q.id] === true"
                      class="radio radio-sm"
                      @change="answers[q.id] = true"
                    />
                    <span class="text-sm font-medium">{{ t('surveys.yes') }}</span>
                  </label>
                  <label
                    class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-box bg-base-200 p-3 transition-colors hover:bg-base-300"
                    :class="{ 'bg-primary/10': answers[q.id] === false }"
                  >
                    <input
                      type="radio"
                      :name="q.id"
                      :value="false"
                      :checked="answers[q.id] === false"
                      class="radio radio-sm"
                      @change="answers[q.id] = false"
                    />
                    <span class="text-sm font-medium">{{ t('surveys.no') }}</span>
                  </label>
                </div>

                <!-- Rating -->
                <div v-if="q.type === 3" class="flex items-center gap-1">
                  <button
                    v-for="star in ratingRange(q)"
                    :key="star"
                    type="button"
                    class="btn btn-circle btn-sm transition-colors"
                    :class="(answers[q.id] || 0) >= star ? 'text-warning' : 'text-base-content/20'"
                    @click="answers[q.id] = star"
                  >
                    <IconStar class="w-5 h-5" :class="(answers[q.id] || 0) >= star ? 'fill-current' : ''" />
                  </button>
                  <span v-if="answers[q.id]" class="text-xs text-base-content/50 ml-2">{{ answers[q.id] }} / {{ q.maxValue || 5 }}</span>
                </div>

                <!-- Free Text -->
                <div v-if="q.type === 4">
                  <textarea
                    v-model="answers[q.id]"
                    :maxlength="q.maxLength || undefined"
                    :placeholder="t('surveys.freeTextPlaceholder')"
                    class="textarea textarea-bordered w-full min-h-[80px] resize-none"
                    @input="validateFreeText(q, $event)"
                  />
                  <div v-if="q.maxLength" class="text-xs text-base-content/40 text-right mt-1">
                    {{ (answers[q.id] || '').length }} / {{ q.maxLength }}
                  </div>
                </div>

                <div v-if="fieldErrors[q.id]" class="text-xs text-error mt-1">
                  {{ fieldErrors[q.id] }}
                </div>
              </div>
            </div>

            <div class="card bg-base-100 shadow-sm">
              <div class="card-body p-4 flex flex-row items-center justify-between">
                <div class="text-xs text-base-content/50">{{ t('surveys.requiredHint') }}</div>
                <div class="flex gap-2">
                  <button type="button" class="btn btn-ghost btn-sm" @click="handleBack">{{ t('common.cancel') }}</button>
                  <button type="submit" class="btn btn-primary btn-sm" :disabled="submitting || !isValid">
                    <IconLoader v-if="submitting" class="w-4 h-4 animate-spin" />
                    <IconSend v-else class="w-4 h-4" />
                    {{ existingAnswer ? t('common.save') : t('surveys.submit') }}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Results (shown when authenticated and stats available) -->
        <div v-if="survey.stats" class="space-y-4 mt-6">
          <div class="flex items-center gap-2">
            <IconBarChart3 class="w-5 h-5 text-base-content/60" />
            <h3 class="font-bold">{{ t('surveys.results') }}</h3>
            <span class="text-xs text-base-content/40">{{ t('surveys.responseCount', { count: totalResponses }) }}</span>
          </div>
          <SurveyResults :questions="survey.questions" :stats="survey.stats" />
        </div>

        <!-- Success toast -->
        <div class="toast toast-end">
          <div v-if="toast" class="alert" :class="toastType">
            <span>{{ toast }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>

    <!-- Right Sidebar (20rem rail) -->
    <div v-if="survey" class="hidden w-full space-y-4 self-start sticky top-20 xl:block">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h3 class="font-bold text-sm">{{ survey.title || t('surveys.untitled') }}</h3>
          <div class="flex flex-wrap gap-2 mt-2">
            <span class="badge badge-sm" :class="statusBadge">{{ statusLabel }}</span>
            <span v-if="survey.isAnonymous" class="badge badge-ghost badge-xs">{{ t('surveys.anonymous') }}</span>
          </div>
          <div class="text-xs text-base-content/40 mt-2 space-y-1">
            <div>{{ t('surveys.questions') }}: {{ survey.questions.length }}</div>
            <div v-if="survey.endedAt">
              {{ isEnded ? t('surveys.endedAt', { date: formatDate(survey.endedAt) }) : t('surveys.endsAt', { date: formatDate(survey.endedAt) }) }}
            </div>
            <div v-if="totalResponses > 0">{{ t('surveys.responseCount', { count: totalResponses }) }}</div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 text-xs text-base-content/50">
          {{ t('surveys.sidebarHint') }}
        </div>
      </div>
    </div>
  </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconCheckCircle, IconEdit, IconTrash, IconStar, IconLoader, IconSend, IconBarChart3, IconInfo } from '#components'
import type { SnSurveyWithStats, SnSurveyQuestion } from '~/types/creator'
import { fetchSurvey } from '~/utils/creator'
import { apiFetch } from '~/utils/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const surveyId = computed(() => route.params.id as string)

const auth = useAuth()
const { isAuthenticated } = auth

const returnUrl = computed(() => encodeURIComponent(route.fullPath))

const pending = ref(true)
const errorData = ref<string | null>(null)
const survey = ref<SnSurveyWithStats | null>(null)
const existingAnswer = ref<SnSurveyWithStats['userAnswer']>(null)
const editing = ref(false)
const submitting = ref(false)
const answers = reactive<Record<string, unknown>>({})
const fieldErrors = reactive<Record<string, string>>({})

const isEnded = computed(() => {
  if (!survey.value?.endedAt) return false
  return new Date(survey.value.endedAt) < new Date()
})

const statusBadge = computed(() => {
  if (!survey.value) return ''
  if (isEnded.value || survey.value.status === 2) return 'badge-error'
  if (survey.value.status === 1) return 'badge-success'
  return 'badge-warning'
})

const statusLabel = computed(() => {
  if (!survey.value) return ''
  if (isEnded.value || survey.value.status === 2) return t('surveys.ended')
  if (survey.value.status === 1) return t('surveys.open')
  return t('surveys.draft')
})

const totalResponses = computed(() => {
  if (!survey.value?.stats) return 0
  const qs = survey.value.questions
  if (!qs.length) return 0
  const first = qs[0]
  const s = survey.value.stats[first.id]
  if (!s) return 0
  return Object.values(s).reduce((sum, v) => sum + v, 0)
})

// Toast
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type = 'alert-success') {
  toast.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}
const toastType = ref('alert-success')

async function loadSurvey() {
  pending.value = true
  errorData.value = null
  try {
    const result = await fetchSurvey(surveyId.value)
    survey.value = result
    existingAnswer.value = result.userAnswer

    // Populate answers from existing submission
    if (result.userAnswer) {
      const ans = result.userAnswer.answer
      for (const q of result.questions) {
        if (ans[q.id] !== undefined) {
          answers[q.id] = ans[q.id]
        }
      }
    }
  } catch (e) {
    errorData.value = String(e)
  } finally {
    pending.value = false
  }
}

await loadSurvey()

function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'long' })
}

// Multi-select helpers
function toggleMulti(qid: string, optId: string) {
  const arr: string[] = (answers[qid] as string[]) || []
  const idx = arr.indexOf(optId)
  if (idx === -1) {
    answers[qid] = [...arr, optId]
  } else {
    answers[qid] = arr.filter((id) => id !== optId)
  }
}

function ratingRange(q: SnSurveyQuestion): number[] {
  const max = q.maxValue || 5
  const min = q.minValue || 1
  const len = max - min + 1
  return Array.from({ length: len }, (_, i) => i + min)
}

function validateFreeText(q: SnSurveyQuestion, e: Event) {
  const target = e.target as HTMLTextAreaElement
  if (q.maxLength && target.value.length > q.maxLength) {
    target.value = target.value.slice(0, q.maxLength)
  }
}

function displayAnswer(q: SnSurveyQuestion, val: unknown): string {
  if (val === undefined || val === null) return '—'
  if (q.type === 0) {
    const opt = q.options?.find((o) => o.id === val)
    return opt?.label || String(val)
  }
  if (q.type === 1) {
    const ids = val as string[]
    return ids.map((id) => q.options?.find((o) => o.id === id)?.label || id).join(', ')
  }
  if (q.type === 2) return val ? t('surveys.yes') : t('surveys.no')
  if (q.type === 3) return `${val} / ${q.maxValue || 5}`
  return String(val)
}

const isValid = computed(() => {
  if (!survey.value) return false
  for (const q of survey.value.questions) {
    if (!q.isRequired) continue
    const val = answers[q.id]
    if (val === undefined || val === null || val === '') return false
    if (q.type === 1 && Array.isArray(val) && val.length === 0) return false
    if (q.type === 4 && typeof val === 'string' && !val.trim()) return false
  }
  return true
})

async function submitAnswer() {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  fieldErrors.length = 0

  // Build answer payload: omit empty optional fields
  const payload: Record<string, unknown> = {}
  if (!survey.value) return
  for (const q of survey.value.questions) {
    const val = answers[q.id]
    if (val === undefined || val === null) {
      if (!q.isRequired) continue
      fieldErrors[q.id] = t('surveys.required')
      submitting.value = false
      return
    }
    payload[q.id] = val
  }

  try {
    await apiFetch(`/sphere/surveys/${encodeURIComponent(surveyId.value)}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer: payload }),
    })
    showToast(existingAnswer.value ? t('surveys.updated') : t('surveys.submitted'))
    // Reload to show read-only state
    await loadSurvey()
    editing.value = false
  } catch (e) {
    showToast(String(e), 'alert-error')
  } finally {
    submitting.value = false
  }
}

async function deleteAnswer() {
  if (!(await useAlert().confirm('Confirm', t('surveys.deleteConfirm')))) return
  try {
    await apiFetch(`/sphere/surveys/${encodeURIComponent(surveyId.value)}/answer`, {
      method: 'DELETE',
    })
    existingAnswer.value = null
    // Clear answers
    for (const key of Object.keys(answers)) {
      delete answers[key]
    }
    showToast(t('surveys.deleted'))
  } catch (e) {
    showToast(String(e), 'alert-error')
  }
}
</script>
