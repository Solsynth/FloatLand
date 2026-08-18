<template>
  <section class="space-y-8">
    <div v-if="isLoading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <template v-else-if="product">
      <div class="relative overflow-hidden rounded-box border border-base-300 bg-gradient-to-br from-base-100 via-base-100 to-primary/[0.05] p-5 shadow-sm sm:p-6">
        <div class="min-w-0">
          <p class="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/75">{{ t('developer.apps.distribution.releaseControl') }}</p>
          <h1 class="mt-2 text-xl font-semibold">
            {{ localizedDistributionText(product.names, product.name, localizationLocales) }}
          </h1>
          <p class="mt-1 font-mono text-sm text-base-content/55">{{ product.slug }}</p>
          <button
            class="btn btn-ghost btn-sm mt-2 h-8 min-h-8 w-8 px-0"
            type="button"
            :title="t('developer.apps.distribution.copyAppId')"
            :aria-label="t('developer.apps.distribution.copyAppId')"
            @click="copyIdentifier(product.id)"
          >
            <IconCopy class="h-4 w-4" />
          </button>
          <p v-if="product.description || Object.keys(product.descriptions || {}).length" class="mt-3 max-w-2xl text-sm text-base-content/65">
            {{ localizedDistributionText(product.descriptions, product.description, localizationLocales) }}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap justify-end gap-2">
          <button class="btn btn-outline btn-sm" type="button" @click="openProductEditor">
            <IconPencil class="h-4 w-4" />
            {{ t('developer.apps.distribution.editProduct') }}
          </button>
          <button
            class="btn btn-ghost btn-sm text-error"
            type="button"
            :disabled="deletingProduct"
            @click="deleteProduct"
          >
            <span v-if="deletingProduct" class="loading loading-spinner loading-sm" />
            <IconTrash v-else class="h-4 w-4" />
            <span>{{ t('developer.apps.distribution.deleteProduct') }}</span>
          </button>
          <button class="btn btn-ghost btn-sm" :disabled="isLoading" @click="loadProduct">
            <IconRefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            {{ t('developer.apps.distribution.refresh') }}
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">{{ t('developer.apps.distribution.channels') }}</p>
          <p class="mt-2 text-2xl font-semibold tabular-nums">{{ channels.length }}</p>
          <p class="mt-1 text-xs text-base-content/55">{{ t('developer.apps.distribution.channelsSummary') }}</p>
        </article>
        <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">{{ t('developer.apps.distribution.releases') }}</p>
          <p class="mt-2 text-2xl font-semibold tabular-nums">{{ publishedReleaseCount }}</p>
          <p class="mt-1 text-xs text-base-content/55">{{ selectedChannel?.name || t('developer.apps.distribution.selectChannel') }}</p>
        </article>
        <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">{{ t('developer.apps.distribution.artifacts') }}</p>
          <p class="mt-2 text-2xl font-semibold tabular-nums">{{ selectedArtifactCount }}</p>
          <p class="mt-1 text-xs text-base-content/55">{{ t('developer.apps.distribution.artifactsSummary') }}</p>
        </article>
        <article class="rounded-box border border-primary/20 bg-primary/[0.05] p-4 shadow-sm">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">{{ t('developer.apps.distribution.activeChannel') }}</p>
          <p class="mt-2 truncate text-lg font-semibold">{{ selectedChannel ? localizedDistributionText(selectedChannel.displayNames, selectedChannel.displayName || selectedChannel.name, localizationLocales) : '—' }}</p>
          <p v-if="!selectedChannel || selectedChannel.artifactRetention != null" class="mt-1 text-xs text-base-content/55">{{ selectedChannel ? channelRetentionLabel(selectedChannel) : t('developer.apps.distribution.selectChannel') }}</p>
        </article>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section class="border border-base-300 bg-base-100 p-5 rounded-box">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">{{ t('developer.apps.distribution.channels') }}</h2>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.publisherHint') }}</p>
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

        <section class="border border-base-300 bg-base-100 p-5 rounded-box">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="font-semibold">{{ t('developer.apps.distribution.releases') }}</h2>
              <p v-if="selectedChannel" class="mt-1 font-mono text-xs text-base-content/50">{{ selectedChannel.name }}</p>
              <button
                v-if="selectedChannel"
                class="btn btn-ghost btn-xs mt-2 h-7 min-h-7 w-7 px-0"
                type="button"
                :title="t('developer.apps.distribution.copyChannelId')"
                :aria-label="t('developer.apps.distribution.copyChannelId')"
                @click="copyIdentifier(selectedChannel.id)"
              >
                <IconCopy class="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              class="btn btn-primary btn-sm shrink-0 self-end sm:self-start"
              type="button"
              :disabled="!channels.length"
              @click="openCreateRelease"
            >
              <IconPlus class="h-4 w-4" />
              {{ t('developer.apps.distribution.createRelease') }}
            </button>
          </div>

          <div v-if="selectedChannel" class="mt-5">
            <div v-if="featuredRelease" class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">{{ t('developer.apps.distribution.latestRelease') }}</span>
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="releaseStatusClass(featuredRelease.status)">{{ featuredRelease.status }}</span>
                    <span v-if="isReleaseExpired(featuredRelease)" class="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">{{ t('developer.apps.distribution.expired') }}</span>
                  </div>
                  <div v-if="featuredRelease.title || Object.keys(featuredRelease.titles || {}).length" class="mt-2 font-medium">
                    {{ localizedDistributionText(featuredRelease.titles, featuredRelease.title, localizationLocales) }}
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
                    :disabled="deletingId === featuredRelease.id"
                    @click="deleteRelease(featuredRelease)"
                  >
                    <span v-if="deletingId === featuredRelease.id" class="loading loading-spinner loading-xs" />
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
                    :disabled="publishingId === featuredRelease.id || deletingId === featuredRelease.id || !featuredRelease.artifacts.length"
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
                @click="selectFeaturedRelease(releases[0])"
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
      </div>

      <section class="border border-base-300 bg-base-100 p-5 rounded-box">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold">{{ t('developer.apps.distribution.metrics') }}</h2>
            <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.metricsHint') }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="metricsRangeDays"
              class="select select-sm"
              :aria-label="t('developer.apps.distribution.metricsRange')"
            >
              <option :value="7">{{ t('developer.apps.distribution.last7Days') }}</option>
              <option :value="30">{{ t('developer.apps.distribution.last30Days') }}</option>
              <option :value="90">{{ t('developer.apps.distribution.last90Days') }}</option>
            </select>
            <button class="btn btn-outline btn-sm" :disabled="isLoadingMetrics" @click="loadMetrics">
              <span v-if="isLoadingMetrics" class="loading loading-spinner loading-xs" />
              {{ t('developer.apps.distribution.loadMetrics') }}
            </button>
          </div>
        </div>
        <div v-if="metrics" class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ t('developer.apps.distribution.checks') }}</div>
            <div class="mt-1 text-xl font-semibold">{{ metrics.checks }}</div>
          </div>
          <div class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ t('developer.apps.distribution.dau') }}</div>
            <div class="mt-1 text-xl font-semibold">{{ metrics.dau }}</div>
          </div>
          <div class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ t('developer.apps.distribution.mau') }}</div>
            <div class="mt-1 text-xl font-semibold">{{ metrics.mau }}</div>
          </div>
        </div>
        <div v-if="metrics && metricGroups.length" class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="group in metricGroups" :key="group.key" class="border border-base-300 p-3 rounded-box">
            <div class="text-sm text-base-content/60">{{ group.label }}</div>
            <div v-if="group.entries.length" class="mt-2 space-y-1.5">
              <div v-for="entry in visibleMetricEntries(group)" :key="entry.key" class="flex items-center justify-between gap-3">
                <span class="truncate font-mono text-xs">{{ entry.key }}</span>
                <span class="shrink-0 text-sm font-semibold tabular-nums">{{ entry.count }}</span>
              </div>
              <p v-if="group.entries.length > MAX_METRIC_ENTRIES" class="text-xs text-base-content/45">
                {{ t('developer.apps.distribution.moreCount', { count: group.entries.length - MAX_METRIC_ENTRIES }) }}
              </p>
            </div>
            <p v-else class="mt-2 text-xs text-base-content/45">{{ t('developer.apps.distribution.breakdownEmpty') }}</p>
          </div>
        </div>
        <p v-else-if="!metrics" class="mt-5 border border-base-300 p-4 rounded-box text-sm text-base-content/60">
          {{ t('developer.apps.distribution.metricsEmpty') }}
        </p>
      </section>
      <section class="border border-base-300 bg-base-100 p-5 rounded-box">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold">{{ t('developer.apps.distribution.uploadKeys') }}</h2>
            <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.uploadKeysHint') }}</p>
          </div>
          <button class="btn btn-outline btn-sm" :disabled="isLoadingUploadApiKeys" type="button" @click="loadUploadApiKeys">
            <span v-if="isLoadingUploadApiKeys" class="loading loading-spinner loading-xs" />
            {{ t('developer.apps.distribution.refresh') }}
          </button>
        </div>
        <div v-if="oneTimeUploadApiKey" class="alert alert-warning mt-5 rounded-box border border-warning/40">
          <div class="min-w-0">
            <div class="font-medium">{{ t('developer.apps.distribution.uploadKeyCreated') }}</div>
            <code class="mt-2 block max-w-[28rem] truncate whitespace-nowrap font-mono text-xs">{{ oneTimeUploadApiKey }}</code>
          </div>
          <button
            class="btn btn-warning btn-sm h-9 min-h-9 w-9 shrink-0 px-0"
            type="button"
            :title="t('developer.apps.distribution.copyUploadKey')"
            :aria-label="t('developer.apps.distribution.copyUploadKey')"
            @click="copyIdentifier(oneTimeUploadApiKey)"
          >
            <IconCopy class="h-4 w-4" />
          </button>
        </div>
        <form class="mt-5 flex flex-col gap-2 sm:flex-row" @submit.prevent="createUploadApiKey">
          <input
            v-model="newUploadApiKeyName"
            class="input w-full"
            type="text"
            maxlength="100"
            :placeholder="t('developer.apps.distribution.uploadKeyNamePlaceholder')"
            :aria-label="t('developer.apps.distribution.uploadKeyName')"
            required
          />
          <button class="btn btn-primary shrink-0" :disabled="isCreatingUploadApiKey" type="submit">
            <span v-if="isCreatingUploadApiKey" class="loading loading-spinner loading-xs" />
            {{ t('developer.apps.distribution.createUploadKey') }}
          </button>
        </form>
        <div v-if="uploadApiKeys.length" class="mt-5 space-y-2">
          <div
            v-for="key in uploadApiKeys"
            :key="key.id"
            class="flex flex-wrap items-center justify-between gap-3 border border-base-300 p-3 rounded-box"
          >
            <div class="min-w-0">
              <div class="font-medium">{{ key.name }}</div>
              <div class="mt-1 text-xs text-base-content/55">
                <span class="font-mono">{{ key.id }}</span>
                <span v-if="key.lastUsedAt"> · {{ key.lastUsedAt }}</span>
              </div>
            </div>
            <button class="btn btn-ghost btn-xs text-error" type="button" @click="deleteUploadApiKey(key)">
              {{ t('common.remove') }}
            </button>
          </div>
        </div>
        <p v-else class="mt-5 border border-base-300 p-4 rounded-box text-sm text-base-content/60">
          {{ t('developer.apps.distribution.noUploadKeys') }}
        </p>
      </section>
    </template>

    <div v-else class="alert alert-warning rounded-box border border-warning/40">
      {{ t('developer.apps.distribution.requestFailed') }}
    </div>

    <AdminDrawer
      :open="productDrawerOpen"
      :title="t('developer.apps.distribution.editProduct')"
      content-class="!w-full !max-w-none sm:!w-[65vw]"
      @update:open="productDrawerOpen = $event"
    >
      <form class="space-y-5" @submit.prevent="saveProduct">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t('developer.apps.distribution.productSlug') }}</legend>
          <input
            v-model="productForm.slug"
            type="text"
            class="input w-full"
            :placeholder="t('developer.apps.distribution.productSlug')"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
          />
        </fieldset>
        <div class="space-y-4">
          <div class="flex flex-col gap-3 border border-base-300 bg-base-100 p-4 rounded-box sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="font-medium">{{ t('developer.apps.distribution.localizedMetadata') }}</h2>
              <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.localizationRequired') }}</p>
            </div>
            <div class="flex gap-2">
              <select v-model="newProductLanguage" class="select select-sm" :aria-label="t('developer.apps.distribution.selectLanguage')">
                <option value="">{{ t('developer.apps.distribution.selectLanguage') }}</option>
                <option v-for="option in availableProductLocaleOptions" :key="option.code" :value="option.code">
                  {{ option.name }}
                </option>
              </select>
              <button class="btn btn-outline btn-sm" type="button" :disabled="!newProductLanguage" @click="addProductLocalization">
                <IconPlus class="h-4 w-4" />
                {{ t('developer.apps.distribution.addLanguage') }}
              </button>
            </div>
          </div>
          <div
            v-for="(entry, index) in productForm.localizations"
            :key="entry.id"
            class="grid gap-4 border border-base-300 p-4 rounded-box sm:grid-cols-2"
          >
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.productName') }}</legend>
              <div class="flex gap-2">
                <select v-model="entry.locale" class="select w-32" :aria-label="t('developer.apps.distribution.selectLanguage')">
                  <option v-for="option in productLocaleOptionsFor(index)" :key="option.code" :value="option.code">
                    {{ option.name }}
                  </option>
                </select>
                <input v-model="entry.name" type="text" class="input w-full" :placeholder="t('developer.apps.distribution.productName')" required />
              </div>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.productDescription') }}</legend>
              <textarea
                v-model="entry.description"
                class="textarea min-h-24 w-full"
                :placeholder="t('developer.apps.distribution.productDescription')"
                rows="2"
                required
              />
            </fieldset>
            <button
              v-if="productForm.localizations.length > 1"
              class="btn btn-ghost btn-sm justify-self-start text-error sm:col-span-2"
              type="button"
              @click="removeProductLocalization(index)"
            >
              {{ t('common.remove') }} {{ localeName(entry.locale) }}
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-4">
          <button class="btn btn-ghost" type="button" @click="productDrawerOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" type="submit" :disabled="isUpdatingProduct">
            <span v-if="isUpdatingProduct" class="loading loading-spinner loading-sm" />
            {{ t('common.save') }}
          </button>
        </div>
      </form>
    </AdminDrawer>

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
          <button class="btn btn-primary" type="submit" :disabled="isCreatingChannel">
            <span v-if="isCreatingChannel" class="loading loading-spinner loading-sm" />
            {{ editingChannelId ? t('common.save') : t('common.create') }}
          </button>
        </div>
      </form>
    </AdminDrawer>

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
            {{ localizedDistributionText(release.titles, release.title, localizationLocales) }}
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
  </section>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconBan, IconCopy, IconDownload, IconList, IconPencil, IconPlus, IconRefreshCw, IconTrash } from '#components'
