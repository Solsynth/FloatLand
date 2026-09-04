// /legacy/ — legacy no-JS home (rendered by the shared page module).

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { beginLegacy } from "../../utils/legacyReq"
import { renderHome } from "../../utils/legacyPages"

export default defineEventHandler((event: H3Event) => {
  beginLegacy(event, "/")
  return renderHome(event)
})
