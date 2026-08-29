<template>
  <div class="min-h-screen bg-base-200">
    <AdminHeader
      class="hidden lg:block"
      :breadcrumbs="breadcrumbs"
      :page-title="pageTitle"
    />

    <!-- Desktop Mail Layout -->
    <div class="hidden min-h-[calc(100vh-3.5rem)] lg:flex">
      <!-- Sidebar -->
      <aside
        class="sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-[18rem] shrink-0 overflow-y-auto border-r border-base-300 scrollbar-none"
      >
        <MailSidebar
          :compose-open="composeOpen"
          @compose="composeOpen = true"
          @open-blocklist="blocklistOpen = true"
        />
      </aside>

      <!-- Main Area -->
      <main class="min-w-0 flex-1 overflow-hidden">
        <div class="h-full">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden flex flex-col min-h-screen">
      <!-- Mobile Header -->
      <header
        class="fixed top-0 left-0 right-0 z-50 border-b border-base-300 bg-base-100"
      >
        <div class="flex h-14 items-center justify-between px-4">
          <NuxtLink to="/" class="btn btn-circle btn-ghost btn-sm">
            <IconArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <span class="text-sm font-semibold">{{ pageTitle }}</span>
          <button
            class="btn btn-circle btn-ghost btn-sm"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <IconMenu class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Mobile Nav Backdrop -->
      <Transition name="drawer-fade">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 z-40 bg-black/40"
          @click="mobileMenuOpen = false"
        />
      </Transition>

      <!-- Mobile Nav Panel -->
      <Transition name="drawer-slide">
        <div
          v-if="mobileMenuOpen"
          class="fixed right-0 top-14 bottom-0 z-50 w-72 overflow-y-auto border-l border-base-300 bg-base-100 p-4 shadow-sm scrollbar-none"
          @click.stop
        >
          <MailSidebar
            :compose-open="composeOpen"
            @compose="composeOpen = true; mobileMenuOpen = false"
            @open-blocklist="blocklistOpen = true; mobileMenuOpen = false"
          />
        </div>
      </Transition>

      <!-- Mobile Main Content -->
      <main class="flex-1 pt-18">
        <slot />
      </main>
    </div>

    <!-- Shared dialogs -->
    <MailComposeDialog
      :open="composeOpen"
      @close="composeOpen = false"
      @sent="composeOpen = false"
    />
    <BlocklistDialog
      :open="blocklistOpen"
      @close="blocklistOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconMenu } from "#components";

const { t } = useI18n();
const route = useRoute();
const { state, init } = useMail();

const mobileMenuOpen = ref(false);
const composeOpen = ref(false);
const blocklistOpen = ref(false);

const segmentLabels = computed<Record<string, string>>(() => ({
  mail: t("mail.title"),
  inbox: t("mail.folders.inbox"),
  sent: t("mail.folders.sent"),
  drafts: t("mail.folders.drafts"),
  spam: t("mail.folders.spam"),
  trash: t("mail.folders.trash"),
  archive: t("mail.folders.archive"),
}));

const breadcrumbs = computed(() => {
  const parts: Array<{ label: string; href: string }> = [
    { label: t("mail.title"), href: "/mail" },
  ];
  const segments = route.path.split("/").filter(Boolean);
  // segments[0] is 'mail'; skip the first segment
  if (segments[1] === "email") {
    // Reader: Mail > Folder > Subject (subject once loaded).
    if (state.readerFolder) {
      parts.push({
        label: segmentLabels.value[state.readerFolder] || state.readerFolder,
        href: `/mail/${state.readerFolder}`,
      });
    }
    parts.push({
      label: state.readerSubject || segments[2] || "email",
      href: route.path,
    });
    return parts;
  }
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i] as string;
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = segmentLabels.value[seg] || seg;
    parts.push({ label, href });
  }
  return parts;
});

const pageTitle = computed(() => {
  const last = breadcrumbs.value[breadcrumbs.value.length - 1];
  return last ? last.label : t("mail.title");
});

// Close mobile menu on navigation
watch(() => route.path, () => {
  mobileMenuOpen.value = false;
});

// Load mailboxes on mount (client-side only)
onMounted(() => {
  init();
});
</script>
