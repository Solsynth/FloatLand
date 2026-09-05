<template>
  <ClientOnly>
    <DrawerRoot :open="isOpen" @update:open="handleDrawerClose">
      <DrawerPortal>
        <DrawerOverlay class="fixed inset-0 z-50 bg-black/40" />
        <DrawerContent
          class="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-[min(88vh,720px)] max-w-2xl flex-col overflow-hidden rounded-t-box bg-base-100 shadow-sm outline-none"
        >
          <!-- Drag handle -->
          <div class="flex justify-center bg-base-200/70 pb-1 pt-3">
            <div class="h-1 w-10 rounded-full bg-base-content/20" />
          </div>

          <!-- Header -->
          <div
            class="flex items-center justify-between gap-2 bg-base-200/70 px-3 py-2 sm:px-4"
          >
            <div class="flex min-w-0 items-center gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle shrink-0"
                :title="t('compose.cancel')"
                @click="handleClose"
              >
                <IconX class="h-5 w-5" />
              </button>
              <h3 class="truncate text-base font-semibold">{{ dialogTitle }}</h3>
            </div>

            <div class="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <span
                v-if="lastSaved"
                class="mr-1 hidden text-xs text-base-content/45 sm:inline"
              >
                {{ t('compose.savedAgo', { time: formatTimeAgo(lastSaved) }) }}
              </span>

              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                :class="{ 'bg-base-200': showPreview }"
                :title="showPreview ? t('compose.backToEditor') : t('compose.preview')"
                @click="showPreview = !showPreview"
              >
                <IconEyeOff v-if="showPreview" class="h-5 w-5" />
                <IconEye v-else class="h-5 w-5" />
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle"
                :title="t('compose.postSettings')"
                @click="showSettingsPanel = true"
              >
                <IconSettings class="h-5 w-5" />
              </button>

              <button
                type="button"
                class="btn btn-primary btn-sm gap-1.5 px-3"
                :disabled="!canSubmit"
                @click="handleSubmit"
              >
                <IconLoader v-if="submitting" class="h-4 w-4 animate-spin" />
                <IconSend v-else class="h-4 w-4" />
                <span class="hidden sm:inline">{{ submitButtonText }}</span>
              </button>
            </div>
          </div>

          <!-- Context banners -->
          <div
            v-if="originalPost"
            class="flex items-center gap-2 bg-primary/10 px-4 py-2 text-sm text-primary"
          >
            <IconPencil class="h-4 w-4 shrink-0" />
            <span class="font-medium">{{ t('compose.editing') }}</span>
          </div>

          <button
            v-if="replyingTo"
            type="button"
            class="flex w-full items-start gap-2 bg-base-200/40 px-4 py-2.5 text-left transition-colors hover:bg-base-200/70"
            @click="openReferencePost(replyingTo)"
          >
            <IconReply class="mt-0.5 h-4 w-4 shrink-0 text-base-content/60" />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-base-content/60">
                {{ t('compose.replyingTo') }}
              </p>
              <div class="mt-0.5 flex items-center gap-2">
                <div class="avatar">
                  <div class="h-5 w-5 rounded-full">
                    <FileImage
                      v-if="replyingTo.publisher?.picture?.id"
                      :src="getFileUrlSafe(replyingTo.publisher.picture.id)"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center bg-primary/15 text-[10px] text-primary"
                    >
                      {{ getInitials(publisherDisplayName(replyingTo.publisher)) }}
                    </div>
                  </div>
                </div>
                <span class="truncate text-sm font-medium">
                  {{ publisherDisplayName(replyingTo.publisher) }}
                </span>
                <span class="truncate text-sm text-base-content/45">
                  {{ replyingTo.content.slice(0, 80) }}
                </span>
              </div>
            </div>
          </button>

          <button
            v-if="forwardingTo"
            type="button"
            class="flex w-full items-start gap-2 bg-base-200/40 px-4 py-2.5 text-left transition-colors hover:bg-base-200/70"
            @click="openReferencePost(forwardingTo)"
          >
            <IconForward class="mt-0.5 h-4 w-4 shrink-0 text-base-content/60" />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium text-base-content/60">
                {{ t('compose.forwarding') }}
              </p>
              <div class="mt-0.5 flex items-center gap-2">
                <div class="avatar">
                  <div class="h-5 w-5 rounded-full">
                    <FileImage
                      v-if="forwardingTo.publisher?.picture?.id"
                      :src="getFileUrlSafe(forwardingTo.publisher.picture.id)"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] text-primary"
                    >
                      {{ getInitials(publisherDisplayName(forwardingTo.publisher)) }}
                    </div>
                  </div>
                </div>
                <span class="truncate text-sm font-medium">
                  {{ publisherDisplayName(forwardingTo.publisher) }}
                </span>
                <span class="truncate text-sm text-base-content/45">
                  {{ forwardingTo.content.slice(0, 80) }}
                </span>
              </div>
            </div>
          </button>

          <!-- Body -->
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div v-if="showPreview" class="p-4 sm:p-5">
              <div
                v-if="content.trim().length > 0"
                class="prose prose-sm max-w-none"
                @click="handleMarkdownClick"
                v-html="renderedPreviewContent"
              />
              <div
                v-else
                class="flex flex-col items-center justify-center gap-2 py-16 text-base-content/45"
              >
                <IconFileText class="h-10 w-10" />
                <p class="text-sm">{{ t('compose.previewEmpty') }}</p>
              </div>
            </div>

            <div v-else class="p-4 sm:p-5">
              <div class="flex gap-3">
                <!-- Publisher avatar (tap to switch) -->
                <div class="relative shrink-0 pt-1" data-compose-menu>
                  <button
                    type="button"
                    class="avatar block"
                    :title="t('compose.selectPublisher')"
                    @click.stop="publisherPickerOpen = !publisherPickerOpen"
                  >
                    <div class="h-10 w-10 rounded-full ring-1 ring-base-300">
                      <FileImage
                        v-if="currentPublisher?.picture?.id"
                        :src="getFileUrlSafe(currentPublisher.picture.id)"
                        alt=""
                        class="h-full w-full object-cover"
                      />
                      <div
                        v-else
                        class="flex h-full w-full items-center justify-center bg-base-200 text-sm font-semibold text-base-content/50"
                      >
                        <IconCircleQuestionMark
                          v-if="!currentPublisher"
                          class="h-5 w-5"
                        />
                        <span v-else>
                          {{ getInitials(publisherDisplayName(currentPublisher)) }}
                        </span>
                      </div>
                    </div>
                  </button>

                  <!-- Publisher dropdown -->
                  <div
                    v-if="publisherPickerOpen"
                    class="absolute left-0 top-12 z-20 w-56 overflow-hidden rounded-box bg-base-100 shadow-sm"
                    @click.stop
                  >
                    <button
                      v-for="pub in publishers"
                      :key="pub.id"
                      type="button"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-base-200"
                      :class="{ 'bg-primary/10': currentPublisher?.id === pub.id }"
                      @click="selectPublisher(pub)"
                    >
                      <div class="avatar">
                        <div class="h-7 w-7 rounded-full">
                          <FileImage
                            v-if="pub.picture?.id"
                            :src="getFileUrlSafe(pub.picture.id)"
                            alt=""
                            class="h-full w-full object-cover"
                          />
                          <div
                            v-else
                            class="flex h-full w-full items-center justify-center bg-base-200 text-[10px] font-bold"
                          >
                            {{ getInitials(publisherDisplayName(pub)) }}
                          </div>
                        </div>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-medium">
                          {{ pub.nick || pub.name }}
                        </div>
                        <div class="truncate text-[11px] text-base-content/40">
                          @{{ pub.name }}
                        </div>
                      </div>
                      <IconCheck
                        v-if="currentPublisher?.id === pub.id"
                        class="h-4 w-4 shrink-0 text-primary"
                      />
                    </button>
                    <p
                      v-if="publishers.length === 0"
                      class="px-3 py-3 text-sm text-base-content/50"
                    >
                      {{ t('compose.noPublishers') }}
                    </p>
                  </div>
                </div>

                <!-- Fields -->
                <div class="min-w-0 flex-1">
                  <div
                    v-if="!currentPublisher"
                    class="mb-3 flex items-start gap-2 rounded-lg bg-base-200/80 px-3 py-2.5 text-sm text-base-content/70"
                  >
                    <IconInfo class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{{ t('compose.noPublisher') }}</span>
                  </div>

                  <input
                    v-model="title"
                    type="text"
                    :placeholder="t('compose.titlePlaceholder')"
                    class="w-full border-0 bg-transparent px-1 py-1.5 text-base font-medium outline-none placeholder:text-base-content/35 focus:ring-0"
                    :disabled="!currentPublisher"
                    @input="markDirty"
                  />

                  <textarea
                    v-model="description"
                    rows="1"
                    :placeholder="t('compose.descriptionPlaceholder')"
                    class="w-full resize-none border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-base-content/35 focus:ring-0"
                    :disabled="!currentPublisher"
                    @input="onDescriptionInput"
                  />

                  <div class="relative">
                    <textarea
                      ref="contentRef"
                      v-model="content"
                      :placeholder="t('compose.contentPlaceholder')"
                      class="min-h-[140px] w-full resize-y border-0 bg-transparent px-1 py-2 text-sm leading-relaxed outline-none placeholder:text-base-content/35 focus:ring-0"
                      :disabled="!currentPublisher"
                      @keydown="handleKeyDown"
                      @input="onContentInput"
                    />
                    <div
                      class="pointer-events-none absolute bottom-1 right-1 text-[11px] text-base-content/30"
                    >
                      {{ content.length }}
                    </div>

                    <!-- Autocomplete dropdown -->
                    <div
                      v-if="autocompleteOpen && autocompleteItems.length > 0"
                      class="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-box bg-base-100 shadow-sm"
                    >
                      <button
                        v-for="(item, idx) in autocompleteItems"
                        :key="`${item.type}-${item.keyword}-${idx}`"
                        type="button"
                        class="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-base-200"
                        :class="{ 'bg-base-200': idx === autocompleteIndex }"
                        @mousedown.prevent="applyAutocomplete(item)"
                      >
                        <div
                          class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-base-200 text-[10px] font-semibold text-base-content/50"
                        >
                          <FileImage
                            v-if="item.pictureId"
                            :src="getFileUrlSafe(item.pictureId)"
                            alt=""
                            class="h-full w-full object-cover"
                          />
                          <span v-else>{{ item.type.slice(0, 1).toUpperCase() }}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="truncate text-sm font-medium">{{ item.title }}</div>
                          <div class="truncate text-[11px] text-base-content/45">
                            {{ item.keyword }}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Active meta chips -->
              <div
                v-if="tags.length || categories.length || realm || slug"
                class="mt-3 flex flex-wrap gap-1.5 px-1"
              >
                <span
                  v-if="slug"
                  class="badge badge-ghost badge-sm gap-1 font-mono"
                >
                  /{{ slug }}
                </span>
                <span
                  v-for="tag in tags"
                  :key="tag"
                  class="badge badge-primary badge-sm gap-1"
                >
                  #{{ tag }}
                </span>
                <span
                  v-for="cat in categories"
                  :key="cat.id"
                  class="badge badge-outline badge-sm"
                >
                  {{ cat.name || cat.slug }}
                </span>
                <span
                  v-if="realm"
                  class="badge badge-ghost badge-sm gap-1"
                >
                  <IconBuilding class="h-3 w-3" />
                  {{ realm.name }}
                </span>
              </div>

              <ComposeAttachmentGrid
                class="mt-4"
                :attachments="attachments"
                @add="handleAddAttachments"
                @remove="removeAttachment"
                @move="handleMoveAttachment"
                @insert="handleInsertAttachment"
              />
            </div>
          </div>

          <!-- Toolbar -->
          <div
            class="bg-base-200/70 px-2 py-2 sm:px-3"
          >
            <div class="flex items-center gap-0.5">
              <div class="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
                <!-- Attach menu -->
                <div class="relative" data-compose-menu>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-circle"
                    :title="t('compose.attach')"
                    :disabled="!currentPublisher"
                    @click.stop="attachMenuOpen = !attachMenuOpen"
                  >
                    <IconPaperclip class="h-4 w-4" />
                  </button>
                  <div
                    v-if="attachMenuOpen"
                    class="absolute bottom-full left-0 z-30 mb-2 w-44 overflow-hidden rounded-box bg-base-100 py-1 shadow-sm"
                    @click.stop
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-base-200"
                      @click="pickLocalFiles('image/*')"
                    >
                      <IconImage class="h-4 w-4" />
                      {{ t('compose.addPhoto') }}
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-base-200"
                      @click="pickLocalFiles('video/*')"
                    >
                      <IconVideo class="h-4 w-4" />
                      {{ t('compose.addVideo') }}
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-base-200"
                      @click="pickLocalFiles('*/*')"
                    >
                      <IconFile class="h-4 w-4" />
                      {{ t('compose.uploadFile') }}
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-base-200"
                      @click="openFilePicker"
                    >
                      <IconCloud class="h-4 w-4" />
                      {{ t('compose.linkCloudFile') }}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  :title="t('compose.insertBold')"
                  :disabled="!currentPublisher"
                  @click="wrapSelection('**', '**')"
                >
                  <IconBold class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  :title="t('compose.insertItalic')"
                  :disabled="!currentPublisher"
                  @click="wrapSelection('_', '_')"
                >
                  <IconItalic class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  :title="t('compose.insertLink')"
                  :disabled="!currentPublisher"
                  @click="insertLink"
                >
                  <IconLink class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  :title="t('compose.insertMention')"
                  :disabled="!currentPublisher"
                  @click="insertAtCursor('@')"
                >
                  <IconAtSign class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  :title="t('compose.insertSticker')"
                  :disabled="!currentPublisher"
                  @click="insertAtCursor(':')"
                >
                  <IconSmile class="h-4 w-4" />
                </button>

                <div class="mx-1 h-5 w-px shrink-0 bg-base-300" />

                <button
                  type="button"
                  class="btn btn-ghost btn-sm gap-1.5 rounded-lg px-2"
                  :title="t('compose.visibility')"
                  @click="showSettingsPanel = true"
                >
                  <IconGlobe v-if="visibility === 0" class="h-3.5 w-3.5" />
                  <IconUsers v-else-if="visibility === 1" class="h-3.5 w-3.5" />
                  <IconEyeOff v-else-if="visibility === 2" class="h-3.5 w-3.5" />
                  <IconLock v-else class="h-3.5 w-3.5" />
                  <span class="hidden text-xs sm:inline">{{ visibilityLabelText }}</span>
                </button>
              </div>

              <div class="flex shrink-0 items-center gap-0.5">
                <button
                  v-if="!originalPost"
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  :disabled="!hasContent"
                  :title="t('compose.saveDraft')"
                  @click="saveDraftManually"
                >
                  <IconSave class="h-4 w-4" />
                </button>
                <button
                  v-if="!originalPost"
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle"
                  :title="t('compose.drafts')"
                  @click="showDraftsPanel = true"
                >
                  <IconFileText class="h-4 w-4" />
                </button>
                <span class="ml-1 hidden text-[11px] text-base-content/40 lg:inline">
                  <kbd class="kbd kbd-xs">⌘</kbd>
                  <kbd class="kbd kbd-xs">↵</kbd>
                </span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
    <template #fallback>
      <span />
    </template>
  </ClientOnly>

  <input
    ref="localFileInput"
    type="file"
    class="hidden"
    multiple
    @change="onLocalFilesPicked"
  />

  <CloudFileDrawer
    v-model:open="filePickerOpen"
    :allow-multiple="true"
    :crop-aspect-ratio="null"
    usage="post.attachment"
    @select="handleFileSelected"
  />

  <!-- Settings -->
  <ClientOnly>
    <DrawerRoot v-model:open="showSettingsPanel">
      <DrawerPortal>
        <DrawerOverlay class="fixed inset-0 z-[60] bg-black/40" />
        <DrawerContent
          class="fixed bottom-0 left-0 right-0 z-[60] mx-auto flex max-h-[75vh] max-w-md flex-col rounded-t-box bg-base-100 shadow-sm outline-none"
        >
          <div class="flex justify-center pb-1 pt-3">
            <div class="h-1 w-10 rounded-full bg-base-content/20" />
          </div>
          <div class="flex items-center justify-between px-5 pb-3">
            <h3 class="font-semibold">{{ t('compose.postSettings') }}</h3>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square"
              @click="showSettingsPanel = false"
            >
              <IconX class="h-4 w-4" />
            </button>
          </div>

          <div class="flex-1 space-y-5 overflow-y-auto px-5 pb-6">
            <!-- Visibility -->
            <div>
              <label class="mb-2 block text-xs font-medium text-base-content/60">
                {{ t('compose.visibility') }}
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-box bg-base-200/70 px-3 py-2.5 text-left text-sm transition-colors"
                  :class="
                    visibility === 0
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-base-300'
                  "
                  @click="visibility = 0; markDirty()"
                >
                  <IconGlobe class="h-4 w-4 shrink-0" />
                  {{ t('compose.public') }}
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-box bg-base-200/70 px-3 py-2.5 text-left text-sm transition-colors"
                  :class="
                    visibility === 1
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-base-300'
                  "
                  @click="visibility = 1; markDirty()"
                >
                  <IconUsers class="h-4 w-4 shrink-0" />
                  {{ t('compose.friends') }}
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-box bg-base-200/70 px-3 py-2.5 text-left text-sm transition-colors"
                  :class="
                    visibility === 2
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-base-300'
                  "
                  @click="visibility = 2; markDirty()"
                >
                  <IconEyeOff class="h-4 w-4 shrink-0" />
                  {{ t('compose.unlisted') }}
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-box bg-base-200/70 px-3 py-2.5 text-left text-sm transition-colors"
                  :class="
                    visibility === 3
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-base-300'
                  "
                  @click="visibility = 3; markDirty()"
                >
                  <IconLock class="h-4 w-4 shrink-0" />
                  {{ t('compose.private') }}
                </button>
              </div>
            </div>

            <!-- Language -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-base-content/60">
                {{ t('compose.language') }}
              </label>
              <select
                v-model="language"
                class="select select-bordered select-sm w-full"
                @change="markDirty"
              >
                <option :value="null">{{ t('compose.autoDetect') }}</option>
                <option value="en">{{ t('compose.languageEn') }}</option>
                <option value="zh">{{ t('compose.languageZh') }}</option>
                <option value="ja">{{ t('compose.languageJa') }}</option>
                <option value="ko">{{ t('compose.languageKo') }}</option>
                <option value="es">{{ t('compose.languageEs') }}</option>
                <option value="fr">{{ t('compose.languageFr') }}</option>
                <option value="de">{{ t('compose.languageDe') }}</option>
                <option value="ru">{{ t('compose.languageRu') }}</option>
                <option value="pt">{{ t('compose.languagePt') }}</option>
              </select>
            </div>

            <!-- Slug -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-base-content/60">
                {{ t('compose.slug') }}
              </label>
              <input
                v-model="slug"
                type="text"
                :placeholder="t('compose.slugPlaceholder')"
                class="input input-bordered input-sm w-full font-mono"
                @input="markDirty"
              />
            </div>

            <!-- Tags -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-base-content/60">
                {{ t('compose.tags') }}
              </label>
              <div
                class="flex min-h-10 flex-wrap items-center gap-1.5 rounded-box bg-base-200/70 px-2 py-1.5"
              >
                <span
                  v-for="tag in tags"
                  :key="tag"
                  class="badge badge-primary gap-1"
                >
                  #{{ tag }}
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-circle -mr-1 h-4 min-h-0 w-4 p-0"
                    @click="removeTag(tag)"
                  >
                    <IconX class="h-3 w-3" />
                  </button>
                </span>
                <input
                  v-model="tagInput"
                  type="text"
                  :placeholder="t('compose.addTagPlaceholder')"
                  class="min-w-[100px] flex-1 border-0 bg-transparent p-0 text-sm outline-none"
                  @keydown.enter.prevent="commitTagInput"
                  @keydown.tab.prevent="commitTagInput"
                  @input="onTagInput"
                  @blur="commitTagInput"
                />
              </div>
              <div
                v-if="tagSuggestions.length > 0"
                class="mt-1 max-h-36 overflow-y-auto rounded-box bg-base-100 shadow-sm"
              >
                <button
                  v-for="s in tagSuggestions"
                  :key="s.slug"
                  type="button"
                  class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-base-200"
                  @mousedown.prevent="addSuggestedTag(s.slug)"
                >
                  <span>#{{ s.slug }}</span>
                  <span class="text-xs text-base-content/40">
                    {{ t('compose.tagUsage', { count: s.usage }) }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Categories -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-base-content/60">
                {{ t('compose.categories') }}
              </label>
              <div
                v-if="availableCategories.length === 0"
                class="text-xs text-base-content/45"
              >
                {{ t('compose.noCategories') }}
              </div>
              <div v-else class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                <button
                  v-for="cat in availableCategories"
                  :key="cat.id"
                  type="button"
                  class="badge badge-lg gap-1 border px-2.5 py-3 text-xs font-normal transition-colors"
                  :class="
                    isCategorySelected(cat)
                      ? 'badge-primary'
                      : 'badge-ghost hover:bg-base-200'
                  "
                  @click="toggleCategory(cat)"
                >
                  {{ cat.name || cat.slug }}
                </button>
              </div>
              <p
                v-if="categories.length"
                class="mt-1.5 text-xs text-base-content/45"
              >
                {{ t('compose.selected', { count: categories.length }) }}
              </p>
            </div>

            <!-- Realm -->
            <div>
              <label class="mb-1.5 block text-xs font-medium text-base-content/60">
                {{ t('compose.realm') }}
              </label>
              <select
                class="select select-bordered select-sm w-full"
                :value="realmId ?? ''"
                @change="onRealmChange"
              >
                <option value="">{{ t('compose.noRealm') }}</option>
                <option
                  v-for="r in availableRealms"
                  :key="r.id"
                  :value="r.id"
                >
                  {{ r.name }}
                </option>
              </select>
            </div>

            <button
              v-if="!originalPost"
              type="button"
              class="btn btn-ghost btn-sm w-full gap-2"
              :disabled="!hasContent"
              @click="saveDraftManually"
            >
              <IconSave class="h-4 w-4" />
              {{ t('compose.saveDraftNow') }}
            </button>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
    <template #fallback>
      <span />
    </template>
  </ClientOnly>

  <!-- Drafts manager -->
  <ClientOnly>
    <DrawerRoot v-model:open="showDraftsPanel">
      <DrawerPortal>
        <DrawerOverlay class="fixed inset-0 z-[60] bg-black/40" />
        <DrawerContent
          class="fixed bottom-0 left-0 right-0 z-[60] mx-auto flex max-h-[70vh] max-w-md flex-col rounded-t-box bg-base-100 shadow-sm outline-none"
        >
          <div class="flex justify-center pb-1 pt-3">
            <div class="h-1 w-10 rounded-full bg-base-content/20" />
          </div>
          <div class="flex items-center justify-between px-5 pb-3">
            <h3 class="font-semibold">{{ t('compose.drafts') }}</h3>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square"
              @click="showDraftsPanel = false"
            >
              <IconX class="h-4 w-4" />
            </button>
          </div>

          <div class="px-5 pb-3">
            <input
              v-model="draftSearch"
              type="search"
              :placeholder="t('compose.searchDrafts')"
              class="input input-bordered input-sm w-full"
            />
          </div>

          <div class="flex-1 overflow-y-auto px-3 pb-4">
            <div
              v-if="filteredDrafts.length === 0"
              class="flex flex-col items-center gap-2 py-12 text-base-content/45"
            >
              <IconFileText class="h-10 w-10" />
              <p class="text-sm">
                {{ draftSearch ? t('compose.noSearchResults') : t('compose.noDrafts') }}
              </p>
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="draft in filteredDrafts"
                :key="draft.id"
                class="group flex items-start gap-2 rounded-box px-3 py-2.5 transition-colors hover:bg-base-200"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 text-left"
                  @click="restoreDraft(draft.id)"
                >
                  <p class="truncate text-sm font-medium">
                    {{ draft.title || t('compose.untitledDraft') }}
                  </p>
                  <p
                    v-if="draft.content"
                    class="mt-0.5 line-clamp-2 text-xs text-base-content/50"
                  >
                    {{ draft.content }}
                  </p>
                  <p class="mt-1 text-[11px] text-base-content/35">
                    {{ formatTimeAgo(draft.updatedAt) }}
                    <span v-if="draft.attachments.length">
                      · {{ t('compose.attachmentCount', { count: draft.attachments.length }) }}
                    </span>
                  </p>
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle opacity-60 group-hover:opacity-100"
                  :title="t('compose.deleteDraft')"
                  @click="confirmDeleteDraft(draft.id)"
                >
                  <IconTrash2 class="h-3.5 w-3.5 text-error" />
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="filteredDrafts.length > 0"
            class="bg-base-200/70 px-5 py-3"
          >
            <button
              type="button"
              class="btn btn-outline btn-error btn-sm w-full"
              @click="confirmClearDrafts"
            >
              {{ t('compose.clearAllDrafts') }}
            </button>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
    <template #fallback>
      <span />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  DrawerRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
} from 'vaul-vue'
import type { Post, Publisher, FileAttachment, Category } from '~/types/post'
import type { Realm } from '~/types/realm'
import type { SnCloudFile } from '~/types/drive'
import type { ComposeDraft } from '~/composables/useCompose'
import { getFileUrl } from '~/utils/files'
import {
  fetchJson,
  API_BASE_URL,
  fetchCategories,
  fetchTags,
  fetchRealms,
  type PostCategory,
  type PostTag,
} from '~/utils/api'
import { renderMarkdown } from '~/utils/markdown'

