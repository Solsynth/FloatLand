<template>
    <NuxtLayout name="app">
        <div class="pricing-page mx-auto w-full max-w-5xl pb-20 md:pb-28">
            <!-- Header -->
            <header class="pricing-header pt-10 md:pt-16">
                <div class="flex items-center gap-2">
                    <IconSparkles class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <p
                        class="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-base-content/55"
                    >
                        {{ t('pricing.stellarProgram') }}
                    </p>
                </div>
                <div
                    class="mt-5 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
                >
                    <div class="max-w-2xl">
                        <h1
                            class="text-3xl font-extrabold tracking-tight text-base-content md:text-[2.5rem] md:leading-[1.08]"
                        >
                            {{ t('pricing.membershipTiers') }}
                        </h1>
                        <p
                            class="mt-3 text-sm leading-6 text-base-content/70 md:text-base"
                        >
                            {{ t('pricing.description') }}
                        </p>
                        <p
                            class="mt-4 text-xs leading-5 text-base-content/50"
                        >
                            {{ t('pricing.billingNote') }}
                        </p>
                    </div>
                    <img
                        src="/images/store/stellar-program.webp"
                        alt="Stellar Program"
                        width="1024"
                        height="1024"
                        class="h-44 w-44 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-base-300/70 lg:h-52 lg:w-52"
                    />
                </div>
            </header>

            <!-- Tier columns -->
            <div class="grid gap-12 pt-12 md:pt-14 xl:grid-cols-3 xl:gap-10">
                <article
                    v-for="(tier, index) in tiers"
                    :key="tier.key"
                    class="flex flex-col"
                    :style="{ '--tier-color': tier.tierColor }"
                >
                    <p
                        class="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-base-content/50"
                    >
                        {{ tier.tagline }}
                    </p>
                    <div class="mt-2 flex items-center gap-2.5">
                        <h2
                            class="text-2xl font-extrabold tracking-tight text-base-content"
                        >
                            {{ tier.name }}
                        </h2>
                        <span
                            v-if="tier.isCurrent"
                            class="current-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em]"
                        >
                            {{ t('pricing.currentPlan') }}
                        </span>
                    </div>

                    <p
                        class="tier-name"
                        :class="tier.nameClass"
                        :style="{ animationDelay: `${120 + index * 140}ms` }"
                    >
                        @{{ t('pricing.previewName') }}
                    </p>

                    <p class="mt-5 text-sm leading-6 text-base-content/70">
                        {{ tier.description }}
                    </p>

                    <dl
                        class="mt-7 divide-y divide-base-300/70 border-y border-base-300/70"
                    >
                        <div class="flex items-baseline justify-between gap-4 py-2.5">
                            <dt
                                class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-base-content/45"
                            >
                                {{ t('pricing.storage') }}
                            </dt>
                            <dd class="text-sm font-semibold text-base-content/85">
                                {{ tier.storage }}
                            </dd>
                        </div>
                        <div class="flex items-baseline justify-between gap-4 py-2.5">
                            <dt
                                class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-base-content/45"
                            >
                                {{ t('pricing.progression') }}
                            </dt>
                            <dd class="text-sm font-semibold text-base-content/85">
                                {{ tier.levelBoost }}
                            </dd>
                        </div>
                        <div class="flex items-baseline justify-between gap-4 py-2.5">
                            <dt
                                class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-base-content/45"
                            >
                                {{ t('pricing.usernameStyle') }}
                            </dt>
                            <dd class="text-sm font-semibold text-base-content/85">
                                {{ tier.usernameStyle }}
                            </dd>
                        </div>
                    </dl>

                    <ul class="mt-6 space-y-2.5">
                        <li
                            v-for="feature in tier.features"
                            :key="feature"
                            class="flex items-start gap-2.5 text-sm leading-5 text-base-content/80"
                        >
                            <IconBadgeCheck
                                class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/75"
                                aria-hidden="true"
                            />
                            <span>{{ feature }}</span>
                        </li>
                    </ul>

                    <div class="mt-auto pt-8">
                        <div
                            v-if="tier.catalogItem"
                            class="flex items-baseline gap-1.5"
                        >
                            <span
                                class="text-xl font-extrabold tracking-tight text-base-content"
                            >
                                {{ tier.catalogItem.basePrice }}
                                {{ tier.catalogItem.currency }}
                            </span>
                            <span
                                class="text-xs font-semibold text-base-content/50"
                            >
                                /mo
                            </span>
                        </div>
                        <div class="mt-3 flex flex-col gap-2">
                            <button
                                v-if="authStore.isAuthenticated && tier.catalogItem"
                                class="btn btn-primary w-full"
                                @click="openPurchase(tier)"
                            >
                                {{ t('pricing.choose', { name: tier.name }) }}
                            </button>
                            <button
                                v-else-if="authStore.isAuthenticated"
                                class="btn btn-outline w-full"
                                disabled
                            >
                                {{ t('pricing.choose', { name: tier.name }) }}
                            </button>
                            <button
                                v-else
                                class="btn btn-outline w-full"
                                @click="goToLogin"
                            >
                                {{ t('pricing.signInToPurchase') }}
                            </button>
                            <button
                                v-if="
                                    tier.isCurrent &&
                                    activeSubscription?.paymentMethod ===
                                        'solian.wallet'
                                "
                                class="mt-1 text-xs font-semibold text-error/80 transition-colors hover:text-error"
                                @click="cancelMembership"
                            >
                                {{ t('pricing.cancelMembership') }}
                            </button>
                        </div>
                    </div>
                </article>
            </div>

            <!-- Comparison table -->
            <section
                class="mt-16 border-t border-base-300/70 pt-10 md:mt-20 md:pt-12"
            >
                <div
                    class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
                >
                    <div>
                        <h2
                            class="text-xl font-extrabold tracking-tight text-base-content md:text-2xl"
                        >
                            {{ t('pricing.compareTitle') }}
                        </h2>
                        <p class="mt-1.5 text-sm text-base-content/65">
                            {{ t('pricing.compareDesc') }}
                        </p>
                    </div>
                    <p
                        class="text-xs leading-5 text-base-content/50 md:max-w-64 md:pb-1 md:text-right"
                    >
                        {{ t('pricing.compareNote') }}
                    </p>
                </div>

                <div class="mt-6 overflow-x-auto">
                    <table class="w-full border-collapse text-left">
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    class="w-1/4 py-3 pr-4 align-bottom"
                                >
                                    <span
                                        class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-base-content/45"
                                    >
                                        {{ t('pricing.benefit') }}
                                    </span>
                                </th>
                                <th
                                    v-for="tier in tiers"
                                    :key="tier.key"
                                    scope="col"
                                    class="py-3 pr-4 align-bottom last:pr-0"
                                >
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="h-2 w-2 shrink-0 rounded-full"
                                            :style="{
                                                backgroundColor:
                                                    tier.tierColor ||
                                                    'var(--color-primary)',
                                            }"
                                            aria-hidden="true"
                                        />
                                        <span
                                            class="text-sm font-bold tracking-tight text-base-content"
                                        >
                                            {{ tier.name }}
                                        </span>
                                        <span
                                            v-if="tier.isCurrent"
                                            class="text-[0.625rem] font-bold uppercase tracking-[0.1em]"
                                            :style="{
                                                color:
                                                    tier.tierColor ||
                                                    'var(--color-primary)',
                                            }"
                                        >
                                            {{ t('pricing.currentPlan') }}
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <template
                                v-for="group in comparisonGroups"
                                :key="group.key"
                            >
                                <tr>
                                    <th
                                        scope="colgroup"
                                        colspan="4"
                                        class="pt-6 pb-2 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-base-content/45"
                                    >
                                        {{ t(`pricing.compareGroups.${group.key}`) }}
                                    </th>
                                </tr>
                                <tr
                                    v-for="rowKey in group.rows"
                                    :key="rowKey"
                                    class="border-t border-base-300/70"
                                >
                                    <th
                                        scope="row"
                                        class="py-3 pr-4 align-top text-sm font-semibold text-base-content/90"
                                    >
                                        {{ comparisonRows[rowKey].label }}
                                    </th>
                                    <td
                                        v-for="(value, index) in comparisonRows[rowKey].values"
                                        :key="index"
                                        class="whitespace-pre-line py-3 pr-4 align-top text-sm leading-5 text-base-content/70 last:pr-0"
                                        :class="{
                                            'compare-muted':
                                                value === t('pricing.same') ||
                                                value === t('pricing.notIncluded'),
                                        }"
                                    >
                                        <span
                                            v-if="
                                                comparisonRows[rowKey].kind ===
                                                'color'
                                            "
                                            class="mr-1.5 inline-block h-2.5 rounded-full align-[-1px]"
                                            :class="index === 2 ? 'w-5' : 'w-2.5'"
                                            :style="colorSwatchStyle(index)"
                                            aria-hidden="true"
                                        />
                                        {{ value }}
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Free storage by level -->
            <section class="mt-14 border-t border-base-300/70 pt-10 md:mt-16 md:pt-12">
                <h2
                    class="text-xl font-extrabold tracking-tight text-base-content md:text-2xl"
                >
                    {{ t('pricing.levelQuota.title') }}
                </h2>
                <p class="mt-1.5 max-w-xl text-sm text-base-content/65">
                    {{ t('pricing.levelQuota.desc') }}
                </p>
                <ol class="mt-8 grid gap-10 sm:grid-cols-3">
                    <li
                        v-for="step in levelQuotaSteps"
                        :key="step.level"
                        class="flex flex-col gap-1.5"
                    >
                        <span
                            class="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-base-content/45"
                        >
                            {{ step.level }}
                        </span>
                        <span
                            class="text-2xl font-extrabold tracking-tight text-base-content"
                        >
                            {{ step.quota }}
                        </span>
                    </li>
                </ol>
            </section>

            <ShopExtras />

            <StellarPurchaseSheet
                v-model:open="purchaseOpen"
                :tier="purchaseTier"
                :current-membership="activeSubscription"
                @purchased="onPurchased"
            />
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { IconBadgeCheck, IconSparkles } from "#components";
import {
    cancelStellarSubscription,
    fetchActiveStellarSubscription,
    fetchSubscriptionGroup,
} from "~/utils/api";
import {
    STELLAR_TIER_IDENTIFIERS,
    type StellarSubscription,
    type SubscriptionCatalogItem,
} from "~/types/subscription";

