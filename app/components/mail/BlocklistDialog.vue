<template>
  <dialog class="modal" :class="{ 'modal-open': open }" @close="$emit('close')">
    <div class="modal-box max-w-lg">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        type="button"
        :title="t('mail.close')"
        @click="$emit('close')"
      >
        <IconX class="h-4 w-4" />
      </button>

      <h2 class="text-lg font-bold">{{ t("mail.blockedSenders") }}</h2>
      <p class="mt-1 text-sm text-base-content/60">
        {{ t("mail.blockedDescription") }}
      </p>

      <!-- Add form -->
      <form class="mt-4 space-y-3" @submit.prevent="create">
        <div class="flex flex-wrap gap-2">
          <input
            v-model.trim="pattern"
            type="text"
            class="input input-bordered input-sm min-w-0 flex-1"
            :placeholder="t('mail.blockPattern')"
            required
          />
          <select v-model="scope" class="select select-bordered select-sm">
            <option value="mailbox">{{ t("mail.blockScopeMailbox") }}</option>
            <option value="workspace">{{ t("mail.blockScopeWorkspace") }}</option>
          </select>
          <button class="btn btn-primary btn-sm" type="submit" :disabled="!pattern || saving">
            <IconLoader v-if="saving" class="w-4 h-4 animate-spin" />
            <IconPlus v-else class="w-4 h-4" />
            {{ t("mail.addBlocked") }}
          </button>
        </div>
        <p v-if="error" class="text-sm text-error">{{ error }}</p>
      </form>

      <!-- Rules list -->
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner" />
      </div>
      <div v-else-if="rules.length === 0" class="py-8 text-center text-sm text-base-content/50">
        {{ t("mail.noBlocked") }}
      </div>
      <div v-else class="mt-4 max-h-72 space-y-1.5 overflow-y-auto">
        <div
          v-for="rule in rules"
          :key="rule.id"
          class="flex items-center gap-2 rounded-box border border-base-300 px-3 py-2"
        >
          <IconShieldBan class="h-4 w-4 shrink-0 text-base-content/40" />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ rule.pattern }}
          </span>
          <span class="badge badge-ghost badge-sm shrink-0">
            {{ rule.matchType }}
          </span>
          <span class="hidden max-w-32 truncate text-xs text-base-content/40 sm:inline">
            {{ scopeLabel(rule) }}
          </span>
          <button
            class="btn btn-ghost btn-xs btn-circle shrink-0 text-error"
            :title="t('mail.removeBlock')"
            @click="remove(rule.id)"
          >
            <IconTrash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')" />
  </dialog>
</template>

<script setup lang="ts">
import { IconX, IconLoader, IconPlus, IconTrash2, IconShieldBan } from "#components";
import { fetchBlockRules, createBlockRule, deleteBlockRule } from "~/utils/api";
import type { BlockRule } from "~/types/mail";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const { $toast } = useNuxtApp();
const mail = useMail();

const rules = ref<BlockRule[]>([]);
const pattern = ref("");
const scope = ref<"mailbox" | "workspace">("mailbox");
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

function selectedMailbox() {
  return mail.state.mailboxes.find(
    (mailbox) => mailbox.id === mail.state.selectedMailboxId,
  );
}

function scopeLabel(rule: BlockRule) {
  if (rule.mailboxId) {
    const mailbox = mail.state.mailboxes.find(
      (item) => item.id === rule.mailboxId,
    );
    return mailbox?.address || rule.mailboxId;
  }
  return rule.workspaceId || "";
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    rules.value = await fetchBlockRules();
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.loadError");
  } finally {
    loading.value = false;
  }
}

async function create() {
  const mailbox = selectedMailbox();
  if (!mailbox) {
    error.value = t("mail.noMailboxes");
    return;
  }
  if (!pattern.value) return;
  saving.value = true;
  error.value = null;
  try {
    const rule = await createBlockRule({
      scope: scope.value,
      mailboxId: scope.value === "mailbox" ? mailbox.id : undefined,
      workspaceId: scope.value === "workspace" ? mailbox.workspaceId ?? undefined : undefined,
      pattern: pattern.value,
    });
    rules.value.unshift(rule);
    pattern.value = "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.loadError");
  } finally {
    saving.value = false;
  }
}

async function remove(id: string) {
  if (!(await useAlert().confirm(t("common.confirm"), t("mail.removeBlockConfirm")))) return;
  try {
    await deleteBlockRule(id);
    rules.value = rules.value.filter((rule) => rule.id !== id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.loadError");
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      pattern.value = "";
      error.value = null;
      load();
    }
  },
);
</script>
