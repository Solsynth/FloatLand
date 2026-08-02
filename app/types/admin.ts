import type { SnAccount, SnAccountBadge, SnAccountPunishment } from './auth'
import type { FlywheelAuditEntry, Workspace, WorkspaceMember } from './workspace'

export type { SnAccountPunishment, Workspace, WorkspaceMember, FlywheelAuditEntry }

export type PunishmentType = 'block_login' | 'disable_account'

export type OrderByField = 'name' | 'name_desc' | 'created_at_desc'

export interface AdminAccountListEntry {
  account: SnAccount
  primaryEmail?: string
  contactCount: number
  authFactorCount: number
  hasPassword: boolean
  activeSessionCount: number
  activeDeviceCount: number
  activePunishment: SnAccountPunishment | null
  status?: SnAccountStatus
  badgeCount?: number
  activeActivityCount?: number
}

export interface SnAccountStatus {
  accountId: string
  label: string
  isOnline: boolean
  type?: number
}

export interface SnContact {
  id: string
  type: number
  content: string
  isPrimary: boolean
  isPublic?: boolean
  verifiedAt?: string | null
  accountId?: string
  createdAt?: string
  updatedAt?: string
}

/** Public connection shape from GET /passport/accounts/{name}/connections */
export interface AdminPublicConnection {
  provider: string
  providedIdentifier: string
  url?: string
}

