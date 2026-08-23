<template>
    <section class="mt-14 border-t border-base-300/70 pt-10 md:mt-16 md:pt-12">
        <h2
            class="text-xl font-extrabold tracking-tight text-base-content md:text-2xl"
        >
            {{ t('pricing.shopMoreTitle') }}
        </h2>
        <p class="mt-1.5 max-w-xl text-sm text-base-content/65">
            {{ t('pricing.shopMoreDesc') }}
        </p>

        <div class="mt-8 grid gap-12 sm:grid-cols-3 sm:gap-6">
            <!-- Golden Solar Points -->
            <article class="flex flex-col">
                <div class="flex items-center gap-2.5">
                    <span
                        class="h-2.5 w-2.5 shrink-0 rounded-full"
                        style="background-color: #e8b84a"
                        aria-hidden="true"
                    />
                    <h3
                        class="text-base font-extrabold tracking-tight text-base-content"
                    >
                        {{ t('pricing.goldsTitle') }}
                    </h3>
                </div>
                <p class="mt-2 text-sm leading-5 text-base-content/65">
                    {{ t('pricing.goldsDesc') }}
                </p>
                <div class="mt-auto pt-6">
                    <p
                        v-if="goldsPointsPerUnit"
                        class="text-sm font-semibold text-base-content/85"
                    >
                        {{ goldsPointsPerUnit }} {{ goldsCurrency }}/pack
                    </p>
                    <button
                        v-if="authStore.isAuthenticated"
                        class="btn btn-primary mt-3 w-full gap-2"
                        :disabled="goldsBusy"
                        @click="buyGolds"
                    >
                        <IconLoader
                            v-if="goldsBusy"
                            class="h-4 w-4 animate-spin"
                        />
                        <IconExternalLink v-else class="h-4 w-4" />
                        {{ t('pricing.goldsBuy') }}
                    </button>
                    <button
                        v-else
                        class="btn btn-outline mt-3 w-full"
                        @click="goToLogin"
                    >
                        {{ t('pricing.signInToPurchase') }}
                    </button>
                </div>
            </article>

            <!-- Name change card -->
            <article class="flex flex-col">
                <div class="flex items-center gap-2.5">
                    <span
                        class="h-2.5 w-2.5 shrink-0 rounded-full"
                        style="background-color: #f4b6c8"
                        aria-hidden="true"
                    />
                    <h3
                        class="text-base font-extrabold tracking-tight text-base-content"
                    >
                        {{ t('pricing.nameCardTitle') }}
                    </h3>
                </div>
                <p class="mt-2 text-sm leading-5 text-base-content/65">
                    {{ t('pricing.nameCardDesc') }}
                </p>
                <div class="mt-auto pt-6">
                    <p class="text-sm font-semibold text-base-content/85">
                        {{ NAME_CHANGE_CARD_PRICE }} points
                    </p>
                    <button
                        v-if="authStore.isAuthenticated"
                        class="btn btn-primary mt-3 w-full gap-2"
                        :disabled="nameCardBusy"
                        @click="buyNameCard"
                    >
                        <IconLoader
                            v-if="nameCardBusy"
                            class="h-4 w-4 animate-spin"
                        />
                        <IconBadgeCheck v-else class="h-4 w-4" />
                        {{ t('pricing.nameCardBuy') }}
                    </button>
                    <button
                        v-else
                        class="btn btn-outline mt-3 w-full"
                        @click="goToLogin"
                    >
                        {{ t('pricing.signInToPurchase') }}
                    </button>
                </div>
            </article>

            <!-- Storage quota -->
            <article class="flex flex-col">
                <div class="flex items-center gap-2.5">
                    <span
                        class="h-2.5 w-2.5 shrink-0 rounded-full"
                        style="background-color: #a9dcd7"
                        aria-hidden="true"
                    />
                    <h3
                        class="text-base font-extrabold tracking-tight text-base-content"
                    >
                        {{ t('pricing.quotaTitle') }}
                    </h3>
                </div>
                <p class="mt-2 text-sm leading-5 text-base-content/65">
                    {{ t('pricing.quotaDesc') }}
                </p>
                <div class="mt-auto pt-6">
                    <p
                        v-if="quotaConfig"
                        class="text-sm font-semibold text-base-content/85"
                    >
                        {{ quotaConfig.pricePerGb }} {{ quotaConfig.currency }}/GB
                    </p>
                    <button
                        v-if="authStore.isAuthenticated"
                        class="btn btn-primary mt-3 w-full gap-2"
                        @click="openQuotaDialog"
                    >
                        <IconDatabase class="h-4 w-4" />
                        {{ t('pricing.quotaBuy') }}
                    </button>
                    <button
                        v-else
                        class="btn btn-outline mt-3 w-full"
                        @click="goToLogin"
                    >
                        {{ t('pricing.signInToPurchase') }}
                    </button>
                </div>
            </article>
        </div>

        <!-- Quota dialog -->
        <DialogRoot v-model:open="quotaDialogOpen">
            <DialogPortal>
                <Transition name="dialog-fade">
                    <DialogOverlay
                        v-if="quotaDialogOpen"
                        forceMount
                        class="fixed inset-0 z-50 bg-black/50"
                    />
                </Transition>
                <Transition name="dialog-pop">
                    <DialogContent
                        v-if="quotaDialogOpen"
                        forceMount
                        class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-box bg-base-100 p-6 shadow-sm"
                    >
                    <DialogTitle class="text-lg font-extrabold tracking-tight">
                        {{ t('pricing.quotaBuy') }}
                    </DialogTitle>
                    <p class="text-sm leading-5 text-base-content/60">
                        {{ t('pricing.quotaDialogDesc') }}
                    </p>
                    <div class="form-control">
                        <label
                            class="text-xs font-bold uppercase tracking-[0.12em] text-base-content/45"
                        >
                            {{ t('pricing.quotaGbLabel') }}
                        </label>
                        <input
                            v-model.number="quotaGb"
                            type="number"
                            class="input input-bordered mt-1.5 w-full"
                            :min="quotaConfig?.minGb ?? 1"
                            :max="quotaConfig?.maxGb ?? 1024"
                            step="1"
                        />
                        <p
                            v-if="quotaConfig"
                            class="mt-1.5 text-xs text-base-content/50"
                        >
                            {{ quotaGb }} GB × {{ quotaConfig.pricePerGb }}
                            {{ quotaConfig.currency }} =
                            {{ quotaTotal }} {{ quotaConfig.currency }}
                        </p>
                    </div>
                    <button
                        class="btn btn-primary w-full gap-2"
                        :disabled="quotaBusy || !quotaGbValid"
                        @click="confirmQuota"
                    >
                        <IconLoader
                            v-if="quotaBusy"
                            class="h-4 w-4 animate-spin"
                        />
                        <IconWallet v-else class="h-4 w-4" />
                        {{ quotaBusy ? t('pricing.payment.processing') : t('pricing.payment.payNow') }}
                    </button>
                    <p
                        v-if="quotaError"
                        class="text-sm leading-5 text-error"
                    >
                        {{ quotaError }}
                    </p>
                    </DialogContent>
                </Transition>
            </DialogPortal>
        </DialogRoot>

        <PaymentPinDialog
            v-model:open="pinOpen"
            :busy="pinBusy"
            :error="pinError"
            @confirm="confirmPinPay"
        />
    </section>
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
    createGoldsAfdianCheckout,
    createQuotaPurchaseOrder,
    fetchQuotaPurchaseConfig,
    fetchWalletPinStatus,
    fetchWallets,
    fetchWalletProductCatalog,
    orderNameChangeCard,
    payOrder,
    type Wallet,
    type WalletPinStatus,
} from "~/utils/api";
import { WalletOrderStatus } from "~/types/auth";
import {
    GOLDS_RESUPPLY_CATALOG_KEY,
    GOLDS_RESUPPLY_IDENTIFIER,
    NAME_CHANGE_CARD_PRICE,
    type QuotaPurchaseConfig,
} from "~/types/shop";

