import { defineStore } from 'pinia'
import type { Developer } from '~/types/developer'
import { fetchDevelopers, fetchDevProject, fetchBot, fetchCustomApp } from '~/utils/developer'

export const useDeveloperStore = defineStore('developer', () => {
  const developers = ref<Developer[]>([])
  const currentDeveloper = ref<Developer | null>(null)
  const isLoading = ref(false)

  const hasDeveloperSelected = computed(() => !!currentDeveloper.value)
  const currentPublisherName = computed(
    () => currentDeveloper.value?.publisher?.name ?? null,
  )
  const currentPublisherNick = computed(
    () => currentDeveloper.value?.publisher?.nick ?? currentDeveloper.value?.publisher?.name ?? null,
  )

  async function loadDevelopers() {
    isLoading.value = true
    try {
      developers.value = await fetchDevelopers()
    } finally {
      isLoading.value = false
    }
  }

  function selectDeveloper(developer: Developer) {
    currentDeveloper.value = developer
  }

  function selectByPublisherName(pubName: string) {
    const match = developers.value.find(
      d => d.publisher?.name === pubName,
    )
    if (match) {
      currentDeveloper.value = match
    } else if (developers.value.length > 0 && !currentDeveloper.value) {
      currentDeveloper.value = developers.value[0]
    }
  }

  function clearSelection() {
    currentDeveloper.value = null
  }

  // ---- Project / Bot / App context (for breadcrumbs) ----
  const currentProject = ref<{ id: string; name: string; slug: string } | null>(null)
  const currentBot = ref<{ id: string; name: string; slug: string } | null>(null)
  const currentApp = ref<{ id: string; name: string; slug: string } | null>(null)
  const currentDistributionProduct = ref<{ name: string; slug: string } | null>(null)

  /** Breadcrumb context for `/developers/{pub}/distribution/{slug}`. */
  function setDistributionProduct(product: { name: string; slug: string } | null) {
    currentDistributionProduct.value = product
  }

  async function loadProject(pubName: string, projectId: string) {
    try {
      const proj = await fetchDevProject(pubName, projectId)
      if (proj) currentProject.value = { id: proj.id, name: proj.name, slug: proj.slug }
    } catch { /* ignore */ }
  }

  async function loadBot(pubName: string, projectId: string, botId: string) {
    try {
      const bot = await fetchBot(pubName, projectId, botId)
      if (bot) currentBot.value = { id: bot.id, name: bot.account.nick || bot.account.name, slug: bot.slug }
    } catch { /* ignore */ }
  }

  async function loadApp(pubName: string, projectId: string, appId: string) {
    try {
      const app = await fetchCustomApp(pubName, projectId, appId)
      if (app) currentApp.value = { id: app.id, name: app.name, slug: app.slug }
    } catch { /* ignore */ }
  }

  function clearProjectContext() {
    currentProject.value = null
    currentBot.value = null
    currentApp.value = null
  }

  return {
    developers,
    currentDeveloper,
    isLoading,
    hasDeveloperSelected,
    currentPublisherName,
    currentPublisherNick,
    currentProject,
    currentBot,
    currentApp,
    currentDistributionProduct,
    loadDevelopers,
    selectDeveloper,
    selectByPublisherName,
    clearSelection,
    loadProject,
    loadBot,
    loadApp,
    setDistributionProduct,
    clearProjectContext,
  }
})
