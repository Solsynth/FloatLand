<template>
  <NuxtLayout name="admin">
    <AdminPageHeader title="Emails" description="Send and schedule HTML emails to accounts" />

    <TabsRoot v-model="activeTab" default-value="compose">
      <TabsList class="mb-6 flex gap-1 overflow-x-auto rounded-box bg-base-200 p-1">
        <TabsTrigger
          value="compose"
          class="flex shrink-0 items-center gap-2 rounded-box px-4 py-2 text-sm font-medium text-base-content/60 transition-colors hover:text-base-content data-[state=active]:bg-base-100 data-[state=active]:text-primary"
        >
          <IconSend class="w-4 h-4" />
          Compose
        </TabsTrigger>
        <TabsTrigger
          value="plans"
          class="flex shrink-0 items-center gap-2 rounded-box px-4 py-2 text-sm font-medium text-base-content/60 transition-colors hover:text-base-content data-[state=active]:bg-base-100 data-[state=active]:text-primary"
          @click="loadPlans"
        >
          <IconCalendarClock class="w-4 h-4" />
          Sending Plans
        </TabsTrigger>
        <TabsTrigger
          value="export"
          class="flex shrink-0 items-center gap-2 rounded-box px-4 py-2 text-sm font-medium text-base-content/60 transition-colors hover:text-base-content data-[state=active]:bg-base-100 data-[state=active]:text-primary"
        >
          <IconDownload class="w-4 h-4" />
          Export
        </TabsTrigger>
        <TabsTrigger
          value="observability"
          class="flex shrink-0 items-center gap-2 rounded-box px-4 py-2 text-sm font-medium text-base-content/60 transition-colors hover:text-base-content data-[state=active]:bg-base-100 data-[state=active]:text-primary"
        >
          <IconActivity class="w-4 h-4" />
          Observability
        </TabsTrigger>
      </TabsList>

      <!-- Compose Tab: Immediate Send -->
      <TabsContent value="compose">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <AdminCard title="Compose Email">
              <form class="space-y-4" @submit.prevent="handleSendEmail">
                <!-- Targeting -->
                <div>
                  <label class="label label-text text-sm font-medium">Target Mode</label>
                  <div class="flex gap-2 rounded-box bg-base-200 p-1">
                    <button
                      type="button"
                      class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      :class="targetMode === 'accounts' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="targetMode = 'accounts'"
                    >
                      Specific Accounts
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      :class="targetMode === 'broadcast' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="targetMode = 'broadcast'"
                    >
                      Broadcast All
                    </button>
                  </div>
                </div>

                <div v-if="targetMode === 'accounts'">
                  <label class="label label-text text-sm font-medium">Target Accounts</label>
                  <div v-if="selectedAccounts.length" class="flex flex-wrap gap-1.5 mb-2">
                    <span
                      v-for="acc in selectedAccounts"
                      :key="acc.id"
                      class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary"
                    >
                      {{ acc.nick || acc.name }}
                      <button class="hover:text-error" @click="removeSelectedAccount(acc.id)">
                        <IconX class="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline w-full"
                    @click="openAccountPicker"
                  >
                    <IconUsers class="w-4 h-4" />
                    {{ selectedAccounts.length ? 'Add More Accounts' : 'Select Accounts' }}
                  </button>
                </div>

                <!-- Compose Mode Toggle -->
                <div>
                  <label class="label label-text text-sm font-medium">Compose Mode</label>
                  <div class="flex gap-2 rounded-box bg-base-200 p-1">
                    <button
                      type="button"
                      class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      :class="composeMode === 'template' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="composeMode = 'template'"
                    >
                      <IconLayoutTemplate class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                      Template
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      :class="composeMode === 'custom' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="composeMode = 'custom'"
                    >
                      <IconCode class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                      Custom HTML
                    </button>
                  </div>
                </div>

                <!-- Template Mode -->
                <template v-if="composeMode === 'template'">
                  <div>
                    <label class="label label-text text-sm font-medium">Email Template</label>
                    <select
                      v-model="templateState.name"
                      class="select select-sm w-full rounded-box border-0 bg-base-200"
                    >
                      <option value="" disabled>Select a template...</option>
                      <option v-for="t in availableTemplates" :key="t.name" :value="t.name">
                        {{ t.name }}
                      </option>
                    </select>
                    <p v-if="!availableTemplates.length" class="text-xs text-base-content/40 mt-1">
                      Loading templates...
                    </p>
                  </div>

                  <div v-if="templateState.name">
                    <label class="label label-text text-sm font-medium">Template Props (JSON)</label>
                    <textarea
                      v-model="templateState.propsJson"
                      class="textarea textarea-sm w-full rounded-box border-0 bg-base-200 text-sm font-mono"
                      rows="6"
                      placeholder='{ "userName": "John", "confirmationUrl": "https://..." }'
                    />
                    <p v-if="templatePropsError" class="text-xs text-error mt-1">
                      {{ templatePropsError }}
                    </p>
                    <p v-else class="text-xs text-base-content/40 mt-1">
                      Available props depend on the selected template
                    </p>
                  </div>

                  <button
                    type="button"
                    class="btn btn-sm btn-ghost w-full"
                    :disabled="!templateState.name || parsedTemplateProps === null"
                    @click="handlePreview"
                  >
                    <IconEye class="w-4 h-4" />
                    Preview in New Tab
                  </button>
                </template>

                <!-- Custom HTML Mode -->
                <template v-if="composeMode === 'custom'">
                  <div>
                    <label class="label label-text text-sm font-medium">HTML Body</label>
                    <textarea
                      v-model="form.htmlBody"
                      class="textarea textarea-sm w-full rounded-box border-0 bg-base-200 text-sm font-mono"
                      rows="10"
                      placeholder="<html><body>...</body></html>"
                    />
                    <p class="text-xs text-base-content/40 mt-1">Full HTML document with inline styles required</p>
                  </div>
                </template>

                <!-- Subject -->
                <div>
                  <label class="label label-text text-sm font-medium">Subject</label>
                  <input
                    v-model="form.subject"
                    type="text"
                    class="input input-sm w-full rounded-box border-0 bg-base-200"
                    placeholder="Email subject"
                  />
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-full"
                  :disabled="!canSend"
                >
                  <span v-if="isSending" class="loading loading-spinner loading-xs" />
                  <span v-else>Send Email</span>
                </button>

                <!-- Result -->
                <div v-if="result" class="rounded-box bg-success/10 p-3">
                  <p class="text-sm text-success font-medium">Delivered successfully</p>
                  <p class="text-xs text-base-content/60 mt-1">
                    Requested: {{ result.requested }} &middot; Resolved: {{ result.resolved }} &middot; Sent: {{ result.sent }} &middot; Skipped: {{ result.skipped }}
                  </p>
                </div>
              </form>
            </AdminCard>
          </div>

          <div class="space-y-6">
            <AdminCard title="About Email Delivery">
              <div class="space-y-2 text-sm text-base-content/60">
                <p>Send custom HTML emails to specific accounts or broadcast to all users.</p>
                <ul class="list-disc list-inside text-xs space-y-1 ml-2">
                  <li>Emails are delivered to verified email contacts</li>
                  <li>Accounts without verified contacts are skipped</li>
                  <li>Use templates for consistent branding or write custom HTML</li>
                  <li>For rate-limited batches, use Sending Plans instead of immediate send</li>
                </ul>
              </div>
            </AdminCard>
          </div>
        </div>
      </TabsContent>

      <!-- Export Tab -->
      <TabsContent value="export">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <AdminCard title="Export Email Contacts">
              <form class="space-y-4" @submit.prevent="handleExportEmails">
                <div>
                  <label class="label label-text text-sm font-medium">Target Mode</label>
                  <div class="flex gap-2 rounded-box bg-base-200 p-1">
                    <button
                      type="button"
                      class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      :class="exportTargetMode === 'accounts' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="exportTargetMode = 'accounts'"
                    >
                      Specific Accounts
                    </button>
                    <button
                      type="button"
                      class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      :class="exportTargetMode === 'broadcast' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                      @click="exportTargetMode = 'broadcast'"
                    >
                      All Accounts
                    </button>
                  </div>
                </div>

                <div v-if="exportTargetMode === 'accounts'">
                  <label class="label label-text text-sm font-medium">Accounts</label>
                  <div v-if="exportSelectedAccounts.length" class="flex flex-wrap gap-1.5 mb-2">
                    <span
                      v-for="acc in exportSelectedAccounts"
                      :key="acc.id"
                      class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary"
                    >
                      {{ acc.nick || acc.name }}
                      <button type="button" class="hover:text-error" @click="removeExportAccount(acc.id)">
                        <IconX class="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline w-full"
                    @click="openExportAccountPicker"
                  >
                    <IconUsers class="w-4 h-4" />
                    {{ exportSelectedAccounts.length ? 'Add More Accounts' : 'Select Accounts' }}
                  </button>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-full"
                  :disabled="isExporting || (exportTargetMode === 'accounts' && !exportSelectedAccounts.length)"
                >
                  <span v-if="isExporting" class="loading loading-spinner loading-xs" />
                  <template v-else>
                    <IconDownload class="w-4 h-4" />
                    Download CSV
                  </template>
                </button>
              </form>
            </AdminCard>
          </div>
          <div>
            <AdminCard title="CSV Format">
              <div class="space-y-2 text-sm text-base-content/60">
                <p>Exports primary (or first) email contact per account as UTF-8 CSV with BOM.</p>
                <pre class="overflow-x-auto rounded-box bg-base-200 p-3 text-xs font-mono">EmailAddr,UserName
