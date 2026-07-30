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
                <fieldset v-if="trial.allowCategorySelection" class="fieldset mt-5 border-t border-base-200 pt-4">
                    <legend class="fieldset-legend">{{ t("tests.selectCategories") }}</legend>
                    <p class="label">{{ t("tests.selectCategoriesHint") }}</p>
                    <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label v-for="category in trial.availableCategories" :key="category" class="flex items-center gap-2 text-sm">
                            <input v-model="selectedCategories" :value="category" type="checkbox" class="checkbox checkbox-sm" :disabled="!selectedCategories.includes(category) && selectedCategories.length >= 5" />
                            {{ categoryLabel(category) }}
                        </label>
                    </div>
                    <p v-if="trial.allowCategorySelection && !hasValidCategorySelection" class="mt-2 text-sm text-error">{{ selectedCategories.length < 3 ? t("tests.selectAtLeast") : t("tests.selectAtMost") }}</p>
                </fieldset>
                <div v-else-if="trial.availableCategories.length" class="mt-5 flex flex-wrap gap-2">
                    <span v-for="cat in trial.availableCategories" :key="cat" class="badge badge-outline badge-sm">{{ categoryLabel(cat) }}</span>
                </div>
                <div class="mt-6 flex justify-end">
                    <button
                        class="btn btn-primary"
                        :disabled="starting || !hasValidCategorySelection"
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

function categoryLabel(cat: string): string {
    const key = `tests.categories.${cat}`
    const label = t(key)
    return label === key ? cat : label
}
const trial = ref<ParticipantTest | null>(null);
const pending = ref(true);
const starting = ref(false);
const selectedCategories = ref<string[]>([]);

const hasValidCategorySelection = computed(() => !trial.value?.allowCategorySelection || (selectedCategories.value.length >= 3 && selectedCategories.value.length <= 5));

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
                { method: "POST", body: JSON.stringify({ categories: selectedCategories.value }) },
            ),
        );
        await navigateTo("/accounts/tests/answer/" + attempt.id);
    } finally {
        starting.value = false;
    }
}
</script>