interface Tier {
    key: string;
    name: string;
    tagline: string;
    description: string;
    storage: string;
    levelBoost: string;
    usernameStyle: string;
    features: string[];
    catalogItem: SubscriptionCatalogItem | null;
    isCurrent: boolean;
    /** Hex accent color from the backend catalog, e.g. "#9C7DF2". */
    tierColor: string | null;
    /** Username preview styling: muted solid / vivid solid / gradient. */
    nameClass: "tier-name--stellar" | "tier-name--nova" | "tier-name--color";
}

interface ComparisonRow {
    label: string;
    /** "color" rows render a swatch that visualizes the tier's username styling. */
    kind: "color" | null;
    values: [string, string, string];
}

interface TierDef {
    key: "stellar" | "nova" | "supernova";
    featureKeys: string[];
}

const tierDefs: TierDef[] = [
    { key: "stellar", featureKeys: ["f0", "f1", "f2", "f3", "f4", "f5"] },
    { key: "nova", featureKeys: ["f0", "f1", "f2", "f3", "f4", "f5", "f6"] },
    { key: "supernova", featureKeys: ["f0", "f1", "f2", "f3", "f4", "f5", "f6"] },
];

const comparisonGroups = [
    { key: "identity", rows: ["usernameColor", "verification"] },
    { key: "capacity", rows: ["storage", "publisherQuota", "realmQuota", "botQuota"] },
    { key: "experience", rows: ["levelingBoost", "translation"] },
] as const;

