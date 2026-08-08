<template>
  <NuxtLayout name="creator">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">{{ t('creator.surveys.title') }}</h1>
        <button class="btn btn-primary btn-sm" @click="openCreate">
          <IconPlus class="w-4 h-4" />
          {{ t('creator.surveys.create') }}
        </button>
      </div>

      <ConfuseSpinner v-if="status === 'pending'" />

      <div v-else-if="error" class="alert alert-error">
        <span>{{ String(error) }}</span>
      </div>

      <div v-else-if="!surveys.length" class="text-center py-12 text-base-content/50">
        {{ t('creator.surveys.empty') }}
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="survey in surveys"
          :key="survey.id"
          class="card bg-base-100 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1 cursor-pointer" @click="openEdit(survey)">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="badge badge-sm"
                    :class="statusBadge(survey.status)"
                  >{{ statusLabel(survey.status) }}</span>
                  <h3 class="font-medium truncate">{{ survey.title || t('creator.common.untitled') }}</h3>
                </div>
                <p v-if="survey.description" class="text-sm text-base-content/60 line-clamp-2 mt-1">
                  {{ survey.description }}
                </p>
                <div class="flex items-center gap-3 mt-2 text-xs text-base-content/50 flex-wrap">
                  <span>{{ t('creator.surveys.questions') }}: {{ survey.questions.length }}</span>
                  <span v-if="survey.endedAt">{{ formatDate(survey.endedAt) }}</span>
                  <span v-else>{{ t('creator.surveys.noEnd') }}</span>
                  <span v-if="survey.isAnonymous" class="badge badge-ghost badge-xs">Anonymous</span>
                  <span v-if="survey.notifySubscribers" class="badge badge-ghost badge-xs">Notify</span>
                  <span v-if="survey.hideResults" class="badge badge-ghost badge-xs">Hide results</span>
                </div>
              </div>

              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                  <IconMoreVertical class="w-4 h-4" />
                </label>
                <ul tabindex="0" class="dropdown-content menu z-[1] w-44 rounded-box bg-base-100 p-2 shadow">
                  <li v-if="survey.status === 0">
                    <button @click="openEdit(survey)">
                      <IconEdit class="w-4 h-4" /> {{ t('creator.edit') }}
                    </button>
                  </li>
                  <li v-if="survey.status === 0">
                    <button @click="handlePublish(survey.id)">
                      <IconSend class="w-4 h-4" /> {{ t('creator.surveys.publish') }}
                    </button>
                  </li>
                  <li v-if="survey.status === 1">
                    <button @click="handleArchive(survey.id)">
                      <IconArchive class="w-4 h-4" /> {{ t('creator.surveys.archive') }}
                    </button>
                  </li>
                  <li v-if="survey.status !== 0">
                    <button @click="viewFeedback(survey)">
                      <IconMessageSquare class="w-4 h-4" /> {{ t('creator.surveys.feedback') }}
                    </button>
                  </li>
                  <li>
                    <a :href="`/surveys/${survey.id}`" target="_blank" rel="noopener">
                      <IconExternalLink class="w-4 h-4" /> {{ t('common.open') }}
                    </a>
                  </li>
                  <li>
                    <button @click="handleClone(survey.id)">
                      <IconCopy class="w-4 h-4" /> {{ t('creator.surveys.clone') }}
                    </button>
                  </li>
                  <li>
                    <button class="text-error" @click="handleDelete(survey.id)">
                      <IconTrash class="w-4 h-4" /> {{ t('creator.delete') }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="flex justify-center py-4">
          <button class="btn btn-ghost btn-sm" @click="loadMore">
            {{ t('common.loadMore') }}
          </button>
        </div>
      </div>

      <!-- Create/Edit Drawer -->
      <AdminDrawer
        :open="editorOpen"
        :title="editingSurvey ? t('creator.surveys.edit') : t('creator.surveys.create')"
        @update:open="closeEditor"
        content-class="w-[40rem]"
      >
        <div class="space-y-6">
          <!-- Overview Settings -->
          <div>
            <h4 class="font-semibold text-sm mb-3">{{ t('creator.surveys.settings') }}</h4>
            <div class="space-y-3">
              <input
                v-model="form.title"
                :placeholder="t('creator.surveys.titleField')"
                class="input input-bordered w-full"
                maxlength="256"
              />
              <textarea
                v-model="form.description"
                :placeholder="t('creator.surveys.descriptionField')"
                class="textarea textarea-bordered w-full"
                rows="2"
                maxlength="4096"
              />
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="label text-xs">{{ t('creator.surveys.endDate') }}</label>
                  <div class="flex gap-2">
                    <input v-model="form.endedAt" type="datetime-local" class="input input-bordered w-full" />
                    <button
                      v-if="form.endedAt"
                      class="btn btn-ghost btn-sm"
                      :title="t('common.clear')"
                      @click="form.endedAt = ''"
                    >
                      <IconX class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.isAnonymous" type="checkbox" class="checkbox checkbox-sm" />
                <span class="text-sm">{{ t('creator.surveys.anonymous') }}</span>
                <span class="text-xs text-base-content/40">{{ t('creator.surveys.anonymousHint') }}</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.notifySubscribers" type="checkbox" class="checkbox checkbox-sm" />
                <span class="text-sm">{{ t('creator.surveys.notify') }}</span>
                <span class="text-xs text-base-content/40">{{ t('creator.surveys.notifyHint') }}</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.hideResults" type="checkbox" class="checkbox checkbox-sm" />
                <span class="text-sm">{{ t('creator.surveys.hideResults') }}</span>
                <span class="text-xs text-base-content/40">{{ t('creator.surveys.hideResultsHint') }}</span>
              </label>
            </div>
          </div>

          <!-- Questions -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-sm">
                {{ t('creator.surveys.questions') }}
                <span class="text-xs text-base-content/40 font-normal" v-if="form.questions.length">
                  ({{ form.questions.length }})
                </span>
              </h4>
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-xs">
                  <IconPlus class="w-3 h-3" /> {{ t('creator.surveys.addQuestion') }}
                </label>
                <ul tabindex="0" class="dropdown-content menu z-[1] w-48 rounded-box bg-base-100 p-2 shadow">
                  <li v-for="(label, idx) in questionTypes" :key="idx">
                    <button @click="addQuestion(idx)">
                      <component :is="questionTypeIcons[idx]" class="w-4 h-4" />
                      {{ label }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div v-if="!form.questions.length" class="text-sm text-base-content/40 text-center py-8 border border-dashed border-base-300 rounded-lg">
              {{ t('creator.surveys.noQuestions') }}
            </div>

            <div class="space-y-3">
              <div
                v-for="(q, qi) in form.questions"
                :key="q._key"
                class="border border-base-300/50 rounded-lg p-4"
              >
                <div class="flex items-start gap-2">
                  <!-- Drag Handle -->
                  <div class="flex flex-col gap-0.5 pt-1 cursor-grab active:cursor-grabbing" :title="t('creator.surveys.dragToReorder')">
                    <IconGripVertical class="w-4 h-4 text-base-content/30" />
                  </div>

                  <div class="flex-1 space-y-3 min-w-0">
                    <!-- Question header with reorder -->
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-base-content/40 shrink-0">#{{ qi + 1 }}</span>
                      <!-- Move up/down -->
                      <div class="flex gap-0.5">
                        <button
                          v-if="qi > 0"
                          class="btn btn-ghost btn-xs btn-square"
                          @click="moveQuestion(qi, qi - 1)"
                        >
                          <IconChevronUp class="w-3 h-3" />
                        </button>
                        <button
                          v-if="qi < form.questions.length - 1"
                          class="btn btn-ghost btn-xs btn-square"
                          @click="moveQuestion(qi, qi + 1)"
                        >
                          <IconChevronDown class="w-3 h-3" />
                        </button>
                      </div>
                      <select
                        :value="q.type"
                        class="select select-bordered select-sm flex-1"
                        @change="changeQuestionType(qi, Number(($event.target as HTMLSelectElement).value))"
                      >
                        <option v-for="(label, idx) in questionTypes" :key="idx" :value="idx">
                          {{ label }}
                        </option>
                      </select>
                      <label class="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap">
                        <input v-model="q.isRequired" type="checkbox" class="checkbox checkbox-xs" />
                        {{ t('creator.surveys.isRequired') }}
                      </label>
                      <button class="btn btn-ghost btn-xs btn-square text-error shrink-0" @click="removeQuestion(qi)">
                        <IconTrash class="w-3 h-3" />
                      </button>
                    </div>

                    <!-- Title -->
                    <input
                      v-model="q.title"
                      :placeholder="`${t('creator.surveys.questionTitle')}`"
                      class="input input-bordered input-sm w-full"
                      maxlength="1024"
                    />

                    <!-- Description -->
                    <textarea
                      v-model="q.description"
                      :placeholder="t('creator.surveys.questionDescriptionPlaceholder')"
                      class="textarea textarea-bordered textarea-sm w-full"
                      rows="2"
                      maxlength="4096"
                    />

                    <!-- Choice options -->
                    <div v-if="q.type === 0 || q.type === 1" class="space-y-2 pl-1">
                      <div
                        v-for="(opt, oi) in q.options"
                        :key="opt._key"
                        class="flex items-center gap-1"
                      >
                        <span class="text-xs text-base-content/30 w-4 text-right">{{ oi + 1 }}.</span>
                        <input
                          v-model="opt.label"
                          :placeholder="`${t('creator.surveys.optionLabel')} ${oi + 1}`"
                          class="input input-bordered input-xs flex-1"
                          maxlength="1024"
                        />
                        <button
                          class="btn btn-ghost btn-xs btn-square text-error"
                          :disabled="q.options.length <= 2"
                          @click="removeOption(qi, oi)"
                        >
                          <IconX class="w-3 h-3" />
                        </button>
                      </div>
                      <button class="btn btn-ghost btn-xs text-primary" @click="addOption(qi)">
                        <IconPlus class="w-3 h-3" /> {{ t('creator.surveys.addOption') }}
                      </button>
                      <div v-if="q.type === 1" class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-base-content/50">{{ t('creator.surveys.maxSelections') }}:</span>
                        <input
                          v-model.number="q.maxSelections"
                          type="number"
                          min="1"
                          :max="q.options.length"
                          class="input input-bordered input-xs w-20"
                        />
                      </div>
                    </div>

                    <!-- Rating bounds -->
                    <div v-if="q.type === 3" class="flex items-center gap-3">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-base-content/50">{{ t('creator.surveys.minValue') }}:</span>
                        <input v-model.number="q.minValue" type="number" class="input input-bordered input-xs w-20" />
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-base-content/50">{{ t('creator.surveys.maxValue') }}:</span>
                        <input v-model.number="q.maxValue" type="number" class="input input-bordered input-xs w-20" />
                      </div>
                    </div>

                    <!-- Free text max length -->
                    <div v-if="q.type === 4" class="flex items-center gap-2">
                      <span class="text-xs text-base-content/50">{{ t('creator.surveys.maxLength') }}:</span>
                      <input v-model.number="q.maxLength" type="number" min="1" class="input input-bordered input-xs w-20" />
                    </div>

                    <!-- Yes/No info -->
                    <div v-if="q.type === 2" class="text-xs text-base-content/40 italic">
                      {{ t('creator.surveys.yesNoHint') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm" @click="closeEditor">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary btn-sm" :disabled="!canSave" @click="handleSave">
              {{ editingSurvey ? t('common.save') : t('creator.surveys.create') }}
            </button>
          </div>
        </template>
      </AdminDrawer>

      <!-- Feedback Modal -->
      <AdminDrawer
        :open="feedbackOpen"
        :title="t('creator.surveys.feedbackTitle')"
        @update:open="feedbackOpen = $event"
        content-class="w-[40rem]"
      >
        <ConfuseSpinner v-if="feedbackLoading" />
        <template v-else-if="feedbackItems.length && feedbackSurvey">
          <div class="flex gap-2 mb-4">
            <button
              class="btn btn-sm"
              :class="feedbackTab === 'summary' ? 'btn-primary' : 'btn-ghost'"
              @click="feedbackTab = 'summary'"
            >{{ t('creator.surveys.summary') }}</button>
            <button
              class="btn btn-sm"
              :class="feedbackTab === 'responses' ? 'btn-primary' : 'btn-ghost'"
              @click="feedbackTab = 'responses'"
            >{{ t('creator.surveys.responses') }} ({{ feedbackItems.length }})</button>
          </div>

          <!-- Summary tab -->
          <div v-if="feedbackTab === 'summary'" class="space-y-4">
            <SurveyResults v-if="feedbackStats" :questions="feedbackSurvey.questions" :stats="feedbackStats" />
            <div v-else class="text-sm text-base-content/40 text-center py-12">
              {{ t('creator.surveys.noStats') }}
            </div>
          </div>

          <!-- Responses tab -->
          <div v-else class="space-y-4">
            <div class="flex items-center justify-between text-sm text-base-content/50">
              <button
                class="btn btn-ghost btn-xs"
                :disabled="feedbackIndex === 0"
                @click="feedbackIndex--"
              >← {{ t('common.previous') }}</button>
              <span>{{ feedbackIndex + 1 }} / {{ feedbackItems.length }}</span>
              <button
                class="btn btn-ghost btn-xs"
                :disabled="feedbackIndex >= feedbackItems.length - 1"
                @click="feedbackIndex++"
              >{{ t('common.next') }} →</button>
            </div>

            <div class="border border-base-300/50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-3 text-xs text-base-content/50">
                <span v-if="currentAnswer.account" class="font-medium">{{ currentAnswer.account.nick || currentAnswer.account.name }}</span>
                <span v-else class="italic">{{ t('creator.surveys.anonymous') }}</span>
                <span>{{ formatDate(currentAnswer.createdAt) }}</span>
              </div>
              <div class="space-y-3 text-sm">
                <div v-for="q in feedbackSurvey.questions" :key="q.id" class="border-b border-base-200/50 pb-2 last:border-0">
                  <div class="font-medium text-base-content/80 mb-1">{{ q.title }}</div>
                  <div class="text-base-content/60">{{ displayFeedbackAnswer(q, currentAnswer.answer[q.id]) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-sm text-base-content/40 text-center py-12">
          {{ t('creator.surveys.noFeedback') }}
        </div>
      </AdminDrawer>

      <!-- Toast -->
      <div class="toast toast-end">
        <div v-if="toast" class="alert" :class="toastTypeClass">
          <span>{{ toast }}</span>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconPlus,
  IconMoreVertical,
  IconEdit,
  IconSend,
  IconArchive,
  IconMessageSquare,
  IconCopy,
  IconExternalLink,
  IconTrash,
  IconX,
  IconGripVertical,
  IconChevronUp,
  IconChevronDown,
  IconCircleDot,
  IconSquareCheck,
  IconToggleRight,
  IconStar,
  IconText,
} from '#components'
import type { SnSurvey, SnSurveyQuestion, SnSurveyAnswer } from '~/types/creator'
import {
  fetchSurveys,
  fetchSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  archiveSurvey,
  cloneSurvey,
  fetchSurveyFeedback,
} from '~/utils/creator'

definePageMeta({ middleware: 'creator' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)

const creator = useCreator()
const { currentPublisher } = creator

defineOgImage('UniOgImage', { title: computed(() => `${t('creator.surveys.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

useSolarSeo({ title: computed(() => `${t('creator.surveys.title')} - ${currentPublisher.value?.nick ?? pubName.value}`) })

// List state
const surveysList = ref<SnSurvey[]>([])
const offset = ref(0)
const total = ref(0)
const hasMore = computed(() => surveysList.value.length < total.value)

const { status, error } = await useAsyncData(
  `creator-surveys-${pubName.value}`,
  async () => {
    const result = await fetchSurveys(pubName.value)
    surveysList.value = result.items
    total.value = result.total
    offset.value = result.items.length
    return result
  },
)

const surveys = computed(() => surveysList.value)

async function loadMore() {
  const result = await fetchSurveys(pubName.value, offset.value)
  surveysList.value = [...surveysList.value, ...result.items]
  offset.value += result.items.length
}

async function refresh() {
  const result = await fetchSurveys(pubName.value)
  surveysList.value = result.items
  total.value = result.total
  offset.value = result.items.length
}

// Status helpers
const statusLabels: Record<number, string> = {
  0: t('creator.surveys.status0'),
  1: t('creator.surveys.status1'),
  2: t('creator.surveys.status2'),
}

const statusBadges: Record<number, string> = {
  0: 'badge-warning',
  1: 'badge-success',
  2: 'badge-ghost',
}

function statusLabel(status: number): string {
  return statusLabels[status] || String(status)
}

function statusBadge(status: number): string {
  return statusBadges[status] || 'badge-ghost'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

// Question type labels & icons — numeric index matches SnSurveyQuestionType
const questionTypes = computed(() => [
  t('creator.surveys.questionTypes.0'), // singleChoice
  t('creator.surveys.questionTypes.1'), // multipleChoice
  t('creator.surveys.questionTypes.2'), // yesNo
  t('creator.surveys.questionTypes.3'), // rating
  t('creator.surveys.questionTypes.4'), // freeText
])

const questionTypeIcons = [IconCircleDot, IconSquareCheck, IconToggleRight, IconStar, IconText]

// Editor state
const editorOpen = ref(false)
const editingSurvey = ref<SnSurvey | null>(null)
let keyCounter = 0

function freshKey(): number {
  return ++keyCounter
}

interface QuestionForm {
  _key: number
  id?: string
  title: string
  description: string
  type: number
  isRequired: boolean
  options: { _key: number; id?: string; label: string; order: number }[]
  maxSelections: number | null
  maxLength: number | null
  minValue: number | null
  maxValue: number | null
}

const form = reactive({
  title: '',
  description: '',
  endedAt: '',
  isAnonymous: false,
  notifySubscribers: false,
  hideResults: false,
  questions: [] as QuestionForm[],
})

function resetForm() {
  form.title = ''
  form.description = ''
  form.endedAt = ''
  form.isAnonymous = false
  form.notifySubscribers = false
  form.hideResults = false
  form.questions = []
}

function openCreate() {
  editingSurvey.value = null
  resetForm()
  addQuestion(0, t('creator.surveys.questionDefault'))
  editorOpen.value = true
}

function openEdit(survey: SnSurvey) {
  editingSurvey.value = survey
  form.title = survey.title || ''
  form.description = survey.description || ''
  form.endedAt = survey.endedAt ? survey.endedAt.slice(0, 16) : ''
  form.isAnonymous = survey.isAnonymous
  form.notifySubscribers = survey.notifySubscribers
  ;(form as any).hideResults = (survey as any).hideResults ?? false
  form.questions = survey.questions.map((q: SnSurveyQuestion) => ({
    _key: freshKey(),
    id: q.id,
    title: q.title,
    description: q.description || '',
    type: q.type,
    isRequired: q.isRequired,
    options: (q.options || []).map((o) => ({
      _key: freshKey(),
      id: o.id,
      label: o.label,
      order: o.order,
    })),
    maxSelections: q.maxSelections,
    maxLength: q.maxLength,
    minValue: q.minValue,
    maxValue: q.maxValue,
  }))
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
}

const canSave = computed(() =>
  form.questions.length > 0
  && form.title.trim().length > 0
  && form.questions.every((q) => q.title.trim().length > 0),
)

function addQuestion(type: number, title?: string) {
  const qType = type as number
  const isChoice = qType === 0 || qType === 1
  const isRating = qType === 3
  form.questions.push({
    _key: freshKey(),
    title: title || '',
    description: '',
    type: qType,
    isRequired: false,
    options: isChoice
      ? [
          { _key: freshKey(), label: t('creator.surveys.optionDefault', { n: 1 }), order: 0 },
          { _key: freshKey(), label: t('creator.surveys.optionDefault', { n: 2 }), order: 1 },
        ]
      : [],
    maxSelections: null,
    maxLength: null,
    minValue: isRating ? 1 : null,
    maxValue: isRating ? 5 : null,
  })
}

function removeQuestion(index: number) {
  form.questions.splice(index, 1)
}

function moveQuestion(fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= form.questions.length) return
  const item = form.questions.splice(fromIndex, 1)[0]
  form.questions.splice(toIndex, 0, item)
}

function changeQuestionType(qi: number, newType: number) {
  const q = form.questions[qi]
  const oldIsChoice = q.type === 0 || q.type === 1
  const newIsChoice = newType === 0 || newType === 1
  const newIsRating = newType === 3

  q.type = newType

  // Switching to/from choice type: reset options
  if (!oldIsChoice && newIsChoice) {
    q.options = [
      { _key: freshKey(), label: t('creator.surveys.optionDefault', { n: 1 }), order: 0 },
      { _key: freshKey(), label: t('creator.surveys.optionDefault', { n: 2 }), order: 1 },
    ]
    q.maxSelections = null
  } else if (oldIsChoice && !newIsChoice) {
    q.options = []
    q.maxSelections = null
  }

  // Reset rating bounds when switching to/from rating
  if (newIsRating) {
    if (q.minValue == null) q.minValue = 1
    if (q.maxValue == null) q.maxValue = 5
  } else if (!newIsChoice && !newIsRating && q.type !== 4) {
    q.minValue = null
    q.maxValue = null
  }

  // Reset maxLength when not free text
  if (newType !== 4) {
    q.maxLength = null
  }
}

function addOption(qi: number) {
  form.questions[qi].options.push({
    _key: freshKey(),
    label: '',
    order: form.questions[qi].options.length,
  })
}

function removeOption(qi: number, oi: number) {
  if (form.questions[qi].options.length <= 2) return
  form.questions[qi].options.splice(oi, 1)
}

async function handleSave() {
  const payload: Record<string, unknown> = {
    title: form.title || null,
    description: form.description || null,
    is_anonymous: form.isAnonymous,
    notify_subscribers: form.notifySubscribers,
    hide_results: form.hideResults,
    questions: form.questions
      .filter((q) => q.title.trim())
      .map((q, i) => {
        const qPayload: Record<string, unknown> = {
          ...(q.id ? { id: q.id } : {}),
          title: q.title.trim(),
          description: q.description?.trim() || null,
          type: q.type,
          order: i,
          is_required: q.isRequired,
        }

        if (q.type === 0 || q.type === 1) {
          qPayload.options = q.options
            .filter((o) => o.label.trim())
            .map((o, oi) => ({
              ...(o.id ? { id: o.id } : {}),
              label: o.label.trim(),
              order: oi,
            }))
        }

        if (q.type === 1 && q.maxSelections) {
          qPayload.max_selections = q.maxSelections
        }
        if (q.type === 4 && q.maxLength) {
          qPayload.max_length = q.maxLength
        }
        if (q.type === 3) {
          qPayload.min_value = q.minValue ?? undefined
          qPayload.max_value = q.maxValue ?? undefined
        }

        return qPayload
      }),
  }

  if (form.endedAt) {
    payload.ended_at = new Date(form.endedAt).toISOString()
  } else if (editingSurvey.value) {
    payload.clear_ended_at = true
  }

  try {
    if (editingSurvey.value) {
      await updateSurvey(editingSurvey.value.id, payload)
    } else {
      await createSurvey(pubName.value, payload)
    }
    closeEditor()
    await refresh()
    showToast(
      editingSurvey.value ? t('creator.surveys.updateSuccess') : t('creator.surveys.createSuccess'),
      'alert-success',
    )
  } catch (e) {
    showToast(String(e), 'alert-error')
  }
}

// Actions
async function handlePublish(id: string) {
  if (!(await useAlert().confirm('Confirm', t('creator.surveys.publishConfirm')))) return
  try {
    await publishSurvey(id)
    await refresh()
    showToast(t('creator.surveys.publishSuccess'), 'alert-success')
  } catch (e) {
    showToast(String(e), 'alert-error')
  }
}

async function handleArchive(id: string) {
  if (!(await useAlert().confirm('Confirm', t('creator.surveys.archiveConfirm')))) return
  try {
    await archiveSurvey(id)
    await refresh()
    showToast(t('creator.surveys.archiveSuccess'), 'alert-success')
  } catch (e) {
    showToast(String(e), 'alert-error')
  }
}

async function handleClone(id: string) {
  try {
    await cloneSurvey(id)
    await refresh()
    showToast(t('creator.surveys.cloneSuccess'), 'alert-success')
  } catch (e) {
    showToast(String(e), 'alert-error')
  }
}

async function handleDelete(id: string) {
  if (!(await useAlert().confirm('Confirm', t('creator.surveys.deleteConfirm')))) return
  try {
    await deleteSurvey(id)
    await refresh()
    showToast(t('creator.surveys.deleteSuccess'), 'alert-success')
  } catch (e) {
    showToast(String(e), 'alert-error')
  }
}

// Feedback
const feedbackOpen = ref(false)
const feedbackLoading = ref(false)
const feedbackItems = ref<SnSurveyAnswer[]>([])
const feedbackSurvey = ref<SnSurvey | null>(null)
const feedbackStats = ref<Record<string, Record<string, number>> | null>(null)
const feedbackTab = ref<'summary' | 'responses'>('responses')
const feedbackIndex = ref(0)

const currentAnswer = computed(() => feedbackItems.value[feedbackIndex.value])

async function viewFeedback(survey: SnSurvey) {
  feedbackSurvey.value = survey
  feedbackTab.value = 'summary'
  feedbackIndex.value = 0
  feedbackOpen.value = true
  feedbackLoading.value = true
  try {
    const [fb, statsResponse] = await Promise.all([
      fetchSurveyFeedback(survey.id),
      fetchSurvey(survey.id).catch(() => null),
    ])
    feedbackItems.value = fb.items
    feedbackStats.value = statsResponse?.stats ?? null
  } catch (e) {
    showToast(String(e), 'alert-error')
  } finally {
    feedbackLoading.value = false
  }
}

function displayFeedbackAnswer(q: SnSurveyQuestion, val: unknown): string {
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

// Toast
const toast = ref('')
const toastTypeClass = ref('alert-info')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type = 'alert-info') {
  toast.value = msg
  toastTypeClass.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}
</script>
