// Solar Network shop products beyond the Stellar Program membership.
// Responses are snake_case on the wire and converted to camelCase by
// `safeJsonParse` (see ~/utils/api.ts), so these types use camelCase.

import { z } from "zod";

/** One entry of `GET /wallet/wallet-products/catalog`. */
export const WalletProductCatalogItemSchema = z.object({
  key: z.string(),
  identifier: z.string(),
  displayName: z.string(),
  currency: z.string(),
  /** `{ paymentMethod: { providerProductId: pointsAmount } }` */
  providerMappings: z.record(z.string(), z.record(z.string(), z.number())),
});
export type WalletProductCatalogItem = z.infer<typeof WalletProductCatalogItemSchema>;

/** `GET /drive/billing/quota/purchase` — quota pricing. */
export const QuotaPurchaseConfigSchema = z.object({
  pricePerGb: z.number(),
  currency: z.string(),
  minGb: z.number(),
  maxGb: z.number(),
});
export type QuotaPurchaseConfig = z.infer<typeof QuotaPurchaseConfigSchema>;

/** `POST /drive/billing/quota/purchase` — created order. */
export const QuotaOrderSchema = z.object({
  orderId: z.string(),
  amount: z.string(),
  currency: z.string(),
  quantityGb: z.number(),
  quotaMb: z.number(),
});
export type QuotaOrder = z.infer<typeof QuotaOrderSchema>;

/** `POST /accounts/me/name-change-card/order` — created order. */
export const NameChangeCardOrderSchema = z.object({
  purchaseId: z.string(),
  orderId: z.string(),
  amount: z.number(),
});
export type NameChangeCardOrder = z.infer<typeof NameChangeCardOrderSchema>;

/** Price of one name change card, matching the server. */
export const NAME_CHANGE_CARD_PRICE = 100;

/** Catalog key of the Golden Solar Points resupply pack. */
export const GOLDS_RESUPPLY_CATALOG_KEY = "golds_resupply_pack";
export const GOLDS_RESUPPLY_IDENTIFIER = "wallet.golds_resupply_pack";
