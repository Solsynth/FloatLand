/**
 * Theme preference for the console shell.
 *
 * The stylesheet ships both ramps and lets `prefers-color-scheme` pick the
 * default (`console-light` is the `:root` theme, `console` applies under a
 * dark system preference when nothing is pinned). This composable only matters
 * once a reader has *chosen* a side: it pins `data-theme`, and `null` hands the
 * decision back to the system.
 *
 * The same choice is read before first paint by the inline boot script in
 * `nuxt.config.ts`, so a pinned theme never flashes the other one.
 */
export type ThemeChoice = "light" | "dark" | null;

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const choice = ref<ThemeChoice>(null);
let initialised = false;

const systemIsDark = () =>
  typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;

const resolved = (): "light" | "dark" =>
  choice.value ?? (systemIsDark() ? "dark" : "light");

/** Pin the ramp the stylesheet should paint, or release it to the system. */
function apply(next: ThemeChoice) {
  choice.value = next;
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (next === null) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next === "dark" ? "console" : "console-light");
}

export function useTheme() {
  if (import.meta.client && !initialised) {
    initialised = true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    choice.value = stored === "dark" || stored === "light" ? stored : null;
    // The boot script already painted this; re-applying keeps the DOM and the
    // ref in step when the script was skipped (a cached, bfcache-restored page).
    apply(choice.value);

    // An unpinned console must follow the system when the reader changes it
    // while the page is open.
    window.matchMedia(DARK_QUERY).addEventListener("change", () => {
      if (choice.value === null) apply(null);
    });
  }

  const setTheme = (next: ThemeChoice) => {
    if (next === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  };

  return {
    /** The reader's explicit choice, or `null` when following the system. */
    choice: readonly(choice),
    isDark: computed(() => resolved() === "dark"),
    setTheme,
    toggle: () => setTheme(resolved() === "dark" ? "light" : "dark"),
  };
}
