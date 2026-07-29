<template>
  <div class="min-h-screen bg-base-200">
    <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div class="w-full max-w-md">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <slot />
          </div>
        </div>
      </div>
    </div>

    <footer class="footer footer-center bg-base-100 p-6 text-base-content/60">
      <aside>
        <p>{{ t("auth.footer") }}</p>
      </aside>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
