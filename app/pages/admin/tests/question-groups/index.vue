<template>
    <NuxtLayout name="admin">
        <AdminPageHeader
            title="Question bank"
            description="Create reusable question groups, then maintain their questions independently."
        >
            <template #actions>
                <NuxtLink to="/admin/tests" class="btn btn-sm btn-ghost"
                    >Tests</NuxtLink
                >
                <button class="btn btn-sm btn-primary" @click="createGroup">
                    <IconPlus class="h-4 w-4" /> New group
                </button>
            </template>
        </AdminPageHeader>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
            <AdminCard>
                <div class="space-y-1">
                    <button
                        v-for="group in groups"
                        :key="group.key"
                        class="w-full rounded-md px-3 py-2.5 text-left hover:bg-base-200"
                        :class="{ 'bg-base-200': selectedKey === group.key }"
                        @click="selectGroup(group)"
                    >
                        <div class="truncate text-sm font-medium">
                            {{ group.title }}
                        </div>
                        <div
                            class="mt-1 flex items-center justify-between text-xs text-base-content/55"
                        >
                            <span class="font-mono">{{ group.key }}</span
                            ><span>{{ group.questionCount ?? 0 }}</span>
                        </div>
                    </button>
                    <p
                        v-if="!groups.length"
                        class="py-5 text-center text-sm text-base-content/50"
                    >
                        No question groups yet.
                    </p>
                </div>
            </AdminCard>

            <div class="space-y-4">
                <AdminCard v-if="!editorOpen"
                    ><p class="text-sm text-base-content/60">
                        Select a group to manage its questions.
                    </p></AdminCard
                >
                <template v-else>
                    <AdminCard>
                        <div
                            class="mb-4 flex items-center justify-between gap-3"
                        >
                            <div>
                                <div class="text-sm font-semibold">
                                    {{
                                        editingGroup
                                            ? groupForm.title || "Edit group"
                                            : "New group"
                                    }}
                                </div>
                                <div
                                    v-if="editingGroup"
                                    class="font-mono text-xs text-base-content/50"
                                >
                                    {{ selectedKey }}
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button
                                    v-if="editingGroup"
                                    class="btn btn-sm btn-ghost text-error"
                                    @click="removeGroup"
                                >
                                    Delete group</button
                                ><button
                                    class="btn btn-sm btn-ghost"
                                    @click="
                                        groupSettingsOpen = !groupSettingsOpen
                                    "
                                >
                                    {{
                                        groupSettingsOpen
                                            ? "Hide settings"
                                            : "Edit settings"
                                    }}
                                </button>
                            </div>
                        </div>
                        <details
                            :open="groupSettingsOpen"
                            @toggle="
                                groupSettingsOpen = (
                                    $event.currentTarget as HTMLDetailsElement
                                ).open
                            "
                        >
                            <summary class="cursor-pointer text-sm font-medium">
                                Group settings
                            </summary>
                            <div
                                class="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2"
                            >
                                <fieldset class="fieldset">
                                    <legend class="fieldset-legend">
                                        Group key
                                    </legend>
                                    <input
                                        v-model.trim="groupForm.key"
                                        class="input input-sm"
                                        :disabled="editingGroup"
                                        placeholder="platform-basics"
                                    />
                                    <p class="label">
                                        Stable identifier used when composing
                                        tests.
                                    </p>
                                </fieldset>
                                <fieldset class="fieldset">
                                    <legend class="fieldset-legend">
                                        Title
                                    </legend>
                                    <input
                                        v-model="groupForm.title"
                                        class="input input-sm"
                                        placeholder="Platform basics"
                                    />
                                </fieldset>
                                <fieldset class="fieldset md:col-span-2">
                                    <legend class="fieldset-legend">
                                        Description
                                    </legend>
                                    <textarea
                                        v-model="groupForm.description"
                                        class="textarea textarea-sm"
                                        placeholder="Optional context for test authors."
                                    ></textarea>
                                </fieldset>
                                <fieldset class="fieldset md:col-span-2">
                                    <legend class="fieldset-legend">
                                        Configuration (JSON)
                                    </legend>
                                    <textarea
                                        class="textarea min-h-24 font-mono text-xs"
                                        :value="json(groupForm.config)"
                                        @change="setGroupConfig"
                                    ></textarea>
                                </fieldset>
                            </div>
                            <div class="mt-4 flex justify-end">
                                <button
                                    class="btn btn-primary btn-sm"
                                    :disabled="savingGroup"
                                    @click="saveGroup"
                                >
                                    {{ savingGroup ? "Saving…" : "Save group" }}
                                </button>
                            </div>
                        </details>
                    </AdminCard>

                    <AdminCard v-if="editingGroup">
                        <template #title
                            >Questions
                            <span class="ml-1 font-normal text-base-content/50"
                                >({{ questionPage.totalCount }})</span
                            ></template
                        >
                        <template #actions
                            ><div class="flex gap-2">
                                <button
                                    class="btn btn-sm btn-ghost"
                                    @click="exportCsv"
                                >
                                    Export CSV</button
                                ><button
                                    v-if="questionPage.totalCount"
                                    class="btn btn-sm btn-ghost text-error"
                                    @click="pruneQuestions"
                                >
                                    Clear group</button
                                ><button
                                    class="btn btn-sm btn-ghost"
                                    @click="importOpen = !importOpen"
                                >
                                    Import CSV</button
                                ><button
                                    class="btn btn-sm btn-primary"
                                    :disabled="hasDraftQuestion"
                                    @click="addQuestion"
                                >
                                    <IconPlus class="h-4 w-4" /> New question
                                </button>
                            </div></template
                        >
                        <div
                            v-if="importOpen"
                            class="mb-4 border border-base-300 px-4 py-2 rounded-lg"
                        >
                            <fieldset class="fieldset">
                                <legend class="fieldset-legend">
                                    CSV file
                                </legend>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    class="file-input file-input-sm w-full max-w-md"
                                    @change="readCsv"
                                />
                            </fieldset>
                            <fieldset class="fieldset mt-3">
                                <legend class="fieldset-legend">
                                    Or paste CSV
                                </legend>
                                <textarea
                                    v-model="csvContent"
                                    class="textarea min-h-32 font-mono text-xs"
                                    placeholder="content,category,type,grading_mode,difficulty,points,choices,correct_choices&#10;What is 2+2?,math,single_choice,auto,1,1,3|4|5,1"
                                ></textarea>
                                <div class="mt-2">
                                    <button
                                        class="btn btn-sm btn-ghost"
                                        :disabled="!csvContent.trim()"
                                        @click="parsePastedCsv"
                                    >
                                        Parse pasted CSV
                                    </button>
                                </div>
                            </fieldset>
                            <div
                                v-if="importRows.length"
                                class="mt-3 flex items-center justify-between gap-3"
                            >
                                <span class="text-sm"
                                    >{{ importRows.length }} questions ready to
                                    import.</span
                                >
                                <div class="flex gap-2">
                                    <button
                                        class="btn btn-sm btn-ghost"
                                        @click="clearImport"
                                    >
                                        Cancel</button
                                    ><button
                                        class="btn btn-sm btn-primary"
                                        :disabled="importing"
                                        @click="importCsv"
                                    >
                                        {{
                                            importing
                                                ? "Importing…"
                                                : "Import questions"
                                        }}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="questionsLoading"
                            class="flex justify-center py-8"
                        >
                            <span class="loading loading-spinner loading-sm" />
                        </div>
                        <div
                            v-else-if="questions.length"
                            class="divide-y divide-base-300 border-y border-base-300"
                        >
                            <details
                                v-for="question in questions"
                                :key="question.id ?? 'new-question'"
                                :open="
                                    expandedQuestionId ===
                                    (question.id ?? 'new-question')
                                "
                                class="py-1"
                                @toggle="toggleQuestion(question, $event)"
                            >
                                <summary
                                    class="flex cursor-pointer list-none items-center justify-between gap-4 px-3 py-3 hover:bg-base-200"
                                >
                                    <div class="min-w-0">
                                        <div
                                            class="truncate text-sm font-medium"
                                        >
                                            {{
                                                question.content ||
                                                "Untitled question"
                                            }}
                                        </div>
                                        <div
                                            class="mt-1 text-xs text-base-content/55"
                                        >
                                            {{ questionKind(question) }} ·
                                            {{ question.points }} points ·
                                            difficulty {{ question.difficulty }}
                                        </div>
                                    </div>
                                    <span class="text-xs text-base-content/50"
                                        >Edit</span
                                    >
                                </summary>
                                <div class="space-y-4 px-3 pb-4 pt-3">
                                    <div
                                        class="grid grid-cols-1 gap-3 md:grid-cols-2"
                                    >
                                        <fieldset
                                            class="fieldset md:col-span-2"
                                        >
                                            <legend class="fieldset-legend">
                                                Question
                                            </legend>
                                            <textarea
                                                v-model="question.content"
                                                class="textarea textarea-sm"
                                                placeholder="Write the question."
                                            ></textarea>
                                        </fieldset>
                                        <fieldset class="fieldset">
                                            <legend class="fieldset-legend">
                                                Answer type
                                            </legend>
                                            <select
                                                v-model.number="question.type"
                                                class="select select-sm"
                                                @change="normalise(question)"
                                            >
                                                <option :value="0">
                                                    Single choice
                                                </option>
                                                <option :value="1">
                                                    Multiple choice
                                                </option>
                                                <option :value="2">
                                                    Free text
                                                </option>
                                            </select>
                                        </fieldset>
                                        <fieldset class="fieldset">
                                            <legend class="fieldset-legend">
                                                Grading
                                            </legend>
                                            <select
                                                v-model.number="
                                                    question.gradingMode
                                                "
                                                class="select select-sm"
                                                :disabled="question.type === 2"
                                            >
                                                <option :value="0">
                                                    Automatic
                                                </option>
                                                <option :value="1">
                                                    Manual review
                                                </option>
                                            </select>
                                            <p
                                                v-if="question.type === 2"
                                                class="label"
                                            >
                                                Free-text answers are reviewed
                                                manually.
                                            </p>
                                        </fieldset>
                                        <fieldset class="fieldset">
                                            <legend class="fieldset-legend">
                                                Points
                                            </legend>
                                            <input
                                                v-model.number="question.points"
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                class="input input-sm"
                                            />
                                        </fieldset>
                                        <fieldset class="fieldset">
                                            <legend class="fieldset-legend">
                                                Difficulty
                                            </legend>
                                            <input
                                                v-model.number="
                                                    question.difficulty
                                                "
                                                type="number"
                                                min="0"
                                                class="input input-sm"
                                            />
                                        </fieldset>
                                        <fieldset class="fieldset">
                                            <legend class="fieldset-legend">
                                                Category
                                            </legend>
                                            <input
                                                v-model.trim="question.category"
                                                class="input input-sm"
                                                placeholder="Optional identifier"
                                            />
                                            <p class="label">
                                                Shuffle balances selected
                                                questions across categories.
                                            </p>
                                        </fieldset>
                                    </div>
                                    <div v-if="question.type !== 2">
                                        <div
                                            class="mb-2 flex items-center justify-between"
                                        >
                                            <span class="text-sm font-medium"
                                                >Choices</span
                                            ><button
                                                class="btn btn-ghost btn-xs"
                                                @click="addChoice(question)"
                                            >
                                                <IconPlus class="h-3.5 w-3.5" />
                                                Add choice
                                            </button>
                                        </div>
                                        <div class="space-y-2">
                                            <div
                                                v-for="(
                                                    choice, index
                                                ) in question.choices"
                                                :key="choice.id ?? index"
                                                class="flex items-center gap-2"
                                            >
                                                <input
                                                    v-if="question.type === 0"
                                                    :checked="choice.isCorrect"
                                                    type="radio"
                                                    class="radio radio-sm"
                                                    @change="
                                                        setCorrect(
                                                            question,
                                                            index,
                                                        )
                                                    "
                                                />
                                                <input
                                                    v-else
                                                    v-model="choice.isCorrect"
                                                    type="checkbox"
                                                    class="checkbox checkbox-sm"
                                                />
                                                <input
                                                    v-model="choice.content"
                                                    class="input input-sm min-w-0 flex-1"
                                                    :placeholder="`Choice ${index + 1}`"
                                                />
                                                <button
                                                    class="btn btn-ghost btn-xs text-error"
                                                    @click="
                                                        removeChoice(
                                                            question,
                                                            index,
                                                        )
                                                    "
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <fieldset class="fieldset">
                                        <legend class="fieldset-legend">
                                            Configuration (JSON)
                                        </legend>
                                        <textarea
                                            class="textarea min-h-20 font-mono text-xs"
                                            :value="json(question.config)"
                                            @change="
                                                setQuestionConfig(
                                                    question,
                                                    $event,
                                                )
                                            "
                                        ></textarea>
                                    </fieldset>
                                    <div class="flex justify-between">
                                        <button
                                            class="btn btn-ghost btn-sm text-error"
                                            @click="removeQuestion(question)"
                                        >
                                            Delete question</button
                                        ><button
                                            class="btn btn-primary btn-sm"
                                            :disabled="
                                                savingQuestion === question ||
                                                !question.content.trim()
                                            "
                                            @click="saveQuestion(question)"
                                        >
                                            {{
                                                savingQuestion === question
                                                    ? "Saving…"
                                                    : "Save question"
                                            }}
                                        </button>
                                    </div>
                                </div>
                            </details>
                        </div>
                        <p
                            v-else
                            class="py-8 text-center text-sm text-base-content/50"
                        >
                            This group has no questions yet.
                        </p>
                        <div
                            v-if="questionPage.totalCount > pageSize"
                            class="mt-4 flex items-center justify-between"
                        >
                            <span class="text-sm text-base-content/55"
                                >{{ pageOffset + 1 }}–{{
                                    Math.min(
                                        pageOffset + pageSize,
                                        questionPage.totalCount,
                                    )
                                }}
                                of {{ questionPage.totalCount }}</span
                            >
                            <div class="join">
                                <button
                                    class="btn btn-sm join-item"
                                    :disabled="pageOffset === 0"
                                    @click="changePage(-1)"
                                >
                                    Previous</button
                                ><button
                                    class="btn btn-sm join-item"
                                    :disabled="
                                        pageOffset + pageSize >=
                                        questionPage.totalCount
                                    "
                                    @click="changePage(1)"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </AdminCard>
                </template>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { IconPlus } from "#components";
