<template>
  <NuxtLayout name="mail">
    <MailReader :email-id="emailId" />
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const { t } = useI18n();
const route = useRoute();
const emailId = computed(() => route.params.id as string);

useSolarSeo({
  title: computed(() => t("mail.title")),
  description: computed(() => t("mail.title")),
});
</script>
