<template>
  <div class="dropdown" :class="{ 'dropdown-end': dropdownEnd }">
    <label tabindex="0" class="flex items-center gap-3 rounded-box px-3 py-2.5 transition-colors cursor-pointer hover:bg-base-200/80" :class="{ 'w-full': fullWidth }">
      <div class="avatar">
        <div class="w-8 rounded-full">
          <img
            v-if="currentPictureUrl"
            :src="currentPictureUrl"
            :alt="currentName || 'Publisher'"
          />
          <div
            v-else
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold"
          >
            {{ currentInitials }}
          </div>
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-semibold">{{ currentName || placeholder }}</div>
        <div v-if="currentHandle" class="truncate text-[11px] text-base-content/40">@{{ currentHandle }}</div>
      </div>
      <IconChevronDown class="w-4 h-4 shrink-0 text-base-content/40" />
    </label>
    <ul
      tabindex="0"
      class="dropdown-content menu z-[1] w-full min-w-[220px] rounded-box bg-base-100 p-2 shadow-sm mt-1"
    >
      <li v-if="modelValue">
        <button @click="$emit('update:modelValue', null)" class="flex items-center gap-3">
          <IconX class="w-4 h-4" />
          <span>{{ clearLabel }}</span>
        </button>
      </li>
      <li v-for="pub in publishers" :key="pub.id">
        <button
          class="flex items-center gap-3"
          :class="{ 'active': modelValue?.id === pub.id }"
          @click="$emit('update:modelValue', pub)"
        >
          <div class="avatar">
            <div class="w-7 rounded-full">
              <img
                v-if="getPictureUrl(pub)"
                :src="getPictureUrl(pub)"
                :alt="getName(pub)"
              />
              <div
                v-else
                class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold"
              >
                {{ getName(pub).slice(0, 2).toUpperCase() }}
              </div>
            </div>
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm">{{ getNick(pub) || getName(pub) }}</div>
            <div class="truncate text-[11px] text-base-content/40">@{{ getName(pub) }}</div>
          </div>
          <IconCheck v-if="modelValue?.id === pub.id" class="w-4 h-4 ml-auto text-primary" />
        </button>
      </li>
      <li v-if="publishers.length === 0" class="px-3 py-2 text-sm text-base-content/50">
        {{ emptyText }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { IconChevronDown, IconX, IconCheck } from '#components'
import { getFileUrl } from '~/utils/files'

interface PublisherLike {
  id: string
  name: string
  nick?: string | null
  picture?: { id: string } | null
  [key: string]: any
}

const props = withDefaults(defineProps<{
  modelValue: PublisherLike | null
  publishers: PublisherLike[]
  placeholder?: string
  clearLabel?: string
  emptyText?: string
  fullWidth?: boolean
  dropdownEnd?: boolean
}>(), {
  placeholder: 'Select publisher',
  clearLabel: 'Clear selection',
  emptyText: 'No publishers available',
  fullWidth: true,
  dropdownEnd: false,
})

defineEmits<{
  'update:modelValue': [value: PublisherLike | null]
}>()

const currentName = computed(() => props.modelValue?.name || '')
const currentNick = computed(() => props.modelValue?.nick || '')
const currentHandle = computed(() => currentNick.value || currentName.value)
const currentPictureUrl = computed(() => {
  const id = props.modelValue?.picture?.id
  return id ? getFileUrl(id) ?? undefined : undefined
})
const currentInitials = computed(() => {
  const name = currentNick.value || currentName.value || '?'
  return name.slice(0, 2).toUpperCase()
})

function getName(pub: PublisherLike): string {
  return pub.name || ''
}

function getNick(pub: PublisherLike): string {
  return pub.nick || ''
}

function getPictureUrl(pub: PublisherLike): string | undefined {
  const id = pub.picture?.id
  return id ? getFileUrl(id) ?? undefined : undefined
}
</script>
