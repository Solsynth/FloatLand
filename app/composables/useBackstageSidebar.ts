const STORAGE_KEY = "floatland:backstage-sidebar-collapsed";

export function useBackstageSidebar() {
  const collapsed = useState("backstage-sidebar-collapsed", () => false);
  const hasLoaded = useState("backstage-sidebar-collapsed-loaded", () => false);

  onMounted(() => {
    if (hasLoaded.value) return;
    hasLoaded.value = true;

    try {
      collapsed.value = localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      // Keep the expanded default when storage is unavailable.
    }
  });

  function setCollapsed(value: boolean) {
    collapsed.value = value;

    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // The control still works for this session when storage is unavailable.
    }
  }

  function toggleSidebar() {
    setCollapsed(!collapsed.value);
  }

  return {
    collapsed: readonly(collapsed),
    setCollapsed,
    toggleSidebar,
  };
}