interface AutocompleteItem {
  type: string
  keyword: string
  title: string
  pictureId?: string
}

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [post: Post]
}>()

const { t } = useI18n()
const isOpen = computed(() => props.open ?? true)

const compose = useCompose()
const {
  title,
  description,
  content,
  slug,
  visibility,
  language,
  tags,
  categories,
  realmId,
  realm,
  attachments,
  publishers,
  currentPublisher,
  submitting,
  lastSaved,
  canSubmit,
  draftList,
  loadDraft,
  deleteDraft,
  clearDrafts,
  replyingTo,
  forwardingTo,
  originalPost,
  hasContent,
  addAttachments,
  removeAttachment,
  moveAttachment,
  setAttachmentUploaded,
  setPublishers,
  setCurrentPublisher,
  setRealm,
  saveCurrentDraft,
  applyDraft,
  startAutoSave,
  stopAutoSave,
  reset,
  markDirty,
  addTag,
  removeTag,
  toggleCategory,
} = compose

const contentRef = ref<HTMLTextAreaElement | null>(null)
const localFileInput = ref<HTMLInputElement | null>(null)
const localFileAccept = ref('*/*')
const showPreview = ref(false)
const showSettingsPanel = ref(false)
const showDraftsPanel = ref(false)
const filePickerOpen = ref(false)
const attachMenuOpen = ref(false)
const publisherPickerOpen = ref(false)
const checkedDraftRestore = ref(false)
const draftSearch = ref('')
const tagInput = ref('')
const tagSuggestions = ref<PostTag[]>([])
const availableCategories = ref<Category[]>([])
const availableRealms = ref<Realm[]>([])

