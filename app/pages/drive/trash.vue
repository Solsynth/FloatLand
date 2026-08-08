<template>
  <NuxtLayout name="drive">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 shrink-0">
        <div class="flex items-center gap-3">
          <IconTrash2 class="w-5 h-5 text-base-content/60" />
          <h1 class="text-lg font-semibold">{{ t("drive.trash") }}</h1>
          <span class="badge badge-ghost badge-sm">{{ state.totalCount }}</span>
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

          <!-- Empty trash -->
          <button
            class="btn btn-ghost btn-sm btn-circle text-warning"
            :disabled="state.isLoading || state.files.length === 0"
            :title="t('drive.emptyTrash')"
            @click="handleEmptyTrash"
          >
            <IconTrash class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Trash banner -->
      <div class="mx-4 flex shrink-0 items-center gap-3 rounded-box bg-warning/10 px-4 py-2">
        <IconAlertTriangle class="w-4 h-4 text-warning" />
        <p class="text-sm text-base-content/70">{{ t("drive.trashBanner") }}</p>
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
            <IconTrash2 class="w-10 h-10 text-base-content/30" />
          </div>
          <h3 class="text-lg font-semibold mb-1">{{ t("drive.trashEmpty") }}</h3>
          <p class="text-sm text-base-content/50">{{ t("drive.trashEmptyHint") }}</p>
        </div>

        <!-- List view -->
        <div v-else-if="state.viewMode === 'list'" class="py-2 space-y-0.5">
          <FileListTile
            v-for="file in state.files"
            :key="file.id"
            :file="file"
            :is-selection-mode="false"
            @download="handleDownload(file)"
            @delete="handleDelete(file)"
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
              :is-selection-mode="false"
              @download="handleDownload(file)"
              @delete="handleDelete(file)"
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
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { SnCloudFile } from "~/types/drive";
import { deleteDriveRecycledFiles } from "~/utils/api";

const { t } = useI18n();
const { $toast } = useNuxtApp();

defineOgImage("UniOgImage", {
  title: t("drive.trash"),
  description: t("drive.trashDescription"),
});

useSolarSeo({
  title: t("drive.trash"),
  description: t("drive.trashDescription"),
});

const {
  state,
  loadFiles,
  setMode,
  setRecycled,
  setViewMode,
  setSort,
  setSearchQuery,
  deleteFile,
  clearCompletedUploads,
} = useDrive();

const searchQuery = ref("");
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

// Initialize in unindexed + recycled mode
onMounted(async () => {
  setMode("unindexed");
  setRecycled(true);
  await loadFiles();
});

function handleSearch() {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    setSearchQuery(searchQuery.value);
  }, 300);
}

async function loadMore() {
  await loadFiles(null, false);
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

async function handleDelete(file: SnCloudFile) {
  if (await useAlert().confirm(t("common.confirm"), t("drive.confirmPermanentDelete", { name: file.name }))) {
    await deleteFile(file.id);
  }
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
