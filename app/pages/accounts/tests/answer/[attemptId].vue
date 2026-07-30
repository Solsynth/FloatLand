<template>
    <main
        class="mx-auto max-w-2xl px-4 py-6"
        :class="{ 'pb-20': showStickyTimer && remainingSeconds !== null }"
    >
            <NuxtLink
                to="/accounts/me/activation"
                class="btn btn-ghost btn-sm mb-4"
            >
                <ArrowLeftIcon class="w-4 h-4" />
                {{ t("tests.leaveAttempt") }}
            </NuxtLink>
            <div v-if="pending" class="flex justify-center py-16">
                <span class="loading loading-spinner loading-lg" />
            </div>
            <form
                v-else-if="attempt"
                class="space-y-5"
                @submit.prevent="submit"
            >
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 class="text-2xl font-bold">
                            {{ attempt.title || t("tests.testAttempt") }}
                        </h1>
                        <p class="mt-1 text-sm text-base-content/60">
                            {{
                                attempt.isTrial
                                    ? t("tests.trialHint")
                                    : t("tests.scoringHint")
                            }}
                        </p>
                    </div>
                    <div
                        v-if="remainingSeconds !== null"
                        ref="timerRef"
                        class="text-right"
                    >
                        <div class="flex items-center justify-end gap-2">
                            <div
                                v-if="violationCount > 0"
                                class="tooltip"
                                :data-tip="`${violationCount} ${t('tests.violationTooltip')}${violationCount === 1 ? '' : 's'}`"
                            >
                                <span
                                    class="badge badge-soft badge-error badge-xs"
                                    >{{ violationCount }}</span
                                >
                            </div>
                            <div class="text-xs text-base-content/60">
                                {{ t("tests.timeRemaining") }}
                            </div>
                        </div>
                        <div
                            class="font-mono text-lg font-semibold"
                            :class="{ 'text-error': remainingSeconds === 0 }"
                        >
                            {{ formatRemaining(remainingSeconds) }}
                        </div>
                    </div>
                </div>
                <section
                    v-for="(question, index) in attempt.questions"
                    :key="question.id"
                    class="card border border-base-300"
                >
                    <div class="card-body">
                        <div class="space-y-1">
                            <p
                                class="text-xs text-base-content/40 font-medium tracking-wide uppercase"
                            >
                                {{ t("tests.question", { index: index + 1 }) }}
                            </p>
                            <p class="font-medium text-base leading-relaxed">
                                {{ question.content }}
                            </p>
                            <div class="flex items-center gap-3 pt-0.5">
                                <span
                                    v-if="question.category"
                                    class="badge badge-outline text-xs"
                                    >{{ question.category }}</span
                                >
                                <span
                                    class="badge badge-outline badge-primary text-xs"
                                    >{{ question.points }}
                                    {{ t("tests.pts") }}</span
                                >
                                <div class="flex items-center gap-0.5">
                                    <StarIcon
                                        v-for="i in 5"
                                        :key="i"
                                        class="w-4 h-4"
                                        :class="
                                            i <= question.difficulty
                                                ? 'text-amber-400'
                                                : 'text-base-content/10'
                                        "
                                        :fill="
                                            i <= question.difficulty
                                                ? 'currentColor'
                                                : 'none'
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="question.type !== 2"
                            class="grid grid-cols-2 gap-3"
                        >
                            <label
                                v-for="choice in question.choices"
                                :key="choice.id"
                                class="flex items-center gap-3 rounded-lg border border-base-300 p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer"
                            >
                                <input
                                    v-if="question.type === 0"
                                    :name="question.id"
                                    type="radio"
                                    class="radio radio-primary mt-0.5 shrink-0"
                                    :checked="
                                        answers[question.id]?.includes(
                                            choice.id,
                                        )
                                    "
                                    @change="answers[question.id] = [choice.id]"
                                />
                                <input
                                    v-else
                                    v-model="answers[question.id]"
                                    type="checkbox"
                                    :value="choice.id"
                                    class="checkbox checkbox-primary mt-0.5 shrink-0"
                                />
                                <span class="text-sm">{{
                                    choice.content
                                }}</span>
                            </label>
                        </div>
                        <textarea
                            v-else
                            v-model="texts[question.id]"
                            class="textarea textarea-bordered w-full"
                        />
                    </div>
                </section>
                <div class="flex justify-end">
                    <button
                        v-if="isTrial"
                        class="btn btn-primary"
                        :class="{ loading: submitting }"
                        :disabled="submitting || !canSubmit"
                        @click="submit()"
                    >
                        {{ t("tests.submit") }}
                    </button>
                    <AlertDialogRoot v-else v-model:open="showConfirm">
                        <button
                            class="btn btn-primary"
                            :class="{ loading: submitting }"
                            :disabled="submitting || !canSubmit"
                            @click="showConfirm = true"
                            type="button"
                        >
                            {{ t("tests.submit") }}
                        </button>
                        <AlertDialogPortal>
                            <AlertDialogOverlay
                                class="fixed inset-0 z-50 bg-black/40"
                            />
                            <AlertDialogContent
                                class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-base-300 bg-base-100 p-6 shadow-xl"
                            >
                                <AlertDialogTitle class="text-lg font-semibold">
                                    {{ t("tests.confirmTitle") }}
                                </AlertDialogTitle>
                                <AlertDialogDescription
                                    class="mt-2 text-sm text-base-content/60"
                                >
                                    {{ t("tests.confirmDesc") }}
                                </AlertDialogDescription>
                                <div class="mt-6 flex justify-end gap-3">
                                    <AlertDialogCancel
                                        class="btn btn-ghost btn-sm"
                                    >
                                        {{ t("tests.cancel") }}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        class="btn btn-primary btn-sm"
                                        @click="submit()"
                                    >
                                        {{ t("tests.submitConfirm") }}
                                    </AlertDialogAction>
                                </div>
                            </AlertDialogContent>
                        </AlertDialogPortal>
                    </AlertDialogRoot>
                </div>
            </form>
        </main>
        <Transition name="sticky-timer">
            <div
                v-if="showStickyTimer && remainingSeconds !== null"
                class="fixed bottom-0 left-0 right-0 z-50 border-t border-base-300 bg-base-100/80 backdrop-blur-md"
            >
                <div
                    class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3"
                >
                    <div class="flex gap-2 items-center">
                        <ClockIcon class="w-4 h-4 text-base-content/60" />
                        <span class="text-sm text-base-content/60">{{
                            t("tests.timeRemaining")
                        }}</span>
                    </div>
                    <span
                        class="font-mono text-lg font-semibold"
                        :class="{ 'text-error': remainingSeconds === 0 }"
                    >
                        {{ formatRemaining(remainingSeconds) }}
                    </span>
                </div>
            </div>
    </Transition>