const autocompleteOpen = ref(false)
const autocompleteItems = ref<AutocompleteItem[]>([])
const autocompleteIndex = ref(0)
let autocompleteTimer: ReturnType<typeof setTimeout> | null = null
let tagSuggestTimer: ReturnType<typeof setTimeout> | null = null

const visibilityLabelText = computed(() => {
  switch (visibility.value) {
    case 0:
      return t('compose.public')
    case 1:
      return t('compose.friends')
    case 2:
      return t('compose.unlisted')
    case 3:
      return t('compose.private')
    default:
      return t('compose.public')
  }
})

const dialogTitle = computed(() => {
  if (originalPost.value) return t('compose.editPost')
  if (replyingTo.value) return t('compose.writeReply')
  if (forwardingTo.value) return t('compose.forwardPost')
  return t('compose.newPost')
})

const submitButtonText = computed(() => {
  if (submitting.value) return t('compose.posting')
  if (originalPost.value) return t('compose.save')
  return t('compose.post')
})

const renderedPreviewContent = computed(() =>
  renderMarkdown(content.value || ''),
)

const filteredDrafts = computed(() => {
  const q = draftSearch.value.trim().toLowerCase()
  if (!q) return draftList.value
  return draftList.value.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q),
  )
})

onMounted(() => {
  loadPublishers()
  loadSettingsData()
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  stopAutoSave()
  document.removeEventListener('click', onDocumentClick)
  if (autocompleteTimer) clearTimeout(autocompleteTimer)
  if (tagSuggestTimer) clearTimeout(tagSuggestTimer)
})

