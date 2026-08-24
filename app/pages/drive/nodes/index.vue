<template>
  <NuxtLayout name="drive">
    <div class="min-h-full px-5 py-6 sm:px-8 lg:px-10">
      <div class="mx-auto max-w-5xl">
        <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
              {{ t("drive.storageManagement") }}
            </p>
            <h1 class="text-2xl font-semibold tracking-tight text-base-content sm:text-3xl">
              {{ t("drive.nodes") }}
            </h1>
            <p class="mt-2 max-w-xl text-sm leading-6 text-base-content/55">
              {{ t("drive.nodesDescription") }}
            </p>
          </div>
          <button class="btn btn-primary btn-sm rounded-full px-4" @click="showCreate = !showCreate">
            <IconPlus class="h-4 w-4" />
            {{ t("drive.addNode") }}
          </button>
        </header>

        <Transition name="node-form">
          <section v-if="showCreate" class="mb-6 rounded-3xl border border-primary/20 bg-primary/[0.035] p-5 sm:p-7">
            <div class="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold">{{ t("drive.createNode") }}</h2>
                <p class="mt-1 max-w-xl text-sm leading-6 text-base-content/55">
                  {{ t("drive.createNodeDescription") }}
                </p>
              </div>
              <button class="btn btn-ghost btn-sm btn-circle" :aria-label="t('common.close')" @click="closeCreate">
                <IconX class="h-4 w-4" />
              </button>
            </div>

            <form class="space-y-6" @submit.prevent="handleCreate">
              <div class="grid gap-4 md:grid-cols-2">
                <label class="form-control">
                  <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.nodeName") }}</span></span>
                  <input v-model="form.name" class="input input-sm w-full rounded-xl border-base-300 bg-base-100" :placeholder="t('drive.nodeNamePlaceholder')" required />
                </label>
                <label class="form-control">
                  <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.endpoint") }}</span></span>
                  <input v-model="form.endpoint" type="url" class="input input-sm w-full rounded-xl border-base-300 bg-base-100" :placeholder="t('drive.endpointPlaceholder')" required />
                  <span class="label pt-1"><span class="label-text-alt text-xs text-base-content/45">{{ t("drive.endpointHint") }}</span></span>
                </label>
                <label class="form-control">
                  <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.machineId") }}</span></span>
                  <input v-model="form.machineId" class="input input-sm w-full rounded-xl border-base-300 bg-base-100 font-mono text-xs" :placeholder="t('drive.machineIdPlaceholder')" required />
                </label>
                <label class="form-control">
                  <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.authToken") }}</span></span>
                  <input v-model="form.authToken" type="password" class="input input-sm w-full rounded-xl border-base-300 bg-base-100" required />
                  <span class="label pt-1"><span class="label-text-alt text-xs text-base-content/45">{{ t("drive.authTokenHint") }}</span></span>
                </label>
              </div>

              <div class="border-t border-primary/10 pt-6">
                <div class="mb-4">
                  <h3 class="text-sm font-semibold">{{ t("drive.pools") }}</h3>
                  <p class="mt-1 text-xs text-base-content/50">{{ t("drive.credentialsHint") }}</p>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                  <label class="form-control">
                    <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.poolName") }}</span></span>
                    <input v-model="form.pool.name" class="input input-sm w-full rounded-xl border-base-300 bg-base-100" :placeholder="t('drive.poolNamePlaceholder')" required />
                  </label>
                  <label class="form-control">
                    <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.bucket") }}</span></span>
                    <input v-model="form.pool.bucket" class="input input-sm w-full rounded-xl border-base-300 bg-base-100 font-mono text-xs" :placeholder="t('drive.bucketPlaceholder')" required />
                  </label>
                  <label class="form-control">
                    <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.accessKey") }}</span></span>
                    <input v-model="form.pool.accessKey" class="input input-sm w-full rounded-xl border-base-300 bg-base-100 font-mono text-xs" autocomplete="off" required />
                  </label>
                  <label class="form-control">
                    <span class="label pb-1"><span class="label-text text-xs font-semibold">{{ t("drive.secretKey") }}</span></span>
                    <input v-model="form.pool.secretKey" type="password" class="input input-sm w-full rounded-xl border-base-300 bg-base-100 font-mono text-xs" autocomplete="new-password" required />
                  </label>
                </div>
                <div class="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                  <label class="flex items-center gap-2 text-xs text-base-content/65">
                    <input v-model="form.pool.enableSigned" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
                    {{ t("drive.enableSigned") }}
                  </label>
                  <label class="flex items-center gap-2 text-xs text-base-content/65">
                    <input v-model="form.pool.isHidden" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
                    {{ t("drive.privatePool") }}
                  </label>
                </div>
              </div>

              <div class="flex flex-col gap-3 border-t border-primary/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p class="max-w-md text-xs leading-5 text-base-content/45">{{ t("drive.nodeValidationHint") }}</p>
                <button class="btn btn-primary btn-sm rounded-full px-5" type="submit" :disabled="submitting">
                  <span v-if="submitting" class="loading loading-spinner loading-xs" />
                  <IconLink v-else class="h-4 w-4" />
                  {{ submitting ? t("drive.connectingNode") : t("drive.connectNode") }}
                </button>
              </div>
              <p v-if="formError" class="text-sm text-error">{{ formError }}</p>
            </form>
          </section>
        </Transition>

        <div v-if="loading" class="flex items-center justify-center rounded-3xl border border-base-300/70 bg-base-100/70 py-24">
          <span class="loading loading-spinner loading-md text-primary" />
        </div>

        <div v-else-if="loadError" class="rounded-3xl border border-error/20 bg-error/5 px-6 py-10 text-center">
          <p class="text-sm text-error">{{ loadError }}</p>
          <button class="btn btn-ghost btn-sm mt-4 rounded-full" @click="loadNodes">
            <IconRefreshCw class="h-4 w-4" />
            {{ t("common.retry") }}
          </button>
        </div>

        <div v-else-if="nodes.length === 0" class="rounded-3xl border border-dashed border-base-300 bg-base-100/50 px-6 py-16 text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IconServer class="h-7 w-7" />
          </div>
          <h2 class="mt-5 text-lg font-semibold">{{ t("drive.noNodes") }}</h2>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-base-content/55">
            {{ t("drive.noNodesHint") }}
          </p>
          <button class="btn btn-primary btn-sm mt-6 rounded-full px-5" @click="showCreate = true">
            <IconPlus class="h-4 w-4" />
            {{ t("drive.addNode") }}
          </button>
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="node in nodes"
            :key="node.id"
            class="rounded-3xl border border-base-300/70 bg-base-100 p-5 transition-colors hover:border-primary/30 sm:p-6"
          >
            <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div class="flex min-w-0 items-start gap-4">
                <div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <IconServer class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="font-semibold">{{ node.name }}</h2>
                    <span
                      class="badge badge-sm gap-1 rounded-full border-0"
                      :class="node.status === 'online' ? 'bg-success/10 text-success' : 'bg-base-200 text-base-content/50'"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="node.status === 'online' ? 'bg-success' : 'bg-base-content/30'"
                      />
                      {{ statusLabel(node) }}
                    </span>
                  </div>
                  <p class="mt-1 truncate font-mono text-xs text-base-content/50">{{ node.endpoint }}</p>
                  <p class="mt-2 text-xs text-base-content/40">
                    {{ t("drive.machineId") }} · <span class="font-mono">{{ node.machineId }}</span>
                  </p>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <button class="btn btn-ghost btn-sm rounded-full" @click="beginRename(node)">
                  <IconPencil class="h-4 w-4" />
                  {{ t("common.edit") }}
                </button>
                <button class="btn btn-ghost btn-sm rounded-full text-error hover:bg-error/10" @click="handleDelete(node)">
                  <IconTrash2 class="h-4 w-4" />
                  {{ t("drive.deleteNode") }}
                </button>
              </div>
            </div>

            <div v-if="editingId === node.id" class="mt-5 grid gap-3 border-t border-base-200 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label class="form-control">
                <span class="label pb-1"><span class="label-text text-xs">{{ t("drive.renameNode") }}</span></span>
                <input v-model="editForm.name" class="input input-sm rounded-xl border-base-300 bg-base-200" />
              </label>
              <label class="form-control">
                <span class="label pb-1"><span class="label-text text-xs">{{ t("drive.renamePool") }}</span></span>
                <input v-model="editForm.poolName" class="input input-sm rounded-xl border-base-300 bg-base-200" />
              </label>
              <div class="flex gap-2">
                <button class="btn btn-primary btn-sm rounded-full" :disabled="savingEdit" @click="saveNames(node)">
                  <span v-if="savingEdit" class="loading loading-spinner loading-xs" />
                  {{ t("drive.saveNames") }}
                </button>
                <button class="btn btn-ghost btn-sm rounded-full" @click="editingId = null">{{ t("common.cancel") }}</button>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-base-200 pt-4 text-xs text-base-content/45">
              <NuxtLink v-if="node.poolId" to="/drive/pools" class="inline-flex items-center gap-1.5 text-primary hover:underline">
                <IconDatabase class="h-3.5 w-3.5" />
                {{ t("drive.pools") }}
              </NuxtLink>
              <span v-if="node.poolId" class="font-mono">{{ node.poolId }}</span>
              <span>{{ t("drive.createdAt") }} · {{ formatDate(node.createdAt) }}</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  createDriveNode,
  deleteDriveNode,
  fetchDriveNodes,
  updateDriveNode,
} from "~/utils/api";
import type { CreateDriveNodePayload, SnStorageNode } from "~/types/drive";