import type { DistributionArtifact, DistributionChannel, DistributionLocalizedText, DistributionMetrics, DistributionProduct, DistributionRelease, DistributionUploadApiKey } from '~/types/distribution'
import {
  associateDistributionArtifact,
  createDistributionChannel,
  createDistributionRelease,
  createDistributionUploadApiKey,
  deleteDistributionChannel,
  deleteDistributionProduct,
  deleteDistributionRelease,
  distributionDownloadUrl,
  fetchDistributionChannels,
  fetchDistributionManagedReleases,
  fetchDistributionMetrics,
  fetchDistributionProducts,
  fetchDistributionUploadApiKeys,
  localizedDistributionText,
  prepareDistributionUpload,
  publishDistributionRelease,
  updateDistributionChannel,
  updateDistributionProduct,
  updateDistributionRelease,
  uploadDistributionArtifact,
  yankDistributionRelease,
} from '~/utils/distribution'
import { formatRelativeTime } from '~/utils/datetime'

type ProductLocalizationEntry = {
  id: string
  locale: string
  name: string
  description: string
}

type ChannelLocalizationEntry = {
  id: string
  locale: string
  displayName: string
  description: string
}

type ReleaseLocalizationEntry = {
  id: string
  locale: string
  title: string
  description: string
}
type ReleaseArtifactEntry = {
  id: string
  file: File | null
  isExisting: boolean
  objectKey?: string
  downloadUrl: string
  fileName: string
  mimeType: string
  size: string
  hash: string
  slug: string
  meta: string
  platform: string
  architecture: string
}
type ReleaseMetadataEntry = {
  id: string
  key: string
  value: string
}

