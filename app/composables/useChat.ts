import type {
  SnChatRoom,
  SnChatMessage,
  SnChatSummary,
  ChatActivityStatus,
} from '~/types/chat'
import { eventBus } from '~/utils/eventBus'
import { messageCache } from '~/utils/messageCache'

interface ChatRoomState {
  rooms: SnChatRoom[]
  summaries: Record<string, SnChatSummary>
  unreadCount: number
  isLoading: boolean
  error: string | null
}

interface ChatMessageState {
  messages: SnChatMessage[]
  isLoading: boolean
  hasMore: boolean
  offset: number
  total: number
}

export function useChat() {
  // Guard: Chat is client-only — return empty state on the server
  if (import.meta.server) {
    return {
      rooms: computed(() => [] as SnChatRoom[]),
      summaries: computed(() => ({}) as Record<string, SnChatSummary>),
      unreadCount: computed(() => 0),
      isRoomsLoading: computed(() => false),
      roomsError: computed(() => null as string | null),
      activeRoomId: computed(() => null as string | null),
      getMessages: (_roomId: string) => computed(() => [] as SnChatMessage[]),
      isMessagesLoading: (_roomId: string) => computed(() => false),
      hasMoreMessages: (_roomId: string) => computed(() => false),
      getTypingIndicators: (_roomId: string) =>
        computed(() => [] as ChatActivityStatus[]),
      loadRooms: () => Promise.resolve(),
      loadMessages: (_roomId: string, _loadMore?: boolean) => Promise.resolve(),
      sendMessage: () =>
        Promise.reject(new Error('Chat is not available on the server')),
      enterRoom: () => {},
      leaveRoom: () => {},
      sendTypingStatus: () => {},
      markRead: () => Promise.resolve(),
    }
  }

  // Global state (shared across components)
  const roomState = reactive<ChatRoomState>({
    rooms: [],
    summaries: {},
    unreadCount: 0,
    isLoading: false,
    error: null,
  })

  // Per-room message state
  const messageStates = reactive<Record<string, ChatMessageState>>({})

  // Active room tracking
  const activeRoomId = ref<string | null>(null)

  // Typing indicators per room
  const typingIndicators = reactive<Record<string, ChatActivityStatus[]>>({})

  // Typing cleanup timers
  const typingCleanupTimers = reactive<
    Record<string, ReturnType<typeof setTimeout>>
  >({})

  const { isAuthenticated } = useAuth()
  const ws = useWebSocket()

  // Event cleanup
  let cleanupFn: (() => void) | null = null

  // ── Event Listeners ─────────────────────────────────────────────────────

  function setupListeners() {
    if (cleanupFn) return

    const onNewMessage = (message: SnChatMessage) => {
      const roomId = message.chatRoomId

      // Update summary
      const summary = roomState.summaries[roomId]
      if (summary) {
        summary.lastMessage = message
        if (roomId !== activeRoomId.value) {
          summary.unreadCount = (summary.unreadCount || 0) + 1
          roomState.unreadCount++
        }
      }

      // Add to message list if loaded
      const msgState = messageStates[roomId]
      if (msgState) {
        const exists = msgState.messages.some((m) => m.id === message.id)
        if (!exists) {
          // Create new array to trigger reactivity
          msgState.messages = [...msgState.messages, message]
          msgState.total++
          // Save to IndexedDB
          messageCache.saveMessage(message)
        }
      }
    }

    const onUpdateMessage = (message: SnChatMessage) => {
      const roomId = message.chatRoomId
      const msgState = messageStates[roomId]
      // Sync messages (messages.sync.*) reference the target via meta.message_id
      // and carry the target's full payload. Resolve the real message instead
      // of treating the sync event as a standalone row.
      const targetId =
        (message.meta?.messageId as string | undefined) ?? message.id
      if (msgState) {
        const idx = msgState.messages.findIndex((m) => m.id === targetId)
        if (idx >= 0) {
          const existing = msgState.messages[idx]!
          // Create new array to trigger reactivity
          const newMessages = [...msgState.messages]
          const merged = {
            ...existing,
            ...message,
            id: targetId,
            type: existing.type,
            createdAt: existing.createdAt,
          }
          if (merged.meta && message.meta?.messageId != null) {
            merged.meta = { ...merged.meta }
            delete merged.meta.messageId
          }
          newMessages[idx] = merged
          msgState.messages = newMessages
          messageCache.saveMessage(merged)
        }
      }

      // Update last message in summary if it's the same
      const summary = roomState.summaries[roomId]
      if (summary?.lastMessage?.id === targetId) {
        summary.lastMessage = {
          ...summary.lastMessage,
          ...message,
          id: targetId,
          type: summary.lastMessage.type,
          createdAt: summary.lastMessage.createdAt,
        }
      }
    }

    const onDeleteMessage = (data: { messageId: string; roomId: string }) => {
      const msgState = messageStates[data.roomId]
      if (msgState) {
        const idx = msgState.messages.findIndex(
          (m) => m.id === data.messageId,
        )
        if (idx >= 0) {
          const existing = msgState.messages[idx]!
          // Create new array to trigger reactivity
          const newMessages = [...msgState.messages]
          newMessages[idx] = {
            ...existing,
            deletedAt: new Date().toISOString(),
          }
          msgState.messages = newMessages
        }
        messageCache.deleteMessage(data.messageId)
      }
    }

    const onRoomRead = (data: { roomId: string; accountId: string }) => {
      const summary = roomState.summaries[data.roomId]
      if (summary) {
        const decremented = summary.unreadCount || 0
        summary.unreadCount = 0
        roomState.unreadCount = Math.max(
          0,
          roomState.unreadCount - decremented,
        )
      }
    }

    const onTyping = (data: {
      roomId: string
      sender: any
      activityType: string
      progress?: number
    }) => {
      if (!data.sender) return

      const indicators = typingIndicators[data.roomId] || []
      const existing = indicators.findIndex(
        (i) => i.sender.id === data.sender.id,
      )

      const activity: ChatActivityStatus = {
        sender: data.sender,
        timestamp: new Date(),
        activityType: data.activityType,
        progress: data.progress,
      }

      if (existing >= 0) {
        indicators[existing] = activity
      } else {
        indicators.push(activity)
      }
      typingIndicators[data.roomId] = [...indicators]

      // Auto-cleanup after 6 seconds
      if (typingCleanupTimers[data.roomId]) {
        clearTimeout(typingCleanupTimers[data.roomId])
      }
      typingCleanupTimers[data.roomId] = setTimeout(() => {
        const current = typingIndicators[data.roomId] || []
        const now = Date.now()
        typingIndicators[data.roomId] = current.filter(
          (i) => now - new Date(i.timestamp).getTime() < 6000,
        )
      }, 6000)
    }

    eventBus.on('chat:message:new', onNewMessage)
    eventBus.on('chat:message:update', onUpdateMessage)
    eventBus.on('chat:message:delete', onDeleteMessage)
    eventBus.on('chat:room:read', onRoomRead)
    eventBus.on('chat:typing', onTyping)

    cleanupFn = () => {
      eventBus.off('chat:message:new', onNewMessage)
      eventBus.off('chat:message:update', onUpdateMessage)
      eventBus.off('chat:message:delete', onDeleteMessage)
      eventBus.off('chat:room:read', onRoomRead)
      eventBus.off('chat:typing', onTyping)
    }
  }

  function teardownListeners() {
    cleanupFn?.()
    cleanupFn = null
  }

  // ── Room Operations ─────────────────────────────────────────────────────

  async function loadRooms() {
    if (!isAuthenticated.value) {
      console.log('[Chat] Not authenticated, skipping loadRooms')
      return
    }

    roomState.isLoading = true
    roomState.error = null

    try {
      console.log('[Chat] Loading rooms...')

      // Fetch rooms and summaries in parallel
      const [rooms, summaries, unreadCount] = await Promise.all([
        fetchChatRooms().catch((err) => {
          console.error('[Chat] Failed to fetch rooms:', err)
          return [] as SnChatRoom[]
        }),
        fetchChatSummary().catch((err) => {
          console.error('[Chat] Failed to fetch summary:', err)
          return {} as Record<string, SnChatSummary>
        }),
        fetchChatUnreadCount().catch((err) => {
          console.error('[Chat] Failed to fetch unread count:', err)
          return 0
        }),
      ])

      console.log('[Chat] Loaded:', {
        roomsCount: Array.isArray(rooms) ? rooms.length : 'not an array',
        summariesKeys: typeof summaries === 'object' ? Object.keys(summaries).length : 'not an object',
        unreadCount,
      })

      roomState.rooms = Array.isArray(rooms) ? rooms : []
      roomState.summaries = (summaries && typeof summaries === 'object') ? summaries : {}
      roomState.unreadCount = typeof unreadCount === 'number' ? unreadCount : 0

      // Cache rooms in IndexedDB
      try {
        await messageCache.saveRooms(rooms)
      } catch (cacheErr) {
        console.warn('[Chat] Failed to cache rooms:', cacheErr)
      }
    } catch (err) {
      console.error('[Chat] Failed to load rooms:', err)
      roomState.error = err instanceof Error ? err.message : 'Unknown error'

      // Try loading from cache
      try {
        const cached = await messageCache.getRooms()
        if (cached.length > 0) {
          console.log('[Chat] Loaded', cached.length, 'rooms from cache')
          roomState.rooms = cached
        }
      } catch (cacheErr) {
        console.error('[Chat] Failed to load from cache:', cacheErr)
      }
    } finally {
      roomState.isLoading = false
    }
  }

  // ── Message Operations ──────────────────────────────────────────────────

  async function loadMessages(roomId: string, loadMore = false) {
    if (!isAuthenticated.value) return

    if (!messageStates[roomId]) {
      messageStates[roomId] = {
        messages: [],
        isLoading: false,
        hasMore: true,
        offset: 0,
        total: 0,
      }
    }

    const msgState = messageStates[roomId]
    if (msgState.isLoading) return
    if (loadMore && !msgState.hasMore) return

    msgState.isLoading = true

    try {
      // Try loading from IndexedDB first for instant display
      if (!loadMore && msgState.messages.length === 0) {
        try {
          const cached = await messageCache.getLatestMessages(roomId, 50)
          if (cached.length > 0) {
            msgState.messages = cached
          }
        } catch {}
      }

      // Fetch from API
      const offset = loadMore ? msgState.offset : 0
      const result = await fetchChatMessages(roomId, offset, 50)

      if (loadMore) {
        // Prepend older messages, avoiding duplicates
        const existingIds = new Set(msgState.messages.map((m) => m.id))
        // API returns newest first, so reverse to get oldest first for prepending
        const newMessages = result.messages
          .filter((m) => !existingIds.has(m.id))
          .reverse()
        msgState.messages = [...newMessages, ...msgState.messages]
      } else {
        // API returns newest first, reverse to get chronological order (oldest first)
        msgState.messages = [...result.messages].reverse()
      }

      msgState.offset = offset + result.messages.length
      msgState.total = result.total
      msgState.hasMore = msgState.offset < result.total

      // Save to IndexedDB
      try {
        await messageCache.saveMessages(result.messages)
      } catch {}
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err)
      // If loading from API failed and we have no messages, try cache
      if (msgState.messages.length === 0) {
        try {
          const cached = await messageCache.getLatestMessages(roomId, 50)
          msgState.messages = cached
        } catch {}
      }
    } finally {
      msgState.isLoading = false
    }
  }

  async function sendMessage(
    roomId: string,
    content: string,
    options: {
      type?: string
      repliedMessageId?: string
      forwardedMessageId?: string
      meta?: Record<string, unknown>
      membersMentioned?: string[]
    } = {},
  ) {
    const clientMessageId = crypto.randomUUID()
    const nonce = crypto.randomUUID()

    // Get current user ID for optimistic message
    const { user } = useAuth()

    // Optimistic: add pending message locally
    const pendingMessage: SnChatMessage = {
      id: clientMessageId,
      chatRoomId: roomId,
      senderId: user.value?.id || '',
      sender: user.value
        ? ({
            id: user.value.id,
            chatRoomId: roomId,
            accountId: user.value.id,
            account: user.value,
            notify: 0,
          } as any)
        : undefined,
      type: options.type || 'text',
      content,
      clientMessageId,
      nonce,
      meta: options.meta || {},
      membersMentioned: options.membersMentioned || [],
      attachments: [],
      reactions: [],
      repliedMessageId: options.repliedMessageId,
      forwardedMessageId: options.forwardedMessageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const msgState = messageStates[roomId]
    if (msgState) {
      msgState.messages.push(pendingMessage)
    }

    try {
      const sent = await sendChatMessage(roomId, {
        content,
        type: options.type || 'text',
        clientMessageId,
        nonce,
        meta: options.meta,
        membersMentioned: options.membersMentioned,
        repliedMessageId: options.repliedMessageId,
        forwardedMessageId: options.forwardedMessageId,
      })

      // Replace pending message with server response
      if (msgState) {
        const idx = msgState.messages.findIndex(
          (m) => m.clientMessageId === clientMessageId,
        )
        if (idx >= 0) {
          msgState.messages[idx] = sent
        }
      }

      // Update summary
      const summary = roomState.summaries[roomId]
      if (summary) {
        summary.lastMessage = sent
      }

      // Save to cache
      try {
        await messageCache.saveMessage(sent)
      } catch {}
    } catch (err) {
      console.error('[Chat] Failed to send message:', err)
      // Mark as failed
      if (msgState) {
        const idx = msgState.messages.findIndex(
          (m) => m.clientMessageId === clientMessageId,
        )
        if (idx >= 0) {
          const existing = msgState.messages[idx]!
          msgState.messages[idx] = {
            ...existing,
            meta: { ...existing.meta, failed: true },
          }
        }
      }
      throw err
    }
  }

  // ── Room Subscription ───────────────────────────────────────────────────

  function enterRoom(roomId: string) {
    activeRoomId.value = roomId
    ws.subscribeToRoom(roomId)
    ws.sendReadReceipt(roomId)

    // Clear unread for this room
    const summary = roomState.summaries[roomId]
    if (summary && summary.unreadCount > 0) {
      const decremented = summary.unreadCount
      summary.unreadCount = 0
      roomState.unreadCount = Math.max(0, roomState.unreadCount - decremented)
    }

    // Mark as read on server
    markChatRoomRead(roomId).catch(() => {})
  }

  function leaveRoom(roomId: string) {
    if (activeRoomId.value === roomId) {
      activeRoomId.value = null
    }
    ws.unsubscribeFromRoom(roomId)
  }

  // ── Typing ──────────────────────────────────────────────────────────────

  let typingCooldownTimer: ReturnType<typeof setTimeout> | null = null

  function sendTypingStatus(roomId: string) {
    if (typingCooldownTimer) return
    ws.sendTypingStatus(roomId)
    typingCooldownTimer = setTimeout(() => {
      typingCooldownTimer = null
    }, 850)
  }

  // ── Initialization ──────────────────────────────────────────────────────

  watch(
    isAuthenticated,
    (auth) => {
      if (auth) {
        // Skip client-only initialization during SSR (IndexedDB, WebSocket listeners)
        if (import.meta.client) {
          setupListeners()
          loadRooms()
        }
      } else {
        teardownListeners()
        roomState.rooms = []
        roomState.summaries = {}
        roomState.unreadCount = 0
        roomState.error = null
        Object.keys(messageStates).forEach((key) => {
          delete messageStates[key]
        })
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    teardownListeners()
    Object.values(typingCleanupTimers).forEach(clearTimeout)
    if (typingCooldownTimer) clearTimeout(typingCooldownTimer)
  })

  return {
    // State
    rooms: computed(() => roomState.rooms || []),
    summaries: computed(() => roomState.summaries || {}),
    unreadCount: computed(() => roomState.unreadCount || 0),
    isRoomsLoading: computed(() => roomState.isLoading),
    roomsError: computed(() => roomState.error),
    activeRoomId,

    // Messages
    getMessages: (roomId: string) =>
      computed(() => messageStates[roomId]?.messages || []),
    isMessagesLoading: (roomId: string) =>
      computed(() => messageStates[roomId]?.isLoading || false),
    hasMoreMessages: (roomId: string) =>
      computed(() => messageStates[roomId]?.hasMore || false),

    // Typing
    getTypingIndicators: (roomId: string) =>
      computed(() => typingIndicators[roomId] || []),

    // Actions
    loadRooms,
    loadMessages,
    sendMessage,
    enterRoom,
    leaveRoom,
    sendTypingStatus,
    markRead: markChatRoomRead,
  }
}
