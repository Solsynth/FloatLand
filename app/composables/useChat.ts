import { eventBus } from "~/utils/eventBus"
import { useWebSocket } from "~/composables/useWebSocket"
import type {
  SnChatRoom,
  SnChatMember,
  SnChatMessage,
  SnChatSummary,
  SnChatMessagePin,
  WebSocketPacket,
} from "~/types/chat"
import {
  fetchAllChatRooms,
  fetchChatSummaries,
  fetchChatInvites,
  fetchChatMessages,
  fetchChatRoom,
  sendChatMessage,
  sendChatVoice,
  editChatMessage,
  deleteChatMessage,
  reactToChatMessage,
  acceptChatInvite,
  declineChatInvite,
  startDirectChat,
  fetchChatOnlineStatus,
  fetchChatPins,
  markAllChatRead,
  uploadDriveFile,
  fetchChatStickerPacks,
  lookupChatStickerImage,
  pinChatMessage,
  unpinChatMessage,
  type ChatStickerPack,
  type ChatSticker,
} from "~/utils/api"

const CHAT_PAGE = 50
const CHAT_WINDOW = 500
const TYPING_TTL_MS = 6000
const TYPING_COOLDOWN_MS = 850

let realtimeWired = false
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()
const typingSentAt = new Map<string, number>()
let presenceTimer: ReturnType<typeof setTimeout> | null = null

function makeClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export type ChatFilter = "all" | "direct" | "group"
export type ChatLoadStatus = "idle" | "loading" | "ready" | "error"

export interface ChatTypingUser {
  accountId: string
  name: string
  ts: number
}

interface ChatState {
  rooms: SnChatRoom[]
  roomStatus: ChatLoadStatus
  summaries: Record<string, SnChatSummary>
  messages: Record<string, SnChatMessage[]>
  messageStatus: Record<string, ChatLoadStatus>
  /** Absolute history offset where the next older page starts. */
  messageOffsets: Record<string, number>
  olderStatus: Record<string, "idle" | "loading" | "done" | "error">
  drafts: Record<string, string>
  activeRoomId: string | null
  invites: SnChatMember[]
  filter: ChatFilter
  typing: Record<string, ChatTypingUser[]>
  /** Online member count per room (presence). */
  online: Record<string, number>
  /** accountId -> lastReadAt per room (read receipts). */
  lastReadBy: Record<string, Record<string, string>>
  pinned: Record<string, SnChatMessagePin[]>
  stickerPacks: ChatStickerPack[]
  stickerStatus: "idle" | "loading" | "ready" | "error"
  /** Memoized `:prefix+slug:` -> drive file id. */
  stickerImages: Record<string, string>
  /** i18n key of the last send/edit failure; '' when healthy. */
  sendError: string
  sending: Record<string, boolean>
  initialized: boolean
  loading: boolean
  error: string | null
}

// ── Global singleton state (shared across all callers) ───────────────────
const state = reactive<ChatState>({
  rooms: [],
  roomStatus: "idle",
  summaries: {},
  messages: {},
  messageStatus: {},
  messageOffsets: {},
  olderStatus: {},
  drafts: {},
  activeRoomId: null,
  invites: [],
  filter: "all",
  typing: {},
  online: {},
  lastReadBy: {},
  pinned: {},
  stickerPacks: [],
  stickerStatus: "idle",
  stickerImages: {},
  sendError: "",
  sending: {},
  initialized: false,
  loading: false,
  error: null,
})

/** Messager bookkeeping rows that are not anything anyone said. */
const EVENT_MESSAGE_TYPES: Record<string, true> = {
  "messages.update": true,
  "messages.sync.file": true,
  "messages.sync.finalize": true,
  "messages.sync.links": true,
  "messages.delete": true,
  "messages.reaction.added": true,
  "messages.reaction.removed": true,
  "messages.pinned": true,
  "messages.unpinned": true,
}

export function voiceUrlOf(message: SnChatMessage): string {
  const meta = message.meta
  if (!meta || typeof meta !== "object") return ""
  const record = meta as Record<string, unknown>
  const raw = record.voiceUrl ?? record.voice_url
  return typeof raw === "string" ? raw : ""
}

export function voiceDurationOf(message: SnChatMessage): number {
  const meta = message.meta
  if (!meta || typeof meta !== "object") return 0
  const record = meta as Record<string, unknown>
  const raw = record.durationMs ?? record.duration_ms
  if (typeof raw === "number" && raw > 0) return Math.round(raw)
  if (typeof raw === "string") {
    const parsed = Number(raw)
    if (!Number.isNaN(parsed) && parsed > 0) return Math.round(parsed)
  }
  return 0
}

