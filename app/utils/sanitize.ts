/**
 * Minimal, dependency-free HTML sanitizer for email bodies.
 *
 * ElecPostal stores inbound HTML bodies and re-serves them through the API.
 * We render them with v-html, so strip active content and event handlers
 * before they reach the DOM. Server-generated mail is lower-risk than
 * arbitrary input, but defense-in-depth here is cheap.
 */

const REMOVE_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "title",
  "base",
  "form",
  "input",
  "button",
  "select",
  "textarea",
]);

/**
 * Sanitize an HTML string for safe insertion via v-html.
 * Falls back to tag-stripped plain text when DOMParser is unavailable.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") {
    return stripHtmlTags(html);
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const nodes: Element[] = [];
  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    nodes.push(el);
  }

  // Remove dangerous containers first (bottom-up so children are handled once).
  for (const el of nodes) {
    if (REMOVE_TAGS.has(el.tagName.toLowerCase())) {
      el.remove();
      continue;
    }
    // Strip event handlers and javascript: URLs.
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "href" || name === "src" || name === "xlink:href") {
        const value = attr.value.trim().toLowerCase();
        if (
          value.startsWith("javascript:") ||
          value.startsWith("vbscript:") ||
          value.startsWith("data:text/html")
        ) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  return root.innerHTML;
}

/**
 * Strip all tags from an HTML string. Used for plain-text list snippets
 * and as the sanitizer fallback when DOMParser is unavailable.
 */
export function stripHtmlTags(html: string): string {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
