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

      <div v-if="!isHydrated || isLoadingProduct" class="space-y-3" aria-busy="true" :aria-label="t('common.loading')">
        <div class="skeleton h-48 w-full rounded-box" />
        <div class="skeleton h-12 w-full rounded-box" />
      </div>

      <template v-else-if="product">
        <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="font-semibold">{{ t('developer.apps.distribution.releases') }}</h2>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.hints.releases') }}</p>
              <p v-if="selectedChannel" class="mt-1 font-mono text-xs text-base-content/50">{{ selectedChannel.name }}</p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div class="flex min-w-0 items-center gap-2">
                <select
                  v-model="selectedChannelId"
                  class="select select-sm min-w-0 flex-1 sm:flex-none"
                  :aria-label="t('developer.apps.distribution.selectChannel')"
                >
                  <option value="" disabled>{{ t('developer.apps.distribution.selectChannel') }}</option>
                  <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                    {{ localizedDistributionText(channel.displayNames, channel.displayName || channel.name, localizationLocales) }}
                  </option>
                </select>
                <button
                  v-if="selectedChannel"
                  class="btn btn-ghost btn-xs h-7 min-h-7 w-7 shrink-0 px-0"
                  type="button"
                  :title="t('developer.apps.distribution.copyChannelId')"
                  :aria-label="t('developer.apps.distribution.copyChannelId')"
                  @click="copyIdentifier(selectedChannel.id)"
                >
                  <IconCopy class="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                class="btn btn-primary btn-sm shrink-0"
                type="button"
                :disabled="!channels.length"
                @click="openCreateRelease"
              >
                <IconPlus class="h-4 w-4" />
                {{ t('developer.apps.distribution.createRelease') }}
              </button>
            </div>
          </div>

          <div v-if="isLoadingReleases" class="mt-5 space-y-3" aria-busy="true" :aria-label="t('common.loading')">
            <div class="skeleton h-40 w-full rounded-box" />
            <div class="skeleton h-12 w-full rounded-box" />
          </div>
          <div v-else-if="selectedChannel" class="mt-5">
            <div v-if="featuredRelease" class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">{{ t('developer.apps.distribution.latestRelease') }}</span>
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="releaseStatusClass(featuredRelease.status)">{{ featuredRelease.status }}</span>
                    <span v-if="isReleaseExpired(featuredRelease)" class="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">{{ t('developer.apps.distribution.expired') }}</span>
                  </div>
                  <div v-if="featuredRelease.title || Object.keys(featuredRelease.titles || {}).length" class="mt-2 font-medium">
                    {{ localizedDistributionText(featuredRelease.titles, featuredRelease.title || '', localizationLocales) }}
                  </div>
                  <div class="mt-1 font-mono text-sm">{{ featuredRelease.version }}</div>
                  <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/55">
                    <span v-if="featuredRelease.publishedAt">{{ t('developer.apps.distribution.publishedAt') }} {{ formatRelativeTime(featuredRelease.publishedAt) }}</span>
                    <span v-else-if="featuredRelease.createdAt">{{ t('developer.apps.distribution.createdAt') }} {{ formatRelativeTime(featuredRelease.createdAt) }}</span>
                    <span>{{ featuredRelease.artifacts.length }} {{ t('developer.apps.distribution.artifactCount') }}</span>
                    <span v-if="featuredRelease.downloadCount != null" class="inline-flex items-center gap-1">
                      <IconDownload class="h-3.5 w-3.5" />
                      {{ featuredRelease.downloadCount }} {{ t('developer.apps.distribution.downloads') }}
                    </span>
                  </div>
                  <button
                    class="btn btn-ghost btn-xs mt-2 h-7 min-h-7 w-7 px-0"
                    type="button"
                    :title="t('developer.apps.distribution.copyReleaseId')"
                    :aria-label="t('developer.apps.distribution.copyReleaseId')"
                    @click="copyIdentifier(featuredRelease.id)"
                  >
                    <IconCopy class="h-3.5 w-3.5" />
                  </button>
                </div>
                <div v-if="featuredRelease.status !== 'yanked'" class="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-start">
                  <button class="btn btn-ghost btn-xs" type="button" @click="openReleaseEditor(featuredRelease)">
                    <IconPencil class="h-3.5 w-3.5" />
                    <span class="sr-only">{{ t('developer.apps.distribution.editRelease') }}</span>
                  </button>
                  <button
                    v-if="featuredRelease.status === 'draft'"
                    class="btn btn-ghost btn-xs text-error"
                    type="button"
                    :disabled="deletingReleaseId === featuredRelease.id"
                    @click="deleteRelease(featuredRelease)"
                  >
                    <span v-if="deletingReleaseId === featuredRelease.id" class="loading loading-spinner loading-xs" />
                    <IconTrash v-else class="h-3.5 w-3.5" />
                    <span class="sr-only">{{ t('developer.apps.distribution.deleteRelease') }}</span>
                  </button>
                  <button
                    v-if="featuredRelease.status === 'published'"
                    class="btn btn-ghost btn-xs text-error"
                    type="button"
                    :disabled="yankingId === featuredRelease.id"
                    @click="yankRelease(featuredRelease)"
                  >
                    <span v-if="yankingId === featuredRelease.id" class="loading loading-spinner loading-xs" />
                    <IconBan v-else class="h-3.5 w-3.5" />
                    <span class="sr-only">{{ t('developer.apps.distribution.yankRelease') }}</span>
                  </button>
                  <button
                    v-if="featuredRelease.status === 'draft'"
                    class="btn btn-outline btn-xs"
                    :disabled="publishingId === featuredRelease.id || deletingReleaseId === featuredRelease.id || !featuredRelease.artifacts.length"
                    @click="publishRelease(featuredRelease.id)"
                  >
                    <span v-if="publishingId === featuredRelease.id" class="loading loading-spinner loading-xs" />
                    {{ t('developer.apps.distribution.publish') }}
                  </button>
                </div>
              </div>

              <div class="mt-4 border-t border-base-300 pt-4">
                <h3 class="text-sm font-medium">{{ t('developer.apps.distribution.artifacts') }}</h3>
                <div v-if="featuredRelease.artifacts.length" class="mt-3 space-y-2">
                  <div
                    v-for="artifact in featuredRelease.artifacts"
                    :key="artifact.id || `${artifact.platform}-${artifact.architecture}`"
                    class="flex flex-col gap-3 rounded-box border border-base-300 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex min-w-0 items-center gap-2">
                        <span class="truncate font-mono text-sm" :title="artifact.fileName || artifact.objectKey || `${artifact.platform}-${artifact.architecture}`">{{ artifact.fileName || artifact.objectKey || `${artifact.platform}-${artifact.architecture}` }}</span>
                        <span v-if="artifact.expired" class="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">{{ t('developer.apps.distribution.expired') }}</span>
                      </div>
                      <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/55">
                        <span>{{ artifact.platform }} / {{ artifact.architecture }}</span>
                        <span v-if="artifact.size != null">{{ formatBytes(artifact.size) }}</span>
                        <span v-if="artifact.downloadCount != null" class="inline-flex items-center gap-1">
                          <IconDownload class="h-3 w-3" />
                          {{ artifact.downloadCount }}
                        </span>
                      </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <button
                        v-if="artifact.hash"
                        class="btn btn-ghost btn-xs h-7 min-h-7 w-7 px-0"
                        type="button"
                        :title="t('developer.apps.distribution.copyHash')"
                        :aria-label="t('developer.apps.distribution.copyHash')"
                        @click="copyIdentifier(artifact.hash)"
                      >
                        <IconCopy class="h-3.5 w-3.5" />
                      </button>
                      <a
                        v-if="artifact.downloadUrl && !artifact.expired"
                        class="btn btn-outline btn-xs h-7 min-h-7 w-7 px-0"
                        :href="distributionDownloadUrl(artifact.downloadUrl)"
                        :title="t('developer.apps.distribution.download')"
                        :aria-label="t('developer.apps.distribution.download')"
                        target="_blank"
                        rel="noopener"
                      >
                        <IconDownload class="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-base-content/60">
                  {{ t('developer.apps.distribution.noArtifacts') }}
                </p>
              </div>

              <div v-if="featuredRelease.releaseNotes || Object.keys(featuredRelease.descriptions || {}).length" class="mt-4 border-t border-base-300 pt-4">
                <h3 class="text-sm font-medium">{{ t('developer.apps.distribution.releaseNotes') }}</h3>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-base-content/70">{{ localizedDistributionText(featuredRelease.descriptions, featuredRelease.releaseNotes, localizationLocales) }}</p>
              </div>
            </div>
            <p v-else class="py-5 text-sm text-base-content/60">
              {{ t('developer.apps.distribution.noReleases') }}
            </p>
            <div v-if="releases.length" class="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                v-if="featuredRelease && featuredRelease.id !== releases[0]?.id"
                class="btn btn-ghost btn-xs"
                type="button"
                @click="selectLatestRelease()"
              >
                <IconArrowLeft class="h-3.5 w-3.5" />
                {{ t('developer.apps.distribution.backToLatest') }}
              </button>
              <span v-else />
              <button
                v-if="releases.length > 1"
                class="btn btn-outline btn-sm"
                type="button"
                @click="releasesDrawerOpen = true"
              >
                <IconList class="h-4 w-4" />
                {{ t('developer.apps.distribution.viewAllReleases', { count: releases.length }) }}
              </button>
            </div>
          </div>
          <p v-else class="mt-5 border border-base-300 p-5 rounded-box text-sm text-base-content/60">
            {{ t('developer.apps.distribution.selectChannel') }}
          </p>
        </section>
      </template>
    </div>

    <AdminDrawer
      :open="releaseDrawerOpen"
      :title="editingReleaseId ? t('developer.apps.distribution.editRelease') : t('developer.apps.distribution.createRelease')"
      content-class="!w-full !max-w-none sm:!w-[65vw]"
      @update:open="releaseDrawerOpen = $event"
    >
      <form class="space-y-5" @submit.prevent="saveRelease">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('developer.apps.distribution.version') }}</legend>
          <input
            v-model="releaseForm.version"
            type="text"
            class="input w-full"
            placeholder="1.0.0"
            required
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('developer.apps.distribution.channels') }}</legend>
          <div class="grid gap-2 sm:grid-cols-2">
            <label
              v-for="channel in channels"
              :key="channel.id"
              class="flex cursor-pointer items-start gap-3 border border-base-300 p-3 rounded-box"
            >
              <input
                v-model="releaseChannels"
                class="checkbox checkbox-sm mt-0.5"
                type="checkbox"
                :value="channel.name"
              />
              <span class="min-w-0">
                <span class="block font-medium">{{ localizedDistributionText(channel.displayNames, channel.displayName || channel.name, localizationLocales) }}</span>
                <span class="block font-mono text-xs text-base-content/55">{{ channel.name }}</span>
              </span>
            </label>
          </div>
        </fieldset>
        <div class="space-y-4">
          <div class="flex flex-col gap-3 border border-base-300 bg-base-100 p-4 rounded-box sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="font-medium">{{ t('developer.apps.distribution.localizedMetadata') }}</h2>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.localizationRequired') }}</p>
            </div>
            <div class="flex gap-2">
              <select v-model="newReleaseLanguage" class="select select-sm" :aria-label="t('developer.apps.distribution.selectLanguage')">
                <option value="">{{ t('developer.apps.distribution.selectLanguage') }}</option>
                <option v-for="option in availableReleaseLocaleOptions" :key="option.code" :value="option.code">
                  {{ option.name }}
                </option>
              </select>
              <button class="btn btn-outline btn-sm" type="button" :disabled="!newReleaseLanguage" @click="addReleaseLocalization">
                <IconPlus class="h-4 w-4" />
                {{ t('developer.apps.distribution.addLanguage') }}
              </button>
            </div>
          </div>
          <div
            v-for="(entry, index) in releaseForm.localizations"
            :key="entry.id"
            class="grid gap-4 border border-base-300 p-4 rounded-box"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.releaseTitle') }}</legend>
              <input
                v-model="entry.title"
                type="text"
                class="input w-full"
                :placeholder="t('developer.apps.distribution.releaseTitle')"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.releaseNotes') }}</legend>
              <div class="flex gap-2">
                <select v-model="entry.locale" class="select w-32" :aria-label="t('developer.apps.distribution.selectLanguage')">
                  <option v-for="option in releaseLocaleOptionsFor(index)" :key="option.code" :value="option.code">
                    {{ option.name }}
                  </option>
                </select>
                <textarea
                  v-model="entry.description"
                  class="textarea min-h-24 w-full"
                  :placeholder="t('developer.apps.distribution.releaseNotes')"
                  rows="3"
                />
              </div>
            </fieldset>
            <button
              v-if="releaseForm.localizations.length > 1"
              class="btn btn-ghost btn-sm justify-self-start text-error"
              type="button"
              @click="removeReleaseLocalization(index)"
            >
              {{ t('common.remove') }} {{ localeName(entry.locale) }}
            </button>
          </div>
        </div>
        <div class="space-y-4 border border-base-300 bg-base-100 p-4 rounded-box">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-medium">{{ t('developer.apps.distribution.releaseAttachments') }}</h2>
              <p class="mt-1 text-xs text-base-content/55">{{ t('developer.apps.distribution.releaseAttachmentsHint') }}</p>
            </div>
            <button class="btn btn-outline btn-sm" type="button" @click="pickReleaseAttachments">
              <IconPlus class="h-4 w-4" />
              {{ t('developer.apps.distribution.chooseFiles') }}
            </button>
          </div>
          <div v-if="releaseForm.attachments.length" class="space-y-2">
            <div
              v-for="(attachment, index) in releaseForm.attachments"
              :key="attachment.id || attachment.url || index"
              class="flex items-center justify-between gap-3 border border-base-300 p-3 rounded-box"
            >
              <div class="flex min-w-0 items-center gap-3">
                <FileImage
                  v-if="attachment.mimeType?.startsWith('image/') && getFileUrl(attachment.id)"
                  :src="getFileUrl(attachment.id) ?? ''"
                  class="h-10 w-10 shrink-0 rounded-box object-cover"
                  alt=""
                />
                <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-box bg-base-200 text-base-content/40">
                  <IconImage class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ attachment.name || attachment.id || attachment.url }}</p>
                  <p v-if="attachment.mimeType || attachment.size != null" class="font-mono text-xs text-base-content/55">
                    {{ [attachment.mimeType, attachment.size != null ? formatBytes(attachment.size) : ''].filter(Boolean).join(' · ') }}
                  </p>
                </div>
              </div>
              <button
                class="btn btn-ghost btn-sm text-error"
                type="button"
                :title="t('common.remove')"
                @click="removeReleaseAttachment(index)"
              >
                {{ t('common.remove') }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="editingReleaseId" class="space-y-4 border border-base-300 bg-base-100 p-4 rounded-box">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-medium">{{ t('developer.apps.distribution.file') }}</h2>
            <button class="btn btn-ghost btn-sm" type="button" @click="addArtifact">
              {{ t('developer.apps.distribution.addArtifact') }}
            </button>
          </div>
          <div
            v-for="(artifact, index) in releaseForm.artifacts"
            :key="artifact.id"
            class="grid gap-4 border border-base-300 p-4 rounded-box sm:grid-cols-2"
          >
            <fieldset class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.file') }}</legend>
              <input
                class="file-input w-full"
                type="file"
                :required="!artifact.isExisting && !artifact.downloadUrl"
                :disabled="Boolean(artifact.isExisting || artifact.downloadUrl)"
                @change="selectArtifactFile(index, $event)"
              />
            </fieldset>
            <fieldset class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.externalUrl') }}</legend>
              <input
                v-model="artifact.downloadUrl"
                type="url"
                class="input w-full"
                :placeholder="t('developer.apps.distribution.externalUrlPlaceholder')"
                :disabled="Boolean(artifact.isExisting)"
              />
              <p class="text-xs text-base-content/55">{{ t('developer.apps.distribution.externalUrlHint') }}</p>
            </fieldset>
            <div v-if="artifact.isExisting || artifact.downloadUrl" class="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.distribution.fileName') }}</legend>
                <input
                  v-model="artifact.fileName"
                  type="text"
                  class="input w-full"
                  :required="Boolean(artifact.downloadUrl)"
                  :disabled="Boolean(artifact.isExisting)"
                />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.distribution.mimeType') }}</legend>
                <input
                  v-model="artifact.mimeType"
                  type="text"
                  class="input w-full"
                  placeholder="application/gzip"
                  :required="Boolean(artifact.downloadUrl)"
                  :disabled="Boolean(artifact.isExisting)"
                />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.distribution.size') }}</legend>
                <input
                  v-model="artifact.size"
                  type="number"
                  min="0"
                  step="1"
                  class="input w-full"
                  :required="Boolean(artifact.downloadUrl)"
                  :disabled="Boolean(artifact.isExisting)"
                />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.distribution.hash') }}</legend>
                <input
                  v-model="artifact.hash"
                  type="text"
                  class="input w-full font-mono text-sm"
                  :required="Boolean(artifact.downloadUrl)"
                  :disabled="Boolean(artifact.isExisting)"
                />
              </fieldset>
            </div>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.platform') }}</legend>
              <input
                v-model="artifact.platform"
                type="text"
                class="input w-full"
                placeholder="macos"
                required
                :disabled="Boolean(artifact.isExisting)"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.architecture') }}</legend>
              <input
                v-model="artifact.architecture"
                type="text"
                class="input w-full"
                placeholder="arm64"
                required
                :disabled="Boolean(artifact.isExisting)"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.artifactSlug') }}</legend>
              <input
                v-model="artifact.slug"
                type="text"
                class="input w-full"
                :placeholder="t('developer.apps.distribution.artifactSlug')"
                :disabled="Boolean(artifact.isExisting)"
              />
            </fieldset>
            <fieldset class="fieldset sm:col-span-2">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.artifactMeta') }}</legend>
              <textarea
                v-model="artifact.meta"
                class="textarea min-h-24 w-full font-mono text-sm"
                :placeholder="t('developer.apps.distribution.artifactMetaPlaceholder')"
                :disabled="Boolean(artifact.isExisting)"
                rows="3"
              />
              <p class="text-xs text-base-content/55">{{ t('developer.apps.distribution.artifactMetaHint') }}</p>
            </fieldset>
            <button
              v-if="releaseForm.artifacts.length > 1"
              class="btn btn-ghost btn-sm text-error"
              type="button"
              @click="removeArtifact(index)"
            >
              {{ t('developer.apps.distribution.removeArtifact') }}
            </button>
          </div>
        </div>
        <div class="space-y-4 border border-base-300 bg-base-100 p-4 rounded-box">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-medium">{{ t('developer.apps.distribution.releaseMetadata') }}</h2>
              <p class="mt-1 text-xs text-base-content/55">{{ t('developer.apps.distribution.releaseMetadataHint') }}</p>
            </div>
            <button class="btn btn-ghost btn-sm" type="button" @click="addReleaseMetadata">
              <IconPlus class="h-4 w-4" />
              {{ t('developer.apps.distribution.addMetadata') }}
            </button>
          </div>
          <div v-if="releaseForm.metadataEntries.length" class="space-y-2">
            <div
              v-for="(entry, index) in releaseForm.metadataEntries"
              :key="entry.id"
              class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <input
                v-model="entry.key"
                class="input w-full font-mono text-sm"
                type="text"
                :placeholder="t('developer.apps.distribution.metadataKey')"
                :aria-label="t('developer.apps.distribution.metadataKey')"
              />
              <input
                v-model="entry.value"
                class="input w-full font-mono text-sm"
                type="text"
                :placeholder="t('developer.apps.distribution.metadataValue')"
                :aria-label="t('developer.apps.distribution.metadataValue')"
              />
              <button
                class="btn btn-ghost btn-sm text-error"
                type="button"
                :aria-label="t('developer.apps.distribution.removeMetadata')"
                @click="removeReleaseMetadata(index)"
              >
                {{ t('common.remove') }}
              </button>
            </div>
          </div>
          <label class="flex items-start gap-3 border border-base-300 p-4 rounded-box">
            <input v-model="releaseForm.forceUpdate" class="checkbox checkbox-sm mt-0.5" type="checkbox" />
            <span>
              <span class="font-medium">{{ t('developer.apps.distribution.forceUpdate') }}</span>
              <span class="mt-1 block text-xs text-base-content/55">{{ t('developer.apps.distribution.forceUpdateHint') }}</span>
            </span>
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-4">
          <button class="btn btn-ghost" type="button" @click="releaseDrawerOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" type="submit" :disabled="isSavingRelease">
            <span v-if="isSavingRelease" class="loading loading-spinner loading-sm" />
            {{ editingReleaseId ? t('common.save') : t('common.create') }}
          </button>
        </div>
      </form>
    </AdminDrawer>

    <AdminDrawer
      :open="releasesDrawerOpen"
      :title="t('developer.apps.distribution.allReleases')"
      content-class="!w-full !max-w-none sm:!w-[30rem]"
      @update:open="releasesDrawerOpen = $event"
    >
      <div class="space-y-2">
        <button
          v-for="release in releases"
          :key="release.id"
          class="w-full rounded-box border p-3 text-left transition-colors hover:border-primary/50"
          :class="[featuredRelease?.id === release.id ? 'border-primary/60 bg-primary/5' : 'border-base-300 bg-base-100']"
          type="button"
          @click="selectFeaturedRelease(release)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-sm">{{ release.version }}</span>
            <span class="flex shrink-0 items-center gap-1.5">
              <span v-if="isReleaseExpired(release)" class="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">{{ t('developer.apps.distribution.expired') }}</span>
              <span class="rounded-full px-2 py-0.5 text-[11px] font-medium" :class="releaseStatusClass(release.status)">{{ release.status }}</span>
            </span>
          </div>
          <div v-if="release.title || Object.keys(release.titles || {}).length" class="mt-1 truncate text-xs text-base-content/60">
            {{ localizedDistributionText(release.titles, release.title || '', localizationLocales) }}
          </div>
          <p v-if="release.releaseNotes || Object.keys(release.descriptions || {}).length" class="mt-1 line-clamp-2 text-xs leading-5 text-base-content/55">
            {{ localizedDistributionText(release.descriptions, release.releaseNotes, localizationLocales) }}
          </p>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-base-content/50">
            <span v-if="release.publishedAt">{{ formatRelativeTime(release.publishedAt) }}</span>
            <span v-else-if="release.createdAt">{{ t('developer.apps.distribution.createdAt') }} {{ formatRelativeTime(release.createdAt) }}</span>
            <span>{{ release.artifacts.length }} {{ t('developer.apps.distribution.artifactCount') }}</span>
            <span v-if="release.downloadCount != null">{{ release.downloadCount }} {{ t('developer.apps.distribution.downloads') }}</span>
          </div>
        </button>
      </div>
    </AdminDrawer>

    <CloudFileDrawer
      v-model:open="releaseAttachmentsPickerOpen"
      :allowed-types="['image', 'file']"
      :allow-multiple="true"
      usage="distribution.release.attachments"
      @select="onReleaseAttachmentsSelected"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconBan, IconCopy, IconDownload, IconImage, IconList, IconPencil, IconPlus, IconTrash } from '#components'
