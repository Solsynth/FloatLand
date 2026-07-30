<template>
    <NuxtLayout name="app">
        <main class="mx-auto max-w-2xl px-4 py-6">
            <div v-if="pending" class="flex justify-center py-16">
                <span class="loading loading-spinner loading-lg" />
            </div>
            <div v-else-if="attempt" class="border border-base-300 rounded-lg p-6">
                <h1 class="text-xl font-semibold">
                    {{ attempt.title || t("tests.result.title") }}
                </h1>
                <p class="mt-2 text-sm text-base-content/60">
                    {{ resultMessage }}
                </p>
                <dl class="mt-6 space-y-2 text-sm">
                    <div
                        v-if="
                            attempt.score !== null &&
                            attempt.score !== undefined
                        "
                    >
                        <dt class="inline text-base-content/60">{{ t("tests.result.score") }}</dt>
                        <dd class="inline font-medium">
                            {{ attempt.score.toFixed(1) }}%
                        </dd>
                    </div>
                    <div>
                        <dt class="inline text-base-content/60">{{ t("tests.result.status") }}</dt>
                        <dd class="inline">{{ statusLabel }}</dd>
                    </div>
                </dl>
                <section
                    v-if="hasReview"
                    class="mt-6 border-t border-base-300 rounded-lg pt-5"
                >
                    <h2 class="text-base font-semibold">{{ t("tests.result.answerReview") }}</h2>
                    <div class="mt-4 space-y-4">
                        <article
                            v-for="question in attempt.questions"
                            :key="question.id"
                            class="border border-base-300 p-4 rounded-lg"
                        >
                            <div
                                class="flex flex-wrap items-start justify-between gap-2"
                            >
                                <p class="font-medium">
                                    {{ question.content }}
                                </p>
                                <span
                                    v-if="
                                        answerFor(question.id)?.isCorrect ===
                                        true
                                    "
                                    class="text-sm text-success"
                                    >{{ t("tests.result.correct") }}</span
                                ><span
                                    v-else-if="
                                        answerFor(question.id)?.isCorrect ===
                                        false
                                    "
                                    class="text-sm text-error"
                                    >{{ t("tests.result.incorrect") }}</span
                                ><span
                                    v-else-if="hasAnswer(question.id)"
                                    class="text-sm text-base-content/60"
                                    >{{
                                        attempt.status === 1
                                            ? t("tests.result.awaitingReview")
                                            : t("tests.result.answerRecorded")
                                    }}</span
                                ><span
                                    v-else
                                    class="text-sm text-base-content/60"
                                    >{{ t("tests.result.notAnswered") }}</span
                                >
                            </div>
                            <p
                                v-if="selectedChoices(question.id).length"
                                class="mt-3 text-sm"
                            >
                                <span class="text-base-content/60"
                                    >{{ t("tests.result.yourAnswer") }}</span
                                >{{ selectedChoices(question.id).join(", ") }}
                            </p>
                            <p
                                v-else-if="answerFor(question.id)?.value?.text"
                                class="mt-3 whitespace-pre-wrap text-sm"
                            >
                                <span class="text-base-content/60"
                                    >{{ t("tests.result.yourAnswer") }}</span
                                >{{ answerFor(question.id)?.value?.text }}
                            </p>
                            <p v-else class="mt-3 text-sm text-base-content/60">
                                {{ t("tests.result.noAnswer") }}
                            </p>
                            <p
                                v-if="answerFor(question.id)?.reviewNote"
                                class="mt-2 whitespace-pre-wrap text-sm"
                            >
                                <span class="text-base-content/60"
                                    >{{ t("tests.result.reviewerNote") }}</span
                                >{{ answerFor(question.id)?.reviewNote }}
                            </p>
                        </article>
                    </div>
                </section>
                <div class="mt-6 flex justify-end">
                    <NuxtLink
                        :to="
                            attempt.isTrial
                                ? '/admin/tests'
                                : '/accounts/me/activation'
                        "
                        class="btn btn-primary"
                        >{{ attempt.isTrial ? t("tests.result.backToTests") : t("tests.result.viewActivationProgress") }}</NuxtLink
                    >
                </div>
            </div>
        </main>
    </NuxtLayout>
</template>

<script setup lang="ts">
import type { ParticipantAttempt } from "~/types/test";

definePageMeta({ layout: "minimal" });

const { t } = useI18n();
const attemptId = useRoute().params.attemptId as string;
const attempt = ref<ParticipantAttempt | null>(null);
const pending = ref(true);

try {
    attempt.value = await safeJsonParse<ParticipantAttempt>(
        await apiFetch(`/passport/tests/attempts/${attemptId}`),
    );
} finally {
    pending.value = false;
}

const statusLabel = computed(
    () =>
        [
            t("tests.result.statusInProgress"),
            t("tests.result.statusPendingReview"),
            t("tests.result.statusPassed"),
            t("tests.result.statusFailed"),
            t("tests.result.statusExpired"),
        ][attempt.value?.status ?? 0] ?? t("tests.result.statusUnknown"),
);
const resultMessage = computed(() => {
    if (!attempt.value) return "";
    if (attempt.value.status === 1)
        return t("tests.result.messagePendingReview");
    if (attempt.value.status === 2)
        return attempt.value.isTrial
            ? t("tests.result.messageTrialCompleted")
            : t("tests.result.messagePassed");
    if (attempt.value.status === 3)
        return t("tests.result.messageFailed");
    if (attempt.value.status === 4)
        return t("tests.result.messageExpired");
    return t("tests.result.messageRecorded");
});
const hasReview = computed(() => attempt.value?.status !== 0);
function answerFor(questionId: string) {
    return attempt.value?.answers?.find(
        (answer) => answer.questionId === questionId,
    );
}
function selectedChoices(questionId: string) {
    const selected = answerFor(questionId)?.value?.choiceIds ?? [];
    return (
        attempt.value?.questions
            .find((question) => question.id === questionId)
            ?.choices.filter((choice) => selected.includes(choice.id))
            .map((choice) => choice.content) ?? []
    );
}
function hasAnswer(questionId: string) {
    const answer = answerFor(questionId);
    return (
        (answer?.value?.choiceIds?.length ?? 0) > 0 ||
        Boolean(answer?.value?.text?.trim())
    );
}
</script>
