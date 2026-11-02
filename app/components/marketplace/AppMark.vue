<script setup lang="ts">
import { computed } from "vue";
import { IconPackage } from "#components";
import type { SnCloudFile } from "~/types/drive";

const props = withDefaults(
  defineProps<{
    picture?: SnCloudFile | null;
    name?: string;
    /** Square the corner for list rows; leave rounded for a page title. */
    flat?: boolean;
    /** Circle the mark, which is how an account avatar is cut. */
    round?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
  }>(),
  { flat: false, round: false, size: "md", picture: null, name: "" },
);

const monogram = computed(() =>
  (props.name ?? "").trim().slice(0, 1).toUpperCase() || "?",
);

const box = computed(() => {
  switch (props.size) {
    case "xs":
      return "h-6 w-6 text-[10px]";
    case "sm":
      return "h-7 w-7 text-[11px]";
    case "lg":
      return "h-14 w-14 text-lg";
    default:
      return "h-9 w-9 text-sm";
  }
});

const shape = computed(() => {
  if (props.round) return "rounded-full";
  return props.flat ? "rounded-mark" : "rounded-chip";
});
</script>

<template>
  <span
    class="flex shrink-0 items-center justify-center overflow-hidden bg-base-300/60 text-dim"
    :class="[box, shape]"
  >
    <FileImage
      v-if="picture?.id || picture?.url"
      :file="picture"
      :alt="name"
      class="h-full w-full object-cover"
    >
      <template #fallback>
        <span v-if="name" class="font-sans font-medium" aria-hidden="true">{{ monogram }}</span>
        <IconPackage v-else class="size-4" aria-hidden="true" />
      </template>
    </FileImage>
    <span v-else-if="name" class="font-sans font-medium" aria-hidden="true">{{ monogram }}</span>
    <IconPackage v-else class="size-4" aria-hidden="true" />
  </span>
</template>
