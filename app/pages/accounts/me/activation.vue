<template>
  <NuxtLayout name="app">
    <main class="mx-auto max-w-2xl px-4 py-6">
      <div class="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold">{{ t("activation.title") }}</h1>
          <p class="mt-1 text-sm text-base-content/60">{{ t("activation.description") }}</p>
        </div>
        <button class="btn btn-sm btn-outline" :class="{ loading: pending }" :disabled="pending" @click="recheck">{{ t("common.refresh") }}</button>
      </div>

      <div v-if="pending && !progress" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg" /></div>
      <div v-else-if="error" class="alert alert-error"><span>{{ error }}</span></div>
      <template v-else-if="progress">
        <div v-if="progress.isActivated" class="alert alert-success"><IconCircleCheck class="h-5 w-5" /><span>{{ t("activation.activeMessage") }}</span></div>
        <div class="card border border-base-300 bg-base-100" :class="{ 'mt-4': progress.isActivated }">
          <div class="card-body gap-5">
            <progress class="progress progress-primary w-full" :value="progress.completedRequirementCount" :max="Math.max(progress.requiredRequirementCount, 1)" />
            <div v-if="progress.requireVerifiedContact" class="flex items-center gap-3">
              <IconMailCheck v-if="progress.hasVerifiedContact" class="h-5 w-5 text-success" /><IconMail v-else class="h-5 w-5 text-warning" />
              <div><p class="font-medium">{{ t("activation.verifyContact") }}</p><p class="text-sm text-base-content/60">{{ progress.hasVerifiedContact ? t("activation.complete") : t("activation.verifyContactHint") }}</p></div>
            </div>
            <div v-for="test in progress.tests" :key="test.key" class="flex items-center justify-between gap-3 border-t border-base-200 pt-4">
              <div>
                <p class="font-medium">{{ test.title }}</p>
                <p class="text-sm text-base-content/60">
                  <template v-if="test.passed">{{ t("activation.passed") }}</template>
                  <template v-else-if="!test.available">{{ t("activation.notAvailable") }}</template>
                  <template v-else-if="test.maxAttempts != null && test.usedAttemptCount >= test.maxAttempts">{{ t("activation.maxAttemptsReached") }}</template>
                  <template v-else-if="test.maxAttempts != null">{{ t("activation.remainingAttempts", { used: test.usedAttemptCount, max: test.maxAttempts }) }}</template>
                  <template v-else>{{ t("activation.required") }}</template>
                </p>
              </div>
              <NuxtLink v-if="!progress.isActivated && !test.passed && test.available && (test.maxAttempts == null || test.usedAttemptCount < test.maxAttempts)" :to="`/accounts/tests/${test.key}`" class="btn btn-primary btn-sm">{{ t("activation.takeTest") }}</NuxtLink>
            </div>
            <p v-if="progress.testsBypassed" class="text-sm text-success">{{ t("activation.testsBypassed") }}</p>
          </div>
        </div>
        <section v-if="!progress.isActivated && !progress.testsBypassed" class="mt-4 rounded-box border border-base-300 bg-base-100 p-5">
          <h2 class="font-semibold">{{ t("activation.affiliationTitle") }}</h2>
          <p class="mt-1 text-sm text-base-content/60">{{ t("activation.affiliationHint") }}</p>
          <form class="mt-4 flex gap-2" @submit.prevent="consumeInvite">
            <input v-model.trim="inviteCode" class="input input-bordered min-w-0 flex-1" autocomplete="off" :placeholder="t('activation.affiliationPlaceholder')" :disabled="consumingInvite" />
            <button class="btn btn-outline" :class="{ loading: consumingInvite }" :disabled="!inviteCode || consumingInvite">{{ t("activation.useCode") }}</button>
          </form>
          <p v-if="inviteError" class="mt-3 text-sm text-error">{{ inviteError }}</p>
          <p v-else-if="inviteSuccess" class="mt-3 text-sm text-success">{{ inviteSuccess }}</p>
        </section>
      </template>
    </main>
  </NuxtLayout>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { progress, pending, error, loadProgress, recheck } = useAccountActivation()
const inviteCode = ref('')
const consumingInvite = ref(false)
const inviteError = ref<string | null>(null)
const inviteSuccess = ref<string | null>(null)
await useAsyncData('account-activation-progress', loadProgress)

async function consumeInvite() {
  if (!inviteCode.value || consumingInvite.value) return
  consumingInvite.value = true
  inviteError.value = null
  inviteSuccess.value = null
  try {
    await apiFetch('/passport/affiliations/registration-invites/consume', {
      method: 'POST',
      body: JSON.stringify({ spell: inviteCode.value }),
    })
    inviteCode.value = ''
    await recheck()
    inviteSuccess.value = progress.value?.isActivated
      ? t('activation.inviteActivated')
      : t('activation.inviteApplied')
  } catch (cause) {
    inviteError.value = cause instanceof Error ? cause.message : t('common.error')
  } finally {
    consumingInvite.value = false
  }
}
</script>