import { computed, reactive, ref, watch } from 'vue'
import type { DistributionRelease } from '~/types/distribution'
import type { SnCloudFile } from '~/types/drive'
import { distributionDownloadUrl, localizedDistributionText } from '~/utils/distribution'
import { formatRelativeTime } from '~/utils/datetime'
import { getFileUrl } from '~/utils/files'
import {
  cloudFileReference,
  emptyReleaseForm,
  formatBytes,
  isReleaseExpired,
  newArtifact,
  newReleaseLocalization,
  newReleaseMetadataEntry,
  releaseArtifactEntries,
  releaseMetadataEntries,
  releaseStatusClass,
} from '~/composables/useDistributionProduct'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const toast = useAppToast()
const route = useRoute()
const developer = useDeveloper()

const pubName = computed(() => route.params.pubName as string)
const slug = computed(() => route.params.slug as string)
const publisherName = computed(() => developer.currentDeveloper.value?.publisher?.name || pubName.value)

const {
  product,
  isLoadingProduct,
  isHydrated,
  channels,
  selectedChannel,
  releases,
  isLoadingReleases,
  isSavingRelease,
  publishingId,
  deletingReleaseId,
  yankingId,
  localizationLocales,
  contentLocale,
  localeName,
  localeOptionsFor,
  availableLocaleOptions,
  releaseLocalizationEntries,
  selectChannel,
  saveRelease: persistRelease,
  publishRelease,
  deleteRelease,
  yankRelease,
  copyIdentifier,
  loadProduct,
  loadChannels,
  loadReleases,
} = useDistributionProduct(pubName, slug, 'developer.apps.distribution.tabs.releases')

