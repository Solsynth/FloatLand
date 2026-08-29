import type { Realm } from './realm'
import type { SnAccount } from './auth'

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

// WebSocket packet types
export interface WebSocketPacket {
  type: string
  data?: Record<string, unknown>
  endpoint?: string
  errorMessage?: string
}
