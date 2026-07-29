<template>
    <NuxtLayout name="app">
        <div class="w-full max-w-7xl mx-auto">
            <div
                class="card bg-base-100"
            >
                <div class="card-body gap-6 p-5 md:p-8">
                    <!-- Header -->
                    <div
                        class="flex flex-col gap-3 bg-base-200/60 p-4 rounded-box"
                    >
                        <div
                            class="flex items-center gap-2 text-sm text-base-content/60"
                        >
                            <IconSparkles class="h-4 w-4 text-primary" />
                            <span>{{ t('pricing.stellarProgram') }}</span>
                        </div>
                        <div
                            class="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between"
                        >
                            <div class="max-w-3xl">
                                <h1
                                    class="text-3xl font-black tracking-tight text-base-content"
                                >
                                    {{ t('pricing.membershipTiers') }}
                                </h1>
                                <p
                                    class="mt-2 text-sm leading-6 text-base-content/70 md:text-base"
                                >
                                    {{ t('pricing.description') }}
                                </p>
                            </div>
                            <div class="text-sm text-base-content/55">
                                {{ t('pricing.billingNote') }}
                            </div>
                        </div>
                    </div>

                    <!-- Tier Cards -->
                    <div class="grid gap-4 xl:grid-cols-3">
                        <div
                            v-for="tier in tiers"
                            :key="tier.name"
                            class="card bg-base-100"
                        >
                            <div class="card-body gap-5">
                                <div
                                    class="flex items-start justify-between gap-4"
                                >
                                    <div>
                                        <p
                                            class="text-sm font-semibold text-base-content/55"
                                        >
                                            {{ tier.tagline }}
                                        </p>
                                        <h2
                                            class="mt-1 text-2xl font-black tracking-tight"
                                        >
                                            {{ tier.name }}
                                        </h2>
                                    </div>
                                    <div
                                        class="rounded-box bg-primary/10 p-3 text-primary"
                                    >
                                        <component
                                            :is="tier.iconComponent"
                                            class="h-5 w-5"
                                        />
                                    </div>
                                </div>

                                <p
                                    class="text-sm leading-6 text-base-content/70"
                                >
                                    {{ tier.description }}
                                </p>

                                <div class="grid gap-3 sm:grid-cols-2">
                                    <div
                                        class="rounded-box bg-base-200/60 p-3"
                                    >
                                    <div
                                        class="text-xs font-semibold text-base-content/45"
                                    >
                                        {{ t('pricing.storage') }}
                                    </div>
                                    <div
                                        class="mt-1 text-sm font-semibold"
                                    >
                                        {{ tier.storage }}
                                    </div>
                                </div>
                                <div
                                    class="rounded-box bg-base-200/60 p-3"
                                >
                                    <div
                                        class="text-xs font-semibold text-base-content/45"
                                    >
                                        {{ t('pricing.progression') }}
                                    </div>
                                    <div
                                        class="mt-1 text-sm font-semibold"
                                    >
                                        {{ tier.levelBoost }}
                                    </div>
                                </div>
                                <div
                                    class="rounded-box bg-base-200/60 p-3 sm:col-span-2"
                                >
                                    <div
                                        class="text-xs font-semibold text-base-content/45"
                                    >
                                        {{ t('pricing.usernameStyle') }}
                                    </div>
                                    <div
                                        class="mt-1 text-sm font-semibold"
                                    >
                                        {{ tier.usernameStyle }}
                                    </div>
                                    </div>
                                </div>

                                <ul class="space-y-3">
                                    <li
                                        v-for="feature in tier.features"
                                        :key="feature"
                                        class="flex items-start gap-3 text-sm text-base-content/80"
                                    >
                                        <IconBadgeCheck
                                            class="mt-0.5 h-4 w-4 shrink-0 text-primary"
                                        />
                                        <span>{{ feature }}</span>
                                    </li>
                                </ul>

                                <div class="mt-auto card-actions">
                                    <NuxtLink
                                        to="/auth/login"
                                        class="btn btn-primary w-full"
                                    >
                                        {{ t('pricing.choose', { name: tier.name }) }}
                                    </NuxtLink>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comparison Table -->
                    <div class="card bg-base-100">
                        <div class="card-body gap-5">
                            <div
                                class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
                            >
                                <div>
                                    <h2 class="text-xl font-bold">
                                        {{ t('pricing.compareTitle') }}
                                    </h2>
                                    <p class="mt-1 text-sm text-base-content/65">
                                        {{ t('pricing.compareDesc') }}
                                    </p>
                                </div>
                                <div class="text-sm text-base-content/55">
                                    {{ t('pricing.compareNote') }}
                                </div>
                            </div>

                            <div class="overflow-x-auto">
                                <table class="table">
                                    <thead>
                                        <tr class="text-sm text-base-content/55">
                                            <th>{{ t('pricing.benefit') }}</th>
                                            <th>Stellar</th>
                                            <th>Nova</th>
                                            <th>Supernova</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="row in comparisonRows"
                                            :key="row.label"
                                            class="align-top"
                                        >
                                            <th class="min-w-44">
                                                <div
                                                    class="flex items-center gap-2 font-semibold"
                                                >
                                                    <component
                                                        :is="row.iconComponent"
                                                        class="h-4 w-4 text-base-content/55"
                                                    />
                                                    <span>{{ row.label }}</span>
                                                </div>
                                            </th>
                                            <td>{{ row.values[0] }}</td>
                                            <td>{{ row.values[1] }}</td>
                                            <td>{{ row.values[2] }}</td>
                                        </tr>
                                    </tbody>
                                </table>
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
    IconBadgeCheck,
    IconBot,
    IconCloud,
    IconGauge,
    IconLanguages,
    IconPalette,
    IconRocket,
    IconSparkles,
    IconStars,
} from "#components";