const props = defineProps<{
  publisherName: string
  productSlug: string
}>()
const { t, locale, locales, localeProperties } = useI18n()
const { $toast } = useNuxtApp()
const { confirm } = useAlert()
const localizationLocales = computed(() => [localeProperties.value.language, locale.value])
const contentLocale = computed(() => localeProperties.value.language || locale.value || 'en-US')
const contentLocaleOptions = computed(() =>
  (locales.value as Array<{ code: string; language?: string; name?: string }>).map((item) => ({
    code: item.language || item.code,
    name: item.name || item.language || item.code,
  })),
)
const product = ref<DistributionProduct | null>(null)
const isLoading = ref(false)
const channels = ref<DistributionChannel[]>([])
const selectedChannel = ref<DistributionChannel | null>(null)
const releases = ref<DistributionRelease[]>([])
const featuredRelease = ref<DistributionRelease | null>(null)
const releasesDrawerOpen = ref(false)
const publishedReleaseCount = computed(() => releases.value.filter((release) => release.status === 'published').length)
const selectedArtifactCount = computed(() => releases.value.reduce((total, release) => total + (release.artifacts?.length || 0), 0))
const productDrawerOpen = ref(false)
const isUpdatingProduct = ref(false)
const newProductLanguage = ref('')
const productForm = reactive({
  slug: '',
  localizations: [] as ProductLocalizationEntry[],
})
const newChannelLanguage = ref('')
const newReleaseLanguage = ref('')
const yankingId = ref<string | null>(null)
const metrics = ref<DistributionMetrics | null>(null)
const isLoadingMetrics = ref(false)
const metricsRangeDays = ref(30)
const MAX_METRIC_ENTRIES = 8
const uploadApiKeys = ref<DistributionUploadApiKey[]>([])
const isLoadingUploadApiKeys = ref(false)
const isCreatingUploadApiKey = ref(false)
const newUploadApiKeyName = ref('')
const oneTimeUploadApiKey = ref('')
const isCreatingChannel = ref(false)
const isCreatingRelease = ref(false)
const publishingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const deletingChannelId = ref<string | null>(null)
const deletingProduct = ref(false)
const channelDrawerOpen = ref(false)
const releaseDrawerOpen = ref(false)
const editingChannelId = ref<string | null>(null)
const editingReleaseId = ref<string | null>(null)
const releaseChannels = ref<string[]>([])
const channelForm = reactive({
  name: '',
  localizations: [] as ChannelLocalizationEntry[],
  usePlatformDefault: true,
  artifactRetention: 0,
})
const releaseForm = reactive({
  version: '',
  localizations: [] as ReleaseLocalizationEntry[],
  metadataEntries: [] as ReleaseMetadataEntry[],
  forceUpdate: false,
  artifacts: [] as ReleaseArtifactEntry[],
})
function isBuiltinChannelName(name: string) {
  return name === 'stable' || name === 'beta' || name === 'nightly' || name === 'rolling'
}

