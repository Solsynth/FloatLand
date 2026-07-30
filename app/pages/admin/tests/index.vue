<template>
    <NuxtLayout name="admin">
        <AdminPageHeader
            title="Tests"
            description="Compose reusable question groups into tests and review subjective answers."
        >
            <template #actions
                ><NuxtLink
                    to="/admin/tests/question-groups"
                    class="btn btn-sm btn-ghost"
                    >Question bank</NuxtLink
                ><NuxtLink to="/admin/tests/trials" class="btn btn-sm btn-ghost"
                    >Trials</NuxtLink
                ><button class="btn btn-sm btn-primary" @click="startCreate">
                    <IconPlus class="w-4 h-4" /> New test
                </button></template
            >
        </AdminPageHeader>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <AdminCard
                ><div v-if="loading" class="flex justify-center py-8">
                    <span class="loading loading-spinner loading-sm" />
                </div>
                <div v-else class="space-y-1">
                    <button
                        v-for="test in tests"
                        :key="test.key"
                        class="w-full rounded-md px-3 py-2 text-left hover:bg-base-200"
                        :class="selectedKey === test.key ? 'bg-base-200' : ''"
                        @click="selectTest(test)"
                    >
                        <div class="truncate text-sm font-medium">
                            {{ test.title }}
                        </div>
                        <div
                            class="mt-1 flex gap-2 text-xs text-base-content/50"
                        >
                            <span class="font-mono">{{ test.key }}</span
                            ><span
                                >{{ test.questionGroups.length }} groups</span
                            >
                        </div>
                    </button>
                    <p
                        v-if="!tests.length"
                        class="py-5 text-center text-sm text-base-content/50"
                    >
                        No tests yet.
                    </p>
                </div></AdminCard
            >
            <div class="space-y-4">
                <AdminCard v-if="!editorOpen"
                    ><p class="text-sm text-base-content/60">
                        Select a test to edit it, or create a new one.
                    </p></AdminCard
                ><template v-else>
                    <AdminCard
                        ><div
                            class="flex flex-wrap items-center justify-between gap-3"
                        >
                            <div>
                                <div class="text-base font-semibold">
                                    {{
                                        editingExisting
                                            ? "Edit test"
                                            : "New test"
                                    }}
                                </div>
                                <div
                                    v-if="editingExisting"
                                    class="font-mono text-xs text-base-content/50"
                                >
                                    {{ selectedKey }}
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button
                                    class="btn btn-sm btn-ghost"
                                    @click="settingsOpen = !settingsOpen"
                                >
                                    {{
                                        settingsOpen
                                            ? "Hide settings"
                                            : "Edit settings"
                                    }}</button
                                ><template v-if="editingExisting"
                                    ><button
                                        class="btn btn-sm btn-ghost"
                                        :disabled="creatingTrial"
                                        @click="createTrial"
                                    >
                                        {{
                                            creatingTrial
                                                ? "Creating..."
                                                : "Create trial"
                                        }}</button
                                    ><button
                                        class="btn btn-sm btn-ghost"
                                        @click="togglePublished"
                                    >
                                        {{
                                            form.isPublished
                                                ? "Unpublish"
                                                : "Publish"
                                        }}</button
                                    ><button
                                        class="btn btn-sm btn-ghost text-error"
                                        @click="toggleArchived"
                                    >
                                        {{
                                            form.isArchived
                                                ? "Restore"
                                                : "Archive"
                                        }}
                                    </button></template
                                >
                            </div>
                        </div></AdminCard
                    >
                    <AdminCard
                        ><details
                            :open="settingsOpen"
                            class="group"
                            @toggle="onSettingsToggle"
                        >
                            <summary
                                class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold"
                            >
                                <span>Test settings</span
                                ><span
                                    class="text-xs font-normal text-base-content/55 group-open:hidden"
                                    >Show editor</span
                                ><span
                                    class="hidden text-xs font-normal text-base-content/55 group-open:inline"
                                    >Hide editor</span
                                >
                            </summary>
                            <div v-if="settingsOpen" class="pt-5">
                                <div
                                    class="grid grid-cols-1 gap-3 md:grid-cols-2"
                                >
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Key
                                        </legend>
                                        <input
                                            v-model.trim="form.key"
                                            class="input input-sm"
                                            :disabled="editingExisting"
                                            placeholder="platform-entry"
                                        />
                                        <p class="label">
                                            Stable identifier; cannot be changed
                                            after creation.
                                        </p>
                                    </fieldset>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Title
                                        </legend>
                                        <input
                                            v-model="form.title"
                                            class="input input-sm"
                                            placeholder="Platform entry"
                                        />
                                    </fieldset>
                                    <fieldset class="fieldset md:col-span-2">
                                        <legend class="fieldset-legend">
                                            Description
                                        </legend>
                                        <textarea
                                            v-model="form.description"
                                            class="textarea textarea-sm"
                                        ></textarea>
                                    </fieldset>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Passing score (%)
                                        </legend>
                                        <input
                                            v-model.number="form.passingScore"
                                            type="number"
                                            min="0"
                                            max="100"
                                            class="input input-sm"
                                        />
                                    </fieldset>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Max attempts
                                        </legend>
                                        <input
                                            v-model.number="form.maxAttempts"
                                            type="number"
                                            min="1"
                                            class="input input-sm"
                                            placeholder="Unlimited"
                                        />
                                        <p class="label">
                                            Leave empty for unlimited attempts.
                                        </p>
                                    </fieldset>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Retry period (days)
                                        </legend>
                                        <input
                                            v-model.number="
                                                form.attemptPeriodDays
                                            "
                                            type="number"
                                            min="1"
                                            class="input input-sm"
                                        />
                                    </fieldset>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Time limit (seconds)
                                        </legend>
                                        <input
                                            v-model.number="
                                                form.timeLimitSeconds
                                            "
                                            type="number"
                                            min="1"
                                            class="input input-sm"
                                            placeholder="No limit"
                                        />
                                    </fieldset>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Completion experience
                                        </legend>
                                        <input
                                            v-model.number="form.rewardExperience"
                                            type="number"
                                            min="1"
                                            step="1"
                                            class="input input-sm"
                                            placeholder="No reward"
                                        />
                                        <p class="label">
                                            Granted once after a non-trial attempt is fully graded.
                                        </p>
                                    </fieldset>
                                    <fieldset class="fieldset md:col-span-2">
                                        <legend class="fieldset-legend">
                                            Grant permission group after passing
                                        </legend>
                                        <input
                                            v-model.trim="
                                                form.grantedPermissionGroupKey
                                            "
                                            class="input input-sm"
                                            placeholder="Optional group key"
                                        />
                                    </fieldset>
                                </div>
                                <div class="mt-4 flex flex-wrap gap-5 text-sm">
                                    <label class="flex items-center gap-2"
                                        ><input
                                            v-model="form.isPublished"
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                        />
                                        Published</label
                                    ><label class="flex items-center gap-2"
                                        ><input
                                            v-model="form.isListed"
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                        />
                                        Listed publicly</label
                                    ><label class="flex items-center gap-2"
                                        ><input
                                            v-model="form.shuffleQuestions"
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                        />
                                        Shuffle questions</label
                                    ><label class="flex items-center gap-2"
                                        ><input
                                            v-model="form.allowCategorySelection"
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                        />
                                        Let participants choose 3–5 categories</label
                                    >
                                </div>
                                <div
                                    v-if="form.shuffleQuestions"
                                    class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
                                >
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Questions per attempt
                                        </legend>
                                        <input
                                            v-model.number="
                                                form.randomQuestionCount
                                            "
                                            type="number"
                                            min="1"
                                            class="input input-sm"
                                            placeholder="All questions"
                                        />
                                        <p class="label">
                                            Randomly choose this many questions
                                            from the assigned groups. Leave
                                            empty to use all questions.
                                        </p>
                                    </fieldset>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Simple-question share (%)
                                        </legend>
                                        <input
                                            v-model.number="
                                                form.simpleQuestionPercentage
                                            "
                                            type="number"
                                            min="0"
                                            max="100"
                                            class="input input-sm"
                                        />
                                        <p class="label">
                                            Difficulty 1–2 is simple; 3+ is
                                            hard. Defaults to 60% simple.
                                        </p>
                                    </fieldset>
                                </div>
                            </div>
                        </details></AdminCard
                    >
                    <AdminCard
                        :title="`Question groups (${form.questionGroups.length})`"
                        ><template #actions
                            ><div class="flex gap-2">
                                <select
                                    v-model="groupToAdd"
                                    class="select select-xs"
                                >
                                    <option value="">Select a group</option>
                                    <option
                                        v-for="group in groups"
                                        :key="group.key"
                                        :value="group.key"
                                    >
                                        {{ group.title }}
                                    </option></select
                                ><button
                                    class="btn btn-ghost btn-xs"
                                    :disabled="!groupToAdd"
                                    @click="addGroup"
                                >
                                    Add
                                </button>
                            </div></template
                        >
                        <div
                            v-if="form.questionGroups.length"
                            class="space-y-2"
                        >
                            <div
                                v-for="(
                                    assignment, index
                                ) in form.questionGroups"
                                :key="assignment.questionGroupKey"
                                class="flex items-center justify-between gap-3 border border-base-300 rounded-lg px-3 py-2"
                            >
                                <div>
                                    <div class="text-sm font-medium">
                                        {{
                                            groupTitle(
                                                assignment.questionGroupKey,
                                            )
                                        }}
                                    </div>
                                    <div
                                        class="font-mono text-xs text-base-content/50"
                                    >
                                        {{ assignment.questionGroupKey }} ·
                                        {{
                                            groupQuestionCount(
                                                assignment.questionGroupKey,
                                            )
                                        }}
                                        questions
                                    </div>
                                </div>
                                <button
                                    class="btn btn-ghost btn-xs text-error"
                                    @click="removeGroup(index)"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                        <p v-else class="text-sm text-base-content/50">
                            Add one or more reusable question groups from the
                            question bank.
                        </p></AdminCard
                    >
                    <div class="flex justify-end">
                        <button
                            class="btn btn-primary"
                            :disabled="saving"
                            @click="saveTest"
                        >
                            {{ saving ? "Saving..." : "Save test" }}
                        </button>
                    </div>
                    <AdminCard v-if="editingExisting" title="Pending reviews"
                        ><template #actions
                            ><button
                                class="btn btn-ghost btn-xs"
                                :disabled="reviewLoading"
                                @click="loadPending"
                            >
                                Refresh
                            </button></template
                        >
                        <div
                            v-if="reviewLoading"
                            class="flex justify-center py-6"
                        >
                            <span class="loading loading-spinner loading-sm" />
                        </div>
                        <div v-else-if="attempts.length" class="space-y-3">
                            <div
                                v-for="attempt in attempts"
                                :key="attempt.id"
                                class="border-b border-base-300 pb-3 last:border-0"
                            >
                                <div class="mb-2 text-xs text-base-content/60">
                                    <span class="font-mono">{{
                                        attempt.accountId
                                    }}</span>
                                    ·
                                    {{
                                        formatDate(
                                            attempt.submittedAt ||
                                                attempt.startedAt,
                                        )
                                    }}
                                </div>
                                <div
                                    v-for="answer in reviewableAnswers(attempt)"
                                    :key="answer.id"
                                    class="mb-2 flex flex-wrap items-center gap-2 rounded-md bg-base-200 p-2"
                                >
                                    <code
                                        class="max-w-full flex-1 break-all text-xs"
                                        >{{ stringify(answer.value) }}</code
                                    ><input
                                        v-model.number="reviewScores[answer.id]"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        class="input input-xs w-20"
                                        placeholder="Points"
                                    /><button
                                        class="btn btn-xs"
                                        @click="reviewAnswer(answer.id, true)"
                                    >
                                        Correct</button
                                    ><button
                                        class="btn btn-ghost btn-xs"
                                        @click="reviewAnswer(answer.id, false)"
                                    >
                                        Incorrect
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p v-else class="text-sm text-base-content/50">
                            No pending subjective answers.
                        </p></AdminCard
                    >
                </template>
            </div>
        </div>
    </NuxtLayout>
