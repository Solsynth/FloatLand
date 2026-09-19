import { z } from "zod";
import { FileAttachmentSchema } from "./post";

export const WorkspaceType = {
  individual: 0,
  organization: 1,
} as const;

export const WorkspacePlan = {
  free: 0,
  pro: 1,
  enterprise: 2,
} as const;

export const WorkspaceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.number(),
  ownerAccountId: z.string().nullable(),
  picture: FileAttachmentSchema.nullable(),
  background: FileAttachmentSchema.nullable(),
  plan: z.number(),
  planExpiresAt: z.string().nullable(),
  isBundled: z.boolean(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  role: z.number(),
  account: z
    .object({
      name: z.string().optional(),
      nick: z.string().optional(),
      contacts: z
        .array(
          z.object({
            content: z.string(),
            isPrimary: z.boolean().optional(),
            type: z.number().optional(),
          }),
        )
        .optional(),
      profile: z
        .object({
          picture: FileAttachmentSchema.nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

export const WorkspacePlanStatusSchema = z.object({
  plan: z.number(),
  isBundled: z.boolean(),
  prices: z
    .object({
      pro: z.number().optional(),
      enterprise: z.number().optional(),
      currency: z.string().optional(),
    })
    .nullable()
    .optional(),
});
export type WorkspacePlanStatus = z.infer<typeof WorkspacePlanStatusSchema>;

export const WorkspacePlanOrderSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  plan: z.number(),
});
export type WorkspacePlanOrder = z.infer<typeof WorkspacePlanOrderSchema>;

export const WorkspaceMailboxSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  workspaceId: z.string().nullable(),
  address: z.string(),
  name: z.string().nullable(),
  isDefault: z.boolean(),
  isVerified: z.boolean(),
});
export type WorkspaceMailbox = z.infer<typeof WorkspaceMailboxSchema>;

export const WorkspaceMailboxAliasSchema = z.object({
  id: z.string(),
  mailboxId: z.string(),
  customDomainId: z.string(),
  localPart: z.string(),
  address: z.string(),
  name: z.string().nullable(),
});
export type WorkspaceMailboxAlias = z.infer<typeof WorkspaceMailboxAliasSchema>;

export const WorkspaceMailboxForwardingRuleSchema = z.object({
  id: z.string(),
  mailboxId: z.string(),
  aliasId: z.string(),
  destination: z.string(),
});
export type WorkspaceMailboxForwardingRule = z.infer<typeof WorkspaceMailboxForwardingRuleSchema>;

export const WorkspaceMailboxQuotaSchema = z.object({
  workspaceId: z.string(),
  usedBytes: z.number(),
  limitBytes: z.number(),
  remainingBytes: z.number(),
});
export type WorkspaceMailboxQuota = z.infer<typeof WorkspaceMailboxQuotaSchema>;

export const WorkspaceMailboxUsageSchema = z.object({
  workspaceId: z.string(),
  used: z.number(),
  limit: z.number(),
  remaining: z.number(),
});
export type WorkspaceMailboxUsage = z.infer<typeof WorkspaceMailboxUsageSchema>;

export const WorkspaceSendUsagePeriodSchema = z.object({
  limit: z.number(),
  used: z.number(),
  remaining: z.number(),
});
export type WorkspaceSendUsagePeriod = z.infer<typeof WorkspaceSendUsagePeriodSchema>;

export const WorkspaceSendUsageSchema = z.object({
  workspaceId: z.string(),
  daily: WorkspaceSendUsagePeriodSchema,
  monthly: WorkspaceSendUsagePeriodSchema,
});
export type WorkspaceSendUsage = z.infer<typeof WorkspaceSendUsageSchema>;

export const WorkspaceCustomDomainDnsRecordSchema = z.object({
  name: z.string(),
  type: z.string(),
  value: z.string(),
});
export type WorkspaceCustomDomainDnsRecord = z.infer<typeof WorkspaceCustomDomainDnsRecordSchema>;

export const WorkspaceCustomDomainSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  provider: z.string(),
  domain: z.string(),
  verificationStatus: z.string(),
  verifiedForSendingStatus: z.boolean(),
  dkimStatus: z.string(),
  mailFromDomain: z.string(),
  mailFromStatus: z.string(),
  stage: z.enum(["basic", "full", "completed"]),
  dnsRecords: z.array(WorkspaceCustomDomainDnsRecordSchema),
});
export type WorkspaceCustomDomain = z.infer<typeof WorkspaceCustomDomainSchema>;

export const WorkspaceCustomDomainUsageSchema = z.object({
  workspaceId: z.string(),
  used: z.number(),
  limit: z.number(),
  remaining: z.number(),
});
export type WorkspaceCustomDomainUsage = z.infer<typeof WorkspaceCustomDomainUsageSchema>;

export const WorkspaceMailCredentialSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  mailboxId: z.string(),
  label: z.string(),
  protocols: z.array(z.string()),
  createdAt: z.string().nullable(),
});
export type WorkspaceMailCredential = z.infer<typeof WorkspaceMailCredentialSchema>;

export const WorkspaceMailCredentialCreatedSchema = z.object({
  credential: WorkspaceMailCredentialSchema,
  secret: z.string(),
});
export type WorkspaceMailCredentialCreated = z.infer<typeof WorkspaceMailCredentialCreatedSchema>;

export const FlywheelOwnerAppSchema = z.object({
  appId: z.string(),
  retainedRevisionCount: z.number(),
  blobCount: z.number(),
  retainedRevisionCountTotal: z.number(),
  retainedBytes: z.number(),
  lastUpdatedAt: z.string(),
});
export type FlywheelOwnerApp = z.infer<typeof FlywheelOwnerAppSchema>;

export const FlywheelOwnerBlobSchema = z.object({
  blobId: z.string(),
  currentRevision: z.number(),
  retainedRevisionCount: z.number(),
  retainedBytes: z.number(),
  updatedAt: z.string(),
});
export type FlywheelOwnerBlob = z.infer<typeof FlywheelOwnerBlobSchema>;

export const FlywheelStorageQuotaSchema = z.object({
  usedBytes: z.number(),
  budgetBytes: z.number(),
});
export type FlywheelStorageQuota = z.infer<typeof FlywheelStorageQuotaSchema>;

export const FlywheelAuditEntrySchema = z.object({
  appId: z.string(),
  blobId: z.string().nullable(),
  revision: z.number().nullable(),
  action: z.string(),
  actorAccountId: z.string(),
  createdAt: z.string(),
});
export type FlywheelAuditEntry = z.infer<typeof FlywheelAuditEntrySchema>;