test1@abc.com,张三
test2@abc.com,李四</pre>
                <ul class="list-disc list-inside text-xs space-y-1 ml-2">
                  <li><code class="text-xs">UserName</code> uses nick, then name</li>
                  <li>Requires <code class="text-xs">emails.send</code> permission</li>
                </ul>
              </div>
            </AdminCard>
          </div>
        </div>
      </TabsContent>

      <!-- Observability Tab (built-in delivery records) -->
      <TabsContent value="observability">
        <div class="space-y-6">
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex gap-1 rounded-box bg-base-200 p-1">
              <button
                v-for="preset in rangePresets"
                :key="preset.days"
                type="button"
                class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                :class="obsRangeDays === preset.days ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
                @click="setObsRangeDays(preset.days)"
              >
                {{ preset.label }}
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              :disabled="isLoadingObs"
              @click="loadObservability(true)"
            >
              <span v-if="isLoadingObs" class="loading loading-spinner loading-xs" />
              <IconRefreshCw v-else class="w-4 h-4" />
              Refresh
            </button>
            <p class="text-xs text-base-content/40 ml-auto">
              Built-in Ring records · last {{ obsRangeDays }} days · no OTLP required
            </p>
          </div>

          <div v-if="isLoadingObs && !observability" class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <template v-else-if="observability">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">SMTP Attempts</p>
                  <p class="text-2xl font-bold mt-1">{{ formatNumber(observability.summary.total) }}</p>
                  <p class="text-[10px] text-base-content/40 mt-1">submission attempts</p>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Successful</p>
                  <p class="text-2xl font-bold mt-1 text-success">
                    {{ formatNumber(observability.summary.successful) }}
                  </p>
                  <p class="text-[10px] text-base-content/40 mt-1">SMTP accepted</p>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Failed</p>
                  <p class="text-2xl font-bold mt-1 text-error">
                    {{ formatNumber(observability.summary.failed) }}
                  </p>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm">
                <div class="card-body p-4">
                  <p class="text-xs text-base-content/60">Success Rate</p>
                  <p
                    class="text-2xl font-bold mt-1"
                    :class="getSuccessRateClass(observability.summary.successRate)"
                  >
                    {{ formatSuccessRate(observability.summary.successRate) }}
                  </p>
                  <p class="text-[10px] text-base-content/40 mt-1">success / (success + failure)</p>
                </div>
              </div>
            </div>

            <AdminCard title="Delivery by Source">
              <p class="text-xs text-base-content/50 mb-4">
                queue (gRPC) · sending_plan · direct
              </p>
              <div v-if="observability.bySource.length" class="space-y-4">
                <div
                  v-for="row in observability.bySource"
                  :key="row.key"
                  class="space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm font-mono">{{ row.key }}</span>
                      <span class="badge badge-xs badge-ghost">{{ formatNumber(row.total) }} total</span>
                    </div>
                    <span
                      class="text-sm font-semibold"
                      :class="getSuccessRateClass(row.successRate)"
                    >
                      {{ formatSuccessRate(row.successRate) }}
                    </span>
                  </div>
                  <div class="flex gap-1 h-2 rounded-full overflow-hidden bg-base-200">
                    <div
                      class="bg-success rounded-full transition-all"
                      :style="{ width: barWidth(row.successful, row.total) }"
                    />
                    <div
                      class="bg-error rounded-full transition-all"
                      :style="{ width: barWidth(row.failed, row.total) }"
                    />
                  </div>
                  <div class="flex flex-wrap gap-3 text-[10px] text-base-content/50">
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-success" />
                      Success: {{ formatNumber(row.successful) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-error" />
                      Failure: {{ formatNumber(row.failed) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="py-6 text-center text-base-content/40 text-sm">
                No email delivery records in this range
              </div>
            </AdminCard>

            <AdminCard title="How rates are calculated">
              <div class="space-y-2 text-sm text-base-content/60">
                <p>
                  <code class="text-xs">success_rate = success / (success + failure)</code>
                </p>
                <p>
                  Measures SMTP acceptance only — not final mailbox delivery, bounces, spam filtering,
                  or recipient engagement. Provider webhooks are out of scope for this view.
                </p>
                <p class="text-xs text-base-content/40">
                  Records exclude recipient addresses, subjects, bodies, account IDs, and credentials.
                </p>
              </div>
            </AdminCard>
          </template>

          <div v-else class="card bg-base-100 shadow-sm">
            <div class="card-body py-12 text-center">
              <IconActivity class="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p class="text-sm text-base-content/40">No observability data available</p>
              <p class="text-xs text-base-content/30 mt-1">Metrics will appear once emails are sent</p>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- Plans Tab: Scheduled Sending -->
      <TabsContent value="plans">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <select
              v-model="planFilter.status"
              class="select select-sm w-36 rounded-box border-0 bg-base-200"
              @change="reloadPlans"
            >
              <option :value="undefined">All Status</option>
              <option :value="0">Scheduled</option>
              <option :value="1">Paused</option>
              <option :value="2">Completed</option>
            </select>
          </div>
          <button class="btn btn-sm btn-primary" @click="planDrawerOpen = true">
            <IconPlus class="w-3.5 h-3.5" />
            Create Plan
          </button>
        </div>

        <!-- Loading -->
        <div v-if="plansLoading" class="flex justify-center py-16">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <!-- Plans List -->
        <AdminCard v-else no-padding>
          <div class="overflow-x-auto">
            <table class="table table-sm table-zebra">
              <thead>
                <tr class="text-xs text-base-content/50 uppercase tracking-wider">
                  <th class="pl-5">Key / Subject</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Schedule</th>
                  <th class="pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="plans.length === 0">
                  <td colspan="5" class="text-center py-12 text-base-content/40 text-sm">
                    No email plans yet. Create one to get started.
                  </td>
                </tr>
                <tr
                  v-for="plan in plans"
                  :key="plan.id"
                  class="hover:bg-base-200/50 transition-colors"
                >
                  <td class="pl-5">
                    <p class="text-sm font-medium truncate max-w-[220px]">{{ plan.subject }}</p>
                    <p v-if="plan.sendingPlanKey" class="text-xs text-base-content/40 font-mono">
                      {{ plan.sendingPlanKey }}
                    </p>
                  </td>
                  <td>
                    <span class="badge badge-xs" :class="planStatusClass(plan.status)">
                      {{ planStatusLabel(plan.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-1.5 text-xs">
                      <span class="text-base-content/70">R: {{ plan.recipientCount }}</span>
                      <span v-if="plan.counts.sent" class="text-success">{{ plan.counts.sent }}</span>
                      <span v-if="plan.counts.skipped" class="text-warning">{{ plan.counts.skipped }}</span>
                      <span v-if="plan.counts.failed" class="text-error">{{ plan.counts.failed }}</span>
                      <span class="text-base-content/40">/ {{ plan.counts.total }}</span>
                    </div>
                    <!-- Progress bar -->
                    <div class="mt-1 w-full h-1 bg-base-200 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="planStatusBarClass(plan)"
                        :style="{ width: planProgressPercent(plan) + '%' }"
                      />
                    </div>
                  </td>
                  <td>
                    <div class="text-xs text-base-content/60">
                      <p v-if="plan.plannedStartAt">
                        Start: {{ formatDate(plan.plannedStartAt) }}
                      </p>
                      <p v-if="plan.nextIntervalAt">
                        Next: {{ formatDate(plan.nextIntervalAt) }}
                      </p>
                      <p class="text-base-content/40">
                        {{ plan.maxEmailsPerInterval }} / {{ plan.intervalMinutes }}m &middot;
                        {{ plan.maxEmailsPerDay }}/day
                      </p>
                    </div>
                  </td>
                  <td class="pr-5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        v-if="plan.status === 0"
                        class="btn btn-ghost btn-xs text-warning"
                        title="Pause"
                        @click="handlePausePlan(plan.id)"
                      >
                        <IconPause class="w-3.5 h-3.5" />
                      </button>
                      <button
                        v-if="plan.status === 1"
                        class="btn btn-ghost btn-xs text-success"
                        title="Resume"
                        @click="handleResumePlan(plan.id)"
                      >
                        <IconPlay class="w-3.5 h-3.5" />
                      </button>
                      <button
                        v-if="plan.status !== 2"
                        class="btn btn-ghost btn-xs"
                        title="Advance one interval"
                        @click="handleAdvancePlan(plan.id)"
                      >
                        <IconSkipForward class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            v-if="planTotal > 0"
            class="flex items-center justify-between px-5 py-3"
          >
            <span class="text-xs text-base-content/40">
              Showing {{ planOffset + 1 }}–{{ Math.min(planOffset + planPageSize, planTotal) }} of {{ planTotal }}
            </span>
            <div class="flex gap-1">
              <button
                class="btn btn-ghost btn-xs"
                :disabled="planOffset === 0"
                @click="planOffset = Math.max(0, planOffset - planPageSize); loadPlans()"
              >
                <IconChevronLeft class="w-3.5 h-3.5" />
              </button>
              <button
                class="btn btn-ghost btn-xs"
                :disabled="planOffset + planPageSize >= planTotal"
                @click="planOffset += planPageSize; loadPlans()"
              >
                <IconChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </AdminCard>
      </TabsContent>
    </TabsRoot>

    <!-- Account Picker Drawer -->
    <AccountPickerDrawer
      :open="pickerOpen"
      :allow-multiple="true"
      title="Select Target Accounts"
      placeholder="Search by name or nick..."
      @select="picker.handleSelect"
      @update:open="pickerOpen = $event"
    />

    <!-- Create Plan Drawer -->
    <AdminDrawer
      :open="planDrawerOpen"
      title="Create Sending Plan"
      @update:open="planDrawerOpen = $event"
    >
      <form class="space-y-4" @submit.prevent="handleCreatePlan">
        <!-- Targeting -->
        <div>
          <label class="label label-text text-sm font-medium">Target Mode</label>
          <div class="flex gap-2 rounded-xl bg-base-200/70 p-1">
            <button
              type="button"
              class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              :class="planTargetMode === 'accounts' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
              @click="planTargetMode = 'accounts'"
            >
              Specific Accounts
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              :class="planTargetMode === 'broadcast' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
              @click="planTargetMode = 'broadcast'"
            >
              Broadcast All
            </button>
          </div>
        </div>

        <div v-if="planTargetMode === 'accounts'">
          <label class="label label-text text-sm font-medium">Target Accounts</label>
          <div v-if="planSelectedAccounts.length" class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-for="acc in planSelectedAccounts"
              :key="acc.id"
              class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary"
            >
              {{ acc.nick || acc.name }}
              <button class="hover:text-error" @click="removePlanSelectedAccount(acc.id)">
                <IconX class="w-3 h-3" />
              </button>
            </span>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline w-full"
            @click="openPlanAccountPicker"
          >
            <IconUsers class="w-4 h-4" />
            {{ planSelectedAccounts.length ? 'Add More Accounts' : 'Select Accounts' }}
          </button>
        </div>

        <!-- Compose Mode -->
        <div>
          <label class="label label-text text-sm font-medium">Compose Mode</label>
          <div class="flex gap-2 rounded-xl bg-base-200/70 p-1">
            <button
              type="button"
              class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              :class="planComposeMode === 'template' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
              @click="planComposeMode = 'template'"
            >
              <IconLayoutTemplate class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
              Template
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              :class="planComposeMode === 'custom' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/50'"
              @click="planComposeMode = 'custom'"
            >
              <IconCode class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
              Custom HTML
            </button>
          </div>
        </div>

        <!-- Template Mode (Plan) -->
        <template v-if="planComposeMode === 'template'">
          <div>
            <label class="label label-text text-sm font-medium">Email Template</label>
            <select
              v-model="planTemplateState.name"
              class="select select-sm w-full bg-base-200/60 border-0 rounded-xl"
            >
              <option value="" disabled>Select a template...</option>
              <option v-for="t in availableTemplates" :key="t.name" :value="t.name">
                {{ t.name }}
              </option>
            </select>
          </div>
          <div v-if="planTemplateState.name">
            <label class="label label-text text-sm font-medium">Template Props (JSON)</label>
            <textarea
              v-model="planTemplateState.propsJson"
              class="textarea textarea-sm w-full text-sm font-mono bg-base-200/60 border-0 rounded-xl"
              rows="5"
              placeholder='{ "userName": "John" }'
            />
          </div>
        </template>

        <!-- Custom HTML Mode (Plan) -->
        <template v-if="planComposeMode === 'custom'">
          <div>
            <label class="label label-text text-sm font-medium">HTML Body</label>
            <textarea
              v-model="planForm.htmlBody"
              class="textarea textarea-sm w-full text-sm font-mono bg-base-200/60 border-0 rounded-xl"
              rows="8"
              placeholder="<html><body>...</body></html>"
            />
          </div>
        </template>

        <div>
          <label class="label label-text text-sm font-medium">Subject</label>
          <input
            v-model="planForm.subject"
            type="text"
            class="input input-sm w-full bg-base-200/60 border-0 rounded-xl"
            placeholder="Email subject"
          />
        </div>

        <div>
          <label class="label label-text text-sm font-medium">Sending Plan Key</label>
          <input
            v-model="planForm.sendingPlanKey"
            type="text"
            class="input input-sm w-full bg-base-200/60 border-0 rounded-xl"
            placeholder="Optional campaign key (e.g. summer-2026)"
          />
        </div>

        <!-- Scheduling -->
        <fieldset class="rounded-xl border border-base-300/30 p-4 space-y-3">
          <legend class="text-xs font-semibold text-base-content/60 px-1">Scheduling</legend>

          <div>
            <label class="label label-text text-sm font-medium">Planned Start At</label>
            <input
              v-model="planForm.plannedStartAt"
              type="datetime-local"
              class="input input-sm w-full bg-base-200/60 border-0 rounded-xl"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="label label-text text-xs font-medium">Emails / Interval</label>
              <input
                v-model.number="planForm.maxEmailsPerInterval"
                type="number"
                min="1"
                class="input input-sm w-full bg-base-200/60 border-0 rounded-xl"
              />
            </div>
            <div>
              <label class="label label-text text-xs font-medium">Interval (min)</label>
              <input
                v-model.number="planForm.intervalMinutes"
                type="number"
                min="1"
                class="input input-sm w-full bg-base-200/60 border-0 rounded-xl"
              />
            </div>
            <div>
              <label class="label label-text text-xs font-medium">Daily Limit</label>
              <input
                v-model.number="planForm.maxEmailsPerDay"
                type="number"
                min="1"
                class="input input-sm w-full bg-base-200/60 border-0 rounded-xl"
              />
            </div>
          </div>
        </fieldset>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm flex-1"
            @click="planDrawerOpen = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary btn-sm flex-1"
            :disabled="!canCreatePlan || planCreating"
          >
            <span v-if="planCreating" class="loading loading-spinner loading-xs" />
            <span v-else>Create Plan</span>
          </button>
        </div>
      </form>
    </AdminDrawer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  IconUsers,
  IconX,
  IconEye,
  IconCode,
  IconLayoutTemplate,
  IconSend,
  IconCalendarClock,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconPause,
  IconPlay,
  IconSkipForward,
  IconDownload,
  IconActivity,
  IconRefreshCw,
} from '#components'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from 'reka-ui'
import {
  sendAdminEmails,
  exportAccountEmailsCsv,
  createEmailPlan,
  fetchEmailPlans,
  pauseEmailPlan,
  resumeEmailPlan,
  advanceEmailPlan,
  fetchEmailDeliveryObservability,
} from '~/utils/admin'
import { useAccountPicker } from '~/composables/useAccountPicker'
import AccountPickerDrawer from '~/components/shared/AccountPickerDrawer.vue'
import type {
  BulkDeliveryResult,
  EmailDeliveryOverview,
  EmailPayload,
  EmailPlan,
  EmailPlanCreatePayload,
} from '~/types/admin'
import type { SnAccount } from '~/types/auth'

definePageMeta({ middleware: 'auth' })

// ============ Tab State ============
const activeTab = ref('compose')

// ============ Observability ============
const isLoadingObs = ref(false)
const observability = ref<EmailDeliveryOverview | null>(null)
const obsRangeDays = ref(30)
const rangePresets = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
] as const

function setObsRangeDays(days: number) {
  if (obsRangeDays.value === days) return
  obsRangeDays.value = days
  loadObservability(true)
}

function obsFromInstant(): string {
  const ms = Date.now() - obsRangeDays.value * 24 * 60 * 60 * 1000
  return new Date(ms).toISOString()
}

let obsLoadSeq = 0

async function loadObservability(force = false) {
  if (!force && observability.value) return
  const seq = ++obsLoadSeq
  isLoadingObs.value = true
  try {
    const data = await fetchEmailDeliveryObservability({
      from: obsFromInstant(),
    })
    if (seq !== obsLoadSeq) return
    observability.value = data
  } catch {
    if (seq !== obsLoadSeq) return
    useNuxtApp().$toast.error('Failed to load observability data')
  } finally {
    if (seq === obsLoadSeq) {
      isLoadingObs.value = false
    }
  }
}

watch(activeTab, (tab) => {
  if (tab === 'observability') {
    loadObservability()
  }
})

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatSuccessRate(rate: number | null | undefined): string {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(1)}%`
}

function getSuccessRateClass(rate: number | null | undefined): string {
  if (rate == null) return 'text-base-content/40'
  if (rate >= 0.95) return 'text-success'
  if (rate >= 0.8) return 'text-warning'
  return 'text-error'
}

function barWidth(part: number, total: number): string {
  if (!total || part <= 0) return '0%'
  return `${(part / total) * 100}%`
}

// ============ Compose State ============
const isSending = ref(false)
const targetMode = ref<'accounts' | 'broadcast'>('accounts')
const composeMode = ref<'template' | 'custom'>('template')
const result = ref<BulkDeliveryResult | null>(null)
const selectedAccounts = ref<SnAccount[]>([])
const availableTemplates = ref<{ name: string; path: string }[]>([])
const templatePropsError = ref('')

// Export
const isExporting = ref(false)
const exportTargetMode = ref<'accounts' | 'broadcast'>('accounts')
const exportSelectedAccounts = ref<SnAccount[]>([])

const picker = useAccountPicker()
const pickerOpen = computed({
  get: () => picker.isOpen.value,
  set: (val: boolean) => { picker.isOpen.value = val },
})

const form = ref({
  subject: '',
  htmlBody: '',
})

const templateState = ref({
  name: '',
  propsJson: '{}',
})

const parsedTemplateProps = computed(() => {
  try {
    const parsed = JSON.parse(templateState.value.propsJson)
    templatePropsError.value = ''
    return parsed
  } catch (e) {
    templatePropsError.value = `Invalid JSON: ${(e as Error).message}`
    return null
  }
})

const canSend = computed(() => {
  if (!form.value.subject) return false
  if (isSending.value) return false

  if (composeMode.value === 'template') {
    if (!templateState.value.name) return false
    if (parsedTemplateProps.value === null) return false
    return true
  }

  return !!form.value.htmlBody
})

// ============ Plans State ============
const plans = ref<EmailPlan[]>([])
const plansLoading = ref(false)
const planTotal = ref(0)
const planOffset = ref(0)
const planPageSize = 50
const planFilter = ref<{ status?: number }>({ status: undefined })
const planDrawerOpen = ref(false)
const planCreating = ref(false)

const planTargetMode = ref<'accounts' | 'broadcast'>('accounts')
const planComposeMode = ref<'template' | 'custom'>('template')
const planSelectedAccounts = ref<SnAccount[]>([])

const planForm = ref({
  subject: '',
  htmlBody: '',
  sendingPlanKey: '',
  plannedStartAt: '',
  maxEmailsPerInterval: 200,
  intervalMinutes: 30,
  maxEmailsPerDay: 2000,
})

const planTemplateState = ref({
  name: '',
  propsJson: '{}',
})

const planParsedTemplateProps = computed(() => {
  try {
    return JSON.parse(planTemplateState.value.propsJson)
  } catch {
    return null
  }
})

const canCreatePlan = computed(() => {
  if (!planForm.value.subject) return false
  if (planCreating.value) return false

  if (planComposeMode.value === 'template') {
    if (!planTemplateState.value.name) return false
    if (planParsedTemplateProps.value === null) return false
    return true
  }

  return !!planForm.value.htmlBody
})

// ============ Lifecycle ============
onMounted(async () => {
  try {
    const res = await $fetch<{ templates: { name: string; path: string }[] }>('/api/email-templates')
    availableTemplates.value = res.templates
  } catch {
    // Silently fail
  }
})

// ============ Compose Methods ============
async function openAccountPicker() {
  const accounts = await picker.open({ allowMultiple: true, title: 'Select Target Accounts' })
  if (accounts && Array.isArray(accounts)) {
    for (const acc of accounts) {
      if (!selectedAccounts.value.find(a => a.id === acc.id)) {
        selectedAccounts.value.push(acc)
      }
    }
  }
}

function removeSelectedAccount(id: string) {
  selectedAccounts.value = selectedAccounts.value.filter(a => a.id !== id)
}

async function openExportAccountPicker() {
  const accounts = await picker.open({ allowMultiple: true, title: 'Select Accounts to Export' })
  if (accounts && Array.isArray(accounts)) {
    for (const acc of accounts) {
      if (!exportSelectedAccounts.value.find(a => a.id === acc.id)) {
        exportSelectedAccounts.value.push(acc)
      }
    }
  }
}

function removeExportAccount(id: string) {
  exportSelectedAccounts.value = exportSelectedAccounts.value.filter(a => a.id !== id)
}

async function handleExportEmails() {
  isExporting.value = true
  try {
    const blob = await exportAccountEmailsCsv({
      broadcastToAll: exportTargetMode.value === 'broadcast',
      accountIds: exportTargetMode.value === 'accounts'
        ? exportSelectedAccounts.value.map(a => a.id)
        : undefined,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `account-email-contacts-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    useNuxtApp().$toast.success('Email contacts exported')
  } catch {
    useNuxtApp().$toast.error('Failed to export email contacts')
  } finally {
    isExporting.value = false
  }
}

function handlePreview() {
  if (!templateState.value.name || parsedTemplateProps.value === null) return

  const params = new URLSearchParams({
    name: templateState.value.name,
    ...Object.fromEntries(
      Object.entries(parsedTemplateProps.value).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]),
    ),
  })

  window.open(`/api/emails/debug?${params.toString()}`, '_blank')
}

async function handleSendEmail() {
  isSending.value = true
  result.value = null

  const accountIds = targetMode.value === 'accounts'
    ? selectedAccounts.value.map(a => a.id)
    : undefined

  let htmlBody = form.value.htmlBody

  if (composeMode.value === 'template' && templateState.value.name) {
    try {
      const res = await $fetch<{ html: string }>('/api/email-templates/render', {
        method: 'POST',
        body: {
          name: templateState.value.name,
          props: parsedTemplateProps.value ?? {},
          pretty: false,
        },
      })
      htmlBody = res.html
    } catch {
      useNuxtApp().$toast.error('Failed to render email template')
      isSending.value = false
      return
    }
  }

  const payload: EmailPayload = {
    subject: form.value.subject,
    htmlBody,
    broadcastToAll: targetMode.value === 'broadcast',
    accountIds: targetMode.value === 'accounts' ? accountIds : undefined,
  }

  try {
    result.value = await sendAdminEmails(payload)
    if (result.value.sent > 0) {
      selectedAccounts.value = []
    }
  } catch {
    useNuxtApp().$toast.error('Failed to send emails')
  } finally {
    isSending.value = false
  }
}

// ============ Plans Methods ============
async function loadPlans() {
  plansLoading.value = true
  try {
    const result = await fetchEmailPlans({
      take: planPageSize,
      offset: planOffset.value,
      status: planFilter.value.status,
    })
    plans.value = result.plans
    planTotal.value = result.total
  } catch {
    useNuxtApp().$toast.error('Failed to load email plans')
  } finally {
    plansLoading.value = false
  }
}

function reloadPlans() {
  planOffset.value = 0
  loadPlans()
}

function planStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'Scheduled'
    case 1: return 'Paused'
    case 2: return 'Completed'
    default: return 'Unknown'
  }
}

