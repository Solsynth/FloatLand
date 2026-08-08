<template>
  <NuxtLayout name="drive">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 shrink-0">
        <div class="flex items-center gap-3">
          <IconPackage class="w-5 h-5 text-base-content/60" />
          <h1 class="text-lg font-semibold">{{ t("drive.recent") }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- Search -->
          <div class="relative hidden sm:block">
            <IconSearch
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40"
            />
            <input
              v-model="searchQuery"
              type="text"
              class="input input-sm input-bordered pl-9 w-48 lg:w-64"
              :placeholder="t('drive.searchFiles')"
              @input="handleSearch"
            />
          </div>

          <!-- Recycle toggle -->
          <button
            class="btn btn-ghost btn-sm btn-circle"
            :class="{ 'text-warning': state.recycled }"
            :title="state.recycled ? t('drive.showActive') : t('drive.showRecycled')"
            @click="handleToggleRecycled"
          >
            <IconTrash2 class="w-5 h-5" />
          </button>

          <!-- View mode toggle -->
          <div class="btn-group">
            <button
              class="btn btn-ghost btn-sm btn-circle"
              :class="{ 'btn-active bg-primary/10': state.viewMode === 'list' }"
              :title="t('drive.listView')"
              @click="setViewMode('list')"
            >
              <IconList class="w-5 h-5" />
            </button>
            <button
              class="btn btn-ghost btn-sm btn-circle"
              :class="{ 'btn-active bg-primary/10': state.viewMode === 'grid' }"
              :title="t('drive.gridView')"
              @click="setViewMode('grid')"
            >
              <IconLayoutGrid class="w-5 h-5" />
            </button>
          </div>

          <!-- Sort dropdown -->
          <div class="dropdown dropdown-end">
            <button class="btn btn-ghost btn-sm gap-1">
              <IconArrowUpDown class="w-4 h-4" />
              <span class="hidden sm:inline text-xs">{{ sortLabel }}</span>
            </button>
            <ul class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-48 z-50">
              <li>
                <a :class="{ active: state.sortField === 'date' }" @click="setSort('date')">
                  <IconClock class="w-4 h-4" />
                  {{ t("drive.sortDate") }}
                  <IconArrowDown v-if="state.sortField === 'date' && state.sortDirection === 'desc'" class="w-3 h-3 ml-auto" />
                  <IconArrowUp v-if="state.sortField === 'date' && state.sortDirection === 'asc'" class="w-3 h-3 ml-auto" />
                </a>
              </li>
              <li>
                <a :class="{ active: state.sortField === 'name' }" @click="setSort('name')">
                  <IconSortAZ class="w-4 h-4" />
                  {{ t("drive.sortName") }}
                  <IconArrowDown v-if="state.sortField === 'name' && state.sortDirection === 'desc'" class="w-3 h-3 ml-auto" />
                  <IconArrowUp v-if="state.sortField === 'name' && state.sortDirection === 'asc'" class="w-3 h-3 ml-auto" />
                </a>
              </li>
              <li>
                <a :class="{ active: state.sortField === 'size' }" @click="setSort('size')">
                  <IconDatabase class="w-4 h-4" />
                  {{ t("drive.sortSize") }}
                  <IconArrowDown v-if="state.sortField === 'size' && state.sortDirection === 'desc'" class="w-3 h-3 ml-auto" />
                  <IconArrowUp v-if="state.sortField === 'size' && state.sortDirection === 'asc'" class="w-3 h-3 ml-auto" />
                </a>
              </li>
            </ul>
          </div>

          <!-- More actions -->
          <div class="dropdown dropdown-end">
            <button class="btn btn-ghost btn-sm btn-circle">
              <IconMoreVertical class="w-5 h-5" />
            </button>
            <ul class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 z-50">
              <li>
                <button @click="triggerFileUpload">
                  <IconUpload class="w-4 h-4" />
                  {{ t("drive.uploadFile") }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Recycled banner -->
      <div
        v-if="state.recycled"
        class="mx-4 flex shrink-0 items-center gap-3 rounded-box bg-warning/10 px-4 py-2"
      >
        <IconAlertTriangle class="w-4 h-4 text-warning" />
        <span class="text-sm text-base-content/70">{{ t("drive.recycledBanner") }}</span>
        <div class="flex-1" />
        <button
          class="btn btn-ghost btn-xs text-warning"
          :disabled="state.isLoading || state.files.length === 0"
          @click="handleEmptyTrash"
        >
          <IconTrash class="w-3.5 h-3.5" />
          {{ t("drive.emptyTrash") }}
        </button>
      </div>

      <!-- Selection bar -->
      <div
        v-if="state.isSelectionMode"
        class="flex items-center gap-3 px-6 py-2 bg-primary/5 shrink-0"
      >
        <button class="btn btn-ghost btn-xs" @click="clearSelection">
          {{ t("drive.clearSelection") }}
        </button>
        <span class="text-sm text-base-content/60">
          {{ state.selectedFileIds.size }} {{ t("drive.selected") }}
        </span>
        <div class="flex-1" />
        <button
          class="btn btn-error btn-xs"
          :disabled="state.selectedFileIds.size === 0"
          @click="handleBatchDelete"
        >
          <IconTrash class="w-3.5 h-3.5" />
          {{ t("drive.deleteSelected") }}
        </button>
      </div>

      <!-- File list -->
      <div class="flex-1 overflow-y-auto px-6">
        <!-- Loading state -->
        <div
          v-if="state.isLoading && state.files.length === 0"
          class="flex items-center justify-center py-20"
        >
          <div class="loading loading-spinner loading-lg text-primary" />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!state.isLoading && state.files.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <div class="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mb-4">
            <IconPackage class="w-10 h-10 text-base-content/30" />
          </div>
          <h3 class="text-lg font-semibold mb-1">
            {{ state.recycled ? t("drive.emptyTrash") : t("drive.emptyAttachments") }}
          </h3>
          <p class="text-sm text-base-content/50 mb-4">
            {{ state.recycled ? t("drive.emptyTrashHint") : t("drive.emptyAttachmentsHint") }}
          </p>
          <button v-if="!state.recycled" class="btn btn-primary btn-sm" @click="triggerFileUpload">
            <IconUpload class="w-4 h-4" />
            {{ t("drive.uploadFile") }}
          </button>
        </div>

        <!-- List view -->
        <div v-else-if="state.viewMode === 'list'" class="py-2 space-y-0.5">
          <FileListTile
            v-for="file in state.files"
            :key="file.id"
            :file="file"
            :is-selection-mode="state.isSelectionMode"
            :is-selected="state.selectedFileIds.has(file.id)"
            @download="handleDownload(file)"
            @rename="openRename(file)"
            @move="openMove(file)"
            @delete="handleDelete(file)"
            @toggle-select="toggleFileSelection(file.id)"
          />
        </div>

        <!-- Grid view (waterfall) -->
        <ClientOnly v-else>
          <div
            v-masonry
            transition-duration="0.3s"
            item-selector=".drive-grid-tile"
            column-width=".drive-grid-sizer"
            gutter=".drive-grid-gutter"
            percent-position="true"
            horizontal-order="true"
            fit-width="true"
            class="py-4 mx-auto"
          >
            <div class="drive-grid-sizer" />
            <div class="drive-grid-gutter" />
            <div
              v-for="file in state.files"
              :key="file.id"
              v-masonry-tile
              class="drive-grid-tile mb-3"
            >
            <FileGridTile
              :file="file"
              :is-selection-mode="state.isSelectionMode"
              :is-selected="state.selectedFileIds.has(file.id)"
              @download="handleDownload(file)"
              @rename="openRename(file)"
              @move="openMove(file)"
              @delete="handleDelete(file)"
              @toggle-select="toggleFileSelection(file.id)"
            />
            </div>
          </div>
        </ClientOnly>

        <!-- Load more -->
        <div v-if="state.hasMore" class="flex justify-center py-4">
          <button
            class="btn btn-outline btn-sm"
            :class="{ loading: state.isLoading }"
            :disabled="state.isLoading"
            @click="loadMore"
          >
            {{ t("drive.loadMore") }}
          </button>
        </div>
      </div>

      <!-- Upload progress -->
      <UploadProgress
        :uploads="state.uploads"
        @clear="clearCompletedUploads"
      />

      <!-- Floating upload button -->
      <button
        class="btn btn-circle btn-primary fixed right-6 bottom-6 z-40 w-14 h-14 shadow-lg"
        @click="triggerFileUpload"
      >
        <IconPlus class="w-6 h-6" />
      </button>

      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        multiple
        @change="handleFileSelect"
      />

      <!-- Dialogs -->
      <RenameDialog
        :open="!!renamingFile"
        :current-name="renamingFile?.name || ''"
        :file="renamingFile"
        @close="renamingFile = null"
        @confirm="handleRename"
      />
      <MoveDialog
        :open="!!movingFile"
        :file="movingFile"
        :current-path="state.currentPath"
        @close="movingFile = null"
        @confirm="handleMove"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { SnCloudFile } from "~/types/drive";
import { deleteDriveRecycledFiles } from "~/utils/api";

const { t } = useI18n();

defineOgImage("UniOgImage", {
  title: t("drive.recent"),
  description: t("drive.recentDescription"),
});

useSolarSeo({
  title: t("drive.recent"),
  description: t("drive.recentDescription"),
});

const { $toast } = useNuxtApp();

const {
  state,
  loadFiles,
  loadUsage,
  setMode,
  setRecycled,
  setViewMode,
  setSort,
  setSearchQuery,
  toggleSelectionMode,
  toggleFileSelection,
  clearSelection,
  renameFile,
  deleteFile,
  batchDelete,
  moveFile,
  uploadFiles,
  clearCompletedUploads,
} = useDrive();

const searchQuery = ref("");
const renamingFile = ref<SnCloudFile | null>(null);
const movingFile = ref<SnCloudFile | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

// Initialize in unindexed mode
onMounted(async () => {
  setMode("unindexed");
  setRecycled(false);
  await loadFiles();
});

const sortLabel = computed(() => {
  switch (state.sortField) {
    case "date": return t("drive.sortDate");
    case "name": return t("drive.sortName");
    case "size": return t("drive.sortSize");
    default: return "";
  }
});

function handleToggleRecycled() {
  setRecycled(!state.recycled);
}

async function handleEmptyTrash() {
  if (!(await useAlert().confirm(t("common.confirm"), t("drive.confirmEmptyTrash")))) return;
  try {
    const count = await deleteDriveRecycledFiles();
    $toast.success(t("drive.trashEmptied", { count }));
    await loadFiles();
  } catch (err) {
    console.error("Failed to empty trash:", err);
    $toast.error(t("drive.errorEmptyingTrash"));
  }
}

function handleSearch() {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    setSearchQuery(searchQuery.value);
  }, 300);
}

