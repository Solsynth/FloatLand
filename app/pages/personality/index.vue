<script setup lang="ts">
definePageMeta({ middleware: "auth" });

// The AI Console merged into the Pet app; keep old deep links working.
await navigateTo("/pet", { redirectCode: 302 });
</script>
