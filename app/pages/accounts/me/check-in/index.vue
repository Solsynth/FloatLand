<template>
  <NuxtLayout name="app">
    <div class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6">
      <!-- Main Content -->
      <div class="space-y-6 min-w-0">
        <!-- Loading -->
        <div v-if="initialLoading" class="flex justify-center py-20">
          <ConfuseSpinner message="Loading fortune..." />
        </div>

        <!-- Error -->
        <div v-else-if="loadError" class="card bg-base-100 mx-auto max-w-md">
          <div class="card-body items-center text-center gap-4">
            <IconAlertCircle class="text-error w-12 h-12" />
            <h2 class="text-xl font-bold">Failed to Load</h2>
            <p class="text-base-content/60">{{ loadError }}</p>
            <button class="btn btn-primary" @click="loadTodayResult">
              <IconRefreshCw class="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <template v-else>
          <!-- Temple Header -->
          <div class="flex flex-col items-center text-center gap-3 py-8">
            <IconFlame class="w-12 h-12 text-primary" />
            <h1 class="text-2xl font-bold" :style="{ fontFamily: serifFont }">
              Check-in Temple
            </h1>
            <p class="text-base-content/60" :style="{ fontFamily: serifFont }">
              {{ formattedDate }}
            </p>
          </div>

          <!-- Not Checked In: Prompt -->
          <div v-if="!result" class="card bg-base-100">
            <div class="card-body items-center text-center gap-4 p-6">
              <IconFlame class="w-12 h-12 text-primary" />
              <h2 class="text-xl font-bold" :style="{ fontFamily: serifFont }">
                You haven't checked in today
              </h2>
              <p
                class="text-base-content/60"
                :style="{ fontFamily: serifFont }"
              >
                Draw today's fortune at the temple to receive your daily
                blessing.
              </p>
              <button
                class="btn btn-primary btn-wide gap-2"
                :disabled="isCheckingIn"
                @click="doCheckIn()"
              >
                <IconSparkles class="w-4 h-4" />
                Draw Today's Fortune
              </button>
            </div>
          </div>

          <!-- Checked In: Fortune Display -->
          <template v-else>
            <!-- Fortune Card -->
            <FortuneCard
              :level="result.level"
              :created-at="result.createdAt"
              :poem="result.fortuneReport?.poem"
              :summary="result.fortuneReport?.summary"
            />

            <!-- Tips -->
            <FortuneTipsCard
              v-if="result.tips.length > 0"
              :tips="result.tips"
            />

            <!-- Fortune Guidance -->
            <FortuneGuidanceCard
              v-if="result.fortuneReport?.summaryDetail"
              :summary-detail="result.fortuneReport.summaryDetail"
            />

            <!-- Fortune Lucky Grid -->
            <FortuneLuckyGrid
              v-if="result.fortuneReport"
              :report="result.fortuneReport"
            />

            <!-- Fortune Details -->
            <FortuneDetailsCard
              v-if="result.fortuneReport"
              :report="result.fortuneReport"
            />

            <!-- Fortune Ritual -->
            <FortuneRitualCard
              v-if="result.fortuneReport?.ritual"
              :ritual="result.fortuneReport.ritual"
            />

            <!-- Fallback when no report -->
            <div v-if="!result.fortuneReport" class="alert alert-soft">
              <IconInfo class="w-5 h-5 shrink-0" />
              <span class="text-sm">
                Fortune report is being generated. Check back later.
              </span>
            </div>
          </template>

          <!-- Fortune Trend (visible below xl breakpoint) -->
          <div class="xl:hidden">
            <FortuneTrendCard />
          </div>
        </template>
      </div>

      <!-- Right Sidebar (Desktop only) -->
      <aside class="hidden w-full self-start sticky top-20 xl:block">
        <div class="space-y-4">
          <FortuneTrendCard />
        </div>
      </aside>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isCheckingIn"
      class="fixed inset-0 z-50 flex items-center justify-center bg-base-100/90"
    >
      <div class="card mx-4 max-w-sm bg-base-100 shadow-sm">
        <div class="card-body items-center text-center gap-4 p-6">
          <img
            src="/images/michan/checking-in.webp"
            alt="Checking in..."
            class="w-42 h-auto"
          >
          <div class="w-24">
            <progress class="progress progress-primary w-full" />
          </div>
          <h3 class="text-xl font-bold" :style="{ fontFamily: serifFont }">
            Drawing your fortune...
          </h3>
          <p
            class="text-base-content/60 text-sm"
            :style="{ fontFamily: serifFont }"
          >
            The temple spirits are consulting the stars for your daily reading.
          </p>
        </div>
      </div>
    </div>

    <!-- Captcha Dialog -->
    <dialog :open="showCaptcha" class="modal">
      <div class="modal-box">
        <div class="flex items-center justify-between pb-4">
          <h3 class="font-bold text-lg">Verification Required</h3>
          <form method="dialog">
            <button
              class="btn btn-ghost btn-sm btn-square"
              @click="showCaptcha = false"
            >
              <IconX class="w-4 h-4" />
            </button>
          </form>
        </div>
        <p class="text-sm text-base-content/60 mb-4">
          Please complete the verification to continue.
        </p>
        <CaptchaWidget @verified="onCaptchaVerified" />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCaptcha = false">close</button>
      </form>
    </dialog>
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconAlertCircle,
  IconRefreshCw,
  IconFlame,
  IconSparkles,
  IconInfo,
  IconX,
} from "#components";
import type { CheckInResult } from "~/utils/api";
import { getCheckInResultToday, performCheckIn, ApiError } from "~/utils/api";

defineOgImage('UniOgImage', { title: 'Check-in Temple' })

useSolarSeo({ title: "Check-in Temple" });

const auth = useAuth();
const { notify } = useAlert();

// State
const initialLoading = ref(true);
const loadError = ref<string | null>(null);
const result = ref<CheckInResult | null>(null);
const isCheckingIn = ref(false);
const showCaptcha = ref(false);
const pendingCaptchaToken = ref<string | null>(null);

// Font
const serifFont = "'Noto Serif', 'Noto Serif SC', serif";

// Date
const now = ref(new Date());
const formattedDate = computed(() => {
  const d = now.value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
});

// API
async function loadTodayResult() {
  initialLoading.value = true;
  loadError.value = null;
  try {
    result.value = await getCheckInResultToday();
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : "Failed to load check-in result";
  } finally {
    initialLoading.value = false;
  }
}

async function doCheckIn(captchaToken?: string) {
  isCheckingIn.value = true;
  try {
    result.value = await performCheckIn(captchaToken);
    showCaptcha.value = false;
    pendingCaptchaToken.value = null;
    await auth.fetchUser();
  } catch (err) {
    if (err instanceof ApiError && err.status === 423) {
      showCaptcha.value = true;
    } else {
      await notify(err instanceof Error ? err.message : "Check-in failed");
    }
  } finally {
    isCheckingIn.value = false;
  }
}

function onCaptchaVerified(token: string) {
  pendingCaptchaToken.value = token;
  showCaptcha.value = false;
  doCheckIn(token);
}

// Init
onMounted(() => {
  now.value = new Date();
  loadTodayResult();
});
</script>
