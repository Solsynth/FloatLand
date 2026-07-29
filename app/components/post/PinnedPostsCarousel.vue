<template>
    <div v-if="posts.length > 0" class="card">
        <div class="card-body p-4">
            <div class="flex items-center gap-2 mb-3">
                <IconPin class="w-4 h-4 text-base-content/70" />
                <h3 class="text-sm font-semibold text-base-content/70">
                    Pinned Posts
                </h3>
            </div>

            <div class="relative">
                <!-- Page View -->
                <div class="overflow-hidden rounded-box">
                    <div
                        class="flex transition-transform duration-300 ease-out"
                        :style="{
                            transform: `translateX(-${currentPage * 100}%)`,
                        }"
                    >
                        <div
                            v-for="post in posts"
                            :key="post.id"
                            class="w-full shrink-0 px-1"
                        >
                            <PostCard
                                :post="post"
                                embedded
                                class="bg-base-200/50"
                                @boost="$emit('boost', $event)"
                                @share="$emit('share', $event)"
                                @reply="$emit('reply', $event)"
                            />
                        </div>
                    </div>
                </div>

                <!-- Page Indicators -->
                <div
                    v-if="posts.length > 1"
                    class="flex justify-center gap-1.5 mt-3"
                >
                    <button
                        v-for="(_, index) in posts"
                        :key="index"
                        class="w-2 h-2 rounded-full transition-all duration-200"
                        :class="
                            index === currentPage
                                ? 'bg-primary w-4'
                                : 'bg-base-300 hover:bg-base-content/30'
                        "
                        @click="goToPage(index)"
                    />
                </div>

                <!-- Navigation Arrows -->
                <button
                    v-if="posts.length > 1 && currentPage > 0"
                    class="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 btn btn-circle btn-ghost btn-sm bg-base-100"
                    @click="prevPage"
                >
                    <IconChevronLeft class="w-4 h-4" />
                </button>
                <button
                    v-if="posts.length > 1 && currentPage < posts.length - 1"
                    class="absolute right-0 top-1/2 translate-x-2 -translate-y-1/2 btn btn-circle btn-ghost btn-sm bg-base-100"
                    @click="nextPage"
                >
                    <IconChevronRight class="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Post } from "~/types/post";

interface Props {
    posts: Post[];
}

defineProps<Props>();

defineEmits<{
    boost: [post: Post];
    share: [post: Post];
    reply: [post: Post];
}>();

const currentPage = ref(0);

function nextPage() {
    currentPage.value++;
}

function prevPage() {
    currentPage.value--;
}

function goToPage(index: number) {
    currentPage.value = index;
}

// Auto-advance every 10 seconds
let autoAdvanceInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
    autoAdvanceInterval = setInterval(() => {
        // Don't auto-advance if user is hovering
    }, 10000);
});

onUnmounted(() => {
    if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
    }
});
</script>
