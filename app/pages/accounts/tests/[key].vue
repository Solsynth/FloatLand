<template>
    <main class="mx-auto max-w-2xl px-4 py-6">
        <NuxtLink to="/accounts/me/activation" class="btn btn-ghost btn-sm mb-4">{{ t("common.back") }}</NuxtLink>
        <div v-if="pending" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg" /></div>
        <div v-else-if="test" class="border border-base-300 p-6">
            <h1 class="text-xl font-semibold">{{ test.title }}</h1>
            <p v-if="test.description" class="mt-2 whitespace-pre-wrap text-sm text-base-content/65">{{ test.description }}</p>
            <dl class="mt-5 space-y-2 text-sm">
                <div v-if="test.timeLimitSeconds"><dt class="inline text-base-content/60">{{ t("tests.timeLimit") }} </dt><dd class="inline">{{ Math.ceil(test.timeLimitSeconds / 60) }} {{ t("tests.minutes") }}</dd></div>
                <div v-if="test.rewardExperience"><dt class="inline text-base-content/60">{{ t("tests.completionReward") }} </dt><dd class="inline">{{ test.rewardExperience }} {{ t("tests.xp") }}</dd></div>
                <div><dt class="inline text-base-content/60">{{ t("tests.questionsLabel") }} </dt><dd class="inline">{{ t("tests.selectedOnStart") }}</dd></div>
            </dl>
            <div class="mt-6 flex justify-end"><button class="btn btn-primary" :disabled="starting" @click="start">{{ starting ? t("tests.starting") : t("tests.startTest") }}</button></div>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { ParticipantAttempt, ParticipantTest } from "~/types/test";

definePageMeta({ layout: "minimal" });

const { t } = useI18n();
const key = useRoute().params.key as string;
const { loadTest } = useAccountActivation();
const test = ref<ParticipantTest | null>(null);
const pending = ref(true);
const starting = ref(false);

try {
    test.value = await loadTest(key);
} finally {
    pending.value = false;
}

async function start() {
    starting.value = true;
    try {
        const attempt = await safeJsonParse<ParticipantAttempt>(
            await apiFetch(`/passport/tests/${key}/attempts`, { method: "POST" }),
        );
        await navigateTo(`/accounts/tests/answer/${attempt.id}`);
    } finally {
        starting.value = false;
    }
}
</script>
