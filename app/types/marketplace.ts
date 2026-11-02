import type { SnCloudFile } from "~/types/drive";

export type LocalizedText = Record<string, string>;

export interface MarketplaceProduct {
  id: string;
  publisherId?: string;
  publisher_id?: string;
  slug: string;
  name: string;
  names?: LocalizedText;
  description?: string;
  descriptions?: LocalizedText;
  icon?: SnCloudFile | null;
  background?: SnCloudFile | null;
  previews?: SnCloudFile[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export type ReleaseStatus = "draft" | "published" | "yanked";

export interface MarketplaceArtifact {
  id: string;
  platform: string;
  architecture: string;
  fileName?: string;
  file_name?: string;
  mimeType?: string;
  mime_type?: string;
  downloadUrl?: string;
  download_url?: string;
  downloadCount?: number;
  download_count?: number;
  expired?: boolean;
}

export interface MarketplaceRelease {
  id: string;
  productId?: string;
  product_id?: string;
  version: string;
  channel?: string;
  channels?: string[];
  releaseNotes?: string;
  release_notes?: string;
  title?: string;
  titles?: LocalizedText;
  metadata?: Record<string, unknown>;
  forceUpdate?: boolean;
  force_update?: boolean;
  descriptions?: LocalizedText;
  attachments?: SnCloudFile[];
  status: ReleaseStatus;
  createdAt?: string;
  created_at?: string;
  publishedAt?: string | null;
  published_at?: string | null;
  downloadCount?: number;
  download_count?: number;
  artifacts?: MarketplaceArtifact[];
}

export interface MarketplaceChannel {
  id: string;
  name: string;
  displayName?: string;
  display_name?: string;
  displayNames?: LocalizedText;
  display_names?: LocalizedText;
  description?: string;
  descriptions?: LocalizedText;
  artifactRetention?: number;
  artifact_retention?: number;
  latest?: MarketplaceRelease | null;
}

export interface MarketplacePublisher {
  id: string;
  name: string;
  nick?: string;
  bio?: { value?: string } | string;
  picture?: SnCloudFile | null;
  background?: SnCloudFile | null;
  accountId?: string;
  account_id?: string;
  rating?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface MarketplaceApp {
  product: MarketplaceProduct;
  publisher: MarketplacePublisher;
  latest: MarketplaceRelease | null;
}

export interface MarketplacePage {
  data: MarketplaceApp[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProductDetail {
  product: MarketplaceProduct;
  publisher: MarketplacePublisher;
  latest: MarketplaceRelease | null;
}
