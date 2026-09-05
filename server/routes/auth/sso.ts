import { defineEventHandler, getQuery, sendRedirect, setCookie } from "h3";
import {
  cookieOptions,
  createSyncTicket,
  exchangeSyncTicket,
  resolveAuthSession,
  sidCookieName,
} from "../../utils/authSession";

// Canonical-host sync ticket issuer / redeemer.
//
// - On the canonical host with a session: mint a one-time ticket and bounce
//   back to `next?tkt=<ticket>`.
// - On a non-canonical host carrying a `tkt`: redeem it, set this host's own
//   `sid` cookie, and proceed to `next` (ticket stripped).
// - Any other case (logged out / invalid ticket): send them to `next`.

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event);
  const canonicalHost = cfg.auth?.canonicalHost as string;
  const cookieName = sidCookieName(event);

  const query = getQuery(event);
  const next = typeof query.next === "string" ? query.next : "/";
  const ticket = typeof query.tkt === "string" ? query.tkt : "";

  const requestHost = String(event.node?.req?.headers?.host ?? "").split(":")[0].toLowerCase();
  const proto = String(event.node?.req?.headers?.["x-forwarded-proto"] ?? "http").split(",")[0].trim() || "http";
  const origin = `${proto}://${requestHost}`;

  // Canonical host: mint a ticket if we hold a session.
  if (canonicalHost && origin === canonicalHost) {
    const { sid, pair } = await resolveAuthSession(event);
    if (pair) {
      const tkt = await createSyncTicket(sid);
      const sep = next.includes("?") ? "&" : "?";
      return sendRedirect(event, `${next}${sep}tkt=${tkt}`);
    }
    // Canonical host with no session: nothing to sync.
    return sendRedirect(event, next);
  }

  // Non-canonical host: redeem the ticket and set our own `sid` cookie.
  if (ticket) {
    const sid = await exchangeSyncTicket(ticket);
    if (sid) {
      setCookie(event, cookieName, sid, cookieOptions(event));
      return sendRedirect(event, next);
    }
  }

  // Logged out / invalid ticket: go on without a session.
  return sendRedirect(event, next);
});
