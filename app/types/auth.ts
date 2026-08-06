export interface SnAuthFactor {
  id: string;
  type: number;
  name?: string;
  enabledAt?: string | null;
  createdAt?: string;
  createdResponse?: Record<string, unknown>;
}

/** Padlock-local passkey credential (not the Passkey auth factor). */
export interface SnPasskey {
  id: string;
  label: string;
  accountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SnAuthChallenge {
  id: string;
  stepRemain?: number;
  stepTotal?: number;
  riskLevel?: number;
  factors?: SnAuthFactor[];
  blacklistFactors?: string[];
  doneAt?: string | null;
  grantAid?: string | null;
  grantToken?: string | null;
  accountId?: string;
}

export interface SnAuthToken {
  token: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshExpiresIn?: number;
  expiresAt?: string;
  refreshExpiresAt?: string;
}

export interface SnAccountProfile {
  id?: string;
  bio?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  pronouns?: string;
  location?: string;
  timeZone?: string;
  birthday?: string | null;
  lastSeenAt?: string | null;
  picture?: { id: string } | null;
  background?: { id: string } | null;
  links?: { url: string; name?: string; label?: string }[];
  verification?: {
    type: number;
    title?: string;
    description?: string;
    verifiedBy?: string;
  } | null;
  /** @deprecated API returns `verification`; kept for older payloads */
  verified?: {
    type: number;
    title?: string;
    description?: string;
    verifiedBy?: string;
  } | null;
  activeBadge?: SnAccountBadge | null;
  level?: number;
  experience?: number;
  levelingProgress?: number;
  socialCredits?: number;
  socialCreditsLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SnAccountBadge {
  id: string;
  type: string;
  label?: string | null;
  caption?: string | null;
  activatedAt?: string | null;
  expiredAt?: string | null;
  accountId?: string;
  createdAt?: string;
  updatedAt?: string;
  meta?: Record<string, unknown>;
}

export interface SnAccount {
  id: string
  name: string
  nick?: string
  language?: string
  region?: string
  activatedAt?: string | null
  automatedId?: string | null
  isSuperuser?: boolean
  perkLevel?: number
  perkSubscription?: Record<string, unknown> | null
  profile?: SnAccountProfile
  badges?: SnAccountBadge[]
  contacts?: SnContactMethod[]
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface SnContactMethod {
  id: string;
  type: number;
  content: string;
  isPrimary: boolean;
  isPublic: boolean;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface SnAccountConnection {
  id: string;
  provider: string;
  providedIdentifier: string;
  meta: Record<string, string>;
  lastUsedAt: string;
  createdAt: string;
}

/** Public connection shape from GET /stargate/accounts/{name}/connections */
export interface PublicAccountConnection {
  provider: string;
  providedIdentifier: string;
  url?: string;
}

/** Board widget kind: 0/prebuilt or 1/custom_app */
export type AccountBoardItemKind = "prebuilt" | "custom_app" | 0 | 1;

/**
 * Payload field envelope used by custom board widgets.
 * Prebuilt widgets may also store plain scalars under payload keys.
 */
export interface BoardPayloadField {
  value?: unknown;
  label?: string;
  format?: string;
}

export type AccountBoardPayload = Record<
  string,
  BoardPayloadField | string | number | boolean | unknown
>;

/** Account profile board item from GET /passport/accounts/{name}/board */
export interface AccountBoardItem {
  id?: string;
  accountId?: string;
  order: number;
  kind: AccountBoardItemKind;
  widgetKey?: string | null;
  customAppId?: string | null;
  customAppWidgetKey?: string | null;
  isEnabled: boolean;
  payload?: AccountBoardPayload;
  createdAt?: string;
  updatedAt?: string;
}

export interface SnAuthSession {
  id: string;
  type: number;
  label?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
  };
  isCurrent?: boolean;
  childrenCount?: number;
  createdAt: string;
  updatedAt?: string;
  lastGrantedAt: string;
  expiredAt?: string;
  audiences?: string[];
  scopes?: string[];
  clientId?: string;
  client?: SnAuthClient | null;
  parentSessionId?: string | null;
  accountId?: string;
  challengeId?: string;
}

export interface SnAuthClient {
  id: string;
  platform: number;
  deviceName: string;
  deviceLabel?: string | null;
  deviceId: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SnAuthDevice {
  deviceId: string;
  deviceName: string;
  deviceLabel?: string;
  platform: number;
  isCurrent: boolean;
  sessions: SnAuthSession[];
}

export const SESSION_TYPES: Record<number, { label: string; icon: string }> = {
  0: { label: "Login", icon: "key" },
  1: { label: "OAuth", icon: "link" },
  2: { label: "OIDC", icon: "user-circle" },
  3: { label: "API Key", icon: "code" },
};

export const PLATFORM_TYPES: Record<number, { label: string; icon: string }> = {
  0: { label: "Unknown", icon: "help-circle" },
  1: { label: "Web", icon: "globe" },
  2: { label: "iOS", icon: "smartphone" },
  3: { label: "Android", icon: "smartphone" },
  4: { label: "macOS", icon: "laptop" },
  5: { label: "Windows", icon: "monitor" },
  6: { label: "Linux", icon: "terminal" },
};

export const FACTOR_TYPES: Record<
  number,
  { label: string; description: string; icon: string; webUnavailable?: boolean }
> = {
  0: {
    label: "Password",
    description: "Enter your account password",
    icon: "key",
  },
  1: {
    label: "Email",
    description: "Verification code sent to your email",
    icon: "mail",
  },
  2: {
    label: "In-App Notification",
    description: "Approve login from your device",
    icon: "bell",
  },
  3: {
    label: "TOTP",
    description: "Time-based one-time password",
    icon: "timer",
  },
  4: { label: "PIN", description: "Enter your security PIN", icon: "shield" },
  5: {
    label: "Recovery Code",
    description: "Single-use recovery code",
    icon: "key-round",
  },
  6: {
    label: "Physical Passport",
    description: "NFC-based authentication (unavailable on web)",
    icon: "nfc",
    webUnavailable: true,
  },
  7: {
    label: "Passkey",
    description: "Platform authenticator",
    icon: "key-square",
  },
  8: {
    label: "QR Login",
    description: "Approve sign-in by scanning a QR code from another device",
    icon: "qr-code",
  },
};

/** Web client QR login challenge (POST /stargate/auth/qr/generate). */
export interface QrLoginGenerateResponse {
  qrChallengeId: string;
  authChallengeId: string;
  qrData: string;
  expiresAt: string;
  expiresInSeconds: number;
}

/**
 * Poll response from GET /stargate/auth/qr/{id}.
 * Backend serializes QrLoginStatus as a number by default (0–4).
 */
export interface QrLoginStatusResponse {
  qrChallengeId: string;
  authChallengeId: string;
  status: number | string;
  expiresAt: string;
  approvedAt?: string | null;
  approvedDeviceId?: string | null;
  deviceName?: string | null;
  platform?: number;
}

export type QrLoginStatus =
  | "pending"
  | "scanned"
  | "approved"
  | "declined"
  | "expired";

export type LoginStep = "lookup" | "picker" | "check" | "qr";

export interface CaptchaConfig {
  provider: string;
  apiKey: string;
}

export interface WalletOrderItem {
  productIdentifier: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface WalletOrderAppImage {
  id: string;
  name: string;
  mime_type?: string;
  blurhash?: string;
  url?: string;
}

export interface WalletOrderApp {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  picture: WalletOrderAppImage | null;
  background: WalletOrderAppImage | null;
}

export interface WalletOrderDeveloper {
  id: string;
  publisherId: string;
  publisherName: string;
}

export enum WalletOrderStatus {
  Unpaid = 0,
  Paid = 1,
  Finished = 2,
  Cancelled = 3,
  Expired = 4,
}

export interface WalletOrderTimestamp {
  seconds: number;
  nanos: number;
}

export interface AppProduct {
  id: string;
  identifier: string;
  displayName: string | null;
  description: string | null;
  currency: string;
  price: number;
  picture: WalletOrderAppImage | null;
  background?: WalletOrderAppImage | null;
  app_id: string;
  app?: WalletOrderApp;
  recurrence?: number;
  groupIdentifier?: string | null;
  createdAt?: string | WalletOrderTimestamp;
  updatedAt?: string | WalletOrderTimestamp;
  deletedAt?: string | WalletOrderTimestamp | null;
}

export interface WalletOrder {
  id: string;
  status: WalletOrderStatus;
  productIdentifier: string | null;
  remarks: string | null;
  amount: number;
  currency: string;
  items?: WalletOrderItem[];
  appIdentifier?: string;
  transactionId?: string | null;
  payeeWalletId?: string;
  expiredAt?: string | null;
  createdAt?: string | WalletOrderTimestamp;
  updatedAt?: string | WalletOrderTimestamp;
  app?: WalletOrderApp;
  developer?: WalletOrderDeveloper;
}

export interface SnAccountPunishment {
  id: string;
  type: number;
  reason?: string;
  createdAt: string;
  updatedAt?: string;
  expiredAt?: string | null;
  /** @deprecated prefer expiredAt */
  expiresAt?: string | null;
  accountId?: string;
  creatorId?: string | null;
  blockedPermissions?: string[] | null;
  issuedBy?: string;
}

export interface SpellInfo {
  type: number;
  account: {
    name: string;
  };
  createdAt: string;
  affectedAt: string;
  expiredAt?: string;
}

export interface SnAccountStatus {
  type: number;
  label: string;
  symbol?: string;
  isOnline: boolean;
  isAutomated: boolean;
  appIdentifier?: string;
}

export interface SnAccountActivity {
  type: number;
  manualId?: string;
  title?: string;
  titleUrl?: string;
  subtitle?: string;
  subtitleUrl?: string;
  caption?: string;
  largeImage?: string;
  smallImage?: string;
  meta?: Record<string, unknown>;
}

export interface SnAccountTimelineItem {
  id: string;
  eventType: number;
  createdAt: string;
  status?: SnAccountStatus;
  activity?: SnAccountActivity;
}