function hasChatMessageContent(message: SnChatMessage): boolean {
  const type = message.type
  if (type === "placeholder") return false
  if (type.startsWith("system.") || type.startsWith("call.")) return false
  if (EVENT_MESSAGE_TYPES[type] === true) return false
  return (
    Boolean(message.content) ||
    (message.attachments?.length ?? 0) > 0 ||
    Boolean(voiceUrlOf(message)) ||
    voiceDurationOf(message) > 0
  )
}

function reactionCountsOf(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {}
  const counts: Record<string, number> = {}
  for (const [symbol, value] of Object.entries(raw)) {
    if (typeof value === "number" && value > 0) counts[symbol] = Math.round(value)
  }
  return counts
}

function reactionMadeOf(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== "object") return {}
  const made: Record<string, boolean> = {}
  for (const [symbol, value] of Object.entries(raw)) {
    if (value === true) made[symbol] = true
  }
  return made
}

function normalizeAttachments(raw: unknown): SnChatMessage["attachments"] {
  if (!Array.isArray(raw)) return []
  const out: SnChatMessage["attachments"] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const record = item as Record<string, unknown>
    if (typeof record.id !== "string") continue
    out.push({
      id: record.id,
      name: typeof record.name === "string" ? record.name : undefined,
      mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined,
    })
  }
  return out
}

/**
 * Normalize an unvalidated realtime payload (already snake_case→camelCase by
 * the WS bridge) into a renderable message row.
 */
function normalizeWsMessage(raw: Record<string, unknown>): SnChatMessage | null {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string") return null
  const meta = raw.meta && typeof raw.meta === "object"
    ? (raw.meta as Record<string, unknown>)
    : undefined
  return {
    id: raw.id,
    chatRoomId: typeof raw.chatRoomId === "string" ? raw.chatRoomId : "",
    type: typeof raw.type === "string" ? raw.type : "text",
    content: typeof raw.content === "string" ? raw.content : "",
    clientMessageId: typeof raw.clientMessageId === "string" ? raw.clientMessageId : null,
    repliedMessageId: typeof raw.repliedMessageId === "string" ? raw.repliedMessageId : null,
    threadId: typeof raw.threadId === "string" ? raw.threadId : null,
    forwardedMessageId:
      typeof raw.forwardedMessageId === "string" ? raw.forwardedMessageId : null,
    senderId: typeof raw.senderId === "string" ? raw.senderId : "",
    sender:
      raw.sender && typeof raw.sender === "object"
        ? (raw.sender as SnChatMember)
        : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    editedAt: typeof raw.editedAt === "string" ? raw.editedAt : null,
    deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : null,
    attachments: normalizeAttachments(raw.attachments),
    reactionsCount: reactionCountsOf(raw.reactionsCount),
    reactionsMade: reactionMadeOf(raw.reactionsMade),
    isThreadRoot: raw.isThreadRoot === true,
    threadRepliesCount:
      typeof raw.threadRepliesCount === "number" ? raw.threadRepliesCount : 0,
    membersMentioned: Array.isArray(raw.membersMentioned)
      ? raw.membersMentioned.filter((member): member is string => typeof member === "string")
      : [],
    meta,
    status: "sent",
  }
}

let selfIdCache = ""

/** Refresh the cached self account id. Safe from setup or event contexts. */
function refreshSelfId(): void {
  const auth = useAuth()
  selfIdCache = auth.user.value?.id ?? ""
}

/** The signed-in account id; a cached read (never touches pinia at render). */
function selfId(): string {
  return selfIdCache
}

/** Newest-first insert; a row with an equal timestamp goes after the existing one. */
function insertNewestFirst(list: SnChatMessage[], row: SnChatMessage): boolean {
  const at = row.createdAt || ""
  let index = list.length
  for (let i = 0; i < list.length; i++) {
    const existing = list[i]
    if (!existing) continue
    const existingAt = existing.createdAt || ""
    if (at > existingAt || (at === existingAt && row.id === existing.id)) {
      index = i
      break
    }
  }
  const current = index < list.length ? list[index] : undefined
  if (current && current.id === row.id) return false
  list.splice(index, 0, row)
  return true
}

/** Patch one row in a room's thread; returns whether it existed. */
function patchMessage(
  roomId: string,
  messageId: string,
  updater: (row: SnChatMessage) => SnChatMessage,
): boolean {
  const thread = state.messages[roomId]
  if (!thread) return false
  for (let i = 0; i < thread.length; i++) {
    const row = thread[i]
    if (!row || row.id !== messageId) continue
    thread[i] = updater(row)
    state.messages = { ...state.messages }
    return true
  }
  return false
}

/**
 * Merge rows into a thread (newest-first). A server echo replaces the
 * optimistic `pending-*` row by matching `client_message_id`. Returns whether
 * the thread actually changed.
 */
