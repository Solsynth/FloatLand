import { z } from "zod";
import { RealmSchema } from "./realm";
import { SnAccountSchema } from "./auth";

export const SnChatMemberSchema = z.object({
  id: z.string(),
  chatRoomId: z.string(),
  accountId: z.string(),
  account: SnAccountSchema,
  nick: z.string().optional(),
  notify: z.number(),
  joinedAt: z.string().optional(),
  lastReadAt: z.string().optional(),
  status: z.string().optional(),
  realmNick: z.string().optional(),
  realmBio: z.string().optional(),
});
export type SnChatMember = z.infer<typeof SnChatMemberSchema>;

export const SnChatRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  type: z.number(),
  realmId: z.string().optional(),
  realm: RealmSchema.nullable().optional(),
  members: z.array(SnChatMemberSchema).optional(),
  background: z.object({ id: z.string() }).optional(),
  picture: z.object({ id: z.string() }).optional(),
  encryptionMode: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().optional(),
});
export type SnChatRoom = z.infer<typeof SnChatRoomSchema>;

// WebSocket packet types
export interface WebSocketPacket {
  type: string
  data?: Record<string, unknown>
  endpoint?: string
  errorMessage?: string
}
