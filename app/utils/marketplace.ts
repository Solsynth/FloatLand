import type {
  MarketplaceArtifact,
  MarketplaceChannel,
  MarketplacePage,
  MarketplaceProduct,
  MarketplacePublisher,
  MarketplaceRelease,
  ProductDetail,
  LocalizedText,
} from "~/types/marketplace";
import { apiFetch } from "~/utils/api";

// ── API Functions ──

export interface MarketplaceQueryParams {
  sort?: "updated_at" | "name" | "created_at" | string;
  order?: "desc" | "asc" | string;
  limit?: number;
  offset?: number;
}

export async function fetchMarketplaceApps(
  query: MarketplaceQueryParams = {},
): Promise<MarketplacePage> {
  const params = new URLSearchParams();
  if (query.sort) params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.offset != null) params.set("offset", String(query.offset));

  const qs = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`/dist/marketplace/apps${qs}`, {
    skipAuth: true,
  });

  if (!response.ok) {
    throw new Error(`Failed to load marketplace apps (${response.status})`);
  }

  const result = (await response.json()) as MarketplacePage;
  return result;
}

export async function fetchMarketplaceProduct(
  productId: string,
): Promise<ProductDetail> {
  const response = await apiFetch(`/dist/products/${encodeURIComponent(productId)}`, {
    skipAuth: true,
  });

  if (!response.ok) {
    // If not found by ID, could be a slug — we let caller handle fallback
    const err = new Error(`Product not found (${response.status})`);
    (err as unknown as { status: number }).status = response.status;
    throw err;
  }

  return (await response.json()) as ProductDetail;
}

