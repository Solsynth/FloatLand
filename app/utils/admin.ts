import { apiFetch, fetchJson, safeJsonParse } from '~/utils/api'
import { camelToSnake } from '~/utils/case'
import type { SnAccountBadge } from '~/types/auth'
import type {
  AdminAccountListEntry,
  AdminAccountDetail,
  AdminAccountQuery,
  SuspendPayload,
  NotificationPayload,
  EmailPayload,
  EmailPlanCreatePayload,
  EmailPlan,
  EmailPlanQuery,
  BulkDeliveryResult,
  SnAccountPunishment,
  AdminPost,
  AdminPostQuery,
  PostLockState,
  PostVisibilityPayload,
  PostShadowbanPayload,
  PostRealmRemovePayload,
  PostBatchResult,
  AdminTransaction,
  AdminTransactionQuery,
  AdminWalletOrder,
  AdminOrderQuery,
  BalanceModifyPayload,
  AdminSubscription,
  AdminSubscriptionQuery,
  AdminSubscriptionCatalogItem,
  GoldsResupplyPack,
  MaintenanceResult,
  CacheStats,
  CacheGroupInfo,
  CacheClearPayload,
  CacheClearResult,
  ContactPayload,
  ContactUpdatePayload,
  ContactVerifyPayload,
  ContactVisibilityPayload,
  AuthFactorCreatePayload,
  PasswordResetPayload,
  VerificationPayload,
  BadgeGrantPayload,
  SnContact,
  AdminAuthFactor,
  AdminDevice,
  AdminDeviceQuery,
  AdminSession,
  AdminSessionQuery,
  DeviceLabelPayload,
  EmailDeliveryOverview,
  NotificationDeliveryOverview,
  DeliveryObservabilityQuery,
  AdminPublicConnection,
  PassportAdminStats,
  SphereAdminStats,
  WalletAdminStats,
  RingAdminStats,
  AccountActivityMetrics,
  AccountGeographyStats,
  AccountGeographyQuery,
  PermissionGroupSummary,
  PermissionGroupDetail,
  PermissionNode,
  PermissionGroupMember,
  ActorPermissions,
  UpsertGroupPermissionPayload,
  UpsertGroupMemberPayload,
  AdminTest,
  AdminTestAttempt,
  AdminTestTrialResult,
  AdminTestTrial,
  AdminTestQuestion,
  AdminTestQuestionPage,
  AdminTestQuestionGroup,
  AdminBoardItem,
  BoardPayloadPush,
  AdminMagicSpell,
  CreateAdminMagicSpellPayload,
  ResendAdminMagicSpellPayload,
  AdminTag,
  AdminTagQuery,
  AdminTagCreatePayload,
  AdminTagUpdatePayload,
  AdminTagAssignPayload,
  AdminTagProtectPayload,
  AdminTagEventPayload,
  AdminCategory,
  AdminCategoryQuery,
  AdminCategoryCreatePayload,
  AdminCategoryUpdatePayload,
  AdminCollection,
  AdminCollectionQuery,
  AdminCollectionUpdatePayload,
  AdminPublisherSummary,
  AdminPublisherDetail,
  AdminPublisherQuery,
  AdminPublisherUpdatePayload,
  AdminPublisherShadowbanPayload,
  AdminPublisherVerificationPayload,
  AdminRealm,
  AdminRealmDetail,
  AdminRealmQuery,
  AdminRealmUpdatePayload,
  AdminRealmVerificationPayload,
  AdminRealmMember,
  AdminRealmMemberQuery,
  AdminRealmMemberRolePayload,
  StoragePoolConfig,
  StoragePoolUpdatePayload,
  StorageNodeHealth,
  StorageHealthSummary,
  StorageStats,
  StorageFailureEvent,
  PoolMigrationPayload,
  PoolMigrationTask,
  WorkspaceAdminSummary,
  WorkspaceAdminQuery,
  WorkspaceAdminDetail,
  WorkspaceUpdatePayload,
  WorkspacePlanUpdatePayload,
  WorkspaceAdminStats,
  BoardAdminSummary,
  BoardAdminQuery,
  BoardAdminDetail,
  BoardUpdatePayload,
  TaskAdminSummary,
  TaskAdminQuery,
  TaskAdminDetail,
  TaskUpdatePayload,
  GitHubIntegrationAdminSummary,
  GitHubIntegrationAdminQuery,
  FlywheelAdminStats,
  FlywheelAdminApp,
  FlywheelAdminAppQuery,
  Workspace,
  IdeaskBoard,
  IdeaskTask,
  FlywheelAuditEntry,
} from '~/types/admin'

// Padlock service: auth, sessions, punishments, suspend, delete, notifications, emails
const PADLOCK_BASE = '/padlock/admin/accounts'
// Padlock permission groups
const PADLOCK_PERMISSIONS = '/padlock/admin/permissions'
// Passport service: profile-hydrated accounts, activities, status, badges
const PASSPORT_BASE = '/passport/admin/accounts'
// Passport service: realm moderation
const PASSPORT_REALMS = '/passport/admin/realms'
const PASSPORT_TESTS = '/passport/admin/tests'
const PASSPORT_TEST_QUESTION_GROUPS = '/passport/admin/test-question-groups'
const PASSPORT_TEST_QUESTIONS = '/passport/admin/test-questions'
const PASSPORT_TEST_TRIALS = '/passport/admin/test-trials'
// Sphere service: content moderation
const SPHERE_POSTS = '/sphere/admin/posts'
const SPHERE_TAGS = '/sphere/admin/tags'
const SPHERE_CATEGORIES = '/sphere/admin/categories'
const SPHERE_COLLECTIONS = '/sphere/admin/collections'
const SPHERE_PUBLISHERS = '/sphere/admin/publishers'
// Wallet service: payments, subscriptions, products
const WALLET_PAYMENTS = '/wallet/admin/payments'
const WALLET_SUBSCRIPTIONS = '/wallet/admin/subscriptions'
const WALLET_PRODUCTS = '/wallet/admin/wallet-products'
// Padlock service: cache management
const PADLOCK_CACHE = '/padlock/admin/cache'
// Ring service: delivery observability + email plans
const RING_DELIVERY_OBS = '/ring/admin/delivery-observability'
const RING_EMAIL_PLANS = '/ring/admin/email-plans'
// Per-service admin stats
const PASSPORT_STATS = '/passport/admin/stats'
const SPHERE_STATS = '/sphere/admin/stats'
const WALLET_STATS = '/wallet/admin/stats'
const RING_STATS = '/ring/admin/stats'
const PADLOCK_GEOGRAPHY = '/padlock/admin/stats/users/geography'

async function fetchPaginated<T>(
  endpoint: string,
): Promise<{ items: T[]; total: number }> {
  const res = await apiFetch(endpoint)
  const totalHeader = res.headers.get('X-Total')
  const total = totalHeader ? parseInt(totalHeader, 10) : 0
  const items = await safeJsonParse<T[]>(res)
  return { items, total }
}

/**
 * Build query string for ASP.NET [FromQuery] params.
 * Controllers bind by C# parameter/property names (camelCase), not JSON snake_case.
 */
