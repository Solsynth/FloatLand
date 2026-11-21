<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="pending" class="flex items-center gap-2 py-8 text-sm text-dim">
      <IconLoader class="w-4 h-4 animate-spin" />
      <span>Loading media library...</span>
    </div>

    <template v-else>
      <!-- Stats + Rewind Header -->
      <section v-if="stats" class="plate p-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="rounded-xl bg-base-200/80 px-4 py-2.5 text-center">
            <div class="text-lg font-extrabold tabular-nums">{{ stats.total_scrobbles }}</div>
            <div class="text-[11px] uppercase tracking-wider text-dim">Scrobbles</div>
          </div>
          <div class="rounded-xl bg-base-200/80 px-4 py-2.5 text-center">
            <div class="text-lg font-extrabold tabular-nums">{{ formatDuration(stats.total_seconds) }}</div>
            <div class="text-[11px] uppercase tracking-wider text-dim">Time</div>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-primary gap-1.5"
          @click="toggleRewind"
        >
          <IconSparkles class="size-3.5" />
          <span>{{ rewindOpen ? 'Hide' : `${selectedYear} Rewind` }}</span>
        </button>
      </section>

      <!-- Expandable Rewind Card -->
      <section v-if="rewindOpen" class="plate p-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold">{{ selectedYear }} Rewind</h3>
          <div class="flex items-center gap-1.5">
            <button
              v-for="y in rewindYears"
              :key="y"
              type="button"
              class="chip"
              :class="{ 'chip-active': y === selectedYear }"
              @click="selectRewindYear(y)"
            >
              {{ y }}
            </button>
          </div>
        </div>
        <div v-if="rewindLoading" class="text-xs text-dim py-3">Loading rewind...</div>
        <div v-else-if="rewind" class="space-y-3">
          <div class="text-xs text-dim">
            <span class="font-semibold text-base-content">{{ rewind.total_scrobbles }}</span> scrobbles ·
            <span class="font-semibold text-base-content">{{ formatDuration(rewind.total_seconds) }}</span>
          </div>
          <div v-if="rewind.top_items?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              v-for="(item, idx) in rewind.top_items.slice(0, 6)"
              :key="idx"
              class="flex items-center gap-2.5 rounded-xl bg-base-200/60 p-2"
            >
              <span class="w-5 text-center text-xs font-mono text-dim">{{ idx + 1 }}</span>
              <FileImage
                v-if="item.artwork_url"
                :src="item.artwork_url"
                :alt="item.title"
                class="h-10 w-10 rounded-lg object-cover shrink-0 bg-base-300"
              />
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold truncate">{{ item.title }}</div>
                <div v-if="item.subtitle" class="text-[11px] text-dim truncate">{{ item.subtitle }}</div>
              </div>
              <span class="text-xs font-mono text-dim shrink-0">{{ item.count }}×</span>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-dim py-2">No rewind data for {{ selectedYear }}.</div>
      </section>

      <!-- Now Playing -->
      <section v-if="nowPlaying" class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-dim">Now Playing</h3>
        <div class="plate p-4 flex items-center gap-4">
          <FileImage
            v-if="nowPlaying.artwork_url"
            :src="nowPlaying.artwork_url"
            :alt="nowPlaying.title"
            class="h-14 w-14 rounded-xl object-cover shrink-0 bg-base-300"
          />
          <div class="min-w-0 flex-1 space-y-1">
            <span class="badge badge-xs badge-primary uppercase">{{ domainLabel(nowPlaying.domain) }}</span>
            <div class="font-semibold truncate">{{ nowPlaying.title }}</div>
            <div v-if="nowPlaying.subtitle" class="text-xs text-dim truncate">{{ nowPlaying.subtitle }}</div>
          </div>
        </div>
      </section>

      <!-- Works & Statuses (Poster Shelves) -->
      <section v-if="shelves.length" class="space-y-5">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-dim">Works &amp; Statuses</h3>
        <div v-for="shelf in shelves" :key="shelf.id" class="space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="badge badge-xs badge-ghost uppercase">{{ domainLabel(shelf.domain) }}</span>
              <h4 class="font-semibold text-sm truncate">{{ shelf.name }}</h4>
              <span class="text-xs font-mono text-dim">{{ shelf.items?.length || 0 }}</span>
            </div>
          </div>

          <div
            v-if="shelf.items?.length"
            class="flex gap-3 overflow-x-auto pb-2 snap-x"
          >
            <div
              v-for="entry in shelf.items"
              :key="entry.id"
              class="w-32 sm:w-36 shrink-0 snap-start space-y-1.5"
            >
              <div class="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-base-200 border border-base-300/60">
                <FileImage
                  v-if="entry.catalog_item?.artwork_url"
                  :src="entry.catalog_item.artwork_url"
                  :alt="entry.catalog_item?.title || 'Work cover'"
                  class="h-full w-full object-cover"
                />
                <div v-else class="grid h-full w-full place-items-center text-xs text-dim p-2 text-center">
                  {{ entry.catalog_item?.title || 'Untitled' }}
                </div>

                <!-- Rating badge top-left -->
                <span
                  v-if="entry.rating"
                  class="absolute top-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-amber-300 backdrop-blur-sm"
                >
                  ★ {{ entry.rating }}
                </span>

                <!-- Note indicator top-right -->
                <button
                  v-if="entry.note"
                  type="button"
                  class="absolute top-1.5 right-1.5 grid h-5 w-5 cursor-pointer place-items-center rounded-md bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/85"
                  aria-label="View full note"
                  @click.stop="openNote(entry)"
                >
                  <IconMessageSquare class="size-3" />
                </button>

                <!-- Status pill bottom-left -->
                <span
                  v-if="entry.status"
                  class="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(entry.status)" />
                  {{ statusLabel(entry.status) }}
                </span>
              </div>

              <div class="space-y-0.5 px-0.5">
                <div class="text-xs font-semibold leading-snug line-clamp-1">
                  {{ entry.catalog_item?.title || 'Untitled' }}
                </div>
                <div v-if="entry.catalog_item?.subtitle" class="text-[11px] text-dim line-clamp-1">
                  {{ entry.catalog_item.subtitle }}
                </div>
                <button
                  v-if="entry.note"
                  type="button"
                  class="w-full cursor-pointer text-left text-[11px] text-base-content/70 line-clamp-2 italic hover:text-base-content"
                  aria-label="View full note"
                  @click.stop="openNote(entry)"
                >
                  “{{ entry.note }}”
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Unified Scrobble History -->
      <section class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-dim">Scrobble History</h3>
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="d in domains"
              :key="d.value"
              type="button"
              class="chip"
              :class="{ 'chip-active': historyDomain === d.value }"
              @click="selectDomain(d.value)"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <div v-if="historyItems.length" class="plate divide-y divide-base-300/50">
          <div
            v-for="item in historyItems"
            :key="item.id"
            class="flex items-center gap-3 p-3"
          >
            <FileImage
              v-if="scrobbleArtwork(item)"
              :src="scrobbleArtwork(item)"
              :alt="item.title"
              class="h-12 w-12 rounded-xl object-cover shrink-0 bg-base-300"
            />
            <div v-else class="grid h-12 w-12 place-items-center rounded-xl bg-base-200 text-xs font-bold text-dim shrink-0">
              {{ domainLabel(item.domain).slice(0, 1) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="badge badge-xs badge-ghost uppercase shrink-0">{{ domainLabel(item.domain) }}</span>
                <span class="text-sm font-semibold truncate">{{ item.title }}</span>
              </div>
              <div v-if="item.subtitle" class="text-xs text-dim truncate">{{ item.subtitle }}</div>
            </div>

            <span class="text-xs font-mono text-dim shrink-0">
              {{ scrobbleTime(item) }}
            </span>
          </div>
        </div>
        <div v-else class="py-6 text-center text-sm text-dim">
          No scrobbles recorded yet.
        </div>

        <div v-if="historyItems.length < historyTotal" class="text-center pt-1">
          <button
            type="button"
            class="btn btn-ghost btn-sm bg-base-200"
            :disabled="historyLoadingMore"
            @click="loadMoreHistory"
          >
            {{ historyLoadingMore ? 'Loading...' : 'Load more' }}
          </button>
        </div>
      </section>

      <!-- Full note dialog -->
      <dialog
        ref="noteDialog"
        class="modal modal-bottom sm:modal-middle"
        aria-labelledby="note-dialog-title"
      >
        <div v-if="activeNoteEntry" class="modal-box max-w-lg">
          <div class="flex items-start gap-3">
            <FileImage
              v-if="activeNoteEntry.catalog_item?.artwork_url"
              :src="activeNoteEntry.catalog_item.artwork_url"
              :alt="activeNoteEntry.catalog_item?.title || 'Work cover'"
              class="h-16 w-12 shrink-0 rounded-lg bg-base-300 object-cover"
            />
            <div class="min-w-0 flex-1">
              <h3 id="note-dialog-title" class="text-base font-semibold leading-snug">
                {{ activeNoteEntry.catalog_item?.title || 'Untitled' }}
              </h3>
              <p v-if="activeNoteEntry.catalog_item?.subtitle" class="text-xs text-dim">
                {{ activeNoteEntry.catalog_item.subtitle }}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-1.5">
                <span v-if="activeNoteEntry.rating" class="badge badge-xs badge-warning">
                  ★ {{ activeNoteEntry.rating }}
                </span>
                <span v-if="activeNoteEntry.status" class="badge badge-xs badge-ghost">
                  {{ statusLabel(activeNoteEntry.status) }}
                </span>
              </div>
            </div>
          </div>

          <p class="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-base-content/90">
            {{ activeNoteEntry.note }}
          </p>

          <div class="modal-action">
            <form method="dialog">
              <button class="btn btn-ghost btn-sm">Close</button>
            </form>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button aria-label="Close note">close</button>
        </form>
      </dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  PulsarCollectionItem,
  PulsarRewind,
  PulsarScrobble,
  PulsarSession,
  PulsarShelf,
  PulsarStats,
} from '~/types/pulsar'
import {
  fetchPulsarUserHistory,
  fetchPulsarUserNowPlaying,
  fetchPulsarUserRewind,
  fetchPulsarUserShelves,
  fetchPulsarUserStats,
} from '~/utils/api'

const props = defineProps<{
  username: string
}>()

const currentYear = new Date().getFullYear()
const rewindYears = [currentYear, currentYear - 1, currentYear - 2]
const selectedYear = ref(currentYear)
const rewindOpen = ref(false)
const rewindLoading = ref(false)
const rewind = ref<PulsarRewind | null>(null)

const noteDialog = ref<HTMLDialogElement | null>(null)
const activeNoteEntry = ref<PulsarCollectionItem | null>(null)

const historyDomain = ref('')
const historyItems = ref<PulsarScrobble[]>([])
const historyTotal = ref(0)
const historyLoadingMore = ref(false)

function openNote(entry: PulsarCollectionItem) {
  if (!entry.note) return
  activeNoteEntry.value = entry
  noteDialog.value?.showModal()
}

const domains = [
  { value: '', label: 'All' },
  { value: 'music', label: 'Music' },
  { value: 'anime', label: 'Anime' },
  { value: 'book', label: 'Book' },
  { value: 'video', label: 'Video' },
  { value: 'game', label: 'Game' },
]

const { data, pending } = await useAsyncData(
  () => `pulsar-profile-${props.username}`,
  async () => {
    const [stats, nowPlaying, shelves, history] = await Promise.all([
      fetchPulsarUserStats(props.username),
      fetchPulsarUserNowPlaying(props.username),
      fetchPulsarUserShelves(props.username),
      fetchPulsarUserHistory(props.username, { offset: 0, take: 15 }),
    ])
    return { stats, nowPlaying, shelves, history }
  },
  { watch: [() => props.username] },
)

const stats = computed<PulsarStats | null>(() => data.value?.stats ?? null)
const nowPlaying = computed<PulsarSession | null>(() => data.value?.nowPlaying ?? null)
const shelves = computed<PulsarShelf[]>(() => data.value?.shelves ?? [])

watch(
  () => data.value?.history,
  (h) => {
    if (h) {
      historyItems.value = h.items
      historyTotal.value = h.total
    }
  },
  { immediate: true },
)

async function selectDomain(domain: string) {
  historyDomain.value = domain
  const res = await fetchPulsarUserHistory(props.username, {
    domain: domain || undefined,
    offset: 0,
    take: 15,
  })
  historyItems.value = res.items
  historyTotal.value = res.total
}

async function loadMoreHistory() {
  historyLoadingMore.value = true
  try {
    const res = await fetchPulsarUserHistory(props.username, {
      domain: historyDomain.value || undefined,
      offset: historyItems.value.length,
      take: 15,
    })
    historyItems.value = [...historyItems.value, ...res.items]
    historyTotal.value = res.total
  } finally {
    historyLoadingMore.value = false
  }
}

async function toggleRewind() {
  rewindOpen.value = !rewindOpen.value
  if (rewindOpen.value && !rewind.value) {
    await loadRewind(selectedYear.value)
  }
}

async function selectRewindYear(y: number) {
  selectedYear.value = y
  await loadRewind(y)
}

async function loadRewind(y: number) {
  rewindLoading.value = true
  try {
    rewind.value = await fetchPulsarUserRewind(props.username, y)
  } finally {
    rewindLoading.value = false
  }
}

function domainLabel(d: string): string {
  switch (d) {
    case 'music': return 'Music'
    case 'anime': return 'Anime'
    case 'book': return 'Book'
    case 'video': return 'Video'
    case 'game': return 'Game'
    default: return d || 'Media'
  }
}

function statusLabel(s: string): string {
  switch (s) {
    case 'watching': return 'In Progress'
    case 'completed': return 'Completed'
    case 'planned': return 'Planned'
    case 'on_hold': return 'On Hold'
    case 'dropped': return 'Dropped'
    default: return s
  }
}

function statusDotClass(s: string): string {
  switch (s) {
    case 'watching': return 'bg-sky-400'
    case 'completed': return 'bg-emerald-400'
    case 'planned': return 'bg-violet-400'
    case 'on_hold': return 'bg-amber-400'
    case 'dropped': return 'bg-rose-400'
    default: return 'bg-base-content/50'
  }
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return '0m'
  const days = Math.floor(sec / 86400)
  const hours = Math.floor((sec % 86400) / 3600)
  const mins = Math.floor((sec % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatScrobbleTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function scrobbleArtwork(item: PulsarScrobble): string {
  return item.catalog_item?.artwork_url || item.artwork_url || ''
}

function scrobbleTime(item: PulsarScrobble): string {
  return formatScrobbleTime(item.played_at || item.scrobbled_at || '')
}
</script>
