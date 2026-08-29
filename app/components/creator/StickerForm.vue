<template>
  <div>
  <form class="portal-form" @submit.prevent="handleSubmit">
    <AdminCard
      :title="sticker ? 'Edit Sticker' : 'New Sticker'"
      description="Add a sticker to your sticker pack"
      class="mb-5"
    >
      <!-- Image Upload -->
      <div class="flex items-start gap-4 mb-5 p-4 rounded-box bg-base-200/50">
        <div class="w-20 h-20 rounded-box bg-base-200 overflow-hidden shrink-0">
          <FileImage
            v-if="imageUrl"
            :src="imageUrl"
            class="w-full h-full object-contain"
            alt="Sticker"
          />
          <div v-else class="flex items-center justify-center h-full">
            <IconImage class="w-8 h-8 text-base-content/20" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5 min-w-0">
          <p class="text-sm font-medium">Image</p>
          <p class="text-xs text-base-content/45 leading-relaxed">Upload the sticker image asset</p>
          <button type="button" class="btn btn-ghost btn-sm w-fit mt-1" @click="pickImage">
            <IconUpload class="w-4 h-4" />
            {{ imageId ? 'Change' : 'Upload' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 fieldset-row">
        <!-- Name -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Name</legend>
          <input
            v-model="form.name"
            type="text"
            class="input w-full"
            placeholder="My Sticker"
          >
        </fieldset>

        <!-- Slug -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t('creator.stickers.stickerSlug') }}
            <span class="text-error">*</span>
          </legend>
          <input
            v-model="form.slug"
            type="text"
            class="input w-full font-mono text-sm"
            placeholder="my-sticker"
            required
          >
          <p class="fieldset-label">{{ t('creator.stickers.stickerSlugHint') }}</p>
        </fieldset>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 fieldset-row mt-4">
        <!-- Size -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('creator.stickers.size') }}</legend>
          <select v-model="form.size" class="select w-full">
            <option :value="0">{{ t('creator.stickers.sizeAuto') }}</option>
            <option :value="1">{{ t('creator.stickers.sizeSmall') }}</option>
            <option :value="2">{{ t('creator.stickers.sizeMedium') }}</option>
            <option :value="3">{{ t('creator.stickers.sizeLarge') }}</option>
          </select>
        </fieldset>

        <!-- Mode -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('creator.stickers.mode') }}</legend>
          <select v-model="form.mode" class="select w-full">
            <option :value="0">{{ t('creator.stickers.modeSticker') }}</option>
            <option :value="1">{{ t('creator.stickers.modeEmote') }}</option>
          </select>
        </fieldset>
      </div>
    </AdminCard>

    <!-- Actions -->
    <div class="portal-form-actions">
      <button
        type="button"
        class="btn btn-ghost"
        @click="emit('close')"
      >
        {{ t('creator.cancel') }}
      </button>
      <button
        type="submit"
        class="btn btn-primary min-w-[7.5rem]"
        :class="{ loading: submitting }"
        :disabled="submitting || !form.slug || (!imageId && !sticker)"
      >
        <IconSave class="w-4 h-4" />
        {{ sticker ? t('creator.save') : t('creator.create') }}
      </button>
    </div>
  </form>

  <!-- File Picker -->
  <CloudFileDrawer
    v-model:open="imagePickerOpen"
    :allowed-types="['image']"
    usage="sticker.image"
    @select="onImageSelected"
  />
  </div>
</template>

<script setup lang="ts">
import { IconSave, IconImage, IconUpload } from '#components'
import type { SnSticker } from '~/types/creator'
import { createSticker, updateSticker } from '~/utils/creator'
import { getFileUrl } from '~/utils/files'
import type { SnCloudFile } from '~/types/drive'

const props = defineProps<{
  packId: string
  sticker?: SnSticker | null
}>()

const emit = defineEmits<{
  close: []
  saved: [sticker: SnSticker]
}>()

const { t } = useI18n()

const form = reactive({
  name: props.sticker?.name ?? '',
  slug: props.sticker?.slug ?? '',
  size: props.sticker?.size ?? 0,
  mode: props.sticker?.mode ?? 0,
})

const imageId = ref<string | null>(props.sticker?.image?.id ?? null)
const submitting = ref(false)
const imagePickerOpen = ref(false)

const imageUrl = computed(() => getFileUrl(imageId.value))

function pickImage() {
  imagePickerOpen.value = true
}

function onImageSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    imageId.value = file.id
  }
}

async function handleSubmit() {
  if (!imageId.value && !props.sticker) return
  submitting.value = true
  try {
    let result: SnSticker
    if (props.sticker) {
      result = await updateSticker(props.packId, props.sticker.id, {
        name: form.name || null,
        slug: form.slug,
        imageId: imageId.value ?? undefined,
        size: form.size,
        mode: form.mode,
      })
    } else {
      result = await createSticker(props.packId, {
        name: form.name || undefined,
        slug: form.slug,
        imageId: imageId.value!,
        size: form.size,
        mode: form.mode,
      })
    }
    emit('saved', result)
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}
</script>
