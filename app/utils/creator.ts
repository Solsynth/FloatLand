import type {
  PublisherStats,
  PublisherQuotaInfo,
  PublisherRatingOverview,
  PublisherManaged,
  PublisherMember,
  PublisherSubscriber,
  PublisherFollowRequest,
  FediverseStatus,
  SnStickerPack,
  SnSticker,
  SnSurvey,
  SnSurveyWithStats,
  SnSurveyAnswer,
  SnSurveySubscription,
  SnWebFeed,
  PublisherFeatureFlags,
  PublisherLeaderboardEntry,
  SnPublisherVerifiedDomain,
} from '~/types/creator'
import { apiFetch, safeJsonParse } from '~/utils/api'
import { camelToSnake } from '~/utils/case'

// ==================== Publishers ====================

export async function fetchManagedPublishers(): Promise<PublisherManaged[]> {
  const response = await apiFetch('/sphere/publishers')
  return safeJsonParse<PublisherManaged[]>(response)
}

export async function fetchPublisherById(name: string): Promise<PublisherManaged> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}`,
  )
  return safeJsonParse<PublisherManaged>(response)
}

export async function createPublisher(data: {
  name: string
  nick: string
  bio?: string
  pictureId?: string | null
  backgroundId?: string | null
  realmSlug?: string | null
}): Promise<PublisherManaged> {
  const endpoint = data.realmSlug
    ? `/sphere/publishers/organization/${encodeURIComponent(data.realmSlug)}`
    : '/sphere/publishers/individual'
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(
      camelToSnake({
        name: data.name,
        nick: data.nick,
        bio: data.bio || '',
        pictureId: data.pictureId,
        backgroundId: data.backgroundId,
      }),
    ),
  })
  return safeJsonParse<PublisherManaged>(response)
}

export async function updatePublisher(
  name: string,
  data: {
    nick?: string
    bio?: string
    pictureId?: string | null
    backgroundId?: string | null
  },
): Promise<PublisherManaged> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(
        camelToSnake({
          nick: data.nick,
          bio: data.bio,
          pictureId: data.pictureId,
          backgroundId: data.backgroundId,
        }),
      ),
    },
  )
  return safeJsonParse<PublisherManaged>(response)
}

export async function deletePublisher(name: string): Promise<void> {
  await apiFetch(`/sphere/publishers/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
}

// ==================== Stats ====================

export async function fetchPublisherStats(
  name: string,
): Promise<PublisherStats | null> {
  try {
    const response = await apiFetch(
      `/sphere/publishers/${encodeURIComponent(name)}/stats`,
    )
    return safeJsonParse<PublisherStats>(response)
  } catch {
    return null
  }
}

export async function fetchPublisherRatingOverview(
  name: string,
): Promise<PublisherRatingOverview | null> {
  try {
    const response = await apiFetch(
      `/sphere/publishers/${encodeURIComponent(name)}/rating/overview`,
    )
    return safeJsonParse<PublisherRatingOverview>(response)
  } catch {
    return null
  }
}

export async function fetchPublisherQuota(): Promise<PublisherQuotaInfo> {
  const response = await apiFetch('/sphere/publishers/quota')
  return safeJsonParse<PublisherQuotaInfo>(response)
}

export async function fetchPublisherLeaderboard(): Promise<
  PublisherLeaderboardEntry[]
> {
  const response = await apiFetch('/sphere/publishers/leaderboard')
  return safeJsonParse<PublisherLeaderboardEntry[]>(response)
}

// ==================== Features ====================

export async function fetchPublisherFeatures(
  name: string,
): Promise<PublisherFeatureFlags> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}/features`,
  )
  return safeJsonParse<PublisherFeatureFlags>(response)
}

export async function enablePublisherFeature(
  name: string,
  flag: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}/features`,
    {
      method: 'POST',
      body: JSON.stringify({ flag }),
    },
  )
}

export async function disablePublisherFeature(
  name: string,
  flag: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}/features?flag=${encodeURIComponent(flag)}`,
    { method: 'DELETE' },
  )
}

// ==================== Identity ====================

export async function fetchPublisherIdentity(
  name: string,
): Promise<PublisherMember | null> {
  try {
    const response = await apiFetch(
      `/sphere/publishers/${encodeURIComponent(name)}/members/me`,
    )
    return safeJsonParse<PublisherMember>(response)
  } catch {
    return null
  }
}

// ==================== Members ====================

export async function fetchPublisherMembers(
  name: string,
  offset = 0,
  take = 20,
): Promise<{ items: PublisherMember[]; total: number }> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}/members?offset=${offset}&take=${take}`,
  )
  const total = parseInt(response.headers.get('x-total') || '0', 10)
  const items = await safeJsonParse<PublisherMember[]>(response)
  return { items, total }
}

