<template>
  <NuxtLayout name="admin">
    <div v-if="isLoadingDetail" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <template v-else-if="detail">
      <div class="flex items-center gap-3 mb-6">
        <NuxtLink to="/admin/accounts" class="btn btn-circle btn-ghost btn-sm">
          <IconArrowLeft class="w-4 h-4" />
        </NuxtLink>
        <div class="avatar">
          <div class="w-10 rounded-full">
            <img
              v-if="getFileUrl(detail.account.profile?.picture?.id)"
              :src="getFileUrl(detail.account.profile?.picture?.id)"
              :alt="detail.account.nick"
            />
            <div
              v-else
              class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold"
            >
              {{ (detail.account.nick || detail.account.name).slice(0, 2).toUpperCase() }}
            </div>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold tracking-tight">{{ detail.account.nick || detail.account.name }}</h1>
            <span
              v-if="detail.account.isSuperuser"
              class="badge badge-warning badge-xs"
            >Superuser</span>
            <span
              v-if="detail.account.automatedId"
              class="badge badge-ghost badge-xs"
            >Bot</span>
            <span
              class="badge badge-xs"
              :class="detail.account.activatedAt ? 'badge-success' : 'badge-ghost'"
            >
              {{ detail.account.activatedAt ? 'Activated' : 'Not activated' }}
            </span>
          </div>
          <p class="text-sm text-base-content/50">@{{ detail.account.name }}</p>
        </div>
        <div v-if="detail.status" class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-base-200/80">
          <span class="inline-block w-2 h-2 rounded-full" :class="detail.status.isOnline ? 'bg-success' : 'bg-base-300'" />
          <span class="text-xs font-medium text-base-content/60">{{ detail.status.label }}</span>
        </div>
      </div>

      <div v-if="detail.activePunishment" class="rounded-xl bg-error/5 border border-error/20 p-4 mb-6">
        <div class="flex items-start gap-3">
          <IconShieldAlert class="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-error">Active Punishment</p>
            <p class="text-xs text-base-content/60 mt-0.5">{{ detail.activePunishment.reason || 'No reason provided' }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- Account Info -->
          <AdminCard title="Account Information">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Account ID</span>
                <p class="font-mono text-xs mt-1 break-all text-base-content/70">{{ detail.account.id }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Username</span>
                <p class="mt-1 text-base-content/70">@{{ detail.account.name }}</p>
              </div>
              <div v-if="detail.account.nick">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Nickname</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.nick }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Activated At</span>
                <p class="mt-1 text-base-content/70">
                  {{ detail.account.activatedAt ? formatDateTime(detail.account.activatedAt) : '—' }}
                </p>
              </div>
              <div v-if="detail.account.createdAt">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Created At</span>
                <p class="mt-1 text-base-content/70">{{ formatDateTime(detail.account.createdAt) }}</p>
              </div>
              <div v-if="detail.account.updatedAt">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Updated At</span>
                <p class="mt-1 text-base-content/70">{{ formatDateTime(detail.account.updatedAt) }}</p>
              </div>
              <div v-if="detail.account.deletedAt">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Deleted At</span>
                <p class="mt-1 text-error">{{ formatDateTime(detail.account.deletedAt) }}</p>
              </div>
              <div v-if="detail.account.language">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Language</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.language }}</p>
              </div>
              <div v-if="detail.account.region">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Region</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.region }}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Superuser</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.isSuperuser ? 'Yes' : 'No' }}</p>
              </div>
              <div v-if="detail.account.automatedId">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Automated / Bot ID</span>
                <p class="font-mono text-xs mt-1 break-all text-base-content/70">{{ detail.account.automatedId }}</p>
              </div>
              <div v-if="detail.account.perkLevel !== undefined">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Perk Level</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.perkLevel }}</p>
              </div>
              <div v-if="detail.status">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Presence</span>
                <p class="mt-1 text-base-content/70">
                  {{ detail.status.label }}
                  <span class="text-base-content/40">({{ detail.status.isOnline ? 'online' : 'offline' }})</span>
                </p>
              </div>
            </div>
          </AdminCard>

          <!-- Profile -->
          <AdminCard v-if="detail.account.profile" title="Profile">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="openProfileEdit">
                <IconPencil class="w-3.5 h-3.5" /> Edit
              </button>
            </template>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div v-if="profileFullName" class="sm:col-span-2">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Legal / Display Name</span>
                <p class="mt-1 text-base-content/70">{{ profileFullName }}</p>
              </div>
              <div v-if="detail.account.profile.bio" class="sm:col-span-2">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Bio</span>
                <p class="mt-1 text-base-content/70 whitespace-pre-wrap">{{ detail.account.profile.bio }}</p>
              </div>
              <div v-if="detail.account.profile.gender">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Gender</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.profile.gender }}</p>
              </div>
              <div v-if="detail.account.profile.pronouns">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Pronouns</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.profile.pronouns }}</p>
              </div>
              <div v-if="detail.account.profile.location">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Location</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.profile.location }}</p>
              </div>
              <div v-if="detail.account.profile.timeZone">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Time Zone</span>
                <p class="mt-1 text-base-content/70">{{ detail.account.profile.timeZone }}</p>
              </div>
              <div v-if="detail.account.profile.birthday">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Birthday</span>
                <p class="mt-1 text-base-content/70">{{ formatDate(detail.account.profile.birthday) }}</p>
              </div>
              <div v-if="detail.account.profile.lastSeenAt">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Last Seen</span>
                <p class="mt-1 text-base-content/70">
                  {{ formatDateTime(detail.account.profile.lastSeenAt) }}
                  <span class="text-base-content/40">({{ formatTimeAgo(detail.account.profile.lastSeenAt) }})</span>
                </p>
              </div>
              <div v-if="detail.account.profile.level !== undefined">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Level</span>
                <p class="mt-1 text-base-content/70">
                  {{ detail.account.profile.level }}
                  <span v-if="detail.account.profile.experience !== undefined" class="text-base-content/40">
                    · {{ detail.account.profile.experience }} XP
                  </span>
                </p>
              </div>
              <div v-if="detail.account.profile.socialCredits !== undefined">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Social Credits</span>
                <p class="mt-1 text-base-content/70">
                  {{ detail.account.profile.socialCredits }}
                  <span v-if="detail.account.profile.socialCreditsLevel !== undefined" class="text-base-content/40">
                    (tier {{ detail.account.profile.socialCreditsLevel }})
                  </span>
                </p>
              </div>
              <div v-if="detail.account.profile.links?.length" class="sm:col-span-2">
                <span class="text-xs text-base-content/40 uppercase tracking-wider">Links</span>
                <div class="mt-1 flex flex-wrap gap-2">
                  <a
                    v-for="(link, li) in detail.account.profile.links"
                    :key="li"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link link-primary text-xs"
                  >
                    {{ link.label || link.name || link.url }}
                  </a>
                </div>
              </div>
            </div>
          </AdminCard>

          <!-- Verification -->
          <AdminCard title="Verification">
            <div class="space-y-3">
              <div v-if="profileVerification" class="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                <div class="flex items-center gap-2">
                  <IconBadgeCheck class="w-4 h-4 text-success" />
                  <div>
                    <p class="text-sm font-medium">{{ profileVerification.title || 'Verified' }}</p>
                    <p v-if="profileVerification.description" class="text-xs text-base-content/50">{{ profileVerification.description }}</p>
                    <p v-if="profileVerification.verifiedBy" class="text-xs text-base-content/40 mt-0.5">
                      By {{ profileVerification.verifiedBy }} · type {{ profileVerification.type }}
                    </p>
                  </div>
                </div>
                <button class="btn btn-ghost btn-xs text-error" @click="clearVerify">Clear</button>
              </div>
              <p v-else class="text-sm text-base-content/40">Not verified</p>
              <button class="btn btn-ghost btn-xs" @click="openVerify">Set Verification</button>
            </div>
          </AdminCard>

          <!-- Name History -->
          <AdminCard title="Name History">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadNameHistory">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="nameHistory.length" class="space-y-1">
              <div v-for="(entry, i) in nameHistory" :key="i" class="flex items-center gap-2 text-xs p-1.5">
                <span class="font-mono text-base-content/60">{{ entry.name }}</span>
                <span v-if="entry.createdAt" class="text-base-content/30 ml-auto">{{ formatDateTime(entry.createdAt) }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No name history</p>
          </AdminCard>

          <!-- Contacts -->
          <AdminCard title="Contact Methods">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="contactEdit = null; contactForm = { type: 0, content: '' }; contactDrawerOpen = true">
                <IconPlus class="w-3.5 h-3.5" /> Add
              </button>
            </template>
            <div v-if="contacts.length" class="space-y-2">
              <div v-for="c in contacts" :key="c.id" class="flex flex-col gap-2 p-3 rounded-lg bg-base-200/50">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-base-300/60 text-base-content/50 uppercase tracking-wider">
                    {{ contactTypeLabel(c.type) }}
                  </span>
                  <span class="text-sm flex-1 min-w-0 truncate">{{ c.content }}</span>
                  <span v-if="c.isPrimary" class="badge badge-primary badge-xs">Primary</span>
                  <span v-if="c.verifiedAt" class="badge badge-success badge-xs">Verified</span>
                  <span v-if="c.isPublic" class="badge badge-ghost badge-xs">Public</span>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40 pl-0.5">
                  <span v-if="c.verifiedAt">Verified {{ formatDateTime(c.verifiedAt) }}</span>
                  <span v-if="c.createdAt">Created {{ formatDateTime(c.createdAt) }}</span>
                  <span v-if="c.updatedAt">Updated {{ formatDateTime(c.updatedAt) }}</span>
                </div>
                <div class="flex items-center gap-1 flex-wrap">
                  <button v-if="!c.isPrimary" class="btn btn-ghost btn-xs" @click="doSetPrimaryContact(c.id)">Set Primary</button>
                  <button
                    v-if="!c.verifiedAt && c.type === 0"
                    class="btn btn-ghost btn-xs"
                    @click="doRequestContactVerification(c.id)"
                  >
                    Send Verify
                  </button>
                  <button v-if="!c.verifiedAt" class="btn btn-ghost btn-xs text-success" @click="doVerifyContact(c.id)">Force Verify</button>
                  <button v-if="c.verifiedAt" class="btn btn-ghost btn-xs text-warning" @click="doUnverifyContact(c.id)">Unverify</button>
                  <button class="btn btn-ghost btn-xs" @click="doToggleContactVisibility(c)">
                    {{ c.isPublic ? 'Make Private' : 'Make Public' }}
                  </button>
                  <button class="btn btn-ghost btn-xs" @click="editContact(c)">Edit</button>
                  <button class="btn btn-ghost btn-xs text-error" @click="doDeleteContact(c.id)">Delete</button>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No contact methods</p>
          </AdminCard>

          <!-- Connected Platforms (public) -->
          <AdminCard title="Connected Platforms">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadConnections">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="connectionsLoading" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm" />
            </div>
            <div v-else-if="connections.length" class="space-y-2">
              <div
                v-for="(conn, ci) in connections"
                :key="`${conn.provider}-${conn.providedIdentifier}-${ci}`"
                class="flex items-center gap-3 p-2 rounded-lg bg-base-200/50"
              >
                <IconLink class="w-4 h-4 text-base-content/40 shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium capitalize">{{ conn.provider }}</p>
                  <p class="text-xs text-base-content/40 font-mono truncate">{{ conn.providedIdentifier }}</p>
                </div>
                <a
                  v-if="conn.url"
                  :href="conn.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-ghost btn-xs"
                >
                  Open
                </a>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No public connections</p>
            <p class="text-[10px] text-base-content/30 mt-2">
              Shows only connections the account has marked public.
            </p>
          </AdminCard>

          <!-- Passkeys -->
          <AdminCard title="Passkeys">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadPasskeys">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="passkeys.length" class="space-y-2">
              <div v-for="pk in passkeys" :key="pk.id" class="flex items-center gap-3 p-2 rounded-lg bg-base-200/50">
                <IconKeyRound class="w-4 h-4 text-base-content/40" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">{{ pk.label || 'Unnamed Passkey' }}</p>
                  <p class="text-[10px] text-base-content/40 font-mono">{{ pk.id.slice(0, 16) }}…</p>
                </div>
                <span v-if="pk.createdAt" class="text-xs text-base-content/40">{{ formatDateTime(pk.createdAt) }}</span>
                <button class="btn btn-ghost btn-xs text-error" @click="doDeletePasskey(pk.id)">Delete</button>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No passkeys</p>
          </AdminCard>

          <!-- All Connections (admin view) -->
          <AdminCard title="All Connections">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadAdminConnections">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="adminConnections.length" class="space-y-2">
              <div v-for="conn in adminConnections" :key="conn.id" class="flex items-center gap-3 p-2 rounded-lg bg-base-200/50">
                <IconLink class="w-4 h-4 text-base-content/40" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium capitalize">{{ conn.provider }}</p>
                  <p class="text-xs text-base-content/40 font-mono truncate">{{ conn.providedIdentifier }}</p>
                </div>
                <span v-if="conn.isPublic" class="badge badge-ghost badge-xs">Public</span>
                <span v-if="conn.registeredAt" class="badge badge-primary badge-xs">Registration</span>
                <span v-if="conn.lastUsedAt" class="text-xs text-base-content/40">{{ formatTimeAgo(conn.lastUsedAt) }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No connections</p>
          </AdminCard>

          <!-- Magic Spells -->
          <AdminCard title="Magic Spells">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadSpells">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
              <button class="btn btn-ghost btn-xs" @click="spellCreateOpen = true">
                <IconPlus class="w-3.5 h-3.5" /> Create
              </button>
            </template>
            <div v-if="spellsLoading" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm" />
            </div>
            <div v-else-if="spells.length" class="space-y-2">
              <div
                v-for="spell in spells"
                :key="spell.id"
                class="p-3 rounded-lg bg-base-200/50 space-y-2"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <IconSparkles class="w-4 h-4 text-base-content/40 shrink-0" />
                  <span class="text-sm font-medium flex-1">{{ spellTypeLabel(spell.type) }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-base-300/60 text-base-content/50">
                    type {{ spell.type }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40 pl-6">
                  <span v-if="spell.createdAt">Created {{ formatDateTime(spell.createdAt) }}</span>
                  <span v-if="spell.expiresAt">Expires {{ formatDateTime(spell.expiresAt) }}</span>
                  <span v-else>No expiry</span>
                  <span v-if="spell.affectedAt">Affected {{ formatDateTime(spell.affectedAt) }}</span>
                  <span class="font-mono">{{ spell.id.slice(0, 8) }}…</span>
                </div>
                <pre
                  v-if="spell.meta && Object.keys(spell.meta).length"
                  class="text-[10px] font-mono bg-base-100/60 rounded-lg p-2 overflow-x-auto max-h-20 ml-6"
                >{{ JSON.stringify(spell.meta, null, 2) }}</pre>
                <div class="flex items-center gap-1 pl-6">
                  <button
                    v-if="spell.type !== 1"
                    class="btn btn-ghost btn-xs"
                    @click="doResendSpell(spell.id)"
                  >
                    Resend Email
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" @click="doDeleteSpell(spell.id)">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No outstanding magic spells</p>
            <p class="text-[10px] text-base-content/30 mt-2">
              Spell secrets are never returned by the API. Resend clears the delivery throttle.
            </p>
          </AdminCard>

          <!-- Relationships -->
          <AdminCard title="Relationships">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadRelationships">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="relationships.length" class="space-y-2">
              <div v-for="rel in relationships" :key="`${rel.accountId}-${rel.relatedId}`" class="flex items-center gap-3 p-2 rounded-lg bg-base-200/50">
                <IconUsers class="w-4 h-4 text-base-content/40" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-mono text-xs">{{ rel.relatedId.slice(0, 16) }}…</p>
                  <p class="text-[10px] text-base-content/40">Status: {{ rel.status }}</p>
                </div>
                <span v-if="rel.alias" class="badge badge-ghost badge-xs">{{ rel.alias }}</span>
                <span v-if="rel.createdAt" class="text-xs text-base-content/40">{{ formatDateTime(rel.createdAt) }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No relationships</p>
          </AdminCard>

          <!-- Action Logs -->
          <AdminCard title="Action Logs">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadActionLogs">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="actionLogsLoading" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm" />
            </div>
            <div v-else-if="actionLogs.length" class="space-y-2">
              <div v-for="log in actionLogs" :key="log.id" class="p-2 rounded-lg bg-base-200/50 text-xs">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-primary">{{ log.action }}</span>
                  <span v-if="log.ipAddress" class="text-base-content/40">{{ log.ipAddress }}</span>
                  <span class="text-base-content/30 ml-auto">{{ formatDateTime(log.createdAt) }}</span>
                </div>
                <pre v-if="log.meta && Object.keys(log.meta).length" class="text-[10px] font-mono bg-base-100/60 rounded p-1.5 mt-1 overflow-x-auto max-h-16">{{ JSON.stringify(log.meta, null, 2) }}</pre>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No action logs</p>
          </AdminCard>

          <!-- Auth Factors -->
          <AdminCard title="Authentication Factors">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="factorCreateOpen = true">
                <IconPlus class="w-3.5 h-3.5" /> Add
              </button>
            </template>
            <div v-if="factors.length" class="space-y-2">
              <div v-for="f in factors" :key="f.id" class="flex flex-col gap-1.5 p-3 rounded-lg bg-base-200/50">
                <div class="flex items-center gap-3">
                  <IconKeyRound class="w-4 h-4 text-base-content/40 shrink-0" />
                  <span class="text-sm flex-1">{{ factorTypeLabel(f.type) }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="f.enabledAt ? 'bg-success/10 text-success' : 'bg-base-300/60 text-base-content/40'">
                    {{ f.enabledAt ? 'Enabled' : 'Disabled' }}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="f.hasSecret ? 'bg-success/10 text-success' : 'bg-base-300/60 text-base-content/40'">
                    {{ f.hasSecret ? 'Configured' : 'Pending' }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40 pl-7">
                  <span v-if="f.trustworthy !== undefined">Trust {{ f.trustworthy }}</span>
                  <span v-if="f.enabledAt">Enabled {{ formatDateTime(f.enabledAt) }}</span>
                  <span v-if="f.expiredAt">Expires {{ formatDateTime(f.expiredAt) }}</span>
                  <span v-if="f.createdAt">Created {{ formatDateTime(f.createdAt) }}</span>
                  <span class="font-mono">{{ f.id.slice(0, 8) }}…</span>
                </div>
                <div class="flex items-center gap-1 pl-7">
                  <button v-if="!f.enabledAt" class="btn btn-ghost btn-xs text-success" @click="doEnableFactor(f.id)">Enable</button>
                  <button v-if="f.enabledAt" class="btn btn-ghost btn-xs text-warning" @click="doDisableFactor(f.id)">Disable</button>
                  <button class="btn btn-ghost btn-xs text-error" @click="doDeleteFactor(f.id)">Delete</button>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No auth factors</p>
            <div class="mt-3">
              <button class="btn btn-ghost btn-xs text-warning" @click="passwordResetOpen = true">Reset Password</button>
            </div>
          </AdminCard>

          <!-- Badges -->
          <AdminCard title="Badges">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="badgeGrantOpen = true">
                <IconPlus class="w-3.5 h-3.5" /> Grant
              </button>
            </template>
            <div v-if="badges.length" class="space-y-2">
              <div v-for="b in badges" :key="b.id" class="flex flex-col gap-1.5 p-3 rounded-lg bg-base-200/50">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium flex-1">{{ b.label || b.type }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-base-300/60 text-base-content/50">{{ b.type }}</span>
                  <span
                    v-if="b.activatedAt"
                    class="badge badge-success badge-xs"
                  >Active</span>
                  <span
                    v-if="b.expiredAt"
                    class="badge badge-ghost badge-xs"
                  >Expires</span>
                </div>
                <p v-if="b.caption" class="text-xs text-base-content/50">{{ b.caption }}</p>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40">
                  <span v-if="b.activatedAt">Activated {{ formatDateTime(b.activatedAt) }}</span>
                  <span v-else>Not activated</span>
                  <span v-if="b.expiredAt">Expires {{ formatDateTime(b.expiredAt) }}</span>
                  <span v-if="b.createdAt">Granted {{ formatDateTime(b.createdAt) }}</span>
                  <span v-if="b.updatedAt">Updated {{ formatDateTime(b.updatedAt) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="btn btn-ghost btn-xs text-success" @click="doActivateBadge(b.id)">Activate</button>
                  <button class="btn btn-ghost btn-xs text-error" @click="doRevokeBadge(b.id)">Revoke</button>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No badges</p>
          </AdminCard>

          <!-- Active Punishments -->
          <AdminCard v-if="detail.activePunishments?.length" title="Active Punishments">
            <div class="space-y-2">
              <div v-for="punishment in detail.activePunishments" :key="punishment.id" class="flex items-start gap-3 p-3 rounded-lg bg-error/5 border border-error/10">
                <IconBan class="w-4 h-4 text-error shrink-0 mt-0.5" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ punishmentTypeLabel(punishment.type) }}</span>
                    <button class="btn btn-ghost btn-xs text-error" @click="handleDeletePunishment(punishment.id)">
                      <IconTrash2 class="w-3 h-3" />
                    </button>
                  </div>
                  <p class="text-xs text-base-content/50 mt-0.5">{{ punishment.reason || 'No reason' }}</p>
                  <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40 mt-1">
                    <span v-if="punishment.createdAt">Created {{ formatDateTime(punishment.createdAt) }}</span>
                    <span v-if="punishment.expiredAt || punishment.expiresAt">
                      Expires {{ formatDateTime((punishment.expiredAt || punishment.expiresAt)!) }}
                    </span>
                    <span v-else>No expiry</span>
                  </div>
                </div>
              </div>
            </div>
          </AdminCard>

          <!-- Activities -->
          <AdminCard v-if="detail.activities?.length" title="Presence Activities">
            <div class="space-y-2">
              <div v-for="(activity, ai) in detail.activities" :key="ai" class="flex items-center gap-3 p-2 rounded-lg bg-base-200/50">
                <IconGamepad2 class="w-4 h-4 text-base-content/40" />
                <span class="text-sm flex-1">{{ activity.title }}</span>
                <span class="text-xs text-base-content/40 capitalize">{{ activity.provider }}</span>
              </div>
            </div>
          </AdminCard>

          <!-- Profile Board -->
          <AdminCard title="Profile Board">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadBoard">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="boardLoading" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm" />
            </div>
            <div v-else-if="boardItems.length" class="space-y-2">
              <div
                v-for="item in boardItems"
                :key="item.id"
                class="p-3 rounded-lg bg-base-200/50 space-y-2"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <IconLayoutGrid class="w-4 h-4 text-base-content/40 shrink-0" />
                  <span class="text-sm font-medium flex-1">
                    {{ item.widgetKey || item.customAppWidgetKey || 'Widget' }}
                  </span>
                  <span class="badge badge-ghost badge-xs">
                    {{ boardKindLabel(item.kind) }}
                  </span>
                  <span class="badge badge-xs" :class="item.isEnabled ? 'badge-success' : 'badge-ghost'">
                    {{ item.isEnabled ? 'Enabled' : 'Disabled' }}
                  </span>
                  <span class="text-[10px] text-base-content/35">#{{ item.order }}</span>
                </div>
                <div class="text-[10px] text-base-content/40 font-mono pl-6 truncate">
                  {{ item.id }}
                  <span v-if="item.customAppId"> · app {{ item.customAppId.slice(0, 8) }}…</span>
                </div>
                <pre
                  v-if="item.payload && Object.keys(item.payload).length"
                  class="text-[10px] font-mono bg-base-100/60 rounded-lg p-2 overflow-x-auto max-h-28 pl-2"
                >{{ JSON.stringify(item.payload, null, 2) }}</pre>
                <div class="flex items-center gap-1 pl-6">
                  <button class="btn btn-ghost btn-xs" @click="openPushPayload(item)">
                    <IconPencil class="w-3 h-3" /> Push Payload
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" @click="doDeleteBoardItem(item.id)">
                    <IconTrash2 class="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No board widgets</p>
          </AdminCard>

          <!-- Devices -->
          <AdminCard title="Devices">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadDevices">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="devicesLoading" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm" />
            </div>
            <div v-else-if="devices.length" class="space-y-2">
              <div
                v-for="device in devices"
                :key="device.id"
                class="p-3 rounded-lg bg-base-200/50 space-y-2"
              >
                <div class="flex items-center gap-2">
                  <IconMonitor class="w-4 h-4 text-base-content/40" />
                  <span class="text-sm font-medium flex-1 truncate">
                    {{ device.label || device.deviceLabel || device.deviceName || 'Unnamed Device' }}
                  </span>
                  <span v-if="device.platform" class="badge badge-ghost badge-xs">{{ device.platform }}</span>
                  <span v-if="device.lastActiveAt" class="text-xs text-base-content/40">{{ formatTimeAgo(device.lastActiveAt) }}</span>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40 pl-6">
                  <span class="font-mono truncate" :title="deviceRouteId(device)">
                    {{ deviceRouteId(device).slice(0, 20) }}{{ deviceRouteId(device).length > 20 ? '…' : '' }}
                  </span>
                  <span v-if="device.createdAt">Created {{ formatDateTime(device.createdAt) }}</span>
                  <span v-if="device.lastActiveAt">Last active {{ formatDateTime(device.lastActiveAt) }}</span>
                  <span v-if="device.deletedAt" class="text-error">Deleted {{ formatDateTime(device.deletedAt) }}</span>
                </div>
                <div class="flex items-center gap-1.5 pl-6">
                  <button class="btn btn-ghost btn-xs" @click="editDeviceLabel(device)">
                    <IconPencil class="w-3 h-3" /> Rename
                  </button>
                  <button class="btn btn-ghost btn-xs text-warning" @click="revokeDevice(device)">
                    <IconLogOut class="w-3 h-3" /> Revoke Sessions
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" @click="deleteDevice(device)">
                    <IconTrash2 class="w-3 h-3" /> Remove
                  </button>
                </div>
                <div v-if="device.sessions?.length" class="pl-6 space-y-1.5 mt-1">
                  <div
                    v-for="session in device.sessions"
                    :key="session.id"
                    class="flex items-center gap-2 text-xs p-1.5 rounded bg-base-100/50"
                  >
                    <span class="inline-block w-1.5 h-1.5 rounded-full" :class="session.expiredAt ? 'bg-base-300' : 'bg-success'" />
                    <span class="text-base-content/60">{{ session.ipAddress || 'Unknown IP' }}</span>
                    <span class="text-base-content/40 truncate flex-1">{{ session.userAgent?.slice(0, 40) || 'Unknown' }}</span>
                    <span class="text-base-content/30">{{ session.type === 0 ? 'Login' : session.type === 1 ? 'OAuth' : 'OIDC' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No devices found</p>
          </AdminCard>

          <!-- Sessions -->
          <AdminCard title="Sessions">
            <template #actions>
              <button class="btn btn-ghost btn-xs" @click="loadSessions">
                <IconRefreshCw class="w-3.5 h-3.5" /> Refresh
              </button>
            </template>
            <div v-if="sessionsLoading" class="flex justify-center py-4">
              <span class="loading loading-spinner loading-sm" />
            </div>
            <div v-else-if="sessions.length" class="space-y-2">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="p-3 rounded-lg bg-base-200/50 space-y-2"
              >
                <div class="flex items-start gap-2">
                  <span class="inline-block w-2 h-2 rounded-full mt-1.5" :class="session.expiredAt ? 'bg-base-300' : 'bg-success'" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 text-sm">
                      <span class="font-mono text-xs">{{ session.id.slice(0, 12) }}...</span>
                      <span class="text-xs px-1.5 py-0.5 rounded bg-base-300/60 text-base-content/50">
                        {{ session.type === 0 ? 'Login' : session.type === 1 ? 'OAuth' : 'OIDC' }}
                      </span>
                      <span v-if="session.expiredAt" class="text-xs text-base-content/30">Expired</span>
                    </div>
                    <div class="text-xs text-base-content/50 mt-1 space-y-0.5">
                      <div class="flex items-center gap-1.5">
                        <IconGlobe class="w-3 h-3 text-base-content/30" />
                        <span>{{ session.ipAddress || 'Unknown IP' }}</span>
                        <span v-if="session.location" class="text-base-content/30">- {{ session.location }}</span>
                      </div>
                      <div v-if="session.userAgent" class="truncate">{{ session.userAgent }}</div>
                      <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-base-content/40">
                        <span v-if="session.createdAt">Created {{ formatDateTime(session.createdAt) }}</span>
                        <span v-if="session.lastGrantedAt">
                          Last granted {{ formatDateTime(session.lastGrantedAt) }} ({{ formatTimeAgo(session.lastGrantedAt) }})
                        </span>
                        <span v-if="session.expiredAt">Expired {{ formatDateTime(session.expiredAt) }}</span>
                      </div>
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-xs text-error shrink-0" @click="revokeOneSession(session)">
                    <IconX class="w-3 h-3" />
                  </button>
                </div>
                <div v-if="session.childrenCount" class="pl-4">
                  <button class="text-xs text-primary/70 hover:text-primary" @click="toggleSessionChildren(session)">
                    {{ session.children?.length ? 'Hide' : 'Show' }} {{ session.childrenCount }} child sessions
                  </button>
                </div>
                <div v-if="session.children?.length" class="pl-4 space-y-1.5 mt-1">
                  <div
                    v-for="child in session.children"
                    :key="child.id"
                    class="flex items-center gap-2 text-xs p-2 rounded bg-base-100/50"
                  >
                    <span class="inline-block w-1.5 h-1.5 rounded-full" :class="child.expiredAt ? 'bg-base-300' : 'bg-success'" />
                    <span class="font-mono">{{ child.id.slice(0, 10) }}...</span>
                    <span class="text-base-content/50">{{ child.ipAddress || 'Unknown' }}</span>
                    <span class="text-base-content/30">{{ child.type === 1 ? 'OAuth' : 'OIDC' }}</span>
                    <button class="btn btn-ghost btn-xs text-error ml-auto" @click="revokeOneSession(child)">
                      <IconX class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-base-content/40">No sessions found</p>
          </AdminCard>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <AdminCard title="Security Overview">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Activation</span>
                <span
                  class="text-sm font-semibold"
                  :class="detail.account.activatedAt ? 'text-success' : 'text-base-content/40'"
                >
                  {{ detail.account.activatedAt ? 'Active' : 'Pending' }}
                </span>
              </div>
              <div v-if="detail.account.activatedAt" class="flex items-center justify-between gap-2">
                <span class="text-sm text-base-content/60">Activated</span>
                <span class="text-xs text-base-content/50 text-right">{{ formatDateTime(detail.account.activatedAt) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Active Sessions</span>
                <span class="text-sm font-semibold">{{ detail.activeSessionCount ?? sessions.filter(s => !s.expiredAt).length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Active Devices</span>
                <span class="text-sm font-semibold">{{ detail.activeDeviceCount ?? devices.length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Auth Factors</span>
                <span class="text-sm font-semibold">{{ factors.length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Enabled Factors</span>
                <span class="text-sm font-semibold">{{ factors.filter(f => f.enabledAt).length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Contacts</span>
                <span class="text-sm font-semibold">{{ contacts.length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Verified Contacts</span>
                <span class="text-sm font-semibold">{{ contacts.filter(c => c.verifiedAt).length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Badges</span>
                <span class="text-sm font-semibold">{{ badges.length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Connections</span>
                <span class="text-sm font-semibold">{{ adminConnections.length || (detail.connectionCount ?? '—') }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Passkeys</span>
                <span class="text-sm font-semibold">{{ passkeys.length || (detail.passkeyCount ?? '—') }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-base-content/60">Active Punishment</span>
                <span
                  class="text-sm font-semibold"
                  :class="detail.activePunishment ? 'text-error' : 'text-base-content/40'"
                >
                  {{ detail.activePunishment ? 'Yes' : 'None' }}
                </span>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Quick Actions" compact>
            <div class="space-y-2">
              <button
                class="btn btn-success btn-sm w-full justify-start"
                :disabled="isActivating"
                @click="handleActivate"
              >
                <span v-if="isActivating" class="loading loading-spinner loading-xs" />
                <IconBadgeCheck v-else class="w-4 h-4" />
                {{ detail.account.activatedAt ? 'Re-activate / Restore Defaults' : 'Activate Account' }}
              </button>
              <button class="btn btn-outline btn-sm w-full justify-start" @click="handleRevokeSessions">
                <IconLogOut class="w-4 h-4" /> Revoke All Sessions
              </button>
              <button class="btn btn-outline btn-sm w-full justify-start" @click="handleInvalidateCredits">
                <IconRefreshCw class="w-4 h-4" /> Invalidate Social Credits Cache
              </button>
              <button class="btn btn-warning btn-sm w-full justify-start" @click="suspendOpen = true">
                <IconShieldAlert class="w-4 h-4" /> Suspend Account
              </button>
              <button class="btn btn-error btn-sm w-full justify-start" @click="deleteOpen = true">
                <IconTrash2 class="w-4 h-4" /> Delete Account
              </button>
            </div>
          </AdminCard>
        </div>
      </div>

      <!-- Contact Drawer -->
      <AdminDrawer :open="contactDrawerOpen" :title="contactEdit ? 'Edit Contact' : 'Add Contact'" @update:open="contactDrawerOpen = $event">
        <form class="space-y-3" @submit.prevent="doSaveContact">
          <div>
            <label class="text-xs text-base-content/50">Type</label>
            <select v-model="contactForm.type" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
              <option :value="0">Email</option>
              <option :value="1">Phone</option>
              <option :value="2">Address</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-base-content/50">Content</label>
            <input v-model="contactForm.content" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" required />
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="contactLoading">
            {{ contactLoading ? 'Saving...' : 'Save' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Factor Create Drawer -->
      <AdminDrawer :open="factorCreateOpen" title="Add Auth Factor" @update:open="factorCreateOpen = $event">
        <form class="space-y-3" @submit.prevent="doCreateFactor">
          <div>
            <label class="text-xs text-base-content/50">Factor Type</label>
            <select v-model="factorCreateForm.type" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
              <option :value="0">Password</option>
              <option :value="1">Email</option>
              <option :value="3">TOTP</option>
            </select>
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="factorLoading">
            {{ factorLoading ? 'Creating...' : 'Create' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Password Reset Drawer -->
      <AdminDrawer :open="passwordResetOpen" title="Reset Password" @update:open="passwordResetOpen = $event">
        <form class="space-y-3" @submit.prevent="doResetPassword">
          <div>
            <label class="text-xs text-base-content/50">New Password</label>
            <input v-model="passwordResetForm.newPassword" type="password" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" required />
          </div>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="passwordResetForm.revokeSessions" type="checkbox" class="checkbox checkbox-xs" />
            <span class="text-xs">Revoke all sessions</span>
          </label>
          <button class="btn btn-sm btn-warning w-full" :disabled="factorLoading">
            {{ factorLoading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Verification Drawer -->
      <AdminDrawer :open="verifyOpen" title="Set Verification" @update:open="verifyOpen = $event">
        <form class="space-y-3" @submit.prevent="doSetVerification">
          <div>
            <label class="text-xs text-base-content/50">Type</label>
            <select v-model="verifyForm.type" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
              <option :value="0">Staff</option>
              <option :value="1">Official</option>
              <option :value="2">Partner</option>
              <option :value="3">Creator</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-base-content/50">Title</label>
            <input v-model="verifyForm.title" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Description</label>
            <input v-model="verifyForm.description" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Verified By</label>
            <input v-model="verifyForm.verifiedBy" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="verifyLoading">
            {{ verifyLoading ? 'Saving...' : 'Set Verification' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Badge Grant Drawer -->
      <AdminDrawer :open="badgeGrantOpen" title="Grant Badge" @update:open="badgeGrantOpen = $event">
        <form class="space-y-3" @submit.prevent="doGrantBadge">
          <div>
            <label class="text-xs text-base-content/50">Type</label>
            <input v-model="badgeGrantForm.type" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" required placeholder="staff, creator, etc." />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Label</label>
            <input v-model="badgeGrantForm.label" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" required />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Caption</label>
            <input v-model="badgeGrantForm.caption" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="badgeLoading">
            {{ badgeLoading ? 'Granting...' : 'Grant Badge' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Suspend Drawer -->
      <AdminDrawer :open="suspendOpen" title="Suspend Account" @update:open="suspendOpen = $event">
        <form class="space-y-4" @submit.prevent="handleSuspend">
          <div>
            <label class="text-xs text-base-content/50">Punishment Type</label>
            <select v-model="suspendForm.type" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
              <option value="block_login">Block Login</option>
              <option value="disable_account">Disable Account</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-base-content/50">Reason</label>
            <textarea v-model="suspendForm.reason" class="textarea textarea-sm w-full bg-base-200/60 border-0 rounded-xl" rows="3" placeholder="Reason..." />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Expires At</label>
            <input v-model="suspendForm.expiredAt" type="datetime-local" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
            <p class="text-xs text-base-content/40 mt-1">Leave empty for permanent</p>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="suspendForm.revokeSessions" type="checkbox" class="checkbox checkbox-xs" />
            <span class="text-sm">Revoke all sessions immediately</span>
          </label>
          <button type="submit" class="btn btn-sm btn-warning w-full" :disabled="!suspendForm.reason || isSuspending">
            <span v-if="isSuspending" class="loading loading-spinner loading-xs" />
            <span v-else>Suspend Account</span>
          </button>
        </form>
      </AdminDrawer>

      <!-- Device Label Drawer -->
      <AdminDrawer :open="deviceLabelOpen" title="Rename Device" @update:open="deviceLabelOpen = $event">
        <form class="space-y-3" @submit.prevent="doUpdateDeviceLabel">
          <div>
            <label class="text-xs text-base-content/50">Device Label</label>
            <input v-model="deviceLabelForm.label" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" placeholder="e.g. Alice's MacBook Pro" />
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="deviceLabelLoading">
            {{ deviceLabelLoading ? 'Saving...' : 'Save Label' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Magic Spell Create Drawer -->
      <AdminDrawer :open="spellCreateOpen" title="Create Magic Spell" @update:open="spellCreateOpen = $event">
        <form class="space-y-3" @submit.prevent="doCreateSpell">
          <div>
            <label class="text-xs text-base-content/50">Type</label>
            <select v-model.number="spellCreateForm.type" class="select select-sm w-full bg-base-200/60 border-0 rounded-xl">
              <option :value="0">Account Activation</option>
              <option :value="2">Account Removal</option>
              <option :value="3">Password Reset</option>
              <option :value="4">Contact Verification</option>
            </select>
          </div>
          <div v-if="spellCreateForm.type === 4" class="space-y-2">
            <div>
              <label class="text-xs text-base-content/50">Contact ID</label>
              <input
                v-model="spellContactId"
                type="text"
                class="input input-sm w-full bg-base-200/60 border-0 rounded-xl font-mono"
                list="spell-contact-options"
                placeholder="Contact GUID"
              />
              <datalist id="spell-contact-options">
                <option v-for="c in contacts" :key="c.id" :value="c.id">
                  {{ contactTypeLabel(c.type) }}: {{ c.content }}
                </option>
              </datalist>
            </div>
            <div>
              <label class="text-xs text-base-content/50">Contact Method</label>
              <input
                v-model="spellContactMethod"
                type="text"
                class="input input-sm w-full bg-base-200/60 border-0 rounded-xl"
                placeholder="email / phone"
              />
            </div>
          </div>
          <div>
            <label class="text-xs text-base-content/50">Expires At</label>
            <input v-model="spellCreateForm.expiresAt" type="datetime-local" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="spellCreateForm.preventRepeat" type="checkbox" class="checkbox checkbox-xs" />
            <span class="text-xs">Prevent repeat (one outstanding per type)</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="spellCreateForm.sendEmail" type="checkbox" class="checkbox checkbox-xs" />
            <span class="text-xs">Send email immediately</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="spellCreateForm.bypassVerify" type="checkbox" class="checkbox checkbox-xs" />
            <span class="text-xs">Bypass email verification requirement</span>
          </label>
          <button class="btn btn-sm btn-primary w-full" :disabled="spellLoading">
            {{ spellLoading ? 'Creating...' : 'Create Spell' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Board Payload Drawer -->
      <AdminDrawer :open="boardPayloadOpen" title="Push Board Payload" @update:open="boardPayloadOpen = $event">
        <form class="space-y-3" @submit.prevent="doPushBoardPayload">
          <p class="text-xs text-base-content/50">
            Universal payload contract: each field is
            <code class="text-[10px]">{ "value": ..., "label": "...", "format": "optional" }</code>
          </p>
          <div>
            <label class="text-xs text-base-content/50">Payload JSON</label>
            <textarea
              v-model="boardPayloadText"
              class="textarea textarea-sm w-full bg-base-200/60 border-0 rounded-xl font-mono text-xs"
              rows="12"
              required
            />
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="boardPayloadLoading">
            {{ boardPayloadLoading ? 'Pushing...' : 'Push Payload' }}
          </button>
        </form>
      </AdminDrawer>

      <!-- Delete Dialog -->
      <!-- Profile Edit Drawer -->
      <AdminDrawer :open="profileEditOpen" title="Edit Profile" @update:open="profileEditOpen = $event">
        <form class="space-y-3" @submit.prevent="doUpdateProfile">
          <div>
            <label class="text-xs text-base-content/50">First Name</label>
            <input v-model="profileEditForm.first_name" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Middle Name</label>
            <input v-model="profileEditForm.middle_name" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Last Name</label>
            <input v-model="profileEditForm.last_name" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Bio</label>
            <textarea v-model="profileEditForm.bio" class="textarea textarea-sm w-full bg-base-200/60 border-0 rounded-xl" rows="3" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Gender</label>
            <input v-model="profileEditForm.gender" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Pronouns</label>
            <input v-model="profileEditForm.pronouns" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Time Zone</label>
            <input v-model="profileEditForm.time_zone" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <div>
            <label class="text-xs text-base-content/50">Location</label>
            <input v-model="profileEditForm.location" type="text" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" />
          </div>
          <button class="btn btn-sm btn-primary w-full" :disabled="profileEditLoading">
            {{ profileEditLoading ? 'Saving...' : 'Save Profile' }}
          </button>
        </form>
      </AdminDrawer>
      <AdminDrawer :open="deleteOpen" title="Delete Account" @update:open="deleteOpen = $event">
        <div class="space-y-4">
          <div class="rounded-xl bg-error/5 border border-error/20 p-4">
            <div class="flex items-start gap-3">
              <IconAlertTriangle class="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-semibold text-error">This action is irreversible</p>
                <p class="text-xs text-base-content/60 mt-1">Deleting <strong>@{{ detail.account.name }}</strong> will permanently remove all account data.</p>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost flex-1 btn-sm" @click="deleteOpen = false">Cancel</button>
            <button class="btn btn-error flex-1 btn-sm" :disabled="isDeleting" @click="handleDelete">
              <span v-if="isDeleting" class="loading loading-spinner loading-xs" />
              <span v-else>Delete Permanently</span>
            </button>
          </div>
        </div>
      </AdminDrawer>
    </template>

    <div v-else class="flex flex-col items-center py-16 text-center">
      <IconUserX class="w-12 h-12 text-base-content/20 mb-4" />
      <p class="text-base-content/50 mb-1">Account not found</p>
      <NuxtLink to="/admin/accounts" class="btn btn-sm btn-ghost mt-2">Back to accounts</NuxtLink>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconShieldAlert,
  IconKeyRound,
  IconBan,
  IconTrash2,
  IconLogOut,
  IconGamepad2,
  IconAlertTriangle,
  IconUserX,
  IconPlus,
  IconBadgeCheck,
  IconMonitor,
  IconRefreshCw,
  IconPencil,
  IconGlobe,
  IconX,
  IconLink,
  IconLayoutGrid,
  IconSparkles,
  IconUsers,
} from '#components'
import { getFileUrl } from '~/utils/files'
import {
  revokeAccountSessions,
  activateAdminAccount,
  invalidateSocialCredits,
  suspendAccount,
  deleteAdminAccount,
  deletePunishment,
  fetchAccountContacts,
  createAccountContact,
  updateAccountContact,
  deleteAccountContact,
  requestContactVerification,
  verifyContact,
  unverifyContact,
  setPrimaryContact,
  setContactVisibility,
  fetchAccountFactors,
  createAccountFactor,
  enableAccountFactor,
  disableAccountFactor,
  deleteAccountFactor,
  resetAccountPassword,
  setVerification,
  clearVerification,
  fetchAccountBadges,
  grantBadge,
  activateBadge,
  revokeBadge,
  fetchAccountDevices,
  adminUpdateDeviceLabel,
  revokeDeviceSessions,
  deleteAccountDevice,
  fetchAccountSessions,
  adminFetchSessionChildren,
  adminRevokeSession,
  fetchAccountPublicConnections,
  fetchAdminAccountBoard,
  pushBoardItemPayload,
  deleteBoardItem,
  fetchAccountSpells,
  createAccountSpell,
  resendAccountSpell,
  deleteAccountSpell,
  fetchAccountActionLogs,
  updateAccountProfile,
  fetchAccountNameHistory,
  fetchAccountAdminConnections,
  fetchAccountPasskeys,
  deleteAccountPasskey,
  fetchAccountRelationships,
} from '~/utils/admin'
import type {
  AdminAuthFactor,
  AdminBoardItem,
  AdminDevice,
  AdminMagicSpell,
  AdminPublicConnection,
  AdminSession,
  AdminActionLog,
  AdminAccountConnection,
  AdminAccountRelationship,
  AdminNameHistory,
  AdminPasskey,
  MagicSpellType,
  SnContact,
  PunishmentType,
} from '~/types/admin'
import type { SnAccountBadge } from '~/types/auth'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { currentAccount: detail, isLoadingDetail, loadAccountDetail, clearCurrentAccount } = useAdmin()

const identifier = computed(() => route.params.name as string)

const profileVerification = computed(() => {
  const profile = detail.value?.account?.profile
  return profile?.verification ?? profile?.verified ?? null
})

const profileFullName = computed(() => {
  const p = detail.value?.account?.profile
  if (!p) return ''
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')
})

// Contacts
const contacts = ref<SnContact[]>([])
const contactDrawerOpen = ref(false)
const contactEdit = ref<SnContact | null>(null)
const contactLoading = ref(false)
const contactForm = ref({ type: 0, content: '' })

async function loadContacts() {
  try { contacts.value = (await fetchAccountContacts(identifier.value)) ?? [] } catch { contacts.value = [] }
}

function editContact(c: SnContact) {
  contactEdit.value = c
  contactForm.value = { type: c.type, content: c.content }
  contactDrawerOpen.value = true
}

async function doSaveContact() {
  contactLoading.value = true
  try {
    if (contactEdit.value) {
      await updateAccountContact(identifier.value, contactEdit.value.id, contactForm.value)
    } else {
      await createAccountContact(identifier.value, contactForm.value)
    }
    contactDrawerOpen.value = false
    await loadContacts()
  } catch {
    useNuxtApp().$toast.error('Failed to save contact')
  } finally { contactLoading.value = false }
}

async function doRequestContactVerification(contactId: string) {
  try {
    await requestContactVerification(identifier.value, contactId)
    useNuxtApp().$toast.success('Verification email sent')
    await loadContacts()
  } catch {
    useNuxtApp().$toast.error('Failed to send verification')
  }
}

async function doVerifyContact(contactId: string) {
  try { await verifyContact(identifier.value, contactId); await loadContacts() } catch {
    useNuxtApp().$toast.error('Failed to verify contact')
  }
}

async function doUnverifyContact(contactId: string) {
  try { await unverifyContact(identifier.value, contactId); await loadContacts() } catch {
    useNuxtApp().$toast.error('Failed to unverify contact')
  }
}

async function doToggleContactVisibility(contact: SnContact) {
  try {
    await setContactVisibility(identifier.value, contact.id, { isPublic: !contact.isPublic })
    await loadContacts()
  } catch {
    useNuxtApp().$toast.error('Failed to update visibility')
  }
}

async function doSetPrimaryContact(contactId: string) {
  try { await setPrimaryContact(identifier.value, contactId); await loadContacts() } catch {
    useNuxtApp().$toast.error('Failed to set primary contact')
  }
}

async function doDeleteContact(contactId: string) {
  try { await deleteAccountContact(identifier.value, contactId); await loadContacts() } catch {
    useNuxtApp().$toast.error('Failed to delete contact')
  }
}

// Public connections
const connections = ref<AdminPublicConnection[]>([])
const connectionsLoading = ref(false)

async function loadConnections() {
  connectionsLoading.value = true
  try {
    connections.value = (await fetchAccountPublicConnections(identifier.value)) ?? []
  } catch {
    connections.value = []
  } finally {
    connectionsLoading.value = false
  }
}

// Action Logs
const actionLogs = ref<AdminActionLog[]>([])
const actionLogsLoading = ref(false)

async function loadActionLogs() {
  actionLogsLoading.value = true
  try {
    const { items } = await fetchAccountActionLogs(identifier.value)
    actionLogs.value = items
  } catch {
    actionLogs.value = []
  } finally {
    actionLogsLoading.value = false
  }
}

// Name History
const nameHistory = ref<AdminNameHistory[]>([])

async function loadNameHistory() {
  try {
    nameHistory.value = (await fetchAccountNameHistory(identifier.value)) ?? []
  } catch {
    nameHistory.value = []
  }
}

// Admin Connections
const adminConnections = ref<AdminAccountConnection[]>([])

async function loadAdminConnections() {
  try {
    adminConnections.value = (await fetchAccountAdminConnections(identifier.value)) ?? []
  } catch {
    adminConnections.value = []
  }
}

// Passkeys
const passkeys = ref<AdminPasskey[]>([])

async function loadPasskeys() {
  try {
    passkeys.value = (await fetchAccountPasskeys(identifier.value)) ?? []
  } catch {
    passkeys.value = []
  }
}

async function doDeletePasskey(passkeyId: string) {
  if (!(await useAlert().confirm('Confirm', 'Delete this passkey?'))) return
  try {
    await deleteAccountPasskey(identifier.value, passkeyId)
    await loadPasskeys()
    useNuxtApp().$toast.success('Passkey deleted')
  } catch {
    useNuxtApp().$toast.error('Failed to delete passkey')
  }
}

// Relationships
const relationships = ref<AdminAccountRelationship[]>([])

async function loadRelationships() {
  try {
    const { items } = await fetchAccountRelationships(identifier.value)
    relationships.value = items
  } catch {
    relationships.value = []
  }
}

// Profile Edit
const profileEditOpen = ref(false)
const profileEditLoading = ref(false)
const profileEditForm = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  bio: '',
  gender: '',
  pronouns: '',
  time_zone: '',
  location: '',
})

function openProfileEdit() {
  const p = detail.value?.account?.profile
  profileEditForm.value = {
    first_name: p?.firstName || '',
    middle_name: p?.middleName || '',
    last_name: p?.lastName || '',
    bio: p?.bio || '',
    gender: p?.gender || '',
    pronouns: p?.pronouns || '',
    time_zone: p?.timeZone || '',
    location: p?.location || '',
  }
  profileEditOpen.value = true
}

async function doUpdateProfile() {
  profileEditLoading.value = true
  try {
    await updateAccountProfile(identifier.value, profileEditForm.value)
    profileEditOpen.value = false
    await loadAccountDetail(identifier.value)
    useNuxtApp().$toast.success('Profile updated')
  } catch {
    useNuxtApp().$toast.error('Failed to update profile')
  } finally {
    profileEditLoading.value = false
  }
}
// Profile board
const boardItems = ref<AdminBoardItem[]>([])
const boardLoading = ref(false)
const boardPayloadOpen = ref(false)
const boardPayloadLoading = ref(false)
const boardPayloadEdit = ref<AdminBoardItem | null>(null)
const boardPayloadText = ref('')

function boardKindLabel(kind: AdminBoardItem['kind']): string {
  if (kind === 'custom_app' || kind === 1) return 'Custom App'
  return 'Prebuilt'
}

async function loadBoard() {
  boardLoading.value = true
  try {
    boardItems.value = (await fetchAdminAccountBoard(identifier.value)) ?? []
  } catch {
    boardItems.value = []
  } finally {
    boardLoading.value = false
  }
}

function openPushPayload(item: AdminBoardItem) {
  boardPayloadEdit.value = item
  boardPayloadText.value = JSON.stringify(item.payload || {}, null, 2)
  boardPayloadOpen.value = true
}

async function doPushBoardPayload() {
  if (!boardPayloadEdit.value) return
  boardPayloadLoading.value = true
  try {
    const parsed = JSON.parse(boardPayloadText.value) as Record<string, { value: unknown; label: string; format?: string }>
    await pushBoardItemPayload(identifier.value, boardPayloadEdit.value.id, { payload: parsed })
    boardPayloadOpen.value = false
    await loadBoard()
    useNuxtApp().$toast.success('Board payload updated')
  } catch {
    useNuxtApp().$toast.error('Failed to push board payload')
  } finally {
    boardPayloadLoading.value = false
  }
}

async function doDeleteBoardItem(itemId: string) {
  if (!(await useAlert().confirm('Confirm', 'Remove this board widget from the account?'))) return
  try {
    await deleteBoardItem(identifier.value, itemId)
    await loadBoard()
  } catch {
    useNuxtApp().$toast.error('Failed to remove board item')
  }
}

// Auth Factors
const factors = ref<AdminAuthFactor[]>([])
const factorCreateOpen = ref(false)
const passwordResetOpen = ref(false)
const factorLoading = ref(false)
const factorCreateForm = ref({ type: 0 })
const passwordResetForm = ref({ newPassword: '', revokeSessions: true })

async function loadFactors() {
  try { factors.value = (await fetchAccountFactors(identifier.value)) ?? [] } catch { factors.value = [] }
}

async function doCreateFactor() {
  factorLoading.value = true
  try { await createAccountFactor(identifier.value, factorCreateForm.value); factorCreateOpen.value = false; await loadFactors() } catch { } finally { factorLoading.value = false }
}

async function doEnableFactor(factorId: string) {
  try { await enableAccountFactor(identifier.value, factorId); await loadFactors() } catch { }
}

async function doDisableFactor(factorId: string) {
  try { await disableAccountFactor(identifier.value, factorId); await loadFactors() } catch { }
}

async function doDeleteFactor(factorId: string) {
  try { await deleteAccountFactor(identifier.value, factorId); await loadFactors() } catch { }
}

async function doResetPassword() {
  factorLoading.value = true
  try { await resetAccountPassword(identifier.value, passwordResetForm.value); passwordResetOpen.value = false } catch { } finally { factorLoading.value = false }
}

// Verification
const verifyOpen = ref(false)
const verifyLoading = ref(false)
const verifyForm = ref({ type: 0, title: '', description: '', verifiedBy: '' })

function openVerify() {
  const v = profileVerification.value
  verifyForm.value = {
    type: v?.type ?? 0,
    title: v?.title ?? '',
    description: v?.description ?? '',
    verifiedBy: v?.verifiedBy ?? '',
  }
  verifyOpen.value = true
}

async function doSetVerification() {
  verifyLoading.value = true
  try { await setVerification(identifier.value, verifyForm.value); verifyOpen.value = false; await loadAccountDetail(identifier.value) } catch { } finally { verifyLoading.value = false }
}

async function clearVerify() {
  try { await clearVerification(identifier.value); await loadAccountDetail(identifier.value) } catch { }
}

// Badges
const badges = ref<SnAccountBadge[]>([])
const badgeGrantOpen = ref(false)
const badgeLoading = ref(false)
const badgeGrantForm = ref({ type: '', label: '', caption: '' })

async function loadBadges() {
  try {
    badges.value = (await fetchAccountBadges(identifier.value)) as SnAccountBadge[]
  } catch {
    badges.value = (detail.value?.badges as SnAccountBadge[] | undefined) ?? []
  }
}

async function doGrantBadge() {
  badgeLoading.value = true
  try { await grantBadge(identifier.value, badgeGrantForm.value); badgeGrantOpen.value = false; await loadBadges() } catch { } finally { badgeLoading.value = false }
}

async function doActivateBadge(badgeId: string) {
  try { await activateBadge(identifier.value, badgeId); await loadBadges() } catch { }
}

async function doRevokeBadge(badgeId: string) {
  try { await revokeBadge(identifier.value, badgeId); await loadBadges() } catch { }
}

// Magic Spells
const spells = ref<AdminMagicSpell[]>([])
const spellsLoading = ref(false)
const spellCreateOpen = ref(false)
const spellLoading = ref(false)
const spellCreateForm = ref({
  type: 0 as MagicSpellType | number,
  expiresAt: '',
  preventRepeat: true,
  sendEmail: true,
  bypassVerify: true,
})
const spellContactId = ref('')
const spellContactMethod = ref('email')

async function loadSpells() {
  spellsLoading.value = true
  try {
    spells.value = (await fetchAccountSpells(identifier.value)) ?? []
  } catch {
    spells.value = []
  } finally {
    spellsLoading.value = false
  }
}

async function doCreateSpell() {
  spellLoading.value = true
  try {
    const meta: Record<string, unknown> = {}
    if (spellCreateForm.value.type === 4) {
      if (spellContactId.value) meta.contact_id = spellContactId.value
      if (spellContactMethod.value) meta.contact_method = spellContactMethod.value
    }
    await createAccountSpell(identifier.value, {
      type: spellCreateForm.value.type,
      preventRepeat: spellCreateForm.value.preventRepeat,
      sendEmail: spellCreateForm.value.sendEmail,
      bypassVerify: spellCreateForm.value.bypassVerify,
      expiresAt: spellCreateForm.value.expiresAt
        ? new Date(spellCreateForm.value.expiresAt).toISOString()
        : undefined,
      meta: Object.keys(meta).length ? meta : undefined,
    })
    spellCreateOpen.value = false
    spellContactId.value = ''
    await loadSpells()
    useNuxtApp().$toast.success('Magic spell created')
  } catch {
    useNuxtApp().$toast.error('Failed to create magic spell')
  } finally {
    spellLoading.value = false
  }
}

async function doResendSpell(spellId: string) {
  try {
    await resendAccountSpell(identifier.value, spellId, { bypassVerify: true })
    useNuxtApp().$toast.success('Spell email resent')
  } catch {
    useNuxtApp().$toast.error('Failed to resend spell email')
  }
}

async function doDeleteSpell(spellId: string) {
  if (!(await useAlert().confirm('Confirm', 'Cancel this magic spell? This cannot be undone.'))) return
  try {
    await deleteAccountSpell(identifier.value, spellId)
    await loadSpells()
  } catch {
    useNuxtApp().$toast.error('Failed to cancel spell')
  }
}

// Devices
const devices = ref<AdminDevice[]>([])
const devicesLoading = ref(false)
const deviceLabelOpen = ref(false)
const deviceLabelLoading = ref(false)
const deviceLabelEdit = ref<AdminDevice | null>(null)
const deviceLabelForm = ref({ label: '' })

/** Admin device routes use the stable device_id string, not the auth client GUID. */
function deviceRouteId(device: AdminDevice): string {
  return device.deviceId || device.id
}

async function loadDevices() {
  devicesLoading.value = true
  try {
    const { items } = await fetchAccountDevices(identifier.value, { includeSessions: true })
    devices.value = items
  } catch { devices.value = [] } finally { devicesLoading.value = false }
}

function editDeviceLabel(device: AdminDevice) {
  deviceLabelEdit.value = device
  deviceLabelForm.value = { label: device.label || device.deviceLabel || '' }
  deviceLabelOpen.value = true
}

async function doUpdateDeviceLabel() {
  if (!deviceLabelEdit.value) return
  deviceLabelLoading.value = true
  try {
    await adminUpdateDeviceLabel(identifier.value, deviceRouteId(deviceLabelEdit.value), deviceLabelForm.value)
    deviceLabelOpen.value = false
    await loadDevices()
  } catch { } finally { deviceLabelLoading.value = false }
}

async function revokeDevice(device: AdminDevice) {
  try { await revokeDeviceSessions(identifier.value, deviceRouteId(device)); await loadDevices() } catch { }
}

async function deleteDevice(device: AdminDevice) {
  try { await deleteAccountDevice(identifier.value, deviceRouteId(device)); await loadDevices() } catch { }
}

// Sessions
const sessions = ref<AdminSession[]>([])
const sessionsLoading = ref(false)

async function loadSessions() {
  sessionsLoading.value = true
  try {
    const { items } = await fetchAccountSessions(identifier.value, { activeOnly: false })
    sessions.value = items
  } catch { sessions.value = [] } finally { sessionsLoading.value = false }
}

async function toggleSessionChildren(session: AdminSession) {
  if (session.children?.length) {
    session.children = []
  } else {
    try {
      const children = await adminFetchSessionChildren(identifier.value, session.id)
      session.children = children
    } catch { }
  }
}

async function revokeOneSession(session: AdminSession) {
  try { await adminRevokeSession(identifier.value, session.id); await loadSessions(); await loadDevices() } catch { }
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Suspend
const suspendOpen = ref(false)
const isSuspending = ref(false)
const suspendForm = ref({ type: 'block_login' as PunishmentType, reason: '', expiredAt: '', revokeSessions: true })

// Delete
const deleteOpen = ref(false)
const isDeleting = ref(false)

// Activate
const isActivating = ref(false)

function contactTypeLabel(type: number): string {
  const labels: Record<number, string> = { 0: 'Email', 1: 'Phone', 2: 'Address' }
  return labels[type] || 'Unknown'
}

function factorTypeLabel(type: number): string {
  const labels: Record<number, string> = { 0: 'Password', 1: 'Email', 2: 'In-App', 3: 'TOTP', 4: 'PIN', 5: 'Recovery Code', 6: 'Physical Passport', 7: 'Passkey' }
  return labels[type] || 'Unknown'
}

function spellTypeLabel(type: number): string {
  const labels: Record<number, string> = {
    0: 'Account Activation',
    1: 'Account Deactivation',
    2: 'Account Removal',
    3: 'Password Reset',
    4: 'Contact Verification',
  }
  return labels[type] || `Unknown (${type})`
}

function punishmentTypeLabel(type: number): string {
  const labels: Record<number, string> = { 0: 'Block Login', 1: 'Disable Account', 2: 'Mute', 3: 'Restrict Features' }
  return labels[type] || 'Unknown'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

async function handleRevokeSessions() {
  try {
    await revokeAccountSessions(identifier.value)
    await Promise.all([loadAccountDetail(identifier.value), loadSessions(), loadDevices()])
    useNuxtApp().$toast.success('All sessions revoked')
  } catch {
    useNuxtApp().$toast.error('Failed to revoke sessions')
  }
}

async function handleActivate() {
  isActivating.value = true
  try {
    await activateAdminAccount(identifier.value)
    await loadAccountDetail(identifier.value)
    useNuxtApp().$toast.success('Account activated and default permissions restored')
  } catch {
    useNuxtApp().$toast.error('Failed to activate account')
  } finally {
    isActivating.value = false
  }
}

async function handleInvalidateCredits() {
  try {
    await invalidateSocialCredits(identifier.value)
    useNuxtApp().$toast.success('Social credits cache invalidated')
  } catch {
    useNuxtApp().$toast.error('Failed to invalidate social credits cache')
  }
}

async function handleSuspend() {
  isSuspending.value = true
  try {
    await suspendAccount(identifier.value, {
      reason: suspendForm.value.reason,
      type: suspendForm.value.type,
      expiredAt: suspendForm.value.expiredAt
        ? new Date(suspendForm.value.expiredAt).toISOString()
        : undefined,
      revokeSessions: suspendForm.value.revokeSessions,
    })
    suspendOpen.value = false
    await loadAccountDetail(identifier.value)
  } catch { } finally { isSuspending.value = false }
}

async function handleDelete() {
  isDeleting.value = true
  try { await deleteAdminAccount(identifier.value); navigateTo('/admin/accounts') } catch { isDeleting.value = false }
}

async function handleDeletePunishment(punishmentId: string) {
  try { await deletePunishment(identifier.value, punishmentId); await loadAccountDetail(identifier.value) } catch { }
}

onMounted(() => {
  loadAccountDetail(identifier.value)
  loadContacts()
  loadConnections()
  loadFactors()
  loadBadges()
  loadSpells()
  loadBoard()
  loadDevices()
  loadSessions()
  loadActionLogs()
  loadNameHistory()
  loadAdminConnections()
  loadPasskeys()
  loadRelationships()
})

onUnmounted(() => {
  clearCurrentAccount()
})
</script>
