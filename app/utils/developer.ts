import type {
  Developer,
  DeveloperStats,
  DevProject,
  CustomApp,
  CustomAppSecret,
  AppProduct,
  AppProductWritePayload,
  Bot,
  BotKey,
  BotChatConfig,
  BoardWidgetManifest,
  BoardWidgetPayload,
  BoardWidgetValidationError,
  BoardWidgetPayloadPushRequest,
  BoardWidgetPayloadPushResponse,
  BoardAppDiscoveryResponse,
  BoardJsonValue,
  MiniApp,
  MarketplacePlugin,
  PluginPackageResult,
} from "~/types/developer";
import { apiFetch, safeJsonParse } from "~/utils/api";
import { camelToSnake } from "~/utils/case";

// ==================== Developers ====================

export async function fetchDevelopers(): Promise<Developer[]> {
  const response = await apiFetch("/develop/developers");
  return safeJsonParse<Developer[]>(response);
}

export async function fetchDeveloperStats(
  publisherName: string,
): Promise<DeveloperStats | null> {
  try {
    const response = await apiFetch(
      `/develop/developers/${encodeURIComponent(publisherName)}/stats`,
    );
    return safeJsonParse<DeveloperStats>(response);
  } catch {
    return null;
  }
}

export async function enrollDeveloper(publisherName: string): Promise<void> {
  await apiFetch(
    `/develop/developers/${encodeURIComponent(publisherName)}/enroll`,
    { method: "POST" },
  );
}

// ==================== Projects ====================

export async function fetchDevProjects(
  publisherName: string,
): Promise<DevProject[]> {
  const response = await apiFetch(
    `/develop/private/projects?dev=${encodeURIComponent(publisherName)}`,
  );
  return safeJsonParse<DevProject[]>(response);
}

export async function fetchDevProject(
  publisherName: string,
  projectId: string,
): Promise<DevProject | null> {
  try {
    const response = await apiFetch(
      `/develop/private/projects/${encodeURIComponent(projectId)}?dev=${encodeURIComponent(publisherName)}`,
    );
    return safeJsonParse<DevProject>(response);
  } catch {
    return null;
  }
}

