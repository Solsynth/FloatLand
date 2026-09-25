<template>
  <dialog class="modal" :class="{ 'modal-open': open }" @close="$emit('update:open', false)">
    <div class="modal-box max-w-md">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        type="button"
        :title="t('chat.close')"
        @click="$emit('update:open', false)"
      >
        <IconX class="h-4 w-4" />
      </button>

      <h2 class="text-lg font-bold">{{ t("chat.newChat") }}</h2>

      <!-- Tabs -->
      <div class="tabs tabs-boxed mt-3">
        <button
          type="button"
          class="tab text-sm"
          :class="tab === 'direct' ? 'tab-active' : ''"
          @click="tab = 'direct'"
        >
          {{ t("chat.newDirect") }}
        </button>
        <button
          type="button"
          class="tab text-sm"
          :class="tab === 'group' ? 'tab-active' : ''"
          @click="tab = 'group'"
        >
          {{ t("chat.newGroup") }}
        </button>
      </div>

      <!-- Direct: account search -->
      <div v-if="tab === 'direct'" class="mt-4">
        <input
          v-model="query"
          type="search"
          class="input input-bordered w-full"
          :placeholder="t('chat.searchAccountsPlaceholder')"
          @input="searchAccountsDebounced"
        />
        <div v-if="busy" class="flex justify-center py-6">
          <span class="loading loading-spinner loading-sm" />
        </div>
        <div v-else-if="accountResults.length" class="mt-2 max-h-72 space-y-1 overflow-y-auto">
          <button
            v-for="account in accountResults"
            :key="account.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-box px-3 py-2 text-left transition-colors hover:bg-base-200"
            @click="start(account.id)"
          >
            <div class="avatar">
              <div class="w-9 rounded-full">
                <FileImage v-if="account.profile?.picture" :file="account.profile.picture" :alt="account.name" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {{ (account.nick || account.name).slice(0, 2).toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ account.nick || account.name }}</p>
              <p class="truncate text-xs text-base-content/50">@{{ account.name }}</p>
            </div>
          </button>
        </div>
        <p v-else-if="query && !busy" class="mt-3 text-center text-sm text-base-content/50">
          {{ t("chat.noAccountsFound") }}
        </p>
      </div>

      <!-- Group: create room -->
      <form v-else class="mt-4 space-y-3" @submit.prevent="createGroup">
        <input
          v-model="groupForm.name"
          type="text"
          class="input input-bordered w-full"
          :placeholder="t('chat.groupNamePlaceholder')"
          required
        />
        <textarea
          v-model="groupForm.description"
          rows="2"
          class="textarea textarea-bordered w-full"
          :placeholder="t('chat.groupDescriptionPlaceholder')"
        />
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input v-model="groupForm.isPublic" type="checkbox" class="toggle toggle-sm toggle-primary" />
          <span>{{ t("chat.groupPublic") }}</span>
        </label>
        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="!groupForm.name.trim() || creating"
        >
          <span v-if="creating" class="loading loading-spinner loading-sm" />
          {{ t("chat.createGroup") }}
        </button>
      </form>

      <p v-if="error" class="mt-3 text-sm text-error">{{ error }}</p>
    </div>
    <div class="modal-backdrop" @click="$emit('update:open', false)" />
  </dialog>
</template>

<script setup lang="ts">
import { IconX } from "#components";
import { searchAccounts, createChatRoom } from "~/utils/api";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

const { t } = useI18n();
const { startDirect } = useChat();

const tab = ref<"direct" | "group">("direct");
const query = ref("");
const busy = ref(false);
const creating = ref(false);
const error = ref("");
const accountResults = ref<Awaited<ReturnType<typeof searchAccounts>>>([]);

const groupForm = reactive({ name: "", description: "", isPublic: false });

let searchTimer: ReturnType<typeof setTimeout> | null = null

function searchAccountsDebounced(): void {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => void runSearch(), 350)
}

async function runSearch(): Promise<void> {
  const q = query.value.trim()
  if (!q) {
    accountResults.value = []
    return
  }
  busy.value = true
  try {
    accountResults.value = await searchAccounts(q, 10)
  } catch {
    accountResults.value = []
  } finally {
    busy.value = false
  }
}

async function start(accountId: string): Promise<void> {
  error.value = ""
  const roomId = await startDirect(accountId)
  if (roomId) {
    emit("update:open", false)
    navigateTo(`/chat/${roomId}`)
  } else {
    error.value = t("chat.directFailed")
  }
}

async function createGroup(): Promise<void> {
  const name = groupForm.name.trim()
  if (!name || creating.value) return
  creating.value = true
  error.value = ""
  try {
    const room = await createChatRoom({
      name,
      description: groupForm.description.trim() || undefined,
      is_public: groupForm.isPublic,
    })
    emit("update:open", false)
    groupForm.name = ""
    groupForm.description = ""
    groupForm.isPublic = false
    await navigateTo(`/chat/${room.id}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("chat.groupCreateFailed")
  } finally {
    creating.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      query.value = ""
      accountResults.value = []
      error.value = ""
      tab.value = "direct"
    }
  },
)
</script>
