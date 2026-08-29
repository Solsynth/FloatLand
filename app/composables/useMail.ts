import { eventBus } from '~/utils/eventBus'
import type { MailLabel } from '~/types/mail'
import type { WorkspaceMailbox, Workspace } from '~/types/workspace'
import {
  fetchMyMailboxes,
  fetchWorkspaces,
  fetchWorkspaceMailboxes,
  fetchUnreadInboxCount,
  fetchLabels,
} from '~/utils/api'

interface MailState {
  mailboxes: WorkspaceMailbox[]
  selectedMailboxId: string | null
  /** Unread Inbox count per mailbox id (folder-filtered). */
  unreadByMailbox: Record<string, number>
  /** Sum of all mailbox unread counts; drives the topbar badge. */
  accountUnread: number
  labels: MailLabel[]
  loading: boolean
  error: string | null
  /** Bumped on every mail realtime packet so lists refresh. */
  changedAt: number
  /** Subject of the email currently open in the reader (breadcrumb). */
  readerSubject: string
  /** Folder of the email currently open in the reader (breadcrumb). */
  readerFolder: string
}

// Global singleton state (shared across all callers, like useNotifications).
const globalState = reactive<MailState>({
  mailboxes: [],
  selectedMailboxId: null,
  unreadByMailbox: {},
  accountUnread: 0,
  labels: [],
  loading: false,
  error: null,
  changedAt: 0,
  readerSubject: "",
  readerFolder: "",
})

let initialized = false
let subscribed = false
let refreshTimer: ReturnType<typeof setTimeout> | null = null

export function useMail() {
  const { isAuthenticated } = useAuth()

  function subscribe() {
    if (subscribed) return
    subscribed = true

    eventBus.on('mail:changed', () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        globalState.changedAt++
        refreshUnread()
      }, 600)
    })
  }

  async function refreshUnread() {
    if (!globalState.mailboxes.length) return
    try {
      const counts = await Promise.all(
        globalState.mailboxes.map((mailbox) =>
          fetchUnreadInboxCount(mailbox.id).catch(() => 0),
        ),
      )
      const byMailbox: Record<string, number> = {}
      let total = 0
      globalState.mailboxes.forEach((mailbox, index) => {
        const count = counts[index] ?? 0
        byMailbox[mailbox.id] = count
        total += count
      })
      globalState.unreadByMailbox = byMailbox
      globalState.accountUnread = total
    } catch {
      // Badge is best-effort; keep the previous counts.
    }
  }

  async function refreshLabels() {
    try {
      globalState.labels = await fetchLabels()
    } catch {
      // Labels are best-effort; keep the previous list.
    }
  }

  /**
   * Load account mailboxes (own + member workspaces), pick the default, and
   * seed unread counts + labels. Client-side only; never called during SSR.
   */
  async function init() {
    subscribe()
    if (initialized) return
    if (!isAuthenticated.value) return
    initialized = true
    globalState.loading = true
    globalState.error = null
    try {
      const [own, workspaces] = await Promise.all([
        fetchMyMailboxes(),
        fetchWorkspaces().catch(() => [] as Workspace[]),
      ])
      const workspaceBoxes = (
        await Promise.all(
          workspaces.map((workspace) =>
            fetchWorkspaceMailboxes(workspace.id).catch(() => [] as WorkspaceMailbox[]),
          ),
        )
      ).flat()
      const seen = new Set<string>()
      const merged: WorkspaceMailbox[] = []
      for (const mailbox of [...own, ...workspaceBoxes]) {
        if (seen.has(mailbox.id)) continue
        seen.add(mailbox.id)
        merged.push(mailbox)
      }
      merged.sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
      })
      globalState.mailboxes = merged
      globalState.selectedMailboxId =
        merged.find((mailbox) => mailbox.isDefault)?.id ?? merged[0]?.id ?? null
      await Promise.all([refreshUnread(), refreshLabels()])
    } catch (err) {
      globalState.error =
        err instanceof Error ? err.message : "Failed to load mailboxes"
    } finally {
      globalState.loading = false
    }
  }

  function selectMailbox(id: string) {
    if (globalState.selectedMailboxId === id) return
    globalState.selectedMailboxId = id
    refreshUnread()
  }

  return {
    state: globalState,
    init,
    selectMailbox,
    refreshUnread,
    refreshLabels,
  }
}
