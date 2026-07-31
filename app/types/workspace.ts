import type { FileAttachment } from "./post";

export const WorkspaceType = {
  individual: 0,
  organization: 1,
} as const;

export const WorkspacePlan = {
  free: 0,
  pro: 1,
  enterprise: 2,
} as const;

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: number;
  ownerAccountId: string | null;
  picture: FileAttachment | null;
  background: FileAttachment | null;
  plan: number;
  planExpiresAt: string | null;
  isBundled: boolean;
}

export interface WorkspaceMember {
  id: string;
  accountId: string;
  role: number;
  account?: { name?: string; nick?: string; contacts?: { content: string; isPrimary?: boolean; type?: number }[]; profile?: { picture?: FileAttachment | null } | null } | null;
}

export interface WorkspacePlanStatus {
  plan: number;
  isBundled: boolean;
  prices?: { pro?: number; enterprise?: number; currency?: string } | null;
}

export interface WorkspacePlanOrder {
  orderId: string;
  amount: number;
  currency: string;
  plan: number;
}

export interface WorkspaceMailbox {
  id: string;
  accountId: string;
  workspaceId: string | null;
  address: string;
  name: string | null;
  isDefault: boolean;
  isVerified: boolean;
}

export interface WorkspaceMailCredential {
  id: string;
  accountId: string;
  mailboxId: string;
  label: string;
  protocols: string[];
  createdAt: string | null;
}

export interface WorkspaceMailCredentialCreated {
  credential: WorkspaceMailCredential;
  secret: string;
}

export interface FlywheelOwnerApp {
  appId: string;
  retainedRevisionCount: number;
  blobCount: number;
  retainedRevisionCountTotal: number;
  retainedBytes: number;
  lastUpdatedAt: string;
}

export interface FlywheelOwnerBlob {
  blobId: string;
  currentRevision: number;
  retainedRevisionCount: number;
  retainedBytes: number;
  updatedAt: string;
}

export interface FlywheelAuditEntry {
  appId: string;
  blobId: string | null;
  revision: number | null;
  action: string;
  actorAccountId: string;
  createdAt: string;
}