export async function inviteMember(
  publisherName: string,
  accountId: string,
  role = 0,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/invites/${encodeURIComponent(publisherName)}`,
    {
      method: 'POST',
      body: JSON.stringify(
        camelToSnake({ relatedUserId: accountId, role }),
      ),
    },
  )
}

export async function removeMember(
  publisherName: string,
  accountId: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/members/${encodeURIComponent(accountId)}`,
    { method: 'DELETE' },
  )
}

export async function updateMemberRole(
  publisherName: string,
  accountId: string,
  role: number,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/members/${encodeURIComponent(accountId)}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify(role),
    },
  )
}

// ==================== Subscribers ====================

export async function fetchPublisherSubscribers(
  name: string,
  offset = 0,
  take = 20,
): Promise<{ items: PublisherSubscriber[]; total: number }> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(name)}/subscribers?offset=${offset}&take=${take}`,
  )
  const total = parseInt(response.headers.get('x-total') || '0', 10)
  const items = await safeJsonParse<PublisherSubscriber[]>(response)
  return { items, total }
}

export async function addSubscriber(
  publisherName: string,
  accountId: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscribers/${encodeURIComponent(accountId)}`,
    { method: 'POST' },
  )
}

export async function removeSubscriber(
  publisherName: string,
  accountId: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscribers/${encodeURIComponent(accountId)}`,
    { method: 'DELETE' },
  )
}

// ==================== Follow Requests ====================

export async function fetchFollowRequests(
  publisherName: string,
): Promise<PublisherFollowRequest[]> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscription/requests`,
  )
  return safeJsonParse<PublisherFollowRequest[]>(response)
}

export async function approveFollowRequest(
  publisherName: string,
  requestId: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscription/requests/${encodeURIComponent(requestId)}/approve`,
    { method: 'POST' },
  )
}

export async function rejectFollowRequest(
  publisherName: string,
  requestId: string,
  reason?: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/subscription/requests/${encodeURIComponent(requestId)}/reject`,
    {
      method: 'POST',
      ...(reason ? { body: JSON.stringify({ reason }) } : {}),
    },
  )
}

// ==================== Invites ====================

export async function fetchPublisherInvites(): Promise<PublisherMember[]> {
  const response = await apiFetch('/sphere/publishers/invites')
  return safeJsonParse<PublisherMember[]>(response)
}

export async function acceptInvite(publisherName: string): Promise<void> {
  await apiFetch(
    `/sphere/publishers/invites/${encodeURIComponent(publisherName)}/accept`,
    { method: 'POST' },
  )
}

export async function declineInvite(publisherName: string): Promise<void> {
  await apiFetch(
    `/sphere/publishers/invites/${encodeURIComponent(publisherName)}/decline`,
    { method: 'POST' },
  )
}

// ==================== Fediverse ====================

export async function fetchFediverseStatus(
  publisherName: string,
): Promise<FediverseStatus> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/fediverse`,
  )
  return safeJsonParse<FediverseStatus>(response)
}

export async function enableFediverse(publisherName: string): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/fediverse`,
    { method: 'POST' },
  )
}

export async function disableFediverse(publisherName: string): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/fediverse`,
    { method: 'DELETE' },
  )
}

// ==================== Sticker Packs ====================

export async function fetchStickerPacks(
  publisherName: string,
  offset = 0,
  take = 20,
): Promise<{ items: SnStickerPack[]; total: number }> {
  const response = await apiFetch(
    `/sphere/stickers?pub=${encodeURIComponent(publisherName)}&offset=${offset}&take=${take}`,
  )
  const total = parseInt(response.headers.get('x-total') || '0', 10)
  const items = await safeJsonParse<SnStickerPack[]>(response)
  return { items, total }
}

export async function fetchStickerPack(
  packId: string,
): Promise<SnStickerPack> {
  const response = await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}`,
  )
  return safeJsonParse<SnStickerPack>(response)
}

export async function createStickerPack(
  publisherName: string,
  data: { name: string; description: string; prefix: string; iconId?: string | null },
): Promise<SnStickerPack> {
  const response = await apiFetch(
    `/sphere/stickers?pub=${encodeURIComponent(publisherName)}`,
    {
      method: 'POST',
      body: JSON.stringify(
        camelToSnake({
          name: data.name,
          description: data.description,
          prefix: data.prefix,
          iconId: data.iconId,
        }),
      ),
    },
  )
  return safeJsonParse<SnStickerPack>(response)
}

