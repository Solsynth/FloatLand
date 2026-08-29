import {
  IconCompass,
  IconBuilding,
  IconBriefcaseBusiness,
  IconHardDrive,
  IconPalette,
  IconCode,
  IconWallet,
  IconTrendingUp,
  IconShield,
  IconTicket,
  IconLayoutDashboard,
  IconBrain,
} from "#components";

export interface NavItem {
  icon: any;
  labelKey: string;
  href: string;
  badge?: number | null;
  requiresAuth?: boolean;
  requiresSuperuser?: boolean;
}

/**
 * Main navigation items shared between desktop sidebar and mobile menu.
 * Uses i18n keys for labels.
 */
export function useMainNav() {
  const { isSuperuser } = useAuth();

  const navItems = computed<NavItem[]>(() => [
    { icon: IconCompass, labelKey: "nav.explore", href: "/" },
    { icon: IconBuilding, labelKey: "nav.realms", href: "/realms" },
    {
      icon: IconBriefcaseBusiness,
      labelKey: "nav.workspaces",
      href: "/workspaces",
      requiresAuth: true,
    },
    { icon: IconHardDrive, labelKey: "nav.drive", href: "/drive" },
    { icon: IconWallet, labelKey: "nav.wallet", href: "/wallets" },
    {
      icon: IconTicket,
      labelKey: "nav.tickets",
      href: "/tickets",
      requiresAuth: true,
    },
  ]);

  const backstageItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { icon: IconPalette, labelKey: "nav.creatorHub", href: "/creators" },
      { icon: IconCode, labelKey: "nav.developerHub", href: "/developers" },
      { icon: IconTrendingUp, labelKey: "nav.merchantHub", href: "/merchants" },
      {
        icon: IconBrain,
        labelKey: "nav.aiConsole",
        href: "/personality",
        requiresAuth: true,
      },
    ];

    if (isSuperuser.value) {
      items.push({
        icon: IconShield,
        labelKey: "nav.adminPanel",
        href: "/admin",
        requiresSuperuser: true,
      });
    }

    return items;
  });

  const backstageEntry = {
    icon: IconLayoutDashboard,
    labelKey: "nav.backstage",
  };

  return { navItems, backstageItems, backstageEntry };
}
