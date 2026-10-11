import {
  IconCompass,
  IconBuilding,
  IconBriefcaseBusiness,
  IconHardDrive,
  IconMail,
  IconPalette,
  IconCode,
  IconWallet,
  IconTrendingUp,
  IconShield,
  IconTicket,
  IconLayoutDashboard,
  IconPawPrint,
} from "#components";

/** Products that left this app and now live on their own domains. */
export const EXTERNAL_APPS = {
  pet: "https://pet.solian.app",
  drive: "https://solarpass.one",
  mail: "https://solarpass.one",
} as const;

export interface NavItem {
  icon: any;
  labelKey: string;
  href: string;
  badge?: number | null;
  external?: boolean;
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
    { icon: IconCompass, labelKey: "nav.explore", href: "/timeline" },
    { icon: IconBuilding, labelKey: "nav.realms", href: "/realms" },
    {
      icon: IconBriefcaseBusiness,
      labelKey: "nav.workspaces",
      href: "/workspaces",
      requiresAuth: true,
    },
    {
      icon: IconHardDrive,
      labelKey: "nav.drive",
      href: EXTERNAL_APPS.drive,
      external: true,
    },
    {
      icon: IconMail,
      labelKey: "nav.mail",
      href: EXTERNAL_APPS.mail,
      external: true,
      requiresAuth: true,
    },
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
        icon: IconPawPrint,
        labelKey: "nav.pet",
        href: EXTERNAL_APPS.pet,
        external: true,
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
