<template>
  <NuxtLayout name="app">
    <div class="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <!-- Header -->
      <div class="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 class="flex items-center gap-2 text-xl font-bold tracking-tight">
            <IconBrain class="h-6 w-6 text-primary" />
            {{ t("ai.title") }}
          </h1>
          <p class="mt-1 text-sm text-base-content/50">{{ t("ai.description") }}</p>
        </div>
        <button v-if="activeTab === 'credentials'" class="btn btn-sm btn-primary" @click="openCreate">
          <IconPlus class="h-4 w-4" />
          {{ t("ai.createCredential") }}
        </button>
      </div>

      <!-- Tabs -->
      <div role="tablist" class="tabs tabs-boxed mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          role="tab"
          type="button"
          class="tab h-9 gap-2"
          :class="{ 'tab-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ t(tab.labelKey) }}
        </button>
      </div>

      <!-- ═══════════════ Overview ═══════════════ -->
      <div v-if="activeTab === 'overview'" class="space-y-4">
        <div v-if="overviewLoading" class="flex justify-center py-16">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <template v-else>
          <!-- Billing policy -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-5">
              <h2 class="flex items-center gap-2 text-sm font-semibold">
                <IconCreditCard class="h-4 w-4 text-base-content/60" />
                {{ t("ai.billingPolicy") }}
              </h2>
              <div v-if="billing" class="mt-3 grid gap-3 sm:grid-cols-2">
                <div class="rounded-box bg-base-200/60 p-3">
                  <div class="text-xs text-base-content/50">{{ t("ai.spendingQuota") }}</div>
                  <div class="mt-0.5 text-sm font-semibold">
                    {{ quotaLabel(billing.spendingQuota) }}
                  </div>
                </div>
                <div class="rounded-box bg-base-200/60 p-3">
                  <div class="text-xs text-base-content/50">{{ t("ai.hourlyRunLimit") }}</div>
                  <div class="mt-0.5 text-sm font-semibold">
                    {{ limitLabel(billing.hourlyRunLimit) }}
                  </div>
                </div>
                <div class="rounded-box bg-base-200/60 p-3">
                  <div class="text-xs text-base-content/50">{{ t("ai.dailyRunLimit") }}</div>
                  <div class="mt-0.5 text-sm font-semibold">
                    {{ limitLabel(billing.dailyRunLimit) }}
                  </div>
                </div>
                <div class="rounded-box bg-base-200/60 p-3">
                  <div class="text-xs text-base-content/50">{{ t("ai.status") }}</div>
                  <div class="mt-1">
                    <span
                      v-if="billing.blacklisted"
                      class="badge badge-error gap-1"
                    >
                      <IconShieldAlert class="h-3.5 w-3.5" />
                      {{ t("ai.blacklisted") }}
                    </span>
                    <span v-else class="badge badge-success gap-1">
                      <IconCheck class="h-3.5 w-3.5" />
                      {{ t("ai.active") }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="billing?.blacklisted" class="alert alert-error mt-3 py-2 text-sm">
                {{ t("ai.blacklistedHint") }}
              </div>

              <!-- Run usage -->
              <div v-if="billing" class="mt-4 space-y-3">
                <div v-if="billing.usage?.hourlyRuns">
                  <div class="mb-1 flex items-center justify-between text-xs">
                    <span class="text-base-content/60">{{ t("ai.hourlyUsage") }}</span>
                    <span class="font-medium">{{ runsLabel(billing.usage.hourlyRuns) }}</span>
                  </div>
                  <progress
                    class="progress progress-primary h-1.5"
                    :value="billing.usage.hourlyRuns.used"
                    :max="billing.usage.hourlyRuns.max ?? billing.usage.hourlyRuns.used"
                  />
                </div>
                <div v-if="billing.usage?.dailyRuns">
                  <div class="mb-1 flex items-center justify-between text-xs">
                    <span class="text-base-content/60">{{ t("ai.dailyUsage") }}</span>
                    <span class="font-medium">{{ runsLabel(billing.usage.dailyRuns) }}</span>
                  </div>
                  <progress
                    class="progress progress-primary h-1.5"
                    :value="billing.usage.dailyRuns.used"
                    :max="billing.usage.dailyRuns.max ?? billing.usage.dailyRuns.used"
                  />
                </div>
                <div
                  v-for="(usage, currency) in hourlyCurrencyUsage"
                  :key="'h-' + currency"
                >
                  <div class="mb-1 flex items-center justify-between text-xs">
                    <span class="text-base-content/60">
                      {{ t("ai.hourlyCurrencyUsage", { currency: currencyLabel(currency) }) }}
                    </span>
                    <span class="font-medium">{{ runsLabel(usage) }}</span>
                  </div>
                  <progress
                    class="progress progress-primary h-1.5"
                    :value="usage.used"
                    :max="usage.max ?? usage.used"
                  />
                </div>
                <div
                  v-for="(usage, currency) in dailyCurrencyUsage"
                  :key="'d-' + currency"
                >
                  <div class="mb-1 flex items-center justify-between text-xs">
                    <span class="text-base-content/60">
                      {{ t("ai.dailyCurrencyUsage", { currency: currencyLabel(currency) }) }}
                    </span>
                    <span class="font-medium">{{ runsLabel(usage) }}</span>
                  </div>
                  <progress
                    class="progress progress-primary h-1.5"
                    :value="usage.used"
                    :max="usage.max ?? usage.used"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Agents -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-5">
              <h2 class="flex items-center gap-2 text-sm font-semibold">
                <IconBot class="h-4 w-4 text-base-content/60" />
                {{ t("ai.agents") }}
              </h2>
              <div v-if="agents.length === 0" class="mt-3 text-sm text-base-content/50">
                {{ t("ai.noAgents") }}
              </div>
              <div v-else class="mt-3 space-y-2">
                <div
                  v-for="agent in agents"
                  :key="agent.id"
                  class="flex items-start justify-between gap-3 rounded-box bg-base-200/60 p-3"
                >
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-semibold">{{ agent.name }}</span>
                      <span class="badge badge-xs badge-ghost">@{{ agent.id }}</span>
                    </div>
                    <p v-if="agent.description" class="mt-0.5 text-xs text-base-content/50">
                      {{ agent.description }}
                    </p>
                    <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span v-if="agent.model" class="badge badge-xs bg-base-300">
                        {{ agent.model }}
                      </span>
                      <span
                        v-for="ability in agent.abilities ?? []"
                        :key="ability"
                        class="badge badge-xs badge-outline"
                      >
                        {{ ability }}
                      </span>
                    </div>
                  </div>
                  <span class="badge badge-sm shrink-0" :class="agent.enabled ? 'badge-success' : 'badge-ghost'">
                    {{ agent.enabled ? t("ai.enabled") : t("ai.disabled") }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Models -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-5">
              <h2 class="flex items-center gap-2 text-sm font-semibold">
                <IconCpu class="h-4 w-4 text-base-content/60" />
                {{ t("ai.models") }}
              </h2>
              <div v-if="models.length === 0" class="mt-3 text-sm text-base-content/50">
                {{ t("ai.noModels") }}
              </div>
              <div v-else class="mt-3 space-y-2">
                <div
                  v-for="model in models"
                  :key="model.id"
                  class="flex items-start justify-between gap-3 rounded-box bg-base-200/60 p-3"
                >
                  <div class="min-w-0">
                    <div class="text-sm font-semibold">{{ model.id }}</div>
                    <div class="mt-1 flex flex-wrap items-center gap-1.5">
                      <span v-if="model.type" class="badge badge-xs bg-base-300">{{ model.type }}</span>
                      <span
                        v-for="modality in model.modalities ?? []"
                        :key="modality"
                        class="badge badge-xs badge-outline"
                      >
                        {{ modality }}
                      </span>
                    </div>
                  </div>
                  <div class="shrink-0 text-right">
                    <template v-if="modelPricing(model)">
                      <div class="text-xs font-medium">
                        {{ t("ai.input") }}: {{ pricingLabel(model) }}
                      </div>
                      <div class="text-xs text-base-content/50">
                        {{ t("ai.output") }}: {{ pricingLabel(model, true) }}
                      </div>
                    </template>
                    <span v-else class="badge badge-sm badge-ghost">{{ t("ai.free") }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ═══════════════ Credentials ═══════════════ -->
      <div v-if="activeTab === 'credentials'" class="space-y-4">
        <div v-if="credentialsLoading" class="flex justify-center py-16">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <template v-else>
          <!-- Fresh token (shown exactly once after creation) -->
          <div v-if="freshToken" class="alert alert-success">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold">{{ t("ai.tokenNotice") }}</div>
              <div class="mt-2 flex items-center gap-2">
                <code class="block min-w-0 flex-1 truncate rounded-box bg-base-100 px-3 py-2 font-mono text-xs">
                  {{ freshToken }}
                </code>
                <button class="btn btn-sm btn-ghost shrink-0" @click="copyToken">
                  <IconCopy class="h-4 w-4" />
                  {{ t("ai.copy") }}
                </button>
              </div>
            </div>
            <button class="btn btn-circle btn-ghost btn-sm shrink-0" @click="dismissToken">
              <IconX class="h-4 w-4" />
            </button>
          </div>

          <div v-if="!freshToken && credentials.length === 0" class="flex flex-col items-center py-16 text-center">
            <IconKeyRound class="mb-4 h-12 w-12 text-base-content/20" />
            <p class="mb-1 text-base-content/50">{{ t("ai.noCredentials") }}</p>
            <p class="mb-4 text-xs text-base-content/30">{{ t("ai.noCredentialsHint") }}</p>
            <button class="btn btn-sm btn-primary" @click="openCreate">
              {{ t("ai.createCredential") }}
            </button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="credential in credentials"
              :key="credential.id"
              class="card bg-base-100 shadow-sm"
            >
              <div class="card-body gap-3 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-semibold">{{ credential.name }}</span>
                      <span class="badge badge-sm" :class="credential.enabled ? 'badge-success' : 'badge-ghost'">
                        {{ credential.enabled ? t("ai.enabled") : t("ai.disabled") }}
                      </span>
                    </div>
                    <code class="mt-1 block font-mono text-xs text-base-content/60">
                      {{ credential.tokenPrefix }}…
                    </code>
                  </div>
                  <button
                    class="btn btn-ghost btn-error btn-sm shrink-0"
                    :disabled="revokingId === credential.id"
                    @click="revokeCredential(credential)"
                  >
                    <IconTrash2 class="h-4 w-4" />
                    {{ t("ai.revoke") }}
                  </button>
                </div>

                <!-- Usage -->
                <div>
                  <div class="mb-1 flex items-center justify-between text-xs">
                    <span class="text-base-content/60">
                      {{ t("ai.usageUsed") }}: {{ credential.usageUsed }}
                      / {{ credential.usageLimit === "0" ? "∞" : credential.usageLimit }}
                      {{ currencyLabel(credential.usageCurrency) }}
                    </span>
                    <span class="font-medium">{{ usagePercent(credential) }}%</span>
                  </div>
                  <progress
                    class="progress h-1.5"
                    :class="usagePercent(credential) >= 100 ? 'progress-error' : 'progress-primary'"
                    :value="Math.min(usagePercent(credential), 100)"
                    max="100"
                  />
                </div>

                <!-- Allowlists -->
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/50">
                  <span>
                    {{ t("ai.allowedAgents") }}:
                    {{ credential.agentIds?.length ? credential.agentIds.join(", ") : t("ai.all") }}
                  </span>
                  <span>
                    {{ t("ai.allowedProviders") }}:
                    {{ credential.providers?.length ? credential.providers.join(", ") : t("ai.all") }}
                  </span>
                  <span>
                    {{ t("ai.allowedModels") }}:
                    {{ credential.models?.length ? credential.models.join(", ") : t("ai.all") }}
                  </span>
                </div>

                <div class="text-xs text-base-content/40">
                  {{ t("ai.createdAt") }}: {{ formatDate(credential.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ═══════════════ Billing ═══════════════ -->
      <div v-if="activeTab === 'billing'" class="space-y-4">
        <div v-if="billingLoading" class="flex justify-center py-16">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <template v-else>
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-5">
              <h2 class="flex items-center gap-2 text-sm font-semibold">
                <IconCoins class="h-4 w-4 text-base-content/60" />
                {{ t("ai.billing") }}
              </h2>
              <p class="mt-1 text-xs text-base-content/50">{{ t("ai.billingHint") }}</p>

              <div v-if="billing" class="mt-4 space-y-4">
                <!-- Spending quota -->
                <div>
                  <label class="mb-1 block text-xs text-base-content/60" for="spending-quota">
                    {{ t("ai.spendingQuota") }}
                  </label>
                  <div class="flex gap-2">
                    <input
                      id="spending-quota"
                      v-model="quotaInput"
                      type="text"
                      inputmode="decimal"
                      class="input input-sm input-bordered w-40"
                      placeholder="0"
                    />
                    <button class="btn btn-sm btn-primary" :disabled="savingQuota" @click="saveQuota">
                      <span v-if="savingQuota" class="loading loading-spinner loading-xs" />
                      {{ t("ai.setQuota") }}
                    </button>
                  </div>
                  <p class="mt-1 text-xs text-base-content/40">{{ t("ai.quotaHint") }}</p>
                </div>

                <!-- Usage summary -->
                <div class="grid gap-3 sm:grid-cols-2">
                  <div v-if="billing.usage?.hourlyRuns" class="rounded-box bg-base-200/60 p-3">
                    <div class="text-xs text-base-content/50">{{ t("ai.hourlyUsage") }}</div>
                    <div class="mt-0.5 text-sm font-semibold">
                      {{ runsLabel(billing.usage.hourlyRuns) }}
                    </div>
                  </div>
                  <div v-if="billing.usage?.dailyRuns" class="rounded-box bg-base-200/60 p-3">
                    <div class="text-xs text-base-content/50">{{ t("ai.dailyUsage") }}</div>
                    <div class="mt-0.5 text-sm font-semibold">
                      {{ runsLabel(billing.usage.dailyRuns) }}
                    </div>
                  </div>
                  <div
                    v-for="(usage, currency) in hourlyCurrencyUsage"
                    :key="'h-' + currency"
                    class="rounded-box bg-base-200/60 p-3"
                  >
                    <div class="text-xs text-base-content/50">
                      {{ t("ai.hourlyCurrencyUsage", { currency: currencyLabel(currency) }) }}
                    </div>
                    <div class="mt-0.5 text-sm font-semibold">
                      {{ runsLabel(usage) }}
                    </div>
                  </div>
                  <div
                    v-for="(usage, currency) in dailyCurrencyUsage"
                    :key="'d-' + currency"
                    class="rounded-box bg-base-200/60 p-3"
                  >
                    <div class="text-xs text-base-content/50">
                      {{ t("ai.dailyCurrencyUsage", { currency: currencyLabel(currency) }) }}
                    </div>
                    <div class="mt-0.5 text-sm font-semibold">
                      {{ runsLabel(usage) }}
                    </div>
                  </div>
                </div>

                <!-- Settle now -->
                <div class="flex flex-col gap-2 rounded-box bg-base-200/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div class="text-sm font-semibold">{{ t("ai.settleNow") }}</div>
                    <div class="text-xs text-base-content/50">{{ t("ai.settleHint") }}</div>
                  </div>
                  <button class="btn btn-sm btn-outline" :disabled="settling" @click="settleNow">
                    <span v-if="settling" class="loading loading-spinner loading-xs" />
                    {{ settling ? t("ai.settling") : t("ai.settleNow") }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ═══════════════ API ═══════════════ -->
      <div v-if="activeTab === 'api'" class="space-y-4">
        <!-- Endpoint -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-5">
            <h2 class="flex items-center gap-2 text-sm font-semibold">
              <IconTerminal class="h-4 w-4 text-base-content/60" />
              {{ t("ai.apiEndpoint") }}
            </h2>
            <p class="mt-1 text-xs text-base-content/50">{{ t("ai.apiIntro") }}</p>

            <div class="mt-3 flex items-center gap-2">
              <code class="block min-w-0 flex-1 truncate rounded-box bg-base-200 px-3 py-2 font-mono text-xs">
                {{ chatCompletionsUrl }}
              </code>
              <button class="btn btn-ghost btn-sm shrink-0" @click="copyText(chatCompletionsUrl)">
                <IconCopy class="h-4 w-4" />
                {{ t("ai.copy") }}
              </button>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-xs text-base-content/50">{{ t("ai.apiBaseUrl") }}:</span>
              <code class="font-mono text-xs">{{ apiBaseUrl }}</code>
              <button class="btn btn-ghost btn-xs" @click="copyText(apiBaseUrl)">
                <IconCopy class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Model formats -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-5">
            <h2 class="text-sm font-semibold">{{ t("ai.apiModels") }}</h2>
            <div class="mt-3 space-y-2 text-sm">
              <p>
                <code class="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs">assistant</code>
                <span class="ms-1 text-base-content/60">{{ t("ai.apiModelAgent", { agent: "assistant" }) }}</span>
              </p>
              <p>
                <code class="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs">assistant/openai/gpt-4.1-mini</code>
                <span class="ms-1 text-base-content/60">{{ t("ai.apiModelAgentModel", { agent: "assistant", provider: "openai", model: "gpt-4.1-mini" }) }}</span>
              </p>
              <p>
                <code class="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs">raw/openai/gpt-4.1-mini</code>
                <span class="ms-1 text-base-content/60">{{ t("ai.apiModelRaw", { provider: "openai", model: "gpt-4.1-mini" }) }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- curl example -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-5">
            <h2 class="text-sm font-semibold">{{ t("ai.apiCurl") }}</h2>
            <div class="mt-3 flex items-start gap-2">
              <pre class="min-w-0 flex-1 overflow-x-auto rounded-box bg-base-200 p-3 font-mono text-xs"><code>{{ curlExample }}</code></pre>
              <button class="btn btn-ghost btn-sm shrink-0" @click="copyText(curlExample)">
                <IconCopy class="h-4 w-4" />
                {{ t("ai.copy") }}
              </button>
            </div>
          </div>
        </div>

        <!-- Playground -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-5">
            <h2 class="text-sm font-semibold">{{ t("ai.apiPlayground") }}</h2>
            <p class="mt-1 text-xs text-base-content/50">{{ t("ai.apiPlaygroundHint") }}</p>

            <div class="mt-4 space-y-3">
              <div>
                <label class="mb-1 block text-xs text-base-content/60" for="pc-model">
                  {{ t("ai.apiModel") }}
                </label>
                <input
                  id="pc-model"
                  v-model="playground.model"
                  list="pc-model-suggestions"
                  class="input input-bordered input-sm w-full font-mono"
                  :placeholder="t('ai.apiModelPlaceholder')"
                />
                <datalist id="pc-model-suggestions">
                  <option v-for="suggestion in modelSuggestions" :key="suggestion" :value="suggestion" />
                </datalist>
              </div>

              <div>
                <label class="mb-1 block text-xs text-base-content/60" for="pc-message">
                  {{ t("ai.apiMessage") }}
                </label>
                <textarea
                  id="pc-message"
                  v-model="playground.message"
                  rows="3"
                  class="textarea textarea-bordered textarea-sm w-full"
                  :placeholder="t('ai.apiMessagePlaceholder')"
                />
              </div>

              <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label class="flex cursor-pointer items-center gap-2 text-sm">
                  <input v-model="playground.authMode" type="radio" value="account" class="radio radio-sm" />
                  {{ t("ai.apiAuthAccount") }}
                </label>
                <label class="flex cursor-pointer items-center gap-2 text-sm">
                  <input v-model="playground.authMode" type="radio" value="credential" class="radio radio-sm" />
                  {{ t("ai.apiAuthCredential") }}
                </label>
                <input
                  v-if="playground.authMode === 'credential'"
                  v-model="playground.credentialToken"
                  type="text"
                  class="input input-bordered input-sm w-64 font-mono"
                  :placeholder="t('ai.apiCredentialToken')"
                />
              </div>

              <button
                class="btn btn-primary btn-sm"
                :disabled="sending || !playground.message.trim() || !playground.model.trim()"
                @click="sendTest"
              >
                <span v-if="sending" class="loading loading-spinner loading-xs" />
                {{ sending ? t("ai.apiSending") : t("ai.apiSend") }}
              </button>

              <div v-if="apiResponse !== null">
                <div class="mb-1 text-xs text-base-content/60">{{ t("ai.apiResponse") }}</div>
                <pre class="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-box bg-base-200 p-3 font-mono text-xs">{{ apiResponse }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create credential drawer -->
      <AdminDrawer :open="createOpen" :title="t('ai.createCredential')" @update:open="createOpen = $event">
        <form class="space-y-4" @submit.prevent="submitCreate">
          <div>
            <label class="mb-1 block text-sm font-medium" for="cred-name">
              {{ t("ai.createForm.name") }}
            </label>
            <input
              id="cred-name"
              v-model="createForm.name"
              type="text"
              required
              maxlength="128"
              class="input input-bordered input-sm w-full"
              :placeholder="t('ai.createForm.namePlaceholder')"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-sm font-medium" for="cred-limit">
                {{ t("ai.createForm.usageLimit") }}
              </label>
              <input
                id="cred-limit"
                v-model="createForm.usageLimit"
                type="text"
                required
                inputmode="decimal"
                class="input input-bordered input-sm w-full"
                :placeholder="t('ai.createForm.usageLimitPlaceholder')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium" for="cred-currency">
                {{ t("ai.createForm.usageCurrency") }}
              </label>
              <input
                id="cred-currency"
                v-model="createForm.usageCurrency"
                type="text"
                class="input input-bordered input-sm w-full"
                placeholder="golds"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium" for="cred-agents">
              {{ t("ai.createForm.agentIds") }}
            </label>
            <input
              id="cred-agents"
              v-model="createForm.agentIds"
              type="text"
              class="input input-bordered input-sm w-full"
              placeholder="assistant"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium" for="cred-providers">
              {{ t("ai.createForm.providers") }}
            </label>
            <input
              id="cred-providers"
              v-model="createForm.providers"
              type="text"
              class="input input-bordered input-sm w-full"
              placeholder="openai"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium" for="cred-models">
              {{ t("ai.createForm.models") }}
            </label>
            <input
              id="cred-models"
              v-model="createForm.models"
              type="text"
              class="input input-bordered input-sm w-full"
              placeholder="openai/gpt-4.1-mini"
            />
          </div>

          <div class="pt-2">
            <button class="btn btn-primary w-full" :disabled="creating">
              <span v-if="creating" class="loading loading-spinner loading-xs" />
              {{ creating ? t("ai.creating") : t("ai.create") }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconBrain,
  IconBot,
  IconCheck,
  IconCoins,
  IconCopy,
  IconCpu,
  IconCreditCard,
  IconGauge,
  IconKeyRound,
  IconPlus,
  IconShieldAlert,
  IconTerminal,
  IconTrash2,
  IconX,
} from "#components";
import {
  createPersonalityCredential,
  fetchPersonalityAgents,
  fetchPersonalityBilling,
  fetchPersonalityCredentials,
  fetchPersonalityModels,
  personalityChatCompletion,
  revokePersonalityCredential,
  setPersonalitySpendingQuota,
  settlePersonalityBilling,
  PERSONALITY_API_BASE,
  PERSONALITY_CHAT_COMPLETIONS,
  type PersonalityAgent,
  type PersonalityBilling,
  type PersonalityCredential,
  type PersonalityModel,
  type PersonalityRunUsage,
} from "~/utils/personality";
import { API_BASE_URL } from "~/utils/api";

definePageMeta({ middleware: "auth" });

const { t, te } = useI18n();
const toast = useNuxtApp().$toast;

type TabId = "overview" | "credentials" | "billing";

const tabs = [
  { id: "overview" as const, icon: IconGauge, labelKey: "ai.tabOverview" },
  { id: "credentials" as const, icon: IconKeyRound, labelKey: "ai.tabCredentials" },
  { id: "billing" as const, icon: IconCreditCard, labelKey: "ai.tabBilling" },
  { id: "api" as const, icon: IconTerminal, labelKey: "ai.tabApi" },
];

const activeTab = ref<TabId>("overview");

// ── Overview ───────────────────────────────────────────────
const overviewLoading = ref(true);
const billing = ref<PersonalityBilling | null>(null);
const agents = ref<PersonalityAgent[]>([]);
const models = ref<PersonalityModel[]>([]);

const hourlyCurrencyUsage = computed(() => billing.value?.usage?.hourlyUsage ?? {});
const dailyCurrencyUsage = computed(() => billing.value?.usage?.dailyUsage ?? {});

function limitLabel(limit: number | null | undefined): string {
  if (limit === null || limit === undefined || limit === 0) {
    return t("ai.unlimited");
  }
  return String(limit);
}

function quotaLabel(quota: string | null): string {
  if (quota === null) return t("ai.unlimited");
  const value = parseFloat(quota);
  if (!Number.isFinite(value) || value === 0) return t("ai.unlimited");
  return quota;
}

function runsLabel(usage: PersonalityRunUsage): string {
  if (usage.max === null || usage.max === undefined) {
    return t("ai.runsUnlimited", { used: usage.used });
  }
  return t("ai.runsUsed", { used: usage.used, max: usage.max });
}

function currencyLabel(currency: string): string {
  const key = `ai.currencies.${currency.trim().toLowerCase()}`;
  return te(key) ? t(key) : currency;
}

function modelPricing(model: PersonalityModel) {
  const pricing = model.pricing;
  if (!pricing) return null;
  if (pricing.input == null && pricing.output == null) return null;
  return pricing;
}

function pricingLabel(model: PersonalityModel, output = false): string {
  const pricing = modelPricing(model);
  if (!pricing) return t("ai.free");
  const amount = output ? pricing.output : pricing.input;
  return t("ai.perMillion", {
    amount: amount ?? "0",
    currency: currencyLabel(pricing.currency || "—"),
  });
}

// ── Credentials ────────────────────────────────────────────
const credentialsLoading = ref(true);
const credentials = ref<PersonalityCredential[]>([]);
const freshToken = ref<string | null>(null);
const createOpen = ref(false);
const creating = ref(false);
const revokingId = ref<string | null>(null);

const createForm = reactive({
  name: "",
  usageLimit: "",
  usageCurrency: "golds",
  agentIds: "",
  providers: "",
  models: "",
});

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function usagePercent(credential: PersonalityCredential): number {
  const used = parseFloat(credential.usageUsed);
  const limit = parseFloat(credential.usageLimit);
  if (!Number.isFinite(used)) return 0;
  if (!Number.isFinite(limit) || limit === 0) return used > 0 ? 100 : 0;
  return Math.round((used / limit) * 100);
}

function openCreate() {
  createForm.name = "";
  createForm.usageLimit = "";
  createForm.usageCurrency = "golds";
  createForm.agentIds = "";
  createForm.providers = "";
  createForm.models = "";
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.name.trim()) return;
  creating.value = true;
  try {
    const result = await createPersonalityCredential({
      name: createForm.name.trim(),
      usageLimit: createForm.usageLimit.trim() || "0",
      usageCurrency: createForm.usageCurrency.trim() || undefined,
      agentIds: splitList(createForm.agentIds),
      providers: splitList(createForm.providers),
      models: splitList(createForm.models),
    });
    createOpen.value = false;
    freshToken.value = result.token;
    await loadCredentials();
    toast.success(t("ai.created"));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    toast.error(message);
  } finally {
    creating.value = false;
  }
}

async function revokeCredential(credential: PersonalityCredential) {
  if (!(await useAlert().confirm('Confirm', t("ai.revokeConfirm", { name: credential.name })))) return;
  revokingId.value = credential.id;
  try {
    await revokePersonalityCredential(credential.id);
    credentials.value = credentials.value.filter((item) => item.id !== credential.id);
    toast.success(t("ai.revoked"));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    toast.error(message);
  } finally {
    revokingId.value = null;
  }
}

async function copyToken() {
  if (!freshToken.value) return;
  try {
    await navigator.clipboard.writeText(freshToken.value);
    toast.success(t("ai.tokenCopied"));
  } catch {
    toast.error(t("ai.copyFailed"));
  }
}

function dismissToken() {
  freshToken.value = null;
}

// ── Billing ────────────────────────────────────────────────
const billingLoading = ref(true);
const savingQuota = ref(false);
const settling = ref(false);
const quotaInput = ref("");

async function saveQuota() {
  savingQuota.value = true;
  try {
    billing.value = await setPersonalitySpendingQuota(quotaInput.value.trim() || "0");
    toast.success(t("ai.quotaSaved"));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    toast.error(message);
  } finally {
    savingQuota.value = false;
  }
}

async function settleNow() {
  settling.value = true;
  try {
    await settlePersonalityBilling();
    toast.success(t("ai.settled"));
    await loadBillingCard();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    toast.error(message);
  } finally {
    settling.value = false;
  }
}

// ── API tab ───────────────────────────────────────────────
const chatCompletionsUrl = `${API_BASE_URL}${PERSONALITY_CHAT_COMPLETIONS}`;
const apiBaseUrl = `${API_BASE_URL}${PERSONALITY_API_BASE}`;
const curlExample = `curl -X POST ${chatCompletionsUrl} \\
  -H "Authorization: Bearer sat_..." \\
  -H "Content-Type: application/json" \\
  -d '{"model":"assistant","messages":[{"role":"user","content":"Hello"}]}'`;

const playground = reactive({
  model: "",
  message: "",
  authMode: "account",
  credentialToken: "",
});
const sending = ref(false);
const apiResponse = ref<string | null>(null);

const modelSuggestions = computed(() => {
  const out: string[] = [];
  for (const agent of agents.value) out.push(agent.id);
  for (const agent of agents.value) {
    for (const model of models.value) out.push(`${agent.id}/${model.id}`);
  }
  for (const model of models.value) out.push(`raw/${model.id}`);
  return out;
});

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t("ai.tokenCopied"));
  } catch {
    toast.error(t("ai.copyFailed"));
  }
}

async function sendTest() {
  const model = playground.model.trim();
  const message = playground.message.trim();
  if (!model || !message || sending.value) return;
  sending.value = true;
  apiResponse.value = null;
  try {
    const result = await personalityChatCompletion({
      model,
      messages: [{ role: "user", content: message }],
      bearerToken:
        playground.authMode === "credential"
          ? playground.credentialToken.trim() || undefined
          : undefined,
    });
    apiResponse.value =
      result.content || JSON.stringify(result.raw, null, 2) || t("ai.apiEmptyResponse");
  } catch (e: unknown) {
    apiResponse.value = e instanceof Error ? e.message : String(e);
  } finally {
    sending.value = false;
  }
}

// ── Loaders ────────────────────────────────────────────────
async function loadOverview() {
  overviewLoading.value = true;
  try {
    const [billingResult, agentsResult, modelsResult] = await Promise.all([
      fetchPersonalityBilling(),
      fetchPersonalityAgents(),
      fetchPersonalityModels(),
    ]);
    billing.value = billingResult;
    agents.value = agentsResult;
    models.value = modelsResult;
    if (!playground.model && agentsResult.length > 0) {
      playground.model = agentsResult[0].id;
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    toast.error(message);
  } finally {
    overviewLoading.value = false;
  }
}

async function loadBilling() {
  billingLoading.value = true;
  try {
    billing.value = await fetchPersonalityBilling();
    quotaInput.value = billing.value.spendingQuota ?? "";
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    toast.error(message);
  } finally {
    billingLoading.value = false;
  }
}

async function loadBillingCard() {
  try {
    billing.value = await fetchPersonalityBilling();
    quotaInput.value = billing.value.spendingQuota ?? "";
  } catch {
    // Non-fatal: overview keeps its last known value.
  }
}

async function loadCredentials() {
  credentialsLoading.value = true;
  try {
    credentials.value = await fetchPersonalityCredentials();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    toast.error(message);
  } finally {
    credentialsLoading.value = false;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

onMounted(async () => {
  await Promise.all([loadOverview(), loadBilling(), loadCredentials()]);
});
</script>
