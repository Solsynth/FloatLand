<template>
  <div class="auth-page">
    <div class="auth-panel auth-panel--compact">
      <div class="items-center text-center">
        <div class="auth-status-icon mb-4 bg-success/10">
          <IconCheck class="w-8 h-8 text-success" />
        </div>
        <h2 class="text-2xl font-bold">Welcome Back!</h2>
        <p class="text-base-content/60 mt-2">You have successfully signed in.</p>
        <button class="btn btn-primary mt-6" @click="navigateTo('/')">
          Go Home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

defineOgImage('UniOgImage', { title: 'Success', description: 'Operation completed successfully.' })

useSolarSeo({
    title: "Success",
    description: "Operation completed successfully.",
})
</script>
