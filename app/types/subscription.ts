// Stellar Program wallet subscriptions
// Backend: /wallet/subscriptions/groups/solian.stellar and friends.
// Responses are snake_case on the wire and converted to camelCase by
// `safeJsonParse` (see ~/utils/api.ts), so these types use camelCase.

export interface SubscriptionDisplayConfig {
    color: string;
    backgroundColor: unknown;
    badgeText: unknown;
}

export interface ProductProviderMappings {
    afdian: string[];
    paddle: string[];
    appleStore: string[];
}

export interface SubscriptionCatalogItem {
    identifier: string;
    groupIdentifier: string;
    displayName: string;
    currency: string;
    basePrice: number;
    perkLevel: number;
    minimumAccountLevel: number;
    experienceMultiplier: number;
    goldenPointReward: number;
    displayConfig: SubscriptionDisplayConfig | null;
    allowedPaymentMethods: string[];
    providerMappings: ProductProviderMappings;
}

export interface SubscriptionGroupCatalog {
    groupIdentifier: string;
    displayName: string;
    maxPerkLevel: number;
    displayConfig: SubscriptionDisplayConfig | null;
    items: SubscriptionCatalogItem[];
}

export interface StellarSubscription {
    id: string;
    begunAt: string;
    endedAt: string | null;
    identifier: string;
    groupIdentifier?: string | null;
    isActive: boolean;
    isFreeTrial: boolean;
    /** 0: pending, 1: active */
    status: number;
    paymentMethod: string | null;
    basePrice: number | null;
    couponId: string | null;
    renewalAt: string | null;
    finalPrice: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface ActiveSubscription {
    subscription: StellarSubscription;
    definition: SubscriptionCatalogItem;
}

export interface SubscriptionGroup {
    groupIdentifier: string;
    catalog: SubscriptionGroupCatalog;
    current: ActiveSubscription | null;
    next: ActiveSubscription | null;
    subscriptions: ActiveSubscription[];
}

/** Stellar Program catalog item identifiers, as served by the backend. */
export const STELLAR_TIER_IDENTIFIERS = {
    stellar: "solian.stellar.primary",
    nova: "solian.stellar.nova",
    supernova: "solian.stellar.supernova",
} as const;

export type StellarTierKey = keyof typeof STELLAR_TIER_IDENTIFIERS;
