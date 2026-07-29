<template>
  <div v-if="resolvedUrls.length" class="space-y-2">
    <img
      v-for="(url, i) in resolvedUrls"
      :key="`${url}-${i}`"
      :src="url"
      alt=""
      class="block w-full h-auto rounded-box"
    />
  </div>
</template>

<script setup lang="ts">
import { getFileUrl } from "~/utils/files";

const props = defineProps<{
  fileIds: string[];
}>();

function isRemoteUri(value: string) {
  try {
    const uri = new URL(value);
    return uri.protocol === "http:" || uri.protocol === "https:";
  } catch {
    return false;
  }
}

const resolvedUrls = computed(() =>
  props.fileIds
    .map((id) => (isRemoteUri(id) ? id : getFileUrl(id)))
    .filter((u): u is string => Boolean(u)),
);
</script>
