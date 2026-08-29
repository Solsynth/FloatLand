<template>
    <NuxtLayout name="app">
        <!-- Loading -->
        <ConfuseSpinner v-if="status === 'pending'" :message="t('realms.loadingBoost')" />

        <!-- Not Found -->
        <div v-else-if="notFound" class="mx-auto max-w-2xl p-6">
            <div class="card">
                <div class="card-body items-center text-center">
                    <IconRocket class="text-base-content/50 w-10 h-10" />
                    <h1 class="text-xl font-bold">{{ t("realms.notFound") }}</h1>
                </div>
            </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="mx-auto max-w-2xl p-6">
            <div class="alert alert-error">
                <span>{{ error }}</span>
            </div>
        </div>

        <!-- Boost Page -->
        <div v-else-if="realm && boostStatus" class="mx-auto max-w-4xl space-y-6">
            <!-- Header -->
            <div class="flex items-center gap-4 px-4 lg:px-0">
                <NuxtLink :to="`/realms/${realm.slug}`" class="btn btn-ghost btn-square">
                    <IconArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div class="min-w-0 flex-1">
                    <h1 class="text-xl font-bold truncate">{{ t("realms.boostTitle", { name: realm.name }) }}</h1>
                    <p class="text-sm text-base-content/60">
                        {{ t("realms.boostSubtitle") }}
                    </p>
                </div>
            </div>

            <!-- Boost Status Card -->
            <div class="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-sm">
                <div class="card-body p-6">
                    <div class="grid gap-6 md:grid-cols-3">
                        <div class="text-center md:text-left">
                            <div class="text-sm text-base-content/60 mb-1">{{ t("realms.currentLevel") }}</div>
                            <div class="text-4xl font-black">{{ boostStatus.boostLevel }}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-base-content/60 mb-1">{{ t("realms.boostPoints") }}</div>
                            <div class="text-4xl font-black">{{ boostStatus.boostPoints.toLocaleString() }}</div>
                        </div>
                        <div class="text-center md:text-right">
                            <div class="text-sm text-base-content/60 mb-1">{{ t("realms.labelCap") }}</div>
                            <div class="text-4xl font-black">{{ boostStatus.labelCap }}</div>
                        </div>
                    </div>

                    <div class="divider"/>

                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>{{ t("realms.progressToLevel", { level: boostStatus.boostLevel + 1 }) }}</span>
                            <span>{{ progressPercent }}%</span>
                        </div>
                        <progress class="progress progress-primary w-full h-3" :value="progressPercent" max="100" />
                    </div>
                </div>
            </div>

            <!-- Boost Form -->
            <div v-if="isMember" class="card">
                <div class="card-body p-6">
                    <h2 class="text-lg font-bold mb-4">{{ t("realms.boostThisRealm") }}</h2>

                    <div class="grid gap-4 md:grid-cols-2 mb-4">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">{{ t("realms.pointsToBoost") }}</span>
                            </label>
                            <input
                                v-model.number="boostAmount"
                                type="number"
                                min="1"
                                class="input input-bordered w-full"
                                :placeholder="t('realms.enterAmount')"
                            >
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">{{ t("realms.currency") }}</span>
                            </label>
                            <select v-model="selectedCurrency" class="select select-bordered w-full">
                                <option v-for="currency in boostStatus.supportedCurrencies" :key="currency" :value="currency">
                                    {{ currency.toUpperCase() }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="alert alert-info mb-4">
                        <IconInfoCircle class="w-5 h-5" />
                        <div>
                            <p class="font-semibold">{{ t("realms.boostExpiresAfter", { days: boostStatus.expiresAfterDays }) }}</p>
                            <p class="text-sm">{{ t("realms.boostHelp") }}</p>
                        </div>
                    </div>

                    <div v-if="boostError" class="alert alert-error mb-4">
                        <IconAlertCircle class="w-5 h-5" />
                        <span>{{ boostError }}</span>
                    </div>

                    <button
                        class="btn btn-primary w-full"
                        :disabled="isBoosting || boostAmount < 1"
                        @click="handleBoost"
                    >
                        <IconLoader v-if="isBoosting" class="w-5 h-5 animate-spin" />
                        <IconZap v-else class="w-5 h-5" />
                        {{ t("realms.boostPointsBtn", { amount: boostAmount > 0 ? boostAmount : '' }) }}
                    </button>
                </div>
            </div>

            <!-- Leaderboard -->
            <div class="card">
                <div class="card-body p-6">
                    <h2 class="text-lg font-bold mb-4">{{ t("realms.topBoosters") }}</h2>

                    <div v-if="leaderboard.length > 0" class="space-y-2">
                        <div
                            v-for="(entry, index) in leaderboard"
                            :key="entry.accountId"
                            class="flex items-center gap-4 p-3 rounded-xl hover:bg-base-200/50 transition-colors"
                        >
                            <!-- Rank -->
                            <div class="w-8 text-center">
                                <span v-if="index < 3" class="text-2xl">
                                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                                </span>
                                <span v-else class="text-lg font-bold text-base-content/40">
                                    {{ index + 1 }}
                                </span>
                            </div>

                            <!-- Avatar -->
                            <div v-if="entry.account?.avatar?.id" class="avatar">
                                <div class="w-12 h-12 rounded-xl">
                                    <FileImage
                                        :file="entry.account.avatar"
                                        :alt="entry.account.nick || entry.account.name"
                                    />
                                </div>
                            </div>
                            <div v-else class="avatar avatar-placeholder">
                                <div class="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                                    {{ getInitials(entry.account?.nick || entry.account?.name || '?') }}
                                </div>
                            </div>

                            <!-- Name -->
                            <div class="min-w-0 flex-1">
                                <NuxtLink
                                    v-if="entry.account?.name"
                                    :to="`/@${entry.account.name}`"
                                    class="font-semibold hover:underline truncate block"
                                >
                                    {{ entry.account.nick || entry.account.name }}
                                </NuxtLink>
                                <span v-else class="font-semibold">Unknown</span>
                                <p class="text-sm text-base-content/60 truncate">
                                    @{{ entry.account?.name }}
                                </p>
                            </div>

                            <!-- Points -->
                            <div class="text-right">
                                <div class="font-bold text-primary text-lg">
                                    {{ entry.totalPoints.toLocaleString() }}
                                </div>
                                <div class="text-xs text-base-content/60">{{ t("realms.points") }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Load More -->
                    <div v-if="leaderboard.length > 0 && hasMore" class="text-center mt-4">
                        <button
                            class="btn btn-outline btn-sm"
                            :disabled="isLoadingMore"
                            @click="loadMoreLeaderboard"
                        >
                            <IconLoader v-if="isLoadingMore" class="w-4 h-4 animate-spin" />
                            <span>{{ t("common.loadMore") }}</span>
                        </button>
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="leaderboard.length === 0" class="text-center py-8 text-base-content/60">
                        <IconTrophy class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{{ t("realms.noBoosters") }}</p>
                    </div>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import type { Realm, RealmBoostStatus, RealmBoostLeaderboardEntry, RealmMember } from '~/types/realm'
import { fetchRealm, fetchRealmBoostStatus, fetchRealmBoostLeaderboard, getMyRealmMembership, boostRealm } from '~/utils/api'

const { t } = useI18n();

const route = useRoute()
const realmSlug = computed(() => route.params.slug as string)

// State
const realm = ref<Realm | null>(null)
const boostStatus = ref<RealmBoostStatus | null>(null)
const leaderboard = ref<RealmBoostLeaderboardEntry[]>([])
const myMembership = ref<RealmMember | null>(null)
const notFound = ref(false)
const error = ref<string | null>(null)
const isMember = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const leaderboardOffset = ref(0)

// Boost form
const boostAmount = ref(100)
const selectedCurrency = ref('')
const isBoosting = ref(false)
const boostError = ref<string | null>(null)

const seoTitle = ref<string>("")
const seoDescription = ref<string>("")

defineOgImage('UniOgImage', { title: computed(() => seoTitle.value || 'Solar Network'), description: computed(() => seoDescription.value || '') })

useHead({
  title: computed(() => seoTitle.value || "Solar Network"),
  meta: [
    { name: "description", content: computed(() => seoDescription.value || "Explore posts, realms, and publishers on Solar Network.") },
    { property: "og:title", content: computed(() => seoTitle.value ? `${seoTitle.value} • Solar Network` : "Solar Network") },
    { property: "og:description", content: computed(() => seoDescription.value || "Explore posts, realms, and publishers on Solar Network.") },
  ],
})

// Computed
const status = computed(() =>
    realm.value && boostStatus.value ? 'success' : error.value ? 'error' : 'pending',
)

const progressPercent = computed(() => {
    if (!boostStatus.value) return 0
    const level = boostStatus.value.boostLevel
    const points = boostStatus.value.boostPoints
    const pointsForNextLevel = Math.pow(level + 1, 2) * 100
    const pointsForCurrentLevel = Math.pow(level, 2) * 100
    const progress = ((points - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100
    return Math.min(Math.max(Math.round(progress), 0), 100)
})

// Methods
function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('') || '?'
}

async function loadMoreLeaderboard() {
    if (isLoadingMore.value || !hasMore.value) return
    isLoadingMore.value = true

    try {
        const more = await fetchRealmBoostLeaderboard(realmSlug.value, 50, leaderboardOffset.value + 20)
        if (more.length > 0) {
            leaderboard.value = [...leaderboard.value, ...more]
            leaderboardOffset.value += more.length
            hasMore.value = more.length === 50
        } else {
            hasMore.value = false
        }
    } catch (err) {
        console.error('Failed to load more leaderboard:', err)
    } finally {
        isLoadingMore.value = false
    }
}

async function handleBoost() {
    if (isBoosting.value || boostAmount.value < 1) return

    isBoosting.value = true
    boostError.value = null

    try {
        await boostRealm(realmSlug.value, boostAmount.value, selectedCurrency.value)
        // Refresh boost status
        const [status, board] = await Promise.all([
            fetchRealmBoostStatus(realmSlug.value),
            fetchRealmBoostLeaderboard(realmSlug.value, 20),
        ])
        boostStatus.value = status
        leaderboard.value = board
        boostAmount.value = 100 // Reset
    } catch (err) {
        boostError.value = err instanceof Error ? err.message : 'Failed to boost'
    } finally {
        isBoosting.value = false
    }
}

// Initial load
onMounted(async () => {
    try {
        const [realmData, status, board, membership] = await Promise.all([
            fetchRealm(realmSlug.value),
            fetchRealmBoostStatus(realmSlug.value),
            fetchRealmBoostLeaderboard(realmSlug.value, 20),
            getMyRealmMembership(realmSlug.value).catch(() => null),
        ])

        realm.value = realmData
        boostStatus.value = status
        leaderboard.value = board
        myMembership.value = membership
        isMember.value = !!membership

        if (status.supportedCurrencies.length > 0) {
            selectedCurrency.value = status.defaultCurrency || status.supportedCurrencies[0]
        }

        // SEO
        seoTitle.value = `Boost - ${realmData.name}`
        seoDescription.value = `Support ${realmData.name} with boost points`
    } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
            notFound.value = true
        } else {
            error.value = err instanceof Error ? err.message : 'Failed to load boost status'
        }
    }
})
</script>
