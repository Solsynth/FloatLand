<template>
  <form class="portal-form" @submit.prevent="handleSubmit">
    <AdminCard
      :title="feed ? 'Edit Feed' : 'New Feed'"
      description="Import content from external RSS/Atom feeds"
      class="mb-5"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 fieldset-row">
        <!-- Title -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            Title
            <span class="text-error">*</span>
          </legend>
          <input
            v-model="form.title"
            type="text"
            class="input w-full"
            placeholder="My News Feed"
            required
          >
        </fieldset>

        <!-- URL -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t('creator.feeds.url') }}
            <span class="text-error">*</span>
          </legend>
          <input
            v-model="form.url"
            type="url"
            class="input w-full font-mono text-sm"
            placeholder="https://example.com/feed"
            required
          >
        </fieldset>
      </div>

      <!-- Description -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t('creator.collections.description') }}</legend>
        <textarea
          v-model="form.description"
          class="textarea w-full min-h-[80px] leading-relaxed"
          rows="3"
          placeholder="Describe this feed..."
        />
      </fieldset>

      <!-- Scrape toggle -->
      <div class="form-control mt-4">
        <label class="portal-setting-row cursor-pointer hover:bg-base-200 transition-colors duration-150">
          <div class="min-w-0">
            <div class="text-sm font-medium">{{ t('creator.feeds.scrapPage') }}</div>
            <div class="text-xs text-base-content/45 mt-0.5 leading-relaxed">{{ t('creator.feeds.scrapPageHint') }}</div>
          </div>
          <input v-model="form.scrapPage" type="checkbox" class="toggle toggle-primary toggle-sm shrink-0" />
        </label>
      </div>
    </AdminCard>

    <!-- Actions -->
    <div class="portal-form-actions">
      <div class="flex items-center gap-2">
        <button
          v-if="feed"
          type="button"
          class="btn btn-error btn-ghost btn-sm"
          @click="handleDelete"
        >
          <IconTrash class="w-4 h-4" />
          {{ t('creator.delete') }}
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost"
          @click="emit('close')"
        >
          {{ t('creator.cancel') }}
        </button>
        <button
          v-if="feed"
          type="button"
          class="btn btn-outline btn-sm"
          :class="{ 'loading': scraping }"
          :disabled="scraping"
          @click="handleScrap"
        >
          <IconRefreshCw class="w-4 h-4" />
          {{ t('creator.feeds.scrapNow') }}
        </button>
        <button
          type="submit"
          class="btn btn-primary min-w-[100px]"
          :class="{ 'loading': submitting }"
          :disabled="submitting"
        >
          <IconSave class="w-4 h-4" />
          {{ t('creator.save') }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { IconSave, IconTrash, IconRefreshCw } from '#components'
import type { SnWebFeed } from '~/types/creator'
import {
  createWebFeed,
  updateWebFeed,
  deleteWebFeed,
  scrapWebFeed,
} from '~/utils/creator'

const props = defineProps<{
  pubName: string
  feed?: SnWebFeed | null
}>()

const emit = defineEmits<{
  close: []
  saved: [feed: SnWebFeed]
}>()

const { t } = useI18n()
const { confirm } = useAlert()

const form = reactive({
  title: props.feed?.title ?? '',
  url: props.feed?.url ?? '',
  description: props.feed?.description ?? '',
  scrapPage: props.feed?.config?.scrapPage ?? false,
})

const submitting = ref(false)
const scraping = ref(false)

async function handleSubmit() {
  submitting.value = true
  try {
    let result: SnWebFeed
    if (props.feed) {
      result = await updateWebFeed(props.pubName, props.feed.id, {
        title: form.title,
        url: form.url,
        description: form.description,
        scrapPage: form.scrapPage,
      })
    } else {
      result = await createWebFeed(props.pubName, {
        title: form.title,
        url: form.url,
        description: form.description,
        scrapPage: form.scrapPage,
      })
    }
    emit('saved', result)
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!props.feed) return
  if (!(await confirm('Confirm', t('creator.feeds.deleteConfirm')))) return
  await deleteWebFeed(props.pubName, props.feed.id)
  emit('close')
}

async function handleScrap() {
  if (!props.feed) return
  scraping.value = true
  try {
    await scrapWebFeed(props.pubName, props.feed.id)
  } catch (e) {
    console.error(e)
  } finally {
    scraping.value = false
  }
}
</script>
