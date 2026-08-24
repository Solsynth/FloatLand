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

export interface SnFilePool {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveUsage {
  totalUsageBytes: number;
  totalFileCount: number;
  totalQuota: number;
  usedQuota: number;
  poolUsages: Array<{
    poolId: string;
    poolName: string;
    usageBytes: number;
    fileCount: number;
  }>;
}

export interface SnStorageNode {
  id: string
  name: string
  machineId: string
  endpoint: string
  status: string
  lastSeenAt: string | null
  poolId: string | null
  accountId: string
  createdAt: string
  updatedAt: string
}

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

export interface CreateDriveNodeResponse {
  node: SnStorageNode
  poolId: string
}

export interface UpdateDriveNodePayload {
  name?: string
  poolName?: string
}

export interface DriveQuota {
  basedQuota: number;
  extraQuota: number;
  totalQuota: number;
  usedQuota: number;
}

export interface FileListItem {
  type: "file" | "folder";
  file: SnCloudFile;
}

export interface DriveFilePermission {
  id: string;
  fileId: string;
  accountId: string;
  permission: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
}
