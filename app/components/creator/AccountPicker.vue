<template>
  <div>
    <!-- Search -->
    <div class="relative mb-4">
      <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30 z-10" />
      <input
        v-model="query"
        type="text"
        class="input input-sm w-full pl-9 bg-base-200/60 border-0 rounded-box"
        :placeholder="placeholder"
        @input="handleSearch"
      />
    </div>

    <!-- Selected count (multiple mode) -->
    <div v-if="allowMultiple && selected.length > 0" class="flex items-center gap-2 mb-3">
      <span class="text-xs text-base-content/50">{{ selected.length }} selected</span>
      <button class="btn btn-ghost btn-xs" @click="selected = []">Clear</button>
    </div>

    <!-- Results -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div
      v-else-if="results.length === 0 && query.length > 0"
      class="flex flex-col items-center justify-center py-8 text-base-content/30"
    >
      <IconUsers class="w-8 h-8 mb-2" />
      <p class="text-sm">No accounts found</p>
    </div>

    <div v-else class="space-y-1 rounded-box">
      <button
        v-for="account in results"
        :key="account.id"
        class="flex items-center gap-3 w-full rounded-box p-3 transition-colors hover:bg-base-200/80"
        :class="{ 'bg-primary/5 hover:bg-primary/10': isSelected(account.id) }"
        @click="toggleAccount(account)"
      >
        <div v-if="allowMultiple" class="shrink-0">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            :checked="isSelected(account.id)"
            @click.stop
          />
        </div>
        <div class="avatar">
          <div class="w-9 rounded-full">
            <img
              v-if="getFileUrl(account.profile?.picture?.id)"
              :src="getFileUrl(account.profile?.picture?.id) ?? ''"
              :alt="account.nick || 'Account'"
            />
            <div
              v-else
              class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
            >
              {{ (account.nick || account.name || '?').slice(0, 2).toUpperCase() }}
            </div>
          </div>
        </div>
        <div class="min-w-0 text-left">
          <div class="text-sm font-medium truncate">{{ account.nick || account.name }}</div>
          <div class="text-xs text-base-content/40">@{{ account.name }}</div>
        </div>
      </button>
    </div>

    <!-- Confirm button (multiple mode) -->
    <div v-if="allowMultiple" class="mt-4 flex gap-2">
      <button class="btn btn-ghost btn-sm flex-1" @click="emit('select', null)">Cancel</button>
      <button class="btn btn-primary btn-sm flex-1" :disabled="selected.length === 0" @click="confirmMultiple">
        Confirm ({{ selected.length }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconSearch, IconUsers } from '#components'
import { searchAccounts } from '~/utils/api'
import type { SnAccount } from '~/types/auth'
import { getFileUrl } from '~/utils/files'

const props = withDefaults(defineProps<{
  allowMultiple?: boolean
  placeholder?: string
}>(), {
  allowMultiple: false,
  placeholder: 'Search accounts...',
})

const emit = defineEmits<{
  select: [account: SnAccount | SnAccount[] | null]
}>()

const query = ref('')
const results = ref<SnAccount[]>([])
const loading = ref(false)
const selected = ref<SnAccount[]>([])
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function isSelected(id: string): boolean {
  return selected.value.some(a => a.id === id)
}

function toggleAccount(account: SnAccount) {
  if (props.allowMultiple) {
    const idx = selected.value.findIndex(a => a.id === account.id)
    if (idx >= 0) {
      selected.value.splice(idx, 1)
    } else {
      selected.value.push(account)
    }
  } else {
    emit('select', account)
  }
}

function confirmMultiple() {
  emit('select', [...selected.value])
}

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (query.value.length < 2) {
    results.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    loading.value = true
    try {
      results.value = await searchAccounts(query.value, 20)
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}
</script>
