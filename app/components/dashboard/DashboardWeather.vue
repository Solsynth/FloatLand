<template>
  <div class="dash-card p-5">
    <div class="flex items-center justify-between">
      <h3 class="dash-card__title">
        <IconCloud class="h-4 w-4 text-base-content/45" />
        {{ t("dashboard.weather.title") }}
      </h3>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square text-base-content/45"
        :disabled="loading"
        :aria-label="t('common.refresh')"
        @click="load"
      >
        <IconRefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <div v-if="loading" class="flex items-center gap-2 py-6 text-sm text-base-content/50">
      <span class="loading loading-spinner loading-xs text-primary" />
    </div>

    <div v-else-if="error" class="flex flex-col items-center gap-1 py-6 text-center">
      <IconCloudOff class="h-6 w-6 text-base-content/30" />
      <p class="text-xs text-base-content/50">{{ t("dashboard.weather.failed") }}</p>
    </div>

    <div v-else-if="data" class="mt-4">
      <div class="flex items-center gap-3">
        <component :is="data.icon" class="h-9 w-9 shrink-0" :style="{ color: data.color }" />
        <div class="min-w-0 flex-1">
          <p class="text-3xl font-semibold leading-none tracking-tight">{{ Math.round(data.temperature) }}°</p>
          <p class="mt-1 truncate text-xs text-base-content/60">{{ data.label }}</p>
        </div>
        <div class="shrink-0 text-right text-xs text-base-content/55">
          <p>{{ data.locationLabel }}</p>
          <p class="mt-0.5">
            {{ t("dashboard.weather.feelsLike", { temp: Math.round(data.apparentTemperature) }) }}
          </p>
        </div>
      </div>

      <p class="mt-4 border-t border-base-200 pt-3 text-xs text-base-content/45">
        <span class="mr-4">{{ t("dashboard.weather.humidity", { value: Math.round(data.humidity) }) }}</span>
        <span>{{ t("dashboard.weather.wind", { value: Math.round(data.windSpeed) }) }}</span>
      </p>
    </div>

    <a
      v-if="data"
      href="https://open-meteo.com/"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-2 text-[10px] text-base-content/35 hover:text-base-content/60"
    >
      {{ t("dashboard.weather.dataBy") }} Open-Meteo.com
    </a>
  </div>
</template>

<script setup lang="ts">
import {
  IconCloud,
  IconCloudOff,
  IconCloudDrizzle,
  IconCloudFog,
  IconCloudLightning,
  IconCloudMoon,
  IconCloudRain,
  IconCloudSnow,
  IconCloudSun,
  IconMoonStar,
  IconRefreshCw,
  IconSun,
} from "#components";
import { fetchJson } from "~/utils/api";

const { t } = useI18n();

interface GeoResponse {
  latitude: number;
  longitude: number;
  city?: string | null;
  subdivision?: string | null;
  country?: string | null;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

interface WeatherInfo {
  icon: any;
  color: string;
  labelKey: string;
}

const loading = ref(true);
const error = ref(false);
const data = ref<{
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  label: string;
  locationLabel: string;
  icon: any;
  color: string;
} | null>(null);

const dayColor = {
  clear: "#F59E0B",
  moon: "#818CF8",
  sky: "#38BDF8",
  cloud: "#64748B",
  fog: "#9CA3AF",
  drizzle: "#0EA5E9",
  rain: "#2563EB",
  snow: "#22D3EE",
  storm: "#7C3AED",
  unknown: "#6B7280",
};

function weatherInfo(code: number, isDay: boolean): WeatherInfo {
  const night = isDay ? IconSun : IconMoonStar;
  switch (code) {
    case 0:
      return { icon: night, color: dayColor.clear, labelKey: "dashboard.weather.clear" };
    case 1:
      return { icon: night, color: dayColor.clear, labelKey: "dashboard.weather.mainlyClear" };
    case 2:
      return {
        icon: isDay ? IconCloudSun : IconCloudMoon,
        color: dayColor.sky,
        labelKey: "dashboard.weather.partlyCloudy",
      };
    case 3:
      return { icon: IconCloud, color: dayColor.cloud, labelKey: "dashboard.weather.overcast" };
    case 45:
    case 48:
      return { icon: IconCloudFog, color: dayColor.fog, labelKey: "dashboard.weather.fog" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { icon: IconCloudDrizzle, color: dayColor.drizzle, labelKey: "dashboard.weather.drizzle" };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return { icon: IconCloudRain, color: dayColor.rain, labelKey: "dashboard.weather.rain" };
    case 71:
    case 73:
    case 75:
    case 77:
      return { icon: IconCloudSnow, color: dayColor.snow, labelKey: "dashboard.weather.snow" };
    case 80:
    case 81:
    case 82:
      return { icon: IconCloudRain, color: dayColor.rain, labelKey: "dashboard.weather.showers" };
    case 85:
    case 86:
      return { icon: IconCloudSnow, color: dayColor.snow, labelKey: "dashboard.weather.snowShowers" };
    case 95:
      return { icon: IconCloudLightning, color: dayColor.storm, labelKey: "dashboard.weather.thunderstorm" };
    case 96:
    case 99:
      return { icon: IconCloudLightning, color: dayColor.storm, labelKey: "dashboard.weather.thunderstormHail" };
    default:
      return { icon: IconCloud, color: dayColor.unknown, labelKey: "dashboard.weather.unknown" };
  }
}

function labelFromParts(parts: (string | null | undefined)[]): string {
  const filtered = parts.filter((p): p is string => Boolean(p && p.trim())).map((p) => p.trim());
  return filtered.length > 0 ? filtered.join(", ") : "";
}

async function resolveLocation(): Promise<{ latitude: number; longitude: number; label: string }> {
  // Prefer Solar Network's public MaxMind lookup (no auth required).
  try {
    const geo = await fetchJson<GeoResponse>("/passport/ip-check/geo");
    if (
      typeof geo?.latitude === "number" &&
      typeof geo?.longitude === "number"
    ) {
      const label = labelFromParts([geo.city, geo.subdivision, geo.country]);
      return { latitude: geo.latitude, longitude: geo.longitude, label };
    }
  } catch {
    // fall through to public geo endpoint
  }

  // Fallback: geojs returns latitude/longitude as strings.
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
    const geo = await res.json();
    const latitude = Number.parseFloat(geo?.latitude);
    const longitude = Number.parseFloat(geo?.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const label = labelFromParts([geo?.city, geo?.region, geo?.country]);
      return { latitude, longitude, label };
    }
  } catch {
    // ignore
  }

  throw new Error("no-location");
}

async function load() {
  loading.value = true;
  error.value = false;
  try {
    const location = await resolveLocation();
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: "1",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error("open-meteo");
    const weather = (await res.json()) as OpenMeteoResponse;
    const current = weather.current;
    const info = weatherInfo(current.weather_code, current.is_day === 1);
    data.value = {
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      label: t(info.labelKey),
      locationLabel: location.label || "—",
      icon: info.icon,
      color: info.color,
    };
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
});
</script>
