// /legacy/posts/[id] — legacy no-JS post detail + replies.

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { beginLegacy } from "../../../utils/legacyReq"
import { renderPost } from "../../../utils/legacyPages"

export default defineEventHandler((event: H3Event) => {
  beginLegacy(event, "/")
  return renderPost(event)
})
