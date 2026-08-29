<template>
  <dialog class="modal" :class="{ 'modal-open': open }" @close="$emit('close')">
    <div class="modal-box max-w-md">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        type="button"
        :title="t('mail.close')"
        @click="$emit('close')"
      >
        <IconX class="h-4 w-4" />
      </button>

      <h2 class="text-lg font-bold">{{ t("mail.createLabel") }}</h2>

      <form class="mt-5 space-y-4" @submit.prevent="create">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("mail.labelName") }}</legend>
          <input
            v-model.trim="name"
            type="text"
            class="input w-full"
            :placeholder="t('mail.labelNamePlaceholder')"
            required
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("mail.labelColor") }}</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="swatch in colorPresets"
              :key="swatch"
              type="button"
              class="h-8 w-8 rounded-full border-2 transition-transform"
              :class="selectedColor === swatch ? 'scale-110 border-base-content' : 'border-transparent'"
              :style="{ backgroundColor: swatch }"
              @click="selectedColor = swatch"
            />
          </div>
        </fieldset>

        <p v-if="error" class="text-sm text-error">{{ error }}</p>

        <div class="modal-action">
          <button class="btn btn-ghost" type="button" @click="$emit('close')">
            {{ t("common.cancel") }}
          </button>
          <button class="btn btn-primary" type="submit" :disabled="!name || saving">
            <IconLoader v-if="saving" class="w-4 h-4 animate-spin" />
            <template v-else>{{ t("mail.createLabel") }}</template>
          </button>
        </div>
      </form>

      <!-- Existing labels -->
      <div v-if="labels.length" class="mt-6 border-t border-base-300 pt-4">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
          {{ t("mail.existingLabels") }}
        </p>
        <div class="space-y-1">
          <div
            v-for="label in labels"
            :key="label.id"
            class="flex items-center gap-2 rounded-box px-2 py-1.5 hover:bg-base-200/70"
          >
            <span
              class="h-3 w-3 shrink-0 rounded-full"
              :style="{ backgroundColor: label.color || '#888' }"
            />
            <span class="flex-1 truncate text-sm">{{ label.name }}</span>
            <button
              class="btn btn-ghost btn-xs btn-circle text-error"
              :title="t('mail.deleteLabel')"
              @click="remove(label)"
            >
              <IconTrash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')" />
  </dialog>
</template>

<script setup lang="ts">
import { IconX, IconLoader, IconTrash2 } from "#components";
import { createLabel, deleteLabel } from "~/utils/api";
import type { MailLabel } from "~/types/mail";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  created: [label: MailLabel];
}>();

const { t } = useI18n();
const { $toast } = useNuxtApp();
const mail = useMail();

const name = ref("");
const selectedColor = ref("#16a34a");
const saving = ref(false);
const error = ref<string | null>(null);

const colorPresets = [
  "#16a34a",
  "#2563eb",
  "#9333ea",
  "#e11d48",
  "#f59e0b",
  "#0d9488",
];

const labels = computed(() => mail.state.labels);

async function create() {
  if (!name.value) return;
  saving.value = true;
  error.value = null;
  try {
    const label = await createLabel({ name: name.value, color: selectedColor.value });
    mail.state.labels.push(label);
    name.value = "";
    selectedColor.value = colorPresets[0];
    emit("created", label);
    $toast.success(t("mail.labelCreated"));
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.sendFailed");
  } finally {
    saving.value = false;
  }
}

async function remove(label: MailLabel) {
  if (!(await useAlert().confirm(t("common.confirm"), t("mail.deleteLabelConfirm")))) return;
  try {
    await deleteLabel(label.id);
    mail.state.labels = mail.state.labels.filter((item) => item.id !== label.id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("mail.sendFailed");
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      name.value = "";
      selectedColor.value = colorPresets[0];
      error.value = null;
    }
  },
);
</script>
