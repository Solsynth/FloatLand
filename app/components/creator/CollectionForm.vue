<template>
  <form class="portal-form" @submit.prevent="handleSubmit">
    <AdminCard
      :title="collection ? 'Edit Collection' : 'New Collection'"
      description="Organize your posts into collections"
      class="mb-5"
    >
      <!-- Slug -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ t('creator.collections.slug') }}
          <span class="text-error">*</span>
        </legend>
        <div class="join w-full">
          <span class="join-item btn btn-disabled btn-sm bg-base-200 border-base-300/60">/</span>
          <input
            v-model="form.slug"
            type="text"
            class="input join-item flex-1 min-w-0 font-mono text-sm"
            :disabled="!!collection"
            placeholder="my-collection"
            required
          >
        </div>
        <p class="fieldset-label">{{ t('creator.collections.slugHint') }}</p>
      </fieldset>

      <!-- Name -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t('creator.collections.name') }}</legend>
        <input
          v-model="form.name"
          type="text"
          class="input w-full"
          placeholder="My Collection"
        >
      </fieldset>

      <!-- Description -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t('creator.collections.description') }}</legend>
        <textarea
          v-model="form.description"
          class="textarea w-full min-h-[80px] leading-relaxed"
          rows="3"
          placeholder="Describe this collection..."
        />
      </fieldset>
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
        :disabled="submitting || !form.slug"
      >
        <IconSave class="w-4 h-4" />
        {{ collection ? t('creator.save') : t('creator.create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { IconSave } from '#components'
import type { PostCollection } from '~/types/post'
import {
  createPublisherCollection,
  updatePublisherCollection,
} from '~/utils/api'

const props = defineProps<{
  pubName: string
  collection?: PostCollection | null
}>()

const emit = defineEmits<{
  close: []
  saved: [collection: PostCollection]
}>()

const { t } = useI18n()

const form = reactive({
  slug: props.collection?.slug ?? '',
  name: props.collection?.name ?? '',
  description: props.collection?.description ?? '',
})

const submitting = ref(false)

async function handleSubmit() {
  submitting.value = true
  try {
    let result: PostCollection
    if (props.collection) {
      result = await updatePublisherCollection(props.pubName, props.collection.slug, {
        name: form.name || null,
        description: form.description || null,
      })
    } else {
      result = await createPublisherCollection(props.pubName, {
        slug: form.slug,
        name: form.name || null,
        description: form.description || null,
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