export async function updateStickerPack(
  packId: string,
  data: { name?: string; description?: string; prefix?: string; iconId?: string | null },
): Promise<SnStickerPack> {
  const response = await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(camelToSnake(data)),
    },
  )
  return safeJsonParse<SnStickerPack>(response)
}

export async function deleteStickerPack(packId: string): Promise<void> {
  await apiFetch(`/sphere/stickers/${encodeURIComponent(packId)}`, {
    method: 'DELETE',
  })
}

// ==================== Stickers ====================

export async function fetchStickerPackContent(
  packId: string,
): Promise<SnSticker[]> {
  const response = await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}/content`,
  )
  return safeJsonParse<SnSticker[]>(response)
}

export async function fetchSticker(
  packId: string,
  stickerId: string,
): Promise<SnSticker> {
  const response = await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}/content/${encodeURIComponent(stickerId)}`,
  )
  return safeJsonParse<SnSticker>(response)
}

export async function createSticker(
  packId: string,
  data: { name?: string; slug: string; imageId: string; size?: number; mode?: number },
): Promise<SnSticker> {
  const response = await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}/content`,
    {
      method: 'POST',
      body: JSON.stringify(camelToSnake(data)),
    },
  )
  return safeJsonParse<SnSticker>(response)
}

export async function updateSticker(
  packId: string,
  stickerId: string,
  data: { name?: string | null; slug?: string; imageId?: string; size?: number; mode?: number },
): Promise<SnSticker> {
  const response = await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}/content/${encodeURIComponent(stickerId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(camelToSnake(data)),
    },
  )
  return safeJsonParse<SnSticker>(response)
}

export async function deleteSticker(
  packId: string,
  stickerId: string,
): Promise<void> {
  await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}/content/${encodeURIComponent(stickerId)}`,
    { method: 'DELETE' },
  )
}

export async function reorderStickers(
  packId: string,
  items: { id: string; order: number }[],
): Promise<void> {
  await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}/content/order`,
    {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    },
  )
}

export async function batchUpdateStickers(
  packId: string,
  stickerIds: string[],
  data: { size?: number; mode?: number },
): Promise<void> {
  await apiFetch(
    `/sphere/stickers/${encodeURIComponent(packId)}/content/batch/rendering-settings`,
    {
      method: 'PATCH',
      body: JSON.stringify(camelToSnake({ stickerIds, ...data })),
    },
  )
}

// ==================== Batch Post Operations ====================

export async function batchDeletePosts(
  postIds: string[],
): Promise<void> {
  await apiFetch('/sphere/posts/batch', {
    method: 'DELETE',
    body: JSON.stringify({ postIds }),
  })
}

export async function batchUpdatePostVisibility(
  postIds: string[],
  visibility: 'public' | 'friends' | 'unlisted' | 'private',
): Promise<void> {
  await apiFetch('/sphere/posts/batch/visibility', {
    method: 'PATCH',
    body: JSON.stringify(camelToSnake({ postIds, visibility })),
  })
}

// ==================== Surveys ====================

export async function fetchSurveys(
  publisherName: string,
  offset = 0,
  take = 20,
): Promise<{ items: SnSurvey[]; total: number }> {
  const response = await apiFetch(
    `/sphere/surveys/me?pub=${encodeURIComponent(publisherName)}&offset=${offset}&take=${take}`,
  )
  const total = parseInt(response.headers.get('x-total') || '0', 10)
  const items = await safeJsonParse<SnSurvey[]>(response)
  return { items, total }
}

export async function fetchSurvey(
  id: string,
): Promise<SnSurveyWithStats> {
  const response = await apiFetch(`/sphere/surveys/${encodeURIComponent(id)}`)
  return safeJsonParse<SnSurveyWithStats>(response)
}

export async function createSurvey(
  publisherName: string,
  data: Record<string, unknown>,
): Promise<SnSurvey> {
  const response = await apiFetch(
    `/sphere/surveys?pub=${encodeURIComponent(publisherName)}`,
    {
      method: 'POST',
      body: JSON.stringify(camelToSnake(data)),
    },
  )
  return safeJsonParse<SnSurvey>(response)
}

export async function updateSurvey(
  id: string,
  data: Record<string, unknown>,
): Promise<SnSurvey> {
  const response = await apiFetch(
    `/sphere/surveys/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(camelToSnake(data)),
    },
  )
  return safeJsonParse<SnSurvey>(response)
}

