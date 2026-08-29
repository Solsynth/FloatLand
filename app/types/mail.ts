import type { WorkspaceMailbox } from "~/types/workspace";

/** Denormalized DysonFS file snapshot carried by an email attachment. */
export interface PostalCloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  fileMeta?: Record<string, unknown>;
  userMeta?: Record<string, unknown>;
  sensitiveMarks?: number[];
  hasCompression?: boolean;
  width?: number;
  height?: number;
  blurhash?: string;
  usage?: string;
  applicationType?: string;
}

export interface PostalAttachment {
  id: string;
  emailId: string;
  position: number;
  filename: string;
  mimeType: string;
  size: number;
  storageKey?: string;
  file?: PostalCloudFile;
  contentId?: string;
  disposition?: string;
}

/** kind is `to`, `cc`, or `bcc`. */
export interface PostalRecipient {
  id: string;
  emailId: string;
  address: string;
  name: string;
  kind: "to" | "cc" | "bcc" | string;
}

export interface MailLabel {
  id: string;
  accountId: string;
  name: string;
  color: string;
}

/** Server-generated sender-authentication metadata. */
export interface PostalAuth {
  spf?: string;
  dkim?: string;
  score?: number;
  warnings?: string[];
}

export type MailFolder = "inbox" | "sent" | "drafts" | "spam" | "trash" | "archive";

export interface PostalEmail {
  id: string;
  accountId: string;
  mailboxId: string;
  threadId?: string | null;
  subject: string;
  body: string;
  fromAddress: string;
  fromName: string;
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  folder: string;
  contentType: string;
  scheduledAt?: string | null;
  trashedAt?: string | null;
  spamAt?: string | null;
  sentAt?: string | null;
  deliveryStatus: string;
  deliveryAttempts?: number;
  lastDeliveryAttemptAt?: string | null;
  deliveryError?: string | null;
  providerMessageId?: string | null;
  authentication?: PostalAuth | null;
  rawSizeBytes?: number;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  mailbox?: WorkspaceMailbox | null;
  recipients?: PostalRecipient[];
  attachments?: PostalAttachment[];
  labels?: MailLabel[];
}

export interface MailStats {
  total: number;
  unread: number;
  starred: number;
  drafts: number;
  deliveryStatus: Record<string, number>;
}

export interface ThreadSummary {
  id: string;
  mailboxId: string;
  subject: string;
  latestAt: string;
  messageCount: number;
  unreadCount: number;
  participants: string[];
  latestMessage: PostalEmail;
}

export interface BlockRule {
  id: string;
  workspaceId?: string | null;
  mailboxId?: string | null;
  pattern: string;
  matchType: "address" | "domain" | string;
  createdAt: string;
}

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
