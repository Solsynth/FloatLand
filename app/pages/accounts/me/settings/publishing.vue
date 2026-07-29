<template>
  <div class="max-w-3xl mx-auto space-y-6 min-w-0">
    <h1 class="text-2xl font-bold mb-6 pt-4 max-lg:px-4">
      {{ t("settings.publishingTitle") }}
    </h1>

    <p class="text-sm text-base-content/60 max-lg:px-4 -mt-2">
      {{ t("settings.publishingDescription") }}
    </p>

    <div v-if="pending" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="loadError" class="alert alert-error max-lg:mx-4">
      <span>{{ loadError }}</span>
      <button class="btn btn-sm btn-ghost" @click="load">
        {{ t("settings.retry") }}
      </button>
    </div>

    <template v-else>
      <section class="settings-panel">
        <div class="settings-panel__body">
          <h2 class="card-title text-lg mb-4">
            {{ t("settings.defaultPublishers") }}
          </h2>

          <div class="space-y-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.defaultPostingPublisher") }}
              </legend>
              <select
                v-model="form.defaultPostingPublisherId"
                class="select select-bordered w-full"
              >
                <option :value="null">{{ t("settings.none") }}</option>
                <option
                  v-for="pub in publishers"
                  :key="pub.id"
                  :value="pub.id"
                >
                  {{ pub.nick || pub.name }} (@{{ pub.name }})
                </option>
              </select>
              <p class="label text-xs text-base-content/60">
                {{ t("settings.defaultPostingPublisherHint") }}
              </p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.defaultReplyPublisher") }}
              </legend>
              <select
                v-model="form.defaultReplyPublisherId"
                class="select select-bordered w-full"
              >
                <option :value="null">{{ t("settings.none") }}</option>
                <option
                  v-for="pub in publishers"
                  :key="pub.id"
                  :value="pub.id"
                >
                  {{ pub.nick || pub.name }} (@{{ pub.name }})
                </option>
              </select>
              <p class="label text-xs text-base-content/60">
                {{ t("settings.defaultReplyPublisherHint") }}
              </p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.defaultFediversePublisher") }}
              </legend>
              <select
                v-model="form.defaultFediversePublisherId"
                class="select select-bordered w-full"
              >
                <option :value="null">{{ t("settings.none") }}</option>
                <option
                  v-for="pub in publishers"
                  :key="`fed-${pub.id}`"
                  :value="pub.id"
                >
                  {{ pub.nick || pub.name }} (@{{ pub.name }})
                </option>
              </select>
              <p class="label text-xs text-base-content/60">
                {{ t("settings.defaultFediversePublisherHint") }}
              </p>
            </fieldset>

            <div
              v-if="publishers.length === 0"
              class="alert alert-info text-sm"
            >
              <span>{{ t("settings.noPublishersHint") }}</span>
              <NuxtLink to="/creators" class="btn btn-sm btn-ghost">
                {{ t("settings.managePublishers") }}
              </NuxtLink>
            </div>

            <div class="flex justify-end pt-2">
              <button
                class="btn btn-primary"
                :disabled="isSaving"
                @click="save"
              >
                <IconLoader v-if="isSaving" class="w-4 h-4 animate-spin" />
                <IconSave v-else class="w-4 h-4" />
                {{ t("settings.saveChanges") }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IconLoader, IconSave } from "#components";
import {
  fetchPublishingSettings,
  updatePublishingSettings,
} from "~/utils/api";
import { fetchManagedPublishers } from "~/utils/creator";
import type { PublisherManaged } from "~/types/creator";

const { t } = useI18n();
const pending = ref(true);
const isSaving = ref(false);
const loadError = ref("");

const publishers = ref<PublisherManaged[]>([]);
const form = reactive({
  defaultPostingPublisherId: null as string | null,
  defaultReplyPublisherId: null as string | null,
  defaultFediversePublisherId: null as string | null,
});

async function load() {
  pending.value = true;
  loadError.value = "";
  try {
    const [settings, pubs] = await Promise.all([
      fetchPublishingSettings(),
      fetchManagedPublishers().catch(() => [] as PublisherManaged[]),
    ]);
    publishers.value = pubs;
    form.defaultPostingPublisherId = settings.defaultPostingPublisherId ?? null;
    form.defaultReplyPublisherId = settings.defaultReplyPublisherId ?? null;
    form.defaultFediversePublisherId =
      settings.defaultFediversePublisherId ?? null;
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : t("settings.loadPublishingFail");
  } finally {
    pending.value = false;
  }
}

async function save() {
  isSaving.value = true;
  try {
    await updatePublishingSettings({
      defaultPostingPublisherId: form.defaultPostingPublisherId,
      defaultReplyPublisherId: form.defaultReplyPublisherId,
      defaultFediversePublisherId: form.defaultFediversePublisherId,
    });
    alert(t("settings.saved"));
  } catch (err) {
    alert(err instanceof Error ? err.message : t("settings.savePublishingFail"));
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  load();
});

defineOgImage("UniOgImage", { title: t("settings.publishingTitle") });

useSolarSeo({
  title: t("settings.publishingTitle"),
});
</script>
