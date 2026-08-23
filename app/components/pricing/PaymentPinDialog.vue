<template>
    <DialogRoot v-model:open="open" @update:open="onOpenChange">
        <DialogPortal>
            <Transition name="dialog-fade">
                <DialogOverlay
                    v-if="open"
                    forceMount
                    class="fixed inset-0 z-[60] bg-black/50"
                />
            </Transition>
            <Transition name="dialog-pop">
                <DialogContent
                    v-if="open"
                    forceMount
                    class="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-5 rounded-box bg-base-100 p-6 shadow-sm"
                >
                <DialogTitle class="text-center text-lg font-bold">
                    {{ t('pricing.payment.enterPinTitle') }}
                </DialogTitle>
                <p class="text-center text-sm text-base-content/50">
                    {{ t('pricing.payment.enterPinDesc') }}
                </p>
                <PinInputRoot
                    v-model="pinDigits"
                    mask
                    otp
                    type="number"
                    class="pin-input-root"
                >
                    <PinInputInput
                        v-for="(_, i) in 6"
                        :key="i"
                        :index="i"
                        class="h-14 w-12 rounded-lg border border-base-content/20 bg-base-100 text-center text-xl font-bold text-base-content outline-none transition-colors focus:border-primary focus:bg-primary/5"
                    />
                </PinInputRoot>
                <p v-if="error" class="text-center text-xs text-error">
                    {{ error }}
                </p>
                <div class="flex gap-3">
                    <DialogClose as-child>
                        <button class="btn btn-ghost flex-1" :disabled="busy">
                            {{ t('common.cancel') }}
                        </button>
                    </DialogClose>
                    <button
                        class="btn btn-primary flex-1 gap-2"
                        :disabled="pinCode.length < 6 || busy"
                        @click="submit"
                    >
                        <IconLoader v-if="busy" class="h-4 w-4 animate-spin" />
                        {{ busy ? t('pricing.payment.processing') : t('pricing.payment.payNow') }}
                    </button>
                </div>
                </DialogContent>
            </Transition>
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts">
import {
    DialogClose,
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    PinInputInput,
    PinInputRoot,
} from "reka-ui";

const props = defineProps<{
    busy?: boolean;
    error?: string;
}>();

const emit = defineEmits<{
    confirm: [pin: string];
}>();

const open = defineModel<boolean>("open", { default: false });

const { t } = useI18n();

const pinDigits = ref<string[]>([]);
const pinCode = computed(() => pinDigits.value.join(""));

function submit() {
    if (pinCode.value.length < 6 || props.busy) return;
    emit("confirm", pinCode.value);
}

function onOpenChange(openValue: boolean) {
    if (!openValue) {
        pinDigits.value = [];
        open.value = false;
    }
}
</script>

<style scoped>
.pin-input-root {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}
</style>