function planStatusClass(status: number): string {
  switch (status) {
    case 0: return 'badge-success'
    case 1: return 'badge-warning'
    case 2: return 'badge-ghost'
    default: return 'badge-outline'
  }
}

function planStatusBarClass(plan: EmailPlan): string {
  if (plan.status === 1) return 'bg-warning'
  if (plan.counts.failed > 0) return 'bg-error'
  return 'bg-success'
}

function planProgressPercent(plan: EmailPlan): number {
  if (!plan.counts.total) return 0
  const done = plan.counts.sent + plan.counts.skipped + plan.counts.failed
  return Math.round((done / plan.counts.total) * 100)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

async function openPlanAccountPicker() {
  const accounts = await picker.open({ allowMultiple: true, title: 'Select Target Accounts' })
  if (accounts && Array.isArray(accounts)) {
    for (const acc of accounts) {
      if (!planSelectedAccounts.value.find(a => a.id === acc.id)) {
        planSelectedAccounts.value.push(acc)
      }
    }
  }
}

function removePlanSelectedAccount(id: string) {
  planSelectedAccounts.value = planSelectedAccounts.value.filter(a => a.id !== id)
}

async function handleCreatePlan() {
  planCreating.value = true

  let htmlBody = planForm.value.htmlBody

  if (planComposeMode.value === 'template' && planTemplateState.value.name) {
    try {
      const res = await $fetch<{ html: string }>('/api/email-templates/render', {
        method: 'POST',
        body: {
          name: planTemplateState.value.name,
          props: planParsedTemplateProps.value ?? {},
          pretty: false,
        },
      })
      htmlBody = res.html
    } catch {
      useNuxtApp().$toast.error('Failed to render email template')
      planCreating.value = false
      return
    }
  }

  const payload: EmailPlanCreatePayload = {
    subject: planForm.value.subject,
    htmlBody,
    broadcastToAll: planTargetMode.value === 'broadcast',
    accountIds: planTargetMode.value === 'accounts'
      ? planSelectedAccounts.value.map(a => a.id)
      : undefined,
    sendingPlanKey: planForm.value.sendingPlanKey || undefined,
    plannedStartAt: planForm.value.plannedStartAt ? new Date(planForm.value.plannedStartAt).toISOString() : undefined,
    maxEmailsPerInterval: planForm.value.maxEmailsPerInterval || undefined,
    intervalMinutes: planForm.value.intervalMinutes || undefined,
    maxEmailsPerDay: planForm.value.maxEmailsPerDay || undefined,
  }

  try {
    await createEmailPlan(payload)
    useNuxtApp().$toast.success('Email plan created')
    planDrawerOpen.value = false
    resetPlanForm()
    reloadPlans()
  } catch {
    useNuxtApp().$toast.error('Failed to create email plan')
  } finally {
    planCreating.value = false
  }
}

function resetPlanForm() {
  planForm.value = {
    subject: '',
    htmlBody: '',
    sendingPlanKey: '',
    plannedStartAt: '',
    maxEmailsPerInterval: 200,
    intervalMinutes: 30,
    maxEmailsPerDay: 2000,
  }
  planTemplateState.value = { name: '', propsJson: '{}' }
  planSelectedAccounts.value = []
  planTargetMode.value = 'accounts'
  planComposeMode.value = 'template'
}

async function handlePausePlan(planId: string) {
  try {
    await pauseEmailPlan(planId)
    useNuxtApp().$toast.success('Plan paused')
    loadPlans()
  } catch {
    useNuxtApp().$toast.error('Failed to pause plan')
  }
}

async function handleResumePlan(planId: string) {
  try {
    await resumeEmailPlan(planId)
    useNuxtApp().$toast.success('Plan resumed')
    loadPlans()
  } catch {
    useNuxtApp().$toast.error('Failed to resume plan')
  }
}

async function handleAdvancePlan(planId: string) {
  try {
    await advanceEmailPlan(planId)
    useNuxtApp().$toast.success('Plan advanced')
    loadPlans()
  } catch {
    useNuxtApp().$toast.error('Failed to advance plan')
  }
}
</script>