</template>
<script setup lang="ts">
import { IconPlus } from "#components";
import type {
    AdminTest,
    AdminTestAnswer,
    AdminTestAttempt,
    AdminTestQuestionGroup,
} from "~/types/admin";
import {
    archiveAdminTest,
    createAdminTest,
    createAdminTestTrialForTest,
    fetchAdminTestAttempts,
    fetchAdminTestQuestionGroups,
    fetchAdminTests,
    publishAdminTest,
    reviewAdminTestAnswer,
    updateAdminTest,
} from "~/utils/admin";
definePageMeta({ middleware: "auth" });
const tests = ref<AdminTest[]>([]);
const groups = ref<AdminTestQuestionGroup[]>([]);
const selectedKey = ref<string | null>(null);
const editorOpen = ref(false);
const editingExisting = ref(false);
const settingsOpen = ref(false);
const form = ref<AdminTest>(newTest());
const groupToAdd = ref("");
const attempts = ref<AdminTestAttempt[]>([]);
const reviewScores = ref<Record<string, number>>({});
const loading = ref(false);
const saving = ref(false);
const reviewLoading = ref(false);
const creatingTrial = ref(false);
function newTest(): AdminTest {
    return {
        key: "",
        title: "",
        description: "",
        isPublished: false,
        isListed: true,
        shuffleQuestions: false,
        allowCategorySelection: false,
        randomQuestionCount: null,
        simpleQuestionPercentage: 60,
        passingScore: 100,
        maxAttempts: null,
        attemptPeriodDays: 365,
        timeLimitSeconds: null,
        rewardExperience: null,
        grantedPermissionGroupKey: null,
        config: {},
        questionGroups: [],
    };
}
function normalize(test: Partial<AdminTest>): AdminTest {
    const copy = JSON.parse(JSON.stringify(test)) as Partial<AdminTest>;
    return {
        ...newTest(),
        ...copy,
        config: copy.config ?? {},
        questionGroups: (copy.questionGroups ?? [])
            .map((assignment, index) => ({
                ...assignment,
                questionGroupKey:
                    assignment.questionGroupKey ||
                    assignment.questionGroup?.key ||
                    "",
                sortOrder: assignment.sortOrder ?? index,
            }))
            .filter((assignment) => assignment.questionGroupKey),
    };
}
function testPayload(test: AdminTest): AdminTest {
    return {
        ...test,
        maxAttempts: optionalNumber(test.maxAttempts),
        attemptPeriodDays: optionalNumber(test.attemptPeriodDays),
        timeLimitSeconds: optionalNumber(test.timeLimitSeconds),
        rewardExperience: optionalNumber(test.rewardExperience),
        randomQuestionCount: test.shuffleQuestions
            ? optionalNumber(test.randomQuestionCount)
            : null,
        simpleQuestionPercentage: Number(test.simpleQuestionPercentage) || 60,
        grantedPermissionGroupKey:
            test.grantedPermissionGroupKey?.trim() || null,
        questionGroups: test.questionGroups.map(
            ({ questionGroupKey, sortOrder }) => ({
                questionGroupKey,
                sortOrder,
            }),
        ),
    };
}
function optionalNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function onSettingsToggle(event: Event) {
    settingsOpen.value = (event.currentTarget as HTMLDetailsElement).open;
}
function startCreate() {
    selectedKey.value = null;
    editingExisting.value = false;
    editorOpen.value = true;
    settingsOpen.value = true;
    form.value = newTest();
    attempts.value = [];
}
function selectTest(test: AdminTest, { revealSettings = false } = {}) {
    selectedKey.value = test.key;
    editingExisting.value = true;
    editorOpen.value = true;
    settingsOpen.value = revealSettings;
    form.value = normalize(test);
    loadPending();
}
function addGroup() {
    if (
        !groupToAdd.value ||
        form.value.questionGroups.some(
            (x) => x.questionGroupKey === groupToAdd.value,
        )
    )
        return;
    form.value.questionGroups.push({
        questionGroupKey: groupToAdd.value,
        sortOrder: form.value.questionGroups.length,
    });
    groupToAdd.value = "";
}
function removeGroup(index: number) {
    form.value.questionGroups.splice(index, 1);
    form.value.questionGroups.forEach((item, sortOrder) => {
        item.sortOrder = sortOrder;
    });
}
function groupTitle(key: string) {
    return groups.value.find((x) => x.key === key)?.title || key;
}
function groupQuestionCount(key: string) {
    const group = groups.value.find((x) => x.key === key);
    return group?.questionCount ?? group?.questions?.length ?? 0;
}
function stringify(value: unknown) {
    return JSON.stringify(value);
}
function formatDate(value: string) {
    return new Date(value).toLocaleString();
}
function reviewableAnswers(attempt: AdminTestAttempt): AdminTestAnswer[] {
    return attempt.answers.filter(
        (answer) => answer.isCorrect === null || answer.isCorrect === undefined,
    );
}
async function load() {
    loading.value = true;
    try {
        const [loadedTests, loadedGroups] = await Promise.all([
            fetchAdminTests(),
            fetchAdminTestQuestionGroups(),
        ]);
        tests.value = loadedTests.map(normalize);
        groups.value = loadedGroups;
    } catch {
        useNuxtApp().$toast.error("Failed to load tests");
    } finally {
        loading.value = false;
    }
}
async function saveTest() {
    saving.value = true;
    try {
        const saved =
            editingExisting.value && selectedKey.value
                ? await updateAdminTest(
                      selectedKey.value,
                      testPayload(form.value),
                  )
                : await createAdminTest(testPayload(form.value));
        await load();
        const refreshed =
            tests.value.find((test) => test.key === saved.key) ??
            normalize(saved);
        selectTest(refreshed, { revealSettings: true });
        useNuxtApp().$toast.success("Test saved");
    } catch {
        useNuxtApp().$toast.error("Failed to save test");
    } finally {
        saving.value = false;
    }
}
async function togglePublished() {
    if (!selectedKey.value) return;
    try {
        const saved = await publishAdminTest(
            selectedKey.value,
            !form.value.isPublished,
        );
        await load();
        selectTest(
            tests.value.find((test) => test.key === saved.key) ??
                normalize(saved),
            { revealSettings: settingsOpen.value },
        );
    } catch {
        useNuxtApp().$toast.error("Failed to update publication");
    }
}
async function toggleArchived() {
    if (!selectedKey.value) return;
    try {
        const saved = await archiveAdminTest(
            selectedKey.value,
            !form.value.isArchived,
        );
        await load();
        selectTest(
            tests.value.find((test) => test.key === saved.key) ??
                normalize(saved),
            { revealSettings: settingsOpen.value },
        );
    } catch {
        useNuxtApp().$toast.error("Failed to update archive state");
    }
}
async function createTrial() {
    if (!selectedKey.value) return;
    creatingTrial.value = true;
    try {
        await createAdminTestTrialForTest(selectedKey.value);
        useNuxtApp().$toast.success("Trial created");
        await navigateTo("/admin/tests/trials");
    } catch {
        useNuxtApp().$toast.error("Failed to create trial");
    } finally {
        creatingTrial.value = false;
    }
}
async function loadPending() {
    if (!selectedKey.value) return;
    reviewLoading.value = true;
    try {
        attempts.value = await fetchAdminTestAttempts(selectedKey.value);
    } catch {
        useNuxtApp().$toast.error("Failed to load pending reviews");
    } finally {
        reviewLoading.value = false;
    }
}
async function reviewAnswer(answerId: string, isCorrect: boolean) {
    try {
        await reviewAdminTestAnswer(answerId, {
            isCorrect,
            awardedPoints: isCorrect ? (reviewScores.value[answerId] ?? 0) : 0,
        });
        await loadPending();
    } catch {
        useNuxtApp().$toast.error("Failed to review answer");
    }
}
onMounted(load);
</script>
