<template>
  <NuxtLayout name="app">
    <div class="mx-auto max-w-5xl px-4 pt-4 sm:px-5 sm:pt-6">
      <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-bold sm:text-2xl">{{ t("workspaces.title") }}</h1>
          <p class="mt-1 text-sm text-base-content/55">{{ t("workspaces.subtitle") }}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" type="button" :disabled="status === 'pending'" @click="refreshWorkspaces">
            <IconRefreshCw class="h-4 w-4" :class="{ 'animate-spin': status === 'pending' }" />{{ t("workspaces.refresh") }}
          </button>
          <button class="btn btn-primary btn-sm" type="button" @click="showCreateDialog = true"><IconPlus class="h-4 w-4" />{{ t("workspaces.create") }}</button>
        </div>
      </header>

      <section v-if="status === 'pending' && workspaces.length === 0" class="flex justify-center py-16"><ConfuseSpinner :message="t('workspaces.loading')" /></section>
      <section v-else-if="error" class="workspace-panel px-5 py-12 text-center"><IconAlertCircle class="mx-auto h-6 w-6 text-error" /><p class="mt-3 text-sm text-base-content/65">{{ t("workspaces.loadError") }}</p><button class="btn btn-ghost btn-sm mt-4" type="button" @click="refreshWorkspaces">{{ t("workspaces.refresh") }}</button></section>
      <section v-else-if="workspaces.length" class="workspace-panel overflow-hidden">
        <div class="border-b border-base-300 bg-base-200/45 px-4 py-3 sm:px-5"><p class="text-sm font-semibold">{{ t("workspaces.yourWorkspaces") }}</p></div>
        <div class="divide-y divide-base-300">
          <NuxtLink v-for="workspace in workspaces" :key="workspace.id" :to="`/workspaces/${encodeURIComponent(workspace.slug)}`" class="workspace-row">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-base-200 text-sm font-bold text-base-content/70">
                <FileImage v-if="workspace.picture" :file="workspace.picture" :alt="workspace.name" class="h-full w-full object-cover" />
                <span v-else>{{ workspace.name.slice(0, 1).toUpperCase() }}</span>
              </div>
              <div class="min-w-0"><h2 class="truncate text-sm font-semibold">{{ workspace.name }}</h2><p class="mt-0.5 truncate text-xs text-base-content/50">{{ workspace.description || `@${workspace.slug}` }}</p></div>
            </div>
            <div class="flex shrink-0 items-center gap-2"><span class="hidden text-xs text-base-content/45 lg:inline">{{ typeLabel(workspace) }} · {{ planLabel(workspace) }}</span><span class="btn btn-primary btn-sm">{{ t("workspaces.open") }}<IconArrowRight class="h-4 w-4" /></span></div>
          </NuxtLink>
        </div>
      </section>
      <section v-else class="workspace-panel px-5 py-14 text-center"><IconBuilding class="mx-auto h-7 w-7 text-base-content/35" /><h2 class="mt-3 text-base font-semibold">{{ t("workspaces.emptyTitle") }}</h2><p class="mx-auto mt-1 max-w-md text-sm text-base-content/55">{{ t("workspaces.emptyDescription") }}</p><button class="btn btn-primary btn-sm mt-5" type="button" @click="showCreateDialog = true"><IconPlus class="h-4 w-4" />{{ t("workspaces.create") }}</button></section>
    </div>

    <dialog class="modal" :class="{ 'modal-open': showCreateDialog }" @close="closeCreateDialog">
      <div class="modal-box max-w-lg"><button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" type="button" :disabled="isCreating" @click="closeCreateDialog"><IconX class="h-5 w-5" /></button><h2 class="text-lg font-bold">{{ t("workspaces.createTitle") }}</h2><p class="mt-1 text-sm text-base-content/60">{{ t("workspaces.createDescription") }}</p><form class="mt-6 space-y-4" @submit.prevent="createNewWorkspace"><fieldset class="fieldset"><legend class="fieldset-legend">{{ t("workspaces.name") }}</legend><input v-model="draft.name" class="input w-full" required maxlength="1024" :placeholder="t('workspaces.namePlaceholder')" /><p class="label">{{ t("workspaces.nameHint") }}</p></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">{{ t("workspaces.slug") }}</legend><input v-model="draft.slug" class="input w-full" required maxlength="1024" pattern="[a-z0-9-]+" :placeholder="t('workspaces.slugPlaceholder')" @input="sanitizeSlug" /><p class="label">{{ t("workspaces.slugHint") }}</p></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">{{ t("workspaces.description") }}</legend><textarea v-model="draft.description" class="textarea w-full resize-none" maxlength="4096" :placeholder="t('workspaces.descriptionPlaceholder')" /><p class="label">{{ t("workspaces.descriptionHint") }}</p></fieldset><p v-if="createError" class="text-sm text-error">{{ createError }}</p><div class="modal-action"><button class="btn btn-ghost" type="button" :disabled="isCreating" @click="closeCreateDialog">{{ t("realms.cancel") }}</button><button class="btn btn-primary" type="submit" :disabled="isCreating || !isValid"><IconLoader v-if="isCreating" class="h-4 w-4 animate-spin" /><IconPlus v-else class="h-4 w-4" />{{ t("workspaces.create") }}</button></div></form></div><form method="dialog" class="modal-backdrop"><button :disabled="isCreating" @click="closeCreateDialog">close</button></form>
    </dialog>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Workspace } from "~/types/workspace";