const { t } = useI18n();
const { $toast } = useNuxtApp();

const nodes = ref<SnStorageNode[]>([]);
const loading = ref(true);
const loadError = ref("");
const showCreate = ref(false);
const submitting = ref(false);
const formError = ref("");
const editingId = ref<string | null>(null);
const savingEdit = ref(false);
const editForm = reactive({ name: "", poolName: "" });

const emptyForm = (): CreateDriveNodePayload => ({
  name: "",
  machineId: "",
  endpoint: "",
  authToken: "",
  pool: {
    name: "",
    description: "",
    bucket: "default",
    accessKey: "",
    secretKey: "",
    enableSigned: true,
    isHidden: true,
  },
});

const form = reactive<CreateDriveNodePayload>(emptyForm());

definePageMeta({ middleware: "auth" });

useSolarSeo({
  title: t("drive.nodes"),
  description: t("drive.nodesDescription"),
});

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function statusLabel(node: SnStorageNode) {
  return node.status === "online" ? t("drive.online") : t("drive.offline");
}

function resetForm() {
  Object.assign(form, emptyForm());
  formError.value = "";
}

function closeCreate() {
  showCreate.value = false;
  resetForm();
}

async function loadNodes() {
  loading.value = true;
  loadError.value = "";
  try {
    nodes.value = await fetchDriveNodes();
  } catch {
    loadError.value = t("drive.loadNodesFailed");
    $toast.error(loadError.value);
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  submitting.value = true;
  formError.value = "";
  try {
    await createDriveNode(form);
    $toast.success(t("drive.nodeCreated"));
    closeCreate();
    await loadNodes();
  } catch {
    formError.value = t("drive.createNodeFailed");
  } finally {
    submitting.value = false;
  }
}

function beginRename(node: SnStorageNode) {
  editingId.value = node.id;
  editForm.name = node.name;
  editForm.poolName = "";
}

async function saveNames(node: SnStorageNode) {
  if (!editForm.name.trim()) return;
  savingEdit.value = true;
  try {
    const updated = await updateDriveNode(node.id, {
      name: editForm.name.trim(),
      ...(editForm.poolName.trim() ? { poolName: editForm.poolName.trim() } : {}),
    });
    const index = nodes.value.findIndex((item) => item.id === node.id);
    if (index >= 0) nodes.value[index] = updated;
    editingId.value = null;
    $toast.success(t("drive.nodeUpdated"));
  } catch {
    $toast.error(t("drive.updateNodeFailed"));
  } finally {
    savingEdit.value = false;
  }
}

async function handleDelete(node: SnStorageNode) {
  if (!window.confirm(t("drive.confirmDeleteNode", { name: node.name }))) return;
  try {
    await deleteDriveNode(node.id);
    nodes.value = nodes.value.filter((item) => item.id !== node.id);
    $toast.success(t("drive.nodeDeleted"));
  } catch {
    $toast.error(t("drive.deleteNodeFailed"));
  }
}

onMounted(loadNodes);
</script>

<style scoped>
.node-form-enter-active,
.node-form-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.node-form-enter-from,
.node-form-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .node-form-enter-active,
  .node-form-leave-active {
    transition: none;
  }
}
</style>
