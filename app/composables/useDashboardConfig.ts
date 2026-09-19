export type DashboardModuleId =
  | "weather"
  | "friends"
  | "oracle"
  | "fortuneTrend"
  | "chats"
  | "notifications";

export interface DashboardModule {
  id: DashboardModuleId;
  labelKey: string;
  requiresAuth: boolean;
}

/** Registry of dashboard modules and the default display order. */
export const DASHBOARD_MODULES: DashboardModule[] = [
  { id: "weather", labelKey: "dashboard.weather.title", requiresAuth: false },
  { id: "friends", labelKey: "dashboard.friends.title", requiresAuth: true },
  { id: "oracle", labelKey: "dashboard.oracle.title", requiresAuth: true },
  { id: "fortuneTrend", labelKey: "dashboard.fortuneTrend.title", requiresAuth: true },
  { id: "chats", labelKey: "dashboard.chats.title", requiresAuth: true },
  { id: "notifications", labelKey: "dashboard.notifications.title", requiresAuth: true },
];

export const DEFAULT_DASHBOARD_ORDER: DashboardModuleId[] = DASHBOARD_MODULES.map(
  (module) => module.id,
);

const KNOWN_MODULE_IDS = Object.fromEntries(
  DASHBOARD_MODULES.map((module) => [module.id, true]),
) as Record<DashboardModuleId, true>;

const STORAGE_KEY = "dashboard-modules";

// Module-level state so every `useDashboardConfig()` caller (the page grid and
// the customize panel) shares the same order ref.
const order = ref<DashboardModuleId[]>([...DEFAULT_DASHBOARD_ORDER]);
const hidden = ref<DashboardModuleId[]>([]);
let loaded = false;

/**
 * Dashboard module visibility + order, persisted to localStorage.
 *
 * Loaded only on the client after mount: SSR and the first client render use
 * the default order so hydration never diverges (the module set would
 * otherwise differ between server and browser). The saved order then applies
 * in a single client-side re-render.
 */
export function useDashboardConfig() {
  function persist() {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: 2, order: order.value, hidden: hidden.value }),
      );
    } catch {
      // Storage may be unavailable (private mode); keep in-memory state.
    }
  }

  function load() {
    if (!import.meta.client) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { v?: number; order?: unknown; hidden?: unknown };
      if (!Array.isArray(parsed?.order)) return;
      const keepValid = (list: unknown[]) =>
        list.filter(
          (id): id is DashboardModuleId =>
            typeof id === "string" && KNOWN_MODULE_IDS[id as DashboardModuleId] === true,
        );
      const savedOrder = keepValid(parsed.order);
      const savedHidden = keepValid(Array.isArray(parsed.hidden) ? parsed.hidden : []);
      // Modules never seen in the saved config are genuinely new — show them.
      const placed = [...savedOrder, ...savedHidden];
      const fresh = DASHBOARD_MODULES.map((m) => m.id).filter((id) => !placed.includes(id));
      order.value = [...savedOrder, ...fresh];
      hidden.value = savedHidden;
    } catch {
      // Corrupt payload — fall back to defaults.
    }
  }

  onMounted(() => {
    if (loaded) return;
    loaded = true;
    load();
  });

  const isVisible = (id: DashboardModuleId) => order.value.includes(id);

  const indexOf = (id: DashboardModuleId) => order.value.indexOf(id);

  function toggle(id: DashboardModuleId) {
    const index = order.value.indexOf(id);
    if (index >= 0) {
      order.value.splice(index, 1);
      if (!hidden.value.includes(id)) hidden.value.push(id);
    } else {
      order.value.push(id);
      const hiddenIndex = hidden.value.indexOf(id);
      if (hiddenIndex >= 0) hidden.value.splice(hiddenIndex, 1);
    }
    persist();
  }

  function move(id: DashboardModuleId, direction: -1 | 1) {
    const index = order.value.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.value.length) return;
    const next = [...order.value];
    const at = next[index];
    const to = next[target];
    if (at === undefined || to === undefined) return;
    next[index] = to;
    next[target] = at;
    order.value = next;
    persist();
  }

  function reset() {
    order.value = [...DEFAULT_DASHBOARD_ORDER];
    hidden.value = [];
    persist();
  }

  const isCustomized = computed(
    () => JSON.stringify(order.value) !== JSON.stringify(DEFAULT_DASHBOARD_ORDER),
  );

  return { order, isVisible, indexOf, toggle, move, reset, isCustomized };
}
