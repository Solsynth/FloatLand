import type {
  DistributionChannel,
  DistributionLocalizedText,
  DistributionMetadata,
  DistributionMetrics,
  DistributionProduct,
  DistributionRelease,
  DistributionUpdateCheck,
  DistributionUpdateCheckInput,
  DistributionUpload,
  DistributionUploadApiKey,
  DistributionCreatedUploadApiKey,
} from "~/types/distribution";
import { apiFetch, safeJsonParse, API_BASE_URL } from "~/utils/api";

export const DISTRIBUTION_SERVICE_NAME = "dist";

function distributionPath(path: string) {
  return `/${DISTRIBUTION_SERVICE_NAME}${path}`;
}

/**
 * Resolve an artifact download URL for the browser.
 * DistributionCenter returns a service-relative path (`/artifacts/{id}/download`)
 * or an absolute URL when a download base URL is configured. Relative paths
 * must go through the gateway service prefix to hit the download endpoint.
 */
export function distributionDownloadUrl(downloadUrl: string): string {
  if (!downloadUrl) return "";
  if (/^https?:\/\//i.test(downloadUrl)) return downloadUrl;
  if (downloadUrl.startsWith("/")) {
    return `${API_BASE_URL}${distributionPath(downloadUrl)}`;
  }
  return downloadUrl;
}

export function localizedDistributionText(
  values: DistributionLocalizedText | undefined,
  fallback: string,
  locales: readonly string[],
) {
  const entries = Object.entries(values || {}).filter(([, value]) =>
    value.trim(),
  );
  if (!entries.length) return fallback;

  const normalizedEntries = entries.map(
    ([locale, value]) =>
      [locale.trim().replaceAll("_", "-").toLowerCase(), value] as const,
  );
  for (const locale of locales) {
    const normalizedLocale = locale.trim().replaceAll("_", "-").toLowerCase();
    const exact = normalizedEntries.find(([key]) => key === normalizedLocale);
    if (exact) return exact[1];
  }

  for (const locale of locales) {
    const language = locale
      .trim()
      .replaceAll("_", "-")
      .toLowerCase()
      .split("-")[0];
    const languageMatch = normalizedEntries.find(
      ([key]) => key.split("-")[0] === language,
    );
    if (languageMatch) return languageMatch[1];
  }

  return entries[0][1] || fallback;
}
export async function fetchDistributionProducts(
  publisherName: string,
): Promise<DistributionProduct[]> {
  const response = await apiFetch(
    distributionPath(
      `/publishers/${encodeURIComponent(publisherName)}/products`,
    ),
  );
  const payload = await safeJsonParse<{ data: DistributionProduct[] }>(
    response,
  );
  return payload.data ?? [];
}

export interface DistributionProductInput {
  slug: string;
  name: string;
  names?: DistributionLocalizedText;
  description?: string;
  descriptions?: DistributionLocalizedText;
}

export async function createDistributionProduct(
  publisherName: string,
  input: DistributionProductInput,
): Promise<DistributionProduct> {
  const response = await apiFetch(
    distributionPath(
      `/publishers/${encodeURIComponent(publisherName)}/products`,
    ),
    { method: "POST", body: JSON.stringify(input) },
  );
  return safeJsonParse<DistributionProduct>(response);
}
export async function updateDistributionProduct(
  productId: string,
  input: DistributionProductInput,
): Promise<DistributionProduct> {
  const response = await apiFetch(
    distributionPath(`/products/${encodeURIComponent(productId)}`),
    { method: "PUT", body: JSON.stringify(input) },
  );
  return safeJsonParse<DistributionProduct>(response);
}
export async function deleteDistributionProduct(productId: string) {
  await apiFetch(
    distributionPath(`/products/${encodeURIComponent(productId)}`),
    { method: "DELETE" },
  );
}


function uploadApiKeysPath(productId: string, keyId?: string) {
  const suffix = keyId ? `/${encodeURIComponent(keyId)}` : "";
  return distributionPath(
    `/products/${encodeURIComponent(productId)}/upload-api-keys${suffix}`,
  );
}

export async function fetchDistributionUploadApiKeys(
  productId: string,
): Promise<DistributionUploadApiKey[]> {
  const response = await apiFetch(uploadApiKeysPath(productId));
  const payload = await safeJsonParse<
    DistributionUploadApiKey[] | { data?: DistributionUploadApiKey[] }
  >(response);
  return Array.isArray(payload) ? payload : (payload.data ?? []);
}

export async function createDistributionUploadApiKey(
  productId: string,
  name: string,
): Promise<DistributionCreatedUploadApiKey> {
  const response = await apiFetch(uploadApiKeysPath(productId), {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return safeJsonParse<DistributionCreatedUploadApiKey>(response);
}

export async function deleteDistributionUploadApiKey(
  productId: string,
  keyId: string,
) {
  await apiFetch(uploadApiKeysPath(productId, keyId), { method: "DELETE" });
}

export async function fetchDistributionChannels(
  productId: string,
): Promise<DistributionChannel[]> {
  const response = await apiFetch(
    distributionPath(`/products/${encodeURIComponent(productId)}/channels`),
  );
  const payload = await safeJsonParse<{ data: DistributionChannel[] }>(
    response,
  );
  return payload.data ?? [];
}

export async function fetchDistributionReleases(
  productId: string,
  channel: string,
): Promise<DistributionRelease[]> {
  const params = new URLSearchParams({ channel, limit: "100", offset: "0" });
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/releases?${params}`,
    ),
  );
  const payload = await safeJsonParse<{ data: DistributionRelease[] }>(
    response,
  );
  return payload.data ?? [];
}

export async function fetchDistributionManagedReleases(
  productId: string,
  channel: string,
): Promise<DistributionRelease[]> {
  const params = new URLSearchParams({ channel, limit: "100", offset: "0" });
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/releases/manage?${params}`,
    ),
  );
  const payload = await safeJsonParse<{ data: DistributionRelease[] }>(
    response,
  );
  return payload.data ?? [];
}

export async function createDistributionChannel(
  productId: string,
  input: {
    name: string;
    displayName?: string;
    displayNames?: DistributionLocalizedText;
    description?: string;
    descriptions?: DistributionLocalizedText;
    artifactRetention?: number | null;
  },
): Promise<DistributionChannel> {
  const response = await apiFetch(
    distributionPath(`/products/${encodeURIComponent(productId)}/channels`),
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        display_name: input.displayName,
        display_names: input.displayNames,
        description: input.description,
        descriptions: input.descriptions,
        artifact_retention: input.artifactRetention,
      }),
    },
  );
  return safeJsonParse<DistributionChannel>(response);
}