function channelRetentionLabel(channel: DistributionChannel) {
  if (channel.artifactRetention === 0) return t('developer.apps.distribution.retentionDisabled')
  if (channel.artifactRetention == null) return ''
  return t('developer.apps.distribution.retentionCount', { count: channel.artifactRetention })
}
function releaseStatusClass(status: string) {
  if (status === 'published') return 'bg-success/10 text-success'
  if (status === 'yanked') return 'bg-error/10 text-error'
  return 'bg-warning/10 text-warning'
}

/** A release is effectively expired when every artifact was removed by retention cleanup. */
function isReleaseExpired(release: DistributionRelease) {
  return release.artifacts.length > 0 && release.artifacts.every((artifact) => artifact.expired)
}

function selectFeaturedRelease(release: DistributionRelease) {
  featuredRelease.value = release
  releasesDrawerOpen.value = false
}

function syncFeaturedRelease() {
  const current = featuredRelease.value
  if (!current) {
    featuredRelease.value = releases.value[0] || null
    return
  }
  featuredRelease.value = releases.value.find((item) => item.id === current.id) || releases.value[0] || null
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const formatted = unit === 0 || value >= 10 ? Math.round(value) : value.toFixed(1)
  return `${formatted} ${units[unit]}`
}

type MetricGroup = {
  key: string
  label: string
  entries: Array<{ key: string; count: number }>
}

const metricGroups = computed<MetricGroup[]>(() => {
  if (!metrics.value) return []
  const entries = (map: Record<string, number> | undefined) =>
    Object.entries(map || {})
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
  return [
    { key: 'byVersion', label: t('developer.apps.distribution.byVersion'), entries: entries(metrics.value.byVersion) },
    { key: 'byChannel', label: t('developer.apps.distribution.channelsBreakdown'), entries: entries(metrics.value.byChannel) },
    { key: 'byPlatform', label: t('developer.apps.distribution.byPlatform'), entries: entries(metrics.value.byPlatform) },
    { key: 'byArchitecture', label: t('developer.apps.distribution.byArchitecture'), entries: entries(metrics.value.byArchitecture) },
    { key: 'byOSVersion', label: t('developer.apps.distribution.byOSVersion'), entries: entries(metrics.value.byOSVersion) },
    { key: 'byClientVersion', label: t('developer.apps.distribution.byClientVersion'), entries: entries(metrics.value.byClientVersion) },
    { key: 'byLocale', label: t('developer.apps.distribution.byLocale'), entries: entries(metrics.value.byLocale) },
  ].filter((group) => group.entries.length)
})

function visibleMetricEntries(group: MetricGroup) {
  return group.entries.slice(0, MAX_METRIC_ENTRIES)
}


function normalizeLocale(value: string) {
  return value.trim().replaceAll('_', '-').toLowerCase()
}
function newArtifact(): ReleaseArtifactEntry {
  return {
    id: crypto.randomUUID(),
    file: null,
    isExisting: false,
    objectKey: undefined,
    downloadUrl: '',
    fileName: '',
    mimeType: '',
    size: '',
    hash: '',
    slug: '',
    meta: '',
    platform: '',
    architecture: '',
  }
}

function releaseArtifactEntries(artifacts: DistributionArtifact[]) {
  return artifacts.length
    ? artifacts.map((artifact) => ({
        id: artifact.id || crypto.randomUUID(),
        file: null,
        isExisting: true,
        objectKey: artifact.objectKey,
        downloadUrl: artifact.downloadUrl || '',
        fileName: artifact.fileName || '',
        mimeType: artifact.mimeType || '',
        size: artifact.size ? String(artifact.size) : '',
        hash: artifact.hash || '',
        slug: artifact.slug || '',
        meta: artifact.meta ? JSON.stringify(artifact.meta, null, 2) : '',
        platform: artifact.platform,
        architecture: artifact.architecture,
      }))
    : [newArtifact()]
}
function localeName(localeCode: string) {
  return contentLocaleOptions.value.find((option) => option.code === localeCode)?.name || localeCode
}

