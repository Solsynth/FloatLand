<template>
    <div class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg" />
    </div>
</template>
<script setup lang="ts">
import type { ParticipantAttempt } from "~/types/test";

definePageMeta({ middleware: "auth" });

const key = useRoute().params.key as string;
const attempt = await safeJsonParse<ParticipantAttempt>(
    await apiFetch(`/passport/admin/tests/${key}/trial/attempts`, {
        method: "POST",
    }),
);
await navigateTo(`/accounts/tests/answer/${attempt.id}`, { replace: true });
</script>
