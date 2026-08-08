<template>
    <DialogRoot v-model:open="isOpen">
        <DialogPortal>
            <!-- Overlay -->
            <DialogOverlay
                class="onboarding-overlay fixed inset-0 bg-black/40 z-50"
            />

            <!-- Content -->
            <DialogContent
                class="onboarding-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-2xl bg-base-100 rounded-box shadow-sm overflow-hidden outline-none"
                @close-auto-focus.prevent
                @interact-outside.prevent
            >
                <!-- Image Header -->
                <div class="relative h-48 sm:h-56 bg-base-300 overflow-hidden">
                    <img
                        src="/images/main-visual.webp"
                        alt="Solar Network"
                        class="w-full h-full object-cover"
                    />
                    <div class="absolute inset-0 bg-black/25" />

                    <!-- Close button -->
                    <DialogClose
                        class="absolute top-3 right-3 btn btn-sm btn-ghost btn-circle text-white/80 hover:text-white hover:bg-white/10 z-10"
                        aria-label="Close"
                    >
                        <IconX class="h-4 w-4" />
                    </DialogClose>

                    <!-- Step indicators (dots) -->
                    <div
                        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
                    >
                        <button
                            v-for="i in totalSteps"
                            :key="i"
                            class="h-2 rounded-full transition-all duration-300"
                            :class="
                                currentStep === i
                                    ? 'w-8 bg-white'
                                    : 'w-2 bg-white/40 hover:bg-white/60'
                            "
                            @click="goTo(i)"
                        />
                    </div>
                </div>

                <!-- Step Content -->
                <div class="px-6 py-5">
                    <!-- Accessibility: hidden title + description -->
                    <DialogTitle class="sr-only">
                        {{ t("onboarding.title") }}
                    </DialogTitle>
                    <DialogDescription class="sr-only">
                        {{ t("onboarding.solarNetworkDesc") }}
                    </DialogDescription>

                    <Transition
                        mode="out-in"
                        enter-active-class="transition-opacity duration-200 ease-out"
                        leave-active-class="transition-opacity duration-150 ease-in"
                        enter-from-class="opacity-0"
                        enter-to-class="opacity-100"
                        leave-from-class="opacity-100"
                        leave-to-class="opacity-0"
                    >
                        <div :key="`step-${currentStep}`">
                            <!-- Step 1: Solar Network -->
                            <div v-if="currentStep === 1">
                                <div class="flex items-center gap-2 mb-1">
                                    <div
                                        class="w-8 h-8 rounded-box bg-primary/10 flex items-center justify-center"
                                    >
                                        <IconSun class="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 class="font-bold text-lg">
                                        {{ t("onboarding.solarNetworkTitle") }}
                                    </h3>
                                </div>
                                <p
                                    class="text-sm text-base-content/70 mt-2 leading-relaxed"
                                >
                                    {{ t("onboarding.solarNetworkDesc") }}
                                </p>
                            </div>

                            <!-- Step 2: Solian -->
                            <div v-if="currentStep === 2">
                                <div class="flex items-center gap-2 mb-1">
                                    <div
                                        class="w-8 h-8 rounded-box bg-primary/10 flex items-center justify-center"
                                    >
                                        <IconSmartphone
                                            class="w-4 h-4 text-primary"
                                        />
                                    </div>
                                    <h3 class="font-bold text-lg">
                                        {{ t("onboarding.solianTitle") }}
                                    </h3>
                                </div>
                                <p
                                    class="text-sm text-base-content/70 mt-2 leading-relaxed"
                                >
                                    {{ t("onboarding.solianDesc") }}
                                </p>
                            </div>

                            <!-- Step 3: FloatingIsland -->
                            <div v-if="currentStep === 3">
                                <div class="flex items-center gap-2 mb-1">
                                    <div
                                        class="w-8 h-8 rounded-box bg-primary/10 flex items-center justify-center"
                                    >
                                        <IconGlobe
                                            class="w-4 h-4 text-primary"
                                        />
                                    </div>
                                    <h3 class="font-bold text-lg">
                                        {{
                                            t("onboarding.floatingIslandTitle")
                                        }}
                                    </h3>
                                </div>
                                <p
                                    class="text-sm text-base-content/70 mt-2 leading-relaxed"
                                >
                                    {{ t("onboarding.floatingIslandDesc") }}
                                </p>
                            </div>
                        </div>
                    </Transition>

                    <!-- Navigation -->
                    <div
                        class="flex items-center justify-between mt-6 bg-base-200/60 p-3 rounded-box"
                    >
                        <button
                            v-if="currentStep > 1"
                            class="btn btn-ghost btn-sm"
                            @click="prev"
                        >
                            <IconChevronLeft class="h-4 w-4 mr-1" />
                            {{ t("onboarding.back") }}
                        </button>
                        <div v-else />

                        <div class="flex items-center gap-2">
                            <button
                                v-if="currentStep < totalSteps"
                                class="btn btn-primary btn-sm"
                                @click="next"
                            >
                                {{ t("onboarding.next") }}
                                <IconChevronRight class="h-4 w-4 ml-1" />
                            </button>
                            <template v-else>
                                <a
                                    href="https://web.solian.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="btn btn-outline btn-sm"
                                >
                                    {{ t("onboarding.openSolian") }}
                                </a>
                                <DialogClose class="btn btn-primary btn-sm">
                                    {{ t("onboarding.gotIt") }}
                                </DialogClose>
                            </template>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts">
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from "reka-ui";
import {
    IconX,
    IconSun,
    IconSmartphone,
    IconGlobe,
    IconChevronLeft,
    IconChevronRight,
} from "#components";

const { t } = useI18n();

const STORAGE_KEY = "floating_island_onboarding_seen";
const totalSteps = 3;

const currentStep = ref(1);
const isOpen = ref(false);
const seenAndClosed = ref(false);
const hasOpened = useState(
    "floating-island-onboarding-opened",
    () => false,
);

let openTimer: ReturnType<typeof setTimeout> | undefined;

function next() {
    if (currentStep.value < totalSteps) {
        currentStep.value++;
    }
}

function prev() {
    if (currentStep.value > 1) {
        currentStep.value--;
    }
}

function goTo(step: number) {
    currentStep.value = step;
}

function open() {
    if (hasOpened.value) return;
    hasOpened.value = true;
    currentStep.value = 1;
    isOpen.value = true;
}

// Mark as seen when dialog closes
watch(isOpen, (val) => {
    if (!val && !seenAndClosed.value) {
        seenAndClosed.value = true;
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, "true");
        }
    }
});

onMounted(() => {
    if (typeof window !== "undefined") {
        const hasSeen = localStorage.getItem(STORAGE_KEY);
        if (!hasSeen) {
            openTimer = setTimeout(() => {
                openTimer = undefined;
                open();
            }, 500);
        }
    }
});

onBeforeUnmount(() => {
    if (openTimer !== undefined) {
        clearTimeout(openTimer);
        openTimer = undefined;
    }
});

defineExpose({ open });
</script>

<style scoped>
.onboarding-overlay[data-state="open"] {
    animation: fadeIn 200ms ease-out;
}
.onboarding-overlay[data-state="closed"] {
    animation: fadeOut 200ms ease-in;
}

.onboarding-content[data-state="open"] {
    animation: contentShow 200ms ease-out;
}
.onboarding-content[data-state="closed"] {
    animation: contentHide 200ms ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
@keyframes fadeOut {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}
@keyframes contentShow {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}
@keyframes contentHide {
    from {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    to {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.95);
    }
}
</style>
