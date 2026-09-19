import { z } from "zod";

export const FileAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  mimeType: z.string(),
  hasCompression: z.boolean(),
  hasThumbnail: z.boolean(),
  fileMeta: z.record(z.string(), z.unknown()),
});
export type FileAttachment = z.infer<typeof FileAttachmentSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  bio: z.string().nullable(),
  picture: FileAttachmentSchema.nullable(),
  background: FileAttachmentSchema.nullable(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  nick: z.string().nullable(),
  profile: ProfileSchema.nullable(),
});
export type Account = z.infer<typeof AccountSchema>;

export const PublisherSchema = z.object({
  id: z.string(),
  name: z.string(),
  nick: z.string().nullable(),
  bio: z.string().nullable(),
  picture: FileAttachmentSchema.nullable(),
  background: FileAttachmentSchema.nullable(),
  verification: z
    .object({
      type: z.number(),
      title: z.string().nullable(),
      description: z.string().nullable(),
      verifiedBy: z.string().nullable(),
    })
    .nullable(),
  account: AccountSchema.nullable(),
  stat: z
    .object({
      totalPosts: z.number(),
      totalSubscribers: z.number(),
      totalViews: z.number(),
    })
    .optional(),
  createdAt: z.string(),
});
export type Publisher = z.infer<typeof PublisherSchema>;

export const TagSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});
export type Tag = z.infer<typeof TagSchema>;

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
});
export type Category = z.infer<typeof CategorySchema>;

export interface Post {
  id: string
  title: string | null
  description: string | null
  content: string
  contentType: number
  publishedAt: string
  visibility: number
  boostCount: number
  upvotes: number
  downvotes: number
  repliesCount: number
  reactionsCount: Record<string, number>
  reactionsMade: Record<string, boolean> | null
  viewsUnique: number
  viewsTotal: number
  isTruncated: boolean
  publisher: Publisher
  attachments: FileAttachment[]
  tags: Tag[]
  repliedPost: Post | null
  forwardedPost: Post | null
  meta?: {
    embeds?: unknown[]
    [key: string]: unknown
  } | null
  metadata?: {
    embeds?: unknown[]
    [key: string]: unknown
  } | null
  resourceIdentifier: string
  createdAt: string
  editedAt: string | null
  updatedAt: string
  type?: number
}

export const PostSchema: z.ZodType<Post> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    content: z.string(),
    contentType: z.number(),
    publishedAt: z.string(),
    visibility: z.number(),
    boostCount: z.number(),
    upvotes: z.number(),
    downvotes: z.number(),
    repliesCount: z.number(),
    reactionsCount: z.record(z.string(), z.number()),
    reactionsMade: z.record(z.string(), z.boolean()).nullable(),
    viewsUnique: z.number(),
    viewsTotal: z.number(),
    isTruncated: z.boolean(),
    publisher: PublisherSchema,
    attachments: z.array(FileAttachmentSchema),
    tags: z.array(TagSchema),
    repliedPost: PostSchema.nullable(),
    forwardedPost: PostSchema.nullable(),
    meta: z
      .object({ embeds: z.array(z.unknown()).optional() })
      .catchall(z.unknown())
      .nullable()
      .optional(),
    metadata: z
      .object({ embeds: z.array(z.unknown()).optional() })
      .catchall(z.unknown())
      .nullable()
      .optional(),
    resourceIdentifier: z.string(),
    createdAt: z.string(),
    editedAt: z.string().nullable(),
    updatedAt: z.string(),
    type: z.number().optional(),
  }),
);

// Timeline types
export const SnTimelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  resourceIdentifier: z.string(),
  data: z.unknown(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});
export type SnTimelineEvent = z.infer<typeof SnTimelineEventSchema>;

export interface SnPresenceActivity {
  id: string
  type: number
  manualId: string | null
  title: string | null
  subtitle: string | null
  caption: string | null
  titleUrl: string | null
  subtitleUrl: string | null
  smallImage: string | null
  largeImage: string | null
  meta: Record<string, unknown> | null
  leaseMinutes: number
  leaseExpiresAt: string
  accountId: string
  account?: Account | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export enum SnAccountStatusType {
  defaultType = 0,
  busy = 1,
  doNotDisturb = 2,
  invisible = 3,
}

export interface SnAccountStatus {
  id: string
  accountId: string
  type: SnAccountStatusType
  isOnline: boolean
  isIdleOrOnline: boolean
  isInvisible: boolean
  isAutomated: boolean
  label: string | null
  symbol: string | null
  attitude: number
  account?: Account | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SnWebArticle {
  id: string
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  author: string | null
  publishedAt: string | null
  createdAt: string
}

export interface DiscoveryItem {
  type: string
  data: Record<string, unknown>
  rank?: string
  reasons?: string[]
  score?: number
}

export interface DiscoveryData {
  items: DiscoveryItem[]
  kind?: string
}

export const TimelineResultSchema = z.object({
  items: z.array(SnTimelineEventSchema).default([]),
  nextCursor: z.string().nullable().default(null),
  mode: z.string().default("personalized"),
});
export type TimelineResult = z.infer<typeof TimelineResultSchema>;

/** Raw threaded-reply node from the API (normalized by fetchPostRepliesThreaded). */
export const ThreadedReplyNodeSchema = z.object({
  post: PostSchema,
  depth: z.number().optional(),
  parentId: z.string().nullable().optional(),
});

/** Client-side normalized threaded-reply node. */
export interface ThreadedReplyNode {
  post: Post;
  depth: number;
  parentId: string | null;
}

export const ReactionSchema = z.object({
  symbol: z.string(),
  attitude: z.number(),
  count: z.number(),
});
export type Reaction = z.infer<typeof ReactionSchema>;

const ReactionAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  nick: z.string(),
  profile: z.object({ picture: z.object({ id: z.string() }).optional() }),
});

export const PostReactionSchema = z.object({
  id: z.string(),
  postId: z.string(),
  symbol: z.string(),
  attitude: z.number(),
  accountId: z.string().optional(),
  actorId: z.string().optional(),
  account: ReactionAccountSchema.optional(),
  createdAt: z.string(),
});
export type PostReaction = z.infer<typeof PostReactionSchema>;

export const BoostSchema = z.object({
  id: z.string(),
  postId: z.string(),
  accountId: z.string().optional(),
  actorId: z.string().optional(),
  account: ReactionAccountSchema.optional(),
  boostedAt: z.string(),
});
export type Boost = z.infer<typeof BoostSchema>;

export const PublisherSubscriptionStatusSchema = z.object({
  status: z.enum(["none", "pending", "following", "subscribed"]),
  isPending: z.boolean(),
  subscription: z
    .object({
      isActive: z.boolean(),
      notify: z.boolean(),
    })
    .optional(),
});
export type PublisherSubscriptionStatus = z.infer<typeof PublisherSubscriptionStatusSchema>;

/** Publisher activity heatmap (GET /sphere/publishers/{name}/heatmap). */
export const HeatmapDataSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  data: z.record(z.string(), z.number()),
});
export type HeatmapData = z.infer<typeof HeatmapDataSchema>;
