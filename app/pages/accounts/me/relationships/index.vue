<template>
    <NuxtLayout name="app">
        <ConfuseSpinner
            v-if="isLoading"
            message="Loading relationships..."
        />

        <div v-else class="mx-auto max-w-6xl">
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-4">
                <div class="flex items-center gap-3">
                    <button
                        class="btn btn-ghost btn-square btn-sm"
                        @click="router.back()"
                    >
                        <IconArrowLeft class="w-5 h-5" />
                    </button>
                    <h1 class="text-xl font-bold">Relationships</h1>
                </div>
                <button
                    class="btn btn-primary btn-sm gap-2"
                    @click="showAddFriend = true"
                >
                    <IconUserPlus class="w-4 h-4" />
                    Add Friend
                </button>
            </div>

            <!-- Content Grid -->
            <div class="grid gap-4 px-4 py-4 lg:px-6 lg:grid-cols-3">
                <!-- Left Column - Main Content -->
                <div class="lg:col-span-2 space-y-4">
                    <!-- Friend Requests Summary (if any) -->
                    <div
                        v-if="pendingRequests.length > 0"
                        class="card bg-primary/5 shadow-sm"
                    >
                        <div class="card-body p-4">
                            <div
                                class="flex items-center justify-between"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="bg-primary/10 p-2 rounded-lg"
                                    >
                                        <IconSend
                                            class="w-5 h-5 text-primary"
                                        />
                                    </div>
                                    <div>
                                        <h3 class="font-semibold">
                                            Friend Requests
                                        </h3>
                                        <p
                                            class="text-sm text-base-content/60"
                                        >
                                            {{ pendingRequests.length }} pending
                                            request{{ pendingRequests.length > 1 ? 's' : '' }}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    class="btn btn-primary btn-sm"
                                    @click="showRequestsModal = true"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Relationships List -->
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
                                    :class="{ 'tab-active': activeTab === 'friends' }"
                                    @click="activeTab = 'friends'"
                                >
                                    Friends
                                </a>
                                <a
                                    role="tab"
                                    class="tab flex-1"
                                    :class="{ 'tab-active': activeTab === 'blocked' }"
                                    @click="activeTab = 'blocked'"
                                >
                                    Blocked
                                </a>
                            </div>

                            <!-- List -->
                            <div class="divide-y divide-base-200">
                                <div
                                    v-for="rel in filteredRelationships"
                                    :key="rel.id"
                                    class="flex items-center gap-3 p-4 hover:bg-base-200/50 transition-colors"
                                >
                                    <!-- Avatar -->
                                    <NuxtLink
                                        :to="`/accounts/${getAccountName(rel)}`"
                                        class="shrink-0"
                                    >
                                        <div
                                            v-if="getAccount(rel)?.profile?.picture"
                                            class="avatar"
                                        >
                                            <div class="w-12 h-12 rounded-xl">
                                                <img
                                                    :src="getFileUrl(getAccount(rel)?.profile?.picture?.id)"
                                                    :alt="getAccountName(rel)"
                                                >
                                            </div>
                                        </div>
                                        <div
                                            v-else
                                            class="avatar avatar-placeholder"
                                        >
                                            <div
                                                class="w-12 h-12 rounded-xl bg-primary text-primary-content flex items-center justify-center font-semibold"
                                            >
                                                {{
                                                    getInitials(
                                                        getAccount(rel)?.nick ||
                                                            getAccountName(rel),
                                                    )
                                                }}
                                            </div>
                                        </div>
                                    </NuxtLink>

                                    <!-- Info -->
                                    <div class="flex-1 min-w-0">
                                        <div
                                            class="flex items-center gap-2 flex-wrap"
                                        >
                                            <NuxtLink
                                                :to="`/accounts/${getAccountName(rel)}`"
                                                class="font-semibold truncate hover:text-primary transition-colors"
                                            >
                                                {{
                                                    getAccount(rel)?.nick ||
                                                    getAccountName(rel)
                                                }}
                                            </NuxtLink>
                                            <!-- Status Badges -->
                                            <span
                                                v-if="getRelationshipStatus(rel) === 'friend'"
                                                class="badge badge-primary badge-sm"
                                            >
                                                Friend
                                            </span>
                                            <span
                                                v-else-if="getRelationshipStatus(rel) === 'blocked'"
                                                class="badge badge-error badge-sm"
                                            >
                                                Blocked
                                            </span>
                                            <span
                                                v-else-if="getRelationshipStatus(rel) === 'pending_in'"
                                                class="badge badge-primary badge-sm"
                                            >
                                                Pending
                                            </span>
                                            <span
                                                v-else-if="getRelationshipStatus(rel) === 'pending_out'"
                                                class="badge badge-secondary badge-sm"
                                            >
                                                Waiting
                                            </span>
                                        </div>
                                        <p
                                            class="text-sm text-base-content/60 truncate"
                                        >
                                            @{{ getAccountName(rel) }}
                                        </p>
                                    </div>

                                    <!-- Actions -->
                                    <div class="flex items-center gap-1">
                                        <!-- Accept/Decline for incoming requests -->
                                        <template
                                            v-if="getRelationshipStatus(rel) === 'pending_in'"
                                        >
                                            <button
                                                class="btn btn-primary btn-sm btn-square"
                                                :disabled="isActionLoading[rel.id]"
                                                @click="handleAccept(rel)"
                                            >
                                                <IconCheck
                                                    v-if="!isActionLoading[rel.id]"
                                                    class="w-4 h-4"
                                                />
                                                <IconLoader
                                                    v-else
                                                    class="w-4 h-4 animate-spin"
                                                />
                                            </button>
                                            <button
                                                class="btn btn-ghost btn-sm btn-square text-error"
                                                :disabled="isActionLoading[rel.id]"
                                                @click="handleDecline(rel)"
                                            >
                                                <IconX class="w-4 h-4" />
                                            </button>
                                        </template>

                                        <!-- Cancel for outgoing requests -->
                                        <button
                                            v-else-if="getRelationshipStatus(rel) === 'pending_out'"
                                            class="btn btn-ghost btn-sm btn-square"
                                            :disabled="isActionLoading[rel.id]"
                                            @click="handleCancel(rel)"
                                        >
                                            <IconX class="w-4 h-4" />
                                        </button>

                                        <!-- Menu for established relationships -->
                                        <div v-else class="dropdown dropdown-end">
                                            <button
                                                class="btn btn-ghost btn-sm btn-square"
                                            >
                                                <IconMoreVertical
                                                    class="w-4 h-4"
                                                />
                                            </button>
                                            <ul
                                                class="dropdown-content menu menu-sm bg-base-100 rounded-box z-[1] w-52 p-2 shadow-sm border border-base-200 mt-2"
                                            >
                                                <li
                                                    v-if="getRelationshipStatus(rel) === 'friend'"
                                                >
                                                    <button
                                                        class="text-error"
                                                        @click="handleBlock(rel)"
                                                    >
                                                        <IconBan
                                                            class="w-4 h-4"
                                                        />
                                                        Block User
                                                    </button>
                                                </li>
                                                <li
                                                    v-else-if="getRelationshipStatus(rel) === 'blocked'"
                                                >
                                                    <button
                                                        @click="handleUnblock(rel)"
                                                    >
                                                        <IconUserCheck
                                                            class="w-4 h-4"
                                                        />
                                                        Unblock User
                                                    </button>
                                                </li>
                                                <li
                                                    class="border-t border-base-200 mt-1 pt-1"
                                                >
                                                    <button
                                                        class="text-error"
                                                        @click="handleDelete(rel)"
                                                    >
                                                        <IconTrash
                                                            class="w-4 h-4"
                                                        />
                                                        Remove Relationship
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <!-- Empty State -->
                                <div
                                    v-if="filteredRelationships.length === 0"
                                    class="p-8 text-center text-base-content/50"
                                >
                                    <IconUsers
                                        class="w-12 h-12 mx-auto mb-3 opacity-50"
                                    />
                                    <p>
                                        No {{ activeTab === 'all' ? 'relationships' : activeTab }} found
                                    </p>
                                </div>
                            </div>

                            <!-- Load More -->
                            <div
                                v-if="hasMore"
                                class="p-4 text-center border-t border-base-200"
                            >
                                <button
                                    class="btn btn-ghost btn-sm"
                                    :disabled="isLoadingMore"
                                    @click="loadMore"
                                >
                                    <IconLoader
                                        v-if="isLoadingMore"
                                        class="w-4 h-4 animate-spin"
                                    />
                                    Load More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Sidebar -->
                <div class="space-y-4 hidden lg:block">
                    <!-- Stats Card -->
                    <div class="card bg-base-100">
                        <div class="card-body p-4">
                            <h3
                                class="text-sm font-semibold text-base-content/70 mb-3"
                            >
                                Statistics
                            </h3>
                            <div class="space-y-2">
                                <div
                                    class="flex items-center justify-between text-sm"
                                >
                                    <span class="text-base-content/60">Friends</span>
                                    <span class="font-semibold">{{ friendCount }}</span>
                                </div>
                                <div
                                    class="flex items-center justify-between text-sm"
                                >
                                    <span class="text-base-content/60">Pending</span>
                                    <span class="font-semibold">{{ pendingCount }}</span>
                                </div>
                                <div
                                    class="flex items-center justify-between text-sm"
                                >
                                    <span class="text-base-content/60">Blocked</span>
                                    <span class="font-semibold">{{ blockedCount }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Friend Modal -->
        <dialog :open="showAddFriend" class="modal">
            <div class="modal-box max-w-sm">
                <h3 class="font-bold text-lg">Add Friend</h3>
                <p class="text-sm text-base-content/60 py-2">
                    Enter the username of the person you want to add
                </p>
                <div class="py-4">
                    <input
                        v-model="friendUsername"
                        type="text"
                        placeholder="username"
                        class="input input-bordered w-full"
                        @keydown.enter="submitAddFriend"
                    >
                </div>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-ghost" @click="showAddFriend = false">
                            Cancel
                        </button>
                    </form>
                    <button
                        class="btn btn-primary"
                        :disabled="!friendUsername || isAddingFriend"
                        @click="submitAddFriend"
                    >
                        <IconLoader
                            v-if="isAddingFriend"
                            class="w-4 h-4 animate-spin"
                        />
                        <IconUserPlus v-else class="w-4 h-4" />
                        Add Friend
                    </button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="showAddFriend = false">close</button>
            </form>
        </dialog>

        <!-- Friend Requests Modal -->
        <dialog :open="showRequestsModal" class="modal">
            <div class="modal-box max-w-md max-h-[80vh] flex flex-col">
                <div class="flex items-center justify-between pb-4">
                    <h3 class="font-bold text-lg">Friend Requests</h3>
                    <form method="dialog">
                        <button
                            class="btn btn-ghost btn-sm btn-square"
                            @click="showRequestsModal = false"
                        >
                            <IconX class="w-4 h-4" />
                        </button>
                    </form>
                </div>
                <div class="overflow-y-auto flex-1 space-y-2">
                    <div
                        v-for="req in pendingRequests"
                        :key="req.id"
                        class="flex items-center gap-3 p-3 rounded-xl bg-base-200/50"
                    >
                        <div
                            v-if="req.account?.profile?.picture"
                            class="avatar"
                        >
                            <div class="w-10 h-10 rounded-lg">
                                <img
                                    :src="getFileUrl(req.account.profile.picture.id)"
                                    :alt="req.account.name"
                                >
                            </div>
                        </div>
                        <div v-else class="avatar avatar-placeholder">
                            <div
                                class="w-10 h-10 rounded-lg bg-primary text-primary-content flex items-center justify-center text-sm font-semibold"
                            >
                                {{
                                    getInitials(
                                        req.account?.nick || req.account?.name,
                                    )
                                }}
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-sm truncate">
                                {{ req.account?.nick || req.account?.name }}
                            </p>
                            <p class="text-xs text-base-content/60 truncate">
                                @{{ req.account?.name }}
                            </p>
                        </div>
                        <div class="flex items-center gap-1">
                            <button
                                class="btn btn-primary btn-sm btn-square"
                                :disabled="isActionLoading[req.id]"
                                @click="handleAccept(req)"
                            >
                                <IconCheck
                                    v-if="!isActionLoading[req.id]"
                                    class="w-4 h-4"
                                />
                                <IconLoader
                                    v-else
                                    class="w-4 h-4 animate-spin"
                                />
                            </button>
                            <button
                                class="btn btn-ghost btn-sm btn-square text-error"
                                :disabled="isActionLoading[req.id]"
                                @click="handleDecline(req)"
                            >
                                <IconX class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="showRequestsModal = false">close</button>
            </form>
        </dialog>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { getFileUrl } from "~/utils/files";
import {
    IconArrowLeft,
    IconUserPlus,
    IconSend,
    IconCheck,
    IconX,
    IconLoader,
    IconMoreVertical,
    IconBan,
    IconUserCheck,
    IconTrash,
    IconUsers,
} from "#components";
import { useAuthStore } from "~/stores/auth";
import type { Relationship } from "~/utils/api";
import {
    fetchRelationships,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    updateRelationship,
    deleteRelationship,
    fetchAccount,
} from "~/utils/api";

const router = useRouter();
const authStore = useAuthStore();
const { notify, confirm } = useAlert();

// State
const isLoading = ref(true);
const isLoadingMore = ref(false);
const relationships = ref<Relationship[]>([]);
const pendingRequests = ref<Relationship[]>([]);
const activeTab = ref<"all" | "friends" | "blocked">("all");
const offset = ref(0);
const hasMore = ref(false);
const isActionLoading = ref<Record<string, boolean>>({});

// Modal states
const showAddFriend = ref(false);
const showRequestsModal = ref(false);
const friendUsername = ref("");
const isAddingFriend = ref(false);

// Computed
const filteredRelationships = computed(() => {
    if (activeTab.value === "friends") {
        return relationships.value.filter((r) => r.status >= 100);
    }
    if (activeTab.value === "blocked") {
        return relationships.value.filter((r) => r.status <= -100);
    }
    return relationships.value;
});

const friendCount = computed(
    () => relationships.value.filter((r) => r.status >= 100).length,
);
const pendingCount = computed(() => pendingRequests.value.length);
const blockedCount = computed(
    () => relationships.value.filter((r) => r.status <= -100).length,
);

// Helpers
function getAccount(rel: Relationship) {
    const currentUserId = authStore.user?.id;
    return rel.accountId === currentUserId ? rel.related : rel.account;
}

function getAccountName(rel: Relationship) {
    return getAccount(rel)?.name || "";
}

function getInitials(name: string): string {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .map((p) => p[0]?.toUpperCase())
            .slice(0, 2)
            .join("") || "?"
    );
}

