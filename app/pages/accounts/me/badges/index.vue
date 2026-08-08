<template>
    <NuxtLayout name="app">
        <ConfuseSpinner v-if="isLoading" message="Loading badges..." />

        <div v-else-if="error" class="mx-auto max-w-md p-6">
            <div class="card">
                <div class="card-body items-center text-center gap-4">
                    <IconAlertCircle class="text-error w-12 h-12" />
                    <h1 class="text-xl font-bold">Failed to Load</h1>
                    <p class="text-base-content/60">{{ error }}</p>
                    <button class="btn btn-primary" @click="loadBadges">
                        <IconRefreshCw class="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        </div>

        <div v-else class="mx-auto max-w-6xl">
            <!-- Header -->
            <div class="flex items-center gap-3 px-4 py-4">
                <button
                    class="btn btn-ghost btn-square btn-sm"
                    @click="router.back()"
                >
                    <IconArrowLeft class="w-5 h-5" />
                </button>
                <h1 class="text-xl font-bold">Badges</h1>
            </div>

            <!-- Info Banner -->
            <div class="px-4 mb-4">
                <div class="alert alert-info bg-primary/5 border-primary/20">
                    <IconInfo class="w-5 h-5 text-primary shrink-0" />
                    <span class="text-sm">
                        Badges are achievements you can earn by participating in the community. Activate a badge to display it on your profile.
                    </span>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid gap-4 px-4 py-4 lg:px-6 lg:grid-cols-3">
                <!-- Left Column - Main Content -->
                <div class="lg:col-span-2 space-y-4">
                    <!-- Active Badge Section -->
                    <div v-if="activeBadge" class="card bg-primary/5 shadow-sm">
                        <div class="card-body p-4">
                            <div class="flex items-center gap-2 mb-3">
                                <IconCheckCircle class="w-4 h-4 text-primary" />
                                <span class="text-sm font-medium text-primary">Currently Active</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <BadgeIcon
                                    :badge="activeBadge"
                                    :manifest="badgeManifest"
                                    size="lg"
                                />
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-bold text-lg">{{ getBadgeNameForDisplay(activeBadge) }}</h3>
                                    <p class="text-sm text-base-content/60 line-clamp-2">
                                        {{ getBadgeDescriptionForDisplay(activeBadge) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Badges List -->
                    <div class="card bg-base-100">
                        <div class="card-body p-0">
                            <!-- Tabs -->
                            <div role="tablist" class="tabs tabs-box bg-base-200/50 p-2 m-2">
                                <a
                                    role="tab"
                                    class="tab flex-1"
                                    :class="{ 'tab-active': activeTab === 'all' }"
                                    @click="activeTab = 'all'"
                                >
                                    All
                                </a>
                                <a
                                    role="tab"
                                    class="tab flex-1"
                                    :class="{ 'tab-active': activeTab === 'active' }"
                                    @click="activeTab = 'active'"
                                >
                                    Active
                                </a>
                                <a
                                    role="tab"
                                    class="tab flex-1"
                                    :class="{ 'tab-active': activeTab === 'inactive' }"
                                    @click="activeTab = 'inactive'"
                                >
                                    Inactive
                                </a>
                            </div>

                            <!-- Badge Grid -->
                            <div class="p-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div
                                    v-for="badge in filteredBadges"
                                    :key="badge.id"
                                    class="card bg-base-200/50 hover:bg-base-200 transition-colors cursor-pointer"
                                    :class="{ 'ring-2 ring-primary': badge.activatedAt }"
                                    @click="selectedBadge = badge"
                                >
                                    <div class="card-body p-4">
                                        <div class="flex items-start gap-3">
                                            <BadgeIcon
                                                :badge="badge"
                                                :manifest="badgeManifest"
                                                size="md"
                                            />
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2">
                                                    <h4 class="font-semibold truncate">{{ getBadgeNameForDisplay(badge) }}</h4>
                                                    <span
                                                        v-if="badge.activatedAt"
                                                        class="badge badge-primary badge-xs shrink-0"
                                                    >
                                                        Active
                                                    </span>
                                                </div>
                                                <p class="text-xs text-base-content/60 line-clamp-2 mt-1">
                                                    {{ getBadgeDescriptionForDisplay(badge) }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Empty -->
                                <div
                                    v-if="filteredBadges.length === 0"
                                    class="col-span-full p-8 text-center text-base-content/50"
                                >
                                    <IconStars class="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No {{ activeTab === 'all' ? 'badges' : activeTab + ' badges' }} found</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Sidebar -->
                <div class="space-y-4 hidden lg:block">
                    <!-- Stats Card -->
                    <div class="card bg-base-100">
                        <div class="card-body p-4">
                            <h3 class="text-sm font-semibold text-base-content/70 mb-3">Statistics</h3>
                            <div class="space-y-3">
                                <div class="flex items-center gap-3 p-2 rounded-xl bg-primary/5">
                                    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <IconStars class="w-4 h-4 text-primary" />
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-xs text-base-content/60">Total Badges</p>
                                        <p class="font-semibold">{{ badges.length }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 p-2 rounded-xl bg-success/5">
                                    <div class="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                        <IconCheckCircle class="w-4 h-4 text-success" />
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-xs text-base-content/60">Active</p>
                                        <p class="font-semibold">{{ activeBadgesCount }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Badge Detail Modal -->
        <dialog :open="!!selectedBadge" class="modal">
            <div class="modal-box max-w-sm">
                <div class="flex items-center justify-between pb-4">
                    <h3 class="font-bold text-lg">Badge Details</h3>
                    <form method="dialog">
                        <button class="btn btn-ghost btn-sm btn-square" @click="selectedBadge = null">
                            <IconX class="w-4 h-4" />
                        </button>
                    </form>
                </div>
                <div v-if="selectedBadge" class="text-center space-y-4">
                    <div class="flex justify-center">
                        <BadgeIcon
                            :badge="selectedBadge"
                            :manifest="badgeManifest"
                            size="lg"
                        />
                    </div>
                    <div>
                        <h4 class="font-bold text-xl">{{ getBadgeNameForDisplay(selectedBadge) }}</h4>
                        <p class="text-sm text-base-content/60 mt-2">
                            {{ getBadgeDescriptionForDisplay(selectedBadge) }}
                        </p>
                    </div>
                    <div v-if="selectedBadge.caption" class="p-3 bg-base-200 rounded-xl">
                        <p class="text-sm italic">"{{ selectedBadge.caption }}"</p>
                    </div>
                    <div class="text-xs text-base-content/50">
                        <p>Earned {{ formatDate(selectedBadge.createdAt) }}</p>
                    </div>
                </div>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-ghost" @click="selectedBadge = null">Close</button>
                    </form>
                    <button
                        v-if="selectedBadge && !selectedBadge.activatedAt"
                        class="btn btn-primary"
                        :disabled="isActivating"
                        @click="activateSelectedBadge"
                    >
                        <IconLoader v-if="isActivating" class="w-4 h-4 animate-spin" />
                        <IconCheckCircle v-else class="w-4 h-4" />
                        Activate
                    </button>
                    <button
                        v-else-if="selectedBadge"
                        class="btn btn-success"
                        disabled
                    >
                        <IconCheckCircle class="w-4 h-4" />
                        Active
                    </button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="selectedBadge = null">close</button>
            </form>
        </dialog>
    </NuxtLayout>
</template>

<script setup lang="ts">
import {
    IconArrowLeft,
    IconInfo,
    IconCheckCircle,
    IconStars,
    IconHeart,
    IconCode,
    IconGlobe,
    IconSparkles,
    IconAward,
    IconX,
    IconLoader,
    IconRefreshCw,
    IconAlertCircle,
} from "#components";
import type { SnAccountBadge } from "~/types/auth";
import type { BadgeManifestEntry } from "~/utils/badges";
import { fetchMyBadges, activateBadge } from "~/utils/api";
import { getBadgeColor, getBadgeName, getBadgeDescription } from "~/utils/badges";

const router = useRouter();
const { notify } = useAlert();
const badgeManifestStore = useBadgeManifestStore();

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const badges = ref<SnAccountBadge[]>([]);
const activeTab = ref<"all" | "active" | "inactive">("all");
const selectedBadge = ref<SnAccountBadge | null>(null);
const isActivating = ref(false);

const badgeManifest = computed(() => badgeManifestStore.manifest);

// Computed
const activeBadge = computed(() => badges.value.find((b) => b.activatedAt) || null);

const activeBadgesCount = computed(() => badges.value.filter((b) => b.activatedAt).length);

const filteredBadges = computed(() => {
    if (activeTab.value === "active") {
        return badges.value.filter((b) => b.activatedAt);
    }
    if (activeTab.value === "inactive") {
        return badges.value.filter((b) => !b.activatedAt);
    }
    return badges.value;
});

// Helpers
function getBadgeNameForDisplay(badge: SnAccountBadge): string {
    return getBadgeName(badge, badgeManifest.value);
}

function getBadgeDescriptionForDisplay(badge: SnAccountBadge): string {
    return getBadgeDescription(badge, badgeManifest.value) || "Special badge";
}

function getBadgeColorForDisplay(badge: SnAccountBadge): string {
    return getBadgeColor(badge, badgeManifest.value);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// API Actions
async function loadBadges() {
    isLoading.value = true;
    error.value = null;
    try {
        badges.value = await fetchMyBadges();
    } catch (err) {
        console.error("Failed to load badges:", err);
        error.value = err instanceof Error ? err.message : "Failed to load badges";
    } finally {
        isLoading.value = false;
    }
}

async function activateSelectedBadge() {
    if (!selectedBadge.value) return;
    isActivating.value = true;
    try {
        await activateBadge(selectedBadge.value.id);
        await loadBadges();
        selectedBadge.value = null;
    } catch (err) {
        console.error("Failed to activate badge:", err);
        await notify("Failed to activate badge");
    } finally {
        isActivating.value = false;
    }
}

onMounted(() => {
    badgeManifestStore.fetchManifest();
    loadBadges();
});

defineOgImage('UniOgImage', { title: 'Badges' })

useSolarSeo({
    title: "Badges",
});
</script>