const featuredRelease = ref<DistributionRelease | null>(null)
const releaseForm = reactive(emptyReleaseForm(contentLocale.value))
const releaseChannels = ref<string[]>([])
const newReleaseLanguage = ref('')
const releaseDrawerOpen = ref(false)
const editingReleaseId = ref<string | null>(null)
const releasesDrawerOpen = ref(false)
const releaseAttachmentsPickerOpen = ref(false)

const selectedChannelId = computed({
  get: () => selectedChannel.value?.id ?? '',
  set: (id: string) => {
    const channel = channels.value.find((item) => item.id === id) || null
    void selectChannel(channel)
  },
})

const availableReleaseLocaleOptions = computed(() => availableLocaleOptions(releaseForm.localizations))

watch(
  releases,
  () => {
    const current = featuredRelease.value
    featuredRelease.value = current
      ? releases.value.find((item) => item.id === current.id) || releases.value[0] || null
      : releases.value[0] || null
  },
  { immediate: true },
)

async function reload() {
  await loadProduct()
  await loadChannels()
  await loadReleases()
}

function selectFeaturedRelease(release: DistributionRelease) {
  featuredRelease.value = release
  releasesDrawerOpen.value = false
}

function selectLatestRelease() {
  const latest = releases.value[0]
  if (latest) selectFeaturedRelease(latest)
}

