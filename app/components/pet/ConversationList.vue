<template>
  <div class="space-y-0.5">
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>
    <template v-else-if="conversations.length > 0">
      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        type="button"
        class="flex w-full items-center justify-between gap-2 rounded-box px-3 py-2 text-left transition-colors hover:bg-base-200"
        :class="conversation.id === activeId ? 'bg-primary/10' : ''"
        @click="$emit('select', conversation.id)"
      >
        <span class="min-w-0 flex-1">
          <span
            class="block truncate text-sm font-medium"
            :class="conversation.id === activeId ? 'text-primary' : ''"
          >
            {{ conversation.title.trim() || t("chat.untitled") }}
          </span>
          <span class="block text-xs text-base-content/50">
            {{ formatChatDate(conversation.lastMessageAt) }}
          </span>
        </span>
      </button>
    </template>
    <p v-else class="px-3 py-8 text-center text-sm text-base-content/50">
      {{ t("chat.noConversations") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { formatChatDate } from "~/utils/datetime";
import type { PersonalityConversation } from "~/utils/personality";

defineProps<{
  conversations: PersonalityConversation[];
  loading: boolean;
  activeId?: string | null;
}>();

defineEmits<{ select: [id: string] }>();

const { t } = useI18n();
</script>
