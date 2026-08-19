<template>
  <NuxtLayout name="admin">
    <div v-if="isLoading" class="space-y-4" aria-busy="true" aria-label="Loading publisher">
      <div class="skeleton h-16 w-full rounded-box" />
      <div class="rounded-box bg-base-100 p-5 shadow-sm">
        <div class="flex items-start gap-4">
          <div class="skeleton h-14 w-14 rounded-full" />
          <div class="flex-1 space-y-3">
            <div class="skeleton h-5 w-48" />
            <div class="skeleton h-4 w-32" />
            <div class="skeleton h-3 w-full max-w-xl" />
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="item in 3" :key="item" class="rounded-box bg-base-100 p-5 shadow-sm">
          <div class="skeleton mb-4 h-5 w-28" />
          <div class="space-y-3">
            <div class="skeleton h-9 w-full rounded-xl" />
            <div class="skeleton h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>

    <AdminCard v-else-if="loadError" class="flex flex-col items-center px-5 py-14 text-center">
      <IconAlertTriangle class="mb-4 h-12 w-12 text-error/60" aria-hidden="true" />
      <p role="alert" class="text-sm text-base-content/60">Could not load publisher.</p>
      <button type="button" class="btn btn-outline btn-sm mt-4" @click="load">
        Retry
      </button>
    </AdminCard>

    <template v-else-if="detail">
      <AdminPageHeader
        :title="detail.publisher.nick || detail.publisher.name"
        :description="`@${detail.publisher.name}`"
      >
        <template #actions>
          <button type="button" class="btn btn-sm btn-error" :disabled="actLoading" @click="deletePublisher">
            <IconTrash2 class="w-4 h-4" />
            Delete
          </button>
        </template>
      </AdminPageHeader>

      <AdminCard class="mb-4">
        <div class="flex items-start gap-4">
          <div class="avatar shrink-0">
            <div class="w-14 rounded-full">
              <img
                v-if="detail.publisher.picture?.id"
                :src="getFileUrl(detail.publisher.picture.id) ?? ''"
                :alt="detail.publisher.nick || detail.publisher.name"
                loading="lazy"
                decoding="async"
              />
              <div
                v-else
                class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold"
              >
                {{ (detail.publisher.nick || detail.publisher.name).slice(0, 2).toUpperCase() }}
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Type</span>
              <p class="mt-1">{{ formatType(detail.publisher.type) }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Rating</span>
              <p class="mt-1 font-semibold tabular-nums">{{ detail.publisher.rating ?? '—' }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Posts</span>
              <p class="mt-1 tabular-nums">{{ detail.postCount }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Members</span>
              <p class="mt-1 tabular-nums">{{ detail.memberCount }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Subscribers</span>
              <p class="mt-1 tabular-nums">{{ detail.subscriberCount }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Collections</span>
              <p class="mt-1 tabular-nums">{{ detail.collectionCount }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Gatekept</span>
              <p class="mt-1">{{ detail.publisher.gatekeptFollows ? 'Yes' : 'No' }}</p>
            </div>
            <div>
              <span class="text-base-content/40 text-xs uppercase tracking-wider">Account</span>
              <p class="mt-1 font-mono text-xs truncate">{{ detail.publisher.accountId || '—' }}</p>
            </div>
          </div>
        </div>
        <p v-if="detail.publisher.bio" class="text-sm text-base-content/60 mt-4">{{ detail.publisher.bio }}</p>
      </AdminCard>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <AdminCard class="h-full">
          <h3 class="text-sm font-semibold mb-3">Profile</h3>
          <div class="space-y-3">
            <input v-model="editForm.nick" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl" placeholder="Display name" />
            <input v-model="editForm.name" class="input input-sm w-full bg-base-200/60 border-0 rounded-xl font-mono" placeholder="Handle" />
            <textarea v-model="editForm.bio" class="textarea textarea-sm w-full bg-base-200/60 border-0 rounded-xl" rows="3" placeholder="Bio" />
            <label class="flex items-center gap-2 text-sm">
              <input v-model="editForm.gatekeptFollows" type="checkbox" class="checkbox checkbox-sm" />
              Gatekept follows
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="editForm.moderateSubscription" type="checkbox" class="checkbox checkbox-sm" />
              Moderate subscriptions
            </label>
            <button class="btn btn-sm btn-primary" :disabled="actLoading" @click="saveProfile">Save profile</button>
          </div>
        </AdminCard>

        <AdminCard class="h-full">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <IconEyeOff class="w-4 h-4" />
            Shadowban
          </h3>
          <p class="text-xs text-base-content/60 mb-3">
            {{ isShadowbanned(detail.publisher.shadowbanReason)
              ? `Currently: ${formatShadowban(detail.publisher.shadowbanReason)}`
              : 'Not shadowbanned' }}
          </p>
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="reason in shadowbanReasons"
              :key="reason"
              class="btn btn-xs"
              :class="formatShadowban(detail.publisher.shadowbanReason) === reason ? 'btn-error' : 'btn-ghost'"
              @click="applyShadowban(reason)"
            >
              {{ reason }}
            </button>
          </div>
          <button
            v-if="isShadowbanned(detail.publisher.shadowbanReason)"
            class="btn btn-ghost btn-xs text-success"
            :disabled="actLoading"
            @click="clearShadowban"
          >
            Clear shadowban
          </button>
        </AdminCard>

        <AdminCard class="h-full sm:col-span-2">
          <h3 class="text-sm font-semibold mb-3">Verification</h3>
          <div v-if="detail.publisher.verification" class="mb-3 text-sm">
            <span class="badge badge-success badge-sm mr-2">{{ detail.publisher.verification.type }}</span>
            <span>{{ detail.publisher.verification.title || 'Verified' }}</span>
            <p v-if="detail.publisher.verification.description" class="text-xs text-base-content/50 mt-1">
              {{ detail.publisher.verification.description }}
            </p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select v-model="verifyForm.type" class="select select-sm bg-base-200/60 border-0 rounded-xl">
              <option value="creator">Creator</option>
              <option value="developer">Developer</option>
              <option value="individual">Individual</option>
              <option value="organization">Organization</option>
              <option value="official">Official</option>
              <option value="government">Government</option>
              <option value="parody">Parody</option>
            </select>
            <input v-model="verifyForm.title" class="input input-sm bg-base-200/60 border-0 rounded-xl" placeholder="Title" />
            <input v-model="verifyForm.verifiedBy" class="input input-sm bg-base-200/60 border-0 rounded-xl" placeholder="Verified by" />
            <input v-model="verifyForm.description" class="input input-sm bg-base-200/60 border-0 rounded-xl" placeholder="Description" />
          </div>
          <div class="flex flex-wrap gap-2 mt-3">
            <button class="btn btn-sm btn-primary" :disabled="actLoading" @click="setVerification">
              Set verification
            </button>
            <button
              v-if="detail.publisher.verification"
              class="btn btn-sm btn-ghost"
              :disabled="actLoading"
              @click="clearVerification"
            >
              Clear verification
            </button>
          </div>
        </AdminCard>
      </div>

      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/admin/posts?publisherId=${detail.publisher.id}`" class="btn btn-sm btn-ghost">
          View posts
        </NuxtLink>
        <NuxtLink :to="`/admin/collections?publisherId=${detail.publisher.id}`" class="btn btn-sm btn-ghost">
          View collections
        </NuxtLink>
        <NuxtLink :to="`/publishers/${detail.publisher.name}`" class="btn btn-sm btn-ghost" target="_blank">
          Public page
        </NuxtLink>
      </div>
    </template>

    <div v-else class="flex flex-col items-center py-16 text-center">
      <IconAlertTriangle class="w-12 h-12 text-base-content/20 mb-4" />
      <p class="text-base-content/50">Publisher not found</p>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconTrash2, IconEyeOff, IconAlertTriangle } from '#components'
import type {
  AdminPublisherDetail,
  PublisherShadowbanReason,
} from '~/types/admin'
import {
  fetchAdminPublisher,
  updateAdminPublisher,
  shadowbanAdminPublisher,
  unshadowbanAdminPublisher,
  setAdminPublisherVerification,
  clearAdminPublisherVerification,
  deleteAdminPublisher,
} from '~/utils/admin'
import { getFileUrl } from '~/utils/files'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { destructive } = useAlert()
const detail = ref<AdminPublisherDetail | null>(null)
const isLoading = ref(true)
const loadError = ref(false)
const actLoading = ref(false)

const editForm = ref({
  name: '',
  nick: '',
  bio: '',
  gatekeptFollows: false,
  moderateSubscription: false,
})

const verifyForm = ref({
  type: 'creator',
  title: '',
  description: '',
  verifiedBy: 'admin',
})

const shadowbanReasons: PublisherShadowbanReason[] = [
  'spam',
  'advertising',
  'harassment',
  'hate_speech',
  'misinformation',
  'illegal',
  'other',
]

const SHADOWBAN_LABELS: Record<number, string> = {
  0: 'none',
  1: 'spam',
  2: 'advertising',
  3: 'harassment',
  4: 'hate_speech',
  5: 'misinformation',
  6: 'illegal',
  99: 'other',
}

function formatType(type: unknown): string {
  if (type === 0 || type === 'individual') return 'individual'
  if (type === 1 || type === 'organizational') return 'organizational'
  return String(type ?? '—')
}

function formatShadowban(v: PublisherShadowbanReason | string | number | null | undefined): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'number') return SHADOWBAN_LABELS[v] ?? String(v)
  return String(v)
}

function isShadowbanned(v: PublisherShadowbanReason | string | number | null | undefined): boolean {
  return !(v === undefined || v === null || v === 'none' || v === 0)
}
async function load() {
  isLoading.value = true
  loadError.value = false
  try {
    detail.value = await fetchAdminPublisher(route.params.name as string)
    const p = detail.value.publisher
    editForm.value = {
      name: p.name,
      nick: p.nick || '',
      bio: p.bio || '',
      gatekeptFollows: !!p.gatekeptFollows,
      moderateSubscription: !!p.moderateSubscription,
    }
  } catch {
    detail.value = null
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}

async function saveProfile() {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await updateAdminPublisher(detail.value.publisher.name, {
      name: editForm.value.name || undefined,
      nick: editForm.value.nick || undefined,
      bio: editForm.value.bio || undefined,
      gatekeptFollows: editForm.value.gatekeptFollows,
      moderateSubscription: editForm.value.moderateSubscription,
    })
    detail.value.publisher = { ...detail.value.publisher, ...updated }
    if (updated.name && updated.name !== route.params.name) {
      await navigateTo(`/admin/publishers/${updated.name}`, { replace: true })
    }
    useNuxtApp().$toast.success('Publisher updated')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Update failed')
  } finally {
    actLoading.value = false
  }
}

async function applyShadowban(reason: PublisherShadowbanReason) {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await shadowbanAdminPublisher(detail.value.publisher.name, { reason })
    detail.value.publisher = { ...detail.value.publisher, ...updated }
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Shadowban failed')
  } finally {
    actLoading.value = false
  }
}

async function clearShadowban() {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await unshadowbanAdminPublisher(detail.value.publisher.name)
    detail.value.publisher = { ...detail.value.publisher, ...updated }
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed')
  } finally {
    actLoading.value = false
  }
}

async function setVerification() {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await setAdminPublisherVerification(detail.value.publisher.name, {
      type: verifyForm.value.type,
      title: verifyForm.value.title || undefined,
      description: verifyForm.value.description || undefined,
      verifiedBy: verifyForm.value.verifiedBy || undefined,
    })
    detail.value.publisher = { ...detail.value.publisher, ...updated }
    useNuxtApp().$toast.success('Verification set')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed')
  } finally {
    actLoading.value = false
  }
}

async function clearVerification() {
  if (!detail.value || actLoading.value) return
  actLoading.value = true
  try {
    const updated = await clearAdminPublisherVerification(detail.value.publisher.name)
    detail.value.publisher = { ...detail.value.publisher, ...updated }
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Failed')
  } finally {
    actLoading.value = false
  }
}

async function deletePublisher() {
  if (!detail.value) return
  const ok = await destructive(
    'Delete publisher',
    `Permanently delete @${detail.value.publisher.name}? This is destructive.`,
  )
  if (!ok) return
  actLoading.value = true
  try {
    await deleteAdminPublisher(detail.value.publisher.name)
    useNuxtApp().$toast.success('Publisher deleted')
    await navigateTo('/admin/publishers')
  } catch (e: any) {
    useNuxtApp().$toast.error(e?.data?.message || e?.message || 'Delete failed')
  } finally {
    actLoading.value = false
  }
}

onMounted(() => load())
</script>
