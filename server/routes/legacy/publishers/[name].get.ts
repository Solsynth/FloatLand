// /legacy/publishers/[name] — legacy no-JS publisher profile + posts.

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { beginLegacy } from "../../../utils/legacyReq"
import { renderPublisher } from "../../../utils/legacyPages"

export default defineEventHandler((event: H3Event) => {
  beginLegacy(event, "/")
  return renderPublisher(event)
})
