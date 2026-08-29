import mitt from 'mitt'
import type { WebSocketPacket } from '~/types/chat'
import type { SnNotification } from '~/types/notification'

// Define all event types
export type EventBusEvents = {
  // WebSocket status
  'ws:status': 'connecting' | 'connected' | 'disconnected' | 'error'
  'ws:message': WebSocketPacket

  // Notifications
  'notification:new': SnNotification
  'notification:count': number

  // Mail realtime (mail.changed / mail.moved)
  'mail:changed': { mailboxId?: string; emailId?: string; reason?: string }
}

// Create and export the event bus
export const eventBus = mitt<EventBusEvents>()