export async function deleteSurvey(id: string): Promise<void> {
  await apiFetch(`/sphere/surveys/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function publishSurvey(id: string): Promise<SnSurvey> {
  const response = await apiFetch(
    `/sphere/surveys/${encodeURIComponent(id)}/publish`,
    { method: 'POST' },
  )
  return safeJsonParse<SnSurvey>(response)
}

export async function archiveSurvey(id: string): Promise<SnSurvey> {
  const response = await apiFetch(
    `/sphere/surveys/${encodeURIComponent(id)}/archive`,
    { method: 'POST' },
  )
  return safeJsonParse<SnSurvey>(response)
}

export async function cloneSurvey(id: string): Promise<SnSurvey> {
  const response = await apiFetch(
    `/sphere/surveys/${encodeURIComponent(id)}/clone`,
    { method: 'POST' },
  )
  return safeJsonParse<SnSurvey>(response)
}

export async function fetchSurveyFeedback(
  id: string,
  offset = 0,
  take = 20,
): Promise<{ items: SnSurveyAnswer[]; total: number }> {
  const response = await apiFetch(
    `/sphere/surveys/${encodeURIComponent(id)}/feedback?offset=${offset}&take=${take}`,
  )
  const total = parseInt(response.headers.get('x-total') || '0', 10)
  const items = await safeJsonParse<SnSurveyAnswer[]>(response)
  return { items, total }
}

// ==================== Web Feeds ====================

export async function fetchWebFeeds(
  publisherName: string,
): Promise<SnWebFeed[]> {
  const response = await apiFetch(
    `/insight/publishers/${encodeURIComponent(publisherName)}/feeds`,
  )
  return safeJsonParse<SnWebFeed[]>(response)
}

export async function fetchWebFeed(
  publisherName: string,
  feedId: string,
): Promise<SnWebFeed> {
  const response = await apiFetch(
    `/insight/publishers/${encodeURIComponent(publisherName)}/feeds/${encodeURIComponent(feedId)}`,
  )
  return safeJsonParse<SnWebFeed>(response)
}

export async function createWebFeed(
  publisherName: string,
  data: { title: string; url: string; description?: string; scrapPage?: boolean },
): Promise<SnWebFeed> {
  const response = await apiFetch(
    `/insight/publishers/${encodeURIComponent(publisherName)}/feeds`,
    {
      method: 'POST',
      body: JSON.stringify(
        camelToSnake({
          title: data.title,
          url: data.url,
          description: data.description,
          config: { scrapPage: data.scrapPage ?? false },
        }),
      ),
    },
  )
  return safeJsonParse<SnWebFeed>(response)
}

export async function updateWebFeed(
  publisherName: string,
  feedId: string,
  data: { title?: string; url?: string; description?: string; scrapPage?: boolean },
): Promise<SnWebFeed> {
  const response = await apiFetch(
    `/insight/publishers/${encodeURIComponent(publisherName)}/feeds/${encodeURIComponent(feedId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(
        camelToSnake({
          title: data.title,
          url: data.url,
          description: data.description,
          config: data.scrapPage !== undefined ? { scrapPage: data.scrapPage } : undefined,
        }),
      ),
    },
  )
  return safeJsonParse<SnWebFeed>(response)
}

export async function deleteWebFeed(
  publisherName: string,
  feedId: string,
): Promise<void> {
  await apiFetch(
    `/insight/publishers/${encodeURIComponent(publisherName)}/feeds/${encodeURIComponent(feedId)}`,
    { method: 'DELETE' },
  )
}

export async function scrapWebFeed(
  publisherName: string,
  feedId: string,
): Promise<void> {
  await apiFetch(
    `/insight/publishers/${encodeURIComponent(publisherName)}/feeds/${encodeURIComponent(feedId)}/scrap`,
    { method: 'POST' },
  )
}

// ==================== Verified Domains ====================

export async function fetchPublisherDomains(
  publisherName: string,
): Promise<SnPublisherVerifiedDomain[]> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/domains`,
  )
  return safeJsonParse<SnPublisherVerifiedDomain[]>(response)
}

export async function addDomain(
  publisherName: string,
  domain: string,
): Promise<SnPublisherVerifiedDomain> {
  const response = await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/domains`,
    {
      method: 'POST',
      body: JSON.stringify({ domain }),
    },
  )
  return safeJsonParse<SnPublisherVerifiedDomain>(response)
}

export async function removeDomain(
  publisherName: string,
  domainId: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/domains/${encodeURIComponent(domainId)}`,
    { method: 'DELETE' },
  )
}

export async function recheckDomain(
  publisherName: string,
  domainId: string,
): Promise<void> {
  await apiFetch(
    `/sphere/publishers/${encodeURIComponent(publisherName)}/domains/${encodeURIComponent(domainId)}/recheck`,
    { method: 'POST' },
  )
}
