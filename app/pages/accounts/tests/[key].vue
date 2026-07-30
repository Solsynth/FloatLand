<template>
    <main class="mx-auto max-w-2xl px-4 py-6">
        <NuxtLink to="/accounts/me/activation" class="btn btn-ghost btn-sm mb-4">{{ t("common.back") }}</NuxtLink>
        <div v-if="pending" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg" /></div>
        <div v-else-if="test">
            <div v-if="startError" class="alert alert-error mb-4"><span>{{ startError }}</span></div>
            <div class="rounded-box border border-base-300 p-6">
            <h1 class="text-xl font-semibold">{{ test.title }}</h1>
            <p v-if="test.description" class="mt-2 whitespace-pre-wrap text-sm text-base-content/65">{{ test.description }}</p>
            <dl class="mt-5 space-y-2 text-sm">
                <div v-if="test.timeLimitSeconds"><dt class="inline text-base-content/60">{{ t("tests.timeLimit") }} </dt><dd class="inline">{{ Math.ceil(test.timeLimitSeconds / 60) }} {{ t("tests.minutes") }}</dd></div>
                <div v-if="test.rewardExperience"><dt class="inline text-base-content/60">{{ t("tests.completionReward") }} </dt><dd class="inline">{{ test.rewardExperience }} {{ t("tests.xp") }}</dd></div>
                <div><dt class="inline text-base-content/60">{{ t("tests.questionsLabel") }} </dt><dd class="inline">{{ t("tests.selectedOnStart") }}</dd></div>
                <div v-if="testRequirement && test.maxAttempts != null"><dt class="inline text-base-content/60">{{ t("tests.attempts") }} </dt><dd class="inline">{{ t("tests.attemptsUsed", { used: testRequirement.usedAttemptCount, max: test.maxAttempts }) }}</dd></div>
            </dl>
            <fieldset v-if="test.allowCategorySelection" class="fieldset mt-5 border-t border-base-200 pt-4">
                <legend class="fieldset-legend">Choose question categories</legend>
                <p class="label">Select between 3 and 5 categories. Only questions from these categories will be included.</p>
                <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label v-for="category in test.availableCategories" :key="category" class="flex items-center gap-2 text-sm">
                        <input v-model="selectedCategories" :value="category" type="checkbox" class="checkbox checkbox-sm" :disabled="!selectedCategories.includes(category) && selectedCategories.length >= 5" />
                        {{ category }}
                    </label>
                </div>
                <p v-if="!hasValidCategorySelection" class="mt-2 text-sm text-error">Select {{ selectedCategories.length < 3 ? "at least 3" : "no more than 5" }} categories to continue.</p>
            </fieldset>
            <div v-if="testRequirement && test.maxAttempts != null && testRequirement.usedAttemptCount >= test.maxAttempts" class="mt-4 border-t border-base-200 pt-4 text-sm text-error">{{ t("tests.maxAttemptsReached") }}</div>
            <div v-else class="mt-6 flex justify-end"><button class="btn btn-primary" :disabled="starting || !hasValidCategorySelection" @click="start">{{ starting ? t("tests.starting") : t("tests.startTest") }}</button></div>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { ParticipantAttempt, ParticipantTest } from "~/types/test";
import { ApiError } from "~/utils/api";

definePageMeta({ layout: "minimal" });

const { t } = useI18n();
const key = useRoute().params.key as string;
const { loadTest, loadProgress, progress } = useAccountActivation();
const test = ref<ParticipantTest | null>(null);
const pending = ref(true);
const starting = ref(false);
const startError = ref<string | null>(null);
const selectedCategories = ref<string[]>([]);

const testRequirement = computed(() => progress.value?.tests.find(x => x.key === key));
const hasValidCategorySelection = computed(() => !test.value?.allowCategorySelection || (selectedCategories.value.length >= 3 && selectedCategories.value.length <= 5));

try {
    test.value = await loadTest(key);
    if (!progress.value) await loadProgress();
} finally {
    pending.value = false;
}

async function start() {
    starting.value = true;
    startError.value = null;
    try {
        const attempt = await safeJsonParse<ParticipantAttempt>(
            await apiFetch(`/passport/tests/${key}/attempts`, { method: "POST", body: JSON.stringify({ categories: selectedCategories.value }) }),
        );
        await navigateTo(`/accounts/tests/answer/${attempt.id}`);
    } catch (cause) {
        if (cause instanceof ApiError && cause.hasCode("PASSPORT_TEST_ATTEMPT_UNAVAILABLE")) {
            startError.value = t("tests.maxAttemptsReached");
            await loadProgress();
        } else {
            startError.value = cause instanceof Error ? cause.message : t("common.error");
        }
    } finally {
        starting.value = false;
    }
}
</script>
