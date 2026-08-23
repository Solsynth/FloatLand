<template>
    <DialogRoot v-model:open="open">
        <DialogPortal>
            <Transition name="dialog-fade">
                <DialogOverlay
                    v-if="open"
                    forceMount
                    class="fixed inset-0 z-50 bg-black/50"
                />
            </Transition>
            <Transition name="dialog-pop">
                <DialogContent
                    v-if="open"
                    forceMount
                    class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-box bg-base-100 p-6 shadow-sm"
                >
                <DialogTitle class="text-lg font-extrabold tracking-tight">
                    {{ t('pricing.choose', { name: tierName }) }}
                </DialogTitle>
                <p class="mt-1 text-sm text-base-content/60">
                    {{ t('pricing.payment.oneMonth') }} ·
                    {{ priceText }}
                </p>

                <!-- Payment method tabs -->
                <div
                    v-if="methods.length > 1"
                    class="mt-5 grid grid-cols-2 gap-1 rounded-box bg-base-200 p-1"
                >
                    <button
                        v-for="m in methods"
                        :key="m"
                        type="button"
                        class="rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                        :class="
                            method === m
                                ? 'bg-base-100 text-base-content shadow-sm'
                                : 'text-base-content/55 hover:text-base-content'
                        "
                        @click="method = m"
                    >
                        {{ methodLabel(m) }}
                    </button>
                </div>
                <p
                    v-else-if="methods.length === 1"
                    class="mt-5 text-sm font-semibold text-base-content/80"
                >
                    {{ methodLabel(methods[0]) }}
                </p>

                <!-- Wallet method -->
                <template v-if="method === 'wallet'">
                    <div v-if="wallets.length > 1" class="mt-4">
                        <label
                            class="text-xs font-bold uppercase tracking-[0.12em] text-base-content/45"
                        >
                            {{ t('pricing.payment.wallet') }}
                        </label>
                        <select
                            v-model="selectedWalletId"
                            class="select select-bordered mt-1.5 w-full"
                        >
                            <option
                                v-for="w in wallets"
                                :key="w.id"
                                :value="w.id"
                            >
                                {{ w.name || "Wallet" }} ·
                                {{ formatBalance(w) }}
                            </option>
                        </select>
                    </div>
                    <div
                        class="mt-4 flex items-center justify-between rounded-box bg-base-200/70 px-4 py-3 text-sm"
                    >
                        <span class="text-base-content/60">
                            {{ t('pricing.payment.balance') }}
                        </span>
                        <span class="font-semibold">
                            {{ formatBalance(selectedWallet) }}
                        </span>
                    </div>
                    <p
                        v-if="insufficient"
                        class="mt-2 text-xs leading-5 text-error"
                    >
                        {{ t('pricing.payment.insufficientBalance') }}
                    </p>

                    <button
                        class="btn btn-primary mt-5 w-full gap-2"
                        :disabled="busy || insufficient"
                        @click="startWalletPay"
                    >
                        <IconLoader v-if="busy" class="h-4 w-4 animate-spin" />
                        <IconWallet v-else class="h-4 w-4" />
                        {{ busy ? t('pricing.payment.processing') : t('pricing.payment.payNow') }}
                    </button>
                    <p
                        v-if="pinStatus?.validationRequired"
                        class="mt-2 flex items-center justify-center gap-1.5 text-xs text-base-content/40"
                    >
                        <IconLock class="h-3 w-3" />
                        {{ t('pricing.payment.pinEnabledNote') }}
                    </p>
                </template>

                <!-- Afdian method -->
                <template v-else>
                    <p class="mt-4 text-sm leading-6 text-base-content/65">
                        {{ t('pricing.payment.afdianHint') }}
                    </p>
                    <button
                        class="btn btn-primary mt-5 w-full gap-2"
                        :disabled="busy"
                        @click="startAfdian"
                    >
                        <IconLoader v-if="busy" class="h-4 w-4 animate-spin" />
                        <IconExternalLink v-else class="h-4 w-4" />
                        {{ busy ? t('pricing.payment.processing') : t('pricing.payment.openAfdian') }}
                    </button>
                </template>

                <p v-if="error" class="mt-3 text-sm leading-5 text-error">
                    {{ error }}
                </p>
                </DialogContent>
            </Transition>
        </DialogPortal>
    </DialogRoot>

    <!-- PIN dialog -->
    <PaymentPinDialog
        v-model:open="showPinDialog"
        :busy="busy"
        :error="payError"
        @confirm="confirmPay"
    />
</template>

