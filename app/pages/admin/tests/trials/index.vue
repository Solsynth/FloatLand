<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Test trials" description="Create shareable trials for other accounts. They never affect activation, permissions, callbacks, or normal retries.">
      <template #actions><NuxtLink to="/admin/tests" class="btn btn-sm btn-ghost">Tests</NuxtLink><button class="btn btn-sm btn-primary" @click="create">New trial</button></template>
    </AdminPageHeader>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <AdminCard><div class="space-y-1"><button v-for="trial in trials" :key="trial.key" class="w-full rounded-md px-3 py-2 text-left hover:bg-base-200" :class="{ 'bg-base-200': selectedKey === trial.key }" @click="select(trial)"><div class="truncate text-sm font-medium">{{ trial.title }}</div><div class="mt-1 font-mono text-xs text-base-content/55">{{ trial.key }}</div></button><p v-if="!trials.length" class="py-5 text-center text-sm text-base-content/50">No trials yet.</p></div></AdminCard>
      <AdminCard v-if="open"><div class="grid grid-cols-1 gap-3 md:grid-cols-2"><fieldset class="fieldset"><legend class="fieldset-legend">Trial key</legend><input v-model.trim="form.key" class="input input-sm" :disabled="editing" placeholder="platform-entry-preview"></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">Title</legend><input v-model="form.title" class="input input-sm" placeholder="Platform entry preview"></fieldset><fieldset class="fieldset md:col-span-2"><legend class="fieldset-legend">Test</legend><select v-model="form.testKey" class="select select-sm"><option value="">Select a test</option><option v-for="test in tests" :key="test.key" :value="test.key">{{ test.title }} ({{ test.key }})</option></select></fieldset><fieldset class="fieldset md:col-span-2"><legend class="fieldset-legend">Description</legend><textarea v-model="form.description" class="textarea textarea-sm"></textarea></fieldset></div><label class="mt-4 flex items-center gap-2 text-sm"><input v-model="form.isPublished" type="checkbox" class="checkbox checkbox-sm"> Allow accounts to start this trial</label><div class="mt-5 flex items-center justify-between"><NuxtLink v-if="editing" :to="'/accounts/tests/trials/' + form.key" class="btn btn-sm btn-ghost">Open trial</NuxtLink><span v-else></span><button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save trial' }}</button></div></AdminCard>
      <AdminCard v-else><p class="text-sm text-base-content/60">Select a trial or create one.</p></AdminCard>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { AdminTest, AdminTestTrial } from '~/types/admin'
import { createAdminTestTrial, fetchAdminTests, fetchAdminTestTrials, updateAdminTestTrial } from '~/utils/admin'

definePageMeta({ middleware: 'auth' })
const trials = ref<AdminTestTrial[]>([])
const tests = ref<AdminTest[]>([])
const selectedKey = ref<string | null>(null)
const open = ref(false)
const editing = ref(false)
const saving = ref(false)
const form = ref<AdminTestTrial>(blank())
function blank(): AdminTestTrial { return { key: '', title: '', description: '', isPublished: true, testKey: '' } }
function create() { selectedKey.value = null; editing.value = false; open.value = true; form.value = blank() }
function select(trial: AdminTestTrial) { selectedKey.value = trial.key; editing.value = true; open.value = true; form.value = JSON.parse(JSON.stringify(trial)) as AdminTestTrial }
async function load() { try { [trials.value, tests.value] = await Promise.all([fetchAdminTestTrials(), fetchAdminTests()]) } catch { useNuxtApp().$toast.error('Failed to load trials') } }
async function save() { saving.value = true; try { const saved = editing.value && selectedKey.value ? await updateAdminTestTrial(selectedKey.value, form.value) : await createAdminTestTrial(form.value); await load(); select(trials.value.find(trial => trial.key === saved.key) ?? saved); useNuxtApp().$toast.success('Trial saved') } catch { useNuxtApp().$toast.error('Failed to save trial') } finally { saving.value = false } }
onMounted(load)
</script>
