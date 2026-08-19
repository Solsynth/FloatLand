<template>
  <AdminSidebar
    :section-label="t('merchant.hub')"
    :nav-groups="navGroups"
    :organizations="managedPublishers"
    :current-org="currentPublisher"
    :select-placeholder="t('merchant.selectPublisher')"
    :clear-label="t('merchant.clearPublisher')"
    :loading="isLoading"
    portal-mode="merchant"
    :is-publisher-selected="!!currentPublisher"
    :show-portal-toggle="!!currentPublisher"
    :collapsed="props.collapsed"
    :collapsible="props.collapsible"
    @navigate="$emit('navigate')"
    @clear-selection="clearSelection(); $emit('navigate')"
    @toggle-portal="handleTogglePortal"
    @toggle-collapse="$emit('toggleCollapse')"
  />
</template>

<script setup lang="ts">
import {
  IconWallet,
  IconChartBar,
  IconTrendingUp,
  IconSettings,
  IconPackage,
} from '#components'

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
const merchant = useMerchant()
const developer = useDeveloper()
const { managedPublishers, currentPublisher, currentPublisherName, isLoading, clearSelection } = merchant

const pubName = computed(() => currentPublisherName.value)

const hasDeveloperIdentity = computed(() => {
  const name = pubName.value
  if (!name) return false
  return developer.developers.value.some(d => d.publisher?.name === name)
})

async function handleTogglePortal(mode: 'creator' | 'developer' | 'merchant') {
  const name = pubName.value
  if (!name) return

  if (mode === 'creator') {
    navigateTo(`/creators/${name}`)
  } else if (mode === 'developer') {
    if (hasDeveloperIdentity.value) {
      navigateTo(`/developers/${name}`)
    } else {
      $toast.error(t('developer.enroll.notEnrolled'))
    }
  }
}

onMounted(async () => {
  try {
    await merchant.loadManagedPublishers()
    developer.loadDevelopers().catch(() => {})
    // If a publisher is in the URL, auto-select it
    const name = useRoute().params.pubName
    if (typeof name === 'string') {
      const pub = merchant.managedPublishers.value.find(p => p.name === name)
      if (pub) await merchant.selectPublisher(pub)
    }
  } catch {
    $toast.error('Failed to load publishers')
  }
})

watch(() => useRoute().params.pubName, async (name) => {
  if (typeof name === 'string') {
    const pub = merchant.managedPublishers.value.find(p => p.name === name)
    if (pub && merchant.currentPublisherName.value !== name) {
      await merchant.selectPublisher(pub)
    }
  }
})

const navGroups = computed(() => {
  if (!pubName.value) return []
  const p = pubName.value
  return [
    {
      label: t('nav.overview'),
      items: [
        { icon: IconChartBar, label: t('merchant.dashboard'), href: `/merchants/${p}` },
      ],
    },
    {
      label: t('merchant.revenue'),
      items: [
        { icon: IconWallet, label: t('merchant.settlements'), href: `/merchants/${p}/settlements` },
        { icon: IconPackage, label: t('merchant.orders'), href: `/merchants/${p}/orders` },
        { icon: IconTrendingUp, label: t('merchant.ads'), href: `/merchants/${p}/ads` },
      ],
    },
    {
      label: t('nav.settings'),
      items: [
        { icon: IconSettings, label: t('merchant.settings'), href: `/merchants/${p}/settings` },
      ],
    },
  ]
})
</script>