</template>

<script setup lang="ts">
import {
    ArrowLeft as ArrowLeftIcon,
    Clock as ClockIcon,
    Star as StarIcon,
} from "@lucide/vue";
import type { ParticipantAttempt } from "~/types/test";
import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogRoot,
    AlertDialogTitle,
} from "reka-ui";

definePageMeta({ layout: "minimal" });

const attemptId = useRoute().params.attemptId as string;
const { t } = useI18n();
const attempt = ref<ParticipantAttempt | null>(null);
const pending = ref(true);
const submitting = ref(false);
const answers = reactive<Record<string, string[]>>({});
const texts = reactive<Record<string, string>>({});
const now = ref<number | null>(null);
const timerRef = ref<HTMLElement | null>(null);
const showStickyTimer = ref(false);
const showConfirm = ref(false);
const autoSubmitted = ref(false);
const violations = reactive<{ type: string; time: string }[]>([]);
const violationCount = computed(() => violations.length);
const isTrial = computed(() => attempt.value?.isTrial ?? false);
const submitGraceSeconds = 10;
let countdownTimer: ReturnType<typeof setInterval> | undefined;
const remainingSeconds = computed(() => {
    if (!attempt.value?.deadlineAt || now.value === null) return null;
    return Math.max(
        0,
        Math.ceil(
            (new Date(attempt.value.deadlineAt).getTime() - now.value) / 1000,
        ),
    );
});
watch(remainingSeconds, (seconds) => {
    if (seconds !== null && seconds <= 0 && !autoSubmitted.value) {
        autoSubmitted.value = true;
        submit();
    }
});

const canSubmit = computed(() => {
    if (!attempt.value?.deadlineAt || now.value === null) return true;
    return (
        new Date(attempt.value.deadlineAt).getTime() +
            submitGraceSeconds * 1000 >
        now.value
    );
});

try {
    attempt.value = await safeJsonParse<ParticipantAttempt>(
        await apiFetch(`/passport/tests/attempts/${attemptId}`),
    );
    attempt.value.questions.forEach((question) => {
        answers[question.id] = [];
    });
} finally {
    pending.value = false;
}

async function submit() {
    if (!attempt.value || submitting.value || !canSubmit.value) return;
    submitting.value = true;
    try {
        await apiFetch(`/passport/tests/attempts/${attempt.value.id}/submit`, {
            method: "POST",
            body: JSON.stringify({
                answers: attempt.value.questions.map((question) => ({
                    question_id: question.id,
                    choice_ids: answers[question.id],
                    text: texts[question.id],
                })),
            }),
        });
        await navigateTo(`/accounts/tests/results/${attempt.value.id}`);
    } finally {
        submitting.value = false;
    }
}

function formatRemaining(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function logViolation(type: string) {
    violations.push({ type, time: new Date().toISOString() });
}

function handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
        logViolation("tab_hide");
    }
}

function handleWindowBlur() {
    logViolation("window_blur");
}

onMounted(() => {
    now.value = Date.now();
    countdownTimer = setInterval(() => {
        now.value = Date.now();
    }, 1000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
});

watch(timerRef, (el) => {
    if (!el) return;
    const observer = new IntersectionObserver(
        ([entry]) => {
            showStickyTimer.value = !entry?.isIntersecting;
        },
        { threshold: 0 },
    );
    observer.observe(el);
});

onBeforeUnmount(() => {
    if (countdownTimer) clearInterval(countdownTimer);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleWindowBlur);
});
</script>

<style scoped>
.sticky-timer-enter-active,
.sticky-timer-leave-active {
    transition:
        transform 0.3s ease,
        opacity 0.3s ease;
}

.sticky-timer-enter-from,
.sticky-timer-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
</style>
