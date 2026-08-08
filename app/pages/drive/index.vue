<template>
  <NuxtLayout name="drive">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <button
            v-if="state.currentFolderId"
            class="btn btn-ghost btn-sm btn-circle shrink-0"
            @click="navigateBack"
          >
            <IconArrowLeft class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-3 min-w-0">
            <FolderBreadcrumb
              :path-stack="state.pathStack"
              @navigate="navigateToPathIndex"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
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
                <button @click="showCreateFolder = true">
                  <IconFolderPlus class="w-4 h-4" />
                  {{ t("drive.createFolder") }}
                </button>
              </li>
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
            <IconFolderOpen class="w-10 h-10 text-base-content/30" />
          </div>
          <h3 class="text-lg font-semibold mb-1">{{ t("drive.emptyFolder") }}</h3>
          <p class="text-sm text-base-content/50 mb-4">{{ t("drive.emptyFolderHint") }}</p>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" @click="triggerFileUpload">
              <IconUpload class="w-4 h-4" />
              {{ t("drive.uploadFile") }}
            </button>
            <button class="btn btn-outline btn-sm" @click="showCreateFolder = true">
              <IconFolderPlus class="w-4 h-4" />
              {{ t("drive.createFolder") }}
            </button>
          </div>
        </div>

        <!-- List view -->
        <div v-else-if="state.viewMode === 'list'" class="py-2 space-y-0.5">
          <FileListTile
            v-for="file in state.files"
            :key="file.id"
            :file="file"
            :is-selection-mode="state.isSelectionMode"
            :is-selected="state.selectedFileIds.has(file.id)"
            @open="handleNavigateToFolder(file)"
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
              @open="handleNavigateToFolder(file)"
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
      <CreateFolderDialog
        :open="showCreateFolder"
        @close="showCreateFolder = false"
        @confirm="handleCreateFolder"
      />
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
import { fetchDriveBreadcrumb } from "~/utils/api";

const { t } = useI18n();
const route = useRoute();

defineOgImage("UniOgImage", {
  title: t("drive.title"),
  description: t("drive.description"),
});

useSolarSeo({
  title: t("drive.title"),
  description: t("drive.description"),
});

const {
  state: driveState,
  loadFiles,
  navigateToFolder,
  navigateToPathIndex,
  setViewMode,
  setSort,
  setSearchQuery,
  toggleSelectionMode,
  toggleFileSelection,
  clearSelection,
  createFolder,
  renameFile,
  deleteFile,
  batchDelete,
  moveFile,
  uploadFiles,
  clearCompletedUploads,
} = useDrive();

// Local state shadow for reactivity on path/folder
const state = driveState;

const searchQuery = ref("");
const showCreateFolder = ref(false);
const renamingFile = ref<SnCloudFile | null>(null);
const movingFile = ref<SnCloudFile | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

// Ensure we're in indexed mode
onMounted(async () => {
  // Set mode directly without triggering automatic loadFiles
  driveState.mode = "indexed";
  driveState.files = [];
  driveState.currentFolderId = null;
  driveState.pathStack = [{ id: null, name: t("drive.root") }];
  driveState.currentPath = "/";
  driveState.selectedFileIds.clear();
  driveState.isSelectionMode = false;

  const folderId = (route.query.folder as string) || null;
  if (folderId) {
    try {
      const breadcrumb = await fetchDriveBreadcrumb(folderId);
      const pathStack: Array<{ id: string | null; name: string }> = [
        { id: null, name: t("drive.root") },
      ];
      for (const item of breadcrumb) {
        if (item.isFolder) {
          pathStack.push({ id: item.id, name: item.name });
        }
      }
      driveState.pathStack = pathStack;
      driveState.currentFolderId = folderId;
      driveState.currentPath =
        "/" + pathStack.slice(1).map((p) => p.name).join("/");
    } catch (err) {
      console.error("Failed to fetch breadcrumb:", err);
    }
    await loadFiles(folderId);
  } else {
    await loadFiles();
  }
});

const sortLabel = computed(() => {
  switch (state.sortField) {
    case "date": return t("drive.sortDate");
    case "name": return t("drive.sortName");
    case "size": return t("drive.sortSize");
    default: return "";
  }
});

async function handleNavigateToFolder(file: SnCloudFile) {
  await navigateToFolder(file);
}

function navigateBack() {
  const idx = state.pathStack.length - 2;
  if (idx >= 0) {
    navigateToPathIndex(idx);
  }
}

function handleSearch() {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    setSearchQuery(searchQuery.value);
  }, 300);
}

async function loadMore() {
  await loadFiles(state.currentFolderId, false);
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

async function handleCreateFolder(name: string) {
  const success = await createFolder(name);
  if (success) {
    showCreateFolder.value = false;
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
