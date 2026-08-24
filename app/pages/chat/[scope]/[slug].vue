<script setup lang="ts">
import { fetchChatRoomBySlug } from "~/utils/api";

const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const scope = computed(() => String(route.params.scope ?? ""));
const slug = computed(() => String(route.params.slug ?? ""));

const status = ref<"resolving" | "missing">("resolving");

onMounted(async () => {
  try {
    const room = await fetchChatRoomBySlug(scope.value, slug.value);
    if (!room) {
      status.value = "missing";
      return;
    }
    await router.replace({ path: "/chat", query: { room: room.id } });
  } catch (err) {
    console.error("[Chat] Failed to resolve room by slug:", err);
    status.value = "missing";
  }
});

useHead({
  title: t("chat.title"),
});
</script>

<template>
  <NuxtLayout name="app">
    <div class="flex h-[calc(100vh-8rem)] items-center justify-center lg:h-[calc(100vh-2rem)]">
      <div v-if="status === 'resolving'" class="flex flex-col items-center gap-3">
        <span class="loading loading-spinner loading-md text-base-content/40" />
        <p class="text-sm text-base-content/50">{{ t('chat.resolvingRoom') }}</p>
      </div>

      <div v-else class="flex max-w-sm flex-col items-center gap-3 text-center">
        <div class="rounded-full bg-base-200 p-4">
          <IconSearchX class="h-6 w-6 text-base-content/40" />
        </div>
        <h2 class="text-lg font-semibold">{{ t('chat.roomNotFoundTitle') }}</h2>
        <p class="text-sm text-base-content/60">
          {{ t('chat.roomNotFoundDescription', { path: `/chat/${scope}/${slug}` }) }}
        </p>
        <NuxtLink to="/chat" class="btn btn-sm btn-primary mt-1">
          {{ t('chat.backToChats') }}
        </NuxtLink>
      </div>
    </div>
  </NuxtLayout>
</template>
