import type { WebSocketPacket } from '~/types/chat'
import type { SnNotification } from '~/types/notification'
import { eventBus } from '~/utils/eventBus'
import { snakeToCamel } from '~/utils/case'

type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface WebSocketOptions {
  maxReconnectsPerMinute?: number
  baseReconnectDelayMs?: number
  maxReconnectDelayMs?: number
  heartbeatIntervalMs?: number
}

const DEFAULT_OPTIONS: WebSocketOptions = {
  maxReconnectsPerMinute: 5,
  baseReconnectDelayMs: 500,
  maxReconnectDelayMs: 30000,
  heartbeatIntervalMs: 60000,
}

// ── Global singleton state ───────────────────────────────────────────────
// This state is shared across all calls to useWebSocket()

const globalStatus = ref<WSStatus>('disconnected')
const globalLatency = ref<number | null>(null)

let ws: WebSocket | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatAt: Date | null = null
let isClosing = false
let reconnectCount = 0
let reconnectWindowStart: Date | null = null
let authWatchInitialized = false

const options = { ...DEFAULT_OPTIONS }

// ── Composable ───────────────────────────────────────────────────────────

export function useWebSocket() {
  const config = useRuntimeConfig()
  const { isAuthenticated } = useAuth()
  function getUrl(): string {
    const baseUrl = config.public.apiBaseUrl as string
    return baseUrl.replace(/^http/, 'ws') + '/ws'
  }

  function addStatus(s: WSStatus) {
    globalStatus.value = s
    eventBus.emit('ws:status', s)
  }

  function cancelTimers() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    heartbeatAt = null
    globalLatency.value = null
  }

  function getAuthToken(): string | null {
    if (import.meta.server) return null
    const raw =
      localStorage.getItem('auth_token_pair') ||
      localStorage.getItem('auth_token')
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed.token || raw
    } catch {
      return raw
    }
  }

  function send(packet: WebSocketPacket): boolean {
    if (import.meta.server) return false
    if (!ws || isClosing || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send: not connected')
      return false
    }
    try {
      ws.send(JSON.stringify(packet))
      return true
    } catch (e) {
      console.error('[WebSocket] Failed to send:', e)
      return false
    }
  }

  function startHeartbeat() {
    heartbeatTimer = setInterval(() => {
      if (!ws || isClosing) return
      heartbeatAt = new Date()
      send({ type: 'ping', data: undefined })
    }, options.heartbeatIntervalMs!)
  }

  function scheduleReconnect() {
    if (isClosing || !isAuthenticated.value) return
    const now = new Date()
    if (
      !reconnectWindowStart ||
      now.getTime() - reconnectWindowStart.getTime() >= 60000
    ) {
      reconnectWindowStart = now
      reconnectCount = 0
    }

    reconnectCount++

    if (reconnectCount > options.maxReconnectsPerMinute!) {
      console.warn(`[WebSocket] Reconnect limit exceeded. Retrying in 30s.`)
      addStatus('disconnected')
      reconnectTimer = setTimeout(() => {
        if (isClosing || !isAuthenticated.value) return
        reconnectWindowStart = null
        reconnectCount = 0
        addStatus('connecting')
        connect()
      }, 30000)
      return
    }

    const backoffMs = Math.min(
      options.baseReconnectDelayMs! * 2 ** (reconnectCount - 1),
      options.maxReconnectDelayMs!,
    )
    const jitter = Math.floor(Math.random() * 200) - 100
    const delayMs = Math.max(
      100,
      Math.min(backoffMs + jitter, options.maxReconnectDelayMs!),
    )

    reconnectTimer = setTimeout(() => {
      if (isClosing || !isAuthenticated.value) return
      addStatus('connecting')
      connect()
    }, delayMs)
  }

  function connect() {
    if (import.meta.server) return
    if (!isAuthenticated.value) {
      disconnect()
      return
    }
    if (isClosing) return
    cancelTimers()
    addStatus('connecting')

    const token = getAuthToken()
    const url = getUrl()
    const wsUrl = token
      ? `${url}?tk=${encodeURIComponent(token)}`
      : url

    try {
      ws = new WebSocket(wsUrl)
    } catch (e) {
      console.error('[WebSocket] Failed to create WebSocket:', e)
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      if (isClosing) {
        ws?.close()
        return
      }
      console.log('[WebSocket] Connected')
      reconnectCount = 0
      reconnectWindowStart = null
      addStatus('connected')
      startHeartbeat()
    }

    ws.onmessage = async (event) => {
      if (isClosing) return
      try {
        // Handle Blob data (some WebSocket implementations send Blobs)
        let rawData = event.data
        if (rawData instanceof Blob) {
          rawData = await rawData.text()
        }

        const packet: WebSocketPacket = JSON.parse(rawData)
        console.debug('[WebSocket] Received:', packet.type)

        // Handle pong
        if (packet.type === 'pong' && heartbeatAt) {
          globalLatency.value = Date.now() - heartbeatAt.getTime()
          return
        }

        // Handle errors
        if (packet.type === 'error.dupe') {
          console.warn('[WebSocket] Duplicate device detected')
          isClosing = true
          cancelTimers()
          addStatus('error')
          ws?.close()
          return
        }

        if (packet.type === 'error') {
          console.error('[WebSocket] Server error:', packet.errorMessage)
          isClosing = true
          cancelTimers()
          addStatus('error')
          ws?.close()
          return
        }

        // Convert snake_case data to camelCase
        const camelData = packet.data ? snakeToCamel(packet.data) : undefined

        // Emit raw packet to event bus
        eventBus.emit('ws:message', { ...packet, data: camelData })

        // Emit typed events
        if (packet.type === 'notifications.new') {
          // Packet payload is unvalidated JSON; server contract is SnNotification.
          eventBus.emit('notification:new', camelData as unknown as SnNotification)
        }

        // ElecPostal publishes mail.changed (create) and mail.moved (folder
        // moves) through the shared gateway. Both are cache-invalidation
        // signals carrying only identifiers; the UI refetches on demand.
        if (
          packet.type === 'mail.changed' ||
          packet.type === 'mail.moved'
        ) {
          eventBus.emit(
            'mail:changed',
            camelData as { mailboxId?: string; emailId?: string; reason?: string },
          )
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e)
      }
    }

    ws.onclose = (event) => {
      if (isClosing) return
      console.log('[WebSocket] Connection closed:', event.code, event.reason)
      addStatus('disconnected')
      scheduleReconnect()
    }

    ws.onerror = (error) => {
      if (isClosing) return
      console.error('[WebSocket] Error:', error)
      addStatus('error')
      scheduleReconnect()
    }
  }

  function disconnect() {
    isClosing = true
    cancelTimers()
    ws?.close()
    ws = null
    addStatus('disconnected')
    isClosing = false
  }

  function manualReconnect() {
    if (!isAuthenticated.value) {
      disconnect()
      return
    }

    console.log('[WebSocket] Manual reconnect triggered')
    reconnectCount = 0
    reconnectWindowStart = null
    isClosing = false
    cancelTimers()
    ws?.close()
    ws = null
    addStatus('connecting')
    connect()
  }

  if (!authWatchInitialized) {
    authWatchInitialized = true
    watch(isAuthenticated, (authenticated) => {
      if (!authenticated) disconnect()
    })
  }

  return {
    status: readonly(globalStatus),
    latency: readonly(globalLatency),
    connect,
    disconnect,
    manualReconnect,
    send,
  }
}
