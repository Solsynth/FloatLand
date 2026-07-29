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
  account?: { name?: string; nick?: string; profile?: { picture?: FileAttachment | null } | null } | null;
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