function buildQuery(params: Record<string, unknown>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== '') {
          query.append(key, String(item))
        }
      }
      continue
    }
    query.set(key, String(value))
  }
  return query.toString()
}

export async function fetchAdminAccounts(
  params: AdminAccountQuery = {},
): Promise<{ accounts: AdminAccountListEntry[]; total: number }> {
  const qs = buildQuery({
    query: params.query,
    take: params.take,
    offset: params.offset,
    orderBy: params.orderBy,
  })
  const suffix = qs ? `?${qs}` : ''

  // Padlock owns auth-side list metadata (email, sessions, punishments).
  const padlockRes = await apiFetch(`${PADLOCK_BASE}${suffix}`)
  const totalHeader = padlockRes.headers.get('X-Total')
  const total = totalHeader ? parseInt(totalHeader, 10) : 0
  const accounts = await safeJsonParse<AdminAccountListEntry[]>(padlockRes)

  // Enrich with Passport-side status / badge counts when available.
  try {
    const passportEntries = await fetchJson<AdminAccountListEntry[]>(`${PASSPORT_BASE}${suffix}`)
    const byId = new Map<string, AdminAccountListEntry>()
    for (const passportEntry of passportEntries ?? []) {
      if (passportEntry?.account?.id) {
        byId.set(passportEntry.account.id, passportEntry)
      }
    }
    for (const entry of accounts) {
      const passport = byId.get(entry.account.id)
      if (!passport) continue
      entry.status = passport.status
      entry.badgeCount = passport.badgeCount
      entry.activeActivityCount = passport.activeActivityCount
    }
  } catch {
    // Passport enrichment is best-effort; Padlock data is enough to render the table.
  }

  return { accounts, total }
}

export async function fetchAdminAccountDetail(
  identifier: string,
): Promise<AdminAccountDetail> {
  // Passport: profile, status, activities, badges.
  // Padlock: sessions/devices counts and punishments.
  const [passport, padlock] = await Promise.all([
    fetchJson<AdminAccountDetail>(`${PASSPORT_BASE}/${encodeURIComponent(identifier)}`),
    fetchJson<AdminAccountDetail>(`${PADLOCK_BASE}/${encodeURIComponent(identifier)}`).catch(() => null),
  ])

  if (!padlock) return passport

  return {
    ...passport,
    account: {
      ...padlock.account,
      ...passport.account,
      // Prefer non-null activation / timestamps from either side
      activatedAt: passport.account?.activatedAt ?? padlock.account?.activatedAt,
      createdAt: passport.account?.createdAt ?? padlock.account?.createdAt,
      updatedAt: passport.account?.updatedAt ?? padlock.account?.updatedAt,
    },
    activeSessionCount: padlock.activeSessionCount,
    activeDeviceCount: padlock.activeDeviceCount,
    activePunishment: padlock.activePunishment,
    activePunishments: padlock.activePunishments,
  }
}

export async function revokeAccountSessions(name: string): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/sessions/revoke`, {
    method: 'POST',
  })
}

/** Force-activate account and grant default permission group membership. */
export async function activateAdminAccount(name: string): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${encodeURIComponent(name)}/activate`, {
    method: 'POST',
  })
}

