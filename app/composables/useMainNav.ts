import { IconCompass, IconBuilding, IconTag, IconFolder } from "#components";
import type { Component } from "vue";

export interface PrimaryNavItem {
  icon: Component;
  labelKey: string;
  href: string;
  /** A route prefix that keeps the item marked while a child page is open. */
  match: string;
}

/**
 * The explorer's nav. It is deliberately short: this surface reads content, so
 * every entry is a way *into* posts, and anything that is not a reading surface
 * (wallets, support, backstage consoles) does not belong here.
 */
export function useMainNav() {
  const items = computed<PrimaryNavItem[]>(() => [
    { icon: IconCompass, labelKey: "nav.explore", href: "/", match: "/" },
    { icon: IconBuilding, labelKey: "nav.realms", href: "/realms", match: "/realms" },
    { icon: IconFolder, labelKey: "nav.categories", href: "/categories", match: "/categories" },
    { icon: IconTag, labelKey: "nav.tags", href: "/tags", match: "/tags" },
  ]);

  return { items };
}
