<template>
  <AdminSidebar
    :section-label="t('developer.console')"
    :nav-groups="navGroups"
    :organizations="orgList"
    :current-org="currentDeveloper ? mapOrg(currentDeveloper) : null"
    :select-placeholder="t('developer.selectDeveloper')"
    :clear-label="t('developer.clearDeveloper')"
    :loading="isLoading"
    portal-mode="developer"
    :is-publisher-selected="!!currentDeveloper"
    :show-portal-toggle="!!currentDeveloper"
    @navigate="$emit('navigate')"
    @clear-selection="
      clearSelection();
      $emit('navigate');
    "
    @toggle-portal="handleTogglePortal"
  />
</template>

<script setup lang="ts">
import {
  IconSettings,
  IconTestTube,
  IconBot,
  IconBoxes,
  IconStore,
} from "#components";
import type { Developer } from "~/types/developer";

defineEmits<{ navigate: [] }>();

const route = useRoute();
const { t } = useI18n();
const developer = useDeveloper();
const { developers, currentDeveloper, isLoading, clearSelection } = developer;

const pubName = computed(
  () => currentDeveloper?.value?.publisher?.name ?? null,
);

const orgList = computed(
  () =>
    developers.value.map(mapOrg).filter(Boolean) as Array<{
      id: string;
      name: string;
      nick?: string;
      picture?: { id: string } | null;
      [key: string]: any;
    }>,
);

function handleTogglePortal(mode: "creator" | "developer" | "merchant") {
  if (mode === "creator") {
    const name = pubName.value;
    if (name) {
      navigateTo(`/creators/${name}`);
    }
  } else if (mode === "merchant") {
    const name = pubName.value;
    if (name) {
      navigateTo(`/merchants/${name}`);
    }
  }
}

// Map developer's publisher to the AdminSidebar org shape
function mapOrg(dev: Developer) {
  if (!dev.publisher) return null;
  return {
    id: dev.id,
    name: dev.publisher.name,
    nick: dev.publisher.nick,
    picture: dev.publisher.picture,
  };
}

const projectRouteMatch = computed(() => {
  const path = route.path;
  const match = path.match(/^\/developers\/([^/]+)\/projects\/([^/]+)/);
  return match ? { pubName: match[1], projectId: match[2] } : null;
});

const navGroups = computed(() => {
  // API Playground is always available
  const groups = [
    {
      label: t("developer.apiPlayground"),
      items: [
        {
          icon: IconTestTube,
          label: t("developer.apiPlayground"),
          href: "/developers/api-playground",
        },
        {
          icon: IconStore,
          label: "Plugin marketplace",
          href: "/developers/marketplace",
        },
      ],
    },
  ];

  // Publisher-specific nav
  if (pubName.value) {
    const p = pubName.value;
    groups.unshift({
      label: t("nav.settings"),
      items: [
        {
          icon: IconSettings,
          label: t("developer.settings"),
          href: `/developers/${p}/settings`,
        },
        {
          icon: IconStore,
          label: t("developer.apps.distribution.title"),
          href: `/developers/${p}/distribution`,
        },
      ],
    });
  }

  // Project-specific nav
  const proj = projectRouteMatch.value;
  if (proj) {
    const base = `/developers/${proj.pubName}/projects/${proj.projectId}`;
    groups.unshift({
      label: t("developer.projects.title"),
      items: [
        {
          icon: IconBot,
          label: t("developer.bots.title"),
          href: `${base}/bots`,
        },
        {
          icon: IconBoxes,
          label: t("developer.apps.title"),
          href: `${base}/apps`,
        },
        { icon: IconStore, label: "Plugins", href: `${base}/miniapps` },
      ],
    });
  }

  return groups;
});
</script>
