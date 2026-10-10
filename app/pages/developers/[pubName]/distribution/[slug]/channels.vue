<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-7xl space-y-5">
      <DistributionProductHeader
        :product="product"
        :publisher-name="publisherName"
        :product-slug="slug"
        :refreshing="isLoadingProduct"
        @refresh="reload"
      />

      <div v-if="!isHydrated || isLoadingProduct || isLoadingChannels" class="space-y-3" aria-busy="true" :aria-label="t('common.loading')">
        <div class="skeleton h-64 w-full rounded-box" />
      </div>

      <template v-else-if="product">
        <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">{{ t('developer.apps.distribution.channels') }}</h2>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.hints.channels') }}</p>
            </div>
            <button class="btn btn-outline btn-sm shrink-0" type="button" @click="openCreateChannel">
              <IconPlus class="h-4 w-4" />
              {{ t('developer.apps.distribution.createChannel') }}
            </button>
          </div>

          <div v-if="channels.length" class="mt-5 space-y-2">
            <div
              v-for="channel in channels"
              :key="channel.id"
              class="flex items-start justify-between gap-3 border border-base-300 p-3 rounded-box transition-colors hover:border-primary/50"
              :class="selectedChannel?.id === channel.id ? 'border-primary/60 bg-primary/5' : ''"
            >
              <div class="min-w-0 flex-1">
                <button
                  class="w-full text-left"
                  :class="selectedChannel?.id === channel.id ? 'text-primary' : 'hover:text-primary'"
                  type="button"
                  @click="selectChannel(channel)"
                >
                  <span class="block font-medium">{{ localizedDistributionText(channel.displayNames, channel.displayName || channel.name, localizationLocales) }}</span>
                  <span class="mt-1 block font-mono text-xs text-base-content/50">{{ channel.name }}</span>
                  <span
                    v-if="channel.artifactRetention != null"
                    class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current" />
                    {{ channelRetentionLabel(channel) }}
                  </span>
                </button>
              </div>
              <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  class="btn btn-ghost btn-xs h-7 min-h-7 w-7 px-0"
                  type="button"
                  :title="t('developer.apps.distribution.copyChannelId')"
                  :aria-label="t('developer.apps.distribution.copyChannelId')"
                  @click.stop="copyIdentifier(channel.id)"
                >
                  <IconCopy class="h-3.5 w-3.5" />
                </button>
                <button class="btn btn-ghost btn-xs" type="button" @click.stop="openChannelEditor(channel)">
                  <IconPencil class="h-3.5 w-3.5" />
                  <span class="sr-only">{{ t('developer.apps.distribution.editChannel') }}</span>
                </button>
                <button
                  v-if="!isBuiltinChannelName(channel.name)"
                  class="btn btn-ghost btn-xs text-error"
                  type="button"
                  :disabled="deletingChannelId === channel.id"
                  @click.stop="deleteChannel(channel)"
                >
                  <span v-if="deletingChannelId === channel.id" class="loading loading-spinner loading-xs" />
                  <IconTrash v-else class="h-3.5 w-3.5" />
                  <span class="sr-only">{{ t('developer.apps.distribution.deleteChannel') }}</span>
                </button>
              </div>
            </div>
          </div>
          <p v-else class="mt-5 border border-base-300 p-5 rounded-box text-sm text-base-content/60">
            {{ t('developer.apps.distribution.noChannels') }}
          </p>
        </section>
      </template>

      <AdminDrawer
        :open="channelDrawerOpen"
        :title="editingChannelId ? t('developer.apps.distribution.editChannel') : t('developer.apps.distribution.createChannel')"
        content-class="!w-full !max-w-none sm:!w-[65vw]"
        @update:open="channelDrawerOpen = $event"
      >
        <form class="space-y-5" @submit.prevent="saveChannel">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('developer.apps.distribution.channelName') }}</legend>
            <input
              v-model="channelForm.name"
              type="text"
              class="input w-full"
              :placeholder="t('developer.apps.distribution.channelName')"
              required
              :disabled="Boolean(editingChannelId)"
            />
          </fieldset>
          <fieldset class="rounded-box border border-primary/20 bg-primary/[0.04] p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <legend class="fieldset-legend p-0">{{ t('developer.apps.distribution.retentionLabel') }}</legend>
                <p class="mt-1 max-w-xl text-xs leading-5 text-base-content/60">{{ t('developer.apps.distribution.retentionHint') }}</p>
              </div>
              <label class="flex shrink-0 items-center gap-2 text-sm">
                <input v-model="channelForm.usePlatformDefault" class="checkbox checkbox-sm" type="checkbox" />
                <span>{{ t('developer.apps.distribution.retentionUseDefault') }}</span>
              </label>
            </div>
            <div class="mt-3 flex items-center gap-3">
              <input
                v-model.number="channelForm.artifactRetention"
                class="input w-full max-w-48 font-mono"
                type="number"
                min="0"
                step="1"
                :disabled="channelForm.usePlatformDefault"
                :aria-label="t('developer.apps.distribution.retentionLabel')"
              />
              <span class="shrink-0 text-xs text-base-content/55">{{ t('developer.apps.distribution.retentionReleasesUnit') }}</span>
            </div>
          </fieldset>
          <div class="space-y-4">
            <div class="flex flex-col gap-3 border border-base-300 bg-base-100 p-4 rounded-box sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 class="font-medium">{{ t('developer.apps.distribution.localizedMetadata') }}</h2>
                <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.localizationRequired') }}</p>
              </div>
              <div class="flex gap-2">
                <select v-model="newChannelLanguage" class="select select-sm" :aria-label="t('developer.apps.distribution.selectLanguage')">
                  <option value="">{{ t('developer.apps.distribution.selectLanguage') }}</option>
                  <option v-for="option in availableChannelLocaleOptions" :key="option.code" :value="option.code">
                    {{ option.name }}
                  </option>
                </select>
                <button class="btn btn-outline btn-sm" type="button" :disabled="!newChannelLanguage" @click="addChannelLocalization">
                  <IconPlus class="h-4 w-4" />
                  {{ t('developer.apps.distribution.addLanguage') }}
                </button>
              </div>
            </div>
            <div
              v-for="(entry, index) in channelForm.localizations"
              :key="entry.id"
              class="grid gap-4 border border-base-300 p-4 rounded-box sm:grid-cols-2"
            >
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.distribution.channelDisplayName') }}</legend>
                <div class="flex gap-2">
                  <select v-model="entry.locale" class="select w-32" :aria-label="t('developer.apps.distribution.selectLanguage')">
                    <option v-for="option in channelLocaleOptionsFor(index)" :key="option.code" :value="option.code">
                      {{ option.name }}
                    </option>
                  </select>
                  <input v-model="entry.displayName" type="text" class="input w-full" :placeholder="t('developer.apps.distribution.channelDisplayName')" required />
                </div>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.distribution.channelDescription') }}</legend>
                <textarea
                  v-model="entry.description"
                  class="textarea min-h-24 w-full"
                  :placeholder="t('developer.apps.distribution.channelDescription')"
                  rows="2"
                />
              </fieldset>
              <button
                v-if="channelForm.localizations.length > 1"
                class="btn btn-ghost btn-sm justify-self-start text-error sm:col-span-2"
                type="button"
                @click="removeChannelLocalization(index)"
              >
                {{ t('common.remove') }} {{ localeName(entry.locale) }}
              </button>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-4">
            <button class="btn btn-ghost" type="button" @click="channelDrawerOpen = false">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="isSavingChannel">
              <span v-if="isSavingChannel" class="loading loading-spinner loading-sm" />
              {{ editingChannelId ? t('common.save') : t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconCopy, IconPencil, IconPlus, IconTrash } from '#components'
import { emptyChannelForm, isBuiltinChannelName, newChannelLocalization } from '~/composables/useDistributionProduct'
import type { DistributionChannel } from '~/types/distribution'
import { localizedDistributionText } from '~/utils/distribution'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const developer = useDeveloper()

const pubName = computed(() => route.params.pubName as string)
const slug = computed(() => route.params.slug as string)
const publisherName = computed(() => developer.currentDeveloper.value?.publisher?.name || pubName.value)

const {
  product,
  isLoadingProduct,
  isHydrated,
  contentLocale,
  localeName,
  localeOptionsFor,
  availableLocaleOptions,
  channelLocalizationEntries,
  channels,
  selectedChannel,
  isLoadingChannels,
  isSavingChannel,
  deletingChannelId,
  localizationLocales,
  channelRetentionLabel,
  selectChannel,
  deleteChannel,
  saveChannel: persistChannel,
  copyIdentifier,
  loadProduct,
  loadChannels,
} = useDistributionProduct(pubName, slug, 'developer.apps.distribution.tabs.channels')

const channelForm = reactive(emptyChannelForm(contentLocale.value))
const newChannelLanguage = ref('')
const channelDrawerOpen = ref(false)
const editingChannelId = ref<string | null>(null)

const availableChannelLocaleOptions = computed(() => availableLocaleOptions(channelForm.localizations))

function channelLocaleOptionsFor(index: number) {
  return localeOptionsFor(channelForm.localizations, index)
}

function resetChannelForm() {
  Object.assign(channelForm, emptyChannelForm(contentLocale.value))
  newChannelLanguage.value = ''
}

function openCreateChannel() {
  editingChannelId.value = null
  resetChannelForm()
  channelDrawerOpen.value = true
}

function openChannelEditor(channel: DistributionChannel) {
  editingChannelId.value = channel.id
  channelForm.name = channel.name
  channelForm.localizations = channelLocalizationEntries(
    channel.displayNames,
    channel.descriptions,
    channel.displayName || channel.name,
    channel.description,
  )
  channelForm.usePlatformDefault = channel.artifactRetention == null
  channelForm.artifactRetention = channel.artifactRetention ?? 0
  newChannelLanguage.value = ''
  channelDrawerOpen.value = true
}

function addChannelLocalization() {
  if (!newChannelLanguage.value || channelForm.localizations.some((entry) => entry.locale === newChannelLanguage.value)) return
  channelForm.localizations.push(newChannelLocalization(newChannelLanguage.value))
  newChannelLanguage.value = ''
}

function removeChannelLocalization(index: number) {
  if (channelForm.localizations.length > 1) channelForm.localizations.splice(index, 1)
}

async function saveChannel() {
  if (await persistChannel({ editingId: editingChannelId.value, form: channelForm })) {
    editingChannelId.value = null
    resetChannelForm()
    channelDrawerOpen.value = false
  }
}

async function reload() {
  await loadProduct()
  await loadChannels()
}
</script>