<script setup lang="ts">
import {
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from "reka-ui";
import {
    createAfdianCheckout,
    createStellarSubscription,
    createSubscriptionOrder,
    fetchWalletPinStatus,
    fetchWallets,
    payOrder,
    type Wallet,
    type WalletPinStatus,
} from "~/utils/api";
import { WalletOrderStatus } from "~/types/auth";
import type {
    StellarSubscription,
    SubscriptionCatalogItem,
} from "~/types/subscription";

const props = defineProps<{
    tier: SubscriptionCatalogItem | null;
    currentMembership: StellarSubscription | null;
}>();

const emit = defineEmits<{
    purchased: [];
}>();

const open = defineModel<boolean>("open", { default: false });

const { t } = useI18n();
const { notify } = useAlert();

type PaymentMethod = "wallet" | "afdian";

const method = ref<PaymentMethod>("wallet");
const wallets = ref<Wallet[]>([]);
const selectedWalletId = ref("");
const pinStatus = ref<WalletPinStatus | null>(null);
const busy = ref(false);
const error = ref("");
const showPinDialog = ref(false);
const payError = ref("");

const tierName = computed(() => props.tier?.displayName ?? "");
const priceText = computed(() =>
    props.tier
        ? `${props.tier.basePrice} ${props.tier.currency}/mo`
        : "",
);

const methods = computed<PaymentMethod[]>(() => {
    const allowed = props.tier?.allowedPaymentMethods ?? [];
    const list: PaymentMethod[] = [];
    // Apple Store IAP is a native-only method; the web app offers wallet and Afdian.
    if (allowed.includes("solian.wallet")) list.push("wallet");
    if (allowed.includes("afdian")) list.push("afdian");
    return list;
});

function methodLabel(m: PaymentMethod): string {
    return m === "wallet"
        ? t("pricing.payment.methodWallet")
        : t("pricing.payment.methodAfdian");
}

const selectedWallet = computed(
    () =>
        wallets.value.find((w) => w.id === selectedWalletId.value) ??
        wallets.value[0] ??
        null,
);

function walletBalance(w: Wallet | null): number {
    const pocket = w?.pockets.find((p) => p.currency === props.tier?.currency);
    return pocket?.availableAmount ?? 0;
}

const insufficient = computed(
    () => walletBalance(selectedWallet.value) < (props.tier?.basePrice ?? 0),
);

function formatBalance(w: Wallet | null): string {
    if (!w) return "—";
    return `${props.tier?.currency} ${walletBalance(w).toLocaleString("en-US")}`;
}

watch(open, async (isOpen) => {
    if (!isOpen) return;
    error.value = "";
    payError.value = "";
    const list = methods.value;
    method.value = list.includes("wallet") ? "wallet" : (list[0] ?? "wallet");
    if (!list.includes("wallet")) return;
    try {
        const [all, ps] = await Promise.all([
            fetchWallets(),
            fetchWalletPinStatus().catch(() => null),
        ]);
        wallets.value = all;
        selectedWalletId.value =
            all.find((w) => w.isPrimary)?.id || all[0]?.id || "";
        pinStatus.value = ps;
    } catch {
        wallets.value = [];
    }
});

async function startWalletPay() {
    if (!props.tier || busy.value) return;
    if (pinStatus.value?.validationRequired) {
        showPinDialog.value = true;
        return;
    }
    await confirmPay("");
}

async function confirmPay(pin: string) {
    if (!props.tier || busy.value) return;
    busy.value = true;
    error.value = "";
    payError.value = "";
    try {
        const subscription = await createStellarSubscription(
            props.tier.identifier,
            30,
        );
        if (subscription.status === 1) {
            // Already active — nothing to charge.
            showPinDialog.value = false;
            open.value = false;
            await notify(t("pricing.alreadyActive"));
            emit("purchased");
            return;
        }
        const order = await createSubscriptionOrder(subscription.id);
        const paid = await payOrder(
            order.id,
            pin,
            selectedWalletId.value || undefined,
        );
        if (
            paid.status === WalletOrderStatus.Paid ||
            paid.status === WalletOrderStatus.Finished
        ) {
            showPinDialog.value = false;
            open.value = false;
            await notify(t("pricing.membershipPurchaseSuccess"));
            emit("purchased");
        } else {
            throw new Error(t("pricing.payment.checkoutFailed"));
        }
    } catch (e: any) {
        const message = e?.message || t("pricing.payment.checkoutFailed");
        if (showPinDialog.value) payError.value = message;
        else error.value = message;
    } finally {
        busy.value = false;
    }
}

async function startAfdian() {
    if (!props.tier || busy.value) return;
    busy.value = true;
    error.value = "";
    try {
        const checkout = await createAfdianCheckout(props.tier.identifier);
        window.open(checkout.checkoutUrl, "_blank", "noopener,noreferrer");
        open.value = false;
        await notify(t("pricing.payment.afdianHint"));
    } catch (e: any) {
        error.value = e?.message || t("pricing.payment.checkoutFailed");
    } finally {
        busy.value = false;
    }
}

</script>