const levelQuotaStepKeys = ["lv0", "lv10", "lv120"] as const;

const { t } = useI18n();

const authStore = useAuthStore();
const { saveRedirect } = useAuthRedirect();
const { confirm, notify } = useAlert();
const route = useRoute();

// Live catalog + membership state (backend data; only reachable when signed in).
const catalogItems = ref<SubscriptionCatalogItem[]>([]);
const activeSubscription = ref<StellarSubscription | null>(null);
const purchaseOpen = ref(false);
const purchaseTier = ref<SubscriptionCatalogItem | null>(null);

const catalogByIdentifier = computed(
    () => new Map(catalogItems.value.map((item) => [item.identifier, item])),
);

onMounted(async () => {
    if (!authStore.isAuthenticated) return;
    await refreshSubscriptionState();
});

async function refreshSubscriptionState() {
    if (!authStore.isAuthenticated) return;
    const [group, active] = await Promise.all([
        fetchSubscriptionGroup(),
        fetchActiveStellarSubscription(),
    ]);
    catalogItems.value = group?.catalog.items ?? [];
    activeSubscription.value = group?.current?.subscription ?? active;
}

function openPurchase(tier: Tier) {
    if (!tier.catalogItem) return;
    purchaseTier.value = tier.catalogItem;
    purchaseOpen.value = true;
}

