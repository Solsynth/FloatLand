<template>
  <div class="auth-page">
    <div class="auth-panel auth-panel--compact">
        <ConfuseSpinner v-if="loading" message="Redirecting to provider callback..." />
        <div v-else class="alert alert-error">
          <IconAlertCircle class="w-4 h-4" />
          <span>Failed to reach provider callback. Please try again.</span>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { API_BASE_URL } from "~/utils/api";

definePageMeta({ layout: false });

defineOgImage('UniOgImage', { title: 'Redirecting', description: 'Redirecting to provider callback...' })

useSolarSeo({
  title: "Redirecting",
  description: "Redirecting to provider callback...",
});

const route = useRoute();
const loading = ref(true);

onMounted(() => {
  const provider = route.params.provider;
  if (typeof provider !== "string" || !provider) {
    navigateTo("/auth/login");
    return;
  }

  const query = new URLSearchParams(route.query as Record<string, string>).toString();
  const redirectUrl = `${API_BASE_URL}/padlock/auth/callback/${provider}${query ? `?${query}` : ""}`;

  window.location.href = redirectUrl;
});
</script>
