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
                                            <th>{{ t('pricing.tiers.stellar.name') }}</th>
                                            <th>{{ t('pricing.tiers.nova.name') }}</th>
                                            <th>{{ t('pricing.tiers.supernova.name') }}</th>
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

                    <!-- Free Storage by Level -->
                    <div class="card bg-base-100">
                        <div class="card-body gap-5">
                            <div>
                                <h2 class="text-xl font-bold">
                                    {{ t('pricing.levelQuota.title') }}
                                </h2>
                                <p class="mt-1 text-sm text-base-content/65">
                                    {{ t('pricing.levelQuota.desc') }}
                                </p>
                            </div>
                            <div class="grid gap-3 sm:grid-cols-3">
                                <div
                                    v-for="step in levelQuotaSteps"
                                    :key="step.level"
                                    class="rounded-box bg-base-200/60 p-4 text-center"
                                >
                                    <div
                                        class="text-xs font-semibold text-base-content/45"
                                    >
                                        {{ step.level }}
                                    </div>
                                    <div class="mt-1 text-lg font-black">
                                        {{ step.quota }}
                                    </div>
                                </div>
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

interface TierDef {
    key: "stellar" | "nova" | "supernova";
    featureKeys: string[];
    iconComponent: typeof IconSparkles;
}

interface ComparisonRowDef {
    key: string;
    iconComponent: typeof IconCloud;
}

const tierDefs: TierDef[] = [
    { key: "stellar", featureKeys: ["f0", "f1", "f2", "f3", "f4", "f5"], iconComponent: IconSparkles },
    { key: "nova", featureKeys: ["f0", "f1", "f2", "f3", "f4", "f5", "f6"], iconComponent: IconRocket },
    { key: "supernova", featureKeys: ["f0", "f1", "f2", "f3", "f4", "f5", "f6"], iconComponent: IconStars },
];

const comparisonRowDefs: ComparisonRowDef[] = [
    { key: "storage", iconComponent: IconCloud },
    { key: "usernameColor", iconComponent: IconPalette },
    { key: "translation", iconComponent: IconLanguages },
    { key: "levelingBoost", iconComponent: IconGauge },
    { key: "verification", iconComponent: IconBadgeCheck },
    { key: "publisherQuota", iconComponent: IconSparkles },
    { key: "realmQuota", iconComponent: IconRocket },
    { key: "botQuota", iconComponent: IconBot },
];

const levelQuotaStepKeys = ["lv0", "lv10", "lv120"] as const;

const { t } = useI18n();

const tiers = computed<Tier[]>(() =>
    tierDefs.map((def) => ({
        name: t(`pricing.tiers.${def.key}.name`),
        tagline: t(`pricing.tiers.${def.key}.tagline`),
        description: t(`pricing.tiers.${def.key}.description`),
        storage: t(`pricing.tiers.${def.key}.storage`),
        levelBoost: t(`pricing.tiers.${def.key}.levelBoost`),
        usernameStyle: t(`pricing.tiers.${def.key}.usernameStyle`),
        iconComponent: def.iconComponent,
        features: def.featureKeys.map((k) => t(`pricing.tiers.${def.key}.features.${k}`)),
    })),
);

const comparisonRows = computed<ComparisonRow[]>(() =>
    comparisonRowDefs.map((def) => ({
        label: t(`pricing.compare.${def.key}.label`),
        iconComponent: def.iconComponent,
        values: [
            t(`pricing.compare.${def.key}.stellar`),
            t(`pricing.compare.${def.key}.nova`),
            t(`pricing.compare.${def.key}.supernova`),
        ] as [string, string, string],
    })),
);

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
