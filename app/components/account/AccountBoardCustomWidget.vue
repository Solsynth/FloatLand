<template>
  <!-- Legacy standalone text/attachment without app id -->
  <div v-if="!appId && widgetKey === 'text'">
    <div
      class="prose prose-sm max-w-none"
      v-html="renderMarkdown(payloadString('content') || '')"
    />
  </div>
  <div v-else-if="!appId && widgetKey === 'attachment'" class="space-y-2 w-full">
    <img
      v-for="(src, i) in attachmentSrcs"
      :key="i"
      :src="src"
      alt=""
      class="block w-full h-auto rounded-box"
    />
  </div>

  <div v-else-if="!isConfigured" class="text-sm text-error">
    Widget not configured
  </div>

  <div v-else-if="!resolved" class="text-sm text-base-content/50">
    Custom app widget
  </div>

  <div v-else-if="fields.length === 0" class="text-sm text-error">
    Widget not configured
  </div>

  <!-- Layouts: image/background only here (not as an outer card banner) -->
  <div
    v-else-if="rendererType === 'hero'"
    class="relative w-full min-h-[8rem]"
  >
    <div
      v-if="backgroundSrc"
      class="absolute inset-0 w-full overflow-hidden"
    >
      <img :src="backgroundSrc" alt="" class="h-full w-full object-cover" />
      <div class="absolute inset-0 bg-base-100/80" />
    </div>
    <div
      class="relative w-full space-y-1"
      :class="backgroundSrc ? 'p-3' : 'p-4'"
    >
      <img
        v-if="imageSrc"
        :src="imageSrc"
        alt=""
        class="w-14 h-14 rounded-full object-cover mb-2"
      />
      <p
        class="text-xs font-semibold"
        :class="backgroundSrc ? 'text-base-content' : 'text-primary'"
      >
        {{ fields[0]?.label }}
      </p>
      <p class="text-base font-bold leading-tight">
        {{ stringifyValue(fields[0]?.value) }}
      </p>
      <p v-if="fields.length > 1" class="text-xs font-bold text-base-content/50">
        +{{ fields.length - 1 }}
      </p>
      <p class="text-xs text-base-content/50 pt-1" :title="footerTitle">
        {{ footerText }}
      </p>
    </div>
  </div>

  <div v-else-if="rendererType === 'inline'" class="flex items-center gap-3 w-full min-w-0">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      alt=""
      class="w-20 h-20 object-cover shrink-0 rounded-box"
    />
    <div class="min-w-0 flex-1 py-3 pr-4" :class="imageSrc ? '' : 'pl-4'">
      <p class="text-xs font-semibold text-primary">{{ fields[0]?.label }}</p>
      <div class="flex items-center gap-2">
        <p class="text-base font-bold truncate">
          {{ stringifyValue(fields[0]?.value) }}
        </p>
        <span
          v-if="fields.length > 1"
          class="text-xs font-bold text-base-content/50 shrink-0"
        >
          +{{ fields.length - 1 }}
        </span>
      </div>
      <p class="text-xs text-base-content/50 mt-1" :title="footerTitle">
        {{ footerText }}
      </p>
    </div>
  </div>

  <div v-else-if="rendererType === 'data'" class="p-4 space-y-2 w-full min-w-0">
    <div class="flex flex-wrap gap-3 w-full">
      <img
        v-if="imageSrc"
        :src="imageSrc"
        alt=""
        class="w-36 max-w-full aspect-square object-cover rounded-box"
      />
      <div
        v-for="field in fields"
        :key="field.name"
        class="min-w-[8rem] max-w-[14rem] p-3 rounded-box bg-base-200/50"
      >
        <p class="text-xs text-base-content/50">{{ field.label }}</p>
        <p class="text-base font-semibold mt-1">
          {{ stringifyValue(field.value) }}
        </p>
      </div>
    </div>
    <p class="text-xs text-base-content/50" :title="footerTitle">
      {{ footerText }}
    </p>
  </div>

  <div v-else-if="rendererType === 'grid'" class="space-y-3 w-full min-w-0">
    <div
      v-if="backgroundSrc || imageSrc"
      class="relative w-full h-32 overflow-hidden"
    >
      <img
        v-if="backgroundSrc"
        :src="backgroundSrc"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div
        v-else
        class="absolute inset-0 bg-base-200"
      />
      <div class="absolute inset-0 bg-black/20" />
      <img
        v-if="imageSrc"
        :src="imageSrc"
        alt=""
        class="absolute bottom-3 left-3 w-14 h-14 rounded-full object-cover"
      />
    </div>
    <div class="grid grid-cols-3 gap-2.5 px-2 w-full">
      <div
        v-for="field in gridFields.slice(0, 6)"
        :key="field.name"
        class="min-h-14 p-2.5"
      >
        <p class="text-xs text-base-content/50 truncate">{{ field.label }}</p>
        <p class="text-sm font-semibold line-clamp-2 leading-tight mt-1">
          {{ stringifyValue(field.value) }}
        </p>
      </div>
    </div>
    <p class="text-xs text-base-content/50 px-4 pb-2" :title="footerTitle">
      {{ footerText }}
    </p>
  </div>

  <!-- Default list layout -->
  <div v-else class="space-y-2.5 w-full min-w-0">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      alt=""
      class="block w-full aspect-[16/7] object-cover"
    />
    <div class="space-y-2.5 px-4 w-full" :class="imageSrc ? 'pb-4' : 'py-4'">
      <div
        v-for="field in fields"
        :key="field.name"
        class="flex items-start gap-3"
      >
        <p class="text-sm text-base-content/50 min-w-0 w-2/5 shrink-0">
          {{ field.label }}
        </p>
        <div class="min-w-0 flex-1 text-right text-sm font-medium">
          <CustomPayloadValue :value="field.value" align="right" />
        </div>
      </div>
      <p class="text-xs text-base-content/50" :title="footerTitle">
        {{ footerText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccountBoardPayload } from "~/types/auth";
import type {
  BoardAppDiscoveryResponse,
  BoardWidgetFieldManifest,
} from "~/types/developer";
import { getFileUrl } from "~/utils/files";
import { renderMarkdown } from "~/utils/markdown";

interface CustomField {
  name: string;
  label: string;
  value: unknown;
}

const props = defineProps<{
  appId: string;
  widgetKey: string;
  payload: AccountBoardPayload;
  background?: string | null;
  image?: string | null;
  apps: BoardAppDiscoveryResponse[];
}>();

const RESERVED = new Set(["image", "background"]);

const isConfigured = computed(() => Object.keys(props.payload || {}).length > 0);

const resolved = computed(() => {
  if (!props.appId || !props.widgetKey) return null;
  for (const app of props.apps) {
    if (app.id !== props.appId) continue;
    const definition = app.boardWidgets.find(
      (w: { key: string }) => w.key === props.widgetKey,
    );
    if (definition) return { app, definition };
  }
  return null;
});

const rendererType = computed(
  () => resolved.value?.definition.rendererType || "list",
);

const footerText = computed(() => {
  if (!resolved.value) return "";
  return [resolved.value.app.name, resolved.value.definition.name].join(" · ");
});

const footerTitle = computed(() => {
  const desc = resolved.value?.definition.description?.trim();
  return desc || footerText.value;
});

function payloadFieldValue(key: string): { value?: unknown; label?: string } | null {
  const value = props.payload?.[key];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as { value?: unknown; label?: string };
  }
  return null;
}