async function loadMore() {
  await loadFiles(null, false);
}

function triggerFileUpload() {
  fileInputRef.value?.click();
}

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    await uploadFiles(input.files);
    input.value = "";
  }
}

function openRename(file: SnCloudFile) {
  renamingFile.value = file;
}

async function handleRename(newName: string) {
  if (!renamingFile.value) return;
  const success = await renameFile(renamingFile.value.id, newName);
  if (success) renamingFile.value = null;
}

async function handleDelete(file: SnCloudFile) {
  if (await useAlert().confirm(t("common.confirm"), t("drive.confirmDelete", { name: file.name }))) {
    await deleteFile(file.id);
  }
}

async function handleBatchDelete() {
  if (await useAlert().confirm(t("common.confirm"), t("drive.confirmDeleteSelected", { count: state.selectedFileIds.size }))) {
    await batchDelete();
  }
}

function openMove(file: SnCloudFile) {
  movingFile.value = file;
}

async function handleMove(targetFolderId: string | null) {
  if (!movingFile.value) return;
  const success = await moveFile(movingFile.value.id, targetFolderId);
  if (success) movingFile.value = null;
}

function handleDownload(file: SnCloudFile) {
  const url = `https://api.solian.app/drive/files/${file.id}?original=true`;
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
}
</script>

<style scoped>
.drive-grid-sizer,
.drive-grid-tile {
  width: calc(25% - 12px);
}
.drive-grid-gutter {
  width: 12px;
}
@media (max-width: 1023px) {
  .drive-grid-sizer,
  .drive-grid-tile {
    width: calc(25% - 12px);
  }
}
@media (max-width: 767px) {
  .drive-grid-sizer,
  .drive-grid-tile {
    width: calc(33.333% - 12px);
  }
}
@media (max-width: 639px) {
  .drive-grid-sizer,
  .drive-grid-tile {
    width: calc(50% - 12px);
  }
}
</style>
