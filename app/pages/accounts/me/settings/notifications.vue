<template>
  <div class="max-w-3xl mx-auto space-y-6 min-w-0">
    <h1 class="text-2xl font-bold mb-6 pt-4 max-lg:px-4">
      {{ t("settings.notificationsTitle") }}
    </h1>

    <p class="text-sm text-base-content/60 max-lg:px-4 -mt-2">
      {{ t("settings.notificationsDescription") }}
    </p>

    <!-- Notification Topics -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <div class="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 class="card-title text-lg">
            {{ t("settings.notificationTopics") }}
          </h2>
          <button class="btn btn-sm btn-primary" @click="showAddTopic = true">
            <IconPlus class="w-4 h-4" />
            {{ t("settings.addCustom") }}
          </button>
        </div>

        <div v-if="pending" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <div
          v-else-if="loadError"
          class="alert alert-error"
        >
          <span>{{ loadError }}</span>
          <button class="btn btn-sm btn-ghost" @click="loadPreferences">
            {{ t("settings.retry") }}
          </button>
        </div>

        <div
          v-else-if="topics.length === 0"
          class="text-center py-8 text-base-content/60"
        >
          <IconBell class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{{ t("settings.noTopics") }}</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="topic in topics"
            :key="topic.topic"
            class="settings-row"
          >
            <div class="min-w-0">
              <p class="font-medium">{{ topicLabel(topic) }}</p>
              <p class="text-sm text-base-content/60 truncate">{{ topic.topic }}</p>
            </div>
            <select
              class="select select-bordered select-sm shrink-0"
              :value="preferenceFor(topic.topic)"
              :disabled="savingTopic === topic.topic"
              @change="onPreferenceChange(topic.topic, ($event.target as HTMLSelectElement).value)"
            >
              <option :value="0">{{ t("settings.normal") }}</option>
              <option :value="1">{{ t("settings.silent") }}</option>
              <option :value="2">{{ t("settings.off") }}</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Add Custom Topic Modal -->
    <dialog class="modal" :class="{ 'modal-open': showAddTopic }">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg mb-4">{{ t("settings.addCustomTopic") }}</h3>

        <fieldset class="fieldset mb-4">
          <legend class="fieldset-legend">
            {{ t("settings.topicId") }}
          </legend>
          <input
            v-model="newTopic.topic"
            type="text"
            class="input input-bordered w-full"
            :placeholder="t('settings.topicIdPlaceholder')"
          />
        </fieldset>

        <fieldset class="fieldset mb-4">
          <legend class="fieldset-legend">
            {{ t("settings.description") }}
          </legend>
          <input
            v-model="newTopic.description"
            type="text"
            class="input input-bordered w-full"
            :placeholder="t('settings.topicDescriptionPlaceholder')"
          />
        </fieldset>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="showAddTopic = false">
            {{ t("settings.cancel") }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="!newTopic.topic || !newTopic.description || isAddingTopic"
            @click="addCustomTopic"
          >
            <IconLoader v-if="isAddingTopic" class="w-4 h-4 animate-spin" />
            {{ t("settings.addCustom") }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showAddTopic = false" />
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { IconLoader, IconBell, IconPlus } from "#components";
import {
  DEFAULT_NOTIFICATION_TOPICS,
  fetchNotificationPreferences,
  setNotificationPreference,
  addCustomNotificationTopic,
  type SnNotificationPreferenceLevel,
  type SnNotificationTopic,
} from "~/utils/api";

const { t } = useI18n();
const pending = ref(true);
const loadError = ref("");
const isAddingTopic = ref(false);
const showAddTopic = ref(false);
const savingTopic = ref<string | null>(null);

const topics = ref<SnNotificationTopic[]>([...DEFAULT_NOTIFICATION_TOPICS]);
const preferences = ref<Record<string, SnNotificationPreferenceLevel>>({});

const newTopic = reactive({
  topic: "",
  description: "",
});

function preferenceFor(topic: string): SnNotificationPreferenceLevel {
  return preferences.value[topic] ?? 0;
}

function topicLabel(topic: SnNotificationTopic): string {
  const key = `settings.topic.${topic.topic.replace(/\./g, "_")}`;
  const translated = t(key);
  return translated === key ? topic.description : translated;
}

async function loadPreferences() {
  pending.value = true;
  loadError.value = "";
  try {
    const prefs = await fetchNotificationPreferences();
    const map: Record<string, SnNotificationPreferenceLevel> = {};
    for (const p of prefs) {
      map[p.topic] = (p.preference ?? 0) as SnNotificationPreferenceLevel;
    }
    preferences.value = map;

    // Merge any custom topics from preferences into the list
    const known = new Set(topics.value.map((t) => t.topic));
    for (const p of prefs) {
      if (!known.has(p.topic)) {
        topics.value.push({ topic: p.topic, description: p.topic });
        known.add(p.topic);
      }
    }
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : t("settings.loadPreferencesFail");
  } finally {
    pending.value = false;
  }
}

async function onPreferenceChange(topic: string, raw: string) {
  const preference = Number(raw) as SnNotificationPreferenceLevel;
  const previous = preferenceFor(topic);
  preferences.value[topic] = preference;
  savingTopic.value = topic;
  try {
    await setNotificationPreference(topic, preference);
  } catch (err) {
    preferences.value[topic] = previous;
    alert(err instanceof Error ? err.message : t("settings.savePreferenceFail"));
  } finally {
    savingTopic.value = null;
  }
}

async function addCustomTopic() {
  isAddingTopic.value = true;
  try {
    await addCustomNotificationTopic(newTopic.topic, newTopic.description);
    topics.value.push({ ...newTopic });
    newTopic.topic = "";
    newTopic.description = "";
    showAddTopic.value = false;
  } catch (err) {
    alert(err instanceof Error ? err.message : t("settings.addTopicFail"));
  } finally {
    isAddingTopic.value = false;
  }
}

onMounted(() => {
  loadPreferences();
});

defineOgImage("UniOgImage", { title: t("settings.notificationsTitle") });

useSolarSeo({
  title: t("settings.notificationsTitle"),
});
</script>