import type {
    AdminTestQuestion,
    AdminTestQuestionGroup,
    AdminTestQuestionPage,
} from "~/types/admin";
import {
    createAdminTestQuestion,
    createAdminTestQuestionGroup,
    deleteAdminTestQuestion,
    deleteAdminTestQuestionGroup,
    exportAdminTestQuestionsCsv,
    fetchAdminTestQuestionGroups,
    fetchAdminTestQuestions,
    importAdminTestQuestions,
    pruneAdminTestQuestions,
    updateAdminTestQuestion,
    updateAdminTestQuestionGroup,
} from "~/utils/admin";

definePageMeta({ middleware: "auth" });

const groups = ref<AdminTestQuestionGroup[]>([]);
const selectedKey = ref<string | null>(null);
const editorOpen = ref(false);
const editingGroup = ref(false);
const groupSettingsOpen = ref(false);
const savingGroup = ref(false);
const groupForm = ref<AdminTestQuestionGroup>(blankGroup());
const pageSize = 20;
const pageOffset = ref(0);
const questionPage = ref<AdminTestQuestionPage>({ totalCount: 0, items: [] });
const questions = ref<AdminTestQuestion[]>([]);
const questionsLoading = ref(false);
const expandedQuestionId = ref<string | null>(null);
const savingQuestion = ref<AdminTestQuestion | undefined>();
const importOpen = ref(false);
const importRows = ref<AdminTestQuestion[]>([]);
const importing = ref(false);
const csvContent = ref("");

