import { defineWebSocketHandler } from "h3";
import type { Peer } from "crossws";
import { cookieValues } from "../utils/authSession";

// Same-origin websocket proxy.
//
// The crossws upgrade carries the browser's `Cookie` header, so the backend
// socket is opened with the same `AuthToken` the HTTP proxy forwards: one
// session, presented two ways. Messages flow both ways until either side closes.

function getBackend(peer: Peer): WebSocket | undefined {
  const value = peer.context.backend;
  return value instanceof WebSocket ? value : undefined;
}

/** The access token from the upgrade request, preferring the last value sent. */
function accessTokenFrom(peer: Peer): string {
  const cookie = peer.request?.headers?.get?.("cookie") ?? "";
  const values = cookieValues(cookie, "AuthToken");
  return values[values.length - 1] ?? "";
}

export default defineWebSocketHandler({
  open(peer) {
    const token = accessTokenFrom(peer);
    if (!token) {
      peer.close();
      return;
    }

    const runtime = useRuntimeConfig();
    const apiProxiedUrl = (runtime.apiProxiedUrl ?? runtime.apiServerUrl) as string;
    const backend = new WebSocket(
      `${apiProxiedUrl.replace(/^http/, "ws")}/ws?tk=${encodeURIComponent(token)}`,
    );

    backend.addEventListener("message", (event) => {
      const data = event.data;
      if (typeof data === "string") {
        peer.send(data);
      } else if (data instanceof Blob) {
        void data.text().then((text) => peer.send(text));
      }
    });
    backend.addEventListener("close", () => peer.close());
    backend.addEventListener("error", () => peer.close());

    peer.context.backend = backend;
  },
  message(peer, message) {
    const backend = getBackend(peer);
    if (backend && backend.readyState === WebSocket.OPEN) {
      backend.send(message.text());
    }
  },
  close(peer) {
    const backend = getBackend(peer);
    if (backend && backend.readyState !== WebSocket.CLOSED) {
      backend.close();
    }
  },
});