const { t } = useI18n();
const { notify } = useAlert();
const authStore = useAuthStore();
const { saveRedirect } = useAuthRedirect();
const route = useRoute();

// Golden Solar Points
const goldsBusy = ref(false);
const goldsPointsPerUnit = ref<number | null>(null);
const goldsCurrency = ref("golds");

// Name change card
const nameCardBusy = ref(false);

// Storage quota
const quotaConfig = ref<QuotaPurchaseConfig | null>(null);
const quotaDialogOpen = ref(false);
const quotaGb = ref(10);
const quotaBusy = ref(false);
const quotaError = ref("");

// Shared wallet-PIN purchase state
const pinOpen = ref(false);
const pinBusy = ref(false);
const pinError = ref("");
const pinWalletId = ref("");
const pendingPurchase = ref<"nameCard" | "quota" | null>(null);
const pendingQuotaGb = ref(10);

const quotaGbValid = computed(() => {
    if (!quotaConfig.value) return false;
    return (
        quotaGb.value >= quotaConfig.value.minGb &&
        quotaGb.value <= quotaConfig.value.maxGb
    );
});

const quotaTotal = computed(() =>
    quotaConfig.value
        ? Math.round(quotaGb.value * quotaConfig.value.pricePerGb * 100) / 100
        : 0,
);