function blankGroup(): AdminTestQuestionGroup {
    return {
        key: "",
        title: "",
        description: "",
        config: {},
        questionCount: 0,
    };
}
function blankQuestion(sortOrder: number): AdminTestQuestion {
    return {
        sortOrder,
        content: "",
        category: null,
        type: 0,
        gradingMode: 0,
        difficulty: 1,
        points: 1,
        config: {},
        choices: [
            { sortOrder: 0, content: "", isCorrect: true, config: {} },
            { sortOrder: 1, content: "", isCorrect: false, config: {} },
        ],
    };
}
function json(value: unknown) {
    return JSON.stringify(value, null, 2);
}
function parse(value: string) {
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
        throw new Error();
    return parsed as Record<string, unknown>;
}
function questionKind(question: AdminTestQuestion) {
    return (
        ["Single choice", "Multiple choice", "Free text"][question.type] ??
        "Question"
    );
}
const hasDraftQuestion = computed(() =>
    questions.value.some((question) => !question.id),
);

function createGroup() {
    selectedKey.value = null;
    editingGroup.value = false;
    editorOpen.value = true;
    groupSettingsOpen.value = true;
    groupForm.value = blankGroup();
    questions.value = [];
    questionPage.value = { totalCount: 0, items: [] };
}
function selectGroup(group: AdminTestQuestionGroup) {
    selectedKey.value = group.key;
    editingGroup.value = true;
    editorOpen.value = true;
    groupSettingsOpen.value = false;
    groupForm.value = JSON.parse(
        JSON.stringify(group),
    ) as AdminTestQuestionGroup;
    pageOffset.value = 0;
    void loadQuestions();
}
function setGroupConfig(event: Event) {
    try {
        groupForm.value.config = parse(
            (event.target as HTMLTextAreaElement).value,
        );
    } catch {
        useNuxtApp().$toast.error("Group configuration must be a JSON object");
    }
}
function setQuestionConfig(question: AdminTestQuestion, event: Event) {
    try {
        question.config = parse((event.target as HTMLTextAreaElement).value);
    } catch {
        useNuxtApp().$toast.error(
            "Question configuration must be a JSON object",
        );
    }
}
function addQuestion() {
    const question = blankQuestion(questionPage.value.totalCount);
    questions.value.unshift(question);
    expandedQuestionId.value = "new-question";
}
function toggleQuestion(question: AdminTestQuestion, event: Event) {
    if ((event.currentTarget as HTMLDetailsElement).open)
        expandedQuestionId.value = question.id ?? "new-question";
}
function addChoice(question: AdminTestQuestion) {
    question.choices.push({
        sortOrder: question.choices.length,
        content: "",
        isCorrect: false,
        config: {},
    });
}
function removeChoice(question: AdminTestQuestion, index: number) {
    question.choices.splice(index, 1);
    question.choices.forEach((choice, sortOrder) => {
        choice.sortOrder = sortOrder;
    });
}
function setCorrect(question: AdminTestQuestion, selected: number) {
    question.choices.forEach((choice, index) => {
        choice.isCorrect = index === selected;
    });
}
function normalise(question: AdminTestQuestion) {
    if (question.type === 2) {
        question.gradingMode = 1;
        question.choices = [];
    } else if (!question.choices.length)
        question.choices = blankQuestion(0).choices;
}
function parseCsv(text: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (char === '"') {
            if (quoted && text[index + 1] === '"') {
                value += char;
                index += 1;
            } else quoted = !quoted;
        } else if (char === "," && !quoted) {
            row.push(value.trim());
            value = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && text[index + 1] === "\n") index += 1;
            row.push(value.trim());
            if (row.some(Boolean)) rows.push(row);
            row = [];
            value = "";
        } else value += char;
    }
    row.push(value.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
}
function csvQuestions(text: string) {
    const [header, ...rows] = parseCsv(text);
    if (!header) throw new Error("The file is empty.");
    const keys = header.map((value) => value.trim().toLowerCase());
    return rows.map((row, index) => {
        const data = Object.fromEntries(
            keys.map((key, column) => [key, row[column] ?? ""]),
        );
        const type =
            (
                {
                    single_choice: 0,
                    multiple_choice: 1,
                    free_text: 2,
                } as Record<string, number>
            )[data.type] ?? Number(data.type ?? 0);
        const gradingMode =
            ({ auto: 0, manual: 1 } as Record<string, number>)[
                data.grading_mode
            ] ?? Number(data.grading_mode ?? (type === 2 ? 1 : 0));
        const correct = new Set(
            (data.correct_choices ?? "")
                .split("|")
                .map((value) => Number(value.trim()))
                .filter(Number.isInteger),
        );
        const choices =
            type === 2
                ? []
                : (data.choices ?? "")
                      .split("|")
                      .map((content, choiceIndex) => ({
                          sortOrder: choiceIndex,
                          content: content.trim(),
                          isCorrect: correct.has(choiceIndex),
                          config: {},
                      }))
                      .filter((choice) => choice.content);
        return {
            sortOrder: questionPage.value.totalCount + index,
            content: data.content || data.question || "",
            category: data.category?.trim() || null,
            type,
            gradingMode,
            difficulty: Number(data.difficulty || 1),
            points: Number(data.points || 1),
            config: {},
            choices,
        };
    });
}
function parseImportCsv(text: string) {
    try {
        importRows.value = csvQuestions(text);
        if (!importRows.value.length)
            throw new Error("No question rows were found.");
    } catch (error) {
        importRows.value = [];
        useNuxtApp().$toast.error(
            error instanceof Error
                ? error.message
                : "Could not read the CSV content.",
        );
    }
}
async function readCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    csvContent.value = await file.text();
    parseImportCsv(csvContent.value);
}
function parsePastedCsv() {
    parseImportCsv(csvContent.value);
}
function clearImport() {
    importOpen.value = false;
    importRows.value = [];
    csvContent.value = "";
}

