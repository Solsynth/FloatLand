import type { Realm } from './realm'

export interface SnChatRoom {
  id: string
  name: string
  description?: string
  type: number
  realmId?: string
  realm?: Realm | null
  members?: SnChatMember[]
  background?: { id: string }
  picture?: { id: string }
  encryptionMode?: number
  createdAt: string
  updatedAt?: string
  deletedAt?: string
}

export interface SnChatMember {
  id: string
  chatRoomId: string
  accountId: string
  account: SnAccount
  nick?: string
  notify: number
  joinedAt?: string
  lastReadAt?: string
  status?: string
  realmNick?: string
  realmBio?: string
}

export interface SnChatMessage {
  id: string
  chatRoomId: string
  senderId: string
  sender?: SnChatMember
  type: string
  content?: string
  clientMessageId?: string
  nonce?: string
  meta: Record<string, unknown>
  membersMentioned: string[]
  attachments: SnCloudFileReference[]
  reactions: SnChatReaction[]
  reactionsCount?: Record<string, number>
  reactionsMade?: Record<string, boolean>
  repliedMessageId?: string
  forwardedMessageId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  editedAt?: string
  isEncrypted?: boolean
}

export interface SnCloudFileReference {
  id: string
  name: string
  mimeType: string
  size: number
  hash?: string
  hasCompression?: boolean
  url?: string
  storageUrl?: string
  width?: number
  height?: number
  blur?: string
  usage?: string
  applicationType?: string
  fileMeta?: Record<string, unknown>
  userMeta?: Record<string, unknown>
  sensitiveMarks?: number[]
}

export interface SnChatReaction {
  id: string
  messageId: string
  symbol: string
  accountId: string
  account?: SnAccount
  createdAt: string
}

export interface SnChatSummary {
  unreadCount: number
  lastMessage?: SnChatMessage
}

export interface SnChatTypingEvent {
  roomId: string
  sender: SnChatMember
  timestamp?: DateTime
  activityType: string
  progress?: number
}

// WebSocket packet types
export interface WebSocketPacket {
  type: string
  data?: Record<string, unknown>
  endpoint?: string
  errorMessage?: string
}

// Message status for local tracking
export type MessageStatus = 'pending' | 'sent' | 'failed'

// Local message wrapper with additional metadata
export interface LocalChatMessage extends SnChatMessage {
  status: MessageStatus
  clientMessageId?: string
  nonce?: string
}

// Chat activity status for typing indicators
export interface ChatActivityStatus {
  sender: SnChatMember
  timestamp: Date
  activityType: string
  progress?: number
}

// Helper type for DateTime
type DateTime = string | Date
