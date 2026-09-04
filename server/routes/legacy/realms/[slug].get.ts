// /legacy/realms/[slug] — legacy no-JS realm profile + posts.

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { beginLegacy } from "../../../utils/legacyReq"
import { renderRealm } from "../../../utils/legacyPages"

export default defineEventHandler((event: H3Event) => {
  beginLegacy(event, "/realms")
  return renderRealm(event)
})
