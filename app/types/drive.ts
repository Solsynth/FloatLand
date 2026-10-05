import { z } from "zod";

export interface SnCloudFile {
  id: string;
  name: string;
  description: string | null;
  mimeType: string;
  size: number;
  hash: string | null;
  isFolder: boolean;
  indexed: boolean;
  isMarkedRecycle: boolean;
  parentId: string | null;
  objectId: string | null;
  /** Legacy field: the drive service no longer sends `storageId`. */
  storageId?: string | null;
  storageUrl: string | null;
  /** Legacy field: the drive service no longer sends `poolId`. */
  poolId?: string | null;
  usage: string | null;
  applicationType: string | null;
  /** Legacy image fields: the service reports these via `fileMeta` instead. */
  ratio?: number | null;
  blurhash?: string | null;
  childrenCount: number;
  /** Omitted when empty on the wire; the schema normalizes it to `[]`. */
  children: SnCloudFile[];
  /** Sensitive-mark enum ordinals, as emitted by the drive service. */
  sensitiveMarks: number[];
  /** `null` when the file carries no user metadata; normalized to `{}`. */
  userMeta: Record<string, unknown>;
  /** `null` until the file is analyzed; normalized to `{}`. */
  fileMeta: { width?: number; height?: number } & Record<string, unknown>;
  hasCompression: boolean;
  hasThumbnail: boolean;
  permissionStatus: {
    readable: boolean;
    writable: boolean;
    manageable: boolean;
    visibility: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  expiredAt: string | null;
}

/**
 * The drive service serializes empty `user_meta`/`file_meta` as `null`; the
 * frontend treats both as dictionaries, so normalize `null` to `{}` at the
 * boundary instead of leaking nullable metadata into every consumer.
 */
const DriveMetaMapSchema = z.preprocess(
  (value) => value ?? {},
  z.record(z.string(), z.unknown()),
);

const DriveFileMetaSchema = z.preprocess(
  (value) => value ?? {},
  z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .catchall(z.unknown()),
);

export const SnCloudFileSchema: z.ZodType<SnCloudFile> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    mimeType: z.string(),
    size: z.number(),
    hash: z.string().nullable(),
    isFolder: z.boolean(),
    indexed: z.boolean(),
    isMarkedRecycle: z.boolean(),
    parentId: z.string().nullable(),
    objectId: z.string().nullable(),
    storageId: z.string().nullish(),
    storageUrl: z.string().nullable(),
    poolId: z.string().nullish(),
    usage: z.string().nullable(),
    applicationType: z.string().nullable(),
    ratio: z.number().nullish(),
    blurhash: z.string().nullish(),
    childrenCount: z.number(),
    // `children` is `omitempty` upstream: absent unless the caller expanded it.
    children: z.array(SnCloudFileSchema).default([]),
    sensitiveMarks: z.array(z.number()),
    userMeta: DriveMetaMapSchema,
    fileMeta: DriveFileMetaSchema,
    hasCompression: z.boolean(),
    hasThumbnail: z.boolean(),
    permissionStatus: z
      .object({
        readable: z.boolean(),
        writable: z.boolean(),
        manageable: z.boolean(),
        visibility: z.string(),
      })
      .nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
    expiredAt: z.string().nullable(),
  }),
);

export const SnFilePoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  // The drive service exposes pool ownership as `account_id`, never `owner_id`.
  accountId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SnFilePool = z.infer<typeof SnFilePoolSchema>;

export const DriveUsageSchema = z.object({
  totalUsageBytes: z.number(),
  totalFileCount: z.number(),
  totalQuota: z.number(),
  usedQuota: z.number(),
  // The drive service reports usage per account, not per pool: it never sends
  // `pool_usages`, so the breakdown is optional and normally absent.
  poolUsages: z
    .array(
      z.object({
        poolId: z.string(),
        poolName: z.string(),
        usageBytes: z.number(),
        fileCount: z.number(),
      }),
    )
    .optional(),
});
export type DriveUsage = z.infer<typeof DriveUsageSchema>;

export const SnStorageNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  machineId: z.string(),
  endpoint: z.string(),
  status: z.string(),
  lastSeenAt: z.string().nullable(),
  poolId: z.string().nullable(),
  accountId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SnStorageNode = z.infer<typeof SnStorageNodeSchema>;

export interface CreateDriveNodePayload {
  name: string
  machineId: string
  endpoint: string
  authToken: string
  pool: {
    name: string
    description?: string
    bucket: string
    accessKey: string
    secretKey: string
    enableSigned: boolean
    isHidden?: boolean
  }
}

export const CreateDriveNodeResponseSchema = z.object({
  node: SnStorageNodeSchema,
  poolId: z.string(),
});
export type CreateDriveNodeResponse = z.infer<typeof CreateDriveNodeResponseSchema>;

export interface UpdateDriveNodePayload {
  name?: string
  poolName?: string
}

// QuotaSummary: basedQuota/extraQuota/totalQuota. The service reports consumed
// quota as `used_quota` on the usage endpoint, not here, so there is no
// `usedQuota` field.
export const DriveQuotaSchema = z.object({
  basedQuota: z.number(),
  extraQuota: z.number(),
  totalQuota: z.number(),
});
export type DriveQuota = z.infer<typeof DriveQuotaSchema>;

export interface FileListItem {
  type: "file" | "folder";
  file: SnCloudFile;
}

export const DriveFilePermissionSchema = z.object({
  id: z.string(),
  fileId: z.string(),
  accountId: z.string(),
  permission: z.number(),
  createdAt: z.string(),
});
export type DriveFilePermission = z.infer<typeof DriveFilePermissionSchema>;

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
}
