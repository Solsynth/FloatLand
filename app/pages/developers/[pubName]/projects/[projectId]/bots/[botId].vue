<template>
  <NuxtLayout name="developer">
    <div>
      <div v-if="isLoading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else-if="bot">
        <!-- Bot Header -->
        <div class="flex items-center gap-4 mb-6 -mx-4">
          <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/bots`" class="btn btn-ghost btn-sm">
            <IconArrowLeft class="w-4 h-4" />
            {{ t('developer.bots.title') }}
          </NuxtLink>
        </div>

        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body p-5">
            <div class="flex items-start gap-4">
              <div class="avatar">
                <div class="w-16 rounded-full">
                  <img v-if="getFileUrl(bot.account.profile?.picture?.id)" :src="getFileUrl(bot.account.profile?.picture?.id)" :alt="bot.account.nick" />
                  <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-info text-info-content text-xl font-bold">
                    {{ bot.account.nick?.slice(0, 2).toUpperCase() }}
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <h2 class="text-2xl font-bold">{{ bot.account.nick }}</h2>
                <p class="text-base-content/50 mt-1">@{{ bot.account.name }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span
                    class="badge badge-sm"
                    :class="bot.isActive ? 'badge-success' : 'badge-warning'"
                  >
                    {{ bot.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-sm" @click="openEditModal">
                  <IconEdit class="w-4 h-4" />
                  {{ t('common.edit') }}
                </button>
                <button class="btn btn-ghost btn-sm text-error" @click="handleDelete">
                  <IconTrash class="w-4 h-4" />
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
            <p v-if="bot.account.profile?.bio" class="mt-3 text-sm text-base-content/70">
              {{ bot.account.profile.bio }}
            </p>
            <div class="mt-4 text-sm text-base-content/50">
              <p>{{ t('developer.bots.createdAt') }}: {{ formatDate(bot.createdAt) }}</p>
              <p>{{ t('developer.bots.updatedAt') }}: {{ formatDate(bot.updatedAt) }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Keys Section -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title text-base">{{ t('developer.bots.keys.title') }}</h3>
                <button class="btn btn-primary btn-sm" @click="openCreateKeyModal">
                  <IconPlus class="w-4 h-4" />
                  {{ t('developer.bots.keys.create') }}
                </button>
              </div>
              <div v-if="createdKeyValue" class="rounded-lg p-3 bg-success/10 border border-success/30 mb-3">
                <div class="text-sm font-medium text-success mb-1">{{ t('developer.bots.keys.created') }}</div>
                <div class="flex items-center gap-2">
                  <code class="text-xs font-mono bg-base-200 rounded px-2 py-1 flex-1 break-all">{{ createdKeyValue }}</code>
                  <button class="btn btn-ghost btn-xs" @click="copyKey(createdKeyValue)">
                    <IconCopy class="w-3 h-3" />
                  </button>
                </div>
                <p class="text-xs text-base-content/50 mt-1">{{ t('developer.bots.keys.copyNow') }}</p>
              </div>
              <div v-if="keys.length > 0" class="space-y-2">
                <div
                  v-for="key in keys"
                  :key="key.id"
                  class="flex items-center gap-3 rounded-lg p-3 bg-base-200"
                >
                  <div class="flex-1">
                    <div class="font-medium text-sm">{{ key.label || t('developer.bots.keys.noLabel') }}</div>
                    <div class="text-xs text-base-content/50">
                      {{ t('developer.bots.keys.createdAt') }}: {{ formatDate(key.createdAt) }}
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-xs text-error" @click="handleDeleteKey(key.id)">
                    <IconTrash class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-base-content/50">{{ t('developer.bots.keys.noKeys') }}</p>
            </div>
          </div>

          <!-- Chat Config Section -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title text-base">{{ t('developer.bots.chat.title') }}</h3>
                <button class="btn btn-ghost btn-sm" @click="openChatConfigModal">
                  <IconEdit class="w-4 h-4" />
                  {{ t('common.edit') }}
                </button>
              </div>
              <div v-if="chatConfig" class="space-y-3">
                <div class="flex gap-6">
                  <div>
                    <div class="text-sm font-medium">{{ t('developer.bots.chat.autoApproveDm') }}</div>
                    <div class="text-sm text-base-content/70">{{ chatConfig.autoApproveDm ? 'Yes' : 'No' }}</div>
                  </div>
                  <div>
                    <div class="text-sm font-medium">{{ t('developer.bots.chat.autoApproveGroupChat') }}</div>
                    <div class="text-sm text-base-content/70">{{ chatConfig.autoApproveGroupChat ? 'Yes' : 'No' }}</div>
                  </div>
                  <div>
                    <div class="text-sm font-medium">{{ t('developer.bots.chat.supportChat') }}</div>
                    <div class="text-sm text-base-content/70">{{ chatConfig.supportChat ? 'Yes' : 'No' }}</div>
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.bots.chat.subscribedEvents') }}</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span v-for="evt in chatConfig.subscribedEvents" :key="evt" class="badge badge-sm">{{ evt }}</span>
                  </div>
                </div>
                <div v-if="chatConfig.commands?.length > 0">
                  <div class="text-sm font-medium mb-1">{{ t('developer.bots.chat.commands') }}</div>
                  <div class="space-y-1">
                    <div v-for="cmd in chatConfig.commands" :key="cmd.name" class="text-sm bg-base-200 rounded px-2 py-1">
                      <span class="font-mono font-medium">/{{ cmd.name }}</span>
                      <span class="text-base-content/50 ml-2">{{ cmd.description }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="chatConfig.webhooks?.length > 0">
                  <div class="text-sm font-medium mb-1">{{ t('developer.bots.chat.webhooks') }}</div>
                  <div class="space-y-1">
                    <div v-for="wh in chatConfig.webhooks" :key="wh.url" class="text-sm bg-base-200 rounded px-2 py-1 font-mono truncate">{{ wh.url }}</div>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-base-content/50">{{ t('developer.bots.chat.noConfig') }}</p>
            </div>
          </div>

          <!-- Bot Info -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <h3 class="card-title text-base mb-4">{{ t('developer.bots.info.title') }}</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div class="text-sm font-medium">{{ t('developer.bots.info.id') }}</div>
                  <div class="text-sm text-base-content/70 font-mono">{{ bot.id }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.bots.info.slug') }}</div>
                  <div class="text-sm text-base-content/70 font-mono">{{ bot.slug }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.bots.info.accountName') }}</div>
                  <div class="text-sm text-base-content/70">{{ bot.account.name }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.bots.info.language') }}</div>
                  <div class="text-sm text-base-content/70">{{ bot.account.language ?? '-' }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.bots.info.projectId') }}</div>
                  <div class="text-sm text-base-content/70 font-mono">{{ bot.projectId }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.bots.info.accountId') }}</div>
                  <div class="text-sm text-base-content/70 font-mono">{{ bot.account.id }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="flex flex-col items-center py-8 text-center">
        <IconBot class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/60">{{ t('developer.bots.notFound') }}</p>
        <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/bots`" class="btn btn-primary btn-sm mt-4">
          {{ t('developer.bots.backToList') }}
        </NuxtLink>
      </div>

      <!-- Edit Bot Drawer -->
      <AdminDrawer
        :open="editModalOpen"
        @update:open="editModalOpen = $event"
      >
        <template #header>
          <h3 class="font-bold text-lg">{{ t('common.edit') }} - {{ bot?.account.nick }}</h3>
        </template>
        <form @submit.prevent="handleUpdate">
          <!-- Picture & Background -->
          <div class="flex items-center gap-4 mb-4">
            <div class="relative group">
              <div class="avatar cursor-pointer" @click="pickPicture">
                <div class="w-16 rounded-full">
                  <img v-if="picturePreview" :src="picturePreview" />
                  <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-base-300 text-base-content/50">
                    <IconCamera class="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" @click="pickPicture">
                <IconCamera class="w-5 h-5 text-white" />
              </div>
            </div>
            <div class="flex-1">
              <div class="relative group cursor-pointer rounded-lg overflow-hidden h-20 bg-base-300" @click="pickBackground">
                <img v-if="backgroundPreview" :src="backgroundPreview" class="w-full h-full object-cover" />
                <div v-else class="flex h-full items-center justify-center text-base-content/50">
                  <span class="text-xs">{{ t('developer.bots.background') }}</span>
                </div>
                <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconCamera class="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>


          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.bots.name') }}</legend>
              <input v-model="editForm.name" type="text" class="input w-full" minlength="2" maxlength="256" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.bots.nick') }}</legend>
              <input v-model="editForm.nick" type="text" class="input w-full" maxlength="256" />
            </fieldset>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.bots.slug') }}</legend>
              <input v-model="editForm.slug" type="text" class="input w-full" maxlength="1024" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.bots.language') }}</legend>
              <input v-model="editForm.language" type="text" class="input w-full" maxlength="128" />
            </fieldset>
          </div>
          <fieldset class="fieldset mt-3">
            <legend class="fieldset-legend">{{ t('developer.bots.bio') }}</legend>
            <textarea v-model="editForm.bio" class="textarea w-full" rows="2" maxlength="4096" />
          </fieldset>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.bots.firstName') }}</legend>
              <input v-model="editForm.firstName" type="text" class="input w-full" maxlength="256" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.bots.lastName') }}</legend>
              <input v-model="editForm.lastName" type="text" class="input w-full" maxlength="256" />
            </fieldset>
          </div>
          <label class="flex items-center gap-3 cursor-pointer mt-3">
            <input v-model="editForm.isActive" type="checkbox" class="checkbox checkbox-sm" />
            <span class="text-sm font-medium">{{ t('developer.bots.active') }}</span>
          </label>
          <div class="flex items-center justify-between gap-3 mt-6">
            <button type="button" class="btn btn-ghost" @click="editModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isUpdatingBot">
              <span v-if="isUpdatingBot" class="loading loading-spinner loading-sm" />
              {{ t('common.save') }}
            </button>
          </div>
        </form>
      </AdminDrawer>

      <!-- Create Key Drawer -->
      <AdminDrawer
        :open="keyModalOpen"
        :title="t('developer.bots.keys.create')"
        @update:open="keyModalOpen = $event"
      >
        <form @submit.prevent="handleCreateKey">
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.bots.keys.label') }}</legend>
            <input
              v-model="newKey.label"
              type="text"
              class="input w-full"
              required
              maxlength="1024"
            />
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="keyModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isCreatingKey">
              <span v-if="isCreatingKey" class="loading loading-spinner loading-sm" />
              {{ t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>

      <!-- Chat Config Drawer -->
      <AdminDrawer
        :open="chatConfigModalOpen"
        :title="t('developer.bots.chat.title')"
        @update:open="chatConfigModalOpen = $event"
      >
        <form @submit.prevent="handleSaveChatConfig">
          <div class="flex flex-col gap-3 mb-4">
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="chatForm.autoApproveDm" type="checkbox" class="checkbox checkbox-sm mt-0.5" />
              <div>
                <span class="text-sm font-medium">{{ t('developer.bots.chat.autoApproveDm') }}</span>
                <p class="text-xs text-base-content/50">{{ t('developer.bots.chat.autoApproveDmHint') }}</p>
              </div>
            </label>
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="chatForm.autoApproveGroupChat" type="checkbox" class="checkbox checkbox-sm mt-0.5" />
              <div>
                <span class="text-sm font-medium">{{ t('developer.bots.chat.autoApproveGroupChat') }}</span>
                <p class="text-xs text-base-content/50">{{ t('developer.bots.chat.autoApproveGroupChatHint') }}</p>
              </div>
            </label>
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="chatForm.supportChat" type="checkbox" class="checkbox checkbox-sm mt-0.5" />
              <div>
                <span class="text-sm font-medium">{{ t('developer.bots.chat.supportChat') }}</span>
                <p class="text-xs text-base-content/50">{{ t('developer.bots.chat.supportChatHint') }}</p>
              </div>
            </label>
          </div>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">
              {{ t('developer.bots.chat.subscribedEvents') }}
              <span class="text-xs text-base-content/40">{{ t('developer.bots.chat.subscribedEventsHint') }}</span>
            </legend>
            <input v-model="chatForm.subscribedEvents" type="text" class="input w-full" placeholder="messages.new, member.joined" />
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="chatConfigModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isSavingChatConfig">
              <span v-if="isSavingChatConfig" class="loading loading-spinner loading-sm" />
              {{ t('common.save') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>

    <!-- File Pickers -->
    <CloudFileDrawer
      v-model:open="picturePickerOpen"
      :allowed-types="['image']"
      :crop-aspect-ratio="1"
      usage="bot.avatar"
      @select="onPictureSelected"
    />
    <CloudFileDrawer
      v-model:open="backgroundPickerOpen"
      :allowed-types="['image']"
      :crop-aspect-ratio="16/7"
      usage="bot.background"
      @select="onBackgroundSelected"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPlus,
  IconBot,
  IconCamera,
  IconCopy,
} from '#components'
import { getFileUrl } from '~/utils/files'
import type { Bot, BotKey, BotChatConfig } from '~/types/developer'
import type { SnCloudFile } from '~/types/drive'
import {
  fetchBot,
  updateBot,
  deleteBot,
  fetchBotKeys,
  createBotKey,
  deleteBotKey,
  fetchBotChatConfig,
  updateBotChatConfig,
} from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pubName = computed(() => route.params.pubName as string)
const projectId = computed(() => route.params.projectId as string)
const botId = computed(() => route.params.botId as string)
const developer = useDeveloper()

const bot = ref<Bot | null>(null)
const keys = ref<BotKey[]>([])
const chatConfig = ref<BotChatConfig | null>(null)
const isLoading = ref(false)
const keyModalOpen = ref(false)
const isCreatingKey = ref(false)
const editModalOpen = ref(false)
const isUpdatingBot = ref(false)
const chatConfigModalOpen = ref(false)
const isSavingChatConfig = ref(false)

const editForm = reactive({
  name: '',
  nick: '',
  slug: '',
  language: '',
  bio: '',
  firstName: '',
  lastName: '',
  isActive: false,
})

const newKey = reactive({
  label: '',
})
const createdKeyValue = ref<string | null>(null)

const chatForm = reactive({
  autoApproveDm: true,
  autoApproveGroupChat: false,
  supportChat: true,
  subscribedEvents: 'messages.new',
})

// Picture/background
const pictureId = ref<string | null>(null)
const backgroundId = ref<string | null>(null)
const picturePickerOpen = ref(false)
const backgroundPickerOpen = ref(false)

const picturePreview = computed(() => getFileUrl(pictureId.value))
const backgroundPreview = computed(() => getFileUrl(backgroundId.value))

const pageTitle = computed(() => {
  const parts = [t('developer.bots.detail')]
  if (bot.value) parts.push(bot.value.account.nick)
  parts.push('Solar Network')
  return parts.join(' · ')
})

defineOgImage('UniOgImage', { title: pageTitle })

useSolarSeo({ title: pageTitle })

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

async function loadData() {
  isLoading.value = true
  try {
    await developer.loadDevelopers()
    developer.selectByPublisherName(pubName.value)
    await developer.loadProject(pubName.value, projectId.value)

    const botData = await fetchBot(pubName.value, projectId.value, botId.value)
    bot.value = botData
    if (botData) {
      developer.currentBot.value = { id: botData.id, name: botData.account.nick || botData.account.name, slug: botData.slug }
    }

    const [keysResult, chatResult] = await Promise.allSettled([
      fetchBotKeys(pubName.value, projectId.value, botId.value),
      fetchBotChatConfig(pubName.value, projectId.value, botId.value),
    ])
    keys.value = keysResult.status === 'fulfilled' ? keysResult.value : []
    chatConfig.value = chatResult.status === 'fulfilled' ? chatResult.value : null
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function pickPicture() {
  picturePickerOpen.value = true
}

function pickBackground() {
  backgroundPickerOpen.value = true
}

function onPictureSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    pictureId.value = file.id
  }
}

function onBackgroundSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    backgroundId.value = file.id
  }
}

function openEditModal() {
  if (!bot.value) return
  editForm.name = bot.value.account.name
  editForm.nick = bot.value.account.nick
  editForm.slug = bot.value.slug
  editForm.language = bot.value.account.language ?? ''
  editForm.bio = bot.value.account.profile?.bio ?? ''
  editForm.firstName = bot.value.account.profile?.firstName ?? ''
  editForm.lastName = bot.value.account.profile?.lastName ?? ''
  editForm.isActive = bot.value.isActive
  pictureId.value = bot.value.account.profile?.picture?.id ?? null
  backgroundId.value = bot.value.account.profile?.background?.id ?? null
  editModalOpen.value = true
}

async function handleUpdate() {
  isUpdatingBot.value = true
  try {
    await updateBot(pubName.value, projectId.value, botId.value, {
      name: editForm.name || undefined,
      nick: editForm.nick || undefined,
      slug: editForm.slug || undefined,
      language: editForm.language || undefined,
      bio: editForm.bio || undefined,
      isActive: editForm.isActive,
      pictureId: pictureId.value ?? undefined,
      backgroundId: backgroundId.value ?? undefined,
    })
    editModalOpen.value = false
    bot.value = await fetchBot(pubName.value, projectId.value, botId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isUpdatingBot.value = false
  }
}

async function handleDelete() {
  if (!(await useAlert().confirm('Confirm', t('developer.bots.deleteConfirm')))) return
  try {
    await deleteBot(pubName.value, projectId.value, botId.value)
    router.push(`/developers/${pubName.value}/projects/${projectId.value}/bots`)
  } catch (e) {
    console.error(e)
  }
}

function openCreateKeyModal() {
  newKey.label = ''
  keyModalOpen.value = true
}

async function handleCreateKey() {
  isCreatingKey.value = true
  try {
    const created = await createBotKey(pubName.value, projectId.value, botId.value, {
      label: newKey.label || undefined,
    })
    createdKeyValue.value = created.key ?? null
    keyModalOpen.value = false
    keys.value = await fetchBotKeys(pubName.value, projectId.value, botId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isCreatingKey.value = false
  }
}

function copyKey(value: string | null) {
  if (value) navigator.clipboard.writeText(value)
}

async function handleDeleteKey(keyId: string) {
  if (!(await useAlert().confirm('Confirm', t('developer.bots.keys.deleteConfirm')))) return
  try {
    await deleteBotKey(pubName.value, projectId.value, botId.value, keyId)
    keys.value = await fetchBotKeys(pubName.value, projectId.value, botId.value)
  } catch (e) {
    console.error(e)
  }
}

function openChatConfigModal() {
  if (!chatConfig.value) return
  chatForm.autoApproveDm = chatConfig.value.autoApproveDm
  chatForm.autoApproveGroupChat = chatConfig.value.autoApproveGroupChat
  chatForm.supportChat = chatConfig.value.supportChat
  chatForm.subscribedEvents = chatConfig.value.subscribedEvents.join(', ')
  chatConfigModalOpen.value = true
}

async function handleSaveChatConfig() {
  isSavingChatConfig.value = true
  try {
    const events = chatForm.subscribedEvents
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const updated = await updateBotChatConfig(pubName.value, projectId.value, botId.value, {
      id: botId.value,
      commands: chatConfig.value?.commands ?? [],
      webhooks: chatConfig.value?.webhooks ?? [],
      autoApproveDm: chatForm.autoApproveDm,
      autoApproveGroupChat: chatForm.autoApproveGroupChat,
      supportChat: chatForm.supportChat,
      subscribedEvents: events,
    })
    chatConfig.value = updated
    chatConfigModalOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    isSavingChatConfig.value = false
  }
}

watch([pubName, projectId, botId], () => {
  loadData()
}, { immediate: true })
</script>