onMounted(async () => {
    if (!authStore.isAuthenticated) return;
    const [catalog, config] = await Promise.all([
        fetchWalletProductCatalog().catch(() => []),
        fetchQuotaPurchaseConfig().catch(() => null),
    ]);
    const golds = catalog.find(
        (item) =>
            item.key === GOLDS_RESUPPLY_CATALOG_KEY ||
            item.identifier === GOLDS_RESUPPLY_IDENTIFIER,
    );
    if (golds) {
        goldsCurrency.value = golds.currency || "golds";
        const afdianOffer = golds.providerMappings["afdian"];
        const first = afdianOffer ? Object.values(afdianOffer)[0] : null;
        goldsPointsPerUnit.value = first ?? null;
    }
    quotaConfig.value = config;
});

function goToLogin() {
    saveRedirect(route.fullPath);
    navigateTo("/auth/login");
}

async function loadWalletContext(): Promise<{
    walletId: string;
    pinStatus: WalletPinStatus | null;
}> {
    const [all, ps] = await Promise.all([
        fetchWallets().catch(() => [] as Wallet[]),
        fetchWalletPinStatus().catch(() => null),
    ]);
    return {
        walletId: all.find((w) => w.isPrimary)?.id || all[0]?.id || "",
        pinStatus: ps,
    };
}

async function buyGolds() {
    if (!authStore.isAuthenticated) return goToLogin();
    goldsBusy.value = true;
    try {
        const checkout = await createGoldsAfdianCheckout();
        window.open(checkout.checkoutUrl, "_blank", "noopener,noreferrer");
        await notify(t("pricing.payment.afdianHint"));
    } catch (e: any) {
        await notify(e?.message || t("pricing.payment.checkoutFailed"));
    } finally {
        goldsBusy.value = false;
    }
}

async function buyNameCard() {
    if (!authStore.isAuthenticated) return goToLogin();
    nameCardBusy.value = true;
    try {
        const { walletId, pinStatus } = await loadWalletContext();
        if (pinStatus?.validationRequired) {
            pinWalletId.value = walletId;
            pendingPurchase.value = "nameCard";
            pinError.value = "";
            pinOpen.value = true;
            return;
        }
        await payNameCard(walletId, "");
    } finally {
        nameCardBusy.value = false;
    }
}

async function payNameCard(walletId: string, pin: string) {
    const created = await orderNameChangeCard();
    const paid = await payOrder(created.orderId, pin, walletId || undefined);
    if (
        paid.status !== WalletOrderStatus.Paid &&
        paid.status !== WalletOrderStatus.Finished
    ) {
        throw new Error(t("pricing.payment.checkoutFailed"));
    }
    await notify(t("pricing.nameCardPurchaseSuccess"));
}

async function openQuotaDialog() {
    if (!authStore.isAuthenticated) return goToLogin();
    quotaConfig.value ??= await fetchQuotaPurchaseConfig();
    if (!quotaConfig.value) {
        await notify(t("pricing.payment.checkoutFailed"));
        return;
    }
    quotaGb.value = quotaConfig.value.minGb;
    quotaError.value = "";
    quotaDialogOpen.value = true;
}

async function confirmQuota() {
    if (!quotaGbValid.value) return;
    quotaBusy.value = true;
    quotaError.value = "";
    try {
        const { walletId, pinStatus } = await loadWalletContext();
        if (pinStatus?.validationRequired) {
            pinWalletId.value = walletId;
            pendingPurchase.value = "quota";
            pendingQuotaGb.value = quotaGb.value;
            pinError.value = "";
            pinOpen.value = true;
            return;
        }
        await payQuota(walletId, "", quotaGb.value);
        quotaDialogOpen.value = false;
    } catch (e: any) {
        quotaError.value = e?.message || t("pricing.payment.checkoutFailed");
    } finally {
        quotaBusy.value = false;
    }
}

async function payQuota(walletId: string, pin: string, quantityGb: number) {
    const created = await createQuotaPurchaseOrder(quantityGb);
    const paid = await payOrder(created.orderId, pin, walletId || undefined);
    if (
        paid.status !== WalletOrderStatus.Paid &&
        paid.status !== WalletOrderStatus.Finished
    ) {
        throw new Error(t("pricing.payment.checkoutFailed"));
    }
    await notify(t("pricing.quotaPurchaseSuccess"));
}

async function confirmPinPay(pin: string) {
    if (!pendingPurchase.value) return;
    pinBusy.value = true;
    pinError.value = "";
    try {
        if (pendingPurchase.value === "nameCard") {
            await payNameCard(pinWalletId.value, pin);
            pinOpen.value = false;
        } else {
            await payQuota(pinWalletId.value, pin, pendingQuotaGb.value);
            pinOpen.value = false;
            quotaDialogOpen.value = false;
        }
    } catch (e: any) {
        pinError.value = e?.message || t("pricing.payment.checkoutFailed");
    } finally {
        pinBusy.value = false;
    }
}
</script>
