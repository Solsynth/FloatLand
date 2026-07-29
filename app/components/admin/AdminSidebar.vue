<template>
  <aside class="flex h-full flex-col bg-base-100">
    <!-- Logo -->
    <div class="flex h-14 shrink-0 items-center gap-3 px-4">
      <NuxtLink to="/" class="shrink-0">
        <img src="/favicon.png" alt="Logo" class="h-8 w-8" />
      </NuxtLink>
      <div class="min-w-0">
        <NuxtLink
          to="/"
          class="block text-sm font-bold tracking-tight text-base-content leading-tight"
        >
          Solar Network
        </NuxtLink>
        <p class="text-xs text-base-content/45 font-medium truncate">
          {{ sectionLabel }}
        </p>
      </div>
    </div>

    <!-- Portal Toggle (only when a publisher is selected) -->
    <div v-if="isPublisherSelected && showPortalToggle" class="px-3 pt-3 pb-1">
      <div class="flex rounded-box bg-base-200 p-0.5">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all duration-150"
          :class="portalMode === 'creator'
            ? 'flex-[1.4] min-w-0 bg-base-100 px-2 text-primary shadow-sm'
            : 'flex-none px-2 text-base-content/45 hover:text-base-content/70'"
          :title="t('portal.creator')"
          :aria-label="t('portal.creator')"
          :aria-current="portalMode === 'creator' ? 'page' : undefined"
          :disabled="portalMode === 'creator' || !currentOrg"
          @click="portalMode !== 'creator' && handleTogglePortal('creator')"
        >
          <IconPalette class="w-3.5 h-3.5 shrink-0" />
          <span v-if="portalMode === 'creator'" class="truncate">{{ t('portal.creator') }}</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all duration-150"
          :class="portalMode === 'developer'
            ? 'flex-[1.4] min-w-0 bg-base-100 px-2 text-primary shadow-sm'
            : 'flex-none px-2 text-base-content/45 hover:text-base-content/70'"
          :title="t('portal.developer')"
          :aria-label="t('portal.developer')"
          :aria-current="portalMode === 'developer' ? 'page' : undefined"
          :disabled="portalMode === 'developer' || !currentOrg"
          @click="portalMode !== 'developer' && handleTogglePortal('developer')"
        >
          <IconCode class="w-3.5 h-3.5 shrink-0" />
          <span v-if="portalMode === 'developer'" class="truncate">{{ t('portal.developer') }}</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all duration-150"
          :class="portalMode === 'merchant'
            ? 'flex-[1.4] min-w-0 bg-base-100 px-2 text-primary shadow-sm'
            : 'flex-none px-2 text-base-content/45 hover:text-base-content/70'"
          :title="t('portal.merchant')"
          :aria-label="t('portal.merchant')"
          :aria-current="portalMode === 'merchant' ? 'page' : undefined"
          :disabled="portalMode === 'merchant' || !currentOrg"
          @click="portalMode !== 'merchant' && handleTogglePortal('merchant')"
        >
          <IconWallet class="w-3.5 h-3.5 shrink-0" />
          <span v-if="portalMode === 'merchant'" class="truncate">{{ t('portal.merchant') }}</span>
        </button>
      </div>

      <!-- Enroll Prompt -->
      <div
        v-if="showEnrollPrompt"
        class="mt-2 rounded-box bg-warning/10 p-3"
      >
        <div class="flex items-start gap-2">
          <IconAlertTriangle class="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-warning">
              {{ t('developer.enroll.notEnrolled') }}
            </p>
            <p class="text-[11px] text-base-content/50 mt-0.5 leading-relaxed">
              {{ t('developer.enroll.notEnrolledHint') }}
            </p>
            <div class="flex items-center gap-2 mt-2">
              <button
                type="button"
                class="btn btn-warning btn-xs min-h-0 h-7 px-3"
                :class="{ loading: enrolling }"
                :disabled="enrolling"
                @click="handleEnrollDeveloper"
              >
                {{ t('developer.enroll.enrollNow') }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs min-h-0 h-7"
                @click="dismissEnrollPrompt"
              >
                {{ t('developer.enroll.dismiss') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Organization Selector -->
    <div v-if="organizations.length > 0" class="px-3 pt-3 pb-1">
      <div class="dropdown dropdown-end w-full">
        <label
          tabindex="0"
          class="flex w-full cursor-pointer items-center gap-2.5 rounded-box bg-base-200 px-2.5 py-2 transition-colors duration-150 hover:bg-base-300"
        >
          <div class="avatar shrink-0">
            <div class="w-8 rounded-full">
              <img
                v-if="getFileUrl(currentOrg?.picture?.id)"
                :src="getFileUrl(currentOrg?.picture?.id) ?? ''"
                :alt="currentOrgName ?? 'Organization'"
              >
              <div
                v-else
                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
              >
                {{ (currentOrgName || '?').slice(0, 2).toUpperCase() }}
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold leading-tight">
              {{ currentOrgName || selectPlaceholder }}
            </div>
            <div
              v-if="currentOrgSubtitle"
              class="truncate text-[11px] text-base-content/45 leading-tight mt-0.5"
            >
              @{{ currentOrgSubtitle }}
            </div>
          </div>
          <IconChevronDown class="w-4 h-4 shrink-0 text-base-content/40" />
        </label>
        <ul
          tabindex="0"
          class="dropdown-content menu z-[1] mt-1 w-full min-w-[220px] rounded-box bg-base-200 p-1.5 shadow-sm"
        >
          <li v-if="currentOrg">
            <button type="button" class="flex items-center gap-2.5 rounded-md" @click="handleClearSelection">
              <IconX class="w-4 h-4" />
              <span>{{ clearLabel }}</span>
            </button>
          </li>
          <li v-for="org in organizations" :key="org.id">
            <NuxtLink
              :to="getOrgLink(org)"
              class="flex items-center gap-2.5 rounded-md"
              :class="{ 'active bg-primary/10 text-primary': currentOrgId === org.id }"
              @click="handleNavigate"
            >
              <div class="avatar shrink-0">
                <div class="w-7 rounded-full">
                  <img
                    v-if="getFileUrl(org.picture?.id)"
                    :src="getFileUrl(org.picture?.id) ?? ''"
                    :alt="getOrgDisplayName(org) || 'Organization'"
                  >
                  <div
                    v-else
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold"
                  >
                    {{ getOrgDisplayName(org).slice(0, 2).toUpperCase() }}
                  </div>
                </div>
              </div>
              <div class="min-w-0">
                <div class="truncate text-sm font-medium">{{ getOrgDisplayName(org) }}</div>
                <div class="truncate text-[11px] text-base-content/45">@{{ getOrgSubtitle(org) }}</div>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-none">
      <div v-for="(group, gi) in navGroups" :key="gi">
        <p
          v-if="group.label"
          class="px-2.5 mb-1.5 text-[11px] font-semibold text-base-content/35"
        >
          {{ group.label }}
        </p>
        <div class="space-y-0.5">
          <NuxtLink
            v-for="item in group.items"
            :key="item.href"
            :to="item.href"
            class="group flex items-center gap-2.5 rounded-box px-2.5 py-2 text-sm font-medium transition-colors duration-150"
            :class="isActiveRoute(item.href)
              ? 'bg-primary/10 text-primary'
              : 'text-base-content/65 hover:bg-base-200 hover:text-base-content'"
            @click="handleNavigate"
          >
            <component
              :is="item.icon"
              class="w-[18px] h-[18px] shrink-0 transition-colors duration-150"
              :class="isActiveRoute(item.href) ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/65'"
            />
            <span class="truncate">{{ item.label }}</span>
            <span
              v-if="item.badge"
              class="ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums"
              :class="isActiveRoute(item.href) ? 'bg-primary/15 text-primary' : 'bg-base-200 text-base-content/50'"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- User Profile -->
    <div class="mt-auto shrink-0 px-3 pb-3 pt-2">
      <div v-if="isAuthenticated && user" class="dropdown dropdown-end dropdown-top w-full">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-box px-2.5 py-2 transition-colors duration-150 hover:bg-base-200"
        >
          <div v-if="avatarUrl" class="avatar shrink-0">
            <div class="w-8 rounded-full">
              <img :src="avatarUrl ?? ''" :alt="displayName || 'User'">
            </div>
          </div>
          <div v-else class="avatar avatar-placeholder shrink-0">
            <div class="w-8 rounded-full bg-primary/10 text-primary">
              <span class="text-xs font-bold">{{ fallbackInitials }}</span>
            </div>
          </div>
          <div class="min-w-0 flex-1 text-left">
            <div class="truncate text-sm font-semibold leading-tight">{{ displayName }}</div>
            <div class="truncate text-[11px] text-base-content/45 leading-tight mt-0.5">@{{ username }}</div>
          </div>
          <IconChevronUp class="w-3.5 h-3.5 shrink-0 text-base-content/30" />
        </button>
        <ul class="dropdown-content menu mb-1.5 w-full min-w-[200px] rounded-box bg-base-200 p-1.5 shadow-sm">
          <li>
            <NuxtLink to="/accounts/me" class="flex items-center gap-2.5 rounded-md">
              <IconUser class="w-4 h-4" />
              {{ t('nav.account') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/accounts/me/settings" class="flex items-center gap-2.5 rounded-md">
              <IconSettings class="w-4 h-4" />
              {{ t('nav.settings') }}
            </NuxtLink>
          </li>
          <li>
            <button type="button" class="flex items-center gap-2.5 rounded-md text-error" @click="handleLogout">
              <IconLogOut class="w-4 h-4" />
              {{ t('nav.logout') }}
            </button>
          </li>
        </ul>
      </div>
      <NuxtLink
        v-else
        to="/auth/login"
        class="flex items-center gap-2.5 rounded-box px-2.5 py-2 transition-colors duration-150 hover:bg-base-200"
      >
        <div class="avatar avatar-placeholder shrink-0">
          <div class="w-8 rounded-full bg-base-200 text-base-content/55">
            <IconLogIn class="w-4 h-4" />
          </div>
        </div>
        <div class="text-left min-w-0">
          <div class="text-sm font-semibold">{{ t('nav.signIn') }}</div>
          <div class="text-[11px] text-base-content/45">{{ t('nav.joinCommunity') }}</div>
        </div>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { getFileUrl } from '~/utils/files'
import {
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconLogOut,
  IconLogIn,
  IconUser,
  IconSettings,
  IconPalette,
  IconCode,
  IconWallet,
  IconAlertTriangle,
} from '#components'

const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, user, displayName: authDisplayName, logout } = useAuth()

const props = withDefaults(defineProps<{
  /** Section label shown under the logo (e.g. "Creator Studio", "Developer Console") */
  sectionLabel: string
  /** Navigation groups for the sidebar */
  navGroups: Array<{
    label?: string
    items: Array<{
      icon: any
      label: string
      href: string
      badge?: string | number
    }>
  }>
  /** Organizations/publishers list */
  organizations: Array<{
    id: string
    name: string
    nick?: string
    picture?: { id: string } | null
    [key: string]: any
  }>
  /** Currently selected organization */
  currentOrg?: {
    id: string
    name: string
    nick?: string
    picture?: { id: string } | null
    [key: string]: any
  } | null
  /** Placeholder text for organization selector */
  selectPlaceholder: string
  /** Clear selection label */
  clearLabel?: string
  /** Whether data is still loading */
  loading?: boolean
  /** Current portal mode */
  portalMode?: 'creator' | 'developer' | 'merchant'
  /** Whether a publisher is selected */
  isPublisherSelected?: boolean
  /** Whether to show the portal toggle */
  showPortalToggle?: boolean
  /** Whether to show the enroll prompt */
  showEnrollPrompt?: boolean
  /** Whether enrollment is in progress */
  enrolling?: boolean
}>(), {
  clearLabel: '',
  portalMode: 'creator' as 'creator' | 'developer' | 'merchant',
  isPublisherSelected: false,
  showPortalToggle: true,
  showEnrollPrompt: false,
  enrolling: false,
})

const emit = defineEmits<{
  navigate: []
  clearSelection: []
  togglePortal: [mode: 'creator' | 'developer' | 'merchant']
  enrollDeveloper: []
  dismissEnroll: []
}>()

const currentOrgId = computed(() => props.currentOrg?.id ?? null)
const currentOrgName = computed((): string | undefined => {
  if (!props.currentOrg) return undefined
  return props.currentOrg.nick || props.currentOrg.name
})
const currentOrgSubtitle = computed(() => props.currentOrg?.name ?? null)

function getOrgDisplayName(org: any): string {
  return org.nick || org.name || 'Unknown'
}

function getOrgSubtitle(org: any): string {
  return org.name || ''
}

function getOrgLink(org: any): string {
  const prefix = props.portalMode === 'merchant' ? 'merchants'
    : props.portalMode === 'developer' ? 'developers' : 'creators'
  return `/${prefix}/${org.name}`
}

function handleNavigate() {
  emit('navigate')
}

function handleClearSelection() {
  emit('clearSelection')
}

function handleTogglePortal(mode: 'creator' | 'developer' | 'merchant') {
  emit('togglePortal', mode)
}

function handleEnrollDeveloper() {
  emit('enrollDeveloper')
}

function dismissEnrollPrompt() {
  emit('dismissEnroll')
}

const displayName = computed(() => authDisplayName.value || user.value?.nick || user.value?.name || '')
const username = computed(() => user.value?.name || '')
const avatarUrl = computed(() => getFileUrl(user.value?.profile?.picture?.id))
const fallbackInitials = computed(() => (username.value || '?').slice(0, 2).toUpperCase())

/** All nav hrefs flattened for longest-match active detection */
const allNavHrefs = computed(() =>
  props.navGroups.flatMap(g => g.items.map(i => i.href)),
)

/**
 * Prefer exact match; if path is under a href, only mark active when no longer
 * matching sibling/child nav item exists (prevents dashboard always active).
 */
function isActiveRoute(href: string): boolean {
  const path = route.path
  if (path === href) return true
  if (!path.startsWith(href + '/')) return false

  // If another nav item is a longer prefix match, defer to it
  const longerMatch = allNavHrefs.value.some(
    other => other !== href && other.startsWith(href) && (path === other || path.startsWith(other + '/')),
  )
  if (longerMatch) return false

  // If another nav item matches the path more specifically as a sibling path segment
  const hasMoreSpecific = allNavHrefs.value.some((other) => {
    if (other === href) return false
    if (path === other || path.startsWith(other + '/')) {
      return other.length > href.length
    }
    return false
  })
  return !hasMoreSpecific
}

function handleLogout() {
  logout()
  navigateTo('/')
}
</script>
