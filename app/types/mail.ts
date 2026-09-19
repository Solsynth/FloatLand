import { z } from "zod";
import { WorkspaceMailboxSchema } from "./workspace";

/** Denormalized DysonFS file snapshot carried by an email attachment. */
export const PostalCloudFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string().optional(),
  fileMeta: z.record(z.string(), z.unknown()).optional(),
  userMeta: z.record(z.string(), z.unknown()).optional(),
  sensitiveMarks: z.array(z.number()).optional(),
  hasCompression: z.boolean().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  blurhash: z.string().optional(),
  usage: z.string().optional(),
  applicationType: z.string().optional(),
});
export type PostalCloudFile = z.infer<typeof PostalCloudFileSchema>;

export const PostalAttachmentSchema = z.object({
  id: z.string(),
  emailId: z.string(),
  position: z.number(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  storageKey: z.string().optional(),
  file: PostalCloudFileSchema.optional(),
  contentId: z.string().optional(),
  disposition: z.string().optional(),
});
export type PostalAttachment = z.infer<typeof PostalAttachmentSchema>;

/** kind is `to`, `cc`, or `bcc`. */
export const PostalRecipientSchema = z.object({
  id: z.string(),
  emailId: z.string(),
  address: z.string(),
  name: z.string(),
  kind: z.string(),
});
export type PostalRecipient = z.infer<typeof PostalRecipientSchema>;

export const MailLabelSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string(),
  color: z.string(),
});
export type MailLabel = z.infer<typeof MailLabelSchema>;

/** Server-generated sender-authentication metadata. */
export const PostalAuthSchema = z.object({
  spf: z.string().optional(),
  dkim: z.string().optional(),
  score: z.number().optional(),
  warnings: z.array(z.string()).optional(),
});
export type PostalAuth = z.infer<typeof PostalAuthSchema>;

export type MailFolder = "inbox" | "sent" | "drafts" | "spam" | "trash" | "archive";

export const PostalEmailSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  mailboxId: z.string(),
  threadId: z.string().nullable().optional(),
  subject: z.string(),
  body: z.string(),
  fromAddress: z.string(),
  fromName: z.string(),
  isRead: z.boolean(),
  isStarred: z.boolean(),
  isDraft: z.boolean(),
  folder: z.string(),
  contentType: z.string(),
  scheduledAt: z.string().nullable().optional(),
  trashedAt: z.string().nullable().optional(),
  spamAt: z.string().nullable().optional(),
  sentAt: z.string().nullable().optional(),
  deliveryStatus: z.string(),
  deliveryAttempts: z.number().optional(),
  lastDeliveryAttemptAt: z.string().nullable().optional(),
  deliveryError: z.string().nullable().optional(),
  providerMessageId: z.string().nullable().optional(),
  authentication: PostalAuthSchema.nullable().optional(),
  rawSizeBytes: z.number().optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  mailbox: WorkspaceMailboxSchema.nullable().optional(),
  recipients: z.array(PostalRecipientSchema).optional(),
  attachments: z.array(PostalAttachmentSchema).optional(),
  labels: z.array(MailLabelSchema).optional(),
});
export type PostalEmail = z.infer<typeof PostalEmailSchema>;

export const MailStatsSchema = z.object({
  total: z.number(),
  unread: z.number(),
  starred: z.number(),
  drafts: z.number(),
  deliveryStatus: z.record(z.string(), z.number()),
});
export type MailStats = z.infer<typeof MailStatsSchema>;

export const ThreadSummarySchema = z.object({
  id: z.string(),
  mailboxId: z.string(),
  subject: z.string(),
  latestAt: z.string(),
  messageCount: z.number(),
  unreadCount: z.number(),
  participants: z.array(z.string()),
  latestMessage: PostalEmailSchema,
});
export type ThreadSummary = z.infer<typeof ThreadSummarySchema>;

export const BlockRuleSchema = z.object({
  id: z.string(),
  workspaceId: z.string().nullable().optional(),
  mailboxId: z.string().nullable().optional(),
  pattern: z.string(),
  matchType: z.string(),
  createdAt: z.string(),
});
export type BlockRule = z.infer<typeof BlockRuleSchema>;

export interface EmailRecipientInput {
  address: string;
  name?: string;
}

export interface SendEmailPayload {
  mailboxId: string;
  fromAliasId?: string;
  threadId?: string;
  replyToId?: string;
  to: EmailRecipientInput[];
  cc: EmailRecipientInput[];
  bcc: EmailRecipientInput[];
  subject: string;
  body: string;
  contentType?: string;
  attachmentIds: string[];
  isDraft?: boolean;
}
