// Stellar Program wallet subscriptions
// Backend: /wallet/subscriptions/groups/solian.stellar and friends.
// Responses are snake_case on the wire and converted to camelCase by
// `safeJsonParse` (see ~/utils/api.ts), so these types use camelCase.

import { z } from "zod";

export const SubscriptionDisplayConfigSchema = z.object({
  color: z.string(),
  backgroundColor: z.unknown(),
  badgeText: z.unknown(),
});
export type SubscriptionDisplayConfig = z.infer<typeof SubscriptionDisplayConfigSchema>;

export const ProductProviderMappingsSchema = z.object({
  afdian: z.array(z.string()),
  paddle: z.array(z.string()),
  appleStore: z.array(z.string()),
});
export type ProductProviderMappings = z.infer<typeof ProductProviderMappingsSchema>;

export const SubscriptionCatalogItemSchema = z.object({
  identifier: z.string(),
  groupIdentifier: z.string(),
  displayName: z.string(),
  currency: z.string(),
  basePrice: z.number(),
  perkLevel: z.number(),
  minimumAccountLevel: z.number(),
  experienceMultiplier: z.number(),
  goldenPointReward: z.number(),
  displayConfig: SubscriptionDisplayConfigSchema.nullable(),
  allowedPaymentMethods: z.array(z.string()),
  providerMappings: ProductProviderMappingsSchema,
});
export type SubscriptionCatalogItem = z.infer<typeof SubscriptionCatalogItemSchema>;

export const SubscriptionGroupCatalogSchema = z.object({
  groupIdentifier: z.string(),
  displayName: z.string(),
  maxPerkLevel: z.number(),
  displayConfig: SubscriptionDisplayConfigSchema.nullable(),
  items: z.array(SubscriptionCatalogItemSchema),
});
export type SubscriptionGroupCatalog = z.infer<typeof SubscriptionGroupCatalogSchema>;

export const StellarSubscriptionSchema = z.object({
  id: z.string(),
  begunAt: z.string(),
  endedAt: z.string().nullable(),
  identifier: z.string(),
  groupIdentifier: z.string().nullable().optional(),
  isActive: z.boolean(),
  isFreeTrial: z.boolean(),
  /** 0: pending, 1: active */
  status: z.number(),
  paymentMethod: z.string().nullable(),
  basePrice: z.number().nullable(),
  couponId: z.string().nullable(),
  renewalAt: z.string().nullable(),
  finalPrice: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StellarSubscription = z.infer<typeof StellarSubscriptionSchema>;

export const ActiveSubscriptionSchema = z.object({
  subscription: StellarSubscriptionSchema,
  definition: SubscriptionCatalogItemSchema,
});
export type ActiveSubscription = z.infer<typeof ActiveSubscriptionSchema>;

export const SubscriptionGroupSchema = z.object({
  groupIdentifier: z.string(),
  catalog: SubscriptionGroupCatalogSchema,
  current: ActiveSubscriptionSchema.nullable(),
  next: ActiveSubscriptionSchema.nullable(),
  subscriptions: z.array(ActiveSubscriptionSchema),
});
export type SubscriptionGroup = z.infer<typeof SubscriptionGroupSchema>;

/** Stellar Program catalog item identifiers, as served by the backend. */
export const STELLAR_TIER_IDENTIFIERS = {
  stellar: "solian.stellar.primary",
  nova: "solian.stellar.nova",
  supernova: "solian.stellar.supernova",
} as const;

export type StellarTierKey = keyof typeof STELLAR_TIER_IDENTIFIERS;
