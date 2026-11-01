<template>
  <ConsolePanel flush>
    <LoadingSkeleton variant="feed" :rows="2" />
  </ConsolePanel>
</template>

<script setup lang="ts">
/**
 * `/@name` is the short form of a profile, and the form that gets shared. It
 * is a redirect rather than a second page so there is one canonical profile
 * URL: a search engine or a link preview never sees two addresses for one
 * account.
 */
const route = useRoute();
const name = computed(() => route.params.name as string);

await navigateTo(
  name.value ? `/accounts/${encodeURIComponent(name.value)}` : "/",
  { replace: true },
);
</script>