async function onPurchased() {
    // The order is processed server-side; give it a moment, then refresh.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await refreshSubscriptionState();
}

function goToLogin() {
    saveRedirect(route.fullPath);
    navigateTo("/auth/login");
}

async function cancelMembership() {
    if (!activeSubscription.value) return;
    const ok = await confirm(
        t("pricing.cancelMembershipTitle"),
        t("pricing.cancelMembershipDesc"),
        { confirmText: t("pricing.cancelMembership") },
    );
    if (!ok) return;
    try {
        await cancelStellarSubscription(activeSubscription.value.id);
        await notify(t("pricing.membershipCancelSuccess"));
        await refreshSubscriptionState();
    } catch (e: any) {
        await notify(e?.message || t("pricing.payment.checkoutFailed"));
    }
}

const tiers = computed<Tier[]>(() =>
    tierDefs.map((def) => {
        const identifier = STELLAR_TIER_IDENTIFIERS[def.key];
        const catalogItem = catalogByIdentifier.value.get(identifier) ?? null;
        return {
            key: def.key,
            name: t(`pricing.tiers.${def.key}.name`),
            tagline: t(`pricing.tiers.${def.key}.tagline`),
            description: t(`pricing.tiers.${def.key}.description`),
            storage: t(`pricing.tiers.${def.key}.storage`),
            levelBoost: t(`pricing.tiers.${def.key}.levelBoost`),
            usernameStyle: t(`pricing.tiers.${def.key}.usernameStyle`),
            features: def.featureKeys.map((k) => t(`pricing.tiers.${def.key}.features.${k}`)),
            catalogItem,
            isCurrent: activeSubscription.value?.identifier === identifier,
            tierColor: catalogItem?.displayConfig?.color ?? null,
            nameClass:
                def.key === "stellar"
                    ? "tier-name--stellar"
                    : def.key === "nova"
                      ? "tier-name--nova"
                      : "tier-name--color",
        };
    }),
);

const comparisonRows = computed<Record<string, ComparisonRow>>(() => {
    const map: Record<string, ComparisonRow> = {};
    for (const group of comparisonGroups) {
        for (const key of group.rows) {
            map[key] = {
                label: t(`pricing.compare.${key}.label`),
                kind: key === "usernameColor" ? "color" : null,
                values: [
                    t(`pricing.compare.${key}.stellar`),
                    t(`pricing.compare.${key}.nova`),
                    t(`pricing.compare.${key}.supernova`),
                ] as [string, string, string],
            };
        }
    }
    return map;
});