watch(isOpen, (open) => {
  if (open) {
    startAutoSave()
    maybeRestoreLatestDraft()
    loadPublishers()
    loadSettingsData()
  } else {
    stopAutoSave()
    attachMenuOpen.value = false
    publisherPickerOpen.value = false
    autocompleteOpen.value = false
  }
})

function onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest?.('[data-compose-menu]')) {
    attachMenuOpen.value = false
    publisherPickerOpen.value = false
  }
}

async function loadPublishers() {
  try {
    const response = await fetchJson<Publisher[]>(
      '/sphere/publishers?mine=true&take=100',
    )
    if (response) setPublishers(response)
  } catch (error) {
    console.error('Failed to load publishers:', error)
  }
}

async function loadSettingsData() {
  try {
    const [cats, realms] = await Promise.all([
      fetchCategories(100, 0).catch(() => ({ categories: [] as PostCategory[] })),
      fetchRealms().catch(() => [] as Realm[]),
    ])
    availableCategories.value = (cats.categories || []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      color: c.color,
    }))
    availableRealms.value = realms || []
    if (realmId.value && !realm.value) {
      const found = availableRealms.value.find((r) => r.id === realmId.value)
      if (found) setRealm(found)
    }
  } catch (e) {
    console.error('Failed to load compose settings data:', e)
  }
}

