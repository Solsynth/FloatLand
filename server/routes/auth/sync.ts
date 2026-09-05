import { defineEventHandler, getQuery, sendRedirect } from "h3";
import { resolveAuthSession } from "../../utils/authSession";

// Cross-host session sync entry point.
//
// Same Nitro serves every host and the session store is shared, so the only
// missing piece is a host-scoped `sid` cookie. If this host already has a valid
// session cookie, bounce straight back to `next`. Otherwise, if we're not the
// canonical host, redirect to the canonical host's `/auth/sso` with the intended
// destination so the canonical handler can mint a one-time sync ticket. The
// canonical host (which holds the user's session) then redeems it on the way
// back to this host, which sets its own `sid` cookie.

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event);
  const canonicalHost = cfg.auth?.canonicalHost as string;

  const query = getQuery(event);
  const next = typeof query.next === "string" ? query.next : "/";

  const { pair } = await resolveAuthSession(event);
  if (pair) {
    return sendRedirect(event, next);
  }

  const requestHost = String(event.node?.req?.headers?.host ?? "").split(":")[0].toLowerCase();
  const proto = String(event.node?.req?.headers?.["x-forwarded-proto"] ?? "http").split(",")[0].trim() || "http";
  const origin = `${proto}://${requestHost}`;

  if (canonicalHost && origin !== canonicalHost) {
    const ssoUrl = `${canonicalHost}/auth/sso?next=${encodeURIComponent(origin + next)}`;
    return sendRedirect(event, ssoUrl);
  }

  // Canonical host with no session: nothing to sync, send them on.
  return sendRedirect(event, next);
});
