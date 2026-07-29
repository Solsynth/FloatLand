<template>
  <div class="flex flex-col w-screen h-screen m-0 p-0 overflow-hidden">
    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center z-10 bg-base-100"
    >
      <div class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="flex flex-col items-center justify-center flex-1 gap-4 p-8"
    >
      <IconAlertCircle class="w-12 h-12 text-error" />
      <p class="text-center text-error">{{ error }}</p>
      <button class="btn btn-outline btn-sm" @click="openEditor">
        {{ t("common.retry") }}
      </button>
    </div>

    <!-- Editor -->
    <template v-if="!error">
      <div class="flex-1">
        <iframe
          ref="iframeRef"
          name="collabora-online-viewer"
          class="w-full h-full border-0"
          :title="t('drive.editingDocument')"
          allow="clipboard-read *; clipboard-write *; fullscreen *"
        />
      </div>

      <!-- Status bar -->
      <div
        class="grid grid-cols-[1fr_auto_1fr] items-center bg-base-100 px-4 py-2"
      >
        <!-- Branding -->
        <NuxtLink to="/drive" class="flex items-center gap-2 justify-self-start">
          <img src="/favicon.png" alt="Solar Network" class="w-5 h-5" />
          <span class="text-sm font-medium hidden sm:inline">Solar Network Drive</span>
        </NuxtLink>

        <!-- File name (centered) -->
        <div class="flex items-center justify-center min-w-0 px-4">
          <span class="text-sm truncate">{{ fileName }}</span>
        </div>

        <!-- Actions -->
        <button
          class="btn btn-ghost btn-xs justify-self-end"
          @click="navigateTo(`/files/${fileId}`)"
        >
          <IconX class="w-4 h-4" />
        </button>
      </div>
    </template>

    <!-- Form - only rendered after API call completes -->
    <form
      v-if="formReady"
      ref="formRef"
      method="POST"
      enctype="multipart/form-data"
      target="collabora-online-viewer"
      :action="formAction"
      class="hidden"
    >
      <input
        v-for="(value, key) in formFields"
        :key="key"
        type="hidden"
        :name="key"
        :value="value"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { t } = useI18n();
const route = useRoute();
const fileId = computed(() => route.params.id as string);

const iframeRef = ref<HTMLIFrameElement | null>(null);
const formRef = ref<HTMLFormElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const formAction = ref<string>("");
const formFields = ref<Record<string, string>>({});
const formReady = ref(false);
const fileName = ref<string>("");

defineOgImage('UniOgImage', { title: 'Edit Document', description: 'Edit document with Collabora Online.' })

useSolarSeo({
  title: "Edit Document",
  description: "Edit document with Collabora Online.",
});

onMounted(() => {
  openEditor();
});

async function openEditor() {
  loading.value = true;
  error.value = null;
  formReady.value = false;
  formAction.value = "";
  formFields.value = {};

  try {
    const [fileInfo, session] = await Promise.all([
      fetchDriveFileInfo(fileId.value),
      createWopiEditSession(fileId.value),
    ]);
    const fields: Record<string, string> = session.formFields || {};

    fileName.value = fileInfo.name;
    formAction.value = session.actionUrl;
    formFields.value = camelToSnake(fields);

    // Render the form, then submit it
    formReady.value = true;
    await nextTick();
    formRef.value?.submit();
  } catch (err) {
    console.error("Failed to open editor:", err);
    error.value = t("drive.failedToOpenEditor");
  } finally {
    loading.value = false;
  }
}
</script>
