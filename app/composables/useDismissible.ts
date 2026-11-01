/**
 * A banner a reader can close for good.
 *
 * Dismissal is stored per key, so one closed notice never hides another, and
 * the state is read during setup rather than on mount: a reader who closed a
 * banner should never see it flash for a frame on the next visit.
 */
export function useDismissible(key: string) {
  const storageKey = `dismissed:${key}`;
  const dismissed = ref(false);

  if (import.meta.client) {
    try {
      dismissed.value = window.localStorage.getItem(storageKey) === "1";
    } catch {
      // Private mode, quota, disabled storage: show the banner rather than
      // failing the page over a preference.
      dismissed.value = false;
    }
  }

  function dismiss() {
    dismissed.value = true;
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // The banner stays hidden for this session even when the write fails.
    }
  }

  return { dismissed, dismiss };
}