export interface AdminAuthFactor {
  id: string
  type: number
  trustworthy?: number
  hasSecret: boolean
  config?: Record<string, unknown> | null
  enabledAt?: string | null
  expiredAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminAccountDetail {
  account: SnAccount
  contacts?: SnContact[]
  authFactors?: AdminAuthFactor[]
  activeSessionCount?: number
  activeDeviceCount?: number
  activePunishment?: SnAccountPunishment | null
  activePunishments?: SnAccountPunishment[]
  status?: SnAccountStatus
  activities?: SnActivity[]
  badges?: SnAccountBadge[]
  badgeCount?: number
  board?: Record<string, unknown>[]
}

export interface SnActivity {
  provider: string
  title: string
}

export interface SuspendPayload {
  reason: string
  expiredAt?: string
  type: PunishmentType
  revokeSessions?: boolean
  socialCreditReduction?: number
  publisherRatingReduction?: number
  publisherNames?: string[]
}

export interface NotificationPayload {
  accountId?: string
  accountIds?: string[]
  broadcastToAll?: boolean
  topic: string
  title: string
  subtitle?: string
  body: string
  actionUri?: string
  pushType?: string
  isSilent?: boolean
  isSavable?: boolean
  meta?: Record<string, unknown>
}

export interface EmailPayload {
  accountId?: string
  accountIds?: string[]
  broadcastToAll?: boolean
  subject: string
  htmlBody: string
}

export interface BulkDeliveryResult {
  requested: number
  resolved: number
  sent: number
  skipped: number
  broadcastToAll: boolean
}

export interface AdminAccountQuery {
  query?: string
  take?: number
  offset?: number
  orderBy?: OrderByField
}

// ============ Device & Session Management ============

export interface AdminDevice {
  /** Auth client row GUID */
  id: string
  /** Stable device identifier used in admin device routes */
  deviceId?: string
  label?: string | null
  deviceLabel?: string | null
  deviceName?: string | null
  platform?: string | null
  clientId?: string
  lastActiveAt?: string | null
  createdAt?: string
  deletedAt?: string | null
  sessions?: AdminSession[]
}

export interface AdminDeviceQuery {
  take?: number
  offset?: number
  includeDeleted?: boolean
  includeSessions?: boolean
}

export interface AdminSession {
  id: string
  type: number
  ipAddress?: string | null
  userAgent?: string | null
  location?: string | null
  clientId?: string | null
  parentSessionId?: string | null
  appId?: string | null
  scopes?: string[]
  audiences?: string[]
  lastGrantedAt?: string | null
  expiredAt?: string | null
  createdAt?: string
  deletedAt?: string | null
  childrenCount?: number
  children?: AdminSession[]
}

export interface AdminSessionQuery {
  take?: number
  offset?: number
  type?: number
  clientId?: string
  includeChildren?: boolean
  activeOnly?: boolean
}

export interface DeviceLabelPayload {
  label: string
}

// ============ Post Admin ============

export type PostVisibility =
  | 'public'
  | 'friends'
  | 'unlisted'
  | 'private'
  | 'close_friends_only'
  | 'quiet_public'

export type PostShadowbanReason = 'none' | 'spam' | 'advertising' | 'harassment' | 'hate_speech' | 'misinformation' | 'illegal' | 'other'

export interface AdminPost {
  id: string
  title?: string | null
  description?: string | null
  /** Post body from Sphere (`content` field) */
  content?: string | null
  /** Enum may arrive as snake_case string or numeric ordinal */
  visibility: PostVisibility | number | string
  shadowbanReason?: PostShadowbanReason | number | string | null
  shadowbannedAt?: string | null
  lockedAt?: string | null
  draftedAt?: string | null
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
  publisher?: AdminPostPublisher | null
  tags?: AdminPostTag[]
  categories?: AdminPostCategory[]
  realmId?: string | null
  realm?: AdminPostRealm | null
}

export interface AdminPostPublisher {
  id: string
  name: string
  nick?: string | null
}

export interface AdminPostTag {
  id: string
  name: string
  slug?: string
}

export interface AdminPostCategory {
  id: string
  name: string
  slug?: string
}

export interface AdminPostRealm {
  id: string
  name?: string
  slug?: string
  nick?: string
}

export interface PostLockState {
  locked: boolean
  lockedAt?: string
}

export interface PostVisibilityPayload {
  visibility: PostVisibility
}

export interface PostShadowbanPayload {
  reason: PostShadowbanReason
}

export interface PostRealmRemovePayload {
  reason: string
}

export interface PostBatchResult {
  locked?: number
  unlocked?: number
}

export interface AdminPostQuery {
  query?: string
  publisherId?: string
  realmId?: string
  visibility?: PostVisibility
  shadowbanReason?: PostShadowbanReason
  locked?: boolean
  drafted?: boolean
  offset?: number
  take?: number
}

// ============ Tag / Category / Collection / Publisher Admin (Sphere) ============

export type PublisherType = 'individual' | 'organizational' | 0 | 1

export type PublisherShadowbanReason =
  | 'none'
  | 'spam'
  | 'advertising'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'illegal'
  | 'other'

export type VerificationMarkType =
  | 'official'
  | 'individual'
  | 'organization'
  | 'government'
  | 'creator'
  | 'developer'
  | 'parody'
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6

export interface AdminTag {
  id: string
  slug: string
  name?: string | null
  description?: string | null
  ownerPublisherId?: string | null
  ownerPublisher?: AdminPublisherSummary | null
  isProtected?: boolean
  isEvent?: boolean
  eventEndsAt?: string | null
  usage?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminTagQuery {
  query?: string
  ownerPublisherId?: string
  unowned?: boolean
  isProtected?: boolean
  isEvent?: boolean
  order?: 'usage' | 'name' | 'created' | string
  offset?: number
  take?: number
}

export interface AdminTagCreatePayload {
  slug: string
  name?: string
  description?: string
  ownerPublisherId?: string | null
}

export interface AdminTagUpdatePayload {
  name?: string
  description?: string
}

export interface AdminTagAssignPayload {
  publisherId: string
}

export interface AdminTagProtectPayload {
  isProtected: boolean
}

export interface AdminTagEventPayload {
  isEvent: boolean
  endsAt?: string | null
}

export interface AdminCategory {
  id: string
  slug: string
  name?: string | null
  usage?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminCategoryQuery {
  query?: string
  order?: 'usage' | 'name' | 'created' | string
  offset?: number
  take?: number
}

export interface AdminCategoryCreatePayload {
  slug: string
  name?: string
}

export interface AdminCategoryUpdatePayload {
  slug?: string
  name?: string
}

export interface AdminCollection {
  id: string
  slug: string
  name?: string | null
  description?: string | null
  publisherId: string
  publisher?: AdminPublisherSummary | null
  itemCount?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminCollectionQuery {
  query?: string
  publisherId?: string
  offset?: number
  take?: number
}

export interface AdminCollectionUpdatePayload {
  name?: string
  description?: string
}

export interface AdminPublisherSummary {
  id: string
  name: string
  nick?: string | null
  bio?: string | null
  type?: PublisherType
  picture?: { id?: string } | null
  accountId?: string | null
  realmId?: string | null
  rating?: number
  shadowbanReason?: PublisherShadowbanReason | number | string | null
  shadowbannedAt?: string | null
  gatekeptFollows?: boolean | null
  moderateSubscription?: boolean | null
  verification?: {
    type?: VerificationMarkType
    title?: string | null
    description?: string | null
    verifiedBy?: string | null
  } | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminPublisherDetail {
  publisher: AdminPublisherSummary
  memberCount: number
  postCount: number
  collectionCount: number
  subscriberCount: number
}

export interface AdminPublisherQuery {
  query?: string
  type?: PublisherType | string
  shadowbanReason?: PublisherShadowbanReason
  shadowbanned?: boolean
  gatekept?: boolean
  accountId?: string
  offset?: number
  take?: number
}

export interface AdminPublisherUpdatePayload {
  name?: string
  nick?: string
  bio?: string
  gatekeptFollows?: boolean
  moderateSubscription?: boolean
}

export interface AdminPublisherShadowbanPayload {
  reason: PublisherShadowbanReason
}

export interface AdminPublisherVerificationPayload {
  type: VerificationMarkType | string
  title?: string
  description?: string
  verifiedBy?: string
}

// ============ Realm Admin (Passport) ============

export interface AdminRealm {
  id: string
  slug: string
  name: string
  description?: string | null
  isCommunity?: boolean
  isPublic?: boolean
  accountId?: string
  boostPoints?: number
  boostLevel?: number
  picture?: { id?: string } | null
  background?: { id?: string } | null
  verification?: {
    type?: VerificationMarkType
    title?: string | null
    description?: string | null
    verifiedBy?: string | null
  } | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminRealmDetail {
  realm: AdminRealm
  memberCount: number
  pendingInviteCount: number
  labelCount: number
  activeBoostContributionCount: number
}

export interface AdminRealmQuery {
  query?: string
  isPublic?: boolean
  isCommunity?: boolean
  verified?: boolean
  accountId?: string
  offset?: number
  take?: number
}

export interface AdminRealmUpdatePayload {
  slug?: string
  name?: string
  description?: string
  isCommunity?: boolean
  isPublic?: boolean
  accountId?: string
}

export interface AdminRealmVerificationPayload {
  type: VerificationMarkType | string
  title?: string
  description?: string
  verifiedBy?: string
}

export interface AdminRealmMember {
  accountId: string
  realmId: string
  role: number
  nick?: string | null
  bio?: string | null
  experience?: number
  level?: number
  joinedAt?: string | null
  leaveAt?: string | null
  account?: {
    id?: string
    name?: string
    nick?: string | null
    profile?: { picture?: { id?: string } | null } | null
  } | null
  label?: {
    id?: string
    name?: string
    color?: string | null
  } | null
}

export interface AdminRealmMemberQuery {
  role?: number
  pendingOnly?: boolean
  offset?: number
  take?: number
}

export interface AdminRealmMemberRolePayload {
  role: number
}

// ============ Admin Stats (per-service GET /admin/stats) ============

export interface PassportAdminStats {
  calculatedAt: string
  totalProfiledAccounts: number
  activeUsersLastDay: number
  activeUsersLastWeek: number
  activeUsersLastMonth: number
  registeredUsersLastDay: number
  registeredUsersLastWeek: number
  registeredUsersLastMonth: number
}

export interface SphereAdminStats {
  calculatedAt: string
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  postsLastDay: number
  postsLastWeek: number
  postsLastMonth: number
  totalPublishers: number
  totalReactions: number
  totalBookmarks: number
}

export interface WalletAdminStats {
  calculatedAt: string
  totalWallets: number
  totalTransactions: number
  confirmedTransactions: number
  pendingTransactions: number
  transactionsLastDay: number
  transactionsLastWeek: number
  transactionsLastMonth: number
  totalOrders: number
  paidOrders: number
  totalSubscriptions: number
}

export interface RingAdminStats {
  calculatedAt: string
  totalNotifications: number
  unreadNotifications: number
  notificationsLastDay: number
  notificationsLastWeek: number
  notificationsLastMonth: number
  totalPushSubscriptions: number
  activePushSubscriptions: number
  totalSendRequests: number
  totalDeliveryAttempts: number
}

export interface AccountActivityMetrics {
  calculatedAt: string
  currentDayStartedAt: string
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  previousDailyActiveUsers: number
  previousWeeklyActiveUsers: number
  previousMonthlyActiveUsers: number
  newAccountsToday: number
  newAccountsThisWeek: number
  newAccountsThisMonth: number
  totalProfiledAccounts: number
}

// ============ Account Geography Stats (Padlock) ============

export type GeographyPrecision = 'country' | 'city'

export interface AccountGeographyBucket {
  countryCode: string
  country?: string | null
  city?: string | null
  latitude: number
  longitude: number
  userCount: number
}

export interface AccountGeographyStats {
  calculatedAt: string
  since: string
  precision: GeographyPrecision | string
  accountsWithLocation: number
  /** @deprecated removed server-side; kept optional for older responses */
  minimumBucketSize?: number
  visibleAccountCount?: number
  suppressedAccountCount?: number
  buckets: AccountGeographyBucket[]
}

export interface AccountGeographyQuery {
  /** ISO-8601 UTC; defaults to 30 days ago on the server */
  since?: string
  precision?: GeographyPrecision
}

// ============ Permission Groups (Padlock) ============

export interface PermissionGroupSummary {
  id: string
  key: string
  nodeCount: number
  memberCount: number
  createdAt?: string
  updatedAt?: string
}

export interface PermissionNode {
  id: string
  type?: number
  actor: string
  key: string
  value?: unknown
  expiredAt?: string | null
  affectedAt?: string | null
  groupId?: string | null
}

export interface PermissionGroupMember {
  groupId: string
  actor: string
  expiredAt?: string | null
  affectedAt?: string | null
}

export interface PermissionGroupDetail {
  group: { id: string; key: string; createdAt?: string; updatedAt?: string }
  nodes: PermissionNode[]
  nodeTotal: number
  members: PermissionGroupMember[]
  memberTotal: number
}

export interface ActorPermissions {
  actor: string
  directPermissions: PermissionNode[]
  effectivePermissions: PermissionNode[]
  groups: PermissionGroupMember[]
}

export interface UpsertGroupPermissionPayload {
  value?: unknown
  affectedAt?: string | null
  expiredAt?: string | null
}

export interface UpsertGroupMemberPayload {
  affectedAt?: string | null
  expiredAt?: string | null
}

export interface AdminTestChoice {
  id?: string
  sortOrder: number
  content: string
  isCorrect: boolean
  config: Record<string, unknown>
}

export interface AdminTestQuestion {
  id?: string
  sortOrder: number
  content: string
  category?: string | null
  type: number
  gradingMode: number
  difficulty: number
  points: number
  config: Record<string, unknown>
  choices: AdminTestChoice[]
}

export interface AdminTest {
  id?: string
  key: string
  title: string
  description?: string | null
  isPublished: boolean
  isListed: boolean
  shuffleQuestions: boolean
  allowCategorySelection: boolean
  randomQuestionCount?: number | null
  simpleQuestionPercentage: number
  isArchived?: boolean
  passingScore: number
  maxAttempts?: number | null
  attemptPeriodDays: number
  timeLimitSeconds?: number | null
  rewardExperience?: number | null
  grantedPermissionGroupKey?: string | null
  config: Record<string, unknown>
  questionGroups: AdminTestQuestionGroupAssignment[]
}

export interface AdminTestQuestionGroupAssignment {
  id?: string
  questionGroupKey: string
  questionGroup?: AdminTestQuestionGroup
  sortOrder: number
}

export interface AdminTestQuestionGroup {
  id?: string
  key: string
  title: string
  description?: string | null
  config: Record<string, unknown>
  questionCount?: number
  questions?: AdminTestQuestion[]
}

export interface AdminTestQuestionPage {
  totalCount: number
  items: AdminTestQuestion[]
}

export interface AdminTestAnswer {
  id: string
  questionId: string
  value: Record<string, unknown>
  isCorrect?: boolean | null
  awardedPoints?: number | null
  reviewNote?: string | null
  reviewedAt?: string | null
}

export interface AdminTestAttempt {
  id: string
  accountId: string
  status: number
  startedAt: string
  submittedAt?: string | null
  score?: number | null
  answers: AdminTestAnswer[]
}

export interface AdminTestTrialResult {
  score?: number | null
  passed: boolean
  answers: Array<{ questionId: string; isCorrect?: boolean | null; awardedPoints?: number | null }>
}

export interface AdminTestTrial {
  key: string
  title: string
  description?: string | null
  isPublished: boolean
  testKey: string
  testTitle?: string
}

// ============ Account Board (Passport) ============

export type AdminBoardItemKind = 'prebuilt' | 'custom_app' | 0 | 1

export interface AdminBoardItem {
  id: string
  accountId?: string
  order: number
  kind: AdminBoardItemKind
  widgetKey?: string | null
  customAppId?: string | null
  customAppWidgetKey?: string | null
  isEnabled: boolean
  payload?: Record<string, { value?: unknown; label?: string; format?: string } | unknown>
  createdAt?: string
  updatedAt?: string
}

export interface BoardPayloadPush {
  payload: Record<string, { value: unknown; label: string; format?: string }>
}

// ============ Wallet Admin ============

export interface AdminTransaction {
  id: string
  walletId?: string
  accountId?: string
  status: string
  type: string
  currency: string
  amount: number
  remark?: string
  createdAt: string
  payerWallet?: AdminWalletInfo
  payeeWallet?: AdminWalletInfo
}

export interface AdminWalletInfo {
  id: string
  accountId?: string
  account?: Record<string, unknown>
}

export interface AdminWalletOrder {
  id: string
  walletId?: string
  accountId?: string
  status: string
  appIdentifier?: string
  productIdentifier?: string
  currency: string
  amount: number
  createdAt: string
  transaction?: AdminTransaction
  items?: Record<string, unknown>[]
  payeeWallet?: AdminWalletInfo
}

export interface AdminTransactionQuery {
  walletId?: string
  accountId?: string
  status?: string
  type?: string
  currency?: string
  offset?: number
  take?: number
}

export interface AdminOrderQuery {
  walletId?: string
  accountId?: string
  status?: string
  appIdentifier?: string
  productIdentifier?: string
  currency?: string
  offset?: number
  take?: number
}

export interface BalanceModifyPayload {
  accountId?: string
  walletId?: string
  currency: string
  amount: number
  remark?: string
  forceOperation?: boolean
}

export interface AdminSubscription {
  id: string
  accountId: string
  identifier: string
  status: string
  isActive: boolean
  isTesting: boolean
  begunAt?: string
  expiredAt?: string
  coupon?: Record<string, unknown>
}

export interface AdminSubscriptionQuery {
  accountId?: string
  identifier?: string
  status?: string
  isActive?: boolean
  isTesting?: boolean
  offset?: number
  take?: number
}

export interface AdminSubscriptionCatalogItem {
  identifier: string
  groupIdentifier: string
  displayName: string
  currency: string
  basePrice: number
  perkLevel: number
  minimumAccountLevel?: number
  experienceMultiplier?: number
  goldenPointReward?: number
  displayConfig?: Record<string, unknown>
  paymentPolicy?: Record<string, unknown>
  giftPolicy?: Record<string, unknown>
  providerMappings?: Record<string, unknown>
  appIdentifier?: string
}

export interface GoldsResupplyPack {
  key: string
  identifier: string
  displayName: string
  currency: string
  providerMappings?: Record<string, unknown>
}

export interface MaintenanceResult {
  affectedCount: number
}

// ============ Cache Admin ============

export interface CacheStats {
  keyspaceHits: number
  keyspaceMisses: number
  totalCommandsProcessed: number
  evictedKeys: number
  expiredKeys: number
  connectedClients: number
  usedMemoryBytes: number
  readCount: number
  hitRatio: number
}

export interface CacheGroupInfo {
  group: string
  count: number
  keys: string[]
}

export interface CacheClearPayload {
  key?: string
  group?: string
}

export interface CacheClearResult {
  scope: 'key' | 'group' | 'all'
  key?: string | null
  group?: string | null
  removedCount: number
}

// ============ Account Contact Management ============

export interface ContactPayload {
  type: number
  content: string
}

export interface ContactUpdatePayload {
  type?: number
  content?: string
}

export interface ContactVerifyPayload {
  verifiedAt?: string
}

export interface ContactVisibilityPayload {
  isPublic: boolean
}

// ============ Auth Factor Management ============

export interface AuthFactorCreatePayload {
  type: number
  config?: Record<string, unknown>
}

export interface PasswordResetPayload {
  newPassword: string
  revokeSessions?: boolean
}

// ============ Verification ============

export interface VerificationPayload {
  type: number
  title?: string
  description?: string
  verifiedBy?: string
}

// ============ Badge Management ============

export interface BadgeGrantPayload {
  type: string
  label: string
  caption?: string
  meta?: Record<string, unknown>
}

// ============ Magic Spells (Passport) ============

/** Matches MagicSpellType enum ordinals from DysonNetwork.Shared */
export type MagicSpellType =
  | 0 // account_activation
  | 1 // account_deactivation (not emailable via admin)
  | 2 // account_removal
  | 3 // auth_password_reset
  | 4 // contact_verification

export interface AdminMagicSpell {
  id: string
  type: MagicSpellType | number
  expiresAt?: string | null
  affectedAt?: string | null
  meta?: Record<string, unknown>
  accountId?: string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface CreateAdminMagicSpellPayload {
  type: MagicSpellType | number
  meta?: Record<string, unknown>
  expiresAt?: string | null
  affectedAt?: string | null
  code?: string
  preventRepeat?: boolean
  sendEmail?: boolean
  bypassVerify?: boolean
}

export interface ResendAdminMagicSpellPayload {
  bypassVerify?: boolean
}

// ============ Delivery Observability (Ring built-in) ============

export interface DeliverySummary {
  total: number
  successful: number
  failed: number
  invalidToken: number
  skipped: number
  /** null when there were no attempts in the success-rate denominator */
  successRate: number | null
}

export interface DeliveryBreakdown extends DeliverySummary {
  key: string
}

export interface EmailDeliveryOverview {
  summary: DeliverySummary
  bySource: DeliveryBreakdown[]
}

export interface NotificationDeliveryOverview {
  sendRequests: number
  sendRequestsByTopic: DeliveryBreakdown[]
  summary: DeliverySummary
  byProvider: DeliveryBreakdown[]
  byTopic: DeliveryBreakdown[]
}

export interface DeliveryObservabilityQuery {
  /** ISO-8601 UTC start (NodaTime Instant). Defaults to 30 days ago. */
  from?: string
  /** ISO-8601 UTC end (NodaTime Instant). Defaults to now. */
  to?: string
}

// ============ Email Sending Plans ============

export interface EmailPlanCreatePayload {
  accountIds?: string[]
  broadcastToAll?: boolean
  sendingPlanKey?: string
  subject: string
  htmlBody: string
  plannedStartAt?: string
  maxEmailsPerInterval?: number
  intervalMinutes?: number
  maxEmailsPerDay?: number
}

export interface EmailPlanCounts {
  total: number
  pending: number
  sent: number
  skipped: number
  failed: number
}

export interface EmailPlanAdvance {
  intervalNumber: number
  isManual: boolean
  attemptedCount: number
  sentCount: number
  skippedCount: number
  failedCount: number
  pendingCountAfter: number
  startedAt: string
  completedAt: string
}

export interface EmailPlan {
  id: string
  sendingPlanKey?: string
  createdByAccountId?: string
  subject: string
  broadcastToAll: boolean
  recipientCount: number
  maxEmailsPerInterval: number
  intervalMinutes: number
  maxEmailsPerDay: number
  status: number
  advancedIntervalsCount: number
  plannedStartAt?: string
  nextIntervalAt?: string
  lastAdvancedAt?: string
  pausedAt?: string
  completedAt?: string
  counts: EmailPlanCounts
  advances?: EmailPlanAdvance[]
}

export interface EmailPlanQuery {
  take?: number
  offset?: number
  status?: number
}

// ============ DysonFS Storage Admin ============

export interface StoragePoolConfig {
  id: string
  name: string
  description: string
  storage_config: {
    endpoint: string
    bucket: string
    enable_ssl: boolean
    enable_signed: boolean
    secret_id: string
    secret_key: string
  }
  secret_id_configured: boolean
  secret_key_configured: boolean
  billing_config: { cost_multiplier: number }
  policy_config: { public_usable: boolean }
  is_hidden: boolean
}

export interface StoragePoolUpdatePayload {
  storage_config: {
    endpoint: string
    bucket: string
    enable_ssl: boolean
    enable_signed: boolean
  }
}

export interface StorageNodeHealth {
  checked_at: string
  nodes: Array<{
    id: string
    name: string
    machine_id: string
    endpoint: string
    pool_id: string
    status: string
    healthy: boolean
    last_seen_at: string
  }>
}

export interface StorageHealthSummary {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checked_at: string
  total_nodes: number
  healthy_nodes: number
}

export interface StorageStats {
  calculated_at: string
  pools: Array<{
    pool_id: string
    file_count: number
    used_bytes: number
  }>
}

export interface StorageFailureEvent {
  id: string
  message: string
  occurred_at: string
}

export interface PoolMigrationPayload {
  source_pool_id: string
  target_pool_id: string
  file_ids?: string[]
}

export interface PoolMigrationTask {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  chunks_count: number
  chunks_uploaded: number
  parameters: {
    source_pool_id: string
    target_pool_id: string
    file_ids?: string[]
  }
  error_message?: string
}

// ============ WattEngine · Valve (Workspaces) ============

export const WorkspaceType = {
  individual: 0,
  organization: 1,
} as const

export const WorkspacePlan = {
  free: 0,
  pro: 1,
  enterprise: 2,
} as const

export interface WorkspaceAdminSummary {
  id: string
  slug: string
  name: string
  type: number
  plan: number
  ownerAccountId: string
  isBundled: boolean
  memberCount: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkspaceAdminQuery {
  type?: number
  plan?: number
  q?: string
  includeDeleted?: boolean
  take?: number
  offset?: number
}

export interface WorkspaceRolePermission {
  id: string
  workspaceId: string
  roleLevel: number
  canManageWorkspace: boolean
  canManageMembers: boolean
  canManageBilling: boolean
  canCreateProjects: boolean
  canManageProjects: boolean
  canUseIdeask: boolean
  canUseDrive: boolean
}

export interface WorkspaceUserPermission {
  id: string
  workspaceId: string
  accountId: string
  canManageWorkspace?: boolean | null
  canManageMembers?: boolean | null
  canManageBilling?: boolean | null
  canCreateProjects?: boolean | null
  canManageProjects?: boolean | null
  canUseIdeask?: boolean | null
  canUseDrive?: boolean | null
}

export interface WorkspaceBundledPlan {
  id: string
  workspaceId: string
  accountId: string
  plan: number
  active: boolean
}

export interface WorkspaceAdminDetail {
  workspace: Workspace
  members: WorkspaceMember[]
  rolePermissions: WorkspaceRolePermission[]
  userPermissions: WorkspaceUserPermission[]
  bundledPlans: WorkspaceBundledPlan[]
}

export interface WorkspaceUpdatePayload {
  name?: string
  slug?: string
  description?: string
}

export interface WorkspacePlanUpdatePayload {
  plan: number
  planExpiresAt?: string | null
  isBundled?: boolean
}

export interface BackfillWorkspacesPayload {
  accountIds: string[]
}

export interface BackfillIndividualWorkspaceResult {
  accountId: string
  created: boolean
  workspaceId: string | null
  alreadyExists: boolean
  error: string | null
}

export interface WorkspaceAdminStats {
  calculatedAt: string
  totalWorkspaces: number
  totalDeletedWorkspaces: number
  workspacesByType: Record<string, number>
  workspacesByPlan: Record<string, number>
  totalMembers: number
  totalRolePermissionConfigs: number
  totalUserPermissionOverrides: number
  totalBundledPlans: number
}

// ==================== WattEngine (Ideask) ====================

export type IdeaskVisibility = 0 | 1
export const IdeaskVisibility = {
  private: 0,
  public: 1,
} as const

/** Backend TaskCompleteReason enum, serialized as an integer. 0=Completed, 1=Skipped, 2=Duplicated. */
export type TaskCompleteReason = 0 | 1 | 2
/** Backend TaskStatus enum, serialized as an integer. 0=Open, 1=Completed, 2=Skipped, 3=Duplicated. */
export type TaskListStatus = 0 | 1 | 2 | 3

export interface BoardAdminSummary {
  id: string
  name: string
  accountId: string
  workspaceId: string | null
  visibility: IdeaskVisibility
  taskPrefix: string | null
  taskCount: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BoardAdminQuery {
  workspaceId?: string
  accountId?: string
  visibility?: number
  q?: string
  includeDeleted?: boolean
  take?: number
  offset?: number
}

export interface IdeaskBoard {
  id: string
  name: string
  accountId: string
  workspaceId: string | null
  taskPrefix: string | null
  visibility: number
  description: string | null
  content: string | null
  createdAt: string
  updatedAt: string
}

export interface BoardAdminTaskSummary {
  id: string
  name: string
  groupId: string | null
  serialNumber: number
  priority: number
  completeReason: TaskCompleteReason | null
  deadlineAt: string | null
}

export interface BoardAdminDetail {
  broad: IdeaskBoard
  tasks: BoardAdminTaskSummary[]
}

export interface BoardUpdatePayload {
  name?: string
  description?: string
  visibility?: number
  taskPrefix?: string
  clearTaskPrefix?: boolean
}

export interface TaskAdminSummary {
  id: string
  broadId: string
  name: string
  groupId: string | null
  serialNumber: number
  priority: number
  completeReason: TaskCompleteReason | null
  deadlineAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskAdminQuery {
  broadId?: string
  status?: TaskListStatus
  groupId?: string
  q?: string
  includeDeleted?: boolean
  take?: number
  offset?: number
}

export interface IdeaskTaskComment {
  id: string
  taskId: string
  authorAccountId: string | null
  externalAuthorLogin: string | null
  externalAuthorAvatarUrl: string | null
  content: string
  createdAt: string
}

export interface IdeaskGitHubIssueLink {
  id: string
  integrationId: string
  taskId: string
  githubIssueId: number
  issueNumber: number
  repositoryFullName: string | null
  htmlUrl: string
  lastGitHubUpdatedAt: string | null
}

export interface IdeaskTask {
  id: string
  name: string
  description: string | null
  content: string | null
  priority: number
  serialNumber: number
  taskKey: string
  deadlineAt: string | null
  completedAt: string | null
  completeReason: TaskCompleteReason | null
  broadId: string
  groupId: string | null
  parentTaskId: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskAdminDetail {
  task: IdeaskTask
  assigneeAccountIds: string[]
  comments: IdeaskTaskComment[]
  githubIssues: IdeaskGitHubIssueLink[]
}

export interface TaskUpdatePayload {
  name?: string
  description?: string
  priority?: number
  deadlineAt?: string | null
  complete?: boolean
}

export interface GitHubIntegrationAdminSummary {
  id: string
  broadId: string
  installationId: number
  githubRepositoryId: number
  owner: string
  repository: string
  lastSyncedAt: string | null
  lastError: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GitHubIntegrationAdminQuery {
  broadId?: string
  q?: string
  includeDeleted?: boolean
  take?: number
  offset?: number
}

// ==================== WattEngine (Flywheel) ====================

export interface FlywheelAdminStats {
  calculatedAt: string
  distinctWorkspaceCount: number
  totalAppSettings: number
  totalBlobs: number
  totalBlobRevisions: number
  totalBytes: number
  totalAuditEntries: number
  auditsLastDay: number
  auditsLastWeek: number
  auditsLastMonth: number
}

export interface FlywheelAdminApp {
  id: string
  workspaceId: string
  appId: string
  retainedRevisionCount: number
  eventCursor: number
  blobCount: number
  revisionCount: number
  totalBytes: number
  updatedAt: string
}

export interface FlywheelAdminAppQuery {
  workspaceId?: string
  take?: number
  offset?: number
}

