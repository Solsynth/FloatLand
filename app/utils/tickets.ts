import { apiFetch, fetchJson, safeJsonParse } from '~/utils/api'
import { camelToSnake } from '~/utils/case'
import type { FileAttachment } from '~/types/post'
import type {
  SnTicket,
  SnTicketMessage,
  SnTicketOnCallAdmin,
  TicketFileRef,
  CreateTicketPayload,
  UpdateTicketPayload,
  AddTicketMessagePayload,
  TicketListQuery,
  MyTicketListQuery,
  TicketCountQuery,
  TicketStatusValue,
  TicketTypeValue,
  TicketPriorityValue,
} from '~/types/ticket'

/** Passport ticket routes (gateway: /passport/tickets) */
const TICKETS_BASE = '/passport/tickets'

function buildQuery(params: Record<string, unknown>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  return query.toString()
}

export async function createTicket(payload: CreateTicketPayload): Promise<SnTicket> {
  return fetchJson<SnTicket>(TICKETS_BASE, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function fetchTickets(params: TicketListQuery = {}): Promise<SnTicket[]> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchJson<SnTicket[]>(`${TICKETS_BASE}${qs ? `?${qs}` : ''}`)
}

export async function fetchMyTickets(params: MyTicketListQuery = {}): Promise<SnTicket[]> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  return fetchJson<SnTicket[]>(`${TICKETS_BASE}/me${qs ? `?${qs}` : ''}`)
}

export async function fetchTicket(id: string): Promise<SnTicket> {
  return fetchJson<SnTicket>(`${TICKETS_BASE}/${encodeURIComponent(id)}`)
}

export async function updateTicket(id: string, payload: UpdateTicketPayload): Promise<SnTicket> {
  return fetchJson<SnTicket>(`${TICKETS_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function deleteTicket(id: string): Promise<void> {
  await fetchJson(`${TICKETS_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function addTicketMessage(
  id: string,
  payload: AddTicketMessagePayload,
): Promise<SnTicketMessage> {
  return fetchJson<SnTicketMessage>(`${TICKETS_BASE}/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake(payload)),
  })
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatusValue | number,
): Promise<SnTicket> {
  return fetchJson<SnTicket>(`${TICKETS_BASE}/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export async function assignTicket(
  id: string,
  assigneeId: string | null,
): Promise<SnTicket> {
  return fetchJson<SnTicket>(`${TICKETS_BASE}/${encodeURIComponent(id)}/assign`, {
    method: 'POST',
    body: JSON.stringify(camelToSnake({ assigneeId })),
  })
}

export async function fetchTicketCount(params: TicketCountQuery = {}): Promise<number> {
  const qs = buildQuery(params as unknown as Record<string, unknown>)
  const res = await fetchJson<{ count: number }>(
    `${TICKETS_BASE}/count${qs ? `?${qs}` : ''}`,
  )
  return res.count ?? 0
}

// ============ On-call admin roster ============

/** Passport admin ticket on-call roster routes (gateway: /passport/admin/tickets/on-call) */
const TICKETS_ON_CALL_BASE = '/passport/admin/tickets/on-call'

export async function fetchOnCallAdmins(): Promise<SnTicketOnCallAdmin[]> {
  return fetchJson<SnTicketOnCallAdmin[]>(TICKETS_ON_CALL_BASE)
}

export async function addOnCallAdmin(accountId: string): Promise<void> {
  await fetchJson(TICKETS_ON_CALL_BASE, {
    method: 'POST',
    body: JSON.stringify(camelToSnake({ accountId })),
  })
}

export async function removeOnCallAdmin(accountId: string): Promise<void> {
  await fetchJson(`${TICKETS_ON_CALL_BASE}/${encodeURIComponent(accountId)}`, {
    method: 'DELETE',
  })
}

// ============ Labels ============

export function ticketTypeLabel(type: TicketTypeValue | number): string {
  const map: Record<number, string> = {
    0: 'Support',
    1: 'Bug report',
    2: 'Feature request',
    3: 'Billing',
    4: 'Other',
  }
  return map[Number(type)] ?? `Type ${type}`
}

export function ticketStatusLabel(status: TicketStatusValue | number): string {
  const map: Record<number, string> = {
    0: 'Open',
    1: 'In progress',
    2: 'Resolved',
    3: 'Closed',
    4: 'Waiting for you',
    5: 'Needs more info',
  }
  return map[Number(status)] ?? `Status ${status}`
}

export function ticketPriorityLabel(priority: TicketPriorityValue | number): string {
  const map: Record<number, string> = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical',
  }
  return map[Number(priority)] ?? `Priority ${priority}`
}

export function ticketStatusBadgeClass(status: TicketStatusValue | number): string {
  const map: Record<number, string> = {
    0: 'badge-info',
    1: 'badge-primary',
    2: 'badge-success',
    3: 'badge-ghost',
    4: 'badge-warning',
    5: 'badge-warning',
  }
  return map[Number(status)] ?? 'badge-ghost'
}

export function ticketPriorityBadgeClass(priority: TicketPriorityValue | number): string {
  const map: Record<number, string> = {
    0: 'badge-ghost',
    1: 'badge-info',
    2: 'badge-warning',
    3: 'badge-error',
  }
  return map[Number(priority)] ?? 'badge-ghost'
}

/** Admin-facing status labels (Waiting for customer, not “you”) */
export function ticketStatusLabelAdmin(status: TicketStatusValue | number): string {
  const map: Record<number, string> = {
    0: 'Open',
    1: 'In progress',
    2: 'Resolved',
    3: 'Closed',
    4: 'Waiting for customer',
    5: 'Needs more information',
  }
  return map[Number(status)] ?? `Status ${status}`
}

/**
 * Map ticket message cloud-file refs to the FileAttachment shape used by
 * AttachmentGrid / AttachmentItem (same as post feed attachments).
 */
export function toFileAttachments(files?: TicketFileRef[] | null): FileAttachment[] {
  if (!files?.length) return []
  return files
    .filter((f): f is TicketFileRef & { id: string } => Boolean(f?.id))
    .map((file) => {
      const meta: Record<string, unknown> = {
        ...(file.fileMeta ?? {}),
      }
      if (file.width != null && meta.width == null) meta.width = file.width
      if (file.height != null && meta.height == null) meta.height = file.height
      if (file.blurhash != null && meta.blurhash == null) meta.blurhash = file.blurhash

      return {
        id: file.id,
        name: file.name || file.id,
        url: file.url || undefined,
        mimeType: file.mimeType || '',
        hasCompression: Boolean(file.hasCompression),
        hasThumbnail: Boolean(file.hasThumbnail),
        fileMeta: meta,
      }
    })
}

export { apiFetch, safeJsonParse }
