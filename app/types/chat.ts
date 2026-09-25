import { z } from "zod";
import { RealmSchema } from "./realm";
import { SnAccountSchema } from "./auth";

export const SnChatMemberSchema = z.object({
  id: z.string(),
  chatRoomId: z.string(),
  accountId: z.string(),
  account: SnAccountSchema.nullish(),
  nick: z.string().nullish(),
  notify: z.number().nullish(),
  joinedAt: z.string().nullish(),
  lastReadAt: z.string().nullish(),
  status: z.string().nullish(),
  realmNick: z.string().nullish(),
  realmBio: z.string().nullish(),
  confirmedAt: z.string().nullish(),
});
export type SnChatMember = z.infer<typeof SnChatMemberSchema>;

export const SnChatRoomSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  slug: z.string().nullish(),
  type: z.number(),
  realmId: z.string().nullish(),
  realm: RealmSchema.nullable().optional(),
  members: z.array(SnChatMemberSchema).nullish(),
  background: z.object({ id: z.string() }).nullish(),
  picture: z.object({ id: z.string() }).nullish(),
  encryptionMode: z.number().nullish(),
  isPublic: z.boolean().nullish(),
  isCommunity: z.boolean().nullish(),
  isReadReceiptsPublic: z.boolean().nullish(),
  accountId: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
  deletedAt: z.string().nullish(),
});
export type SnChatRoom = z.infer<typeof SnChatRoomSchema>;

/** Cloud file reference used by message attachments. */
export interface ChatAttachment {
  id: string;
  name?: string;
  mimeType?: string;
}

export const SnChatReactionSchema = z.object({
  id: z.string().nullish(),
  messageId: z.string().nullish(),
  senderId: z.string().nullish(),
  symbol: z.string().nullish(),
  attitude: z.number().nullish(),
  createdAt: z.string().nullish(),
});
export type SnChatReaction = z.infer<typeof SnChatReactionSchema>;

/**
 * A chat message as served by `/messager/chat`. The wire is inconsistent
 * between endpoints (list rows carry a `sender` member, realtime packets a
 * `sender_id`, event rows carry `meta.message_id`), so every field is tolerant
 * and the client normalizes before rendering.
 */
export const SnChatMessageSchema = z.object({
  id: z.string(),
  chatRoomId: z.string().nullish(),
  type: z.string().default("text"),
  content: z.string().nullish(),
  clientMessageId: z.string().nullable().optional(),
  nonce: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).nullish(),
  membersMentioned: z.array(z.string()).nullish(),
  editedAt: z.string().nullable().optional(),
  attachments: z
    .array(z.object({ id: z.string(), name: z.string().optional(), mimeType: z.string().optional() }))
    .nullish(),
  reactions: z.array(SnChatReactionSchema).nullish(),
  reactionsCount: z.record(z.string(), z.number()).nullish(),
  reactionsMade: z.record(z.string(), z.boolean()).nullish(),
  isThreadRoot: z.boolean().nullish(),
  threadRepliesCount: z.number().nullish(),
  repliedMessageId: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
  forwardedMessageId: z.string().nullable().optional(),
  senderId: z.string().nullish(),
  sender: SnChatMemberSchema.nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
  /** Client-side only: pending (optimistic) vs sent. */
  status: z.enum(["pending", "sent", "failed"]).optional(),
});
export type SnChatMessage = z.infer<typeof SnChatMessageSchema>;

export const SnChatSummarySchema = z.object({
  unreadCount: z.number().default(0),
  hasUnread: z.boolean().default(false),
  lastMessage: SnChatMessageSchema.nullable().optional(),
});
export type SnChatSummary = z.infer<typeof SnChatSummarySchema>;

export const SnChatMessagePinSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  chatRoomId: z.string().optional(),
  pinnedByMemberId: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
  message: SnChatMessageSchema.nullable().optional(),
  createdAt: z.string().optional(),
});
export type SnChatMessagePin = z.infer<typeof SnChatMessagePinSchema>;

export const SnChatOnlineStatusAccountSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  nick: z.string().nullable().optional(),
  display: z.string().optional(),
  picture: z.string().nullable().optional(),
});
export type SnChatOnlineStatusAccount = z.infer<typeof SnChatOnlineStatusAccountSchema>;

export const SnChatOnlineStatusSchema = z.object({
  onlineCount: z.number().default(0),
  directMessageStatus: z.string().nullable().optional(),
  onlineUserNames: z.array(z.string()).optional(),
  onlineAccounts: z.array(SnChatOnlineStatusAccountSchema).optional(),
});
export type SnChatOnlineStatus = z.infer<typeof SnChatOnlineStatusSchema>;

export const ThreadReplyNodeSchema = z.object({
  message: SnChatMessageSchema,
  depth: z.number().default(0),
});
export type ThreadReplyNode = z.infer<typeof ThreadReplyNodeSchema>;

export const ThreadReplyListResponseSchema = z.object({
  root: SnChatMessageSchema.nullable().optional(),
  replies: z.array(ThreadReplyNodeSchema).default([]),
});
export type ThreadReplyListResponse = z.infer<typeof ThreadReplyListResponseSchema>;

/** A pending chat invitation (the invite list rows are chat members). */
export type SnChatInvite = SnChatMember;

/** Inbound WebSocket packet shapes (documentation; the runtime reads raw records). */
export interface ChatWsInboundPackets {
  "messages.new": Record<string, unknown>;
  "messages.update": Record<string, unknown>;
  "messages.sync.file": Record<string, unknown>;
  "messages.sync.finalize": Record<string, unknown>;
  "messages.sync.links": Record<string, unknown>;
  "messages.delete": Record<string, unknown>;
  "messages.typing": Record<string, unknown>;
  "messages.read": Record<string, unknown>;
  "messages.reaction.added": Record<string, unknown>;
  "messages.reaction.removed": Record<string, unknown>;
  "messages.pinned": Record<string, unknown>;
  "messages.unpinned": Record<string, unknown>;
  "messages.placeholder.update": Record<string, unknown>;
  "messages.placeholder.finalize": Record<string, unknown>;
  "messages.placeholder.expired": Record<string, unknown>;
  "chat.presence.updated": Record<string, unknown>;
  "chat.presence.activities.updated": Record<string, unknown>;
}

/** Outbound packets (snake_case — the WS proxy passes them through verbatim). */
export interface ChatWsOutboundPackets {
  "messages.subscribe": { chat_room_id: string };
  "messages.unsubscribe": { chat_room_id: string };
  "messages.read": { chat_room_id: string };
  "messages.typing": { chat_room_id: string; ts: number; type: string; progress?: number };
}

// WebSocket packet types
export interface WebSocketPacket {
  type: string
  data?: Record<string, unknown>
  endpoint?: string
  errorMessage?: string
}
