<template>
  <div
    class="rounded-box bg-base-100 p-5 shadow-sm transition-colors hover:bg-base-200"
    :class="clickable ? 'cursor-pointer' : ''"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between">
      <div class="space-y-1 min-w-0">
        <p class="truncate text-xs font-medium text-base-content/50">
          {{ label }}
        </p>
        <p class="text-2xl font-bold tracking-tight text-base-content">
          {{ formattedValue }}
        </p>
        <p
          v-if="trend !== undefined && trend !== null"
          class="inline-flex items-center gap-1 text-xs font-medium"
          :class="trend >= 0 ? 'text-success' : 'text-error'"
        >
          <IconTrendingUp v-if="trend > 0" class="w-3 h-3" />
          <IconTrendingDown v-else class="w-3 h-3" />
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </p>
      </div>
      <div
        v-if="icon"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-box"
        :class="iconBg"
      >
        <component :is="icon" class="w-5 h-5" :class="iconColor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconTrendingUp, IconTrendingDown } from '#components'

const props = withDefaults(defineProps<{
  label: string
  value: number | string
  icon?: any
  trend?: number | null
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
  clickable?: boolean
  format?: 'number' | 'compact' | 'decimal'
}>(), {
  trend: null,
  color: 'primary',
  clickable: false,
  format: 'compact',
})

defineEmits<{
  click: []
}>()

const iconBg = computed(() => {
  const map: Record<string, string> = {
    primary: 'bg-primary/10',
    secondary: 'bg-primary/10',
    accent: 'bg-primary/10',
    info: 'bg-info/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    error: 'bg-error/10',
  }
  return map[props.color] || map.primary
})

const iconColor = computed(() => {
  const map: Record<string, string> = {
    primary: 'text-primary',
    secondary: 'text-primary',
    accent: 'text-primary',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  }
  return map[props.color] || map.primary
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  if (props.format === 'number') return props.value.toLocaleString()
  if (props.format === 'compact') {
    if (props.value >= 1_000_000) return (props.value / 1_000_000).toFixed(1) + 'M'
    if (props.value >= 1_000) return (props.value / 1_000).toFixed(1) + 'K'
    return props.value.toLocaleString()
  }
  return props.value.toLocaleString()
})
</script>