function mergeMessages(roomId: string, rows: SnChatMessage[]): boolean {
  const thread = state.messages[roomId] ?? []
  let changed = false
  for (const row of rows) {
    let replaced = false
    if (row.clientMessageId) {
      for (let i = 0; i < thread.length; i++) {
        const existing = thread[i]
        if (existing && existing.clientMessageId === row.clientMessageId && existing.id !== row.id) {
          thread[i] = { ...row, status: "sent" }
          replaced = true
          changed = true
          break
        }
      }
    }
    if (replaced) continue
    for (let i = 0; i < thread.length; i++) {
      const existing = thread[i]
      if (existing && existing.id === row.id) {
        thread[i] = { ...row, status: "sent" }
        changed = true
        replaced = true
        break
      }
    }
    if (!replaced) {
      if (insertNewestFirst(thread, { ...row, status: "sent" })) changed = true
    }
  }
  if (changed) state.messages[roomId] = thread
  return changed
}

/** Drop oldest rows beyond the window; the older-page offset shifts inward. */
function capOldest(roomId: string): void {
  const thread = state.messages[roomId]
  if (!thread || thread.length <= CHAT_WINDOW) return
  const dropped = thread.length - CHAT_WINDOW
  thread.splice(CHAT_WINDOW, dropped)
  state.messageOffsets[roomId] = Math.max(
    0,
    (state.messageOffsets[roomId] ?? 0) - dropped,
  )
}

/** Drop newest rows beyond the window (loading an older page). */
function capNewest(roomId: string): void {
  const thread = state.messages[roomId]
  if (!thread || thread.length <= CHAT_WINDOW) return
  thread.splice(0, thread.length - CHAT_WINDOW)
}

function debounce(key: string, fn: () => void, ms: number): void {
  const existing = pendingTimers.get(key)
  if (existing) clearTimeout(existing)
  pendingTimers.set(
    key,
    setTimeout(() => {
      pendingTimers.delete(key)
      fn()
    }, ms),
  )
}

function updateSummaryUnread(roomId: string, message: SnChatMessage): void {
  const summary = state.summaries[roomId]
  state.summaries = {
    ...state.summaries,
    [roomId]: {
      unreadCount: (summary?.unreadCount ?? 0) + 1,
      hasUnread: true,
      lastMessage: message,
    },
  }
}

function scheduleTypingRemoval(roomId: string, accountId: string): void {
  const key = `${roomId}:${accountId}`
  const existing = typingTimers.get(key)
  if (existing) clearTimeout(existing)
  typingTimers.set(
    key,
    setTimeout(() => {
      typingTimers.delete(key)
      state.typing[roomId] = (state.typing[roomId] ?? []).filter(
        (user) => user.accountId !== accountId,
      )
    }, TYPING_TTL_MS),
  )
}

function pushTyping(roomId: string, accountId: string, name: string): void {
  const list = state.typing[roomId] ?? []
  const existing = list.find((user) => user.accountId === accountId)
  if (existing) {
    existing.ts = Date.now()
    existing.name = name
  } else {
    list.push({ accountId, name, ts: Date.now() })
  }
  state.typing[roomId] = list
  scheduleTypingRemoval(roomId, accountId)
}

function memberDisplayName(member: SnChatMember | undefined): string {
  if (!member) return ""
  return member.nick || member.account?.nick || member.account?.name || ""
}

function applyLiveMessage(message: SnChatMessage): void {
  const roomId = message.chatRoomId
  if (!roomId) return
  if (roomId === state.activeRoomId) {
    if (!mergeMessages(roomId, [message])) return
    capOldest(roomId)
    // A peer message in the open room is a read receipt opportunity.
    if (message.senderId && message.senderId !== selfId()) {
      debounce(`markRead:${roomId}`, () => markRead(roomId), 800)
    }
    return
  }
  updateSummaryUnread(roomId, message)
}

/** Tombstone a deleted message in every loaded thread (offsets keep their slots). */
function tombstoneMessage(messageId: string): void {
  let changed = false
  for (const roomId of Object.keys(state.messages)) {
    changed = patchMessage(roomId, messageId, (row) => ({
      ...row,
      deletedAt: row.deletedAt || new Date().toISOString(),
      content: "",
      attachments: [],
      status: "sent",
    })) || changed
  }
  void changed
}

function patchReactions(
  roomId: string,
  messageId: string,
  added: boolean,
  symbol: string,
): void {
  if (!symbol) return
  patchMessage(roomId, messageId, (row) => {
    const nextCounts = { ...(row.reactionsCount ?? {}) }
    const nextMade = { ...(row.reactionsMade ?? {}) }
    if (added) {
      nextCounts[symbol] = (nextCounts[symbol] ?? 0) + 1
      nextMade[symbol] = true
    } else {
      nextCounts[symbol] = Math.max(0, (nextCounts[symbol] ?? 0) - 1)
      delete nextMade[symbol]
    }
    return { ...row, reactionsCount: nextCounts, reactionsMade: nextMade }
  })
}

