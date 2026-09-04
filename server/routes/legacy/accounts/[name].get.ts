// /legacy/accounts/[name] — legacy no-JS account profile.

import type { H3Event } from "h3"
import { defineEventHandler } from "h3"
import { beginLegacy } from "../../../utils/legacyReq"
import { renderAccount } from "../../../utils/legacyPages"

export default defineEventHandler((event: H3Event) => {
  beginLegacy(event, "/")
  return renderAccount(event)
})
