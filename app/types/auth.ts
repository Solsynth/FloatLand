import { z } from "zod";

export const SnAuthFactorSchema = z.object({
  id: z.string(),
  type: z.number(),
  name: z.string().optional(),
  enabledAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  createdResponse: z.record(z.string(), z.unknown()).optional(),
});
export type SnAuthFactor = z.infer<typeof SnAuthFactorSchema>;

/** Padlock-local passkey credential (not the Passkey auth factor). */
export const SnPasskeySchema = z.object({
  id: z.string(),
  label: z.string(),
  accountId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type SnPasskey = z.infer<typeof SnPasskeySchema>;

export const SnAuthChallengeSchema = z.object({
  id: z.string(),
  stepRemain: z.number().optional(),
  stepTotal: z.number().optional(),
  riskLevel: z.number().optional(),
  factors: z.array(SnAuthFactorSchema).optional(),
  blacklistFactors: z.array(z.string()).optional(),
  doneAt: z.string().nullable().optional(),
  grantAid: z.string().nullable().optional(),
  grantToken: z.string().nullable().optional(),
  accountId: z.string().optional(),
});
export type SnAuthChallenge = z.infer<typeof SnAuthChallengeSchema>;

export const PasskeyAuthenticationOptionsSchema = z.object({
  challenge: z.string(),
  rpId: z.string(),
  allowCredentials: z
    .array(
      z.object({
        type: z.string(),
        id: z.string(),
        transports: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  userVerification: z.string().default("preferred"),
  timeout: z.number().optional(),
  /** Present for discoverable (username-less) passkey login. */
  authChallengeId: z.string().optional(),
});
export type PasskeyAuthenticationOptions = z.infer<typeof PasskeyAuthenticationOptionsSchema>;

export const PasskeyRegistrationOptionsSchema = z.object({
  challenge: z.string(),
  rpId: z.string(),
  rpName: z.string(),
  userId: z.string(),
  userName: z.string(),
  displayName: z.string(),
  pubKeyCredParams: z.array(
    z.object({ type: z.string(), alg: z.number() }),
  ),
  timeout: z.number().optional(),
  authenticatorSelection: z
    .object({
      authenticatorAttachment: z.string().optional(),
      residentKey: z.string().optional(),
      userVerification: z.string().optional(),
    })
    .optional(),
});
export type PasskeyRegistrationOptions = z.infer<typeof PasskeyRegistrationOptionsSchema>;

export const SnAuthTokenSchema = z.object({
  token: z.string(),
  expiresIn: z.number().optional(),
  refreshToken: z.string().optional(),
  refreshExpiresIn: z.number().optional(),
  expiresAt: z.string().optional(),
  refreshExpiresAt: z.string().optional(),
});
export type SnAuthToken = z.infer<typeof SnAuthTokenSchema>;

export const SnAccountBadgeSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  activatedAt: z.string().nullable().optional(),
  expiredAt: z.string().nullable().optional(),
  accountId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type SnAccountBadge = z.infer<typeof SnAccountBadgeSchema>;

export const SnAccountProfileSchema = z.object({
  id: z.string().optional(),
  bio: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  pronouns: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional(),
  birthday: z.string().nullable().optional(),
  lastSeenAt: z.string().nullable().optional(),
  picture: z.object({ id: z.string() }).nullable().optional(),
  background: z.object({ id: z.string() }).nullable().optional(),
  links: z
    .array(
      z.object({
        url: z.string(),
        name: z.string().optional(),
        label: z.string().optional(),
      }),
    )
    .optional(),
  verification: z
    .object({
      type: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      verifiedBy: z.string().optional(),
    })
    .nullable()
    .optional(),
  /** Legacy backend field for older payloads; current API returns `verification`. */
  verified: z
    .object({
      type: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      verifiedBy: z.string().optional(),
    })
    .nullable()
    .optional(),
  activeBadge: SnAccountBadgeSchema.nullable().optional(),
  level: z.number().optional(),
  experience: z.number().optional(),
  levelingProgress: z.number().optional(),
  socialCredits: z.number().optional(),
  socialCreditsLevel: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type SnAccountProfile = z.infer<typeof SnAccountProfileSchema>;

export const SnContactMethodSchema = z.object({
  id: z.string(),
  type: z.number(),
  content: z.string(),
  isPrimary: z.boolean(),
  isPublic: z.boolean(),
  verifiedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type SnContactMethod = z.infer<typeof SnContactMethodSchema>;

export const SnAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  nick: z.string().optional(),
  language: z.string().optional(),
  region: z.string().optional(),
  activatedAt: z.string().nullable().optional(),
  automatedId: z.string().nullable().optional(),
  isSuperuser: z.boolean().optional(),
  perkLevel: z.number().optional(),
  perkSubscription: z.record(z.string(), z.unknown()).nullable().optional(),
  profile: SnAccountProfileSchema.optional(),
  badges: z.array(SnAccountBadgeSchema).optional(),
  contacts: z.array(SnContactMethodSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});
export type SnAccount = z.infer<typeof SnAccountSchema>;

export interface SnAccountConnection {
  id: string;
  provider: string;
  providedIdentifier: string;
  meta: Record<string, string>;
  lastUsedAt: string;
  createdAt: string;
}

/** Public connection shape from GET /stargate/accounts/{name}/connections */
export const PublicAccountConnectionSchema = z.object({
  provider: z.string(),
  providedIdentifier: z.string(),
  url: z.string().optional(),
});
export type PublicAccountConnection = z.infer<typeof PublicAccountConnectionSchema>;

const RelationshipAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  nick: z.string(),
  profile: z.object({ picture: z.object({ id: z.string() }).optional() }),
});

export const RelationshipSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  relatedId: z.string(),
  status: z.number(),
  expiredAt: z.string().optional(),
  account: RelationshipAccountSchema.optional(),
  related: RelationshipAccountSchema.optional(),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const RelationshipStatusSchema = z.object({
  status: z.number(),
  isFriend: z.boolean(),
  isBlocked: z.boolean(),
});
export type RelationshipStatus = z.infer<typeof RelationshipStatusSchema>;

export const FriendOverviewItemSchema = z.object({
  account: SnAccountSchema,
  status: z
    .object({
      id: z.string(),
      attitude: z.number(),
      isOnline: z.boolean(),
      isIdle: z.boolean(),
      type: z.number(),
      label: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
  activities: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string().nullable().optional(),
      subtitle: z.string().nullable().optional(),
      caption: z.string().nullable().optional(),
      smallImage: z.string().nullable().optional(),
      largeImage: z.string().nullable().optional(),
    }),
  ),
});
export type FriendOverviewItem = z.infer<typeof FriendOverviewItemSchema>;

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
export const QrLoginGenerateResponseSchema = z.object({
  qrChallengeId: z.string(),
  authChallengeId: z.string(),
  qrData: z.string(),
  expiresAt: z.string(),
  expiresInSeconds: z.number(),
});
export type QrLoginGenerateResponse = z.infer<typeof QrLoginGenerateResponseSchema>;

/**
 * Poll response from GET /stargate/auth/qr/{id}.
 * Backend serializes QrLoginStatus as a number by default (0–4).
 */
export const QrLoginStatusResponseSchema = z.object({
  qrChallengeId: z.string(),
  authChallengeId: z.string(),
  status: z.union([z.number(), z.string()]),
  expiresAt: z.string(),
  approvedAt: z.string().nullable().optional(),
  approvedDeviceId: z.string().nullable().optional(),
  deviceName: z.string().nullable().optional(),
  platform: z.number().optional(),
});
export type QrLoginStatusResponse = z.infer<typeof QrLoginStatusResponseSchema>;

export type QrLoginStatus =
  | "pending"
  | "scanned"
  | "approved"
  | "declined"
  | "expired";

export type LoginStep = "lookup" | "picker" | "check" | "qr";

export const CaptchaConfigSchema = z.object({
  provider: z.string(),
  apiKey: z.string(),
});
export type CaptchaConfig = z.infer<typeof CaptchaConfigSchema>;

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

export const SnAccountPunishmentSchema = z.object({
  id: z.string(),
  type: z.number(),
  reason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  expiredAt: z.string().nullable().optional(),
  /** Legacy backend field for older payloads; current API returns `expiredAt`. */
  expiresAt: z.string().nullable().optional(),
  accountId: z.string().optional(),
  creatorId: z.string().nullable().optional(),
  blockedPermissions: z.array(z.string()).nullable().optional(),
  issuedBy: z.string().optional(),
});
export type SnAccountPunishment = z.infer<typeof SnAccountPunishmentSchema>;

export interface SpellInfo {
  type: number;
  account: {
    name: string;
  };
  createdAt: string;
  affectedAt: string;
  expiredAt?: string;
}

export const SnAccountStatusSchema = z.object({
  type: z.number(),
  label: z.string(),
  symbol: z.string().optional(),
  isOnline: z.boolean(),
  isAutomated: z.boolean(),
  appIdentifier: z.string().optional(),
});
export type SnAccountStatus = z.infer<typeof SnAccountStatusSchema>;

export const SnAccountActivitySchema = z.object({
  type: z.number(),
  manualId: z.string().optional(),
  title: z.string().optional(),
  titleUrl: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleUrl: z.string().optional(),
  caption: z.string().optional(),
  largeImage: z.string().optional(),
  smallImage: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type SnAccountActivity = z.infer<typeof SnAccountActivitySchema>;

export const SnAccountTimelineItemSchema = z.object({
  id: z.string(),
  eventType: z.number(),
  createdAt: z.string(),
  status: SnAccountStatusSchema.optional(),
  activity: SnAccountActivitySchema.optional(),
});
export type SnAccountTimelineItem = z.infer<typeof SnAccountTimelineItemSchema>;
