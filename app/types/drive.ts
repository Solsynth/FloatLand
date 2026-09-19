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
  storageId: string | null;
  storageUrl: string | null;
  poolId: string | null;
  usage: string | null;
  applicationType: string | null;
  ratio: number | null;
  blurhash: string | null;
  childrenCount: number;
  children: SnCloudFile[];
  sensitiveMarks: string[];
  userMeta: Record<string, unknown>;
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
    storageId: z.string().nullable(),
    storageUrl: z.string().nullable(),
    poolId: z.string().nullable(),
    usage: z.string().nullable(),
    applicationType: z.string().nullable(),
    ratio: z.number().nullable(),
    blurhash: z.string().nullable(),
    childrenCount: z.number(),
    children: z.array(SnCloudFileSchema),
    sensitiveMarks: z.array(z.string()),
    userMeta: z.record(z.string(), z.unknown()),
    fileMeta: z
      .object({
        width: z.number().optional(),
        height: z.number().optional(),
      })
      .catchall(z.unknown()),
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
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SnFilePool = z.infer<typeof SnFilePoolSchema>;

export const DriveUsageSchema = z.object({
  totalUsageBytes: z.number(),
  totalFileCount: z.number(),
  totalQuota: z.number(),
  usedQuota: z.number(),
  poolUsages: z.array(
    z.object({
      poolId: z.string(),
      poolName: z.string(),
      usageBytes: z.number(),
      fileCount: z.number(),
    }),
  ),
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

export const DriveQuotaSchema = z.object({
  basedQuota: z.number(),
  extraQuota: z.number(),
  totalQuota: z.number(),
  usedQuota: z.number(),
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
