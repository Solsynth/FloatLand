<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-5xl">
      <!-- Back -->
      <div class="flex items-center gap-4 mb-4 -mx-4">
        <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/apps/${appId}`" class="btn btn-ghost btn-sm">
          <IconArrowLeft class="w-4 h-4" />
          {{ t('developer.apps.backToList') }}
        </NuxtLink>
      </div>

      <div v-if="isLoading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else>
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-2">
            <IconLayoutDashboard class="w-7 h-7 text-primary" />
            <h2 class="text-2xl font-bold">{{ t('developer.apps.boardWidgets.title') }}</h2>
          </div>
          <p class="text-base-content/60">{{ t('developer.apps.boardWidgets.description') }}</p>
        </div>

        <!-- Widget Definitions -->
        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="card-title text-base">{{ t('developer.apps.boardWidgets.widgetList') }}</h3>
              <button class="btn btn-primary btn-sm" @click="openCreateModal">
                <IconPlus class="w-4 h-4" />
                {{ t('developer.apps.boardWidgets.addWidget') }}
              </button>
            </div>

            <div v-if="widgets.length > 0" class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>{{ t('developer.apps.boardWidgets.name') }}</th>
                    <th>{{ t('developer.apps.boardWidgets.key') }}</th>
                    <th>{{ t('developer.apps.boardWidgets.rendererType') }}</th>
                    <th>{{ t('developer.apps.boardWidgets.fieldTypes') }}</th>
                    <th>{{ t('developer.apps.status') }}</th>
                    <th class="w-20" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(widget, index) in widgets" :key="widget.key" class="hover">
                    <td>
                      <div class="font-medium text-sm">{{ widget.name || '—' }}</div>
                      <div
                        v-if="widget.description"
                        class="text-[11px] text-base-content/40 mt-0.5 line-clamp-2 max-w-[14rem]"
                        :title="widget.description"
                      >
                        {{ widget.description }}
                      </div>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <code class="text-sm font-mono font-medium">{{ widget.key }}</code>
                        <span v-if="!widget.allowMultiple" class="badge badge-xs badge-ghost">
                          {{ t('developer.apps.boardWidgets.singleton') }}
                        </span>
                      </div>
                      <div v-if="widget.maxPayloadBytes > 0" class="text-[11px] text-base-content/40 mt-0.5">
                        ≤ {{ widget.maxPayloadBytes }}b
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-sm badge-outline font-mono">{{ widget.rendererType }}</span>
                    </td>
                    <td>
                      <div v-if="widget.fieldTypes.length > 0" class="flex flex-wrap gap-1 max-w-xs">
                        <code
                          v-for="field in widget.fieldTypes"
                          :key="field.name"
                          class="text-[11px] bg-base-200 rounded px-1.5 py-0.5"
                          :class="field.required ? 'text-warning' : 'text-base-content/60'"
                          :title="`${field.type}${field.format ? '/' + field.format : ''}${field.required ? ' *' : ''}`"
                        >
                          {{ field.name }}{{ field.required ? '*' : '' }}
                        </code>
                      </div>
                      <span v-else class="text-xs text-base-content/40">—</span>
                    </td>
                    <td>
                      <span
                        class="badge badge-sm"
                        :class="widget.isEnabled ? 'badge-success' : 'badge-ghost'"
                      >
                        {{ widget.isEnabled ? (t('common.active') ?? 'Active') : (t('common.disabled') ?? 'Disabled') }}
                      </span>
                    </td>
                    <td>
                      <div class="flex gap-1 justify-end">
                        <button class="btn btn-ghost btn-xs" @click="openEditModal(widget, index)">
                          <IconEdit class="w-3.5 h-3.5" />
                        </button>
                        <button class="btn btn-ghost btn-xs text-error" @click="handleDelete(widget.key, index)">
                          <IconTrash class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="flex flex-col items-center py-10 text-center">
              <IconLayoutDashboard class="w-12 h-12 text-base-content/20 mb-4" />
              <p class="text-base-content/60 mb-1">{{ t('developer.apps.boardWidgets.noWidgets') }}</p>
              <p class="text-sm text-base-content/40">{{ t('developer.apps.boardWidgets.noWidgetsHint') }}</p>
            </div>
          </div>
        </div>

        <!-- API Reference -->
        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body p-5">
            <h3 class="card-title text-base mb-3">
              <IconCode class="w-5 h-5" />
              {{ t('developer.apps.boardWidgets.apiReference') }}
            </h3>

            <div class="rounded-xl bg-base-300/40 p-4 mb-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="badge badge-success badge-sm font-bold">POST</span>
                <code class="text-sm font-mono">/develop/private/apps/{{ appId }}/board/payload</code>
              </div>
              <div class="text-xs text-base-content/50 space-y-1">
                <div>
                  {{ t('developer.apps.boardWidgets.payloadPush.authLabel') }}:
                  <code class="bg-base-200 rounded px-1.5 py-0.5">X-App-Secret</code>
                  <span class="text-base-content/30 mx-1">or</span>
                  <code class="bg-base-200 rounded px-1.5 py-0.5">Authorization: Bearer</code>
                </div>
              </div>
            </div>

            <!-- Request body example -->
            <div class="mb-4">
              <div class="font-semibold text-sm mb-2">{{ t('developer.apps.boardWidgets.requestExample') }}</div>
              <div class="collapse collapse-arrow bg-base-200/40 border border-base-300/20 rounded-xl">
                <input type="checkbox" />
                <div class="collapse-title text-sm font-semibold min-h-0 py-3">
                  {{ t('developer.apps.boardWidgets.payloadPush.title') }}
                </div>
                <div class="collapse-content">
                  <pre class="rounded-lg bg-base-300/30 p-3 text-xs font-mono overflow-x-auto"><code>{{ pushExample }}</code></pre>
                </div>
              </div>
            </div>

            <!-- Request fields table -->
            <div class="mb-4">
              <div class="font-semibold text-sm mb-2">{{ t('developer.apps.boardWidgets.requestFields') }}</div>
              <div class="overflow-x-auto">
                <table class="table table-xs">
                  <thead>
                    <tr>
                      <th>{{ t('developer.apps.boardWidgets.field') }}</th>
                      <th>{{ t('developer.apps.boardWidgets.type') }}</th>
                      <th>{{ t('developer.apps.boardWidgets.required') }}</th>
                      <th>{{ t('developer.apps.boardWidgets.tableDescription') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>account_id</code></td>
                      <td>string</td>
                      <td><span class="badge badge-xs badge-error">✓</span></td>
                      <td>{{ t('developer.apps.boardWidgets.payloadPush.accountIdHint') }}</td>
                    </tr>
                    <tr>
                      <td><code>board_item_id</code></td>
                      <td>string</td>
                      <td />
                      <td>{{ t('developer.apps.boardWidgets.payloadPush.boardItemIdHint') }}</td>
                    </tr>
                    <tr>
                      <td><code>widget_key</code></td>
                      <td>string</td>
                      <td><span class="badge badge-xs badge-error">✓</span></td>
                      <td>{{ t('developer.apps.boardWidgets.fieldWidgetKey') }}</td>
                    </tr>
                    <tr>
                      <td><code>payload</code></td>
                      <td>object</td>
                      <td><span class="badge badge-xs badge-error">✓</span></td>
                      <td>{{ t('developer.apps.boardWidgets.payloadPush.payloadHint') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Envelope shape -->
            <div class="mb-4">
              <div class="font-semibold text-sm mb-2">{{ t('developer.apps.boardWidgets.envelopeShape') }}</div>
              <pre class="rounded-lg bg-base-300/30 p-3 text-xs font-mono overflow-x-auto"><code>{{ envelopeExample }}</code></pre>
              <p class="text-xs text-base-content/40 mt-2">{{ t('developer.apps.boardWidgets.fieldEnvelopeHint') }}</p>
            </div>

            <!-- Notes -->
            <div class="rounded-xl bg-info/5 border border-info/20 p-4">
              <div class="text-sm font-semibold text-info mb-2">{{ t('developer.apps.boardWidgets.notes') }}</div>
              <ul class="text-xs text-base-content/60 space-y-1.5 list-disc list-inside">
                <li>
                  {{ t('developer.apps.boardWidgets.oauthScopeLabel') }}:
                  <code class="bg-base-200 rounded px-1 text-[11px]">accounts.profile.board</code>
                </li>
                <li>{{ t('developer.apps.boardWidgets.payloadPush.infoNote') }}</li>
                <li>{{ t('developer.apps.boardWidgets.payloadPush.backendNote') }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Playground -->
        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body p-5">
            <h3 class="card-title text-base mb-1">
              <IconFlaskConical class="w-5 h-5" />
              {{ t('developer.apps.boardWidgets.playground') }}
            </h3>
            <p class="text-sm text-base-content/50 mb-4">{{ t('developer.apps.boardWidgets.playgroundDesc') }}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.boardWidgets.payloadPush.widgetKey') }}</legend>
                <select v-model="pushForm.widgetKey" class="select w-full text-sm">
                  <option value="" disabled>{{ t('developer.apps.boardWidgets.payloadPush.selectWidget') }}</option>
                  <option v-for="w in widgets" :key="w.key" :value="w.key">
                    {{ w.name ? `${w.name} (${w.key})` : w.key }}
                  </option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.boardWidgets.payloadPush.accountId') }}</legend>
                <input
                  v-model="pushForm.accountId"
                  type="text"
                  class="input w-full font-mono text-sm"
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                />
              </fieldset>
            </div>

            <fieldset class="fieldset mb-4">
              <legend class="fieldset-legend">
                {{ t('developer.apps.boardWidgets.payloadPush.boardItemId') }}
                <span class="text-xs text-base-content/40 font-normal">{{ t('developer.apps.boardWidgets.payloadPush.optional') }}</span>
              </legend>
              <input
                v-model="pushForm.boardItemId"
                type="text"
                class="input w-full font-mono text-sm"
                placeholder="de305d54-75b4-431b-adb2-eb6b9e546014"
              />
              <p class="text-xs text-base-content/40 mt-1">{{ t('developer.apps.boardWidgets.payloadPush.boardItemIdOptionalHint') }}</p>
            </fieldset>

            <fieldset class="fieldset mb-4">
              <legend class="fieldset-legend flex items-center justify-between w-full pr-1">
                <span>{{ t('developer.apps.boardWidgets.payload') }}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  :disabled="!selectedPushWidget"
                  @click="fillSamplePayload"
                >
                  {{ t('developer.apps.boardWidgets.fillSample') }}
                </button>
              </legend>
              <textarea
                v-model="pushPayloadInput"
                class="textarea w-full font-mono text-sm leading-relaxed"
                rows="12"
                :placeholder="payloadPlaceholder"
              />
              <p class="text-xs text-base-content/40 mt-1">{{ t('developer.apps.boardWidgets.payloadHintNested') }}</p>
            </fieldset>

            <div class="flex items-center gap-3">
              <button
                class="btn btn-primary"
                :disabled="isPushing || !canPush"
                @click="handlePushPayload"
              >
                <span v-if="isPushing" class="loading loading-spinner loading-sm" />
                <IconRocket v-else class="w-4 h-4" />
                {{ t('developer.apps.boardWidgets.payloadPush.push') }}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" @click="resetPushForm">
                <IconRotateCcw class="w-3.5 h-3.5" />
                {{ t('developer.apps.boardWidgets.reset') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Response -->
        <div v-if="pushResult" class="card bg-base-100 shadow-sm">
          <div class="card-body p-5">
            <h3 class="text-base font-bold mb-4">{{ t('developer.playground.response') }}</h3>

            <div
              class="rounded-xl p-4"
              :class="pushResult.success ? 'bg-success/10 border border-success/20' : 'bg-error/10 border border-error/20'"
            >
              <div class="flex items-start gap-3 mb-3">
                <IconCircleCheck v-if="pushResult.success" class="w-5 h-5 text-success shrink-0 mt-0.5" />
                <IconCircleX v-else class="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div>
                  <div
                    class="text-sm font-semibold mb-1"
                    :class="pushResult.success ? 'text-success' : 'text-error'"
                  >
                    {{ pushResult.success
                      ? t('developer.apps.boardWidgets.payloadPush.pushSucceeded')
                      : t('developer.apps.boardWidgets.payloadPush.pushFailed') }}
                  </div>
                  <p v-if="pushResult.message" class="text-xs text-base-content/60">{{ pushResult.message }}</p>
                </div>
              </div>

              <div v-if="pushResult.normalizedPayload" class="mb-3">
                <div class="text-xs font-semibold text-base-content/50 mb-1">{{ t('developer.apps.boardWidgets.normalizedPayload') }}</div>
                <pre class="rounded-lg bg-base-300/30 p-3 text-xs font-mono overflow-x-auto"><code>{{ JSON.stringify(pushResult.normalizedPayload, null, 2) }}</code></pre>
              </div>
              <div v-if="pushResult.boardItem">
                <div class="text-xs font-semibold text-base-content/50 mb-1">{{ t('developer.apps.boardWidgets.payloadPush.updatedBoardItem') }}</div>
                <pre class="rounded-lg bg-base-300/30 p-3 text-xs font-mono overflow-x-auto"><code>{{ JSON.stringify(pushResult.boardItem, null, 2) }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Create / Edit Widget Drawer -->
      <AdminDrawer
        :open="widgetModalOpen"
        :title="editingWidget ? t('developer.apps.boardWidgets.editWidget') : t('developer.apps.boardWidgets.addWidget')"
        content-class="max-w-2xl"
        @update:open="widgetModalOpen = $event"
      >
        <form @submit.prevent="handleSaveWidget">
          <div class="space-y-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.boardWidgets.key') }}</legend>
              <input
                v-model="widgetForm.key"
                type="text"
                class="input w-full font-mono text-sm"
                required
                :disabled="!!editingWidget"
                placeholder="summary_card"
              />
              <p class="text-xs text-base-content/40 mt-1">{{ t('developer.apps.boardWidgets.keyHint') }}</p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.boardWidgets.name') }}</legend>
              <input
                v-model="widgetForm.name"
                type="text"
                class="input w-full text-sm"
                required
                placeholder="Summary Card"
              />
              <p class="text-xs text-base-content/40 mt-1">{{ t('developer.apps.boardWidgets.nameHint') }}</p>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.boardWidgets.descriptionLabel') }}</legend>
              <textarea
                v-model="widgetForm.description"
                class="textarea w-full text-sm"
                rows="2"
                required
                :placeholder="t('developer.apps.boardWidgets.descriptionPlaceholder')"
              />
              <p class="text-xs text-base-content/40 mt-1">{{ t('developer.apps.boardWidgets.descriptionHint') }}</p>
            </fieldset>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.boardWidgets.rendererType') }}</legend>
                <select v-model="widgetForm.rendererType" class="select w-full">
                  <option value="hero">hero</option>
                  <option value="inline">inline</option>
                  <option value="grid">grid</option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.boardWidgets.maxPayloadBytes') }}</legend>
                <input
                  v-model.number="widgetForm.maxPayloadBytes"
                  type="number"
                  class="input w-full"
                  min="0"
                  placeholder="2048"
                />
              </fieldset>
            </div>

            <!-- Field Types -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend flex items-center justify-between w-full pr-2">
                <span>{{ t('developer.apps.boardWidgets.fieldTypes') }}</span>
                <button type="button" class="btn btn-ghost btn-xs" @click="addFieldType">
                  <IconPlus class="w-3 h-3" />
                </button>
              </legend>
              <p class="text-xs text-base-content/40 mb-2">{{ t('developer.apps.boardWidgets.fieldValueTypesHint') }}</p>

              <div v-if="widgetForm.fieldTypes.length > 0" class="space-y-2">
                <div
                  v-for="(field, fi) in widgetForm.fieldTypes"
                  :key="fi"
                  class="rounded-lg border border-base-300/40 bg-base-200/30 p-3 space-y-2"
                >
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      v-model="field.name"
                      type="text"
                      class="input input-sm font-mono text-xs col-span-1"
                      :placeholder="t('developer.apps.boardWidgets.fieldName')"
                    >
                    <select
                      v-model="field.type"
                      class="select select-sm text-xs col-span-1"
                      @change="onFieldTypeChange(field)"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="null">null</option>
                      <option value="array">array</option>
                      <option value="object">object</option>
                    </select>
                    <select
                      v-model="field.format"
                      class="select select-sm text-xs col-span-1"
                      :disabled="isNestedFieldType(field.type)"
                    >
                      <option value="">{{ t('developer.apps.boardWidgets.formatAuto') }}</option>
                      <option value="boolean">boolean</option>
                      <option value="number">number</option>
                      <option value="date">date</option>
                      <option value="currency">currency</option>
                      <option value="json">json</option>
                    </select>
                    <div class="flex items-center justify-between gap-2 col-span-1">
                      <label class="flex items-center gap-1.5 cursor-pointer text-xs shrink-0">
                        <input v-model="field.required" type="checkbox" class="checkbox checkbox-xs">
                        {{ t('common.required') ?? 'Required' }}
                      </label>
                      <button type="button" class="btn btn-ghost btn-xs btn-square text-error" @click="removeFieldType(fi)">
                        <IconX class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    v-model="field.label"
                    type="text"
                    class="input input-sm w-full text-xs"
                    :placeholder="t('developer.apps.boardWidgets.fieldLabel')"
                  >
                </div>
              </div>
              <p v-else class="text-xs text-base-content/40 py-2">{{ t('developer.apps.boardWidgets.noFieldTypes') }}</p>
            </fieldset>

            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="widgetForm.isEnabled" type="checkbox" class="toggle toggle-sm" />
                <span class="text-sm">{{ t('developer.apps.boardWidgets.isEnabled') }}</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="widgetForm.allowMultiple" type="checkbox" class="toggle toggle-sm" />
                <span class="text-sm">{{ t('developer.apps.boardWidgets.allowMultiple') }}</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 mt-6">
            <button type="button" class="btn btn-ghost" @click="widgetModalOpen = false">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSavingWidget">
              <span v-if="isSavingWidget" class="loading loading-spinner loading-sm" />
              {{ editingWidget ? t('common.save') : t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLayoutDashboard,
  IconX,
  IconCircleCheck,
  IconCircleX,
  IconCode,
  IconRocket,
  IconFlaskConical,
  IconRotateCcw,
} from '#components'
import type {
  BoardWidgetFieldManifest,
  BoardWidgetManifest,
  BoardWidgetPayload,
  BoardWidgetPayloadPushResponse,
} from '~/types/developer'
import {
  fetchBoardWidgets,
  createBoardWidget,
  updateBoardWidget,
  deleteBoardWidget,
  pushBoardWidgetPayload,
  sampleBoardWidgetPayload,
  getBoardPushApiInfo,
} from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const pubName = computed(() => route.params.pubName as string)
const projectId = computed(() => route.params.projectId as string)
const appId = computed(() => route.params.appId as string)

const widgets = ref<BoardWidgetManifest[]>([])
const isLoading = ref(false)

// ---- Create / Edit ----
const widgetModalOpen = ref(false)
const isSavingWidget = ref(false)
const editingWidget = ref<BoardWidgetManifest | null>(null)
const editingIndex = ref(-1)

const defaultWidget = (): BoardWidgetManifest => ({
  key: '',
  name: '',
  description: '',
  isEnabled: true,
  rendererType: 'inline',
  fieldTypes: [],
  requiredFields: [],
  maxPayloadBytes: 2048,
  allowMultiple: true,
})

const widgetForm = reactive<BoardWidgetManifest>(defaultWidget())

const requiredFieldsSync = computed(() =>
  widgetForm.fieldTypes.filter(f => f.required).map(f => f.name).filter(Boolean),
)

// ---- Push playground ----
const isPushing = ref(false)
const pushResult = ref<BoardWidgetPayloadPushResponse | null>(null)
const pushForm = reactive({
  widgetKey: '',
  accountId: '',
  boardItemId: '',
})
const pushPayloadInput = ref('')

const selectedPushWidget = computed(() =>
  widgets.value.find(w => w.key === pushForm.widgetKey) ?? null,
)

const canPush = computed(() =>
  !!pushForm.widgetKey && !!pushForm.accountId.trim() && !!pushPayloadInput.value.trim(),
)

const pushExample = computed(() => {
  const info = getBoardPushApiInfo(appId.value)
  return JSON.stringify(info.exampleBody, null, 2)
})

const envelopeExample = `{
  "field_name": {
    "value": "any JSON (string | number | boolean | null | object | array)",
    "label": "Display label",
    "format": "optional hint"
  }
}`

const payloadPlaceholder = `{
  "title": {
    "value": "Updated from app backend",
    "label": "Title"
  },
  "meta": {
    "value": { "source": "backend", "tags": ["live"] },
    "label": "Metadata"
  }
}`

defineOgImage('UniOgImage', { title: `${t('developer.apps.boardWidgets.title')} · Pub: ${pubName.value}` })
useSolarSeo({ title: `${t('developer.apps.boardWidgets.title')} · ${pubName.value}` })

async function loadWidgets() {
  isLoading.value = true
  try {
    widgets.value = await fetchBoardWidgets(pubName.value, projectId.value, appId.value)
    if (!pushForm.widgetKey && widgets.value.length > 0) {
      pushForm.widgetKey = widgets.value[0]!.key
    }
  } catch (e) {
    console.error('[board-widgets] Failed to load widgets:', e)
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  editingWidget.value = null
  editingIndex.value = -1
  Object.assign(widgetForm, defaultWidget())
  widgetModalOpen.value = true
}

function openEditModal(widget: BoardWidgetManifest, index: number) {
  editingWidget.value = widget
  editingIndex.value = index
  const copy = JSON.parse(JSON.stringify(widget)) as BoardWidgetManifest
  Object.assign(widgetForm, {
    ...defaultWidget(),
    ...copy,
    name: copy.name ?? '',
    description: copy.description ?? '',
  })
  widgetModalOpen.value = true
}

function addFieldType() {
  widgetForm.fieldTypes.push({ name: '', type: 'string', label: '', format: '', required: false })
}

function removeFieldType(index: number) {
  widgetForm.fieldTypes.splice(index, 1)
}

function isNestedFieldType(type?: string): boolean {
  const ty = (type || '').toLowerCase()
  return ty === 'object' || ty === 'array' || ty === 'null'
}

function onFieldTypeChange(field: BoardWidgetFieldManifest) {
  if (field.type === 'object' || field.type === 'array') {
    field.format = 'json'
  } else if (field.type === 'null' || field.format === 'json') {
    field.format = ''
  }
}

/** Plain serializable body for create/update (avoids reactive proxy edge cases). */
function buildWidgetPayload(): BoardWidgetManifest {
  return {
    key: widgetForm.key.trim(),
    name: widgetForm.name.trim(),
    description: widgetForm.description.trim(),
    isEnabled: widgetForm.isEnabled,
    rendererType: widgetForm.rendererType,
    fieldTypes: widgetForm.fieldTypes.map(f => ({
      name: f.name.trim(),
      type: f.type,
      label: f.label?.trim() || f.name.trim(),
      format: f.format || '',
      required: !!f.required,
    })),
    requiredFields: requiredFieldsSync.value,
    maxPayloadBytes: widgetForm.maxPayloadBytes,
    allowMultiple: widgetForm.allowMultiple,
  }
}

async function handleSaveWidget() {
  isSavingWidget.value = true
  try {
    const payload = buildWidgetPayload()
    if (!payload.key || !payload.name || !payload.description) {
      return
    }

    if (editingWidget.value) {
      const updated = await updateBoardWidget(
        pubName.value,
        projectId.value,
        appId.value,
        editingWidget.value.key,
        payload,
      )
      widgets.value[editingIndex.value] = updated
    } else {
      const created = await createBoardWidget(
        pubName.value,
        projectId.value,
        appId.value,
        payload,
      )
      widgets.value.push(created)
      if (!pushForm.widgetKey) {
        pushForm.widgetKey = created.key
      }
    }
    widgetModalOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    isSavingWidget.value = false
  }
}

async function handleDelete(widgetKey: string, index: number) {
  if (!(await useAlert().confirm('Confirm', t('developer.apps.boardWidgets.deleteConfirm')))) return
  try {
    await deleteBoardWidget(pubName.value, projectId.value, appId.value, widgetKey)
    widgets.value.splice(index, 1)
    if (pushForm.widgetKey === widgetKey) {
      pushForm.widgetKey = widgets.value[0]?.key ?? ''
    }
  } catch (e) {
    console.error(e)
  }
}

function fillSamplePayload() {
  const widget = selectedPushWidget.value
  if (!widget) return
  pushPayloadInput.value = widget.fieldTypes.length > 0
    ? JSON.stringify(sampleBoardWidgetPayload(widget.fieldTypes), null, 2)
    : payloadPlaceholder
}

function resetPushForm() {
  pushForm.accountId = ''
  pushForm.boardItemId = ''
  pushResult.value = null
  fillSamplePayload()
}

function validateEnvelopePayload(
  raw: unknown,
): { ok: true; payload: BoardWidgetPayload } | { ok: false; message: string } {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, message: t('developer.apps.boardWidgets.invalidEnvelope') }
  }
  const payload = raw as Record<string, unknown>
  for (const [key, field] of Object.entries(payload)) {
    if (field === null || typeof field !== 'object' || Array.isArray(field)) {
      return {
        ok: false,
        message: `${t('developer.apps.boardWidgets.invalidEnvelope')} (${key})`,
      }
    }
    const env = field as Record<string, unknown>
    if (!('value' in env)) {
      return {
        ok: false,
        message: `${t('developer.apps.boardWidgets.invalidEnvelope')} (${key}: missing value)`,
      }
    }
    if (!isJsonValue(env.value)) {
      return {
        ok: false,
        message: `${t('developer.apps.boardWidgets.invalidEnvelope')} (${key}: value is not JSON)`,
      }
    }
    if (typeof env.label !== 'string' || !env.label.trim()) {
      return {
        ok: false,
        message: `${t('developer.apps.boardWidgets.invalidEnvelope')} (${key}: label must be a non-empty string)`,
      }
    }
    if (env.format !== undefined && typeof env.format !== 'string') {
      return {
        ok: false,
        message: `${t('developer.apps.boardWidgets.invalidEnvelope')} (${key}: format must be a string)`,
      }
    }
  }
  return { ok: true, payload: payload as BoardWidgetPayload }
}

function isJsonValue(v: unknown): boolean {
  if (v === null) return true
  const ty = typeof v
  if (ty === 'string' || ty === 'number' || ty === 'boolean') return true
  if (ty === 'undefined' || ty === 'function' || ty === 'symbol' || ty === 'bigint') return false
  if (Array.isArray(v)) return v.every(isJsonValue)
  if (ty === 'object') {
    return Object.values(v as Record<string, unknown>).every(isJsonValue)
  }
  return false
}

async function handlePushPayload() {
  if (!canPush.value) return
  isPushing.value = true
  try {
    let parsed: unknown
    try {
      parsed = JSON.parse(pushPayloadInput.value || '{}')
    } catch {
      pushResult.value = {
        success: false,
        message: t('developer.apps.boardWidgets.invalidJson'),
        accountId: pushForm.accountId,
        boardItemId: pushForm.boardItemId || '',
        widgetKey: pushForm.widgetKey,
        normalizedPayload: null,
        boardItem: null,
      }
      return
    }

    const check = validateEnvelopePayload(parsed)
    if (!check.ok) {
      pushResult.value = {
        success: false,
        message: check.message,
        accountId: pushForm.accountId,
        boardItemId: pushForm.boardItemId || '',
        widgetKey: pushForm.widgetKey,
        normalizedPayload: null,
        boardItem: null,
      }
      return
    }

    pushResult.value = await pushBoardWidgetPayload(appId.value, {
      accountId: pushForm.accountId,
      boardItemId: pushForm.boardItemId || undefined,
      widgetKey: pushForm.widgetKey,
      payload: check.payload,
    })
  } catch (e) {
    console.error(e)
    pushResult.value = {
      success: false,
      message: String(e),
      accountId: pushForm.accountId,
      boardItemId: pushForm.boardItemId || '',
      widgetKey: pushForm.widgetKey,
      normalizedPayload: null,
      boardItem: null,
    }
  } finally {
    isPushing.value = false
  }
}

watch(() => pushForm.widgetKey, (key) => {
  if (!key) return
  if (!pushPayloadInput.value.trim()) {
    fillSamplePayload()
  }
})

watch([pubName, projectId, appId], async () => {
  await loadWidgets()
}, { immediate: true })
</script>
