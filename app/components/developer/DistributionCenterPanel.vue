<template>
  <section class="space-y-8">
    <div v-if="isLoading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <template v-else-if="product">
      <div class="flex flex-col gap-4 border border-l-4 border-base-300 border-l-primary bg-base-100 p-5 rounded-box sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <NuxtLink
            class="link link-hover text-sm text-base-content/60"
            :to="`/developers/${encodeURIComponent(publisherName)}/distribution`"
          >
            {{ t('developer.apps.distribution.backToProducts') }}
          </NuxtLink>
          <h1 class="mt-2 text-xl font-semibold">
            {{ localizedDistributionText(product.names, product.name, localizationLocales) }}
          </h1>
          <p class="mt-1 font-mono text-sm text-base-content/55">{{ product.slug }}</p>
          <div class="mt-2 inline-flex max-w-full items-center gap-2 rounded-box border border-base-300 bg-base-200/40 px-2 py-1 text-xs">
            <span class="shrink-0 text-base-content/55">{{ t('developer.apps.distribution.appId') }}</span>
            <code class="min-w-0 max-w-[14rem] truncate whitespace-nowrap font-mono text-base-content/75">{{ product.id }}</code>
            <button
              class="btn btn-ghost btn-xs h-6 min-h-6 px-2"
              type="button"
              @click="copyIdentifier(product.id)"
            >
              {{ t('ai.copy') }}
            </button>
          </div>
          <p v-if="product.description || Object.keys(product.descriptions || {}).length" class="mt-3 max-w-2xl text-sm text-base-content/65">
            {{ localizedDistributionText(product.descriptions, product.description, localizationLocales) }}
          </p>
        </div>
        <div class="flex shrink-0 gap-2">
          <button class="btn btn-outline btn-sm" type="button" @click="openProductEditor">
            <IconPencil class="h-4 w-4" />
            {{ t('developer.apps.distribution.editProduct') }}
          </button>
          <button class="btn btn-ghost btn-sm" :disabled="isLoading" @click="loadProduct">
            <IconRefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            {{ t('developer.apps.distribution.refresh') }}
          </button>
        </div>
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
              <button
                class="min-w-0 flex-1 text-left"
                :class="selectedChannel?.id === channel.id ? 'text-primary' : 'hover:text-primary'"
                type="button"
                @click="selectChannel(channel)"
              >
                <span class="block font-medium">{{ localizedDistributionText(channel.displayNames, channel.displayName || channel.name, localizationLocales) }}</span>
                <span class="mt-1 block font-mono text-xs text-base-content/50">{{ channel.name }}</span>
                <span class="mt-1 block max-w-[14rem] truncate whitespace-nowrap font-mono text-[11px] text-base-content/45">{{ t('developer.apps.distribution.channelId') }} · {{ channel.id }}</span>
              </button>
              <div class="flex shrink-0 items-center gap-2">
                <span class="text-xs text-base-content/55">
                  <template v-if="channel.latest">
                    {{ localizedDistributionText(channel.latest.titles, channel.latest.title || channel.latest.version, localizationLocales) }}
                    · {{ channel.latest.version }} · {{ channel.latest.artifacts.length }} {{ t('developer.apps.distribution.artifactCount') }}
                  </template>
                  <template v-else>{{ t('developer.apps.distribution.noRelease') }}</template>
                </span>
                <button
                  class="btn btn-ghost btn-xs"
                  type="button"
                  @click.stop="copyIdentifier(channel.id)"
                >
                  {{ t('ai.copy') }}
                </button>
                <button class="btn btn-ghost btn-xs" type="button" @click="openChannelEditor(channel)">
                  <IconPencil class="h-3.5 w-3.5" />
                  <span class="sr-only">{{ t('developer.apps.distribution.editChannel') }}</span>
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
              <div v-if="selectedChannel" class="mt-2 inline-flex max-w-full items-center gap-2 rounded-box border border-base-300 bg-base-200/40 px-2 py-1 text-xs">
                <span class="shrink-0 text-base-content/55">{{ t('developer.apps.distribution.channelId') }}</span>
                <code class="min-w-0 max-w-[14rem] truncate whitespace-nowrap font-mono text-base-content/75">{{ selectedChannel.id }}</code>
                <button
                  class="btn btn-ghost btn-xs h-6 min-h-6 px-2"
                  type="button"
                  @click="copyIdentifier(selectedChannel.id)"
                >
                  {{ t('ai.copy') }}
                </button>
              </div>
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

          <div v-if="selectedChannel" class="mt-5 space-y-2">
            <div
              v-for="release in releases"
              :key="release.id"
              class="flex flex-col gap-3 border border-base-300 p-3 rounded-box transition-colors hover:border-primary/50 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="min-w-0">
                <div class="font-medium">
                  {{ localizedDistributionText(release.titles, release.title || release.version, localizationLocales) }}
                </div>
                <div class="mt-1 font-mono text-sm">{{ release.version }}</div>
                <div class="mt-1 text-xs text-base-content/55">
                  {{ release.status }} · {{ release.artifacts.length }} {{ t('developer.apps.distribution.artifactCount') }}
                </div>
                <div class="mt-2 inline-flex max-w-full items-center gap-2 rounded-box border border-base-300 bg-base-200/40 px-2 py-1 text-xs">
                  <span class="shrink-0 text-base-content/55">{{ t('developer.apps.distribution.releaseId') }}</span>
                  <code class="min-w-0 max-w-[14rem] truncate whitespace-nowrap font-mono text-base-content/75">{{ release.id }}</code>
                  <button
                    class="btn btn-ghost btn-xs h-6 min-h-6 px-2"
                    type="button"
                    @click.stop="copyIdentifier(release.id)"
                  >
                    {{ t('ai.copy') }}
                  </button>
                </div>
              </div>
              <div v-if="release.status !== 'yanked'" class="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-start">
                <button class="btn btn-ghost btn-xs" type="button" @click="openReleaseEditor(release)">
                  <IconPencil class="h-3.5 w-3.5" />
                  <span class="sr-only">{{ t('developer.apps.distribution.editRelease') }}</span>
                </button>
                <button
                  v-if="release.status === 'draft'"
                  class="btn btn-ghost btn-xs text-error"
                  type="button"
                  :disabled="deletingId === release.id"
                  @click="deleteRelease(release)"
                >
                  <span v-if="deletingId === release.id" class="loading loading-spinner loading-xs" />
                  <IconTrash v-else class="h-3.5 w-3.5" />
                  <span class="sr-only">{{ t('developer.apps.distribution.deleteRelease') }}</span>
                </button>
                <button
                  v-if="release.status === 'draft'"
                  class="btn btn-outline btn-xs"
                  :disabled="publishingId === release.id || deletingId === release.id || !release.artifacts.length"
                  @click="publishRelease(release.id)"
                >
                  <span v-if="publishingId === release.id" class="loading loading-spinner loading-xs" />
                  {{ t('developer.apps.distribution.publish') }}
                </button>
              </div>
            </div>
            <p v-if="!releases.length" class="py-5 text-sm text-base-content/60">
              {{ t('developer.apps.distribution.noReleases') }}
            </p>
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
          <button class="btn btn-outline btn-sm" :disabled="isLoadingMetrics" @click="loadMetrics">
            <span v-if="isLoadingMetrics" class="loading loading-spinner loading-xs" />
            {{ t('developer.apps.distribution.loadMetrics') }}
          </button>
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
        <div v-if="metrics && Object.keys(metrics.byVersion || {}).length" class="mt-5 border border-base-300 p-4 rounded-box">
          <h3 class="font-medium">{{ t('developer.apps.distribution.byVersion') }}</h3>
          <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="([version, count]) in Object.entries(metrics.byVersion || {})"
              :key="version"
              class="flex items-center justify-between gap-3 border border-base-300 px-3 py-2 rounded-box"
            >
              <span class="font-mono text-sm">{{ version }}</span>
              <span class="text-sm font-semibold">{{ count }}</span>
            </div>
          </div>
        </div>
        <p v-else class="mt-5 border border-base-300 p-4 rounded-box text-sm text-base-content/60">
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
          <button class="btn btn-warning btn-sm shrink-0" type="button" @click="copyIdentifier(oneTimeUploadApiKey)">
            {{ t('ai.copy') }}
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
  </section>
