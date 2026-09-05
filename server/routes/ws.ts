import { defineWebSocketHandler } from "h3";
import type { Peer } from "crossws";
import { getAuthSession } from "../utils/authSession";

// Same-origin websocket proxy.
//
// The crossws upgrade `peer.request.headers` carries the browser's `Cookie`
// header on the same-origin upgrade; we parse the `sid` from it, resolve the
// server-side session, then open a single backend socket authenticated with the
// stored access token. Messages flow both ways until either side closes.

function readSidFromRequest(peer: Peer): string {
  const request = peer.request;
  const headers = request?.headers;
  const cookie = headers?.get?.("cookie");
  if (!cookie) return "";
  const cfg = useRuntimeConfig().auth;
  const name =
    cfg && typeof cfg === "object" && "cookieName" in cfg
      ? (cfg.cookieName as string)
      : "sid";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return "";
}

function getBackend(peer: Peer): WebSocket | undefined {
  const value = peer.context.backend;
  return value instanceof WebSocket ? value : undefined;
}

export default defineWebSocketHandler({
  async open(peer) {
    const sid = readSidFromRequest(peer);
    const pair = await getAuthSession(sid);
    if (!pair) {
      peer.close();
      return;
    }

    const apiServerUrl = useRuntimeConfig().apiServerUrl as string;
    const backend = new WebSocket(
      `${apiServerUrl.replace(/^http/, "ws")}/ws?tk=${encodeURIComponent(pair.token)}`,
    );

    backend.addEventListener("message", (event) => {
      const data = event.data;
      if (typeof data === "string") {
        peer.send(data);
      } else if (data instanceof Blob) {
        void data.text().then((text) => peer.send(text));
      }
    });
    backend.addEventListener("close", () => {
      peer.close();
    });
    backend.addEventListener("error", () => {
      peer.close();
    });

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
