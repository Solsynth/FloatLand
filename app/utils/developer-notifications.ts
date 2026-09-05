import { safeJsonParse } from '~/utils/api'
import { camelToSnake } from '~/utils/case'

export interface NotificationSendRequest {
  accountId?: string
  accountIds?: string[]
  broadcastToAll?: boolean
  topic: string
  title: string
  subtitle?: string
  body: string
  actionUri?: string
  pushType?: number
  isSilent?: boolean
  isSavable?: boolean
  meta?: Record<string, unknown>
}

export interface NotificationSendResponse {
  sent: number
  scope: string
  broadcastToAll?: boolean
}

export async function sendCustomAppNotification(
  appId: string,
  apiKey: string,
  data: NotificationSendRequest,
): Promise<NotificationSendResponse> {
  const response = await fetch(
    `/api/proxy/develop/private/apps/${appId}/notifications`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(camelToSnake(data)),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  return safeJsonParse<NotificationSendResponse>(response)
}