function payloadString(key: string): string | null {
  const value = props.payload?.[key];
  if (typeof value === "string") return value;
  const field = payloadFieldValue(key);
  if (typeof field?.value === "string") return field.value;
  return null;
}

const fields = computed((): CustomField[] => {
  const definition = resolved.value?.definition;
  const result: CustomField[] = [];
  const seen = new Set<string>();
  const fieldTypes: BoardWidgetFieldManifest[] =
    definition?.fieldTypes ?? [];

  for (const field of fieldTypes) {
    if (RESERVED.has(field.name)) continue;
    const payloadField = payloadFieldValue(field.name);
    if (!payloadField) continue;
    result.push({
      name: field.name,
      label: payloadField.label || field.label || field.name,
      value: payloadField.value,
    });
    seen.add(field.name);
  }

  for (const key of Object.keys(props.payload || {})) {
    if (RESERVED.has(key) || seen.has(key)) continue;
    const payloadField = payloadFieldValue(key);
    if (!payloadField) continue;
    result.push({
      name: key,
      label: payloadField.label || key,
      value: payloadField.value,
    });
  }

  return result;
});

const gridFields = computed((): CustomField[] => {
  const expanded: CustomField[] = [];
  for (const field of fields.value) {
    if (
      field.name === "data" &&
      field.value &&
      typeof field.value === "object" &&
      !Array.isArray(field.value)
    ) {
      for (const [k, v] of Object.entries(field.value as Record<string, unknown>)) {
        expanded.push({ name: k, label: k, value: v });
      }
      continue;
    }
    expanded.push(field);
  }
  return expanded;
});

function isRemoteUri(value: string) {
  try {
    const uri = new URL(value);
    return uri.protocol === "http:" || uri.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveSrc(source: string | null | undefined) {
  if (!source) return null;
  if (isRemoteUri(source)) return source;
  return getFileUrl(source) || source;
}

const backgroundSrc = computed(() => resolveSrc(props.background));
const imageSrc = computed(() => resolveSrc(props.image));

const attachmentSrcs = computed(() => {
  const fileIds = props.payload?.file_ids ?? props.payload?.fileIds;
  let ids: string[] = [];
  if (Array.isArray(fileIds)) {
    ids = fileIds.filter((id): id is string => typeof id === "string");
  } else {
    const single = props.payload?.file_id ?? props.payload?.fileId;
    if (typeof single === "string") ids = [single];
  }
  return ids
    .map((id) => resolveSrc(id))
    .filter((u): u is string => Boolean(u));
});

function stringifyValue(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object" && "value" in value) {
    return stringifyValue((value as { value: unknown }).value);
  }
  if (Array.isArray(value)) {
    return value.map((e) => `·  ${String(e)}`).join("\n");
  }
  return String(value);
}
</script>
