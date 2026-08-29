<script setup lang="ts">
definePageMeta({ middleware: "auth" });

await navigateTo("/mail/inbox", { redirectCode: 302 });
</script>

<template>
  <div />
</template>
