/**
 * HTML sanitizer for email bodies.
 *
 * Uses sanitize-html for a well-tested, spec-compliant allowlist.
 * Email bodies are rendered inside a sandboxed <iframe :srcdoc> so even
 * if something slips through the allowlist, the sandbox blocks scripts,
 * popups, and top-frame navigation.
 */

import sanitize from "sanitize-html";

/** Generous allowlist for email HTML — covers tables, inline styles, images. */
const EMAIL_SANITIZE_OPTIONS: sanitize.IOptions = {
  allowedTags: [
    "a", "abbr", "b", "blockquote", "br",
    "code", "div", "em", "font", "h1", "h2",
    "h3", "h4", "hr", "i", "img", "li",
    "ol", "p", "pre", "span", "strong",
    "style", "title",
    "table", "tbody", "td", "tfoot", "th",
    "thead", "tr", "u", "ul",
    "center", "dd", "dl", "dt", "sub", "sup",
    "small", "big", "del", "ins", "mark",
    "figure", "figcaption", "section", "article",
    "header", "footer", "aside", "nav",
    "details", "summary",
  ],
  allowedAttributes: {
    "*": ["class", "style", "dir", "lang", "align", "valign", "width", "height"],
    "a": ["href", "title", "target", "name", "id"],
    "img": ["src", "alt", "width", "height", "border", "hspace", "vspace", "usemap", "ismap"],
    "td": ["colspan", "rowspan", "nowrap", "bgcolor", "background"],
    "th": ["colspan", "rowspan", "nowrap", "bgcolor", "background", "scope"],
    "table": ["cellpadding", "cellspacing", "border", "bgcolor", "background", "width", "summary", "role"],
    "font": ["color", "size", "face"],
    "hr": ["width", "size", "noshade"],
    "blockquote": ["cite"],
    "ol": ["start", "type", "reversed"],
    "li": ["value", "type"],
  },
  allowedSchemes: ["http", "https", "mailto", "cid", "data"],
  allowedDataAttributes: [],
  allowVulnerableTags: false,
};

/**
 * Sanitize an HTML string for safe rendering in a sandboxed iframe.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return "";
  return sanitize(html, EMAIL_SANITIZE_OPTIONS);
}

/**
 * Sanitize an HTML string for safe insertion via v-html (non-email contexts).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return sanitize(html, {
    allowedTags: false,
    allowedAttributes: false,
    allowedSchemes: ["http", "https", "mailto", "cid"],
    disallowedTagsMode: "discard",
  });
}

/**
 * Strip all tags from an HTML string. Used for plain-text list snippets.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";
  return sanitize(html, {
    allowedTags: [],
    allowedAttributes: {},
  });
}
