<template>
    <NuxtLayout name="minimal">
        <main class="mx-auto max-w-2xl px-4 py-6">
            <NuxtLink to="/accounts/tests" class="btn btn-ghost btn-sm mb-4">
                <ArrowLeftIcon class="w-4 h-4" />
                {{ t("common.back") }}
            </NuxtLink>
            <div v-if="pending" class="flex justify-center py-16">
                <span class="loading loading-spinner loading-lg" />
            </div>
            <div v-else-if="trial" class="border border-base-300 p-6 rounded-xl">
                <h1 class="text-xl font-semibold">{{ trial.title }}</h1>
                <p
                    v-if="trial.description"
                    class="mt-2 whitespace-pre-wrap text-sm text-base-content/65"
                >
                    {{ trial.description }}
                </p>
                <p class="mt-5 text-sm text-base-content/60">{{ t("tests.trialDescription") }}</p>
                <div class="mt-6 flex justify-end">
                    <button
                        class="btn btn-primary"
                        :disabled="starting"
                        @click="start"
                    >
                        {{ starting ? t("tests.starting") : t("tests.startTrial") }}
                    </button>
                </div>
            </div>
        </main>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { ArrowLeft as ArrowLeftIcon } from "@lucide/vue";
import type { ParticipantAttempt, ParticipantTest } from "~/types/test";

const { t } = useI18n();
const key = useRoute().params.key as string;
const trial = ref<ParticipantTest | null>(null);
const pending = ref(true);
const starting = ref(false);
try {
    trial.value = await safeJsonParse<ParticipantTest>(
        await apiFetch("/passport/tests/trials/" + encodeURIComponent(key)),
    );
} finally {
    pending.value = false;
}
async function start() {
    starting.value = true;
    try {
        const attempt = await safeJsonParse<ParticipantAttempt>(
            await apiFetch(
                "/passport/tests/trials/" +
                    encodeURIComponent(key) +
                    "/attempts",
                { method: "POST" },
            ),
        );
        await navigateTo("/accounts/tests/answer/" + attempt.id);
    } finally {
        starting.value = false;
    }
}
</script>
