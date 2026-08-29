/**
 * Shared state for the currently selected email ID in the two-column mail layout.
 * Used by [folder].vue (list column) and email/[id].vue (reader column).
 */

const selectedEmailId = ref<string | null>(null);

export function useMailSelected() {
  function select(id: string | null) {
    selectedEmailId.value = id;
  }

  function clear() {
    selectedEmailId.value = null;
  }

  return {
    selectedEmailId: readonly(selectedEmailId),
    select,
    clear,
  };
}