export async function updateDistributionChannel(
  productId: string,
  channelId: string,
  input: {
    displayName?: string;
    displayNames?: DistributionLocalizedText;
    description?: string;
    descriptions?: DistributionLocalizedText;
    artifactRetention?: number | null;
  },
): Promise<DistributionChannel> {
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/channels/${encodeURIComponent(channelId)}`,
    ),
    {
      method: "PUT",
      body: JSON.stringify({
        display_name: input.displayName,
        display_names: input.displayNames,
        description: input.description,
        descriptions: input.descriptions,
        artifact_retention: input.artifactRetention,
      }),
    },
  );
  return safeJsonParse<DistributionChannel>(response);
}
export async function deleteDistributionChannel(
  productId: string,
  channelId: string,
) {
  await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/channels/${encodeURIComponent(channelId)}`,
    ),
    { method: "DELETE" },
  );
}


export async function prepareDistributionUpload(
  productId: string,
  input: { fileName: string; mimeType: string },
): Promise<DistributionUpload> {
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/artifacts/upload-url`,
    ),
    {
      method: "POST",
      body: JSON.stringify({
        file_name: input.fileName,
        mime_type: input.mimeType,
      }),
    },
  );
  return safeJsonParse<DistributionUpload>(response);
}

export async function uploadDistributionArtifact(
  upload: DistributionUpload,
  file: File,
  mimeType: string,
  hash: string,
) {
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType || file.type || "application/octet-stream",
      "x-amz-meta-sha256": hash,
    },
    body: file,
  });
  if (!response.ok)
    throw new Error(`Artifact upload failed (${response.status})`);
}
export async function associateDistributionArtifact(
  productId: string,
  releaseId: string,
  input: {
    objectKey?: string;
    downloadUrl?: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
    hash?: string;
    platform: string;
    architecture: string;
    slug?: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/releases/${encodeURIComponent(releaseId)}/artifacts`,
    ),
    {
      method: "POST",
      body: JSON.stringify({
        object_key: input.objectKey,
        download_url: input.downloadUrl,
        file_name: input.fileName,
        mime_type: input.mimeType,
        size: input.size,
        hash: input.hash,
        platform: input.platform,
        architecture: input.architecture,
        slug: input.slug,
        meta: input.meta,
      }),
    },
  );
}