function releaseLocaleOptionsFor(index: number) {
  return localeOptionsFor(releaseForm.localizations, index)
}

function addReleaseLocalization() {
  if (!newReleaseLanguage.value || releaseForm.localizations.some((entry) => entry.locale === newReleaseLanguage.value)) return
  releaseForm.localizations.push(newReleaseLocalization(newReleaseLanguage.value))
  newReleaseLanguage.value = ''
}

function removeReleaseLocalization(index: number) {
  if (releaseForm.localizations.length > 1) releaseForm.localizations.splice(index, 1)
}

function addReleaseMetadata() {
  releaseForm.metadataEntries.push(newReleaseMetadataEntry())
}

function removeReleaseMetadata(index: number) {
  releaseForm.metadataEntries.splice(index, 1)
}

function pickReleaseAttachments() {
  releaseAttachmentsPickerOpen.value = true
}

function onReleaseAttachmentsSelected(files: SnCloudFile | SnCloudFile[] | null) {
  if (!files) return
  releaseForm.attachments = (Array.isArray(files) ? files : [files]).map(cloudFileReference)
}

function removeReleaseAttachment(index: number) {
  releaseForm.attachments.splice(index, 1)
}

function addArtifact() {
  releaseForm.artifacts.push(newArtifact())
}

function removeArtifact(index: number) {
  releaseForm.artifacts.splice(index, 1)
}

