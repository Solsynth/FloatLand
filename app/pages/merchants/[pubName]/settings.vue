<template>
  <NuxtLayout name="merchant">
    <div class="mx-auto max-w-4xl">
      <AdminPageHeader :title="t('merchant.settingsPage.title')" />

      <div class="space-y-5">
        <!-- Merchant Info -->
        <AdminCard :title="t('merchant.settingsPage.accountType')">
          <div v-if="isLoading" class="flex justify-center py-6">
            <span class="loading loading-spinner loading-md" />
          </div>

          <template v-else>
            <div class="flex items-center gap-4">
              <div class="avatar shrink-0">
                <div class="w-14 rounded-full">
                  <FileImage
                    v-if="avatarUrl"
                    :file="avatarUrl"
                    :alt="displayNick"
                  />
                  <div
                    v-else
                    class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold"
                  >
                    {{ initials }}
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-base font-bold truncate">{{ displayNick }}</div>
                <div class="text-sm text-base-content/50">@{{ pubName }}</div>
              </div>
              <div class="shrink-0 text-right space-y-1">
                <div class="badge badge-sm badge-primary">
                  {{ t('merchant.settingsPage.merchantAccount') }}
                </div>
                <div class="text-xs text-base-content/45">
                  {{
                    merchantProfile
                      ? t('merchant.settingsPage.active')
                      : t('merchant.settingsPage.notConfigured')
                  }}
                </div>
              </div>
            </div>

            <div
              v-if="!merchantProfile"
              class="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-base-content/70 leading-relaxed"
            >
              {{ t('merchant.settingsPage.merchantNotFound') }}
            </div>
          </template>
        </AdminCard>

        <!-- Payout Wallet -->
        <AdminCard
          :title="t('merchant.settingsPage.payoutWallet')"
          :description="t('merchant.settingsPage.payoutWalletHint')"
        >
          <div v-if="walletsLoading || isLoading" class="flex justify-center py-6">
            <span class="loading loading-spinner loading-md" />
          </div>

          <div
            v-else-if="allWallets.length === 0"
            class="rounded-xl p-5 bg-base-200/60 border border-base-300/40 text-center"
          >
            <p class="text-sm text-base-content/50">{{ t('merchant.settingsPage.noWallets') }}</p>
            <NuxtLink to="/wallets" class="btn btn-primary btn-sm mt-3">
              {{ t('merchant.settingsPage.createWallet') }}
            </NuxtLink>
          </div>

          <div v-else class="space-y-2" role="radiogroup" :aria-label="t('merchant.settingsPage.payoutWallet')">
            <button
              type="button"
              role="radio"
              :aria-checked="isWalletSelected(null)"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 border text-left cursor-pointer transition-colors duration-150"
              :class="walletOptionClass(null)"
              @click="selectWallet(null)"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                :class="isWalletSelected(null)
                  ? 'border-primary bg-primary'
                  : 'border-base-content/30 bg-transparent'"
              >
                <span
                  v-if="isWalletSelected(null)"
                  class="h-1.5 w-1.5 rounded-full bg-primary-content"
                />
              </span>
              <span class="text-sm">{{ t('merchant.settingsPage.noWallet') }}</span>
            </button>

            <button
              v-for="wallet in allWallets"
              :key="wallet.id"
              type="button"
              role="radio"
              :aria-checked="isWalletSelected(wallet.id)"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 border text-left cursor-pointer transition-colors duration-150"
              :class="walletOptionClass(wallet.id)"
              @click="selectWallet(wallet.id)"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                :class="isWalletSelected(wallet.id)
                  ? 'border-primary bg-primary'
                  : 'border-base-content/30 bg-transparent'"
              >
                <span
                  v-if="isWalletSelected(wallet.id)"
                  class="h-1.5 w-1.5 rounded-full bg-primary-content"
                />
              </span>
              <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <IconWallet class="w-4 h-4 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ wallet.name || 'Wallet' }}</div>
                <div class="text-xs text-base-content/50">
                  {{ formatWalletBalance(wallet) }}
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <span
                  v-if="normalizeId(wallet.id) === normalizeId(currentWalletId)"
                  class="badge badge-sm badge-success"
                >
                  {{ t('merchant.settingsPage.currentWallet') }}
                </span>
                <span
                  v-if="wallet.isPrimary"
                  class="badge badge-sm badge-primary"
                >
                  {{ t('common.default') }}
                </span>
              </div>
            </button>
          </div>

          <div class="flex justify-end mt-4 pt-3 border-t border-base-300/40">
            <button
              type="button"
              class="btn btn-primary btn-sm min-w-[5.5rem]"
              :class="{ 'btn-disabled': isSaving || !hasWalletChanges || walletsLoading }"
              :disabled="isSaving || !hasWalletChanges || walletsLoading"
              @click="handleSaveWallet"
            >
              <span v-if="isSaving" class="loading loading-spinner loading-xs" />
              {{ t('common.save') }}
            </button>
          </div>
        </AdminCard>

        <!-- Danger Zone -->
        <AdminCard class="!border-error/25 !bg-error/[0.03]">
          <template #header>
            <h3 class="font-semibold text-sm text-error">
              {{ t('merchant.settingsPage.dangerZone') }}
            </h3>
          </template>
          <p class="text-sm text-base-content/55 leading-relaxed">
            {{ t('merchant.settingsPage.dangerZoneHint') }}
          </p>
        </AdminCard>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconWallet } from '#components'