async function maybeRestoreLatestDraft() {
  if (checkedDraftRestore.value) return
  checkedDraftRestore.value = true
  if (originalPost.value || replyingTo.value || forwardingTo.value) return
  if (hasContent.value) return

  const latest = draftList.value[0]
  if (!latest) return

  const { confirm } = useAlert()
  const shouldRestore = await confirm(
    t('compose.restoreDraftTitle'),
    t('compose.restoreDraftMessage'),
  )
  if (!shouldRestore) return
  restoreDraft(latest.id, false)
}

function selectPublisher(pub: Publisher) {
  setCurrentPublisher(pub)
  publisherPickerOpen.value = false
}

function isCategorySelected(cat: Category) {
  return categories.value.some((c) => c.id === cat.id)
}

function onRealmChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  if (!value) {
    setRealm(null)
    return
  }
  const found = availableRealms.value.find((r) => r.id === value) || null
  setRealm(found)
}

function onDescriptionInput(e: Event) {
  markDirty()
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 96)}px`
}

function onContentInput() {
  markDirty()
  scheduleAutocomplete()
}

function scheduleAutocomplete() {
  if (autocompleteTimer) clearTimeout(autocompleteTimer)
  autocompleteTimer = setTimeout(runAutocomplete, 350)
}

async function runAutocomplete() {
  const text = content.value
  const textarea = contentRef.value
  const caret = textarea?.selectionStart ?? text.length
  const before = text.slice(0, caret)
  const match = before.match(/([@:])([^\s@:]*)$/)
  if (!match) {
    autocompleteOpen.value = false
    autocompleteItems.value = []
    return
  }

  const query = match[0]
  try {
    const result = await fetchJson<
      Array<{ type: string; keyword: string; data?: Record<string, unknown> }>
    >('/sphere/autocomplete', {
      method: 'POST',
      body: JSON.stringify({ content: query }),
    })

    autocompleteItems.value = (result || []).map((item) => {
      const data = item.data || {}
      let title = item.keyword
      let pictureId: string | undefined

      if (item.type === 'user' || item.type === 'publisher' || item.type === 'realm') {
        title =
          (data.nick as string) ||
          (data.name as string) ||
          item.keyword
        const picture = data.picture as { id?: string } | undefined
        pictureId = picture?.id
        if (!pictureId && data.profile) {
          const profile = data.profile as { picture?: { id?: string } }
          pictureId = profile.picture?.id
        }
      } else if (item.type === 'sticker') {
        title =
          ((data.name as string) || (data.slug as string) || item.keyword)
        const image = data.image as { id?: string } | undefined
        pictureId = image?.id
      }

      return {
        type: item.type,
        keyword: item.keyword,
        title,
        pictureId,
      }
    })
    autocompleteIndex.value = 0
    autocompleteOpen.value = autocompleteItems.value.length > 0
  } catch {
    autocompleteOpen.value = false
    autocompleteItems.value = []
  }
}

function applyAutocomplete(item: AutocompleteItem) {
  const text = content.value
  const textarea = contentRef.value
  const caret = textarea?.selectionStart ?? text.length
  const before = text.slice(0, caret)
  const after = text.slice(caret)
  const match = before.match(/([@:])([^\s@:]*)$/)
  if (!match || match.index === undefined) return

  const start = match.index
  const insertion = item.keyword
  content.value = before.slice(0, start) + insertion + after
  markDirty()
  autocompleteOpen.value = false
  autocompleteItems.value = []

  nextTick(() => {
    if (!textarea) return
    const pos = start + insertion.length
    textarea.focus()
    textarea.setSelectionRange(pos, pos)
  })
}

function onTagInput() {
  if (tagSuggestTimer) clearTimeout(tagSuggestTimer)
  const q = tagInput.value.trim().replace(/^#/, '')
  if (q.length < 1) {
    tagSuggestions.value = []
    return
  }
  tagSuggestTimer = setTimeout(async () => {
    try {
      const { tags: found } = await fetchTags(12, 0)
      tagSuggestions.value = found
        .filter(
          (tag) =>
            tag.slug.includes(q.toLowerCase()) &&
            !tags.value.includes(tag.slug),
        )
        .slice(0, 8)
    } catch {
      tagSuggestions.value = []
    }
  }, 250)
}

function commitTagInput() {
  const value = tagInput.value.trim()
  if (!value) return
  addTag(value)
  tagInput.value = ''
  tagSuggestions.value = []
}

function addSuggestedTag(slugValue: string) {
  addTag(slugValue)
  tagInput.value = ''
  tagSuggestions.value = []
}

function openFilePicker() {
  attachMenuOpen.value = false
  filePickerOpen.value = true
}

function pickLocalFiles(accept: string) {
  attachMenuOpen.value = false
  localFileAccept.value = accept
  if (localFileInput.value) {
    localFileInput.value.accept = accept
    localFileInput.value.value = ''
    localFileInput.value.click()
  }
}

function onLocalFilesPicked(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    addAttachments(input.files)
  }
}

function handleFileSelected(files: SnCloudFile | SnCloudFile[] | null) {
  if (!files) return
  const fileArray = Array.isArray(files) ? files : [files]

  for (const cloudFile of fileArray) {
    const blob = new Blob([], { type: cloudFile.mimeType })
    const file = new File([blob], cloudFile.name, { type: cloudFile.mimeType })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    addAttachments(dataTransfer.files)

    const newAttachment = attachments.value[attachments.value.length - 1]
    if (newAttachment) {
      setAttachmentUploaded(newAttachment.id, cloudFile as unknown as FileAttachment)
    }
  }
}

function handleAddAttachments(files: FileList) {
  addAttachments(files)
}

function handleMoveAttachment(index: number, direction: 'up' | 'down') {
  moveAttachment(index, direction)
}

function handleInsertAttachment(id: string) {
  const attachment = attachments.value.find((a) => a.id === id)
  if (!attachment) return

  const fileName = attachment.cloudFile?.name || attachment.file.name
  const fileId = attachment.cloudFile?.id || 'PENDING'
  insertAtCursor(`![${fileName}](solian://files/${fileId})`)
}

