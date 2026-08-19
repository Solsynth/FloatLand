<template>
  <AdminSidebar
    :section-label="t('creator.studio')"
    :nav-groups="navGroups"
    :organizations="managedPublishers"
    :current-org="currentPublisher"
    :select-placeholder="t('creator.selectPublisher')"
    :clear-label="t('creator.clearPublisher')"
    :loading="isLoading"
    portal-mode="creator"
    :is-publisher-selected="!!currentPublisher"
    :show-portal-toggle="!!currentPublisher"
    :show-enroll-prompt="showEnrollPrompt"
    :enrolling="enrolling"
    :collapsed="props.collapsed"
    :collapsible="props.collapsible"
    @navigate="$emit('navigate')"
    @clear-selection="clearSelection(); $emit('navigate')"
    @toggle-portal="handleTogglePortal"
    @enroll-developer="handleEnroll"
    @dismiss-enroll="showEnrollPrompt = false"
    @toggle-collapse="$emit('toggleCollapse')"
  />
</template>

<script setup lang="ts">
import {
  IconLayoutDashboard,
  IconFileText,
  IconFolder,
  IconSticker,
  IconChartBar,
  IconRss,
  IconTrophy,
  IconUsers,
  IconUserPlus,
  IconSettings,
} from '#components'
import { enrollDeveloper } from '~/utils/developer'

defineEmits<{ navigate: []; toggleCollapse: [] }>()
const props = withDefaults(
  defineProps<{
    collapsed?: boolean
    collapsible?: boolean
  }>(),
  {
    collapsed: false,
    collapsible: false,
  },
)

const { t } = useI18n()
const { $toast } = useNuxtApp()
const creator = useCreator()
const developer = useDeveloper()
const { managedPublishers, currentPublisher, currentPublisherName, isLoading, clearSelection } = creator

const pubName = computed(() => currentPublisherName.value)
const showEnrollPrompt = ref(false)
const enrolling = ref(false)

// Check if the current publisher has a developer identity
const hasDeveloperIdentity = computed(() => {
  const name = pubName.value
  if (!name) return false
  return developer.developers.value.some(d => d.publisher?.name === name)
})

function handleTogglePortal(mode: 'creator' | 'developer' | 'merchant') {
  const name = pubName.value
  if (!name) return

  if (mode === 'developer') {
    if (hasDeveloperIdentity.value) {
      navigateTo(`/developers/${name}`)
    } else {
      showEnrollPrompt.value = true
    }
  } else if (mode === 'merchant') {
    navigateTo(`/merchants/${name}`)
  }
}

async function handleEnroll() {
  const name = pubName.value
  if (!name) return

  enrolling.value = true
  try {
    await enrollDeveloper(name)
    await developer.loadDevelopers()
    showEnrollPrompt.value = false
    navigateTo(`/developers/${name}`)
  } catch (e) {
    console.error('Failed to enroll as developer:', e)
    $toast.error(t('developer.enroll.notEnrolled'))
  } finally {
    enrolling.value = false
  }
}

onMounted(() => {
  // Ensure publisher list is available for the org selector
  creator.loadManagedPublishers().catch(() => {
    $toast.error('Failed to load publishers')
  })
  // Load developer list to check identity status
  developer.loadDevelopers().catch(() => {
    $toast.error('Failed to load developers')
  })
})

// Reset enroll prompt when publisher changes
watch(pubName, () => {
  showEnrollPrompt.value = false
})

const navGroups = computed(() => {
  if (!pubName.value) return []
  const p = pubName.value
  return [
    {
      label: t('nav.overview'),
      items: [
        { icon: IconLayoutDashboard, label: t('creator.dashboard'), href: `/creators/${p}` },
      ],
    },
    {
      label: t('nav.content'),
      items: [
        { icon: IconFileText, label: t('creator.posts.title'), href: `/creators/${p}/posts` },
        { icon: IconFolder, label: t('creator.collections.title'), href: `/creators/${p}/collections` },
        { icon: IconSticker, label: t('creator.stickers.title'), href: `/creators/${p}/stickers` },
        { icon: IconChartBar, label: t('creator.surveys.title'), href: `/creators/${p}/surveys` },
        { icon: IconRss, label: t('creator.feeds.title'), href: `/creators/${p}/feeds` },
      ],
    },
    {
      label: t('nav.community'),
      items: [
        { icon: IconTrophy, label: t('creator.leaderboard.title'), href: `/creators/${p}/leaderboard` },
        { icon: IconUsers, label: t('creator.members.title'), href: `/creators/${p}/members` },
        { icon: IconUserPlus, label: t('creator.subscribers.title'), href: `/creators/${p}/subscribers` },
      ],
    },
    {
      label: t('nav.settings'),
      items: [
        { icon: IconSettings, label: t('creator.settings'), href: `/creators/${p}/settings` },
      ],
    },
  ]
})
</script>