import type { PublisherManaged } from '~/types/creator'
import type { Merchant } from '~/types/merchant'
import type { Wallet } from '~/utils/api'
import { fetchPublisherById, fetchManagedPublishers } from '~/utils/creator'
import { fetchWallets } from '~/utils/api'
import {
  fetchMerchant,
  updateMerchantWallet,
  isMerchantProfileNotFound,
} from '~/utils/merchant'
import { useMerchant } from '~/composables/useMerchant'

definePageMeta({ middleware: 'merchant' })

const { t } = useI18n()
const { $toast } = useNuxtApp()
const route = useRoute()
const merchantRoute = useMerchant()
const pubName = computed(() => route.params.pubName as string)

const publisher = ref<PublisherManaged | null>(null)
const merchantProfile = ref<Merchant | null>(null)
const allWallets = ref<Wallet[]>([])
const isLoading = ref(true)
const walletsLoading = ref(false)
/** `null` = no payout wallet */
const selectedWalletId = ref<string | null>(null)
const currentWalletId = ref<string | null>(null)
const isSaving = ref(false)

const avatarUrl = computed(() => publisher.value?.picture ?? null)
const displayNick = computed(
  () => publisher.value?.nick || merchantRoute.currentPublisher.value?.nick || pubName.value,
)
const initials = computed(() => {
  const name = displayNick.value || '?'
  return name.slice(0, 2).toUpperCase()
})

const hasWalletChanges = computed(() => {
  return normalizeId(selectedWalletId.value) !== normalizeId(currentWalletId.value)
})

defineOgImage('UniOgImage', {
  title: computed(() => `${t('merchant.settingsPage.title')} - ${displayNick.value}`),
})

useSolarSeo({
  title: computed(() => `${t('merchant.settingsPage.title')} - ${displayNick.value}`),
})

function normalizeId(id: string | null | undefined): string | null {
  if (id == null || id === '') return null
  return String(id).toLowerCase()
}

function isWalletSelected(walletId: string | null): boolean {
  return normalizeId(selectedWalletId.value) === normalizeId(walletId)
}

function selectWallet(walletId: string | null) {
  selectedWalletId.value = walletId ? String(walletId) : null
}

function formatAmount(amount: number | undefined | null): string {
  if (amount == null) return '0'
  return new Intl.NumberFormat().format(amount)
}

function formatWalletBalance(wallet: Wallet): string {
  const pockets = wallet.pockets ?? []
  if (pockets.length === 0) return '—'
  return pockets
    .slice(0, 2)
    .map((p) => `${formatAmount(p.availableAmount ?? p.amount)} ${p.currency}`)
    .join(' · ')
}

function walletOptionClass(walletId: string | null): string {
  return isWalletSelected(walletId)
    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
    : 'border-base-300/40 bg-base-200/40 hover:bg-base-200 hover:border-base-300'
}

function applyWalletId(walletId: string | null | undefined) {
  const id = walletId ? String(walletId) : null
  currentWalletId.value = id
  selectedWalletId.value = id
}

async function ensurePublisherSelected() {
  if (
    merchantRoute.hasPublisherSelected.value
    && merchantRoute.currentPublisherName.value === pubName.value
  ) {
    return
  }
  const pubs = await fetchManagedPublishers()
  const pub = pubs.find((p) => p.name === pubName.value)
  if (pub) await merchantRoute.selectPublisher(pub)
}

async function loadPublisher() {
  try {
    publisher.value = await fetchPublisherById(pubName.value)
  } catch (e) {
    console.error(e)
    // Fall back to store selection if public fetch fails
    if (merchantRoute.currentPublisherName.value === pubName.value) {
      publisher.value = merchantRoute.currentPublisher.value
    }
  }
}

async function loadMerchant() {
  try {
    merchantProfile.value = await fetchMerchant(pubName.value)
    applyWalletId(merchantProfile.value.paymentWalletId)
  } catch (e) {
    merchantProfile.value = null
    // Expected when publisher has never configured a merchant profile
    if (isMerchantProfileNotFound(e)) {
      applyWalletId(publisher.value?.payoutWalletId)
      return
    }
    console.error(e)
    applyWalletId(publisher.value?.payoutWalletId)
  }
}

async function loadWallets() {
  walletsLoading.value = true
  try {
    allWallets.value = await fetchWallets()
  } catch {
    allWallets.value = []
  } finally {
    walletsLoading.value = false
  }
}

async function loadAll() {
  isLoading.value = true
  try {
    await ensurePublisherSelected()
    await loadPublisher()
    await Promise.all([loadMerchant(), loadWallets()])
  } catch (e) {
    console.error(e)
    $toast.error(t('merchant.settingsPage.loadingFailed'))
  } finally {
    isLoading.value = false
  }
}

async function handleSaveWallet() {
  if (!hasWalletChanges.value || isSaving.value) return
  isSaving.value = true
  try {
    const walletId = selectedWalletId.value
    const updated = await updateMerchantWallet(pubName.value, walletId)
    merchantProfile.value = updated
    // Prefer server value; fall back to what the user just selected
    const nextId = updated.paymentWalletId != null
      ? String(updated.paymentWalletId)
      : walletId
    applyWalletId(nextId)
    $toast.success(t('merchant.settingsPage.walletSaved'))
  } catch (e) {
    console.error(e)
    $toast.error(t('merchant.settingsPage.walletSaveFailed'))
  } finally {
    isSaving.value = false
  }
}

watch(pubName, () => {
  loadAll()
}, { immediate: true })
</script>