export async function createDevProject(
  publisherName: string,
  data: { name: string; slug: string; description: string },
): Promise<DevProject> {
  const response = await apiFetch(
    `/develop/private/projects?dev=${encodeURIComponent(publisherName)}`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<DevProject>(response);
}

export async function updateDevProject(
  publisherName: string,
  projectId: string,
  data: { name?: string; slug?: string; description?: string },
): Promise<DevProject> {
  const response = await apiFetch(
    `/develop/private/projects/${encodeURIComponent(projectId)}?dev=${encodeURIComponent(publisherName)}`,
    {
      method: "PUT",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<DevProject>(response);
}

export async function deleteDevProject(
  publisherName: string,
  projectId: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/projects/${encodeURIComponent(projectId)}?dev=${encodeURIComponent(publisherName)}`,
    { method: "DELETE" },
  );
}

// ==================== Plugin marketplace ====================

export async function fetchMiniApps(
  publisherName: string,
  projectId: string,
): Promise<MiniApp[]> {
  const response = await apiFetch(
    `/develop/private/miniapps?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<MiniApp[]>(response);
}

export async function fetchMiniApp(
  publisherName: string,
  projectId: string,
  miniAppId: string,
): Promise<MiniApp> {
  const response = await apiFetch(
    `/develop/private/miniapps/${encodeURIComponent(miniAppId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<MiniApp>(response);
}

export async function createMiniApp(
  publisherName: string,
  projectId: string,
  data: {
    slug: string;
    stage?: number;
    manifest?: Record<string, unknown>;
    iconId?: string;
    backgroundId?: string;
  },
): Promise<MiniApp> {
  const response = await apiFetch(
    `/develop/private/miniapps?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "POST", body: JSON.stringify(camelToSnake(data)) },
  );
  return safeJsonParse<MiniApp>(response);
}

export async function updateMiniApp(
  publisherName: string,
  projectId: string,
  miniAppId: string,
  data: {
    slug?: string;
    stage?: number;
    manifest?: Record<string, unknown>;
    iconId?: string;
    backgroundId?: string;
  },
): Promise<MiniApp> {
  const response = await apiFetch(
    `/develop/private/miniapps/${encodeURIComponent(miniAppId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "PATCH", body: JSON.stringify(camelToSnake(data)) },
  );
  return safeJsonParse<MiniApp>(response);
}

export async function deleteMiniApp(
  publisherName: string,
  projectId: string,
  miniAppId: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/miniapps/${encodeURIComponent(miniAppId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

export async function uploadMiniAppPackage(
  publisherName: string,
  projectId: string,
  miniAppId: string,
  file: File,
): Promise<PluginPackageResult> {
  const form = new FormData();
  form.append("File", file);
  const response = await apiFetch(
    `/develop/private/miniapps/${encodeURIComponent(miniAppId)}/package?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "POST", body: form },
  );
  return safeJsonParse<PluginPackageResult>(response);
}

export async function fetchMarketplacePlugins(options?: {
  take?: number;
  offset?: number;
  search?: string;
}): Promise<{ items: MarketplacePlugin[]; total: number | null }> {
  const params = new URLSearchParams();
  if (options?.take != null) params.set("take", String(options.take));
  if (options?.offset != null) params.set("offset", String(options.offset));
  if (options?.search) params.set("search", options.search);
  const response = await apiFetch(`/develop/miniapps?${params}`, {
    skipAuth: true,
  });
  const items = await safeJsonParse<MarketplacePlugin[]>(response);
  return { items, total: Number(response.headers.get("X-Total")) || null };
}

export async function fetchMarketplacePlugin(
  slug: string,
): Promise<MarketplacePlugin> {
  const response = await apiFetch(
    `/develop/miniapps/${encodeURIComponent(slug)}`,
    { skipAuth: true },
  );
  return safeJsonParse<MarketplacePlugin>(response);
}

// ==================== Custom Apps ====================

export async function fetchCustomApps(
  publisherName: string,
  projectId: string,
): Promise<CustomApp[]> {
  const response = await apiFetch(
    `/develop/private/apps?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<CustomApp[]>(response);
}

export async function fetchCustomApp(
  publisherName: string,
  projectId: string,
  appId: string,
): Promise<CustomApp> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<CustomApp>(response);
}

export async function createCustomApp(
  publisherName: string,
  projectId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
  },
): Promise<CustomApp> {
  const response = await apiFetch(
    `/develop/private/apps?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<CustomApp>(response);
}

export async function updateCustomApp(
  publisherName: string,
  projectId: string,
  appId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    pictureId?: string | null;
    backgroundId?: string | null;
    status?: number;
    links?: {
      homePage?: string | null;
      privacyPolicy?: string | null;
      termsOfService?: string | null;
    };
    paymentWalletId?: string | null;
    oauthConfig?: {
      clientUri?: string | null;
      redirectUris?: string[];
      postLogoutRedirectUris?: string[] | null;
      allowedScopes?: string[];
      allowedGrantTypes?: string[];
      requirePkce?: boolean;
      allowOfflineAccess?: boolean;
      isPublicClient?: boolean;
    };
  },
): Promise<CustomApp> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<CustomApp>(response);
}

export async function deleteCustomApp(
  publisherName: string,
  projectId: string,
  appId: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

// ==================== App Products ====================

export async function fetchAppProducts(
  publisherName: string,
  projectId: string,
  appId: string,
): Promise<AppProduct[]> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/products?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<AppProduct[]>(response);
}

export async function createAppProduct(
  publisherName: string,
  projectId: string,
  appId: string,
  data: AppProductWritePayload & {
    identifier: string;
    displayName: string;
    currency: string;
    price: number;
  },
): Promise<AppProduct> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/products?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<AppProduct>(response);
}