function wrapSelection(before: string, after: string) {
  const textarea = contentRef.value
  if (!textarea || !currentPublisher.value) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = content.value.slice(start, end) || 'text'
  const next =
    content.value.slice(0, start) + before + selected + after + content.value.slice(end)
  content.value = next
  markDirty()

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selected.length,
    )
  })
}

function insertLink() {
  const textarea = contentRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = content.value.slice(start, end) || 'link'
  const md = `[${selected}](https://)`
  content.value =
    content.value.slice(0, start) + md + content.value.slice(end)
  markDirty()
  nextTick(() => {
    textarea.focus()
    const urlStart = start + selected.length + 3
    textarea.setSelectionRange(urlStart, urlStart + 'https://'.length)
  })
}

function insertAtCursor(text: string) {
  const textarea = contentRef.value
  if (!textarea) {
    content.value += text
    markDirty()
    return
  }
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  content.value =
    content.value.slice(0, start) + text + content.value.slice(end)
  markDirty()
  nextTick(() => {
    textarea.focus()
    const pos = start + text.length
    textarea.setSelectionRange(pos, pos)
    scheduleAutocomplete()
  })
}

function handleKeyDown(event: KeyboardEvent) {
  if (autocompleteOpen.value && autocompleteItems.value.length > 0) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      autocompleteIndex.value =
        (autocompleteIndex.value + 1) % autocompleteItems.value.length
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      autocompleteIndex.value =
        (autocompleteIndex.value - 1 + autocompleteItems.value.length) %
        autocompleteItems.value.length
      return
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const item = autocompleteItems.value[autocompleteIndex.value]
      if (item) applyAutocomplete(item)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      autocompleteOpen.value = false
      return
    }
  }

  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (canSubmit.value) handleSubmit()
  }
  if (event.key === 'Escape' && !hasContent.value) {
    handleClose()
  }
}

function handleMarkdownClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const link = target.closest('a') as HTMLAnchorElement | null
  if (!link?.href) return
  if (link.href.startsWith(window.location.origin)) {
    e.preventDefault()
    navigateTo(link.getAttribute('href') || '/')
  }
}

function openReferencePost(post: Post) {
  navigateTo(`/posts/${post.id}`)
}

async function handleSubmit() {
  if (!canSubmit.value || !currentPublisher.value) return
  submitting.value = true

  try {
    const uploadedAttachments = await uploadAttachments()

    const payload: Record<string, unknown> = {
      title: title.value || undefined,
      description: description.value || undefined,
      content: content.value,
      visibility: visibility.value,
      language: language.value,
      tags: tags.value,
      categories: categories.value.map((c) => c.slug),
      attachments: uploadedAttachments
        .map((a) => a.cloudFile?.id)
        .filter(Boolean),
      type: 0,
    }

    if (slug.value.trim()) payload.slug = slug.value.trim()
    if (realmId.value) payload.realm_id = realmId.value
    if (replyingTo.value) payload.replied_post_id = replyingTo.value.id
    if (forwardingTo.value) payload.forwarded_post_id = forwardingTo.value.id

    let response: Post
    const publisherName = currentPublisher.value?.name
    if (!publisherName) throw new Error('No publisher selected')

    const queryParams = new URLSearchParams({ pub: publisherName })

    if (originalPost.value) {
      response = await fetchJson<Post>(
        `/sphere/posts/${originalPost.value.id}?${queryParams.toString()}`,
        { method: 'PATCH', body: JSON.stringify(payload) },
      )
    } else {
      response = await fetchJson<Post>(
        `/sphere/posts?${queryParams.toString()}`,
        { method: 'POST', body: JSON.stringify(payload) },
      )
    }

    stopAutoSave()
    if (compose.currentDraftId.value) {
      deleteDraft(compose.currentDraftId.value)
    }
    emit('submit', response)
    emit('close')
    reset()
  } catch (error) {
    console.error('Failed to submit post:', error)
    const { alert } = useAlert()
    await alert({
      title: t('compose.submitFailed'),
      description: t('compose.submitFailedMessage'),
      confirmText: 'OK',
    })
  } finally {
    submitting.value = false
  }
}