function wsSend(type: string, data: Record<string, unknown>): void {
  // Socket traffic is client-only; the room page's immediate watch also runs
  // during SSR, and useWebSocket must not be touched on the server.
  if (import.meta.server) return
  const ws = useWebSocket()
  ws.send({ type, endpoint: "messager", data })
}

function subscribeRoom(roomId: string): void {
  wsSend("messages.subscribe", { chat_room_id: roomId })
}

function unsubscribeRoom(roomId: string): void {
  wsSend("messages.unsubscribe", { chat_room_id: roomId })
}

/** Per-room read receipt (WS); also clears the local unread for the room. */
function markRead(roomId: string): void {
  const thread = state.messages[roomId]
  if (!thread || thread.length === 0) return
  if (thread.some((row) => row.status === "pending")) return
  wsSend("messages.read", { chat_room_id: roomId })
  const summary = state.summaries[roomId]
  if (summary?.hasUnread || (summary?.unreadCount ?? 0) > 0) {
    state.summaries = {
      ...state.summaries,
      [roomId]: { ...summary, unreadCount: 0, hasUnread: false },
    }
  }
}

async function refreshOnline(roomId: string): Promise<void> {
  try {
    const status = await fetchChatOnlineStatus(roomId)
    state.online[roomId] = status.onlineCount
  } catch {
    // Presence is best-effort; keep the previous count.
  }
}

async function loadPins(roomId: string): Promise<void> {
  try {
    state.pinned[roomId] = await fetchChatPins(roomId)
  } catch {
    // Best-effort.
  }
}

function handleWsPacket(packet: WebSocketPacket): void {
  const payload = packet.data
  if (!payload || typeof payload !== "object") return
  const data = payload as Record<string, unknown>

  switch (packet.type) {
    case "messages.new": {
      const message = normalizeWsMessage(data)
      if (message && hasChatMessageContent(message)) applyLiveMessage(message)
      break
    }
    case "messages.update":
    case "messages.sync.file":
    case "messages.sync.finalize":
    case "messages.sync.links":
    case "messages.placeholder.finalize": {
      const message = normalizeWsMessage(data)
      if (message) applyLiveMessage(message)
      break
    }
    case "messages.delete": {
      const meta = data.meta && typeof data.meta === "object"
        ? (data.meta as Record<string, unknown>)
        : undefined
      const targetId =
        typeof meta?.messageId === "string"
          ? meta.messageId
          : typeof data.messageId === "string"
            ? data.messageId
            : ""
      if (targetId) tombstoneMessage(targetId)
      break
    }
    case "messages.typing": {
      const roomId = typeof data.roomId === "string" ? data.roomId : ""
      const sender = data.sender && typeof data.sender === "object"
        ? (data.sender as SnChatMember)
        : undefined
      if (roomId && sender?.accountId) {
        pushTyping(roomId, sender.accountId, memberDisplayName(sender))
      }
      break
    }
    case "messages.read": {
      const roomId = typeof data.chatRoomId === "string" ? data.chatRoomId : ""
      const accountId = typeof data.accountId === "string" ? data.accountId : ""
      const lastReadAt = typeof data.lastReadAt === "string" ? data.lastReadAt : ""
      if (roomId && accountId && lastReadAt) {
        state.lastReadBy = {
          ...state.lastReadBy,
          [roomId]: { ...(state.lastReadBy[roomId] ?? {}), [accountId]: lastReadAt },
        }
      }
      break
    }
    case "messages.reaction.added": {
      const meta = data.meta && typeof data.meta === "object"
        ? (data.meta as Record<string, unknown>)
        : undefined
      const targetId = typeof meta?.messageId === "string" ? meta.messageId : ""
      const roomId = typeof data.chatRoomId === "string" ? data.chatRoomId : ""
      const symbol = typeof meta?.symbol === "string" ? meta.symbol : ""
      if (targetId && roomId) {
        // Prefer the packet's own counts when the wire row carries them.
        const counts = reactionCountsOf(data.reactionsCount)
        if (Object.keys(counts).length > 0) {
          patchReactionsFromWire(roomId, targetId, counts, reactionMadeOf(data.reactionsMade))
        } else {
          patchReactions(roomId, targetId, true, symbol)
        }
      }
      break
    }
    case "messages.reaction.removed": {
      const meta = data.meta && typeof data.meta === "object"
        ? (data.meta as Record<string, unknown>)
        : undefined
      const targetId = typeof meta?.messageId === "string" ? meta.messageId : ""
      const roomId = typeof data.chatRoomId === "string" ? data.chatRoomId : ""
      const symbol = typeof meta?.symbol === "string" ? meta.symbol : ""
      if (targetId && roomId) {
        const counts = reactionCountsOf(data.reactionsCount)
        if (Object.keys(counts).length > 0) {
          patchReactionsFromWire(roomId, targetId, counts, reactionMadeOf(data.reactionsMade))
        } else {
          patchReactions(roomId, targetId, false, symbol)
        }
      }
      break
    }
    case "messages.pinned":
    case "messages.unpinned": {
      const roomId = typeof data.chatRoomId === "string" ? data.chatRoomId : ""
      if (roomId) {
        debounce(`pins:${roomId}`, () => loadPins(roomId), 400)
      }
      break
    }
    case "chat.presence.updated":
    case "chat.presence.activities.updated": {
      const roomId = typeof data.roomId === "string" ? data.roomId : ""
      if (roomId) {
        if (presenceTimer) clearTimeout(presenceTimer)
        presenceTimer = setTimeout(() => {
          void refreshOnline(roomId)
        }, 400)
      }
      break
    }
    default:
      break
  }
}

