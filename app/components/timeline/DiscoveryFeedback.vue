<template>
  <div
    v-if="showBackground"
    class="inline-flex items-center gap-0.5 rounded-lg bg-base-100/90 px-1.5 py-1 shadow-md backdrop-blur"
  >
    <button
      v-for="action in actions"
      :key="action.key"
      type="button"
      class="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
      :class="action.selected
        ? action.key === 'positive' ? 'text-primary' : action.key === 'negative' ? 'text-error' : 'text-base-content'
        : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'"
      :title="action.label"
      :aria-label="action.label"
      :disabled="loading"
      @click.stop.prevent="handleAction(action.key)"
    >
      <component :is="action.icon" class="h-3.5 w-3.5" />
    </button>
  </div>
  <div v-else class="inline-flex items-center gap-0.5">
    <button
      v-for="action in actions"
      :key="action.key"
      type="button"
      class="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
      :class="action.selected
        ? action.key === 'positive' ? 'text-primary' : action.key === 'negative' ? 'text-error' : 'text-base-content'
        : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'"
      :title="action.label"
      :aria-label="action.label"
      :disabled="loading"
      @click.stop.prevent="handleAction(action.key)"
    >
      <component :is="action.icon" class="h-3.5 w-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  IconThumbsUp,
  IconThumbsDown,
  IconEyeOff,
} from "#components";
import {
  submitDiscoveryFeedback,
  markDiscoveryUninterested,
  removeDiscoveryUninterested,
} from "~/utils/api";

interface Props {
  kind: string;
  referenceId: string;
  /** Show the "not interested" action (hidden for post cards). */
  showNotInterested?: boolean;
  /** Wrap actions in the frosted pill container. */
  showBackground?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showNotInterested: true,
  showBackground: true,
});

const emit = defineEmits<{
  /** Fired after a successful feedback / uninterested submission. */
  submitted: [];
}>();

const { t } = useI18n();

const selected = ref<"positive" | "negative" | null>(null);
const uninterested = ref(false);
const loading = ref(false);

const actions = computed(() => {
  const list = [
    {
      key: "positive",
      icon: IconThumbsUp,
      label: t("home.discovery.showMoreLikeThis"),
      selected: selected.value === "positive",
    },
    {
      key: "negative",
      icon: IconThumbsDown,
      label: t("home.discovery.showLessLikeThis"),
      selected: selected.value === "negative",
    },
  ];
  if (props.showNotInterested) {
    list.push({
      key: "uninterested",
      icon: IconEyeOff,
      label: t("home.discovery.notInterested"),
      selected: uninterested.value,
    });
  }
  return list;
});

async function handleAction(action: string) {
  if (loading.value) return;
  loading.value = true;
  try {
    if (action === "uninterested") {
      if (uninterested.value) {
        await removeDiscoveryUninterested(props.kind, props.referenceId);
        uninterested.value = false;
      } else {
        await markDiscoveryUninterested(props.kind, props.referenceId);
        uninterested.value = true;
        emit("submitted");
      }
    } else {
      await submitDiscoveryFeedback(
        props.kind,
        props.referenceId,
        action === "positive" ? "good" : "bad",
      );
      selected.value = action as "positive" | "negative";
      emit("submitted");
    }
  } catch (e) {
    console.error("Failed to submit discovery feedback:", e);
  } finally {
    loading.value = false;
  }
}
</script>