</template>

<script setup lang="ts">
import { IconPencil, IconPlus, IconRefreshCw, IconTrash } from '#components'
import type { DistributionArtifact, DistributionChannel, DistributionLocalizedText, DistributionMetrics, DistributionProduct, DistributionRelease, DistributionUploadApiKey } from '~/types/distribution'
import {
  associateDistributionArtifact,
  createDistributionChannel,
  createDistributionRelease,
  createDistributionUploadApiKey,
  deleteDistributionRelease,
  deleteDistributionUploadApiKey,
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
} from '~/utils/distribution'

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
const productDrawerOpen = ref(false)
const isUpdatingProduct = ref(false)
const newProductLanguage = ref('')
const productForm = reactive({
  slug: '',
  localizations: [] as ProductLocalizationEntry[],
})
const newChannelLanguage = ref('')
const newReleaseLanguage = ref('')
const metrics = ref<DistributionMetrics | null>(null)
const isLoadingMetrics = ref(false)
const uploadApiKeys = ref<DistributionUploadApiKey[]>([])
const isLoadingUploadApiKeys = ref(false)
const isCreatingUploadApiKey = ref(false)
const newUploadApiKeyName = ref('')
const oneTimeUploadApiKey = ref('')
const isCreatingChannel = ref(false)
const isCreatingRelease = ref(false)
const publishingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const channelDrawerOpen = ref(false)
const releaseDrawerOpen = ref(false)
const editingChannelId = ref<string | null>(null)
const editingReleaseId = ref<string | null>(null)
const releaseChannels = ref<string[]>([])
const channelForm = reactive({
  name: '',
  localizations: [] as ChannelLocalizationEntry[],
})
const releaseForm = reactive({
  version: '',
  localizations: [] as ReleaseLocalizationEntry[],
  metadataEntries: [] as ReleaseMetadataEntry[],
  forceUpdate: false,
  artifacts: [] as ReleaseArtifactEntry[],
})

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
    metrics.value = null
    uploadApiKeys.value = []
    oneTimeUploadApiKey.value = ''
    if (product.value) await loadUploadApiKeys()
  } catch (error) {
    product.value = null
    channels.value = []
    selectedChannel.value = null
    releases.value = []
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
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  }
}

