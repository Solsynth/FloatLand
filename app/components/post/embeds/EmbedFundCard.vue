<template>
  <div class="overflow-hidden rounded-card bg-base-300/60 p-4" @click.stop>
    <div v-if="!fundId" class="text-xs text-base-content/60">
      {{ t("post.embed.fundUnavailable") }}
    </div>

    <div v-else-if="loading" class="flex items-center gap-2 text-xs text-base-content/60">
      <IconLoader class="h-4 w-4 animate-spin" />
      <span>{{ t("common.loading") }}</span>
    </div>

    <div v-else-if="error || !fund" class="text-xs text-error">
      {{ t("post.embed.fundLoadFailed") }}
    </div>

    <div v-else class="space-y-3">
      <!-- Header -->
      <div class="flex items-center gap-2">
        <IconWallet class="h-4 w-4 shrink-0 text-primary" />
        <span class="min-w-0 flex-1 truncate text-sm font-semibold">
          {{ t("post.embed.fund") }}
        </span>
        <span v-if="fund.isOpen" class="chip chip-active text-[11px]">
          {{ t("post.embed.fundOpen") }}
        </span>
        <span class="chip text-[11px]" :class="statusClass">
          {{ statusLabel }}
        </span>
      </div>

      <!-- Amount & split -->
      <div>
        <div class="text-xl font-bold text-primary tabular-nums">
          {{ fund.totalAmount.toFixed(2) }} {{ fund.currency }}
        </div>
        <div
          v-if="fund.remainingAmount !== fund.totalAmount"
          class="text-xs font-medium text-base-content/75"
        >
          {{
            t("post.embed.fundRemaining", {
              amount: fund.remainingAmount.toFixed(2),
              currency: fund.currency,
            })
          }}
        </div>
        <div class="text-xs text-base-content/60">
          {{
            t("post.embed.fundSplit", {
              mode:
                fund.splitType === 0
                  ? t("post.embed.fundSplitEvenly")
                  : t("post.embed.fundSplitRandomly"),
            })
          }}
        </div>
      </div>

      <!-- Message -->
      <p
        v-if="fund.message"
        class="text-sm italic text-base-content/80"
      >
        "{{ fund.message }}"
      </p>

      <!-- Footer: creator, expiry, claim -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-base-content/60">
        <div class="flex flex-wrap items-center gap-3">
          <span v-if="fund.creatorAccount" class="inline-flex items-center gap-1">
            <IconUser class="h-3.5 w-3.5" />
            {{ fund.creatorAccount.nick || fund.creatorAccount.name }}
          </span>
          <span v-if="fund.expiresAt" class="inline-flex items-center gap-1">
            <IconClock class="h-3.5 w-3.5" />
            {{ new Date(fund.expiresAt).toLocaleDateString() }}
          </span>
        </div>

        <button
          v-if="interactive && canClaim"
          type="button"
          class="btn btn-primary btn-xs"
          :disabled="claiming"
          @click="handleClaim"
        >
          <IconLoader v-if="claiming" class="h-3.5 w-3.5 animate-spin" />
          {{ claiming ? t("post.embed.fundClaiming") : t("post.embed.fundClaim") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Fund } from "~/types/auth";
import { claimFund, fetchFund } from "~/utils/api";
import { IconClock, IconLoader, IconUser, IconWallet } from "#components";

const props = withDefaults(
  defineProps<{
    fundId?: string | null;
    interactive?: boolean;
  }>(),
  {
    fundId: null,
    interactive: true,
  },
);

const { t } = useI18n();
const { $toast } = useNuxtApp();

const fund = ref<Fund | null>(null);
const loading = ref(false);
const error = ref(false);
const claiming = ref(false);

const canClaim = computed(
  () =>
    fund.value !== null &&
    (fund.value.status === 0 || fund.value.status === 1) &&
    fund.value.remainingAmount > 0,
);

const statusLabel = computed(() => {
  switch (fund.value?.status) {
    case 0:
      return t("post.embed.fundStatusCreated");
    case 1:
      return t("post.embed.fundStatusPartial");
    case 2:
      return t("post.embed.fundStatusCompleted");
    case 3:
      return t("post.embed.fundStatusExpired");
    default:
      return t("post.embed.fundStatusUnknown");
  }
});

const statusClass = computed(() => {
  switch (fund.value?.status) {
    case 0:
      return "text-info";
    case 1:
      return "text-warning";
    case 2:
      return "text-success";
    case 3:
      return "text-error";
    default:
      return "text-base-content/60";
  }
});

async function load() {
  if (!props.fundId) return;
  loading.value = true;
  error.value = false;
  try {
    fund.value = await fetchFund(props.fundId);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.fundId, load);

async function handleClaim() {
  if (!props.fundId || claiming.value) return;
  claiming.value = true;
  try {
    await claimFund(props.fundId);
    $toast.success(t("post.embed.fundClaimSuccess"));
    await load();
  } catch {
    $toast.error(t("post.embed.fundClaimFailed"));
  } finally {
    claiming.value = false;
  }
}
</script>
