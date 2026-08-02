<template>
  <div class="min-h-screen bg-base-200">
    <!-- Desktop Admin Layout -->
    <div class="hidden lg:flex min-h-screen">
      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 bottom-0 w-[16.5rem] z-40 overflow-y-auto scrollbar-none">
        <AdminSidebar
          section-label="Admin Panel"
          :nav-groups="navGroups"
          :organizations="[]"
          select-placeholder=""
          clear-label=""
          :show-portal-toggle="false"
        />
      </aside>

      <!-- Main Area -->
      <div class="ml-[16.5rem] flex-1 flex flex-col min-h-screen max-h-screen" :class="{ 'mr-[22rem]': $slots.rightbar }">
        <!-- Header -->
        <AdminHeader :breadcrumbs="breadcrumbs" :page-title="pageTitle" />

        <!-- Content -->
        <div class="flex-1 flex min-h-0">
          <main class="flex-1 min-w-0 overflow-y-auto px-5 py-5 lg:px-6 lg:py-6 scrollbar-none">
            <div class="mx-auto max-w-6xl">
              <slot />
            </div>
          </main>

          <!-- Right Sidebar -->
          <aside
            v-if="$slots.rightbar"
            class="w-88 shrink-0 overflow-y-auto border-l border-base-300/30 scrollbar-none"
          >
            <slot name="rightbar" />
          </aside>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden flex flex-col min-h-screen">
      <!-- Mobile Header -->
      <header class="fixed top-0 left-0 right-0 z-50 border-b border-base-300 bg-base-100">
        <div class="flex h-14 items-center justify-between px-4">
          <NuxtLink to="/" class="btn btn-circle btn-ghost btn-sm">
            <IconArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <span class="text-sm font-semibold">Admin Panel</span>
          <button type="button" class="btn btn-circle btn-ghost btn-sm" @click="mobileMenuOpen = !mobileMenuOpen">
            <IconMenu class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Mobile Nav Backdrop -->
      <Transition name="drawer-fade">
        <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 bg-black/40" @click="mobileMenuOpen = false" />
      </Transition>

      <!-- Mobile Nav Panel -->
      <Transition name="drawer-slide">
        <div
          v-if="mobileMenuOpen"
          class="fixed right-0 top-14 bottom-0 z-50 w-72 overflow-y-auto border-l border-base-300 bg-base-100 shadow-sm scrollbar-none"
          @click.stop
        >
          <AdminSidebar
            section-label="Admin"
            :nav-groups="navGroups"
            :organizations="[]"
            select-placeholder=""
            clear-label=""
            :show-portal-toggle="false"
            @navigate="mobileMenuOpen = false"
          />
        </div>
      </Transition>

      <!-- Mobile Main Content -->
      <main class="flex-1 px-4 py-4 pt-[4.5rem]">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconMenu,
  IconLayoutDashboard,
  IconUsers,
  IconShieldAlert,
  IconBell,
  IconMail,
  IconActivity,
  IconFileText,
  IconWallet,
  IconDatabase,
  IconKeyRound,
  IconTicket,
  IconHash,
  IconFolder,
  IconLayers,
  IconBuilding2,
  IconGlobe,
  IconClipboardCheck,
  IconHardDrive,
} from '#components'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navGroups = [
  {
    label: '',
    items: [
      {
        icon: IconLayoutDashboard,
        label: 'Dashboard',
        href: '/admin',
      },
    ],
  },
  {
    label: 'Accounts',
    items: [
      {
        icon: IconUsers,
        label: 'Accounts',
        href: '/admin/accounts',
      },
      {
        icon: IconKeyRound,
        label: 'Permissions',
        href: '/admin/permissions',
      },
      {
        icon: IconClipboardCheck,
        label: 'Tests',
        href: '/admin/tests',
      },
      {
        icon: IconShieldAlert,
        label: 'Punishments',
        href: '/admin/punishments',
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        icon: IconFileText,
        label: 'Posts',
        href: '/admin/posts',
      },
      {
        icon: IconBuilding2,
        label: 'Publishers',
        href: '/admin/publishers',
      },
      {
        icon: IconGlobe,
        label: 'Realms',
        href: '/admin/realms',
      },
      {
        icon: IconHash,
        label: 'Tags',
        href: '/admin/tags',
      },
      {
        icon: IconFolder,
        label: 'Categories',
        href: '/admin/categories',
      },
      {
        icon: IconLayers,
        label: 'Collections',
        href: '/admin/collections',
      },
    ],
  },
  {
    label: 'Economy',
    items: [
      {
        icon: IconWallet,
        label: 'Wallet',
        href: '/admin/wallet',
      },
    ],
  },
  {
    label: 'WattEngine',
    items: [
      {
        icon: IconBuilding2,
        label: 'Workspaces',
        href: '/admin/workspaces',
      },
      {
        icon: IconLayers,
        label: 'Ideask Boards',
        href: '/admin/boards',
      },
      {
        icon: IconClipboardCheck,
        label: 'Ideask Tasks',
        href: '/admin/tasks',
      },
      {
        icon: IconGlobe,
        label: 'GitHub Integrations',
        href: '/admin/github-integrations',
      },
      {
        icon: IconHardDrive,
        label: 'Flywheel',
        href: '/admin/flywheel',
      },
    ],
  },
  {
    label: 'Messaging',
    items: [
      {
        icon: IconTicket,
        label: 'Tickets',
        href: '/admin/tickets',
      },
      {
        icon: IconBell,
        label: 'Notifications',
        href: '/admin/notifications',
      },
      {
        icon: IconMail,
        label: 'Emails',
        href: '/admin/emails',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        icon: IconActivity,
        label: 'Presence Scan',
        href: '/admin/presence',
      },
      {
        icon: IconDatabase,
        label: 'Cache',
        href: '/admin/cache',
      },
      {
        icon: IconHardDrive,
        label: 'Storage',
        href: '/admin/storage',
      },
    ],
  },
]

const breadcrumbs = computed(() => {
  const parts: Array<{ label: string; href: string }> = [
    { label: 'Admin', href: '/admin' },
  ]

  const segments = route.path.split('/').filter(Boolean)
  // segments[0] is 'admin'

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i] as string
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = seg.charAt(0).toUpperCase() + seg.slice(1)
    parts.push({ label, href })
  }

  return parts
})

const pageTitle = computed(() => {
  const last = breadcrumbs.value[breadcrumbs.value.length - 1]
  if (!last) return 'Admin Panel'
  if (last.href === '/admin') return 'Dashboard'
  return last.label
})
</script>
