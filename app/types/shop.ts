// Solar Network shop products beyond the Stellar Program membership.
// Responses are snake_case on the wire and converted to camelCase by
// `safeJsonParse` (see ~/utils/api.ts), so these types use camelCase.

/** One entry of `GET /wallet/wallet-products/catalog`. */
export interface WalletProductCatalogItem {
    key: string;
    identifier: string;
    displayName: string;
    currency: string;
    /** `{ paymentMethod: { providerProductId: pointsAmount } }` */
    providerMappings: Record<string, Record<string, number>>;
}

/** `GET /drive/billing/quota/purchase` — quota pricing. */
export interface QuotaPurchaseConfig {
    pricePerGb: number;
    currency: string;
    minGb: number;
    maxGb: number;
}

/** `POST /drive/billing/quota/purchase` — created order. */
export interface QuotaOrder {
    orderId: string;
    amount: string;
    currency: string;
    quantityGb: number;
    quotaMb: number;
}

/** `POST /accounts/me/name-change-card/order` — created order. */
export interface NameChangeCardOrder {
    purchaseId: string;
    orderId: string;
    amount: number;
}

/** Price of one name change card, matching the server. */
export const NAME_CHANGE_CARD_PRICE = 100;

/** Catalog key of the Golden Solar Points resupply pack. */
export const GOLDS_RESUPPLY_CATALOG_KEY = "golds_resupply_pack";
export const GOLDS_RESUPPLY_IDENTIFIER = "wallet.golds_resupply_pack";