import { WorkspacePlan, WorkspaceType } from "~/types/workspace";
import { createWorkspace, fetchWorkspaces } from "~/utils/api";
import { IconAlertCircle, IconArrowRight, IconBuilding, IconLoader, IconPlus, IconRefreshCw, IconX } from "#components";

definePageMeta({ middleware: "auth" });
const { t } = useI18n();
const workspaces = ref<Workspace[]>([]);
const showCreateDialog = ref(false);
const isCreating = ref(false);
const createError = ref<string | null>(null);
const draft = ref({ name: "", slug: "", description: "" });
const isValid = computed(() => draft.value.name.trim().length >= 2 && /^[a-z0-9-]{2,}$/.test(draft.value.slug));
useSolarSeo({ title: t("workspaces.title"), description: t("workspaces.subtitle") });
const { status, error, refresh } = await useAsyncData("workspace-management", async () => { const result = await fetchWorkspaces(); workspaces.value = result; return result; }, { default: () => [] as Workspace[], server: false });
async function refreshWorkspaces() { await refresh(); }
function sanitizeSlug() { draft.value.slug = draft.value.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
function closeCreateDialog() { if (!isCreating.value) { showCreateDialog.value = false; createError.value = null; } }
async function createNewWorkspace() { if (!isValid.value || isCreating.value) return; isCreating.value = true; createError.value = null; try { const workspace = await createWorkspace({ slug: draft.value.slug, name: draft.value.name.trim(), description: draft.value.description.trim() || undefined, type: WorkspaceType.organization }); workspaces.value.unshift(workspace); showCreateDialog.value = false; draft.value = { name: "", slug: "", description: "" }; await navigateTo(`/workspaces/${encodeURIComponent(workspace.slug)}`); } catch (err) { createError.value = err instanceof Error ? err.message : t("workspaces.createError"); } finally { isCreating.value = false; } }
function typeLabel(workspace: Workspace) { return workspace.type === WorkspaceType.individual ? t("workspaces.personalType") : t("workspaces.workspaceType"); }
function planLabel(workspace: Workspace) { return workspace.plan === WorkspacePlan.enterprise ? t("workspaces.enterprise") : workspace.plan === WorkspacePlan.pro ? t("workspaces.pro") : t("workspaces.free"); }
</script>

<style scoped>
.workspace-panel { border: 1px solid var(--color-base-300); background: var(--color-base-100); border-radius: 0.625rem; }
.workspace-row { display: flex; min-height: 4.75rem; align-items: center; gap: 1rem; padding: 0.875rem 1rem; transition: background-color 150ms ease; }
.workspace-row:hover { background: color-mix(in oklch, var(--color-base-200) 65%, transparent); }
@media (min-width: 640px) { .workspace-row { padding-left: 1.25rem; padding-right: 1.25rem; } }
</style>