function newReleaseMetadataEntry(): ReleaseMetadataEntry {
  return { id: crypto.randomUUID(), key: '', value: '' }
}

function releaseMetadataEntries(metadata: Record<string, unknown> | undefined) {
  return Object.entries(metadata || {}).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }))
}

function addReleaseMetadata() {
  releaseForm.metadataEntries.push(newReleaseMetadataEntry())
}

function removeReleaseMetadata(index: number) {
  releaseForm.metadataEntries.splice(index, 1)
}

function productLocaleOptionsFor(index: number) {
  const currentLocale = productForm.localizations[index].locale
  const used = new Set(productForm.localizations.filter((_, entryIndex) => entryIndex !== index).map((entry) => entry.locale))
  const current = contentLocaleOptions.value.find((option) => option.code === currentLocale) || { code: currentLocale, name: localeName(currentLocale) }
  return [current, ...contentLocaleOptions.value.filter((option) => option.code !== current.code && !used.has(option.code))]
}

const availableProductLocaleOptions = computed(() => {
  const used = new Set(productForm.localizations.map((entry) => entry.locale))
  return contentLocaleOptions.value.filter((option) => !used.has(option.code))
})

function newProductLocalization(localeCode = contentLocale.value): ProductLocalizationEntry {
  return { id: crypto.randomUUID(), locale: localeCode, name: '', description: '' }
}

function productLocalizationEntries(names: DistributionLocalizedText | undefined, descriptions: DistributionLocalizedText | undefined, fallbackName: string, fallbackDescription: string) {
  const locales = new Set([...Object.keys(names || {}), ...Object.keys(descriptions || {})])
  if (!locales.size) locales.add(contentLocale.value)
  return [...locales].map((localeCode) => ({
    id: crypto.randomUUID(),
    locale: localeCode,
    name: names?.[localeCode] || '',
    description: descriptions?.[localeCode] || '',
  })).map((entry, index, entries) => ({
    ...entry,
    name: entry.name || (index === 0 ? fallbackName : ''),
    description: entry.description || (index === 0 ? fallbackDescription : ''),
    locale: entries[index].locale,
  }))
}

function addProductLocalization() {
  if (!newProductLanguage.value || productForm.localizations.some((entry) => entry.locale === newProductLanguage.value)) return
  productForm.localizations.push(newProductLocalization(newProductLanguage.value))
  newProductLanguage.value = ''
}

function removeProductLocalization(index: number) {
  if (productForm.localizations.length > 1) productForm.localizations.splice(index, 1)
}

function productLocalizedMap(field: 'name' | 'description') {
  return productForm.localizations.reduce<DistributionLocalizedText>((result, entry) => {
    result[entry.locale] = entry[field].trim()
    return result
  }, {})
}
function localizedValue(values: DistributionLocalizedText | undefined, localeCode: string) {
  const normalizedLocale = normalizeLocale(localeCode)
  const exact = Object.entries(values || {}).find(([key]) => normalizeLocale(key) === normalizedLocale)
  const language = Object.entries(values || {}).find(([key]) => normalizeLocale(key).split('-')[0] === normalizedLocale.split('-')[0])
  return (exact || language)?.[1] || ''
}
function localizedFormFallback(values: DistributionLocalizedText, fallback: string) {
  return localizedDistributionText(values, fallback, localizationLocales.value)
}


function localeOptionsFor<T extends { locale: string }>(entries: T[], index: number) {
  const currentLocale = entries[index].locale
  const used = new Set(entries.filter((_, entryIndex) => entryIndex !== index).map((entry) => entry.locale))
  const current = contentLocaleOptions.value.find((option) => option.code === currentLocale) || { code: currentLocale, name: localeName(currentLocale) }
  return [current, ...contentLocaleOptions.value.filter((option) => option.code !== current.code && !used.has(option.code))]
}

function channelLocaleOptionsFor(index: number) {
  return localeOptionsFor(channelForm.localizations, index)
}

function releaseLocaleOptionsFor(index: number) {
  return localeOptionsFor(releaseForm.localizations, index)
}

const availableChannelLocaleOptions = computed(() => {
  const used = new Set(channelForm.localizations.map((entry) => entry.locale))
  return contentLocaleOptions.value.filter((option) => !used.has(option.code))
})

const availableReleaseLocaleOptions = computed(() => {
  const used = new Set(releaseForm.localizations.map((entry) => entry.locale))
  return contentLocaleOptions.value.filter((option) => !used.has(option.code))
})

function newChannelLocalization(localeCode = contentLocale.value): ChannelLocalizationEntry {
  return { id: crypto.randomUUID(), locale: localeCode, displayName: '', description: '' }
}

function channelLocalizationEntries(
  displayNames: DistributionLocalizedText | undefined,
  descriptions: DistributionLocalizedText | undefined,
  fallbackName: string,
  fallbackDescription: string,
) {
  const locales = new Set([...Object.keys(displayNames || {}), ...Object.keys(descriptions || {})])
  if (!locales.size) locales.add(contentLocale.value)
  return [...locales].map((localeCode, index) => ({
    id: crypto.randomUUID(),
    locale: localeCode,
    displayName: localizedValue(displayNames, localeCode) || (index === 0 ? fallbackName : ''),
    description: localizedValue(descriptions, localeCode) || (index === 0 ? fallbackDescription : ''),
  }))
}

function addChannelLocalization() {
  if (!newChannelLanguage.value || channelForm.localizations.some((entry) => entry.locale === newChannelLanguage.value)) return
  channelForm.localizations.push(newChannelLocalization(newChannelLanguage.value))
  newChannelLanguage.value = ''
}

function removeChannelLocalization(index: number) {
  if (channelForm.localizations.length > 1) channelForm.localizations.splice(index, 1)
}

