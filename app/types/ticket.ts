import type { SnAccount } from './auth'
import type { FileAttachment } from './post'

/** TicketType enum */
export const TicketType = {
  Support: 0,
  BugReport: 1,
  FeatureRequest: 2,
  Billing: 3,
  Other: 4,
} as const
export type TicketTypeValue = (typeof TicketType)[keyof typeof TicketType]

/** TicketStatus enum */
export const TicketStatus = {
  Open: 0,
  InProgress: 1,
  Resolved: 2,
  Closed: 3,
  WaitingForCustomer: 4,
  WaitingForMoreInformation: 5,
} as const
export type TicketStatusValue = (typeof TicketStatus)[keyof typeof TicketStatus]

/** TicketPriority enum */
export const TicketPriority = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
} as const
export type TicketPriorityValue = (typeof TicketPriority)[keyof typeof TicketPriority]

/**
 * Ticket message files use SnCloudFileReferenceObject on the backend.
 * Shape is compatible with post FileAttachment after snake→camel conversion.
 */
export type TicketFileRef = Partial<FileAttachment> & {
  id: string
  name?: string
  mimeType?: string | null
  url?: string | null
  hasCompression?: boolean
  hasThumbnail?: boolean
  fileMeta?: Record<string, unknown> | null
  size?: number
  width?: number | null
  height?: number | null
  blurhash?: string | null
}

export interface SnTicketMessage {
  id: string
  ticketId: string
  senderId: string
  sender?: SnAccount | null
  content: string
  files?: TicketFileRef[]
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface SnTicket {
  id: string
  title: string
  type: TicketTypeValue | number
  status: TicketStatusValue | number
  priority: TicketPriorityValue | number
  creatorId: string
  creator?: SnAccount | null
  assigneeId?: string | null
  assignee?: SnAccount | null
  resolvedAt?: string | null
  resources?: (string | null)[] | null
  metadata?: Record<string, unknown>
  messages?: SnTicketMessage[]
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface SnTicketOnCallAdmin {
  id: string
  accountId: string
  account?: SnAccount | null
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface CreateTicketPayload {
  title: string
  content?: string
  type: TicketTypeValue | number
  priority?: TicketPriorityValue | number
  fileIds?: string[]
  resources?: (string | null)[]
}

export interface UpdateTicketPayload {
  title?: string
  type?: TicketTypeValue | number
  priority?: TicketPriorityValue | number
  resources?: (string | null)[]
}

export interface AddTicketMessagePayload {
  content: string
  fileIds?: string[]
}

export interface TicketListQuery {
  creatorId?: string
  assigneeId?: string
  type?: TicketTypeValue | number
  status?: TicketStatusValue | number
  priority?: TicketPriorityValue | number
  offset?: number
  take?: number
}

export interface MyTicketListQuery {
  status?: TicketStatusValue | number
  offset?: number
  take?: number
}

export interface TicketCountQuery {
  creatorId?: string
  assigneeId?: string
  status?: TicketStatusValue | number
}
