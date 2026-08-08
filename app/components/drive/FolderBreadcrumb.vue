<template>
  <nav class="flex items-center gap-1 text-sm overflow-x-auto">
    <template v-for="(segment, index) in pathStack" :key="index">
      <button
        class="btn btn-ghost btn-xs px-2 h-7 min-h-0 shrink-0"
        :class="{ 'font-semibold text-primary': index === pathStack.length - 1 }"
        @click="$emit('navigate', index)"
      >
        <span class="truncate max-w-[120px]">{{ index === 0 ? t("drive.root") : segment.name }}</span>
      </button>
      <IconChevronRight v-if="index < pathStack.length - 1" class="w-3.5 h-3.5 text-base-content/40 shrink-0" />
    </template>
  </nav>
</template>

<script setup lang="ts">
const { t } = useI18n();
defineProps<{
  pathStack: Array<{ id: string | null; name: string }>
}>()

defineEmits<{
  navigate: [index: number]
}>()
</script>