function patchReactionsFromWire(
  roomId: string,
  messageId: string,
  counts: Record<string, number>,
  made: Record<string, boolean>,
): void {
  patchMessage(roomId, messageId, (row) => ({
    ...row,
    reactionsCount: counts,
    reactionsMade: made,
  }))
}

function wireRealtime(): void {
  if (realtimeWired) return
  realtimeWired = true
  eventBus.on("ws:message", (packet) => handleWsPacket(packet))
  // The gateway drops subscriptions on reconnect; re-attach the open room.
  eventBus.on("ws:status", (status) => {
    if (status === "connected" && state.activeRoomId) subscribeRoom(state.activeRoomId)
  })
}

export function useChat() {
  // Setup-time read is safe; render-time helpers then use the cached id.
  refreshSelfId()

  function isAuthed(): boolean {
    return useAuth().isAuthenticated.value
  }

  function reset(): void {
    selfIdCache = ""
    state.rooms = []
    state.roomStatus = "idle"
    state.summaries = {}
    state.messages = {}
    state.messageStatus = {}
    state.messageOffsets = {}
    state.olderStatus = {}
    state.drafts = {}
    state.activeRoomId = null
    state.invites = []
    state.typing = {}
    state.online = {}
    state.lastReadBy = {}
    state.pinned = {}
    state.stickerPacks = []
    state.stickerStatus = "idle"
    state.stickerImages = {}
    state.sendError = ""
    state.sending = {}
    state.initialized = false
    state.loading = false
    state.error = null
    for (const timer of pendingTimers.values()) clearTimeout(timer)
    pendingTimers.clear()
  }

  async function loadRooms(): Promise<void> {
    if (!isAuthed()) return
    state.roomStatus = "loading"
    try {
      const [rooms, summaries, invites] = await Promise.all([
        fetchAllChatRooms(),
        fetchChatSummaries().catch(() => ({}) as Record<string, SnChatSummary>),
        fetchChatInvites().catch(() => [] as SnChatMember[]),
      ])
      state.rooms = rooms
      state.summaries = summaries
      state.invites = invites
      state.roomStatus = "ready"
      state.error = null
      if (import.meta.dev) {
        console.info("[chat] loadRooms ready:", rooms.length, "room(s)")
      }
    } catch (err) {
      // Keep the previous list; only surface an error when there is no cache.
      if (!state.rooms.length) state.roomStatus = "error"
      state.error = err instanceof Error ? err.message : String(err)
    }
  }

  async function loadInvites(): Promise<void> {
    try {
      state.invites = await fetchChatInvites()
    } catch {
      // Best-effort; keep the previous list.
    }
  }

  /** Ensure a room is in the list (direct entry or beyond the loaded pages). */
  async function loadRoom(roomId: string): Promise<void> {
    if (state.rooms.some((room) => room.id === roomId)) return
    try {
      const room = await fetchChatRoom(roomId)
      if (room) state.rooms = [...state.rooms, room]
    } catch {
      // The room page shows its own error state.
    }
  }

  async function loadNewest(roomId: string): Promise<void> {
    state.messageStatus[roomId] = "loading"
    try {
      const { items, total } = await fetchChatMessages(roomId, CHAT_PAGE, 0)
      const thread = state.messages[roomId] ?? []
      // A fresh thread replaces the window; a resumed one merges.
      if (thread.length === 0) {
        state.messages[roomId] = items.map((row) => ({ ...row, status: "sent" }))
      } else {
        mergeMessages(roomId, items)
        capOldest(roomId)
      }
      state.messageOffsets[roomId] = items.length
      state.olderStatus[roomId] =
        items.length < CHAT_PAGE || items.length >= total ? "done" : "idle"
      state.messageStatus[roomId] = "ready"
    } catch (err) {
      state.messageStatus[roomId] = "error"
      state.error = err instanceof Error ? err.message : String(err)
    }
  }

  async function loadOlder(roomId: string): Promise<void> {
    if (state.olderStatus[roomId] === "loading" || state.olderStatus[roomId] === "done") return
    const offset = state.messageOffsets[roomId] ?? 0
    state.olderStatus[roomId] = "loading"
    try {
      const { items, total } = await fetchChatMessages(roomId, CHAT_PAGE, offset)
      const thread = state.messages[roomId] ?? []
      for (const row of items) {
        if (!thread.some((existing) => existing.id === row.id)) {
          thread.push({ ...row, status: "sent" })
        }
      }
      state.messages[roomId] = thread
      state.messageOffsets[roomId] = offset + items.length
      if (items.length < CHAT_PAGE || offset + items.length >= total) {
        state.olderStatus[roomId] = "done"
      } else {
        state.olderStatus[roomId] = "idle"
      }
      capNewest(roomId)
    } catch {
      state.olderStatus[roomId] = "error"
    }
  }

  function setActiveRoom(roomId: string): void {
    wireRealtime()
    if (state.activeRoomId === roomId) return
    if (state.activeRoomId) unsubscribeRoom(state.activeRoomId)
    state.activeRoomId = roomId
    state.sendError = ""
    if (roomId) subscribeRoom(roomId)
  }

  function leaveActiveRoom(): void {
    wireRealtime()
    if (state.activeRoomId) unsubscribeRoom(state.activeRoomId)
    state.activeRoomId = null
  }

  async function pinMessage(roomId: string, messageId: string): Promise<void> {
    try {
      await pinChatMessage(roomId, messageId)
      await loadPins(roomId)
    } catch {
      state.sendError = "chat.pinFailed"
    }
  }

  async function unpinMessage(roomId: string, pinId: string): Promise<void> {
    try {
      await unpinChatMessage(roomId, pinId)
      await loadPins(roomId)
    } catch {
      state.sendError = "chat.pinFailed"
    }
  }

  /**
   * Send a message with optimistic rendering: a pending row appears
   * immediately; the server echo (matched by `client_message_id`) replaces it.
   * On failure the row is removed, the draft restored and `sendError` set.
   */
  async function send(
    roomId: string,
    options: {
      content: string
      attachments?: File[]
      replyToId?: string | null
      threadId?: string | null
    },
  ): Promise<boolean> {
    if (state.sending[roomId]) return false
    const content = options.content.trim()
    if (!content && !(options.attachments?.length)) return false

    state.sending[roomId] = true
    state.sendError = ""
    const clientMessageId = makeClientId()
    const optimistic: SnChatMessage = {
      id: `pending-${clientMessageId}`,
      chatRoomId: roomId,
      type: "text",
      content,
      clientMessageId,
      senderId: selfId(),
      createdAt: new Date().toISOString(),
      attachments: [],
      repliedMessageId: options.replyToId ?? null,
      threadId: options.threadId ?? null,
      status: "pending",
    }
    const thread = state.messages[roomId] ?? []
    thread.unshift(optimistic)
    state.messages[roomId] = thread

    try {
      const uploaded = []
      for (const file of options.attachments ?? []) {
        const uploadedFile = await uploadDriveFile(file, { usage: "chat_message" })
        uploaded.push(uploadedFile)
      }
      const sent = await sendChatMessage(roomId, {
        content,
        attachments_id: uploaded.map((file) => file.id),
        client_message_id: clientMessageId,
        replied_message_id: options.replyToId ?? null,
        thread_id: options.threadId ?? null,
      })
      mergeMessages(roomId, [sent])
      capOldest(roomId)
      state.drafts[roomId] = ""
      return true
    } catch (err) {
      // Remove the optimistic row; restore the draft so nothing is lost.
      const current = state.messages[roomId] ?? []
      state.messages[roomId] = current.filter((row) => row.id !== optimistic.id)
      if (content && !state.drafts[roomId]) state.drafts[roomId] = content
      state.sendError = "chat.sendFailed"
      console.error("[Chat] Send failed:", err)
      return false
    } finally {
      state.sending[roomId] = false
    }
  }

  async function sendVoice(roomId: string, blob: Blob, durationMs: number): Promise<boolean> {
    if (state.sending[roomId]) return false
    state.sending[roomId] = true
    state.sendError = ""
    const clientMessageId = makeClientId()
    const optimistic: SnChatMessage = {
      id: `pending-${clientMessageId}`,
      chatRoomId: roomId,
      type: "voice",
      content: "",
      clientMessageId,
      senderId: selfId(),
      createdAt: new Date().toISOString(),
      attachments: [],
      meta: { duration_ms: durationMs },
      status: "pending",
    }
    const thread = state.messages[roomId] ?? []
    thread.unshift(optimistic)
    state.messages[roomId] = thread
    try {
      const sent = await sendChatVoice(roomId, blob, "voice.ogg", durationMs, clientMessageId)
      mergeMessages(roomId, [sent])
      capOldest(roomId)
      return true
    } catch (err) {
      const current = state.messages[roomId] ?? []
      state.messages[roomId] = current.filter((row) => row.id !== optimistic.id)
      state.sendError = "chat.sendFailed"
      console.error("[Chat] Voice send failed:", err)
      return false
    } finally {
      state.sending[roomId] = false
    }
  }

  /** Send a sticker: the content *is* the `:prefix+slug:` placeholder. */
  async function sendSticker(
    roomId: string,
    pack: ChatStickerPack,
    sticker: ChatSticker,
  ): Promise<void> {
    const placeholder = `${pack.prefix}+${sticker.slug}`
    if (sticker.image?.id) {
      state.stickerImages = { ...state.stickerImages, [placeholder]: sticker.image.id }
    }
    await send(roomId, { content: `:${placeholder}:` })
  }

  async function edit(
    roomId: string,
    messageId: string,
    content: string,
  ): Promise<void> {
    state.sendError = ""
    const thread = state.messages[roomId]
    const row = thread?.find((message) => message.id === messageId)
    if (!row) return
    const previous = row.content
    patchMessage(roomId, messageId, (current) => ({
      ...current,
      content,
      editedAt: new Date().toISOString(),
    }))
    try {
      const updated = await editChatMessage(
        roomId,
        messageId,
        content,
        (row.attachments ?? []).map((attachment) => attachment.id),
      )
      mergeMessages(roomId, [updated])
    } catch (err) {
      patchMessage(roomId, messageId, (current) => ({ ...current, content: previous }))
      state.sendError = "chat.editFailed"
      console.error("[Chat] Edit failed:", err)
    }
  }

  async function deleteMessage(roomId: string, messageId: string): Promise<void> {
    state.sendError = ""
    const thread = state.messages[roomId]
    const row = thread?.find((message) => message.id === messageId)
    if (!row) return
    const previous = { ...row }
    tombstoneMessage(messageId)
    try {
      await deleteChatMessage(roomId, messageId)
    } catch (err) {
      // Restore the row on failure.
      patchMessage(roomId, messageId, () => previous)
      state.sendError = "chat.deleteFailed"
      console.error("[Chat] Delete failed:", err)
    }
  }

  /** Toggle a reaction optimistically; reconcile with the HTTP answer. */
  async function react(
    roomId: string,
    messageId: string,
    symbol: string,
    attitude = 1,
  ): Promise<void> {
    const thread = state.messages[roomId]
    const row = thread?.find((message) => message.id === messageId)
    if (!row) return
    const made = row.reactionsMade?.[symbol] ?? false
    const optimisticCounts = { ...(row.reactionsCount ?? {}) }
    const optimisticMade = { ...(row.reactionsMade ?? {}) }
    if (made) {
      optimisticCounts[symbol] = Math.max(0, (optimisticCounts[symbol] ?? 0) - 1)
      delete optimisticMade[symbol]
    } else {
      optimisticCounts[symbol] = (optimisticCounts[symbol] ?? 0) + 1
      optimisticMade[symbol] = true
    }
    for (let i = 0; i < (thread?.length ?? 0); i++) {
      const row = thread![i]
      if (row && row.id === messageId) {
        thread![i] = { ...row, reactionsCount: optimisticCounts, reactionsMade: optimisticMade }
        break
      }
    }
    try {
      const added = await reactToChatMessage(roomId, messageId, symbol, attitude)
      // Reconcile with the authoritative answer.
      patchReactions(roomId, messageId, added, symbol)
    } catch (err) {
      // Roll back to the pre-toggle snapshot.
      patchMessage(roomId, messageId, () => ({ ...row }))
      console.error("[Chat] React failed:", err)
    }
  }

  async function readAll(): Promise<void> {
    try {
      await markAllChatRead()
      const next: Record<string, SnChatSummary> = {}
      for (const [roomId, summary] of Object.entries(state.summaries)) {
        next[roomId] = { ...summary, unreadCount: 0, hasUnread: false }
      }
      state.summaries = next
    } catch {
      // Best-effort.
    }
  }

  /** Typing indicator, throttled per room. */
  function sendTyping(roomId: string): void {
    const key = `typing:${roomId}`
    const last = typingSentAt.get(key) ?? 0
    const now = Date.now()
    if (now - last < TYPING_COOLDOWN_MS) return
    typingSentAt.set(key, now)
    wsSend("messages.typing", {
      chat_room_id: roomId,
      ts: now,
      type: "typing",
    })
  }

  async function acceptInvite(roomId: string): Promise<void> {
    try {
      await acceptChatInvite(roomId)
      state.invites = state.invites.filter((invite) => invite.chatRoomId !== roomId)
      await loadRooms()
    } catch {
      state.sendError = "chat.inviteFailed"
    }
  }

  async function declineInvite(roomId: string): Promise<void> {
    try {
      await declineChatInvite(roomId)
      state.invites = state.invites.filter((invite) => invite.chatRoomId !== roomId)
    } catch {
      state.sendError = "chat.inviteFailed"
    }
  }

  async function startDirect(accountId: string): Promise<string | null> {
    try {
      const room = await startDirectChat(accountId)
      if (!state.rooms.some((existing) => existing.id === room.id)) {
        state.rooms = [room, ...state.rooms]
      }
      return room.id
    } catch (err) {
      state.sendError = "chat.directFailed"
      console.error("[Chat] Start direct failed:", err)
      return null
    }
  }

  async function loadStickerPacks(): Promise<void> {
    if (state.stickerStatus !== "idle") return
    state.stickerStatus = "loading"
    try {
      state.stickerPacks = await fetchChatStickerPacks()
      state.stickerStatus = "ready"
    } catch {
      state.stickerStatus = "error"
    }
  }

  /** The drive file id behind a sticker placeholder, resolved once. */
  async function resolveStickerImage(placeholder: string): Promise<string> {
    if (state.stickerImages[placeholder]) return state.stickerImages[placeholder]
    const id = await lookupChatStickerImage(placeholder)
    if (id) state.stickerImages = { ...state.stickerImages, [placeholder]: id }
    return id ?? ""
  }

  async function init(): Promise<void> {
    wireRealtime()
    if (state.initialized) return
    state.initialized = true
    const { isAuthenticated } = useAuth()
    watch(isAuthenticated, (authenticated) => {
      if (!authenticated) {
        reset()
        return
      }
      refreshSelfId()
      // The session may resolve after the first mount; fill the list then.
      if (state.rooms.length === 0) void loadRooms()
    })
    refreshSelfId()
    await loadRooms()
  }

  /** Newest-first thread for a room. */
  function messagesFor(roomId: string): SnChatMessage[] {
    return state.messages[roomId] ?? []
  }

  function findMessage(roomId: string, messageId: string): SnChatMessage | null {
    return state.messages[roomId]?.find((row) => row.id === messageId) ?? null
  }

  function typingFor(roomId: string): ChatTypingUser[] {
    const now = Date.now()
    const users = (state.typing[roomId] ?? []).filter(
      (user) => now - user.ts < TYPING_TTL_MS,
    )
    return users.filter((user) => user.accountId !== selfId())
  }

  /** The other member of a direct room. */
  function directPeer(room: SnChatRoom): SnChatMember | null {
    if (room.type !== 1) return null
    const me = selfId()
    return room.members?.find((member) => member.accountId !== me) ?? null
  }

  /** Display title: peer for DMs, room name otherwise ('' → caller i18n fallback). */
  function roomTitle(room: SnChatRoom): string {
    if (room.type === 1) {
      return memberDisplayName(directPeer(room) ?? undefined) || room.name || ""
    }
    return room.name || ""
  }

  const sortedRooms = computed(() => {
    const rooms = [...state.rooms]
    rooms.sort((a, b) => {
      const aAt = state.summaries[a.id]?.lastMessage?.createdAt ?? a.updatedAt ?? a.createdAt ?? ""
      const bAt = state.summaries[b.id]?.lastMessage?.createdAt ?? b.updatedAt ?? b.createdAt ?? ""
      return bAt.localeCompare(aAt)
    })
    return rooms
  })

  const visibleRooms = computed(() => {
    if (state.filter === "direct") return sortedRooms.value.filter((room) => room.type === 1)
    if (state.filter === "group") return sortedRooms.value.filter((room) => room.type !== 1)
    return sortedRooms.value
  })

  const unreadTotal = computed(() =>
    Object.values(state.summaries).reduce(
      (total, summary) => total + (summary.unreadCount ?? 0),
      0,
    ),
  )

  const inviteCount = computed(() => state.invites.length)

  return {
    state,
    sortedRooms,
    visibleRooms,
    unreadTotal,
    inviteCount,
    messagesFor,
    findMessage,
    typingFor,
    directPeer,
    roomTitle,
    voiceUrlOf,
    voiceDurationOf,
    init,
    reset,
    loadRooms,
    loadInvites,
    loadRoom,
    loadNewest,
    loadOlder,
    setActiveRoom,
    leaveActiveRoom,
    refreshOnline,
    loadPins,
    pinMessage,
    unpinMessage,
    send,
    sendVoice,
    sendSticker,
    edit,
    deleteMessage,
    react,
    markRead,
    readAll,
    sendTyping,
    acceptInvite,
    declineInvite,
    startDirect,
    loadStickerPacks,
    resolveStickerImage,
  }
}

