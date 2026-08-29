import type { FileAttachment } from "./post";
import type { SnAccount } from "./auth";

export interface Realm {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  picture: FileAttachment | null;
  background: FileAttachment | null;
  isPublic: boolean;
  isCommunity: boolean;
  boostPoints: number;
  boostLevel: number;
  verification: {
    type: number;
    title: string | null;
    description: string | null;
    verifiedBy: string | null;
  } | null;
}

export interface RealmMember {
  id: string;
  accountId: string;
  realmId: string;
  role: number;
  nick: string | null;
  bio: string | null;
  labelId: string | null;
  level: number;
  experience: number;
  levelingProgress: number;
  createdAt: string;
  updatedAt: string;
  account?: SnAccount;
  label?: RealmLabel;
  realm?: Realm;
}

export interface RealmLabel {
  id: string;
  realmId: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  createdAt: string;
}

export interface RealmBoostStatus {
  boostPoints: number;
  boostLevel: number;
  labelCap: number;
  expiresAfterDays: number;
  supportedCurrencies: string[];
  defaultCurrency: string;
}

export interface RealmBoostLeaderboardEntry {
  accountId: string;
  totalPoints: number;
  account?: SnAccount;
}

export interface RealmInvite {
  id: string;
  realmId: string;
  accountId: string;
  role: number;
  invitedBy: string;
  createdAt: string;
  realm?: Realm;
  invitedByAccount?: SnAccount;
}
