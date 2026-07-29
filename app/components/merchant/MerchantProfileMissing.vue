<template>
  <div class="rounded-box bg-warning/10 p-6 sm:p-8">
    <div class="flex flex-col sm:flex-row sm:items-start gap-4">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-box bg-warning/20 text-warning">
        <IconWallet class="h-6 w-6" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-base font-bold text-base-content">
          {{ t('merchant.profileMissing.title') }}
        </h3>
        <p class="mt-1.5 text-sm text-base-content/65 leading-relaxed">
          {{ t('merchant.profileMissing.description') }}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <NuxtLink
            :to="`/merchants/${pubName}/settings`"
            class="btn btn-warning btn-sm"
          >
            <IconSettings class="h-4 w-4" />
            {{ t('merchant.profileMissing.configureCta') }}
          </NuxtLink>
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconWallet, IconSettings } from '#components'

defineProps<{
  pubName: string
}>()

const { t } = useI18n()
</script>
