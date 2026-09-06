import { defineEventHandler, getRouterParam, setResponseStatus, getRequestIP, getRequestHeader } from "h3";

/**
 * SSE endpoint that polls a Stargate challenge for status changes.
 *
 * Used by the login page when the user selects an InAppCode (prompt) factor:
 * the native app receives a push notification and approves/declines, while
 * this endpoint streams the result back to the browser.
 *
 * GET /api/auth/challenge-poll/:challengeId → text/event-stream
 * Events: { status: "pending" | "approved" | "declined" | "expired" }
 * On "approved" or "declined"/"expired" the stream closes.
 */
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event);
  const apiProxiedUrl = (cfg.apiProxiedUrl ?? cfg.apiServerUrl) as string;
  const challengeId = getRouterParam(event, "challengeId");
  if (!challengeId) {
    setResponseStatus(event, 400);
    return { error: "challengeId required" };
  }

  // SSE headers
  setResponseStatus(event, 200);
  event.node.res.setHeader("Content-Type", "text/event-stream");
  event.node.res.setHeader("Cache-Control", "no-cache");
  event.node.res.setHeader("Connection", "keep-alive");
  event.node.res.setHeader("X-Accel-Buffering", "no");
  event.node.res.flushHeaders();

  const res = event.node.res;

  function sendEvent(data: Record<string, unknown>) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  // Client IP forwarding (matches proxy pattern)
  const forwardedFor = getRequestHeader(event, "x-forwarded-for");
  const clientIp =
    (getRequestIP(event, { xForwardedFor: true }) ?? "").trim() ||
    (getRequestHeader(event, "x-real-ip") ?? "").trim();
  const ipHeaders: Record<string, string> = {};
  if (clientIp) {
    const forwarded = forwardedFor?.trim();
    ipHeaders["x-forwarded-for"] =
      forwarded && !forwarded.split(",")[0]?.trim().startsWith(clientIp)
        ? `${clientIp}, ${forwarded}`
        : clientIp;
    ipHeaders["x-real-ip"] = clientIp;
  }

  const POLL_INTERVAL_MS = 2000;
  const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  const startTime = Date.now();
  let timer: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  function cleanup() {
    if (closed) return;
    closed = true;
    if (timer) clearInterval(timer);
    res.end();
  }

  // Handle client disconnect
  event.node.req.on("close", cleanup);

  async function poll() {
    if (closed) return;
    try {
      const url = `${apiProxiedUrl}/stargate/auth/challenge/${challengeId}`;
      const resp = await $fetch.raw(url, {
        method: "GET",
        headers: { ...ipHeaders },
        responseType: "json",
        ignoreResponseError: true,
      });

      if (resp.status === 404) {
        sendEvent({ status: "expired" });
        cleanup();
        return;
      }

      if (resp.status !== 200) {
        // Transient error — keep polling
        return;
      }

      const body = resp._data as Record<string, unknown> | undefined;
      if (!body) return;

      // Challenge is consumed when expired_at is set and stepRemain is 0
      const stepRemain = body.step_remain as number | undefined;
      const expiredAt = body.expired_at as string | undefined;
      const approvedAt = body.approved_at as string | undefined;

      if (stepRemain !== undefined && stepRemain <= 0 && approvedAt) {
        sendEvent({ status: "approved" });
        cleanup();
        return;
      }

      if (approvedAt) {
        // Already approved but stepRemain not yet 0 (race) — treat as approved
        sendEvent({ status: "approved" });
        cleanup();
        return;
      }

      if (expiredAt) {
        sendEvent({ status: "expired" });
        cleanup();
        return;
      }

      // Still pending — send heartbeat
      sendEvent({ status: "pending" });
    } catch {
      // Transient error — keep polling
    }
  }

  // Start polling
  await poll();
  if (!closed) {
    timer = setInterval(poll, POLL_INTERVAL_MS);
  }

  // Timeout safety
  const timeout = setTimeout(() => {
    if (!closed) {
      sendEvent({ status: "expired" });
      cleanup();
    }
  }, MAX_DURATION_MS);

  event.node.req.on("close", () => clearTimeout(timeout));
});
