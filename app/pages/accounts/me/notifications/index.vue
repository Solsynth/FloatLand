<template>
    <NuxtLayout name="app">
        <ConfuseSpinner v-if="isLoading" message="Loading notifications..." />

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
                    <h1 class="text-xl font-bold">Notifications</h1>
                    <span
                        v-if="unreadCount > 0"
                        class="badge badge-primary badge-sm"
                    >
                        {{ unreadCount }} unread
                    </span>
                </div>
                <button
                    v-if="notifications.some((n) => !n.viewedAt)"
                    class="btn btn-ghost btn-sm gap-2"
                    :disabled="isMarkingAllRead"
                    @click="markAllRead"
                >
                    <IconLoader
                        v-if="isMarkingAllRead"
                        class="w-4 h-4 animate-spin"
                    />
                    <IconCheckCheck v-else class="w-4 h-4" />
                    Mark all read
                </button>
            </div>

            <!-- Content Grid -->
            <div class="grid gap-4 px-4 py-4 lg:px-6 lg:grid-cols-3">
                <!-- Left Column - Main Content -->
                <div class="lg:col-span-2 space-y-4">
                    <!-- Filter Tabs -->
                    <div role="tablist" class="tabs tabs-box bg-base-200/50 p-2">
                        <a
                            role="tab"
                            class="tab flex-1"
                            :class="{ 'tab-active': activeFilter === 'all' }"
                            @click="activeFilter = 'all'"
                        >
                            All
                        </a>
                        <a
                            role="tab"
                            class="tab flex-1"
                            :class="{ 'tab-active': activeFilter === 'unread' }"
                            @click="activeFilter = 'unread'"
                        >
                            Unread
                            <span v-if="unreadCount > 0" class="badge badge-primary badge-xs ml-1">
                                {{ unreadCount }}
                            </span>
                        </a>
                    </div>

                    <!-- Notifications List -->
                    <div class="card bg-base-100">
                        <div class="card-body p-0">
                            <div class="divide-y divide-base-200">
                                <div
                                    v-for="notification in filteredNotifications"
                                    :key="notification.id"
                                    class="flex items-start gap-3 p-4 hover:bg-base-200/50 transition-colors cursor-pointer relative"
                                    :class="{
                                        'bg-primary/5': !notification.viewedAt,
                                    }"
                                    @click="
                                        handleNotificationClick(notification)
                                    "
                                >
                                    <!-- Unread indicator -->
                                    <div
                                        v-if="!notification.viewedAt"
                                        class="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"
                                    />

                                    <!-- Icon/Avatar -->
                                    <div
                                        v-if="notification.meta?.pfp"
                                        class="avatar shrink-0"
                                    >
                                        <div class="w-12 h-12 rounded-xl">
                                            <FileImage
                                                :src="
                                                    getFileUrl(
                                                        notification.meta
                                                            .pfp as string,
                                                    )!
                                                "
                                                alt=""
                                            />
                                        </div>
                                    </div>
                                    <div
                                        v-else
                                        class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                        :class="
                                            getNotificationIconBg(
                                                notification.topic,
                                            )
                                        "
                                    >
                                        <component
                                            :is="
                                                getNotificationIcon(
                                                    notification.topic,
                                                )
                                            "
                                            class="w-6 h-6"
                                            :class="
                                                getNotificationIconColor(
                                                    notification.topic,
                                                )
                                            "
                                        />
                                    </div>

                                    <!-- Content -->
                                    <div class="flex-1 min-w-0 pr-6">
                                        <div
                                            class="flex items-center gap-2 flex-wrap"
                                        >
                                            <h4 class="font-semibold">
                                                {{ notification.title }}
                                            </h4>
                                            <span
                                                v-if="notification.topic"
                                                class="badge badge-xs badge-ghost"
                                            >
                                                {{
                                                    formatTopic(
                                                        notification.topic,
                                                    )
                                                }}
                                            </span>
                                        </div>
                                        <p
                                            v-if="notification.subtitle"
                                            class="text-sm font-medium text-base-content/80 mt-0.5"
                                        >
                                            {{ notification.subtitle }}
                                        </p>
                                        <p
                                            class="text-sm text-base-content/60 line-clamp-2 mt-1"
                                        >
                                            {{ notification.content }}
                                        </p>

                                        <!-- Images -->
                                        <div
                                            v-if="
                                                notification.meta?.images &&
                                                (
                                                    notification.meta
                                                        .images as string[]
                                                ).length > 0
                                            "
                                            class="flex gap-2 mt-2"
                                        >
                                            <FileImage
                                                v-for="imgId in (
                                                    notification.meta
                                                        .images as string[]
                                                ).slice(0, 3)"
                                                :key="imgId"
                                                :src="getFileUrl(imgId)!"
                                                class="w-16 h-16 rounded-lg object-cover"
                                            />
                                        </div>

                                        <!-- Meta -->
                                        <div
                                            class="flex items-center gap-2 mt-2 text-xs text-base-content/50"
                                        >
                                            <span>{{
                                                formatDate(
                                                    notification.createdAt,
                                                )
                                            }}</span>
                                            <span>·</span>
                                            <span>{{
                                                formatRelativeTime(
                                                    notification.createdAt,
                                                )
                                            }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Empty -->
                                <div
                                    v-if="filteredNotifications.length === 0"
                                    class="p-8 text-center text-base-content/50"
                                >
                                    <IconBell
                                        class="w-12 h-12 mx-auto mb-3 opacity-50"
                                    />
                                    <p>
                                        No
                                        {{
                                            activeFilter === "unread"
                                                ? "unread "
                                                : ""
                                        }}notifications
                                    </p>
                                </div>
                            </div>

                            <!-- Load More -->
                            <div
                                v-if="hasMore"
                                class="p-3 text-center border-t border-base-200"
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
                                Overview
                            </h3>
                            <div class="space-y-2">
                                <div
                                    class="flex items-center justify-between text-sm"
                                >
                                    <span class="text-base-content/60"
                                        >Total</span
                                    >
                                    <span class="font-semibold">{{
                                        totalCount
                                    }}</span>
                                </div>
                                <div
                                    class="flex items-center justify-between text-sm"
                                >
                                    <span class="text-base-content/60"
                                        >Unread</span
                                    >
                                    <span class="font-semibold text-primary">{{
                                        unreadCount
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Topic Filter -->
                    <div class="card bg-base-100">
                        <div class="card-body p-4">
                            <h3
                                class="text-sm font-semibold text-base-content/70 mb-3"
                            >
                                Topics
                            </h3>
                            <div class="space-y-1">
                                <button
                                    v-for="topic in availableTopics"
                                    :key="topic"
                                    class="btn btn-ghost btn-sm w-full justify-start"
                                    :class="{
                                        'btn-active': topicFilter === topic,
                                    }"
                                    @click="
                                        topicFilter =
                                            topicFilter === topic ? null : topic
                                    "
                                >
                                    <component
                                        :is="getNotificationIcon(topic)"
                                        class="w-4 h-4 mr-2"
                                    />
                                    {{ formatTopic(topic) }}
                                    <span class="badge badge-xs ml-auto">
                                        {{ getTopicCount(topic) }}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import {
    IconArrowLeft,
    IconCheckCheck,
    IconLoader,
    IconBell,
    IconReply,
    IconWallet,
    IconUserPlus,
    IconMessageCircle,
    IconBuilding2,
    IconLogIn,
    IconFilePlus,
    IconShoppingBag,
    IconSmilePlus,
} from "#components";
import { getFileUrl } from "~/utils/files";
import type { Notification } from "~/utils/api";
import {
    fetchNotifications,
    fetchNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
} from "~/utils/api";

const router = useRouter();

// State
const isLoading = ref(true);
const notifications = ref<Notification[]>([]);
const unreadCount = ref(0);
const totalCount = ref(0);
const activeFilter = ref<"all" | "unread">("all");
const topicFilter = ref<string | null>(null);
const offset = ref(0);
const hasMore = ref(false);
const isLoadingMore = ref(false);
const isMarkingAllRead = ref(false);

// Topic icons and colors
const topicConfig: Record<
    string,
    { icon: unknown; bg: string; color: string }
> = {
    "post.replies": { icon: IconReply, bg: "bg-blue/10", color: "text-blue" },
    "wallet.transactions": {
        icon: IconWallet,
        bg: "bg-green/10",
        color: "text-green",
    },
    "relationships.friends.request": {
        icon: IconUserPlus,
        bg: "bg-purple/10",
        color: "text-purple",
    },
    "invites.chat": {
        icon: IconMessageCircle,
        bg: "bg-pink/10",
        color: "text-pink",
    },
    "invites.realm": {
        icon: IconBuilding2,
        bg: "bg-orange/10",
        color: "text-orange",
    },
    "auth.login": { icon: IconLogIn, bg: "bg-gray/10", color: "text-gray" },
    "posts.new": {
        icon: IconFilePlus,
        bg: "bg-indigo/10",
        color: "text-indigo",
    },
    "wallet.orders.paid": {
        icon: IconShoppingBag,
        bg: "bg-teal/10",
        color: "text-teal",
    },
    "posts.reactions.new": {
        icon: IconSmilePlus,
        bg: "bg-yellow/10",
        color: "text-yellow",
    },
};

// Computed
const filteredNotifications = computed(() => {
    let result = notifications.value;

    if (activeFilter.value === "unread") {
        result = result.filter((n) => !n.viewedAt);
    }

    if (topicFilter.value) {
        result = result.filter((n) => n.topic === topicFilter.value);
    }

    return result;
});

const availableTopics = computed(() => {
    const topics = new Set(notifications.value.map((n) => n.topic));
    return Array.from(topics).filter(Boolean);
});

// Helpers
function getNotificationIcon(topic: string): unknown {
    return topicConfig[topic]?.icon || IconBell;
}

function getNotificationIconBg(topic: string): string {
    return topicConfig[topic]?.bg || "bg-primary/10";
}

function getNotificationIconColor(topic: string): string {
    return topicConfig[topic]?.color || "text-primary";
}

function formatTopic(topic: string): string {
    const map: Record<string, string> = {
        "post.replies": "Replies",
        "wallet.transactions": "Transactions",
        "relationships.friends.request": "Friend Requests",
        "invites.chat": "Chat Invites",
        "invites.realm": "Realm Invites",
        "auth.login": "Security",
        "posts.new": "New Posts",
        "wallet.orders.paid": "Orders",
        "posts.reactions.new": "Reactions",
    };
    return map[topic] || topic;
}

function getTopicCount(topic: string): number {
    return notifications.value.filter((n) => n.topic === topic).length;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
}

// API Actions
async function loadData() {
    try {
        const [notifs, count] = await Promise.all([
            fetchNotifications(),
            fetchNotificationCount(),
        ]);
        notifications.value = notifs.items;
        totalCount.value = notifs.total;
        hasMore.value = notifs.hasMore;
        unreadCount.value = count;
    } catch (err) {
        console.error("Failed to load notifications:", err);
    }
}

async function loadMore() {
    isLoadingMore.value = true;
    offset.value += 20;
    try {
        const result = await fetchNotifications(offset.value);
        notifications.value.push(...result.items);
        hasMore.value = result.hasMore;
    } finally {
        isLoadingMore.value = false;
    }
}

async function handleNotificationClick(notification: Notification) {
    // Mark as read if unread
    if (!notification.viewedAt) {
        try {
            await markNotificationRead(notification.id);
            notification.viewedAt = new Date().toISOString();
            unreadCount.value = Math.max(0, unreadCount.value - 1);
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    }

    // Navigate if link exists
    if (notification.link) {
        navigateTo(notification.link);
    }
}

async function markAllRead() {
    isMarkingAllRead.value = true;
    try {
        await markAllNotificationsRead();
        notifications.value.forEach((n) => {
            n.viewedAt = new Date().toISOString();
        });
        unreadCount.value = 0;
    } catch (err) {
        console.error("Failed to mark all as read:", err);
    } finally {
        isMarkingAllRead.value = false;
    }
}

onMounted(async () => {
    isLoading.value = true;
    await loadData();
    isLoading.value = false;
});

defineOgImage('UniOgImage', { title: 'Notifications' })

useSolarSeo({
    title: "Notifications",
});
</script>
