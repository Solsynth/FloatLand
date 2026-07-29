<template>
    <NuxtLayout name="minimal">
        <ConfuseSpinner
            v-if="orderStatus === 'pending'"
            message="Loading order..."
        />

        <template v-else-if="order">
            <!-- Brand header -->
            <div class="flex items-center justify-between gap-2 mb-6 pt-2">
                <div class="w-20" />
                <div class="flex items-center gap-2">
                    <img src="/favicon.png" class="w-8 h-8" />
                    <span class="text-xl font-black tracking-tight">Solarpay</span>
                </div>
                <DialogRoot v-model:open="showAppLinkDialog">
                    <DialogTrigger class="btn btn-ghost btn-xs text-base-content/50 gap-1">
                        <IconExternalLink class="w-3 h-3" />
                        Open
                    </DialogTrigger>
                    <DialogPortal>
                        <DialogOverlay class="fixed inset-0 bg-black/50 z-50" />
                        <DialogContent class="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-box bg-base-100 p-6 shadow-sm">
                            <DialogTitle class="text-lg font-bold">Open in App</DialogTitle>
                            <DialogDescription class="text-sm text-base-content/50 text-center">
                                Scan the QR code or tap below to open in the Solar Network app.
                            </DialogDescription>
                            <img
                                :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appDeepLink)}`"
                                alt="QR Code"
                                class="h-48 w-48 rounded-box"
                            />
                            <a
                                :href="appDeepLink"
                                class="btn btn-primary w-full gap-2"
                            >
                                <IconExternalLink class="w-4 h-4" />
                                Open in App
                            </a>
                            <DialogClose class="btn btn-ghost btn-sm w-full">
                                Close
                            </DialogClose>
                        </DialogContent>
                    </DialogPortal>
                </DialogRoot>
            </div>

            <!-- Error alert -->
            <div v-if="payError" class="alert alert-error mb-4 shadow-md">
                <IconAlertTriangle class="w-5 h-5 shrink-0" />
                <span>{{ payError }}</span>
                <button
                    class="btn btn-ghost btn-xs btn-square"
                    @click="payError = ''"
                >
                    <IconX class="w-4 h-4" />
                </button>
            </div>

            <!-- Success banner -->
            <div v-if="isPaid" class="alert alert-success mb-4 shadow-md">
                <IconCheck class="w-5 h-5 shrink-0" />
                <div>
                    <span class="font-bold">Payment Successful</span>
                    <p v-if="order.transactionId" class="text-sm opacity-80">
                        Txn: {{ order.transactionId.slice(0, 16) }}…
                    </p>
                </div>
            </div>

            <!-- Merchant header -->
            <div
                class="card bg-base-100 shadow-md mb-4 overflow-hidden relative"
            >
                <!-- Full-width background banner (blurred) -->
                <div
                    v-if="merchantBgUrl"
                    class="absolute inset-0 -z-10 bg-cover bg-center opacity-30 scale-110"
                    :style="`background-image: url('${merchantBgUrl}')`"
                />
                <div
                    class="absolute inset-0 -z-10 bg-base-100"
                />
                <div class="card-body p-5">
                    <!-- Publisher info (default) -->
                    <div v-if="!showAppInfo" class="flex items-center gap-4">
                        <div
                            class="w-14 h-14 rounded-full bg-base-200 overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-base-100"
                        >
                            <img
                                v-if="merchantIconUrl"
                                :src="merchantIconUrl"
                                :alt="merchantName"
                                class="w-full h-full object-cover"
                            />
                            <IconBuilding
                                v-else
                                class="w-7 h-7 text-base-content/30"
                            />
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                                <h1 class="text-lg font-bold truncate">
                                    {{ merchantName }}
                                </h1>
                                <IconShieldCheck
                                    v-if="merchantVerified"
                                    class="w-4 h-4 text-primary shrink-0"
                                />
                                <span
                                    v-if="merchantHandle"
                                    class="text-xs text-base-content/40 shrink-0"
                                >
                                    @{{ merchantHandle }}
                                </span>
                            </div>
                            <p
                                v-if="merchantDescription"
                                class="text-sm text-base-content/50 truncate mt-0.5"
                            >
                                {{ merchantDescription }}
                            </p>
                        </div>
                        <div
                            class="badge badge-lg shrink-0"
                            :class="statusBadgeClass"
                        >
                            {{ statusLabel }}
                        </div>
                    </div>

                    <!-- App info (toggled) -->
                    <div v-else class="flex items-center gap-4">
                        <div
                            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-box bg-base-200 ring-2 ring-base-100"
                        >
                            <img
                                v-if="appIconUrl"
                                :src="appIconUrl"
                                :alt="order.app?.name"
                                class="w-full h-full object-cover"
                            />
                            <IconApps
                                v-else
                                class="w-7 h-7 text-base-content/30"
                            />
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                                <h1 class="text-lg font-bold truncate">
                                    {{ order.app?.name || "App" }}
                                </h1>
                                <IconShieldCheck
                                    v-if="order.app?.verified"
                                    class="w-4 h-4 text-primary shrink-0"
                                />
                            </div>
                            <p
                                v-if="order.app?.description"
                                class="text-sm text-base-content/50 truncate mt-0.5"
                            >
                                {{ order.app.description }}
                            </p>
                        </div>
                        <div
                            class="badge badge-lg shrink-0"
                            :class="statusBadgeClass"
                        >
                            {{ statusLabel }}
                        </div>
                    </div>

                    <!-- Toggle button -->
                    <button
                        class="btn btn-ghost btn-xs w-full mt-3 gap-1.5 text-base-content/50"
                        @click="showAppInfo = !showAppInfo"
                    >
                        {{
                            showAppInfo
                                ? 'Show Publisher'
                                : 'Show App'
                        }}
                    </button>
                </div>
            </div>

            <!-- Items card -->
            <div class="card bg-base-100 shadow-md mb-4">
                <div class="card-body p-5">
                    <!-- Order title -->
                    <div class="mb-4">
                        <h2 class="text-lg font-bold">
                            Order #{{ order.id.slice(0, 8) }}
                        </h2>
                    </div>

                    <h2
                        class="text-sm font-semibold text-base-content/50 uppercase tracking-wide mb-3"
                    >
                        Items
                    </h2>

                    <div class="space-y-3">
                        <div
                            v-for="(item, i) in order.items"
                            :key="i"
                            class="flex items-center justify-between gap-3"
                        >
                            <div class="flex items-center gap-3 min-w-0">
                                <!-- Product image or fallback icon -->
                                <div
                                    class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-box bg-base-200"
                                >
                                    <img
                                        v-if="findProduct(item)?.picture?.id"
                                        :src="
                                            getFileUrl(
                                                findProduct(item)!.picture!.id,
                                            )!
                                        "
                                        :alt="
                                            findProduct(item)?.displayName ||
                                            item.productIdentifier
                                        "
                                        class="w-full h-full object-cover"
                                    />
                                    <IconPackage
                                        v-else
                                        class="w-5 h-5 text-base-content/30"
                                    />
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-medium truncate">
                                        {{
                                            findProduct(item)?.displayName ||
                                            formatProductIdentifier(
                                                item.productIdentifier,
                                            )
                                        }}
                                    </p>
                                    <p
                                        v-if="findProduct(item)?.description"
                                        class="text-xs text-base-content/40 truncate"
                                    >
                                        {{ findProduct(item).description }}
                                    </p>
                                    <p class="text-xs text-base-content/40">
                                        {{ item.quantity }} ×
                                        {{ item.currency }}
                                        {{ formatAmount(item.unitPrice) }}
                                    </p>
                                </div>
                            </div>
                            <span class="text-sm font-bold shrink-0">
                                {{ item.currency }}
                                {{
                                    formatAmount(item.unitPrice * item.quantity)
                                }}
                            </span>
                        </div>
                    </div>

                    <!-- Total -->
                    <div
                        class="mt-4 flex items-center justify-between rounded-box bg-base-200 px-3 py-3"
                    >
                        <span class="font-semibold text-sm">Total</span>
                        <span class="text-xl font-black">
                            {{ order.currency }}
                            {{ formatAmount(order.amount) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Order info (collapsible) -->
            <AccordionRoot
                type="single"
                collapsible
                class="card bg-base-100 shadow-md mb-4 overflow-hidden"
            >
                <AccordionItem value="details">
                    <AccordionHeader>
                        <AccordionTrigger
                            class="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-base-content/50 uppercase tracking-wide hover:bg-base-200/50 transition-colors"
                        >
                            <span>Details</span>
                            <IconChevronDown
                                class="w-4 h-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
                            />
                        </AccordionTrigger>
                    </AccordionHeader>
                    <AccordionContent class="px-5 pb-5">
                        <div class="space-y-3">
                            <!-- Order ID -->
                            <div
                                class="flex items-center justify-between gap-2"
                            >
                                <span class="text-xs text-base-content/40"
                                    >Order ID</span
                                >
                                <div class="flex items-center gap-1.5 min-w-0">
                                    <span
                                        class="text-xs font-mono text-base-content/60 truncate max-w-[180px]"
                                    >
                                        {{ order.id }}
                                    </span>
                                    <button
                                        class="btn btn-ghost btn-xs btn-square opacity-60 hover:opacity-100"
                                        @click="copyId"
                                    >
                                        <IconCopy class="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <!-- Created at -->
                            <div
                                v-if="order.createdAt"
                                class="flex items-center justify-between"
                            >
                                <span class="text-xs text-base-content/40"
                                    >Created</span
                                >
                                <span class="text-xs text-base-content/60">
                                    {{ formatDate(order.createdAt) }}
                                </span>
                            </div>

                            <!-- Expiry -->
                            <div
                                v-if="
                                    order.expiredAt &&
                                    !isPaid &&
                                    !isFinished &&
                                    !isCancelled
                                "
                                class="flex items-center justify-between"
                            >
                                <span class="text-xs text-base-content/40"
                                    >Expires</span
                                >
                                <span
                                    class="text-xs"
                                    :class="
                                        isExpiringSoon
                                            ? 'text-warning font-semibold'
                                            : 'text-base-content/60'
                                    "
                                >
                                    {{ formatDate(order.expiredAt) }}
                                </span>
                            </div>

                            <!-- Transaction -->
                            <div
                                v-if="order.transactionId"
                                class="flex items-center justify-between gap-2"
                            >
                                <span class="text-xs text-base-content/40"
                                    >Transaction</span
                                >
                                <span
                                    class="text-xs font-mono text-base-content/60 truncate max-w-[180px]"
                                >
                                    {{ order.transactionId }}
                                </span>
                            </div>

                            <!-- Remarks -->
                            <p
                                v-if="order.remarks"
                                class="text-sm text-base-content/50 italic pt-1"
                            >
                                "{{ order.remarks }}"
                            </p>

                            <!-- Cancelled / Expired note -->
                            <div
                                v-if="isCancelled"
                                class="alert alert-error alert-outline py-2 px-3 text-xs"
                            >
                                This order has been cancelled.
                            </div>
                            <div
                                v-else-if="isExpired && !isPaid"
                                class="alert alert-warning alert-outline py-2 px-3 text-xs"
                            >
                                This order has expired.
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </AccordionRoot>

            <!-- Payment card (unpaid only) -->
            <div
                v-if="order.status === WalletOrderStatus.Unpaid && !isExpired"
                class="card bg-base-100 shadow-md"
            >
                <div class="card-body p-5 space-y-4">
                    <!-- Wallet selector -->
                    <div v-if="wallets.length > 1" class="form-control">
                        <label class="label py-1">
                            <span
                                class="label-text text-xs text-base-content/50"
                                >Pay from wallet</span
                            >
                        </label>
                        <select
                            v-model="selectedWalletId"
                            class="select select-bordered select-sm w-full"
                        >
                            <option
                                v-for="w in wallets"
                                :key="w.id"
                                :value="w.id"
                            >
                                {{ w.name || "Wallet" }} ({{
                                    getWalletBalance(w)
                                }})
                            </option>
                        </select>
                    </div>

                    <!-- Confirm button -->
                    <button
                        class="btn btn-primary w-full gap-2"
                        :disabled="paying"
                        @click="
                            pinStatus?.validationRequired
                                ? (showPinDialog = true)
                                : handlePay()
                        "
                    >
                        <IconLoader
                            v-if="paying"
                            class="w-4 h-4 animate-spin"
                        />
                        <IconWallet v-else class="w-4 h-4" />
                        {{ paying ? "Processing…" : "Pay Now" }}
                    </button>

                    <!-- PIN indicator -->
                    <p
                        v-if="pinStatus?.validationRequired"
                        class="flex items-center justify-center gap-1.5 text-xs text-base-content/40"
                    >
                        <IconLock class="w-3 h-3" />
                        PIN enabled to confirm payment
                    </p>
                </div>
            </div>

            <!-- PIN Dialog -->
            <DialogRoot
                v-model:open="showPinDialog"
                @update:open="onPinDialogOpenChange"
            >
                <DialogPortal>
                    <DialogOverlay class="fixed inset-0 bg-black/50 z-50" />
                    <DialogContent
                        class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-5 rounded-box bg-base-100 p-6 shadow-sm"
                    >
                        <DialogTitle class="text-center font-bold text-lg">
                            Enter PIN
                        </DialogTitle>
                        <p class="text-center text-sm text-base-content/50">
                            Enter your 6-digit PIN to confirm this payment
                        </p>
                        <PinInputRoot
                            v-model="pinDigits"
                            class="pin-input-root"
                            otp
                            type="number"
                        >
                            <PinInputInput
                                v-for="(_, i) in 6"
                                :key="i"
                                :index="i"
                                class="w-12 h-14 rounded-xl border border-base-content/20 bg-base-100 text-center text-xl font-bold text-base-content outline-none transition-colors focus:border-primary focus:bg-primary/5"
                            />
                        </PinInputRoot>
                        <p
                            v-if="payError"
                            class="text-xs text-error text-center"
                        >
                            {{ payError }}
                        </p>
                        <div class="flex gap-3">
                            <DialogClose as-child>
                                <button
                                    class="btn btn-ghost flex-1"
                                    :disabled="paying"
                                >
                                    Cancel
                                </button>
                            </DialogClose>
                            <button
                                class="btn btn-primary flex-1 gap-2"
                                :disabled="pinCode.length < 6 || paying"
                                @click="handlePay"
                            >
                                <IconLoader
                                    v-if="paying"
                                    class="w-4 h-4 animate-spin"
                                />
                                <template v-else>Pay</template>
                            </button>
                        </div>
                    </DialogContent>
                </DialogPortal>
            </DialogRoot>
        </template>

        <div v-else class="card bg-base-100 shadow-md mt-6">
            <div class="card-body items-center text-center gap-3 p-8">
                <IconAlertTriangle class="w-10 h-10 text-warning/50" />
                <p class="text-sm text-base-content/60">Order not found</p>
                <NuxtLink to="/" class="btn btn-ghost btn-sm">Go Home</NuxtLink>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import {
    getOrder,
    payOrder,
    fetchWallets,
    fetchPublisher,
    fetchStoreProducts,
    fetchWalletPinStatus,
} from "~/utils/api";
import type {
    Wallet,
    WalletOrder,
    AppProduct,
    WalletPinStatus,
} from "~/utils/api";
import { WalletOrderStatus } from "~/types/auth";
import { getFileUrl } from "~/utils/files";
import {
    PinInputInput,
    PinInputRoot,
    AccordionContent,
    AccordionHeader,
    AccordionItem,
    AccordionRoot,
    AccordionTrigger,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
} from "reka-ui";

defineOgImage("UniOgImage", {
    title: "Order Payment",
    description: "Pay your order on Solar Network.",
});
useSolarSeo({
    title: "Order Payment",
    description: "Pay your order on Solar Network.",
});

const route = useRoute();
const orderId = computed(() => route.params.id as string);
const appDeepLink = computed(() => `solian:/${route.fullPath}`);
const showAppLinkDialog = ref(false);

const paying = ref(false);
const pinDigits = ref<string[]>([]);
const payError = ref("");
const selectedWalletId = ref("");
const wallets = ref<Wallet[]>([]);
const pinStatus = ref<WalletPinStatus | null>(null);
const showPinDialog = ref(false);
const showAppInfo = ref(false);

const { data: order, status: orderStatus } = await useAsyncData(
    () => `order-${orderId.value}`,
    () => getOrder(orderId.value),
    { watch: [orderId], default: () => null },
);

const publisher = ref<Publisher | null>(null);
const products = ref<AppProduct[]>([]);

watch(
    order,
    async (ord) => {
        if (!ord) {
            publisher.value = null;
            products.value = [];
            return;
        }
        const [pub, prods] = await Promise.all([
            ord.developer?.publisherName
                ? fetchPublisher(ord.developer.publisherName).catch(() => null)
                : Promise.resolve(null),
            ord.app?.slug
                ? fetchStoreProducts(ord.app.slug).catch(() => [])
                : Promise.resolve([]),
        ]);
        publisher.value = pub;
        products.value = prods;
    },
    { immediate: true },
);

// Load wallets + pin status in parallel
onMounted(async () => {
    try {
        const [all, ps] = await Promise.all([
            fetchWallets(),
            fetchWalletPinStatus().catch(() => null),
        ]);
        wallets.value = all;
        if (all.length)
            selectedWalletId.value =
                all.find((w) => w.isPrimary)?.id || all[0].id;
        pinStatus.value = ps;
    } catch {
        /* user may not have wallet yet */
    }
});

// --- Computed helpers ---

const isPaid = computed(() => order.value?.status === WalletOrderStatus.Paid);
const isFinished = computed(
    () => order.value?.status === WalletOrderStatus.Finished,
);
const isCancelled = computed(
    () => order.value?.status === WalletOrderStatus.Cancelled,
);

function parseTimestamp(
    value: string | { seconds?: number; nanos?: number } | null | undefined,
): number {
    if (!value) return 0;
    if (typeof value === "object" && value.seconds != null) {
        return value.seconds * 1000;
    }
    return new Date(value as string).getTime();
}

const isExpired = computed(() => {
    if (!order.value?.expiredAt) return false;
    if (isPaid.value || isFinished.value) return false;
    return parseTimestamp(order.value.expiredAt) < Date.now();
});

const isExpiringSoon = computed(() => {
    if (!order.value?.expiredAt) return false;
    const exp = parseTimestamp(order.value.expiredAt);
    const now = Date.now();
    return exp > now && exp - now < 30 * 60 * 1000; // less than 30 min
});

const merchantIconUrl = computed(() => {
    // Use publisher picture if available, fall back to order app icon
    if (publisher.value?.picture?.id) {
        return getFileUrl(publisher.value.picture.id);
    }
    return null;
});

const appIconUrl = computed(() => {
    if (order.value?.app?.picture?.id) {
        return getFileUrl(order.value.app.picture.id);
    }
    return null;
});

const merchantBgUrl = computed(() => {
    // Use publisher background first, fall back to app background
    if (publisher.value?.background?.id) {
        return getFileUrl(publisher.value.background.id);
    }
    if (order.value?.app?.background?.id) {
        return getFileUrl(order.value.app.background.id);
    }
    return null;
});

const merchantName = computed(() => {
    if (publisher.value?.nick) return publisher.value.nick;
    if (publisher.value?.name) return publisher.value.name;
    return order.value?.app?.name || "Store";
});

const merchantHandle = computed(() => {
    return publisher.value?.name || order.value?.developer?.publisherName || "";
});

const merchantDescription = computed(() => {
    if (publisher.value?.bio && publisher.value.bio.trim()) {
        return publisher.value.bio.split("\n")[0];
    }
    return order.value?.app?.description || "";
});

const merchantVerified = computed(() => {
    return publisher.value?.verification || null;
});

// Build a map from product identifier → AppProduct for lookup
const productMap = computed(() => {
    const map = new Map<string, AppProduct>();
    for (const p of products.value) {
        map.set(p.identifier, p);
    }
    return map;
});

function findProduct(
    item: WalletOrder["items"][number],
): AppProduct | undefined {
    // SKU format: <developer>.<slug>.<identifier>
    const sku = item.productIdentifier;
    const parts = sku.split(".");
    const identifier = parts[parts.length - 1];
    return productMap.value.get(identifier);
}

const statusLabel = computed(() => {
    const map: Record<number, string> = {
        [WalletOrderStatus.Unpaid]: "Unpaid",
        [WalletOrderStatus.Paid]: "Paid",
        [WalletOrderStatus.Finished]: "Finished",
        [WalletOrderStatus.Cancelled]: "Cancelled",
        [WalletOrderStatus.Expired]: "Expired",
    };
    return map[order.value?.status ?? -1] || "Unknown";
});

const statusBadgeClass = computed(() => {
    const map: Record<number, string> = {
        [WalletOrderStatus.Unpaid]: "badge-warning",
        [WalletOrderStatus.Paid]: "badge-success",
        [WalletOrderStatus.Finished]: "badge-info",
        [WalletOrderStatus.Cancelled]: "badge-error",
        [WalletOrderStatus.Expired]: "badge-neutral",
    };
    return map[order.value?.status ?? -1] || "badge-ghost";
});

const pinCode = computed(() => pinDigits.value.join(""));

// --- Helper functions ---

function formatAmount(n: number): string {
    return n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(
    value: string | { seconds?: number; nanos?: number } | null | undefined,
): string {
    if (!value) return "";
    // Handle { seconds, nanos } timestamp objects from API
    if (typeof value === "object" && value.seconds != null) {
        return new Date(value.seconds * 1000).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    return new Date(value as string).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatProductIdentifier(id: string): string {
    // e.g. "littlesheep.goatshed.donation" → "Donation"
    const parts = id.split(".");
    const last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
}

function getWalletBalance(w: Wallet): string {
    const p = w.pockets?.find((p) => p.currency === order.value?.currency);
    return p
        ? `${p.currency} ${formatAmount(p.availableAmount ?? p.amount)}`
        : "";
}

function copyId() {
    if (order.value) navigator.clipboard.writeText(order.value.id);
}

async function handlePay() {
    if (!order.value || pinCode.value.length < 6) return;
    paying.value = true;
    payError.value = "";
    try {
        const updated = await payOrder(
            order.value.id,
            pinCode.value,
            selectedWalletId.value || undefined,
        );
        order.value = updated;
        pinDigits.value = [];
        showPinDialog.value = false;
    } catch (e: any) {
        payError.value = e?.message || "Payment failed. Please try again.";
    } finally {
        paying.value = false;
    }
}

function onPinDialogOpenChange(open: boolean) {
    if (!open) {
        payError.value = "";
        pinDigits.value = [];
    }
}
</script>

<style scoped>
.pin-input-root {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.pin-input-box {
    width: 3rem;
    height: 3.5rem;
    border-radius: 0.75rem;
    border: 2px solid oklch(var(--bc) / 0.2);
    background: oklch(var(--b1));
    font-size: 1.5rem;
    font-weight: 700;
    color: oklch(var(--bc));
    text-align: center;
    transition:
        border-color 0.15s,
        background-color 0.15s;
}

.pin-input-box:focus {
    outline: none;
    border-color: oklch(var(--p));
    background: oklch(var(--p) / 0.05);
}

/* Accordion content animation */
:deep([data-reka-accordion-content]) {
    overflow: hidden;
}
:deep([data-reka-accordion-content][data-state="open"]) {
    animation: accordionSlideDown 200ms ease-out;
}
:deep([data-reka-accordion-content][data-state="closed"]) {
    animation: accordionSlideUp 200ms ease-out;
}

@keyframes accordionSlideDown {
    from {
        height: 0;
    }
    to {
        height: var(--reka-accordion-content-height);
    }
}

@keyframes accordionSlideUp {
    from {
        height: var(--reka-accordion-content-height);
    }
    to {
        height: 0;
    }
}
</style>