export async function fetchProductChannels(
  productId: string,
): Promise<MarketplaceChannel[]> {
  try {
    const response = await apiFetch(
      `/dist/products/${encodeURIComponent(productId)}/channels`,
      { skipAuth: true },
    );
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: MarketplaceChannel[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

/**
 * If the user accessed /marketplace/slug instead of /marketplace/uuid,
 * this resolves the product by slug from the catalog.
 */
export async function resolveProductBySlug(
  identifier: string,
): Promise<ProductDetail> {
  // First try direct lookup by ID
  try {
    return await fetchMarketplaceProduct(identifier);
  } catch (err: unknown) {
    const is404 = (err as { status?: number })?.status === 404;
    // If it's a UUID format that 404'd, rethrow
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (is404 && !isUuid) {
      // Search catalog apps for matching slug
      const apps = await fetchMarketplaceApps({ limit: 100 });
      const matched = apps.data.find(
        (a) => a.product.slug.toLowerCase() === identifier.toLowerCase(),
      );
      if (matched) {
        return await fetchMarketplaceProduct(matched.product.id);
      }
    }
    throw err;
  }
}

// ── Property Accessors & Formatting ──

export function getDownloadUrl(artifact: MarketplaceArtifact): string | undefined {
  return artifact.downloadUrl || artifact.download_url;
}

export const getArtifactDownloadUrl = getDownloadUrl;

export function getFileName(artifact: MarketplaceArtifact): string {
  return artifact.fileName || artifact.file_name || "";
}

export const getArtifactFileName = getFileName;

export function getReleasePublishedAt(
  release: MarketplaceRelease | null | undefined,
): string | null | undefined {
  if (!release) return null;
  return release.publishedAt || release.published_at;
}

export function getPublisherDisplayName(
  publisher: MarketplacePublisher | null | undefined,
): string {
  if (!publisher) return "—";
  return publisher.nick || publisher.name || "—";
}

export function localized(
  text: LocalizedText | undefined,
  fallback: string | undefined,
  locale = "en",
): string {
  if (!text) return fallback ?? "";
  const language = locale.toLowerCase();
  const exact = text[locale];
  if (exact) return exact;
  const base = language.split("-")[0];
  for (const [key, value] of Object.entries(text)) {
    if (key.toLowerCase() === language) return value;
    if (base && key.toLowerCase().split("-")[0] === base) return value;
  }
  return fallback || Object.values(text)[0] || "";
}

export function getProductName(
  product: MarketplaceProduct,
  locale = "en",
): string {
  return localized(product.names, product.name, locale);
}

export function getProductDescription(
  product: MarketplaceProduct,
  locale = "en",
): string {
  return localized(product.descriptions, product.description, locale);
}

export function getChannelDisplayName(
  channel: MarketplaceChannel,
  locale = "en",
): string {
  return localized(
    channel.displayNames || channel.display_names,
    channel.displayName || channel.display_name || channel.name,
    locale,
  );
}

export function getReleaseTitle(
  release: MarketplaceRelease,
  locale = "en",
): string {
  return localized(
    release.titles,
    release.title || release.version,
    locale,
  );
}

export function getReleaseNotes(
  release: MarketplaceRelease,
  locale = "en",
): string {
  return localized(
    release.descriptions,
    release.releaseNotes || release.release_notes || "",
    locale,
  );
}

export function formatTargetLabel(
  platform?: string,
  architecture?: string,
): string {
  const pName = formatPlatformName(platform);
  const a = normalizeArchitecture(architecture);

  let aName: string;
  switch (a) {
    case "amd64":
      aName = "x64";
      break;
    case "arm64":
      aName = "ARM64";
      break;
    case "386":
      aName = "x86";
      break;
    case "arm":
      aName = "ARM";
      break;
    case "any":
      aName = "";
      break;
    default:
      aName = architecture || "";
  }

  if (pName && aName) return `${pName} · ${aName}`;
  return pName || aName || "Any";
}

// ── Target Matching & Release Auto-Selection ──

export interface ClientTarget {
  platform: string;
  architecture: string;
}

export interface MatchOutcome {
  release: MarketplaceRelease | null;
  artifact: MarketplaceArtifact | null;
  platform: string;
  architecture: string;
  targetLabel: string;
  platformLabel: string;
  isExactMatch: boolean;
}

export function normalizePlatform(raw?: string): string {
  if (!raw) return "any";
  const s = raw.toLowerCase().trim();
  if (s === "windows" || s === "win" || s === "win32" || s === "win64") return "windows";
  if (s === "darwin" || s === "macos" || s === "mac" || s === "osx") return "darwin";
  if (s === "linux") return "linux";
  if (s === "android") return "android";
  if (s === "ios" || s === "iphone" || s === "ipad") return "ios";
  if (s === "all" || s === "any" || s === "*" || s === "—") return "any";
  return s;
}

export function normalizeArchitecture(raw?: string): string {
  if (!raw) return "any";
  const s = raw.toLowerCase().trim();
  if (s === "x86_64" || s === "x64" || s === "amd64") return "amd64";
  if (s === "arm64" || s === "aarch64") return "arm64";
  if (s === "x86" || s === "386" || s === "i386" || s === "i686" || s === "ia32") return "386";
  if (s === "arm" || s === "armv7" || s === "armv7l" || s === "armv8l") return "arm";
  if (s === "universal" || s === "all" || s === "any" || s === "*" || s === "—") return "any";
  return s;
}

export function formatPlatformName(platform?: string): string {
  const norm = normalizePlatform(platform);
  switch (norm) {
    case "darwin":
      return "macOS";
    case "windows":
      return "Windows";
    case "linux":
      return "Linux";
    case "android":
      return "Android";
    case "ios":
      return "iOS";
    case "any":
      return "All platforms";
    default:
      return platform || "";
  }
}

export function detectClientTarget(nav?: Navigator): ClientTarget {
  const currentNav = nav ?? (typeof navigator !== "undefined" ? navigator : undefined);
  if (!currentNav) {
    return { platform: "unknown", architecture: "unknown" };
  }

  let platform = "unknown";
  let architecture = "unknown";

  // Check userAgentData
  const uad = (currentNav as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  if (uad?.platform) {
    platform = normalizePlatform(uad.platform);
  }

  const ua = currentNav.userAgent || "";
  const legacyPlat = currentNav.platform || "";

  if (platform === "unknown") {
    if (/windows|win32|win64|wow64/i.test(ua) || /win/i.test(legacyPlat)) {
      platform = "windows";
    } else if (/macintosh|mac os x/i.test(ua) || /mac/i.test(legacyPlat)) {
      platform = "darwin";
    } else if (/android/i.test(ua)) {
      platform = "android";
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      platform = "ios";
    } else if (/linux/i.test(ua) || /linux/i.test(legacyPlat)) {
      platform = "linux";
    }
  }

  if (/arm64|aarch64/i.test(ua)) {
    architecture = "arm64";
  } else if (/x86_64|x86-64|x64|amd64|win64|wow64/i.test(ua)) {
    architecture = "amd64";
  } else if (/i686|i386|x86/i.test(ua)) {
    architecture = "386";
  } else if (/armv[78]l|arm/i.test(ua)) {
    architecture = "arm";
  } else if (platform === "darwin") {
    if (isAppleSilicon()) {
      architecture = "arm64";
    } else {
      architecture = "arm64";
    }
  } else if (platform === "windows" || platform === "linux") {
    architecture = "amd64";
  }

  return { platform, architecture };
}

function isAppleSilicon(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return false;
    const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "");
    return /apple/i.test(renderer) && !/apple software/i.test(renderer);
  } catch {
    return false;
  }
}

export function scoreArtifact(artifact: MarketplaceArtifact, client: ClientTarget): number {
  const url = getDownloadUrl(artifact);
  if (!url || artifact.expired) {
    return -1;
  }

  const artPlat = normalizePlatform(artifact.platform);
  const artArch = normalizeArchitecture(artifact.architecture);
  const cliPlat = client.platform;
  const cliArch = client.architecture;

  if (!cliPlat || cliPlat === "unknown") {
    return artPlat === "any" ? 20 : 10;
  }

  if (artPlat === cliPlat) {
    if (artArch === cliArch) {
      return 100;
    }
    if (artArch === "any") {
      return 85;
    }
    if (cliPlat === "darwin" && cliArch === "arm64" && artArch === "amd64") {
      return 70;
    }
    if (cliPlat === "windows" && cliArch === "arm64" && artArch === "amd64") {
      return 70;
    }
    if (cliArch === "amd64" && artArch === "386") {
      return 60;
    }
    return 40;
  }

  if (artPlat === "any") {
    if (artArch === cliArch) return 30;
    return 20;
  }

  return 0;
}

export function findBestDownload(
  primaryRelease: MarketplaceRelease | null | undefined,
  otherReleases: (MarketplaceRelease | null | undefined)[],
  clientOverride?: ClientTarget,
): MatchOutcome {
  const client = clientOverride ?? detectClientTarget();

  const candidateReleases: MarketplaceRelease[] = [];
  const seen = new Set<string>();

  if (primaryRelease && primaryRelease.id) {
    seen.add(primaryRelease.id);
    candidateReleases.push(primaryRelease);
  }

  for (const rel of otherReleases) {
    if (rel && rel.id && !seen.has(rel.id)) {
      seen.add(rel.id);
      candidateReleases.push(rel);
    }
  }

  if (candidateReleases.length === 0) {
    return {
      release: null,
      artifact: null,
      platform: client.platform,
      architecture: client.architecture,
      targetLabel: formatTargetLabel(client.platform, client.architecture),
      platformLabel: formatPlatformName(client.platform),
      isExactMatch: false,
    };
  }

  let bestRelease: MarketplaceRelease | null = null;
  let bestArtifact: MarketplaceArtifact | null = null;
  let bestScore = -1;

  if (primaryRelease && primaryRelease.artifacts?.length) {
    for (const art of primaryRelease.artifacts) {
      const score = scoreArtifact(art, client);
      if (score > bestScore) {
        bestScore = score;
        bestArtifact = art;
        bestRelease = primaryRelease;
      }
    }
  }

  if (bestScore >= 40 && bestArtifact && bestRelease) {
    const artPlat = normalizePlatform(bestArtifact.platform);
    const artArch = normalizeArchitecture(bestArtifact.architecture);
    return {
      release: bestRelease,
      artifact: bestArtifact,
      platform: artPlat,
      architecture: artArch,
      targetLabel: formatTargetLabel(artPlat, artArch),
      platformLabel: formatPlatformName(artPlat),
      isExactMatch: bestScore >= 85,
    };
  }

  for (const rel of candidateReleases) {
    if (rel.artifacts?.length) {
      for (const art of rel.artifacts) {
        const score = scoreArtifact(art, client);
        if (score > bestScore) {
          bestScore = score;
          bestArtifact = art;
          bestRelease = rel;
        }
      }
    }
  }

  if (bestArtifact && bestRelease && bestScore > 0) {
    const artPlat = normalizePlatform(bestArtifact.platform);
    const artArch = normalizeArchitecture(bestArtifact.architecture);
    return {
      release: bestRelease,
      artifact: bestArtifact,
      platform: artPlat,
      architecture: artArch,
      targetLabel: formatTargetLabel(artPlat, artArch),
      platformLabel: formatPlatformName(artPlat),
      isExactMatch: bestScore >= 85,
    };
  }

  if (primaryRelease) {
    const fallback = primaryRelease.artifacts?.find((a) => getDownloadUrl(a) && !a.expired);
    if (fallback) {
      const artPlat = normalizePlatform(fallback.platform);
      const artArch = normalizeArchitecture(fallback.architecture);
      return {
        release: primaryRelease,
        artifact: fallback,
        platform: artPlat,
        architecture: artArch,
        targetLabel: formatTargetLabel(artPlat, artArch),
        platformLabel: formatPlatformName(artPlat),
        isExactMatch: false,
      };
    }
  }

  for (const rel of candidateReleases) {
    const fallback = rel.artifacts?.find((a) => getDownloadUrl(a) && !a.expired);
    if (fallback) {
      const artPlat = normalizePlatform(fallback.platform);
      const artArch = normalizeArchitecture(fallback.architecture);
      return {
        release: rel,
        artifact: fallback,
        platform: artPlat,
        architecture: artArch,
        targetLabel: formatTargetLabel(artPlat, artArch),
        platformLabel: formatPlatformName(artPlat),
        isExactMatch: false,
      };
    }
  }

  return {
    release: candidateReleases[0] ?? null,
    artifact: null,
    platform: client.platform,
    architecture: client.architecture,
    targetLabel: formatTargetLabel(client.platform, client.architecture),
    platformLabel: formatPlatformName(client.platform),
    isExactMatch: false,
  };
}