function channelLocalizedMap(field: 'displayName' | 'description') {
  return channelForm.localizations.reduce<DistributionLocalizedText>((result, entry) => {
    result[entry.locale] = entry[field].trim()
    return result
  }, {})
}

function newReleaseLocalization(localeCode = contentLocale.value): ReleaseLocalizationEntry {
  return { id: crypto.randomUUID(), locale: localeCode, title: '', description: '' }
}

function releaseLocalizationEntries(
  titles: DistributionLocalizedText | undefined,
  descriptions: DistributionLocalizedText | undefined,
  fallbackTitle: string,
  fallbackDescription: string,
) {
  const locales = new Set([...Object.keys(titles || {}), ...Object.keys(descriptions || {})])
  if (!locales.size) locales.add(contentLocale.value)
  return [...locales].map((localeCode, index) => ({
    id: crypto.randomUUID(),
    locale: localeCode,
    title: localizedValue(titles, localeCode) || (index === 0 ? fallbackTitle : ''),
    description: localizedValue(descriptions, localeCode) || (index === 0 ? fallbackDescription : ''),
  }))
}

function addReleaseLocalization() {
  if (!newReleaseLanguage.value || releaseForm.localizations.some((entry) => entry.locale === newReleaseLanguage.value)) return
  releaseForm.localizations.push(newReleaseLocalization(newReleaseLanguage.value))
  newReleaseLanguage.value = ''
}

function removeReleaseLocalization(index: number) {
  if (releaseForm.localizations.length > 1) releaseForm.localizations.splice(index, 1)
}

function releaseLocalizedMap() {
  return releaseForm.localizations.reduce<DistributionLocalizedText>((result, entry) => {
    result[entry.locale] = entry.description.trim()
    return result
  }, {})
}
function releaseTitleMap() {
  return releaseForm.localizations.reduce<DistributionLocalizedText>((result, entry) => {
    result[entry.locale] = entry.title.trim()
    return result
  }, {})
}

function openProductEditor() {
  if (!product.value) return
  productForm.slug = product.value.slug
  productForm.localizations = productLocalizationEntries(
    product.value.names,
    product.value.descriptions,
    product.value.name,
    product.value.description,
  )
  newProductLanguage.value = ''
  productDrawerOpen.value = true
}