interface UploadAttachment {
  file: File
  cloudFile?: FileAttachment
  uploaded?: boolean
  progress?: number
}

async function uploadAttachments(): Promise<UploadAttachment[]> {
  const results: UploadAttachment[] = []

  for (let i = 0; i < attachments.value.length; i++) {
    const attachment = attachments.value[i]
    if (!attachment) continue
    if (attachment.uploaded && attachment.cloudFile) {
      results.push(attachment)
      continue
    }

    try {
      const formData = new FormData()
      formData.append('file', attachment.file, attachment.file.name)

      attachment.progress = 0

      // Same-origin proxy upload; the browser sends the `sid` cookie.
      const response = await fetch(`/api/proxy/drive/files/upload/direct`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`)

      const data = await response.json()

      let fileData: FileAttachment
      if (data.file) fileData = data.file
      else if (data.file_info) fileData = data.file_info
      else if (data.data?.file) fileData = data.data.file
      else if (data.data?.id) fileData = data.data
      else if (data.id) fileData = data
      else throw new Error('Unexpected upload response format')

      attachment.cloudFile = fileData
      attachment.uploaded = true
      attachment.progress = 100
      results.push(attachment)
    } catch (error) {
      console.error('Failed to upload attachment:', error)
      attachment.progress = undefined
      throw error
    }
  }

  return results
}

function saveDraftManually() {
  saveCurrentDraft()
  showSettingsPanel.value = false
}

function restoreDraft(id: string, closePanel = true) {
  const draft = loadDraft(id) as ComposeDraft | undefined
  if (!draft) return
  applyDraft(draft)
  if (draft.realmId) {
    const found = availableRealms.value.find((r) => r.id === draft.realmId)
    if (found) setRealm(found)
  }
  if (closePanel) showDraftsPanel.value = false
}

async function confirmDeleteDraft(id: string) {
  const { confirm } = useAlert()
  const ok = await confirm(
    t('compose.deleteDraft'),
    t('compose.deleteDraftConfirm'),
  )
  if (ok) deleteDraft(id)
}

async function confirmClearDrafts() {
  const { confirm } = useAlert()
  const ok = await confirm(
    t('compose.clearAllDrafts'),
    t('compose.clearAllDraftsConfirm'),
  )
  if (ok) {
    clearDrafts()
    showDraftsPanel.value = false
  }
}

async function handleClose() {
  if (hasContent.value) {
    // Auto-save draft on dismiss for new posts (Island behavior)
    if (!originalPost.value && !replyingTo.value && !forwardingTo.value) {
      saveCurrentDraft()
    } else {
      const { confirm } = useAlert()
      const confirmed = await confirm(
        t('compose.discardTitle'),
        t('compose.discardMessage'),
      )
      if (!confirmed) return
    }
  }
  stopAutoSave()
  checkedDraftRestore.value = false
  emit('close')
  reset()
}

function handleDrawerClose(open: boolean) {
  if (!open) handleClose()
}

function publisherDisplayName(pub?: Publisher | null) {
  return pub?.nick || pub?.name || '?'
}

function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return t('compose.justNow')
  if (minutes < 60) return t('compose.minutesAgo', { n: minutes })
  if (hours < 24) return t('compose.hoursAgo', { n: hours })
  return date.toLocaleDateString()
}

function getFileUrlSafe(id: string | null | undefined): string | undefined {
  const url = getFileUrl(id ?? undefined)
  return url ?? undefined
}
</script>