export async function createDistributionRelease(
  productId: string,
  input: {
    version: string;
    title?: string;
    titles?: DistributionLocalizedText;
    channels: string[];
    releaseNotes?: string;
    descriptions?: DistributionLocalizedText;
    metadata?: DistributionMetadata;
    forceUpdate?: boolean;
    artifacts?: Array<{
      objectKey: string;
      platform: string;
      architecture: string;
    }>;
  },
): Promise<DistributionRelease> {
  const body: Record<string, unknown> = {
    version: input.version,
    title: input.title,
    titles: input.titles,
    channels: input.channels,
    release_notes: input.releaseNotes,
    descriptions: input.descriptions,
    metadata: input.metadata,
    force_update: input.forceUpdate,
  };
  if (input.artifacts?.length) {
    body.artifacts = input.artifacts.map((artifact) => ({
      object_key: artifact.objectKey,
      platform: artifact.platform,
      architecture: artifact.architecture,
    }));
  }
  const response = await apiFetch(
    distributionPath(`/products/${encodeURIComponent(productId)}/releases`),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return safeJsonParse<DistributionRelease>(response);
}
export async function updateDistributionRelease(
  productId: string,
  releaseId: string,
  input: {
    version: string;
    title?: string;
    titles?: DistributionLocalizedText;
    channels: string[];
    releaseNotes?: string;
    descriptions?: DistributionLocalizedText;
    metadata?: DistributionMetadata;
    forceUpdate?: boolean;
  },
): Promise<DistributionRelease> {
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/releases/${encodeURIComponent(releaseId)}`,
    ),
    {
      method: "PUT",
      body: JSON.stringify({
        version: input.version,
        title: input.title,
        titles: input.titles,
        channels: input.channels,
        release_notes: input.releaseNotes,
        descriptions: input.descriptions,
        metadata: input.metadata,
        force_update: input.forceUpdate,
      }),
    },
  );
  return safeJsonParse<DistributionRelease>(response);
}

export async function deleteDistributionRelease(
  productId: string,
  releaseId: string,
) {
  await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/releases/${encodeURIComponent(releaseId)}`,
    ),
    { method: "DELETE" },
  );
}
export async function yankDistributionRelease(
  productId: string,
  releaseId: string,
): Promise<DistributionRelease> {
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/releases/${encodeURIComponent(releaseId)}/yank`,
    ),
    { method: "POST" },
  );
  return safeJsonParse<DistributionRelease>(response);
}
async function postDistributionUpdate(
  endpoint: string,
  input: DistributionUpdateCheckInput,
): Promise<DistributionUpdateCheck> {
  const response = await apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify({
      version: input.version,
      channel: input.channel,
      platform: input.platform,
      architecture: input.architecture,
      installation_id: input.installationId,
      os_version: input.osVersion,
      locale: input.locale,
    }),
  });
  const payload = await safeJsonParse<Record<string, unknown>>(response);
  return {
    updateAvailable: Boolean(
      payload.update_available ?? payload.updateAvailable,
    ),
    currentVersion: String(
      payload.current_version ?? payload.currentVersion ?? input.version,
    ),
    release: (payload.release ??
      payload.new_release ??
      payload.newRelease ??
      null) as DistributionRelease | null,
  };
}

export function checkDistributionProductUpdate(
  productId: string,
  input: DistributionUpdateCheckInput,
) {
  return postDistributionUpdate(
    distributionPath(`/products/${encodeURIComponent(productId)}/update/check`),
    input,
  );
}

export function requestDistributionProductUpdate(
  productId: string,
  input: DistributionUpdateCheckInput,
) {
  return postDistributionUpdate(
    distributionPath(`/products/${encodeURIComponent(productId)}/update`),
    input,
  );
}

export function checkDistributionAppUpdate(
  appId: string,
  input: DistributionUpdateCheckInput,
) {
  return postDistributionUpdate(
    distributionPath(`/apps/${encodeURIComponent(appId)}/update/check`),
    input,
  );
}

export function requestDistributionAppUpdate(
  appId: string,
  input: DistributionUpdateCheckInput,
) {
  return postDistributionUpdate(
    distributionPath(`/apps/${encodeURIComponent(appId)}/update`),
    input,
  );
}

export async function publishDistributionRelease(
  productId: string,
  releaseId: string,
): Promise<DistributionRelease> {
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/releases/${encodeURIComponent(releaseId)}/publish`,
    ),
    { method: "POST" },
  );
  return safeJsonParse<DistributionRelease>(response);
}

export async function fetchDistributionMetrics(
  productId: string,
  from?: string,
  to?: string,
): Promise<DistributionMetrics> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  const response = await apiFetch(
    distributionPath(
      `/products/${encodeURIComponent(productId)}/metrics${query ? `?${query}` : ""}`,
    ),
  );
  return safeJsonParse<DistributionMetrics>(response);
}
