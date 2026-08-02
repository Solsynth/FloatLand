import type { FileAttachment } from "./post";

export interface Developer {
  id: string;
  publisherId: string;
  publisher?: DeveloperPublisher | null;
}

export interface DeveloperPublisher {
  id: string;
  name: string;
  nick: string;
  bio: string | null;
  picture: FileAttachment | null;
  background: FileAttachment | null;
  type: number;
  realmId: string | null;
  createdAt: string;
}

export interface DeveloperStats {
  totalCustomApps: number;
  totalBots: number;
  totalProjects: number;
}

export interface DevProject {
  id: string;
  slug: string;
  name: string;
  description: string;
  developer: Developer;
  developerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomApp {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: number;
  picture: FileAttachment | null;
  background: FileAttachment | null;
  verification: CustomAppVerificationMark | null;
  oauthConfig: CustomAppOauthConfig | null;
  links: CustomAppLinks | null;
  secrets: CustomAppSecret[];
  publisherId: string;
  paymentWalletId: string | null;
  boardWidgets: BoardWidgetManifest[];
}

export interface PluginManifest {
  id: string;
  name: string;
  version?: string;
  author?: string;
  description?: string;
  entry?: string;
  permissions?: string[];
  background?: boolean;
  icon?: string;
  homepage?: string;
  [key: string]: unknown;
}

export interface MiniApp {
  id: string;
  slug: string;
  stage: number;
  manifest: PluginManifest | null;
  pluginId?: string | null;
  name?: string;
  version?: string;
  author?: string;
  description?: string | null;
  homepage?: string | null;
  packageKey?: string | null;
  packageStorageKey?: string | null;
  packageUrl?: string | null;
  packageFileName?: string | null;
  packageContentType?: string | null;
  packageSize?: number | null;
  packageSha256?: string | null;
  icon?: FileAttachment | null;
  background?: FileAttachment | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PluginPackageResult {
  key: string;
  url?: string | null;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
}

export interface MarketplacePlugin extends MiniApp {
  publisher?: DeveloperPublisher | null;
}

export interface CustomAppVerificationMark {
  verified: boolean;
  grade: string | null;
}

export interface CustomAppLinks {
  homePage: string | null;
  privacyPolicy: string | null;
  termsOfService: string | null;
}

export interface CustomAppOauthConfig {
  clientUri: string | null;
  redirectUris: string[];
  postLogoutRedirectUris: string[] | null;
  allowedScopes: string[];
  allowedGrantTypes: string[];
  requirePkce: boolean;
  allowOfflineAccess: boolean;
  isPublicClient: boolean;
}

export interface CustomAppSecret {
  id: string;
  secret?: string | null;
  description: string | null;
  type: number;
  appId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bot {
  id: string;
  slug: string;
  isActive: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  account: BotAccount;
  developer: Developer | null;
}

export interface BotAccount {
  id: string;
  name: string;
  nick: string;
  language: string | null;
  profile: BotAccountProfile;
}

export interface BotAccountProfile {
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  gender: string | null;
  pronouns: string | null;
  timeZone: string | null;
  location: string | null;
  bio: string | null;
  birthday: string | null;
  picture?: FileAttachment | null;
  background?: FileAttachment | null;
}

/** Product billing cadence. API may return enum number or string. */
export type ProductRecurrence = "none" | "weekly" | "monthly" | "yearly" | number;

/** Stock window mode. API may return enum number or string. */
export type ProductStockMode =
  | "unlimited"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "manual"
  | number;

export interface AppProductFulfillment {
  isAddressRequired: boolean;
  requiredScopes: string[];
}

export interface AppProductState {
  id?: string;
  isEnabled: boolean;
  stockMode: ProductStockMode;
  stockQuantity: number | null;
  lastRestockedAt?: string | null;
  lastRestockedQuantity?: number | null;
  productId?: string;
}

export interface AppProduct {
  id: string;
  identifier: string;
  displayName: string;
  description: string | null;
  currency: string;
  price: number;
  picture: FileAttachment | null;
  background: FileAttachment | null;
  appId: string;
  /** none / weekly / monthly / yearly (enum number from API) */
  recurrence?: ProductRecurrence;
  /** Subscription tier group shared across related products */
  groupIdentifier?: string | null;
  fulfillment?: AppProductFulfillment | null;
  state?: AppProductState | null;
}

export interface AppProductWritePayload {
  identifier?: string;
  displayName?: string;
  description?: string;
  currency?: string;
  price?: number;
  pictureId?: string;
  backgroundId?: string;
  recurrence?: "none" | "weekly" | "monthly" | "yearly";
  groupIdentifier?: string | null;
  fulfillment?: {
    isAddressRequired?: boolean;
    requiredScopes?: string[];
  };
  state?: {
    isEnabled?: boolean;
    stockMode?: "unlimited" | "daily" | "weekly" | "monthly" | "yearly" | "manual";
    stockQuantity?: number | null;
  };
}

export interface BotKey {
  id: string;
  key?: string | null;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BotChatConfig {
  id: string;
  commands: BotCommand[];
  webhooks: BotWebhook[];
  autoApproveDm: boolean;
  autoApproveGroupChat: boolean;
  supportChat: boolean;
  subscribedEvents: string[];
}

export interface BotCommand {
  name: string;
  description: string;
  usage?: string;
  parameters?: BotCommandParameter[];
}

export interface BotCommandParameter {
  name: string;
  description?: string;
  required: boolean;
  type?: string;
}

export interface BotWebhook {
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
}

// ==================== Board Widgets ====================

/** Declared type of a widget field's envelope `value`. */
export type BoardWidgetFieldValueType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "null";

export interface BoardWidgetFieldManifest {
  name: string;
  /** Expected type of the envelope `value` (string | number | boolean | array | object | null). */
  type: BoardWidgetFieldValueType | string;
  label: string;
  format?: string;
  required: boolean;
}

export interface BoardWidgetManifest {
  key: string;
  /** Human-readable widget name shown to users. Required by Develop. */
  name: string;
  /** Human-readable explanation of what the widget displays. Required by Develop. */
  description: string;
  slug?: string;
  isEnabled: boolean;
  rendererType: string;
  fieldTypes: BoardWidgetFieldManifest[];
  requiredFields: string[];
  maxPayloadBytes: number;
  allowMultiple: boolean;
}

/**
 * Any JSON value: string, number, boolean, null, object, or array.
 * Objects and arrays may contain arbitrarily nested JSON values.
 */
export type BoardJsonValue =
  | string
  | number
  | boolean
  | null
  | BoardJsonValue[]
  | { [key: string]: BoardJsonValue };

/**
 * Universal payload envelope — every payload field MUST use this shape.
 * Enforced on every write path (PUT /board, POST /board/payload, gRPC).
 *
 * - `value` — required. Any JSON value (`string`, `number`, `boolean`, `null`,
 *   `object`, `array`). Objects and arrays may contain arbitrarily nested JSON values.
 * - `label` — required display label
 * - `format` — optional display/format hint (e.g. boolean, number, date, currency)
 */
export interface BoardFieldValueEnvelope {
  value: BoardJsonValue;
  label: string;
  format?: string;
}

export type BoardWidgetPayload = Record<string, BoardFieldValueEnvelope>;

export interface BoardWidgetValidationError {
  valid: boolean;
  message: string;
  normalizedPayload: BoardWidgetPayload | null;
}

export interface BoardWidgetPayloadPushRequest {
  accountId: string;
  boardItemId?: string;
  widgetKey: string;
  payload: BoardWidgetPayload;
}

export interface BoardWidgetPayloadPushResponse {
  success: boolean;
  message: string;
  accountId: string;
  boardItemId: string;
  widgetKey: string;
  normalizedPayload: BoardWidgetPayload | null;
  boardItem: AccountBoardPushItem | null;
}

export interface BoardWidgetDiscoveryItem {
  id: string;
  slug: string;
  isEnabled: boolean;
  rendererType: string;
  key: string;
  name: string;
  description: string;
  fieldTypes: BoardWidgetFieldManifest[];
  requiredFields: string[];
  maxPayloadBytes: number;
  allowMultiple: boolean;
}

export interface BoardAppDiscoveryResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  publisherName: string;
  boardWidgets: BoardWidgetDiscoveryItem[];
}

export interface AccountBoardPushItem {
  id: string;
  order: number;
  kind: string;
  widgetKey: string;
  customAppId: string;
  customAppWidgetKey: string;
  isEnabled: boolean;
  payload: BoardWidgetPayload;
}

// ==================== Custom App Notifications ====================

export interface CustomAppNotificationMeta {
  sent_by_app?: {
    id: string;
    slug: string;
    name: string;
    publisher: string;
  };
  [key: string]: unknown;
}

export interface CustomAppNotification {
  id: string;
  topic: string;
  title: string;
  subtitle?: string;
  body: string;
  actionUri?: string;
  meta: CustomAppNotificationMeta;
  viewedAt?: string;
  createdAt: string;
}
