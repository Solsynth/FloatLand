// /legacy/membership — legacy no-JS membership overview.

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { beginLegacy } from "../../../utils/legacyReq"
import { renderMembership } from "../../../utils/legacyPages"

export default defineEventHandler((event: H3Event) => {
  beginLegacy(event, "/membership")
  return renderMembership(event)
})
