export function mergeCookieHeader(
  incomingCookie: string | undefined,
  setCookies: string[],
): string {
  const cookieParts = (incomingCookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const cookie of setCookies) {
    const pair = cookie.split(";", 1)[0]?.trim();
    if (!pair) continue;
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    const name = pair.slice(0, separator);
    const existing = cookieParts.findIndex(
      (part) => part.slice(0, part.indexOf("=")) === name,
    );
    if (existing >= 0) {
      cookieParts[existing] = pair;
    } else {
      cookieParts.push(pair);
    }
  }

  return cookieParts.join("; ");
}