function selectArtifactFile(index: number, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  const artifact = releaseForm.artifacts[index]
  if (!file || !artifact) return
  artifact.file = file
  artifact.isExisting = false
  artifact.objectKey = undefined
  artifact.downloadUrl = ''
}

function openCreateRelease() {
  editingReleaseId.value = null
  releaseChannels.value = selectedChannel.value ? [selectedChannel.value.name] : []
  Object.assign(releaseForm, emptyReleaseForm(contentLocale.value))
  newReleaseLanguage.value = ''
  releaseDrawerOpen.value = true
}

function openReleaseEditor(release: DistributionRelease) {
  if (release.status === 'yanked') return
  editingReleaseId.value = release.id
  releaseChannels.value = release.channels.length
    ? [...release.channels]
    : selectedChannel.value ? [selectedChannel.value.name] : []
  releaseForm.version = release.version
  releaseForm.localizations = releaseLocalizationEntries(
    release.titles,
    release.descriptions,
    release.title || release.version,
    release.releaseNotes,
  )
  releaseForm.metadataEntries = releaseMetadataEntries(release.metadata)
  releaseForm.forceUpdate = release.forceUpdate === true
  releaseForm.artifacts = releaseArtifactEntries(release.artifacts || [])
  releaseForm.attachments = release.attachments ? [...release.attachments] : []
  newReleaseLanguage.value = ''
  releaseDrawerOpen.value = true
}

async function saveRelease() {
  if (!product.value || !releaseChannels.value.length) return
  if (!releaseForm.localizations.some((entry) => entry.title.trim())) {
    toast.error(t('developer.apps.distribution.releaseTitleRequired'))
    return
  }
  const saved = await persistRelease({
    editingId: editingReleaseId.value,
    channels: releaseChannels.value,
    form: releaseForm,
  })
  if (!saved) return
  Object.assign(releaseForm, emptyReleaseForm(contentLocale.value))
  releaseChannels.value = []
  newReleaseLanguage.value = ''
  editingReleaseId.value = null
  releaseDrawerOpen.value = false
}
</script>