async function loadGroups() {
    try {
        groups.value = await fetchAdminTestQuestionGroups();
    } catch {
        useNuxtApp().$toast.error("Failed to load question groups");
    }
}
async function loadQuestions() {
    if (!selectedKey.value) return;
    questionsLoading.value = true;
    try {
        questionPage.value = await fetchAdminTestQuestions(
            selectedKey.value,
            pageSize,
            pageOffset.value,
        );
        questions.value = questionPage.value.items.map(
            (question) =>
                JSON.parse(JSON.stringify(question)) as AdminTestQuestion,
        );
    } catch {
        useNuxtApp().$toast.error("Failed to load questions");
    } finally {
        questionsLoading.value = false;
    }
}
async function saveGroup() {
    savingGroup.value = true;
    try {
        const saved =
            editingGroup.value && selectedKey.value
                ? await updateAdminTestQuestionGroup(
                      selectedKey.value,
                      groupForm.value,
                  )
                : await createAdminTestQuestionGroup(groupForm.value);
        await loadGroups();
        selectGroup(saved);
        groupSettingsOpen.value = true;
        useNuxtApp().$toast.success("Question group saved");
    } catch {
        useNuxtApp().$toast.error("Failed to save question group");
    } finally {
        savingGroup.value = false;
    }
}
async function saveQuestion(question: AdminTestQuestion) {
    if (!selectedKey.value) return;
    savingQuestion.value = question;
    try {
        if (question.id)
            await updateAdminTestQuestion(
                question.id,
                selectedKey.value,
                question,
            );
        else await createAdminTestQuestion(selectedKey.value, question);
        await loadQuestions();
        await loadGroups();
        useNuxtApp().$toast.success("Question saved");
    } catch {
        useNuxtApp().$toast.error("Failed to save question");
    } finally {
        savingQuestion.value = undefined;
    }
}
async function importCsv() {
    if (!selectedKey.value || !importRows.value.length) return;
    importing.value = true;
    try {
        const result = await importAdminTestQuestions(
            selectedKey.value,
            importRows.value,
        );
        clearImport();
        await loadQuestions();
        await loadGroups();
        useNuxtApp().$toast.success(
            `Imported ${result.importedCount} questions`,
        );
    } catch {
        useNuxtApp().$toast.error(
            "Failed to import questions. Check the CSV columns and answers.",
        );
    } finally {
        importing.value = false;
    }
}
async function exportCsv() {
    if (!selectedKey.value) return;
    try {
        const csv = await exportAdminTestQuestionsCsv(selectedKey.value);
        const url = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedKey.value}-questions.csv`;
        link.click();
        URL.revokeObjectURL(url);
    } catch {
        useNuxtApp().$toast.error("Failed to export questions");
    }
}
async function pruneQuestions() {
    if (
        !selectedKey.value ||
        !confirm(
            `Remove all questions from "${selectedKey.value}"? This cannot be undone.`,
        )
    )
        return;
    try {
        const result = await pruneAdminTestQuestions(selectedKey.value);
        await loadQuestions();
        await loadGroups();
        useNuxtApp().$toast.success(`Removed ${result.removedCount} questions`);
    } catch {
        useNuxtApp().$toast.error("Failed to remove questions");
    }
}
async function removeQuestion(question: AdminTestQuestion) {
    if (!question.id) {
        questions.value = questions.value.filter((item) => item !== question);
        return;
    }
    if (!confirm("Delete this question?")) return;
    try {
        await deleteAdminTestQuestion(question.id);
        if (questions.value.length === 1 && pageOffset.value > 0)
            pageOffset.value -= pageSize;
        await loadQuestions();
        await loadGroups();
        useNuxtApp().$toast.success("Question deleted");
    } catch {
        useNuxtApp().$toast.error("Failed to delete question");
    }
}
async function changePage(direction: number) {
    pageOffset.value = Math.max(0, pageOffset.value + direction * pageSize);
    await loadQuestions();
}
async function removeGroup() {
    if (
        !selectedKey.value ||
        !confirm(`Delete question group "${selectedKey.value}"?`)
    )
        return;
    try {
        await deleteAdminTestQuestionGroup(selectedKey.value);
        await loadGroups();
        editorOpen.value = false;
        selectedKey.value = null;
    } catch {
        useNuxtApp().$toast.error(
            "Remove this group from tests before deleting it",
        );
    }
}

onMounted(loadGroups);
</script>
