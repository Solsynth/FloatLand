<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center gap-4 mb-4 -mx-4">
        <NuxtLink :to="`/developers/${pubName}/projects/${projectId}`" class="btn btn-ghost btn-sm">
          <IconArrowLeft class="w-4 h-4" />
          {{ t('developer.projects.detail') }}
        </NuxtLink>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">{{ t('developer.bots.title') }}</h2>
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          <IconPlus class="w-4 h-4" />
          {{ t('developer.bots.create') }}
        </button>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <div v-if="isLoading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else>
            <div v-if="bots.length > 0" class="space-y-2">
              <NuxtLink
                v-for="bot in bots"
                :key="bot.id"
                :to="`/developers/${pubName}/projects/${projectId}/bots/${bot.id}`"
                class="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-base-200"
              >
                <div class="avatar">
                  <div class="w-10 rounded-full">
                    <FileImage v-if="bot.account.profile?.picture" :file="bot.account.profile.picture" :alt="bot.account.nick" />
                    <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-info text-info-content text-sm font-bold">
                      {{ bot.account.nick?.slice(0, 2).toUpperCase() }}
                    </div>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{{ bot.account.nick }}</div>
                  <div class="text-sm text-base-content/50">@{{ bot.account.name }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="badge badge-sm"
                    :class="bot.isActive ? 'badge-success' : 'badge-warning'"
                  >
                    {{ bot.isActive ? 'Active' : 'Inactive' }}
                  </span>
                  <IconChevronRight class="w-5 h-5 text-base-content/30" />
                </div>
              </NuxtLink>
            </div>

            <div v-else class="flex flex-col items-center py-8 text-center">
              <IconBot class="w-12 h-12 text-base-content/20 mb-4" />
              <p class="text-base-content/60">{{ t('developer.bots.noBots') }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Create Bot Drawer -->
      <AdminDrawer
        :open="createModalOpen"
        :title="t('developer.bots.create')"
        @update:open="createModalOpen = $event"
      >
        <form @submit.prevent="handleCreate">
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">{{ t('developer.bots.name') }}</legend>
            <input v-model="newBot.name" type="text" class="input w-full" required minlength="2" maxlength="256" placeholder="my-bot" />
          </fieldset>
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">{{ t('developer.bots.nick') }}</legend>
            <input v-model="newBot.nick" type="text" class="input w-full" required maxlength="256" placeholder="My Bot" />
          </fieldset>
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">{{ t('developer.bots.slug') }}</legend>
            <input v-model="newBot.slug" type="text" class="input w-full" required maxlength="1024" placeholder="my-bot" />
          </fieldset>
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">{{ t('developer.bots.language') }}</legend>
            <input v-model="newBot.language" type="text" class="input w-full" maxlength="128" placeholder="en-us" />
          </fieldset>
          <fieldset class="fieldset mb-3">
            <legend class="fieldset-legend">{{ t('developer.bots.bio') }}</legend>
            <textarea v-model="newBot.bio" class="textarea w-full" rows="2" maxlength="4096" />
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="createModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isCreating">
              <span v-if="isCreating" class="loading loading-spinner loading-sm" />
              {{ t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconPlus,
  IconBot,
  IconChevronRight,
} from '#components'
import type { Bot } from '~/types/developer'
import { fetchBots, createBot } from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)
const projectId = computed(() => route.params.projectId as string)
const developer = useDeveloper()

const bots = ref<Bot[]>([])
const isLoading = ref(false)
const createModalOpen = ref(false)
const isCreating = ref(false)

const newBot = reactive({
  name: '',
  nick: '',
  slug: '',
  language: 'en-us',
  bio: '',
})

defineOgImage('UniOgImage', { title: `${t('developer.bots.title')} · ${pubName.value}` })

useSolarSeo({ title: `${t('developer.bots.title')} · ${pubName.value}` })

async function loadBots() {
  isLoading.value = true
  try {
    bots.value = await fetchBots(pubName.value, projectId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  newBot.name = ''
  newBot.nick = ''
  newBot.slug = ''
  newBot.language = 'en-us'
  newBot.bio = ''
  createModalOpen.value = true
}

async function handleCreate() {
  isCreating.value = true
  try {
    await createBot(pubName.value, projectId.value, {
      name: newBot.name,
      nick: newBot.nick,
      slug: newBot.slug,
      language: newBot.language || undefined,
      bio: newBot.bio || undefined,
    })
    createModalOpen.value = false
    await loadBots()
  } catch (e) {
    console.error(e)
  } finally {
    isCreating.value = false
  }
}

watch([pubName, projectId], async () => {
  await developer.loadDevelopers()
  developer.selectByPublisherName(pubName.value)
  await developer.loadProject(pubName.value, projectId.value)
  await loadBots()
}, { immediate: true })
</script>
