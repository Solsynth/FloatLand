<template>
  <form class="portal-form" @submit.prevent="handleSubmit">
    <!-- Profile Media Section -->
    <AdminCard
      title="Profile Media"
      description="Upload your publisher banner and avatar"
      class="mb-5"
    >
      <!-- Background Image -->
      <div class="relative mb-14">
        <div
          class="aspect-[16/7] rounded-box overflow-hidden bg-base-200 cursor-pointer hover:bg-base-300 transition-colors duration-150 group"
          @click="pickBackground"
        >
          <img
            v-if="backgroundUrl"
            :src="backgroundUrl"
            class="w-full h-full object-cover"
            alt="Background"
          >
          <div
            v-else
            class="flex flex-col items-center justify-center h-full gap-2"
          >
            <IconImage
              class="w-8 h-8 text-base-content/25 group-hover:text-primary/50 transition-colors"
            />
            <span
              class="text-xs text-base-content/35 group-hover:text-base-content/55 transition-colors"
            >
              Click to upload
            </span>
          </div>
        </div>
        <!-- Avatar -->
        <div
          class="absolute -bottom-10 left-4 cursor-pointer group"
          @click="pickPicture"
        >
          <div class="avatar">
            <div class="w-20 rounded-full ring-4 ring-base-100">
              <img v-if="pictureUrl" :src="pictureUrl" alt="Avatar">
              <div
                v-else
                class="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold"
              >
                {{ (form.nick || "?").slice(0, 2).toUpperCase() }}
              </div>
            </div>
          </div>
          <div
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >
            <IconCamera class="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </AdminCard>

    <!-- Profile Details Section -->
    <AdminCard
      title="Profile Details"
      description="Manage your publisher identity and public information"
      class="mb-5"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 fieldset-row">
        <!-- Username -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("creator.username") }}
            <span v-if="!publisher" class="text-error">*</span>
          </legend>
          <div class="join w-full">
            <span class="join-item btn btn-disabled bg-base-200">@</span>
            <input
              v-model="form.name"
              type="text"
              class="input join-item flex-1 min-w-0"
              :disabled="!!publisher"
              :placeholder="t('creator.username')"
            >
          </div>
          <p class="fieldset-label">{{ t("creator.usernameHint") }}</p>
        </fieldset>

        <!-- Nickname -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("creator.nickname") }}
            <span class="text-error">*</span>
          </legend>
          <input
            v-model="form.nick"
            type="text"
            class="input w-full"
            :placeholder="t('creator.nickname')"
          >
        </fieldset>
      </div>

      <!-- Bio -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("creator.bio") }}</legend>
        <textarea
          v-model="form.bio"
          class="textarea w-full min-h-[100px] leading-relaxed"
          rows="3"
          :placeholder="t('creator.bio')"
        />
        <p class="fieldset-label">Markdown supported</p>
      </fieldset>

      <!-- Realm (only for creation) -->
      <fieldset v-if="!publisher" class="fieldset">
        <legend class="fieldset-legend">{{ t("creator.realm") }}</legend>
        <select v-model="form.realmSlug" class="select w-full max-w-xs">
          <option value="">{{ t("creator.individual") }}</option>
        </select>
      </fieldset>
    </AdminCard>

    <!-- Actions -->
    <div class="portal-form-actions">
      <button type="button" class="btn btn-ghost" @click="emit('close')">
        {{ t("creator.cancel") }}
      </button>
      <button
        type="submit"
        class="btn btn-primary min-w-[7.5rem]"
        :class="{ loading: submitting }"
        :disabled="submitting || !form.name || !form.nick"
      >
        <IconSave class="w-4 h-4" />
        {{ publisher ? t("creator.save") : t("creator.create") }}
      </button>
    </div>
  </form>

  <!-- File Pickers -->
  <CloudFileDrawer
    v-model:open="picturePickerOpen"
    :allowed-types="['image']"
    :crop-aspect-ratio="1"
    usage="publisher.picture"
    @select="onPictureSelected"
  />
  <CloudFileDrawer
    v-model:open="backgroundPickerOpen"
    :allowed-types="['image']"
    :crop-aspect-ratio="16 / 7"
    usage="publisher.background"
    @select="onBackgroundSelected"
  />
</template>

<script setup lang="ts">
import { IconSave, IconImage, IconCamera } from "#components";
import type { PublisherManaged } from "~/types/creator";
import { createPublisher, updatePublisher } from "~/utils/creator";
import { getFileUrl } from "~/utils/files";
import type { SnCloudFile } from "~/types/drive";

const props = defineProps<{
  publisher?: PublisherManaged | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [publisher: PublisherManaged];
  created: [publisher: PublisherManaged];
}>();

const { t } = useI18n();

const form = reactive({
  name: props.publisher?.name ?? "",
  nick: props.publisher?.nick ?? "",
  bio: props.publisher?.bio ?? "",
  realmSlug: "",
});

const pictureId = ref<string | null>(props.publisher?.picture?.id ?? null);
const backgroundId = ref<string | null>(
  props.publisher?.background?.id ?? null,
);
const submitting = ref(false);

// File picker state
const picturePickerOpen = ref(false);
const backgroundPickerOpen = ref(false);

const pictureUrl = computed(() => getFileUrl(pictureId.value));
const backgroundUrl = computed(() => getFileUrl(backgroundId.value));

// Watch for publisher changes (when used in edit mode)
watch(
  () => props.publisher,
  (pub) => {
    if (pub) {
      form.name = pub.name;
      form.nick = pub.nick;
      form.bio = pub.bio ?? "";
      pictureId.value = pub.picture?.id ?? null;
      backgroundId.value = pub.background?.id ?? null;
    }
  },
  { immediate: true },
);

function pickPicture() {
  picturePickerOpen.value = true;
}

function onPictureSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    pictureId.value = file.id;
  }
}

function pickBackground() {
  backgroundPickerOpen.value = true;
}

function onBackgroundSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    backgroundId.value = file.id;
  }
}

async function handleSubmit() {
  submitting.value = true;
  try {
    let result: PublisherManaged;
    if (props.publisher) {
      result = await updatePublisher(props.publisher.name, {
        nick: form.nick,
        bio: form.bio,
        pictureId: pictureId.value,
        backgroundId: backgroundId.value,
      });
      emit("saved", result);
    } else {
      result = await createPublisher({
        name: form.name,
        nick: form.nick,
        bio: form.bio,
        pictureId: pictureId.value,
        backgroundId: backgroundId.value,
        realmSlug: form.realmSlug || undefined,
      });
      emit("created", result);
    }
  } catch (e) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
}
</script>
