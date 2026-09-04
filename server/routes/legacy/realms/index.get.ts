// /legacy/realms — legacy no-JS public realms directory.

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { beginLegacy } from "../../../utils/legacyReq"
import { renderRealmsIndex } from "../../../utils/legacyPages"

export default defineEventHandler((event: H3Event) => {
  beginLegacy(event, "/realms")
  return renderRealmsIndex(event)
})