export async function fetchAccountDevices(
  name: string,
  params: AdminDeviceQuery = {},
): Promise<{ items: AdminDevice[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const endpoint = `${PADLOCK_BASE}/${name}/devices${qs ? `?${qs}` : ''}`
  return fetchPaginated<AdminDevice>(endpoint)
}

export async function adminUpdateDeviceLabel(
  name: string,
  deviceId: string,
  payload: DeviceLabelPayload,
): Promise<void> {
  await fetchJson(
    `${PADLOCK_BASE}/${encodeURIComponent(name)}/devices/${encodeURIComponent(deviceId)}/label`,
    {
      method: 'PATCH',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function revokeDeviceSessions(
  name: string,
  deviceId: string,
): Promise<void> {
  await fetchJson(
    `${PADLOCK_BASE}/${encodeURIComponent(name)}/devices/${encodeURIComponent(deviceId)}/sessions/revoke`,
    {
      method: 'POST',
    },
  )
}

export async function deleteAccountDevice(
  name: string,
  deviceId: string,
): Promise<void> {
  await fetchJson(
    `${PADLOCK_BASE}/${encodeURIComponent(name)}/devices/${encodeURIComponent(deviceId)}`,
    {
      method: 'DELETE',
    },
  )
}

export async function fetchAccountSessions(
  name: string,
  params: AdminSessionQuery = {},
): Promise<{ items: AdminSession[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const endpoint = `${PADLOCK_BASE}/${name}/sessions${qs ? `?${qs}` : ''}`
  return fetchPaginated<AdminSession>(endpoint)
}

export async function adminFetchSessionChildren(
  name: string,
  sessionId: string,
): Promise<AdminSession[]> {
  return fetchJson<AdminSession[]>(`${PADLOCK_BASE}/${name}/sessions/${sessionId}/children`)
}

export async function adminRevokeSession(
  name: string,
  sessionId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/sessions/${sessionId}`, {
    method: 'DELETE',
  })
}

export async function suspendAccount(
  name: string,
  payload: SuspendPayload,
): Promise<SnAccountPunishment> {
  return fetchJson<SnAccountPunishment>(`${PADLOCK_BASE}/${name}/suspend`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteAdminAccount(name: string): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}`, {
    method: 'DELETE',
  })
}

export async function sendAdminNotifications(
  payload: NotificationPayload,
): Promise<BulkDeliveryResult> {
  return fetchJson<BulkDeliveryResult>(`${PADLOCK_BASE}/notifications`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function sendAdminEmails(
  payload: EmailPayload,
): Promise<BulkDeliveryResult> {
  return fetchJson<BulkDeliveryResult>(`${PADLOCK_BASE}/emails`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function exportAccountEmailsCsv(params: {
  accountId?: string
  accountIds?: string[]
  broadcastToAll?: boolean
}): Promise<Blob> {
  const qs = buildQuery({
    accountId: params.accountId,
    accountIds: params.accountIds,
    broadcastToAll: params.broadcastToAll,
  })
  const res = await apiFetch(`${PADLOCK_BASE}/emails/export${qs ? `?${qs}` : ''}`)
  return res.blob()
}

export async function fetchEmailDeliveryObservability(
  params: DeliveryObservabilityQuery = {},
): Promise<EmailDeliveryOverview> {
  const qs = buildQuery({ from: params.from, to: params.to })
  return fetchJson<EmailDeliveryOverview>(
    `${RING_DELIVERY_OBS}/emails${qs ? `?${qs}` : ''}`,
  )
}

export async function fetchNotificationDeliveryObservability(
  params: DeliveryObservabilityQuery = {},
): Promise<NotificationDeliveryOverview> {
  const qs = buildQuery({ from: params.from, to: params.to })
  return fetchJson<NotificationDeliveryOverview>(
    `${RING_DELIVERY_OBS}/notifications${qs ? `?${qs}` : ''}`,
  )
}

/** Public connected platforms for an account (Passport). */
export async function fetchAccountPublicConnections(
  name: string,
): Promise<AdminPublicConnection[]> {
  return fetchJson<AdminPublicConnection[]>(`/passport/accounts/${encodeURIComponent(name)}/connections`)
}

export async function fetchPunishmentsCreated(): Promise<SnAccountPunishment[]> {
  return fetchJson<SnAccountPunishment[]>(`${PADLOCK_BASE}/punishments/created`)
}

export async function createPunishment(
  name: string,
  payload: Record<string, unknown>,
): Promise<SnAccountPunishment> {
  return fetchJson<SnAccountPunishment>(`${PADLOCK_BASE}/${name}/punishments`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function updatePunishment(
  name: string,
  punishmentId: string,
  payload: Record<string, unknown>,
): Promise<SnAccountPunishment> {
  return fetchJson<SnAccountPunishment>(
    `${PADLOCK_BASE}/${name}/punishments/${punishmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function deletePunishment(
  name: string,
  punishmentId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/punishments/${punishmentId}`, {
    method: 'DELETE',
  })
}

export async function scanSteamPresence(
  identifier?: string,
  steamId?: string,
): Promise<void> {
  let endpoint: string
  if (steamId) {
    endpoint = `${PASSPORT_BASE}/presences/steam/scan-by-steam-id/${steamId}`
  } else if (identifier) {
    endpoint = `${PASSPORT_BASE}/presences/steam/scan/${identifier}`
  } else {
    endpoint = `${PASSPORT_BASE}/presences/steam/scan`
  }
  await fetchJson(endpoint, { method: 'POST' })
}

export async function invalidateSocialCredits(name: string): Promise<void> {
  await fetchJson(`${PASSPORT_BASE}/${name}/credits`, { method: 'POST' })
}

// ============ Post Admin ============

export async function fetchAdminPosts(
  params: AdminPostQuery = {},
): Promise<{ posts: AdminPost[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const endpoint = `${SPHERE_POSTS}${qs ? `?${qs}` : ''}`
  const { items, total } = await fetchPaginated<AdminPost>(endpoint)
  return { posts: items, total }
}

export async function fetchAdminPost(id: string): Promise<AdminPost> {
  return fetchJson<AdminPost>(`${SPHERE_POSTS}/${id}`)
}

export async function fetchPostLockState(id: string): Promise<PostLockState> {
  return fetchJson<PostLockState>(`${SPHERE_POSTS}/${id}/lock`)
}

export async function lockPost(id: string): Promise<void> {
  await fetchJson(`${SPHERE_POSTS}/${id}/lock`, { method: 'POST' })
}

export async function unlockPost(id: string): Promise<void> {
  await fetchJson(`${SPHERE_POSTS}/${id}/lock`, { method: 'DELETE' })
}

export async function batchLockPosts(ids: string[]): Promise<PostBatchResult> {
  // Backend route is POST /posts/{id}/lock/batch (id is path-bound but unused for filtering).
  const pathId = ids[0]
  if (!pathId) return { locked: 0 }
  return fetchJson<PostBatchResult>(`${SPHERE_POSTS}/${pathId}/lock/batch`, {
    method: 'POST',
    body: JSON.stringify(ids),
  })
}

export async function batchUnlockPosts(ids: string[]): Promise<PostBatchResult> {
  return fetchJson<PostBatchResult>(`${SPHERE_POSTS}/lock/batch`, {
    method: 'DELETE',
    body: JSON.stringify(ids),
  })
}

export async function changePostVisibility(
  id: string,
  payload: PostVisibilityPayload,
): Promise<void> {
  await fetchJson(`${SPHERE_POSTS}/${id}/visibility`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function shadowbanPost(
  id: string,
  payload: PostShadowbanPayload,
): Promise<void> {
  await fetchJson(`${SPHERE_POSTS}/${id}/shadowban`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function unshadowbanPost(id: string): Promise<void> {
  await fetchJson(`${SPHERE_POSTS}/${id}/shadowban`, { method: 'DELETE' })
}

export async function removePostFromRealm(
  id: string,
  payload: PostRealmRemovePayload,
): Promise<void> {
  await fetchJson(`${SPHERE_POSTS}/${id}/realm/remove`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteAdminPost(id: string): Promise<void> {
  await fetchJson(`${SPHERE_POSTS}/${id}`, { method: 'DELETE' })
}

// ============ Tag Admin (Sphere) ============

export async function fetchAdminTags(
  params: AdminTagQuery = {},
): Promise<{ items: AdminTag[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchPaginated<AdminTag>(`${SPHERE_TAGS}${qs ? `?${qs}` : ''}`)
}

export async function fetchAdminTag(slug: string): Promise<AdminTag> {
  return fetchJson<AdminTag>(`${SPHERE_TAGS}/${encodeURIComponent(slug)}`)
}

export async function createAdminTag(payload: AdminTagCreatePayload): Promise<AdminTag> {
  return fetchJson<AdminTag>(SPHERE_TAGS, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function updateAdminTag(slug: string, payload: AdminTagUpdatePayload): Promise<AdminTag> {
  return fetchJson<AdminTag>(`${SPHERE_TAGS}/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function assignAdminTag(slug: string, payload: AdminTagAssignPayload): Promise<AdminTag> {
  return fetchJson<AdminTag>(`${SPHERE_TAGS}/${encodeURIComponent(slug)}/assign`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function unassignAdminTag(slug: string): Promise<AdminTag> {
  return fetchJson<AdminTag>(`${SPHERE_TAGS}/${encodeURIComponent(slug)}/assign`, {
    method: 'DELETE',
  })
}

export async function setAdminTagProtected(
  slug: string,
  payload: AdminTagProtectPayload,
): Promise<AdminTag> {
  return fetchJson<AdminTag>(`${SPHERE_TAGS}/${encodeURIComponent(slug)}/protect`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function setAdminTagEvent(
  slug: string,
  payload: AdminTagEventPayload,
): Promise<AdminTag> {
  return fetchJson<AdminTag>(`${SPHERE_TAGS}/${encodeURIComponent(slug)}/event`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteAdminTag(slug: string): Promise<void> {
  await fetchJson(`${SPHERE_TAGS}/${encodeURIComponent(slug)}`, { method: 'DELETE' })
}

// ============ Category Admin (Sphere) ============

export async function fetchAdminCategories(
  params: AdminCategoryQuery = {},
): Promise<{ items: AdminCategory[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchPaginated<AdminCategory>(`${SPHERE_CATEGORIES}${qs ? `?${qs}` : ''}`)
}

export async function fetchAdminCategory(slug: string): Promise<AdminCategory> {
  return fetchJson<AdminCategory>(`${SPHERE_CATEGORIES}/${encodeURIComponent(slug)}`)
}

export async function createAdminCategory(
  payload: AdminCategoryCreatePayload,
): Promise<AdminCategory> {
  return fetchJson<AdminCategory>(SPHERE_CATEGORIES, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function updateAdminCategory(
  slug: string,
  payload: AdminCategoryUpdatePayload,
): Promise<AdminCategory> {
  return fetchJson<AdminCategory>(`${SPHERE_CATEGORIES}/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteAdminCategory(slug: string): Promise<void> {
  await fetchJson(`${SPHERE_CATEGORIES}/${encodeURIComponent(slug)}`, { method: 'DELETE' })
}

// ============ Collection Admin (Sphere) ============

export async function fetchAdminCollections(
  params: AdminCollectionQuery = {},
): Promise<{ items: AdminCollection[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchPaginated<AdminCollection>(`${SPHERE_COLLECTIONS}${qs ? `?${qs}` : ''}`)
}

export async function fetchAdminCollection(id: string): Promise<AdminCollection> {
  return fetchJson<AdminCollection>(`${SPHERE_COLLECTIONS}/${id}`)
}

export async function updateAdminCollection(
  id: string,
  payload: AdminCollectionUpdatePayload,
): Promise<AdminCollection> {
  return fetchJson<AdminCollection>(`${SPHERE_COLLECTIONS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteAdminCollection(id: string): Promise<void> {
  await fetchJson(`${SPHERE_COLLECTIONS}/${id}`, { method: 'DELETE' })
}

// ============ Publisher Admin (Sphere) ============

export async function fetchAdminPublishers(
  params: AdminPublisherQuery = {},
): Promise<{ items: AdminPublisherSummary[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchPaginated<AdminPublisherSummary>(`${SPHERE_PUBLISHERS}${qs ? `?${qs}` : ''}`)
}

export async function fetchAdminPublisher(name: string): Promise<AdminPublisherDetail> {
  return fetchJson<AdminPublisherDetail>(`${SPHERE_PUBLISHERS}/${encodeURIComponent(name)}`)
}

export async function updateAdminPublisher(
  name: string,
  payload: AdminPublisherUpdatePayload,
): Promise<AdminPublisherSummary> {
  return fetchJson<AdminPublisherSummary>(`${SPHERE_PUBLISHERS}/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function shadowbanAdminPublisher(
  name: string,
  payload: AdminPublisherShadowbanPayload,
): Promise<AdminPublisherSummary> {
  return fetchJson<AdminPublisherSummary>(
    `${SPHERE_PUBLISHERS}/${encodeURIComponent(name)}/shadowban`,
    {
      method: 'POST',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function unshadowbanAdminPublisher(name: string): Promise<AdminPublisherSummary> {
  return fetchJson<AdminPublisherSummary>(
    `${SPHERE_PUBLISHERS}/${encodeURIComponent(name)}/shadowban`,
    { method: 'DELETE' },
  )
}

export async function setAdminPublisherVerification(
  name: string,
  payload: AdminPublisherVerificationPayload,
): Promise<AdminPublisherSummary> {
  return fetchJson<AdminPublisherSummary>(
    `${SPHERE_PUBLISHERS}/${encodeURIComponent(name)}/verification`,
    {
      method: 'POST',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function clearAdminPublisherVerification(name: string): Promise<AdminPublisherSummary> {
  return fetchJson<AdminPublisherSummary>(
    `${SPHERE_PUBLISHERS}/${encodeURIComponent(name)}/verification`,
    { method: 'DELETE' },
  )
}

export async function deleteAdminPublisher(name: string): Promise<void> {
  await fetchJson(`${SPHERE_PUBLISHERS}/${encodeURIComponent(name)}`, { method: 'DELETE' })
}

// ============ Realm Admin (Passport) ============

export async function fetchAdminRealms(
  params: AdminRealmQuery = {},
): Promise<{ items: AdminRealm[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchPaginated<AdminRealm>(`${PASSPORT_REALMS}${qs ? `?${qs}` : ''}`)
}

export async function fetchAdminRealm(slug: string): Promise<AdminRealmDetail> {
  return fetchJson<AdminRealmDetail>(`${PASSPORT_REALMS}/${encodeURIComponent(slug)}`)
}

export async function updateAdminRealm(
  slug: string,
  payload: AdminRealmUpdatePayload,
): Promise<AdminRealm> {
  return fetchJson<AdminRealm>(`${PASSPORT_REALMS}/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function setAdminRealmVerification(
  slug: string,
  payload: AdminRealmVerificationPayload,
): Promise<AdminRealm> {
  return fetchJson<AdminRealm>(`${PASSPORT_REALMS}/${encodeURIComponent(slug)}/verification`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function clearAdminRealmVerification(slug: string): Promise<AdminRealm> {
  return fetchJson<AdminRealm>(`${PASSPORT_REALMS}/${encodeURIComponent(slug)}/verification`, {
    method: 'DELETE',
  })
}

export async function fetchAdminRealmMembers(
  slug: string,
  params: AdminRealmMemberQuery = {},
): Promise<{ items: AdminRealmMember[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchPaginated<AdminRealmMember>(
    `${PASSPORT_REALMS}/${encodeURIComponent(slug)}/members${qs ? `?${qs}` : ''}`,
  )
}

export async function updateAdminRealmMemberRole(
  slug: string,
  memberId: string,
  payload: AdminRealmMemberRolePayload,
): Promise<AdminRealmMember> {
  return fetchJson<AdminRealmMember>(
    `${PASSPORT_REALMS}/${encodeURIComponent(slug)}/members/${memberId}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function removeAdminRealmMember(slug: string, memberId: string): Promise<void> {
  await fetchJson(
    `${PASSPORT_REALMS}/${encodeURIComponent(slug)}/members/${memberId}`,
    { method: 'DELETE' },
  )
}

export async function deleteAdminRealm(slug: string): Promise<void> {
  await fetchJson(`${PASSPORT_REALMS}/${encodeURIComponent(slug)}`, { method: 'DELETE' })
}

// ============ Wallet Admin ============

export async function fetchAdminTransactions(
  params: AdminTransactionQuery = {},
): Promise<{ items: AdminTransaction[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const endpoint = `${WALLET_PAYMENTS}/transactions${qs ? `?${qs}` : ''}`
  return fetchPaginated<AdminTransaction>(endpoint)
}

export async function fetchAdminTransaction(id: string): Promise<AdminTransaction> {
  return fetchJson<AdminTransaction>(`${WALLET_PAYMENTS}/transactions/${id}`)
}

export async function fetchAdminOrders(
  params: AdminOrderQuery = {},
): Promise<{ items: AdminWalletOrder[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const endpoint = `${WALLET_PAYMENTS}/orders${qs ? `?${qs}` : ''}`
  return fetchPaginated<AdminWalletOrder>(endpoint)
}

export async function fetchAdminOrder(id: string): Promise<AdminWalletOrder> {
  return fetchJson<AdminWalletOrder>(`${WALLET_PAYMENTS}/orders/${id}`)
}

export async function modifyBalance(payload: BalanceModifyPayload): Promise<void> {
  await fetchJson(`${WALLET_PAYMENTS}/balance`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function fetchSubscriptions(
  params: AdminSubscriptionQuery = {},
): Promise<{ items: AdminSubscription[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const endpoint = `${WALLET_SUBSCRIPTIONS}${qs ? `?${qs}` : ''}`
  return fetchPaginated<AdminSubscription>(endpoint)
}

export async function fetchSubscriptionCatalog(): Promise<AdminSubscriptionCatalogItem[]> {
  return fetchJson<AdminSubscriptionCatalogItem[]>(`${WALLET_SUBSCRIPTIONS}/catalog`)
}

export async function fetchSubscriptionCatalogItem(
  identifier: string,
): Promise<AdminSubscriptionCatalogItem> {
  return fetchJson<AdminSubscriptionCatalogItem>(`${WALLET_SUBSCRIPTIONS}/catalog/${identifier}`)
}

export async function saveSubscriptionCatalogItem(
  payload: AdminSubscriptionCatalogItem,
): Promise<AdminSubscriptionCatalogItem> {
  return fetchJson<AdminSubscriptionCatalogItem>(`${WALLET_SUBSCRIPTIONS}/catalog`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteSubscriptionCatalogItem(identifier: string): Promise<void> {
  await fetchJson(`${WALLET_SUBSCRIPTIONS}/catalog/${identifier}`, { method: 'DELETE' })
}

export async function runMaintenanceUpdateExpired(
  batchSize?: number,
): Promise<MaintenanceResult> {
  return fetchJson<MaintenanceResult>(`${WALLET_SUBSCRIPTIONS}/maintenance/update-expired`, {
    method: 'POST',
    body: batchSize ? JSON.stringify({ batch_size: batchSize }) : undefined,
  })
}

export async function runMaintenanceActivatePending(
  batchSize?: number,
): Promise<MaintenanceResult> {
  return fetchJson<MaintenanceResult>(`${WALLET_SUBSCRIPTIONS}/maintenance/activate-pending`, {
    method: 'POST',
    body: batchSize ? JSON.stringify({ batch_size: batchSize }) : undefined,
  })
}

export async function runMaintenanceCancelInAppWallet(): Promise<MaintenanceResult> {
  return fetchJson<MaintenanceResult>(`${WALLET_SUBSCRIPTIONS}/maintenance/cancel-unavailable-in-app-wallet`, {
    method: 'POST',
  })
}

export async function fetchGoldsResupplyPack(): Promise<GoldsResupplyPack> {
  return fetchJson<GoldsResupplyPack>(`${WALLET_PRODUCTS}/golds-resupply-pack`)
}

export async function applyWalletProductOrder(orderId: string): Promise<void> {
  await fetchJson(`${WALLET_PRODUCTS}/orders/${orderId}/apply`, { method: 'POST' })
}

// ============ Cache Admin ============

export async function fetchCacheStats(): Promise<CacheStats> {
  return fetchJson<CacheStats>(`${PADLOCK_CACHE}/stats`)
}

export async function fetchCacheGroup(group: string): Promise<CacheGroupInfo> {
  return fetchJson<CacheGroupInfo>(`${PADLOCK_CACHE}/groups/${encodeURIComponent(group)}`)
}

export async function clearCacheByKey(payload: CacheClearPayload): Promise<CacheClearResult> {
  return fetchJson<CacheClearResult>(`${PADLOCK_CACHE}/keys/clear`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function clearCacheByGroup(payload: CacheClearPayload): Promise<CacheClearResult> {
  return fetchJson<CacheClearResult>(`${PADLOCK_CACHE}/groups/clear`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function clearAllCache(): Promise<CacheClearResult> {
  return fetchJson<CacheClearResult>(`${PADLOCK_CACHE}/clear`, { method: 'POST' })
}

// ============ Account Contact Management (Padlock) ============

export async function fetchAccountContacts(name: string): Promise<SnContact[]> {
  return fetchJson<SnContact[]>(`${PADLOCK_BASE}/${name}/contacts`)
}

export async function createAccountContact(
  name: string,
  payload: ContactPayload,
): Promise<SnContact> {
  return fetchJson<SnContact>(`${PADLOCK_BASE}/${name}/contacts`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function updateAccountContact(
  name: string,
  contactId: string,
  payload: ContactUpdatePayload,
): Promise<SnContact> {
  return fetchJson<SnContact>(`${PADLOCK_BASE}/${name}/contacts/${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function requestContactVerification(
  name: string,
  contactId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/contacts/${contactId}/verify/request`, {
    method: 'POST',
  })
}

export async function verifyContact(
  name: string,
  contactId: string,
  payload?: ContactVerifyPayload,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/contacts/${contactId}/verify`, {
    method: 'POST',
    body: payload ? JSON.stringify(camelToSnake(payload)) : undefined,
  })
}

export async function unverifyContact(
  name: string,
  contactId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/contacts/${contactId}/verify`, {
    method: 'DELETE',
  })
}

export async function setPrimaryContact(
  name: string,
  contactId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/contacts/${contactId}/primary`, {
    method: 'POST',
  })
}

export async function setContactVisibility(
  name: string,
  contactId: string,
  payload: ContactVisibilityPayload,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/contacts/${contactId}/visibility`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteAccountContact(
  name: string,
  contactId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/contacts/${contactId}`, {
    method: 'DELETE',
  })
}

// ============ Auth Factor Management (Padlock) ============

export async function fetchAccountFactors(name: string): Promise<AdminAuthFactor[]> {
  return fetchJson<AdminAuthFactor[]>(`${PADLOCK_BASE}/${name}/factors`)
}

export async function createAccountFactor(
  name: string,
  payload: AuthFactorCreatePayload,
): Promise<AdminAuthFactor> {
  return fetchJson<AdminAuthFactor>(`${PADLOCK_BASE}/${name}/factors`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function enableAccountFactor(
  name: string,
  factorId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/factors/${factorId}/enable`, {
    method: 'POST',
  })
}

export async function disableAccountFactor(
  name: string,
  factorId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/factors/${factorId}/disable`, {
    method: 'POST',
  })
}

export async function resetAccountPassword(
  name: string,
  payload: PasswordResetPayload,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/factors/password/reset`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteAccountFactor(
  name: string,
  factorId: string,
): Promise<void> {
  await fetchJson(`${PADLOCK_BASE}/${name}/factors/${factorId}`, {
    method: 'DELETE',
  })
}

// ============ Verification (Passport) ============

export async function setVerification(
  identifier: string,
  payload: VerificationPayload,
): Promise<void> {
  await fetchJson(`${PASSPORT_BASE}/${identifier}/verification`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function clearVerification(identifier: string): Promise<void> {
  await fetchJson(`${PASSPORT_BASE}/${identifier}/verification`, {
    method: 'DELETE',
  })
}

// ============ Badge Management (Passport) ============

export async function fetchAccountBadges(identifier: string): Promise<SnAccountBadge[]> {
  return fetchJson<SnAccountBadge[]>(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/badges`,
  )
}

export async function grantBadge(
  identifier: string,
  payload: BadgeGrantPayload,
): Promise<void> {
  await fetchJson(`${PASSPORT_BASE}/${identifier}/badges`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function activateBadge(
  identifier: string,
  badgeId: string,
): Promise<void> {
  await fetchJson(`${PASSPORT_BASE}/${identifier}/badges/${badgeId}/activate`, {
    method: 'POST',
  })
}

export async function revokeBadge(
  identifier: string,
  badgeId: string,
): Promise<void> {
  await fetchJson(`${PASSPORT_BASE}/${identifier}/badges/${badgeId}`, {
    method: 'DELETE',
  })
}

// ============ Passport Read-Only Contacts & Factors ============

export async function fetchPassportContacts(identifier: string): Promise<SnContact[]> {
  return fetchJson<SnContact[]>(`${PASSPORT_BASE}/${identifier}/contacts`)
}

export async function fetchPassportFactors(identifier: string): Promise<AdminAuthFactor[]> {
  return fetchJson<AdminAuthFactor[]>(`${PASSPORT_BASE}/${identifier}/factors`)
}

// ============ Presence Scan Extras ============

export async function scanSteamPresenceByStage(stage: string): Promise<void> {
  await fetchJson(`${PASSPORT_BASE}/presences/steam/scan/stages/${stage}`, {
    method: 'POST',
  })
}

// ============ Admin Stats (Passport / Sphere / Wallet / Ring) ============

export async function fetchPassportAdminStats(): Promise<PassportAdminStats> {
  return fetchJson<PassportAdminStats>(PASSPORT_STATS)
}

export async function fetchSphereAdminStats(): Promise<SphereAdminStats> {
  return fetchJson<SphereAdminStats>(SPHERE_STATS)
}

export async function fetchWalletAdminStats(): Promise<WalletAdminStats> {
  return fetchJson<WalletAdminStats>(WALLET_STATS)
}

export async function fetchRingAdminStats(): Promise<RingAdminStats> {
  return fetchJson<RingAdminStats>(RING_STATS)
}

export async function fetchAccountActivityMetrics(): Promise<AccountActivityMetrics> {
  return fetchJson<AccountActivityMetrics>(`${PASSPORT_BASE}/metrics/activity`)
}

/** Aggregate GeoIP map buckets from latest auth sessions (Padlock). Privacy-safe; min bucket size 10. */
export async function fetchAccountGeographyStats(
  params: AccountGeographyQuery = {},
): Promise<AccountGeographyStats> {
  const qs = buildQuery({
    since: params.since,
    precision: params.precision,
  })
  return fetchJson<AccountGeographyStats>(
    `${PADLOCK_GEOGRAPHY}${qs ? `?${qs}` : ''}`,
  )
}

// ============ Permission Groups (Padlock) ============

export async function fetchPermissionGroups(query?: string): Promise<PermissionGroupSummary[]> {
  const qs = buildQuery({ query })
  return fetchJson<PermissionGroupSummary[]>(
    `${PADLOCK_PERMISSIONS}/groups${qs ? `?${qs}` : ''}`,
  )
}

export async function fetchPermissionGroup(
  groupId: string,
  query: { nodesTake?: number; nodesOffset?: number; membersTake?: number; membersOffset?: number } = {},
): Promise<PermissionGroupDetail> {
  const qs = buildQuery(query)
  return fetchJson<PermissionGroupDetail>(`${PADLOCK_PERMISSIONS}/groups/${groupId}${qs ? `?${qs}` : ''}`)
}

export async function createPermissionGroup(key: string): Promise<{ id: string; key: string }> {
  return fetchJson(`${PADLOCK_PERMISSIONS}/groups`, {
    method: 'POST',
    body: JSON.stringify({ key }),
  })
}

export async function updatePermissionGroup(
  groupId: string,
  key: string,
): Promise<{ id: string; key: string }> {
  return fetchJson(`${PADLOCK_PERMISSIONS}/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify({ key }),
  })
}

export async function deletePermissionGroup(groupId: string): Promise<void> {
  await fetchJson(`${PADLOCK_PERMISSIONS}/groups/${groupId}`, { method: 'DELETE' })
}

export async function upsertGroupPermission(
  groupId: string,
  key: string,
  payload: UpsertGroupPermissionPayload,
): Promise<PermissionNode> {
  return fetchJson<PermissionNode>(
    `${PADLOCK_PERMISSIONS}/groups/${groupId}/permissions/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function deleteGroupPermission(groupId: string, key: string): Promise<void> {
  await fetchJson(
    `${PADLOCK_PERMISSIONS}/groups/${groupId}/permissions/${encodeURIComponent(key)}`,
    { method: 'DELETE' },
  )
}

export async function upsertGroupMember(
  groupId: string,
  actor: string,
  payload: UpsertGroupMemberPayload = {},
): Promise<PermissionGroupMember> {
  return fetchJson<PermissionGroupMember>(
    `${PADLOCK_PERMISSIONS}/groups/${groupId}/members/${encodeURIComponent(actor)}`,
    {
      method: 'PUT',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function deleteGroupMember(groupId: string, actor: string): Promise<void> {
  await fetchJson(
    `${PADLOCK_PERMISSIONS}/groups/${groupId}/members/${encodeURIComponent(actor)}`,
    { method: 'DELETE' },
  )
}

export async function fetchActorPermissions(actor: string): Promise<ActorPermissions> {
  return fetchJson<ActorPermissions>(
    `${PADLOCK_PERMISSIONS}/actors/${encodeURIComponent(actor)}`,
  )
}

export async function fetchAdminTests(): Promise<AdminTest[]> {
  return fetchJson<AdminTest[]>(PASSPORT_TESTS)
}

export async function createAdminTest(payload: AdminTest): Promise<AdminTest> {
  return fetchJson<AdminTest>(PASSPORT_TESTS, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function updateAdminTest(key: string, payload: AdminTest): Promise<AdminTest> {
  return fetchJson<AdminTest>(`${PASSPORT_TESTS}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function publishAdminTest(key: string, published: boolean): Promise<AdminTest> {
  return fetchJson<AdminTest>(`${PASSPORT_TESTS}/${encodeURIComponent(key)}/publish?published=${published}`, {
    method: 'POST',
  })
}

export async function archiveAdminTest(key: string, archived: boolean): Promise<AdminTest> {
  return fetchJson<AdminTest>(`${PASSPORT_TESTS}/${encodeURIComponent(key)}/archive?archived=${archived}`, {
    method: 'POST',
  })
}

export async function fetchAdminTestAttempts(key: string, status = 1): Promise<AdminTestAttempt[]> {
  return fetchJson<AdminTestAttempt[]>(`${PASSPORT_TESTS}/${encodeURIComponent(key)}/attempts?status=${status}`)
}

export async function reviewAdminTestAnswer(
  answerId: string,
  payload: { isCorrect: boolean; awardedPoints: number; note?: string },
): Promise<AdminTestAttempt> {
  return fetchJson<AdminTestAttempt>(`${PASSPORT_TESTS}/answers/${answerId}/review`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function fetchAdminTestTrial(key: string) {
  return fetchJson<import('~/types/test').ParticipantTest>(`${PASSPORT_TESTS}/${encodeURIComponent(key)}/trial`)
}

export async function gradeAdminTestTrial(key: string, answers: Array<{ questionId: string; choiceIds?: string[]; text?: string }>): Promise<AdminTestTrialResult> {
  return fetchJson<AdminTestTrialResult>(`${PASSPORT_TESTS}/${encodeURIComponent(key)}/trial/grade`, { method: 'POST', body: JSON.stringify(camelToSnake({ answers })) })
}

export async function createAdminTestTrialForTest(key: string): Promise<AdminTestTrial> {
  return fetchJson<AdminTestTrial>(`${PASSPORT_TESTS}/${encodeURIComponent(key)}/trials`, { method: 'POST' })
}

export async function fetchAdminTestTrials(): Promise<AdminTestTrial[]> {
  return fetchJson<AdminTestTrial[]>(PASSPORT_TEST_TRIALS)
}

export async function createAdminTestTrial(payload: AdminTestTrial): Promise<AdminTestTrial> {
  return fetchJson<AdminTestTrial>(PASSPORT_TEST_TRIALS, { method: 'POST', body: JSON.stringify(camelToSnake(payload)) })
}

export async function updateAdminTestTrial(key: string, payload: AdminTestTrial): Promise<AdminTestTrial> {
  return fetchJson<AdminTestTrial>(PASSPORT_TEST_TRIALS + '/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify(camelToSnake(payload)) })
}

export async function fetchAdminTestQuestionGroups(): Promise<AdminTestQuestionGroup[]> {
  return fetchJson<AdminTestQuestionGroup[]>(PASSPORT_TEST_QUESTION_GROUPS)
}

export async function createAdminTestQuestionGroup(payload: AdminTestQuestionGroup): Promise<AdminTestQuestionGroup> {
  return fetchJson<AdminTestQuestionGroup>(PASSPORT_TEST_QUESTION_GROUPS, { method: 'POST', body: JSON.stringify(camelToSnake(payload)) })
}

export async function updateAdminTestQuestionGroup(key: string, payload: AdminTestQuestionGroup): Promise<AdminTestQuestionGroup> {
  return fetchJson<AdminTestQuestionGroup>(`${PASSPORT_TEST_QUESTION_GROUPS}/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(camelToSnake(payload)) })
}

export async function deleteAdminTestQuestionGroup(key: string): Promise<void> {
  await fetchJson(`${PASSPORT_TEST_QUESTION_GROUPS}/${encodeURIComponent(key)}`, { method: 'DELETE' })
}

export async function fetchAdminTestQuestions(groupKey: string, take = 20, offset = 0): Promise<AdminTestQuestionPage> {
  const query = new URLSearchParams({ groupKey, take: String(take), offset: String(offset) })
  return fetchJson<AdminTestQuestionPage>(`${PASSPORT_TEST_QUESTIONS}?${query}`)
}

export async function createAdminTestQuestion(groupKey: string, payload: AdminTestQuestion): Promise<AdminTestQuestion> {
  return fetchJson<AdminTestQuestion>(PASSPORT_TEST_QUESTIONS, { method: 'POST', body: JSON.stringify(camelToSnake({ ...payload, questionGroupKey: groupKey })) })
}

export async function updateAdminTestQuestion(id: string, groupKey: string, payload: AdminTestQuestion): Promise<AdminTestQuestion> {
  return fetchJson<AdminTestQuestion>(`${PASSPORT_TEST_QUESTIONS}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(camelToSnake({ ...payload, questionGroupKey: groupKey })) })
}

export async function deleteAdminTestQuestion(id: string): Promise<void> {
  await fetchJson(`${PASSPORT_TEST_QUESTIONS}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function importAdminTestQuestions(groupKey: string, questions: AdminTestQuestion[]): Promise<{ importedCount: number }> {
  return fetchJson<{ importedCount: number }>(`${PASSPORT_TEST_QUESTIONS}/import`, { method: 'POST', body: JSON.stringify(camelToSnake({ questionGroupKey: groupKey, questions })) })
}

export async function exportAdminTestQuestionsCsv(groupKey?: string): Promise<string> {
  const query = groupKey ? `?${new URLSearchParams({ groupKey })}` : ''
  return (await apiFetch(`${PASSPORT_TEST_QUESTIONS}/export${query}`)).text()
}

export async function pruneAdminTestQuestions(groupKey?: string): Promise<{ removedCount: number }> {
  const query = new URLSearchParams({ confirm: 'true' })
  if (groupKey) query.set('groupKey', groupKey)
  return fetchJson<{ removedCount: number }>(`${PASSPORT_TEST_QUESTIONS}/prune?${query}`, { method: 'DELETE' })
}

// ============ Magic Spells (Passport) ============

export async function fetchAccountSpells(identifier: string): Promise<AdminMagicSpell[]> {
  return fetchJson<AdminMagicSpell[]>(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/spells`,
  )
}

export async function createAccountSpell(
  identifier: string,
  payload: CreateAdminMagicSpellPayload,
): Promise<AdminMagicSpell> {
  return fetchJson<AdminMagicSpell>(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/spells`,
    {
      method: 'POST',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function resendAccountSpell(
  identifier: string,
  spellId: string,
  payload: ResendAdminMagicSpellPayload = { bypassVerify: true },
): Promise<void> {
  await fetchJson(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/spells/${spellId}/resend`,
    {
      method: 'POST',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function deleteAccountSpell(identifier: string, spellId: string): Promise<void> {
  await fetchJson(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/spells/${spellId}`,
    { method: 'DELETE' },
  )
}

// ============ Account Board (Passport) ============

export async function fetchAdminAccountBoard(identifier: string): Promise<AdminBoardItem[]> {
  return fetchJson<AdminBoardItem[]>(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/board`,
  )
}

export async function replaceAccountBoard(
  identifier: string,
  items: Partial<AdminBoardItem>[],
): Promise<AdminBoardItem[]> {
  return fetchJson<AdminBoardItem[]>(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/board`,
    {
      method: 'PUT',
      body: JSON.stringify(camelToSnake(items)),
    },
  )
}

export async function pushBoardItemPayload(
  identifier: string,
  itemId: string,
  payload: BoardPayloadPush,
): Promise<AdminBoardItem> {
  return fetchJson<AdminBoardItem>(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/board/items/${itemId}/payload`,
    {
      method: 'POST',
      body: JSON.stringify(camelToSnake(payload)),
    },
  )
}

export async function deleteBoardItem(identifier: string, itemId: string): Promise<void> {
  await fetchJson(
    `${PASSPORT_BASE}/${encodeURIComponent(identifier)}/board/items/${itemId}`,
    { method: 'DELETE' },
  )
}

// ============ Email Sending Plans (Ring) ============

export async function createEmailPlan(
  payload: EmailPlanCreatePayload,
): Promise<EmailPlan> {
  return fetchJson<EmailPlan>(RING_EMAIL_PLANS, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function fetchEmailPlans(
  params: EmailPlanQuery = {},
): Promise<{ plans: EmailPlan[]; total: number }> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const endpoint = `${RING_EMAIL_PLANS}${qs ? `?${qs}` : ''}`
  const { items, total } = await fetchPaginated<EmailPlan>(endpoint)
  return { plans: items, total }
}

export async function fetchEmailPlan(planId: string): Promise<EmailPlan> {
  return fetchJson<EmailPlan>(`${RING_EMAIL_PLANS}/${planId}`)
}

export async function pauseEmailPlan(planId: string): Promise<void> {
  await fetchJson(`${RING_EMAIL_PLANS}/${planId}/pause`, { method: 'POST' })
}

export async function resumeEmailPlan(planId: string): Promise<void> {
  await fetchJson(`${RING_EMAIL_PLANS}/${planId}/resume`, { method: 'POST' })
}

export async function advanceEmailPlan(planId: string): Promise<void> {
  await fetchJson(`${RING_EMAIL_PLANS}/${planId}/advance`, { method: 'POST' })
}

// ============ DysonFS Storage Admin ============

const STORAGE_BASE = '/drive/admin/storage'

export async function fetchStoragePoolConfigs(): Promise<StoragePoolConfig[]> {
  return fetchJson<StoragePoolConfig[]>(`${STORAGE_BASE}/config`)
}

export async function updateStoragePoolConfig(
  poolId: string,
  payload: StoragePoolUpdatePayload,
): Promise<StoragePoolConfig> {
  return fetchJson<StoragePoolConfig>(`${STORAGE_BASE}/config/${encodeURIComponent(poolId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function fetchStorageNodeStatus(): Promise<StorageNodeHealth> {
  return fetchJson<StorageNodeHealth>(`${STORAGE_BASE}/status`)
}

export async function fetchStorageHealth(): Promise<StorageHealthSummary> {
  return fetchJson<StorageHealthSummary>(`${STORAGE_BASE}/health`)
}

export async function fetchStorageStats(): Promise<StorageStats> {
  return fetchJson<StorageStats>(`${STORAGE_BASE}/stats`)
}

export async function fetchStorageFailures(limit = 100): Promise<StorageFailureEvent[]> {
  return fetchJson<StorageFailureEvent[]>(`${STORAGE_BASE}/failures?limit=${limit}`)
}

export async function createPoolMigration(
  payload: PoolMigrationPayload,
): Promise<PoolMigrationTask> {
  return fetchJson<PoolMigrationTask>(`${STORAGE_BASE}/pool-migrations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchPoolMigrationTask(
  taskId: string,
): Promise<PoolMigrationTask> {
  return fetchJson<PoolMigrationTask>(`${STORAGE_BASE}/pool-migrations/${encodeURIComponent(taskId)}`)
}

// ============ WattEngine (Valve) — Workspaces ============

const VALVE_WORKSPACES = '/valve/admin/workspaces'
const VALVE_STATS = '/valve/admin/stats'

async function fetchList<T>(
  base: string,
  params: object = {},
): Promise<{ items: T[]; total: number }> {
  const q = buildQuery(params as Record<string, unknown>)
  return fetchPaginated<T>(`${base}${q ? `?${q}` : ''}`)
}

export async function fetchAdminWorkspaces(
  params: WorkspaceAdminQuery = {},
): Promise<{ items: WorkspaceAdminSummary[]; total: number }> {
  return fetchList<WorkspaceAdminSummary>(VALVE_WORKSPACES, params)
}

export async function fetchAdminWorkspace(
  id: string,
): Promise<WorkspaceAdminDetail> {
  return fetchJson<WorkspaceAdminDetail>(`${VALVE_WORKSPACES}/${id}`)
}

export async function updateAdminWorkspace(
  id: string,
  payload: WorkspaceUpdatePayload,
): Promise<Workspace> {
  return fetchJson<Workspace>(`${VALVE_WORKSPACES}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function updateAdminWorkspacePlan(
  id: string,
  payload: WorkspacePlanUpdatePayload,
): Promise<Workspace> {
  return fetchJson<Workspace>(`${VALVE_WORKSPACES}/${id}/plan`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminWorkspace(id: string): Promise<void> {
  await fetchJson(`${VALVE_WORKSPACES}/${id}`, { method: 'DELETE' })
}

export async function fetchWorkspaceAdminStats(): Promise<WorkspaceAdminStats> {
  return fetchJson<WorkspaceAdminStats>(VALVE_STATS)
}

// ============ WattEngine (Ideask) — Boards ============

const IDEASK_BOARDS = '/ideask/admin/boards'

export async function fetchAdminBoards(
  params: BoardAdminQuery = {},
): Promise<{ items: BoardAdminSummary[]; total: number }> {
  return fetchList<BoardAdminSummary>(IDEASK_BOARDS, params)
}

export async function fetchAdminBoard(id: string): Promise<BoardAdminDetail> {
  return fetchJson<BoardAdminDetail>(`${IDEASK_BOARDS}/${id}`)
}

export async function updateAdminBoard(
  id: string,
  payload: BoardUpdatePayload,
): Promise<IdeaskBoard> {
  return fetchJson<IdeaskBoard>(`${IDEASK_BOARDS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminBoard(id: string): Promise<void> {
  await fetchJson(`${IDEASK_BOARDS}/${id}`, { method: 'DELETE' })
}

// ============ WattEngine (Ideask) — Tasks ============

const IDEASK_TASKS = '/ideask/admin/tasks'

export async function fetchAdminTasks(
  params: TaskAdminQuery = {},
): Promise<{ items: TaskAdminSummary[]; total: number }> {
  return fetchList<TaskAdminSummary>(IDEASK_TASKS, params)
}

export async function fetchAdminTask(id: string): Promise<TaskAdminDetail> {
  return fetchJson<TaskAdminDetail>(`${IDEASK_TASKS}/${id}`)
}

export async function updateAdminTask(
  id: string,
  payload: TaskUpdatePayload,
): Promise<IdeaskTask> {
  return fetchJson<IdeaskTask>(`${IDEASK_TASKS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminTask(id: string): Promise<void> {
  await fetchJson(`${IDEASK_TASKS}/${id}`, { method: 'DELETE' })
}

// ============ WattEngine (Ideask) — GitHub Integrations ============

const IDEASK_GITHUB = '/ideask/admin/github-integrations'

export async function fetchAdminGitHubIntegrations(
  params: GitHubIntegrationAdminQuery = {},
): Promise<{ items: GitHubIntegrationAdminSummary[]; total: number }> {
  return fetchList<GitHubIntegrationAdminSummary>(IDEASK_GITHUB, params)
}

export async function deleteAdminGitHubIntegration(id: string): Promise<void> {
  await fetchJson(`${IDEASK_GITHUB}/${id}`, { method: 'DELETE' })
}

// ============ WattEngine (Flywheel) ============

const FLYWHEEL_ADMIN = '/flywheel/admin/flywheel'

export async function fetchFlywheelAdminStats(): Promise<FlywheelAdminStats> {
  return fetchJson<FlywheelAdminStats>(`${FLYWHEEL_ADMIN}/stats`)
}

export async function fetchFlywheelAdminApps(
  params: FlywheelAdminAppQuery = {},
): Promise<{ items: FlywheelAdminApp[]; total: number }> {
  return fetchList<FlywheelAdminApp>(`${FLYWHEEL_ADMIN}/apps`, params)
}

export async function updateFlywheelAdminApp(
  id: string,
  retainedRevisionCount: number,
): Promise<FlywheelAdminApp> {
  return fetchJson<FlywheelAdminApp>(`${FLYWHEEL_ADMIN}/apps/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ retainedRevisionCount }),
  })
}

export async function fetchFlywheelAdminAudit(
  params: { workspaceId?: string; appId?: string; take?: number; offset?: number } = {},
): Promise<{ items: FlywheelAuditEntry[]; total: number }> {
  return fetchList<FlywheelAuditEntry>(`${FLYWHEEL_ADMIN}/audit`, params)
}

export async function deleteAdminFlywheelBlob(
  blobId: string,
  workspaceId: string,
  appId: string,
): Promise<void> {
  const q = buildQuery({ workspaceId, appId })
  await fetchJson(`${FLYWHEEL_ADMIN}/blobs/${blobId}?${q}`, { method: 'DELETE' })
}
