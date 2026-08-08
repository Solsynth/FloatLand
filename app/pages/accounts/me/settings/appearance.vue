<template>
  <div class="max-w-3xl mx-auto space-y-6 min-w-0">
    <h1 class="text-2xl font-bold mb-6 pt-4">{{ t("appearance.title") }}</h1>

    <!-- Theme -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg mb-4">
          {{ t("appearance.theme.heading") }}
        </h2>

        <div class="grid grid-cols-3 gap-3">
          <button
            class="settings-choice flex flex-col items-center gap-2 p-4"
            :class="
              theme === 'light'
                ? 'settings-choice--active'
                : ''
            "
            @click="setTheme('light')"
          >
            <IconSun class="w-6 h-6" />
            <span class="text-sm">{{ t("appearance.theme.light") }}</span>
          </button>
          <button
            class="settings-choice flex flex-col items-center gap-2 p-4"
            :class="
              theme === 'dark'
                ? 'settings-choice--active'
                : ''
            "
            @click="setTheme('dark')"
          >
            <IconMoon class="w-6 h-6" />
            <span class="text-sm">{{ t("appearance.theme.dark") }}</span>
          </button>
          <button
            class="settings-choice flex flex-col items-center gap-2 p-4"
            :class="
              theme === 'system'
                ? 'settings-choice--active'
                : ''
            "
            @click="setTheme('system')"
          >
            <IconMonitor class="w-6 h-6" />
            <span class="text-sm">{{ t("appearance.theme.system") }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Language -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg mb-1">
          {{ t("appearance.language.heading") }}
        </h2>
        <p class="text-sm text-base-content/60 mb-4">
          {{ t("appearance.language.description") }}
        </p>

        <div class="grid sm:grid-cols-2 gap-3">
          <button
            v-for="loc in availableLocales"
            :key="loc.code"
            class="settings-choice flex items-center gap-3 p-4 text-left"
            :class="
              loc.code === locale
                ? 'settings-choice--active'
                : ''
            "
            @click="switchLocale(loc.code)"
          >
            <IconCheck
              v-if="loc.code === locale"
              class="w-5 h-5 text-primary shrink-0"
            />
            <IconGlobe v-else class="w-5 h-5 text-base-content/60 shrink-0" />
            <span class="font-medium">{{ loc.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Font Size -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg mb-4">
          {{ t("appearance.fontSize.heading") }}
        </h2>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("appearance.fontSize.legend") }}
          </legend>
          <input
            v-model="fontSize"
            type="range"
            min="14"
            max="20"
            class="range range-primary w-full"
            @change="updateFontSize"
          />
          <p class="label flex justify-between">
            <span>{{ t("appearance.fontSize.small") }}</span>
            <span>{{ fontSize }}px</span>
            <span>{{ t("appearance.fontSize.large") }}</span>
          </p>
        </fieldset>
      </div>
    </section>

    <!-- Display Options -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg mb-4">
          {{ t("appearance.display.heading") }}
        </h2>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-4">
              <input
                v-model="display.reducedMotion"
                type="checkbox"
                class="toggle toggle-primary"
                @change="updateDisplay"
              />
              <div>
                <span class="label-text font-medium">
                  {{ t("appearance.display.reducedMotion") }}
                </span>
                <p class="text-sm text-base-content/60">
                  {{ t("appearance.display.reducedMotionHint") }}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </section>

    <div class="flex gap-2">
      <button
        class="btn btn-primary"
        :disabled="isSaving"
        @click="saveAppearance"
      >
        <IconLoader v-if="isSaving" class="w-4 h-4 animate-spin" />
        <IconSave v-else class="w-4 h-4" />
        {{ t("appearance.save") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconSun,
  IconMoon,
  IconMonitor,
  IconLoader,
  IconSave,
  IconGlobe,
  IconCheck,
} from "#components";

const { t, locale, locales, setLocale } = useI18n();
const { notify } = useAlert();

const isSaving = ref(false);

const theme = ref("system");
const fontSize = ref(16);

const display = reactive({
  reducedMotion: false,
});

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name?: string }>).map((l) => ({
    code: l.code,
    name: l.name || l.code,
  })),
);

async function switchLocale(code: string) {
  await setLocale(code as typeof locale.value);
}

// Load settings from localStorage on mount
onMounted(() => {
  const savedTheme = localStorage.getItem("theme") || "system";
  const savedFontSize = localStorage.getItem("font-size") || "16";
  const savedDisplay = localStorage.getItem("display-options");

  theme.value = savedTheme;
  fontSize.value = parseInt(savedFontSize, 10);

  if (savedDisplay) {
    try {
      const parsed = JSON.parse(savedDisplay);
      display.reducedMotion = parsed.reducedMotion || false;
    } catch {
      // Ignore parse errors
    }
  }

  applyTheme(savedTheme);
});

function setTheme(newTheme: string) {
  theme.value = newTheme;
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
}

function applyTheme(newTheme: string) {
  const root = document.documentElement;
  if (newTheme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", newTheme);
  }
}

function updateFontSize() {
  localStorage.setItem("font-size", String(fontSize.value));
  document.documentElement.style.fontSize = `${fontSize.value}px`;
}

function updateDisplay() {
  localStorage.setItem("display-options", JSON.stringify(display));
  if (display.reducedMotion) {
    document.documentElement.classList.add("reduce-motion");
  } else {
    document.documentElement.classList.remove("reduce-motion");
  }
}

async function saveAppearance() {
  isSaving.value = true;
  try {
    // Save to localStorage
    localStorage.setItem("theme", theme.value);
    localStorage.setItem("font-size", String(fontSize.value));
    localStorage.setItem("display-options", JSON.stringify(display));

    await new Promise((r) => setTimeout(r, 500));
    await notify(t("appearance.saved"));
  } finally {
    isSaving.value = false;
  }
}

defineOgImage('UniOgImage', { title: t("appearance.title") })

useSolarSeo({
  title: t("appearance.title"),
});
</script>
