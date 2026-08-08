<template>
  <div class="max-w-3xl mx-auto space-y-6 min-w-0">
    <h1 class="text-2xl font-bold mb-6 pt-4 max-lg:px-4">
      {{ t("settings.accountTitle") }}
    </h1>

    <!-- Quick links (Island activity section) -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg mb-2">{{ t("settings.related") }}</h2>
        <p class="text-sm text-base-content/60 mb-4">
          {{ t("settings.relatedDescription") }}
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <NuxtLink to="/tickets" class="btn btn-outline btn-sm justify-start gap-2">
            <IconTicket class="w-4 h-4" />
            {{ t("settings.tickets") }}
          </NuxtLink>
          <NuxtLink to="/wallets" class="btn btn-outline btn-sm justify-start gap-2">
            <IconWallet class="w-4 h-4" />
            {{ t("settings.wallets") }}
          </NuxtLink>
          <NuxtLink
            to="/accounts/me/relationships"
            class="btn btn-outline btn-sm justify-start gap-2"
          >
            <IconUsers class="w-4 h-4" />
            {{ t("settings.relationships") }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Danger zone -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg text-error mb-2">
          {{ t("settings.dangerZone") }}
        </h2>
        <p class="text-sm text-base-content/60 mb-4">
          {{ t("settings.accountDeletionDescription") }}
        </p>

        <div class="settings-danger-row">
          <div>
            <p class="font-medium">{{ t("settings.accountDeletion") }}</p>
            <p class="text-sm text-base-content/60">
              {{ t("settings.accountDeletionHint") }}
            </p>
          </div>
          <button
            class="btn btn-error btn-sm"
            :disabled="isDeleting"
            @click="confirmDelete = true"
          >
            <IconTrash class="w-4 h-4" />
            {{ t("settings.requestDeletion") }}
          </button>
        </div>
      </div>
    </section>

    <!-- Delete confirmation modal -->
    <dialog class="modal" :class="{ 'modal-open': confirmDelete }">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg text-error mb-2">
          {{ t("settings.accountDeletion") }}
        </h3>
        <p class="text-sm text-base-content/70 mb-4">
          {{ t("settings.accountDeletionConfirm") }}
        </p>
        <fieldset class="fieldset mb-4">
          <legend class="fieldset-legend">
            {{ t("settings.typeUsernameToConfirm", { name: user?.name }) }}
          </legend>
          <input
            v-model="confirmName"
            type="text"
            class="input input-bordered w-full"
            :placeholder="user?.name"
            autocomplete="off"
          />
        </fieldset>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeDeleteModal">
            {{ t("settings.cancel") }}
          </button>
          <button
            class="btn btn-error"
            :disabled="confirmName !== user?.name || isDeleting"
            @click="requestDeletion"
          >
            <IconLoader v-if="isDeleting" class="w-4 h-4 animate-spin" />
            {{ t("settings.requestDeletion") }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeDeleteModal" />
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {
  IconLoader,
  IconTrash,
  IconTicket,
  IconWallet,
  IconUsers,
} from "#components";
import { deleteAccount } from "~/utils/api";

const { t } = useI18n();
const { user, logout } = useAuth();
const { notify } = useAlert();

const confirmDelete = ref(false);
const confirmName = ref("");
const isDeleting = ref(false);

function closeDeleteModal() {
  confirmDelete.value = false;
  confirmName.value = "";
}

async function requestDeletion() {
  if (confirmName.value !== user.value?.name) return;
  isDeleting.value = true;
  try {
    await deleteAccount();
    await notify(t("settings.accountDeletionSent"));
    closeDeleteModal();
    await logout();
    await navigateTo("/");
  } catch (err) {
    await notify(
      err instanceof Error ? err.message : t("settings.accountDeletionFail"),
    );
  } finally {
    isDeleting.value = false;
  }
}

defineOgImage("UniOgImage", { title: t("settings.accountTitle") });

useSolarSeo({
  title: t("settings.accountTitle"),
});
</script>
