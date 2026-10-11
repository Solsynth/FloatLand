/** Shape of every packet pushed by the shared gateway. */
export interface WebSocketPacket {
  type: string
  data?: Record<string, unknown>
  endpoint?: string
  errorMessage?: string
}