/** Swatch for the username-color comparison row, per tier column. */
function colorSwatchStyle(index: number): Record<string, string> {
    const color = tiers.value[index]?.tierColor || "var(--color-primary)";
    if (index === 2) {
        // Supernova: unlimited + gradient usernames.
        return {
            backgroundImage: `linear-gradient(90deg, ${color}, var(--pricing-gold))`,
        };
    }
    if (index === 0) {
        // Stellar: limited palette — muted.
        return {
            backgroundColor: `color-mix(in oklch, ${color} 45%, var(--color-base-content))`,
        };
    }
    // Nova: unlimited colors — full strength.
    return { backgroundColor: color };
}

const levelQuotaSteps = computed<Array<{ level: string; quota: string }>>(() =>
    levelQuotaStepKeys.map((key) => ({
        level: t(`pricing.levelQuota.steps.${key}.level`),
        quota: t(`pricing.levelQuota.steps.${key}.quota`),
    })),
);

defineOgImage('UniOgImage', { title: t('pricing.seoTitle'), description: t('pricing.seoDescription') })

useSolarSeo({
    title: t('pricing.seoTitle'),
    description: t('pricing.seoDescription'),
    breadcrumbs: [
        { name: 'Home', item: 'https://solian.app' },
        { name: 'Pricing', item: 'https://solian.app/pricing' }
    ]
});
</script>

<style scoped>
/* The tier names carry the palette: one quiet color, or the full range.
   A single ignition moment wakes them up, left to right. */
.pricing-page {
    --pricing-gold: oklch(0.62 0.12 80);
}

.pricing-header {
    animation: pricing-rise 500ms ease-out both;
}

.tier-name {
    margin-top: 1.25rem;
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    opacity: 0;
    animation: pricing-ignite 800ms ease-out both;
}

/* Limited palette: a muted single color. */
.tier-name--stellar {
    color: color-mix(
        in oklch,
        var(--tier-color, var(--color-primary)) 55%,
        var(--color-base-content)
    );
}

/* Unlimited colors: the tier color at full strength. */
.tier-name--nova {
    color: var(--tier-color, var(--color-primary));
}

/* Unlimited + gradient: tier color melting into gold. */
.tier-name--color {
    color: var(--tier-color, var(--color-primary));
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
    .tier-name--color {
        background-image: linear-gradient(
            95deg,
            var(--tier-color, var(--color-primary)),
            var(--pricing-gold)
        );
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }
}

.current-badge {
    background: color-mix(
        in oklch,
        var(--tier-color, var(--color-primary)) 12%,
        transparent
    );
    color: var(--tier-color, var(--color-primary));
}

/* "Same" / "Not included" cells — scoped so it outranks the base 70% ink. */
.compare-muted {
    color: color-mix(in oklch, var(--color-base-content) 40%, transparent);
}

@keyframes pricing-ignite {
    from {
        opacity: 0;
        filter: blur(3px) saturate(0.35);
    }
    to {
        opacity: 1;
        filter: blur(0) saturate(1);
    }
}

@keyframes pricing-rise {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (prefers-color-scheme: dark) {
    .pricing-page {
        --pricing-gold: oklch(0.76 0.12 85);
    }

    .tier-name--nova {
        color: color-mix(
            in oklch,
            var(--tier-color, var(--color-primary)) 72%,
            white
        );
    }

    .current-badge {
        background: color-mix(
            in oklch,
            var(--tier-color, var(--color-primary)) 20%,
            transparent
        );
        color: color-mix(
            in oklch,
            var(--tier-color, var(--color-primary)) 70%,
            white
        );
    }

    @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        .tier-name--color {
            background-image: linear-gradient(
                95deg,
                color-mix(
                    in oklch,
                    var(--tier-color, var(--color-primary)) 60%,
                    white
                ),
                var(--pricing-gold)
            );
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .pricing-header,
    .tier-name {
        animation: none;
        opacity: 1;
    }
}
</style>
