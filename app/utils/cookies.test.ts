import { expect, test } from "bun:test";

import { mergeCookieHeader } from "./cookies";

test("mergeCookieHeader replaces rotated cookies and preserves unrelated cookies", () => {
  expect(
    mergeCookieHeader(
      "session_hint=keep; AuthToken=expired; RefreshToken=old",
      [
        "AuthToken=fresh; Path=/; HttpOnly",
        "RefreshToken=rotated; Path=/; HttpOnly",
      ],
    ),
  ).toBe("session_hint=keep; AuthToken=fresh; RefreshToken=rotated");
});

test("mergeCookieHeader adds rotated cookies when the incoming header omitted them", () => {
  expect(
    mergeCookieHeader("session_hint=keep", [
      "RefreshToken=fresh; Path=/; HttpOnly",
    ]),
  ).toBe("session_hint=keep; RefreshToken=fresh");
});
