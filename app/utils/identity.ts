/**
 * Shared helpers for rendering publisher/account identity — display name,
 * avatar URL, and initials fallback. Used by PostCard, PostReplyPreview and
 * the discovery cards so every card renders identity the same way.
 */
import type { Post } from "~/types/post";
import { getFileUrl } from "~/utils/files";

type PublisherLike = Post["publisher"] | null | undefined;

export function getDisplayName(target: PublisherLike): string {
  if (!target) return "Unknown";
  return target.nick || target.name || "Unknown";
}

export function getInitials(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed || trimmed === "Unknown") return "?";
  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarUrl(target: PublisherLike): string {
  if (!target) return "";
  return getFileUrl(target.picture?.id) ?? "";
}
