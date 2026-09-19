import { z } from "zod";
import { FileAttachmentSchema } from "./post";
import { SnAccountSchema } from "./auth";

export const RealmSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  picture: FileAttachmentSchema.nullable(),
  background: FileAttachmentSchema.nullable(),
  isPublic: z.boolean(),
  isCommunity: z.boolean(),
  boostPoints: z.number(),
  boostLevel: z.number(),
  verification: z
    .object({
      type: z.number(),
      title: z.string().nullable(),
      description: z.string().nullable(),
      verifiedBy: z.string().nullable(),
    })
    .nullable(),
});
export type Realm = z.infer<typeof RealmSchema>;

export const RealmLabelSchema = z.object({
  id: z.string(),
  realmId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  createdAt: z.string(),
});
export type RealmLabel = z.infer<typeof RealmLabelSchema>;

export const RealmMemberSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  realmId: z.string(),
  role: z.number(),
  nick: z.string().nullable(),
  bio: z.string().nullable(),
  labelId: z.string().nullable(),
  level: z.number(),
  experience: z.number(),
  levelingProgress: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  account: SnAccountSchema.optional(),
  label: RealmLabelSchema.optional(),
  realm: RealmSchema.optional(),
});
export type RealmMember = z.infer<typeof RealmMemberSchema>;

export const RealmBoostStatusSchema = z.object({
  boostPoints: z.number(),
  boostLevel: z.number(),
  labelCap: z.number(),
  expiresAfterDays: z.number(),
  supportedCurrencies: z.array(z.string()),
  defaultCurrency: z.string(),
});
export type RealmBoostStatus = z.infer<typeof RealmBoostStatusSchema>;

export const RealmBoostLeaderboardEntrySchema = z.object({
  accountId: z.string(),
  totalPoints: z.number(),
  account: SnAccountSchema.optional(),
});
export type RealmBoostLeaderboardEntry = z.infer<typeof RealmBoostLeaderboardEntrySchema>;

export const RealmInviteSchema = z.object({
  id: z.string(),
  realmId: z.string(),
  accountId: z.string(),
  role: z.number(),
  invitedBy: z.string(),
  createdAt: z.string(),
  realm: RealmSchema.optional(),
  invitedByAccount: SnAccountSchema.optional(),
});
export type RealmInvite = z.infer<typeof RealmInviteSchema>;
