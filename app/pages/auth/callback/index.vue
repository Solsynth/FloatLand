<template>
  <div class="auth-page">
    <div class="auth-panel auth-panel--compact">
        <ConfuseSpinner v-if="loading" message="Processing login..." />
        <template v-else-if="success">
          <div class="text-center">
            <IconCheck class="w-12 h-12 text-success mx-auto mb-4" />
            <p>Login successful. Redirecting...</p>
          </div>
        </template>
        <div v-else class="alert alert-error">
          <IconAlertCircle class="w-4 h-4" />
          <span>Failed to process login. Please try again.</span>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

defineOgImage('UniOgImage', { title: 'Authenticating', description: 'Completing authentication...' })

useSolarSeo({
    title: "Authenticating",
    description: "Completing authentication...",
})

const route = useRoute()
const { exchangeToken, fetchUser } = useAuth()
const { getRedirect, clearRedirect } = useAuthRedirect()
const loading = ref(true)
const success = ref(false)

onMounted(async () => {
  try {
    const code = route.query.code as string
    if (code) {
      await exchangeToken(code)
      await fetchUser()
      success.value = true
      // Get redirect from query or sessionStorage
      const redirectUrl = (route.query.redirect as string) || getRedirect()
      clearRedirect()
      setTimeout(() => navigateTo(redirectUrl || '/'), 1500)
    } else {
      navigateTo('/auth/login')
    }
  } catch (e) {
    console.error('Callback error:', e)
    navigateTo('/auth/login')
  } finally {
    loading.value = false
  }
})
</script>