function getRelationshipStatus(rel: Relationship): string {
    const currentUserId = authStore.user?.id;
    if (rel.status >= 100) return "friend";
    if (rel.status <= -100) return "blocked";
    if (rel.status === 0) {
        if (rel.relatedId === currentUserId) return "pending_in";
        if (rel.accountId === currentUserId) return "pending_out";
    }
    return "unknown";
}

// API Actions
async function loadData() {
    try {
        const [rels, reqs] = await Promise.all([
            fetchRelationships(),
            fetchFriendRequests(),
        ]);
        relationships.value = rels.items;
        hasMore.value = rels.hasMore;
        pendingRequests.value = reqs;
    } catch (err) {
        console.error("Failed to load relationships:", err);
    }
}

async function loadMore() {
    isLoadingMore.value = true;
    offset.value += 20;
    try {
        const result = await fetchRelationships(offset.value);
        relationships.value.push(...result.items);
        hasMore.value = result.hasMore;
    } finally {
        isLoadingMore.value = false;
    }
}

async function handleAccept(rel: Relationship) {
    isActionLoading.value[rel.id] = true;
    try {
        await acceptFriendRequest(rel.accountId);
        await loadData();
    } catch (err) {
        console.error("Failed to accept:", err);
    } finally {
        isActionLoading.value[rel.id] = false;
    }
}

