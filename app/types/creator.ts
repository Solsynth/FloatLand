import type { FileAttachment, Account } from './post'

export interface PublisherStats {
  postsCreated: number
  stickerPacksCreated: number
  stickersCreated: number
  upvoteReceived: number
  downvoteReceived: number
}

export interface PublisherQuotaInfo {
  total: number
  used: number
  remaining: number
  level: number
  perkLevel: number
  records: unknown[]
}

export interface PublisherRatingOverview {
  grade: string
  rating: number
  rank: number
  percentile: number
}

export interface PublisherManaged {
  id: string
  name: string
  nick: string
  bio: string | null
  picture: FileAttachment | null
  background: FileAttachment | null
  type: number
  realmId: string | null
  payoutWalletId?: string | null
  createdAt: string
}

export interface PublisherMember {
  id: string
  accountId: string
  publisherId: string
  role: number
  joinedAt: string | null
  account: Account | null
  publisher: PublisherManaged | null
}

export interface PublisherSubscriber {
  subscription: {
    accountId: string
    publisherId: string
    notify: boolean
    createdAt: string
  }
  account: Account | null
}

export interface PublisherFollowRequest {
  id: string
  state: number
  accountId: string
  publisherId: string
  account: Account | null
  createdAt: string
}

export interface PublisherFollowResponse {
  status: string
  message?: string
}

export interface FediverseActor {
  username: string
  displayName: string | null
  instance: {
    domain: string
  }
}

export interface FediverseStatus {
  enabled: boolean
  actor: FediverseActor | null
  actorUri: string | null
  followerCount: number
}

export interface SnStickerPack {
  id: string
  name: string
  description: string
  prefix: string
  icon: FileAttachment | null
  publisherId: string
  createdAt: string
  updatedAt: string
}

export interface SnSticker {
  id: string
  name: string | null
  slug: string
  image: FileAttachment
  size: number
  mode: number
  packId: string
  createdAt: string
  updatedAt: string
}

export type SnSurveyStatus = 0 | 1 | 2
export type SnSurveyQuestionType = 0 | 1 | 2 | 3 | 4

export interface SnSurveyOption {
  id: string
  label: string
  description: string | null
  order: number
}

export interface SnSurveyQuestion {
  id: string
  type: SnSurveyQuestionType
  options: SnSurveyOption[] | null
  title: string
  description: string | null
  order: number
  isRequired: boolean
  attachments: unknown[]
  maxSelections: number | null
  maxLength: number | null
  minValue: number | null
  maxValue: number | null
}

export interface SnSurvey {
  id: string
  title: string | null
  description: string | null
  endedAt: string | null
  isAnonymous: boolean
  hideResults: boolean
  status: SnSurveyStatus
  publishedAt: string | null
  notifySubscribers: boolean
  attachments: unknown[]
  publisherId: string
  questions: SnSurveyQuestion[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SnSurveyAnswer {
  id: string
  answer: Record<string, unknown>
  accountId: string
  surveyId: string
  account: Account | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SnSurveyWithStats extends SnSurvey {
  userAnswer: SnSurveyAnswer | null
  stats: Record<string, Record<string, number>> | null
}

export interface SnSurveySubscription {
  id: string
  surveyId: string
  accountId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SnWebFeedConfig {
  scrapPage: boolean
}

export interface SnWebFeed {
  id: string
  title: string
  url: string
  description: string | null
  config: SnWebFeedConfig
  publisherId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PublisherFeatureFlags {
  followRequiresApproval: boolean
  postsRequireFollow: boolean
  [key: string]: boolean
}

export interface HeatmapData {
  startDate: string
  endDate: string
  data: Record<string, number>
}

export interface PublisherLeaderboardEntry {
  rank: number
  rating: number
  grade: string
  percentile: number
  publisherId: string
  name: string
  nick: string
  picture: FileAttachment | null
}

// ==================== Verified Domains ====================

export type DomainVerificationStatus = 'pending' | 'verified' | 'failed' | 'revoked'

export interface SnPublisherVerifiedDomain {
  id: string
  domain: string
  status: DomainVerificationStatus
  verifiedAt: string | null
  lastError: string | null
}