export async function updateAppProduct(
  publisherName: string,
  projectId: string,
  appId: string,
  productId: string,
  data: AppProductWritePayload,
): Promise<AppProduct> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/products/${encodeURIComponent(productId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<AppProduct>(response);
}

export async function deleteAppProduct(
  publisherName: string,
  projectId: string,
  appId: string,
  productId: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/products/${encodeURIComponent(productId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

// ==================== App Secrets ====================

export async function fetchAppSecrets(
  publisherName: string,
  projectId: string,
  appId: string,
): Promise<CustomAppSecret[]> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/secrets?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<CustomAppSecret[]>(response);
}

export async function createAppSecret(
  publisherName: string,
  projectId: string,
  appId: string,
  data: { description?: string; type?: number; expiresIn?: string | null },
): Promise<CustomAppSecret> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/secrets?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<CustomAppSecret>(response);
}

export async function deleteAppSecret(
  publisherName: string,
  projectId: string,
  appId: string,
  secretId: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/secrets/${encodeURIComponent(secretId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

// ==================== Bots ====================

export async function fetchBots(
  publisherName: string,
  projectId: string,
): Promise<Bot[]> {
  const response = await apiFetch(
    `/develop/private/bots?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<Bot[]>(response);
}

export async function fetchBot(
  publisherName: string,
  projectId: string,
  botId: string,
): Promise<Bot> {
  const response = await apiFetch(
    `/develop/private/bots/${encodeURIComponent(botId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<Bot>(response);
}

export async function createBot(
  publisherName: string,
  projectId: string,
  data: {
    name: string;
    nick: string;
    slug: string;
    language?: string;
    bio?: string;
    pictureId?: string;
    backgroundId?: string;
  },
): Promise<Bot> {
  const response = await apiFetch(
    `/develop/private/bots?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<Bot>(response);
}

export async function updateBot(
  publisherName: string,
  projectId: string,
  botId: string,
  data: {
    name?: string;
    nick?: string;
    slug?: string;
    language?: string;
    isActive?: boolean;
    bio?: string;
    pictureId?: string;
    backgroundId?: string;
  },
): Promise<Bot> {
  const response = await apiFetch(
    `/develop/private/bots/${encodeURIComponent(botId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<Bot>(response);
}

export async function deleteBot(
  publisherName: string,
  projectId: string,
  botId: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/bots/${encodeURIComponent(botId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

// ==================== Bot Keys ====================

export async function fetchBotKeys(
  publisherName: string,
  projectId: string,
  botId: string,
): Promise<BotKey[]> {
  const response = await apiFetch(
    `/develop/private/bots/${encodeURIComponent(botId)}/keys?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
  );
  return safeJsonParse<BotKey[]>(response);
}

export async function createBotKey(
  publisherName: string,
  projectId: string,
  botId: string,
  data: { label?: string },
): Promise<BotKey> {
  const response = await apiFetch(
    `/develop/private/bots/${encodeURIComponent(botId)}/keys?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<BotKey>(response);
}

export async function deleteBotKey(
  publisherName: string,
  projectId: string,
  botId: string,
  keyId: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/bots/${encodeURIComponent(botId)}/keys/${encodeURIComponent(keyId)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

// ==================== Bot Chat Config ====================

export async function fetchBotChatConfig(
  publisherName: string,
  projectId: string,
  botId: string,
): Promise<BotChatConfig | null> {
  try {
    const response = await apiFetch(
      `/develop/private/bots/${encodeURIComponent(botId)}/chat?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    );
    return safeJsonParse<BotChatConfig>(response);
  } catch {
    return null;
  }
}

export async function updateBotChatConfig(
  publisherName: string,
  projectId: string,
  botId: string,
  data: BotChatConfig,
): Promise<BotChatConfig> {
  const response = await apiFetch(
    `/develop/private/bots/${encodeURIComponent(botId)}/chat?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "PUT",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<BotChatConfig>(response);
}

// ==================== Board Widget Config (App) ====================

export async function fetchBoardWidgets(
  publisherName: string,
  projectId: string,
  appId: string,
): Promise<BoardWidgetManifest[]> {
  try {
    const response = await apiFetch(
      `/develop/private/apps/${encodeURIComponent(appId)}/board?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    );
    return safeJsonParse<BoardWidgetManifest[]>(response);
  } catch (e) {
    console.error("[Developer] fetchBoardWidgets failed:", e);
    return [];
  }
}

// ==================== Public Board Widget Discovery ====================

export async function discoverBoardWidgets(options?: {
  slug?: string;
  take?: number;
  offset?: number;
}): Promise<BoardAppDiscoveryResponse[]> {
  const params = new URLSearchParams();
  if (options?.slug) params.set("slug", options.slug);
  if (options?.take) params.set("take", String(options.take));
  if (options?.offset) params.set("offset", String(options.offset));
  const query = params.toString();
  const response = await apiFetch(
    `/develop/apps/board${query ? `?${query}` : ""}`,
    { skipAuth: true },
  );
  return safeJsonParse<BoardAppDiscoveryResponse[]>(response);
}

export async function createBoardWidget(
  publisherName: string,
  projectId: string,
  appId: string,
  data: BoardWidgetManifest,
): Promise<BoardWidgetManifest> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/board?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<BoardWidgetManifest>(response);
}

export async function updateBoardWidget(
  publisherName: string,
  projectId: string,
  appId: string,
  widgetKey: string,
  data: BoardWidgetManifest,
): Promise<BoardWidgetManifest> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/board/${encodeURIComponent(widgetKey)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    {
      method: "PUT",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<BoardWidgetManifest>(response);
}

export async function deleteBoardWidget(
  publisherName: string,
  projectId: string,
  appId: string,
  widgetKey: string,
): Promise<void> {
  await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/board/${encodeURIComponent(widgetKey)}?dev=${encodeURIComponent(publisherName)}&proj=${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

// ==================== Account Board Items ====================

export interface AccountBoardItem {
  id: string;
  accountId?: string;
  order: number;
  kind: "prebuilt" | "custom_app";
  widgetKey: string;
  customAppId?: string | null;
  customAppWidgetKey?: string | null;
  isEnabled: boolean;
  payload: BoardWidgetPayload;
}

export async function fetchAccountBoard(): Promise<AccountBoardItem[]> {
  const response = await apiFetch("/stargate/accounts/me/board");
  return safeJsonParse<AccountBoardItem[]>(response);
}

export async function updateAccountBoard(
  items: Omit<AccountBoardItem, "id" | "accountId">[],
): Promise<AccountBoardItem[]> {
  const response = await apiFetch("/stargate/accounts/me/board", {
    method: "PUT",
    body: JSON.stringify(camelToSnake(items)),
  });
  return safeJsonParse<AccountBoardItem[]>(response);
}

// ==================== Board Widget Payload Push (App Backend) ====================

/**
 * Push a board widget payload update from the custom app backend.
 * Authenticates via a custom app API secret.
 * The endpoint lives in Develop, validates the payload against the widget manifest,
 * and forwards the normalized payload to Passport via gRPC.
 */
export async function pushBoardWidgetPayload(
  appId: string,
  data: BoardWidgetPayloadPushRequest,
): Promise<BoardWidgetPayloadPushResponse> {
  const response = await apiFetch(
    `/develop/private/apps/${encodeURIComponent(appId)}/board/payload`,
    {
      method: "POST",
      body: JSON.stringify(camelToSnake(data)),
    },
  );
  return safeJsonParse<BoardWidgetPayloadPushResponse>(response);
}

export interface BoardPushApiInfo {
  method: string;
  endpoint: string;
  authHeader: string;
  authExample: string;
  exampleBody: {
    account_id: string;
    board_item_id?: string;
    widget_key: string;
    payload: Record<string, unknown>;
  };
}

export function getBoardPushApiInfo(appId: string): BoardPushApiInfo {
  return {
    method: "POST",
    endpoint: `/develop/private/apps/${appId}/board/payload`,
    authHeader: "Authorization: Bearer <custom_app_secret>",
    authExample: "Authorization: Bearer sk_live_xxxxx",
    exampleBody: {
      account_id: "550e8400-e29b-41d4-a716-446655440000",
      widget_key: "summary_card",
      payload: {
        title: {
          value: "Updated from app backend",
          label: "Title",
        },
        show_points: {
          value: false,
          label: "Show points",
          format: "boolean",
        },
        // value may be any JSON (object / array / nested)
        meta: {
          value: {
            source: "backend",
            tags: ["featured", "live"],
            stats: { views: 120, likes: 8 },
          },
          label: "Metadata",
        },
        items: {
          value: [
            { id: 1, name: "Alpha" },
            { id: 2, name: "Beta", nested: { ok: true } },
          ],
          label: "Items",
        },
      },
    },
  };
}

/**
 * Build a sample envelope payload from a widget's field type declarations.
 * `value` is filled with a representative JSON value for each declared type,
 * including nested objects/arrays when applicable.
 */
export function sampleBoardWidgetPayload(
  fieldTypes: Array<{
    name: string;
    type?: string;
    label?: string;
    format?: string;
  }>,
): BoardWidgetPayload {
  const payload: BoardWidgetPayload = {};
  for (const field of fieldTypes) {
    const name = field.name?.trim();
    if (!name) continue;
    payload[name] = {
      value: sampleValueForFieldType(field.type),
      label: field.label?.trim() || name,
      ...(field.format ? { format: field.format } : {}),
    };
  }
  return payload;
}

function sampleValueForFieldType(type?: string): BoardJsonValue {
  switch ((type || "string").toLowerCase()) {
    case "number":
      return 42;
    case "boolean":
      return true;
    case "null":
      return null;
    case "array":
      return [
        { id: 1, name: "Item A" },
        { id: 2, name: "Item B", nested: { ok: true } },
      ];
    case "object":
      return {
        nested: { key: "value", count: 1 },
        tags: ["a", "b"],
        enabled: true,
      };
    default:
      return "example";
  }
}