async function handleDecline(rel: Relationship) {
    isActionLoading.value[rel.id] = true;
    try {
        await declineFriendRequest(rel.accountId);
        await loadData();
    } catch (err) {
        console.error("Failed to decline:", err);
    } finally {
        isActionLoading.value[rel.id] = false;
    }
}

async function handleCancel(rel: Relationship) {
    isActionLoading.value[rel.id] = true;
    try {
        await cancelFriendRequest(rel.relatedId);
        await loadData();
    } catch (err) {
        console.error("Failed to cancel:", err);
    } finally {
        isActionLoading.value[rel.id] = false;
    }
}

async function handleBlock(rel: Relationship) {
    if (!(await confirm("Confirm", "Block this user?"))) return;
    const accountId = getAccount(rel)?.id;
    if (!accountId) return;
    isActionLoading.value[rel.id] = true;
    try {
        await updateRelationship(accountId, -100);
        await loadData();
    } catch (err) {
        console.error("Failed to block:", err);
    } finally {
        isActionLoading.value[rel.id] = false;
    }
}

async function handleUnblock(rel: Relationship) {
    const accountId = getAccount(rel)?.id;
    if (!accountId) return;
    isActionLoading.value[rel.id] = true;
    try {
        await updateRelationship(accountId, 100);
        await loadData();
    } catch (err) {
        console.error("Failed to unblock:", err);
    } finally {
        isActionLoading.value[rel.id] = false;
    }
}

async function handleDelete(rel: Relationship) {
    if (!(await confirm("Confirm", `Remove relationship with @${getAccountName(rel)}?`))) return;
    const accountId = getAccount(rel)?.id;
    if (!accountId) return;
    isActionLoading.value[rel.id] = true;
    try {
        await deleteRelationship(accountId);
        await loadData();
    } catch (err) {
        console.error("Failed to delete:", err);
    } finally {
        isActionLoading.value[rel.id] = false;
    }
}

async function submitAddFriend() {
    if (!friendUsername.value) return;
    isAddingFriend.value = true;
    try {
        const account = await fetchAccount(friendUsername.value);
        if (!account?.id) {
            await notify("User not found");
            return;
        }
        await sendFriendRequest(account.id);
        showAddFriend.value = false;
        friendUsername.value = "";
        await loadData();
    } catch (err) {
        console.error("Failed to add friend:", err);
        await notify("Failed to send friend request");
    } finally {
        isAddingFriend.value = false;
    }
}

onMounted(async () => {
    isLoading.value = true;
    await loadData();
    isLoading.value = false;
});

defineOgImage('UniOgImage', { title: 'Relationships' })

useSolarSeo({
    title: "Relationships",
});
</script>
