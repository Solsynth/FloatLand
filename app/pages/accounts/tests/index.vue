<template>
    <main class="mx-auto max-w-4xl px-4 py-6">
        <h1 class="text-2xl font-bold">{{ t("tests.browseTitle") }}</h1>
        <p class="mt-1 text-sm text-base-content/60">{{ t("tests.browseDescription") }}</p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
            <button class="btn btn-xs" :class="selectedCategory === null ? 'btn-primary' : 'btn-ghost'" @click="selectedCategory = null">{{ t("tests.allCategories") }}</button>
            <button v-for="cat in categories" :key="cat" class="btn btn-xs" :class="selectedCategory === cat ? 'btn-primary' : 'btn-ghost'" @click="selectedCategory = cat">{{ categoryLabel(cat) }}</button>
        </div>
        <div v-if="pending" class="flex justify-center py-16">
            <span class="loading loading-spinner loading-lg" />
        </div>
        <div v-else class="mt-6 grid gap-3 sm:grid-cols-2">
            <NuxtLink
                v-for="test in filteredTests"
                :key="test.key"
                :to="`/accounts/tests/${test.key}`"
                class="card overflow-hidden rounded-lg border border-base-300 bg-base-100 transition-colors hover:bg-base-200"
            >
                <div class="card-body p-5">
                    <h2 class="font-semibold">{{ test.title }}</h2>
                    <p class="text-sm text-base-content/60">{{ test.description || t("tests.noDescription") }}</p>
                </div>
            </NuxtLink>
            <p v-if="!filteredTests.length" class="text-sm text-base-content/60">{{ t("tests.noTests") }}</p>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { ParticipantTest } from "~/types/test";

definePageMeta({ layout: "minimal" });

const { t } = useI18n();
const tests = ref<ParticipantTest[]>([]);
const pending = ref(true);
const selectedCategory = ref<string | null>(null);

const categories = computed(() => {
    const set = new Set<string>()
    for (const test of tests.value) {
        for (const cat of test.availableCategories) set.add(cat)
    }
    return [...set].sort()
})

const filteredTests = computed(() => {
    if (selectedCategory.value === null) return tests.value
    return tests.value.filter(test => test.availableCategories.includes(selectedCategory.value!))
})

function categoryLabel(cat: string): string {
    const key = `tests.categories.${cat}`
    const label = t(key)
    return label === key ? cat : label
}

try {
    tests.value = await safeJsonParse<ParticipantTest[]>(
        await apiFetch("/passport/tests"),
    );
} finally {
    pending.value = false;
}
</script>