function openCreateChannel() {
  editingChannelId.value = null
  channelForm.name = ''
  channelForm.localizations = [newChannelLocalization()]
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
    const displayNames = channelLocalizedMap('displayName')
    const descriptions = channelLocalizedMap('description')
    const input = {
      displayName: localizedFormFallback(displayNames, channelForm.name),
      displayNames,
      description: localizedFormFallback(descriptions, ''),
      descriptions,
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
  if (!product.value || !window.confirm(t('developer.apps.distribution.deleteUploadKeyConfirm'))) return
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
    $toast.success(t('developer.apps.distribution.published'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    publishingId.value = null
  }
}

async function deleteRelease(release: DistributionRelease) {
  if (!product.value || release.status !== 'draft') return
  if (!window.confirm(t('developer.apps.distribution.deleteReleaseConfirm', { version: release.version }))) return
  deletingId.value = release.id
  try {
    await deleteDistributionRelease(product.value.id, release.id)
    releases.value = releases.value.filter((item) => item.id !== release.id)
    $toast.success(t('developer.apps.distribution.releaseDeleted'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    deletingId.value = null
  }
}

async function loadMetrics() {
  if (!product.value) return
  isLoadingMetrics.value = true
  try {
    metrics.value = await fetchDistributionMetrics(product.value.id)
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isLoadingMetrics.value = false
  }
}

watch([() => props.publisherName, () => props.productSlug], loadProduct, { immediate: true })
</script>

