import redisDriver from "unstorage/drivers/redis";

// Choose the auth session store at RUNTIME, not build time.
//
// `nitro.storage.auth` in nuxt.config.ts is evaluated during `npm run build`,
// so a Docker builder stage without REDIS_URL bakes in the `fs` driver (per-
// process, ephemeral) regardless of the runtime env. That breaks login in
// production: a session written by one worker is invisible to another, so the
// post-login `/accounts/me` (and any replica) returns 401.
//
// This plugin runs at server startup and remounts the `auth` store to Redis
// whenever `REDIS_URL` is present in the runtime env. When it's absent (local
// dev), the baked `fs` mount stays as a zero-config fallback.

function selectRedisUrl(): string | undefined {
  const url = process.env.REDIS_URL || undefined;
  return url;
}

export default defineNitroPlugin(async (nitroApp) => {
  const url = selectRedisUrl();
  if (!url) {
    // No Redis configured — keep the build-time `fs` mount for local dev.
    return;
  }

  const storage = useStorage("");
  const driver = redisDriver({
    url,
    base: "floatland:auth",
    // Preconnect eagerly so a missing/invalid Redis surfaces at startup rather
    // than on the first login. Bound retries so a down Redis doesn't retry
    // forever; ioredis reconnects with exponential backoff up to this many
    // attempts before giving up.
    retryStrategy: (times) => Math.min(times * 200, 2000),
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    preConnect: true,
  });

  // Replace the baked-in `auth` mount. `unmount` is async (it disposes the fs
  // driver and deletes the mount), so await it before re-mounting Redis under
  // the same key; otherwise `mount` sees the old mount still present and
  // throws "already mounted at auth:".
  await storage.unmount("auth");
  storage.mount("auth", driver);
});
