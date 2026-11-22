<template>
  <div class="overflow-hidden rounded-card bg-base-300/60" @click.stop>
    <div v-if="!surveyId" class="p-4 text-xs text-base-content/60">
      {{ t("post.embed.surveyUnavailable") }}
    </div>

    <div v-else-if="loading" class="flex items-center gap-2 p-4 text-xs text-base-content/60">
      <IconLoader class="h-4 w-4 animate-spin" />
      <span>{{ t("common.loading") }}</span>
    </div>

    <div v-else-if="error || !survey" class="p-4 text-xs text-error">
      {{ t("post.embed.surveyLoadFailed") }}
    </div>

    <button
      v-else
      type="button"
      class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
      :class="interactive ? 'hover:bg-base-300/80' : 'cursor-default'"
      @click="interactive && (dialogOpen = true)"
    >
      <div class="min-w-0 flex-1 space-y-1">
        <div class="flex items-center gap-2">
          <IconClipboardList class="h-4 w-4 shrink-0 text-primary" />
          <span class="truncate text-sm font-semibold">
            {{ survey.title || t("post.embed.survey") }}
          </span>
        </div>
        <p
          v-if="survey.description"
          class="line-clamp-2 text-xs text-base-content/70"
        >
          {{ survey.description }}
        </p>
        <div class="flex items-center gap-2 pt-0.5 text-xs text-base-content/60">
          <span>
            {{ t("post.embed.surveyQuestionsCount", { count: survey.questions.length }) }}
          </span>
          <span
            v-if="hasAnswered"
            class="inline-flex items-center gap-1 font-medium text-primary"
          >
            <IconCheckCircle2 class="h-3.5 w-3.5" />
            {{ t("post.embed.surveyAnswered") }}
          </span>
        </div>
      </div>
      <IconChevronRight
        v-if="interactive"
        class="h-4 w-4 shrink-0 text-base-content/50"
      />
    </button>

    <!-- Survey detail / submit modal -->
    <DialogRoot v-if="survey && interactive" v-model:open="dialogOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-[100] bg-black/40" />
        <DialogContent
          class="fixed top-1/2 left-1/2 z-[101] max-h-[85vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-box bg-base-100 p-6 shadow-lg"
        >
          <DialogTitle class="text-lg font-semibold">
            {{ survey.title || t("post.embed.surveyAnswerTitle") }}
          </DialogTitle>
          <DialogDescription
            v-if="survey.description"
            class="mt-1 text-sm text-base-content/65"
          >
            {{ survey.description }}
          </DialogDescription>

          <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
            <div
              v-for="(q, idx) in sortedQuestions"
              :key="q.id"
              class="space-y-2 rounded-card bg-base-200/60 p-3"
            >
              <div class="text-sm font-medium">
                <span>{{ idx + 1 }}. {{ q.title }}</span>
                <span v-if="q.isRequired" class="ml-1 text-error">*</span>
              </div>
              <p v-if="q.description" class="text-xs text-base-content/60">
                {{ q.description }}
              </p>

              <!-- Single choice (type 0) or Multiple choice (type 1) -->
              <div v-if="q.options?.length" class="space-y-1.5">
                <label
                  v-for="opt in [...q.options].sort((a, b) => a.order - b.order)"
                  :key="opt.id"
                  class="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-base-300/50"
                >
                  <input
                    v-if="q.type === 1"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary mt-0.5"
                    :checked="isOptionSelected(q.id, opt.id)"
                    :disabled="hasAnswered"
                    @change="toggleMultiOption(q.id, opt.id, q.maxSelections)"
                  />
                  <input
                    v-else
                    type="radio"
                    :name="`survey-q-${q.id}`"
                    class="radio radio-sm radio-primary mt-0.5"
                    :checked="answers[q.id] === opt.id"
                    :disabled="hasAnswered"
                    @change="answers[q.id] = opt.id"
                  />
                  <div class="min-w-0 flex-1">
                    <div>{{ opt.label }}</div>
                    <div v-if="opt.description" class="text-xs text-base-content/60">
                      {{ opt.description }}
                    </div>
                  </div>
                </label>
              </div>

              <!-- Text / numeric fallback -->
              <input
                v-else
                v-model="answers[q.id]"
                type="text"
                class="input input-bordered input-sm w-full"
                :maxlength="q.maxLength ?? undefined"
                :disabled="hasAnswered"
              />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="dialogOpen = false"
              >
                {{ t("common.close") }}
              </button>
              <button
                v-if="!hasAnswered"
                type="submit"
                class="btn btn-primary btn-sm"
                :disabled="submitting"
              >
                <IconLoader v-if="submitting" class="h-4 w-4 animate-spin" />
                {{ t("post.embed.surveySubmit") }}
              </button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<script setup lang="ts">
import type { SurveyWithStats } from "~/types/post";
import { fetchSurvey, submitSurveyAnswer } from "~/utils/api";
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import {
  IconCheckCircle2,
  IconChevronRight,
  IconClipboardList,
  IconLoader,
} from "#components";

const props = withDefaults(
  defineProps<{
    surveyId?: string | null;
    interactive?: boolean;
  }>(),
  {
    surveyId: null,
    interactive: true,
  },
);

const { t } = useI18n();
const { $toast } = useNuxtApp();

const survey = ref<SurveyWithStats | null>(null);
const loading = ref(false);
const error = ref(false);
const dialogOpen = ref(false);
const submitting = ref(false);
const answers = reactive<Record<string, unknown>>({});

const hasAnswered = computed(
  () =>
    Boolean(survey.value?.userAnswer?.answer) &&
    Object.keys(survey.value!.userAnswer!.answer).length > 0,
);

const sortedQuestions = computed(() =>
  [...(survey.value?.questions ?? [])].sort((a, b) => a.order - b.order),
);

async function load() {
  if (!props.surveyId) return;
  loading.value = true;
  error.value = false;
  try {
    const data = await fetchSurvey(props.surveyId);
    survey.value = data;
    if (data.userAnswer?.answer) {
      Object.assign(answers, data.userAnswer.answer);
    }
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.surveyId, load);

function isOptionSelected(questionId: string, optionId: string): boolean {
  const val = answers[questionId];
  return Array.isArray(val) && val.includes(optionId);
}

function toggleMultiOption(
  questionId: string,
  optionId: string,
  maxSelections?: number | null,
) {
  const current = Array.isArray(answers[questionId])
    ? ([...answers[questionId]] as string[])
    : [];
  const idx = current.indexOf(optionId);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    if (maxSelections && current.length >= maxSelections) return;
    current.push(optionId);
  }
  answers[questionId] = current;
}

async function handleSubmit() {
  if (!props.surveyId || submitting.value) return;
  submitting.value = true;
  try {
    await submitSurveyAnswer(props.surveyId, { ...answers });
    $toast.success(t("post.embed.surveySubmitted"));
    dialogOpen.value = false;
    await load();
  } catch {
    $toast.error(t("post.embed.surveySubmitFailed"));
  } finally {
    submitting.value = false;
  }
}
</script>