interface Tier {
    name: string;
    tagline: string;
    description: string;
    storage: string;
    levelBoost: string;
    usernameStyle: string;
    iconComponent: typeof IconSparkles;
    features: string[];
}

interface ComparisonRow {
    label: string;
    iconComponent: typeof IconCloud;
    values: [string, string, string];
}

const tiers: Tier[] = [
    {
        name: "Stellar",
        tagline: "Core membership",
        description:
            "A lighter upgrade for members who want better identity tools and a faster pace.",
        storage: "5GB cloud storage",
        levelBoost: "1.5x leveling boost",
        usernameStyle: "Limited username colors",
        iconComponent: IconSparkles,
        features: [
            "5GB cloud storage",
            "Limited username color options",
            "Translation",
            "1.5x leveling up boost",
            "Ability to get verified",
            "Publisher quota: base 2, becomes 3 at level 30+, plus 2 per perk level",
        ],
    },
    {
        name: "Nova",
        tagline: "Expanded creator tools",
        description:
            "Everything in Stellar, with more room for publishers, realms, and bot-driven workflows.",
        storage: "10GB cloud storage",
        levelBoost: "2x leveling boost",
        usernameStyle: "Unlimited username colors",
        iconComponent: IconRocket,
        features: [
            "Everything in Stellar",
            "10GB cloud storage",
            "Unlimited username color options",
            "Publisher quota: base 2, becomes 3 at level 30+, plus 2 per perk level",
            "Bot quota: base 0, then 1 at level 30, 2 at level 60, 3 at level 90, plus 1 per perk level",
            "Realm quota: same as bot quota",
            "2x leveling up boost",
        ],
    },
    {
        name: "Supernova",
        tagline: "Highest capacity tier",
        description:
            "Everything in Nova, with the largest storage tier and the most room to scale out your setup.",
        storage: "15GB cloud storage",
        levelBoost: "2.5x leveling boost",
        usernameStyle: "Unlimited username color options",
        iconComponent: IconStars,
        features: [
            "Everything in Nova",
            "15GB cloud storage",
            "Unlimited username color options",
            "Publisher quota: base 2, becomes 3 at level 30+, plus 2 per perk level",
            "Bot quota: base 0, then 1 at level 30, 2 at level 60, 3 at level 90, plus 1 per perk level",
            "Realm quota: same as bot quota",
            "2.5x leveling up boost",
        ],
    },
];

const comparisonRows: ComparisonRow[] = [
    {
        label: "Cloud storage",
        iconComponent: IconCloud,
        values: ["5GB", "10GB", "15GB"],
    },
    {
        label: "Username color",
        iconComponent: IconPalette,
        values: ["Limited", "Unlimited", "Unlimited"],
    },
    {
        label: "Translation",
        iconComponent: IconLanguages,
        values: ["Included", "Included", "Included"],
    },
    {
        label: "Leveling boost",
        iconComponent: IconGauge,
        values: ["1.5x", "2x", "2.5x"],
    },
    {
        label: "Verification access",
        iconComponent: IconBadgeCheck,
        values: ["Eligible", "Eligible", "Eligible"],
    },
    {
        label: "Publisher quota",
        iconComponent: IconSparkles,
        values: ["2 base, 3 at lvl 30+, +2/perk", "Same", "Same"],
    },
    {
        label: "Realm quota",
        iconComponent: IconRocket,
        values: [
            "Not included",
            "0/1/2/3 by lvl 0/30/60/90, +1/perk",
            "Same",
        ],
    },
    {
        label: "Bot quota",
        iconComponent: IconBot,
        values: [
            "Not included",
            "0/1/2/3 by lvl 0/30/60/90, +1/perk",
            "Same",
        ],
    },
];

const { t } = useI18n();

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