async function saveProduct() {
  if (!product.value) return
  if (!productForm.localizations.length || productForm.localizations.some((entry) => !entry.name.trim() || !entry.description.trim())) {
    $toast.error(t('developer.apps.distribution.localizationRequired'))
    return
  }
  isUpdatingProduct.value = true
  try {
    const names = productLocalizedMap('name')
    const descriptions = productLocalizedMap('description')
    const updatedProduct = await updateDistributionProduct(product.value.id, {
      slug: productForm.slug,
      name: localizedFormFallback(names, productForm.slug),
      names,
      description: localizedFormFallback(descriptions, ''),
      descriptions,
    })
    product.value = updatedProduct
    productDrawerOpen.value = false
    $toast.success(t('developer.apps.distribution.productUpdated'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isUpdatingProduct.value = false
  }
}
async function deleteProduct() {
  if (!product.value) return
  if (!(await confirm(
    t('developer.apps.distribution.deleteProduct'),
    t('developer.apps.distribution.deleteProductConfirm', { name: product.value.name || product.value.slug }),
  ))) return
  deletingProduct.value = true
  try {
    await deleteDistributionProduct(product.value.id)
    await navigateTo(`/developers/${encodeURIComponent(props.publisherName)}/distribution`)
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    deletingProduct.value = false
  }
}


async function loadProduct() {
  isLoading.value = true
  try {
    const products = await fetchDistributionProducts(props.publisherName)
    product.value = products.find((item) => item.slug === props.productSlug) || null
    channels.value = product.value ? await fetchDistributionChannels(product.value.id) : []
    selectedChannel.value = channels.value[0] || null
    releases.value = selectedChannel.value && product.value
      ? await fetchDistributionManagedReleases(product.value.id, selectedChannel.value.name)
      : []
    featuredRelease.value = releases.value[0] || null
    releasesDrawerOpen.value = false
    metrics.value = null
    uploadApiKeys.value = []
    oneTimeUploadApiKey.value = ''
    if (product.value) await loadUploadApiKeys()
  } catch (error) {
    product.value = null
    channels.value = []
    selectedChannel.value = null
    releases.value = []
    featuredRelease.value = null
    releasesDrawerOpen.value = false
    uploadApiKeys.value = []
    oneTimeUploadApiKey.value = ''
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isLoading.value = false
  }
}

async function selectChannel(channel: DistributionChannel) {
  selectedChannel.value = channel
  if (!product.value) return
  try {
    releases.value = await fetchDistributionManagedReleases(product.value.id, channel.name)
    featuredRelease.value = releases.value[0] || null
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  }
}

function openCreateChannel() {
  editingChannelId.value = null
  channelForm.name = ''
  channelForm.localizations = [newChannelLocalization()]
  channelForm.usePlatformDefault = true
  channelForm.artifactRetention = 0
  newChannelLanguage.value = ''
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

async function saveChannel() {
  if (!product.value) return
  if (!channelForm.localizations.length || channelForm.localizations.some((entry) => !entry.displayName.trim())) {
    $toast.error(t('developer.apps.distribution.localizationRequired'))
    return
  }
  const isEditing = Boolean(editingChannelId.value)
  isCreatingChannel.value = true
  try {
    const artifactRetention = channelForm.usePlatformDefault
      ? undefined
      : Math.max(0, Math.floor(Number(channelForm.artifactRetention) || 0))
    const displayNames = channelLocalizedMap('displayName')
    const descriptions = channelLocalizedMap('description')
    const input = {
      displayName: localizedFormFallback(displayNames, channelForm.name),
      displayNames,
      description: localizedFormFallback(descriptions, ''),
      descriptions,
      artifactRetention,
    }
    const channel = editingChannelId.value
      ? await updateDistributionChannel(product.value.id, editingChannelId.value, input)
      : await createDistributionChannel(product.value.id, { name: channelForm.name, ...input })
    channels.value = channels.value.some((item) => item.id === channel.id)
      ? channels.value.map((item) => item.id === channel.id ? channel : item)
      : [...channels.value, channel]
    if (selectedChannel.value?.id === channel.id) selectedChannel.value = channel
    editingChannelId.value = null
    channelForm.name = ''
    channelForm.localizations = [newChannelLocalization()]
    newChannelLanguage.value = ''
    channelDrawerOpen.value = false
    if (selectedChannel.value?.id === channel.id) await selectChannel(channel)
    $toast.success(t(isEditing ? 'developer.apps.distribution.channelUpdated' : 'developer.apps.distribution.channelCreated'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isCreatingChannel.value = false
  }
}
async function deleteChannel(channel: DistributionChannel) {
  if (!product.value || isBuiltinChannelName(channel.name)) return
  if (!(await confirm(
    t('developer.apps.distribution.deleteChannel'),
    t('developer.apps.distribution.deleteChannelConfirm', {
      name: channel.displayName || channel.name,
    }),
  ))) return
  deletingChannelId.value = channel.id
  try {
    await deleteDistributionChannel(product.value.id, channel.id)
    const remainingChannels = channels.value.filter((item) => item.id !== channel.id)
    channels.value = remainingChannels
    if (selectedChannel.value?.id === channel.id) {
      const nextChannel = remainingChannels[0] || null
      selectedChannel.value = nextChannel
      releases.value = nextChannel
        ? await fetchDistributionManagedReleases(product.value.id, nextChannel.name)
        : []
      featuredRelease.value = releases.value[0] || null
    }
    $toast.success(t('developer.apps.distribution.channelDeleted'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    deletingChannelId.value = null
  }
}


function addArtifact() {
  releaseForm.artifacts.push(newArtifact())
}

function removeArtifact(index: number) {
  releaseForm.artifacts.splice(index, 1)
}
async function copyIdentifier(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    $toast.success(t('developer.apps.distribution.idCopied'))
  } catch {
    $toast.error(t('developer.apps.distribution.copyFailed'))
  }
}
async function loadUploadApiKeys() {
  if (!product.value) return
  isLoadingUploadApiKeys.value = true
  try {
    uploadApiKeys.value = await fetchDistributionUploadApiKeys(product.value.id)
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isLoadingUploadApiKeys.value = false
  }
}

async function createUploadApiKey() {
  if (!product.value || !newUploadApiKeyName.value.trim()) return
  isCreatingUploadApiKey.value = true
  try {
    const created = await createDistributionUploadApiKey(product.value.id, newUploadApiKeyName.value.trim())
    uploadApiKeys.value = [created, ...uploadApiKeys.value]
    oneTimeUploadApiKey.value = created.key
    newUploadApiKeyName.value = ''
    $toast.success(t('developer.apps.distribution.uploadKeyCreatedToast'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isCreatingUploadApiKey.value = false
  }
}

async function deleteUploadApiKey(key: DistributionUploadApiKey) {
  if (!product.value || !(await confirm(
    t('developer.apps.distribution.deleteUploadKey'),
    t('developer.apps.distribution.deleteUploadKeyConfirm'),
  ))) return
  try {
    await deleteDistributionUploadApiKey(product.value.id, key.id)
    uploadApiKeys.value = uploadApiKeys.value.filter((item) => item.id !== key.id)
    $toast.success(t('developer.apps.distribution.uploadKeyDeleted'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  }
}

function selectArtifactFile(index: number, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    releaseForm.artifacts[index].file = file
    releaseForm.artifacts[index].isExisting = false
    releaseForm.artifacts[index].objectKey = undefined
    releaseForm.artifacts[index].downloadUrl = ''
  }
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
function parseArtifactMeta(value: string) {
  if (!value.trim()) return undefined
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    return parsed as Record<string, unknown>
  } catch {
    throw new Error(t('developer.apps.distribution.invalidArtifactMeta'))
  }
}
function parseReleaseMetadata(entries: ReleaseMetadataEntry[]) {
  const metadata: Record<string, unknown> = {}
  for (const entry of entries) {
    const key = entry.key.trim()
    const value = entry.value.trim()
    if (!key) {
      if (value) throw new Error(t('developer.apps.distribution.invalidReleaseMetadata'))
      continue
    }
    if (value === 'true' || value === 'false') {
      metadata[key] = value === 'true'
    } else if (value === 'null') {
      metadata[key] = null
    } else if (/^-?\d+$/.test(value)) {
      metadata[key] = Number(value)
    } else {
      metadata[key] = entry.value
    }
  }
  return Object.keys(metadata).length ? metadata : undefined
}
async function associateNewReleaseArtifacts(productId: string, releaseId: string) {
  for (const artifact of releaseForm.artifacts) {
    if (artifact.isExisting) continue
    const hasExternalUrl = Boolean(artifact.downloadUrl.trim())
    if (!artifact.file && !hasExternalUrl) {
      if (!artifact.platform.trim() && !artifact.architecture.trim()) continue
      throw new Error(t('developer.apps.distribution.fileRequired'))
    }
    if (!artifact.platform.trim() || !artifact.architecture.trim()) {
      throw new Error(t('developer.apps.distribution.fileRequired'))
    }
    const meta = parseArtifactMeta(artifact.meta)
    if (hasExternalUrl) {
      let externalUrl: URL
      try {
        externalUrl = new URL(artifact.downloadUrl.trim())
      } catch {
        throw new Error(t('developer.apps.distribution.externalUrlInvalid'))
      }
      if (externalUrl.protocol !== 'http:' && externalUrl.protocol !== 'https:') {
        throw new Error(t('developer.apps.distribution.externalUrlInvalid'))
      }
      const size = Number(artifact.size)
      if (!artifact.fileName.trim() || !artifact.mimeType.trim() || !Number.isSafeInteger(size) || size < 0 || !artifact.hash.trim()) {
        throw new Error(t('developer.apps.distribution.externalArtifactRequired'))
      }
      await associateDistributionArtifact(productId, releaseId, {
        downloadUrl: externalUrl.toString(),
        fileName: artifact.fileName.trim(),
        mimeType: artifact.mimeType.trim(),
        size,
        hash: artifact.hash.trim(),
        platform: artifact.platform.trim(),
        architecture: artifact.architecture.trim(),
        slug: artifact.slug.trim() || undefined,
        meta,
      })
      continue
    }
    const file = artifact.file
    if (!file) continue
    const hash = await sha256(file)
    const upload = await prepareDistributionUpload(productId, {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
    })
    await uploadDistributionArtifact(upload, file, file.type || 'application/octet-stream', hash)
    await associateDistributionArtifact(productId, releaseId, {
      objectKey: upload.objectKey,
      platform: artifact.platform.trim(),
      architecture: artifact.architecture.trim(),
      slug: artifact.slug.trim() || undefined,
      meta,
    })
  }
}

function openCreateRelease() {
  editingReleaseId.value = null
  releaseChannels.value = selectedChannel.value ? [selectedChannel.value.name] : []
  releaseForm.version = ''
  releaseForm.localizations = [newReleaseLocalization()]
  releaseForm.metadataEntries = []
  releaseForm.forceUpdate = false
  newReleaseLanguage.value = ''
  releaseForm.artifacts = []
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
  newReleaseLanguage.value = ''
  releaseDrawerOpen.value = true
}
async function saveRelease() {
  if (!product.value || !releaseChannels.value.length) return
  if (!releaseForm.localizations.some((entry) => entry.title.trim())) {
    $toast.error(t('developer.apps.distribution.releaseTitleRequired'))
    return
  }
  const isEditing = Boolean(editingReleaseId.value)
  isCreatingRelease.value = true
  try {
    let release: DistributionRelease
    const titles = releaseTitleMap()
    const title = localizedFormFallback(titles, releaseForm.version)
    const descriptions = releaseLocalizedMap()
    const releaseNotes = localizedFormFallback(descriptions, '')
    const metadata = parseReleaseMetadata(releaseForm.metadataEntries)
    if (editingReleaseId.value) {
      release = await updateDistributionRelease(product.value.id, editingReleaseId.value, {
        version: releaseForm.version,
        title,
        titles,
        channels: releaseChannels.value,
        releaseNotes,
        descriptions,
        metadata,
        forceUpdate: releaseForm.forceUpdate,
      })
      await associateNewReleaseArtifacts(product.value.id, release.id)
      releases.value = selectedChannel.value
        ? await fetchDistributionManagedReleases(product.value.id, selectedChannel.value.name)
        : releases.value.map((item) => item.id === release.id ? release : item)
    } else {
      release = await createDistributionRelease(product.value.id, {
        version: releaseForm.version,
        title,
        titles,
        channels: releaseChannels.value,
        releaseNotes,
        descriptions,
        metadata,
        forceUpdate: releaseForm.forceUpdate,
      })
      releases.value = [release, ...releases.value]
    }
    syncFeaturedRelease()
    editingReleaseId.value = null
    releaseChannels.value = []
    releaseForm.version = ''
    releaseForm.localizations = [newReleaseLocalization()]
    releaseForm.metadataEntries = []
    releaseForm.forceUpdate = false
    releaseForm.artifacts = []
    newReleaseLanguage.value = ''
    releaseDrawerOpen.value = false
    $toast.success(t(isEditing ? 'developer.apps.distribution.releaseUpdated' : 'developer.apps.distribution.draftCreated'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isCreatingRelease.value = false
  }
}

async function publishRelease(releaseId: string) {
  if (!product.value) return
  publishingId.value = releaseId
  try {
    const release = await publishDistributionRelease(product.value.id, releaseId)
    releases.value = releases.value.map((item) => item.id === release.id ? release : item)
    channels.value = channels.value.map((channel) => channel.id === selectedChannel.value?.id ? { ...channel, latest: release } : channel)
    syncFeaturedRelease()
    $toast.success(t('developer.apps.distribution.published'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    publishingId.value = null
  }
}

async function deleteRelease(release: DistributionRelease) {
  if (!product.value || release.status !== 'draft') return
  if (!(await confirm(
    t('developer.apps.distribution.deleteRelease'),
    t('developer.apps.distribution.deleteReleaseConfirm', { version: release.version }),
  ))) return
  deletingId.value = release.id
  try {
    await deleteDistributionRelease(product.value.id, release.id)
    releases.value = releases.value.filter((item) => item.id !== release.id)
    syncFeaturedRelease()
    $toast.success(t('developer.apps.distribution.releaseDeleted'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    deletingId.value = null
  }
}
async function yankRelease(release: DistributionRelease) {
  if (!product.value || release.status !== 'published') return
  if (!(await confirm(
    t('developer.apps.distribution.yankRelease'),
    t('developer.apps.distribution.yankReleaseConfirm', { version: release.version }),
  ))) return
  yankingId.value = release.id
  try {
    const updatedRelease = await yankDistributionRelease(product.value.id, release.id)
    releases.value = releases.value.map((item) => item.id === updatedRelease.id ? updatedRelease : item)
    syncFeaturedRelease()
    $toast.success(t('developer.apps.distribution.releaseYanked'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    yankingId.value = null
  }
}

async function loadMetrics() {
  if (!product.value) return
  isLoadingMetrics.value = true
  try {
    const to = new Date()
    const from = new Date(to.getTime() - metricsRangeDays.value * 24 * 60 * 60 * 1000)
    metrics.value = await fetchDistributionMetrics(product.value.id, from.toISOString(), to.toISOString())
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isLoadingMetrics.value = false
  }
}

watch(metricsRangeDays, () => {
  if (metrics.value) loadMetrics()
})

watch([() => props.publisherName, () => props.productSlug], loadProduct, { immediate: true })
</script>

