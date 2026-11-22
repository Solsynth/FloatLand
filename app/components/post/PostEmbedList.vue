<template>
  <div class="space-y-2" @click.stop>
    <!-- Link embeds: collapsible group matching Solian EmbedListWidget -->
    <div v-if="linkEmbeds.length > 0" class="space-y-1.5">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-base-200/70"
        :aria-expanded="isLinksExpanded"
        @click="isLinksExpanded = !isLinksExpanded"
      >
        <IconLink class="h-4 w-4 shrink-0 text-base-content/60" />
        <span class="font-medium text-base-content/75">
          {{ t("post.embed.linksCount", { count: linkEmbeds.length }) }}
        </span>
        <span class="ml-auto font-medium text-primary">
          {{ isLinksExpanded ? t("post.embed.collapse") : t("post.embed.expand") }}
        </span>
      </button>

      <!-- Expanded -->
      <template v-if="isLinksExpanded">
        <EmbedLinkCard
          v-if="linkEmbeds.length === 1"
          :embed="linkEmbeds[0]!"
        />
        <div
          v-else
          class="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin"
        >
          <div
            v-for="(linkEmbed, idx) in linkEmbeds"
            :key="idx"
            class="w-56 shrink-0"
          >
            <EmbedLinkCard :embed="linkEmbed" />
          </div>
        </div>
      </template>

      <!-- Collapsed -->
      <EmbedLinkCard
        v-else
        :embed="linkEmbeds[0]!"
        compact
      />
    </div>

    <!-- Other embed types -->
    <template v-for="(embed, idx) in otherEmbeds" :key="idx">
      <EmbedSurveyCard
        v-if="getType(embed) === 'survey'"
        :survey-id="getString(embed, 'id')"
        :interactive="interactive"
      />

      <EmbedFundCard
        v-else-if="getType(embed) === 'fund'"
        :fund-id="getString(embed, 'id')"
        :interactive="interactive"
      />

      <EmbedLocationCard
        v-else-if="getType(embed) === 'location'"
        :name="getString(embed, 'name')"
        :address="getString(embed, 'address')"
        :wkt="getString(embed, 'wkt')"
      />

      <EmbedCalendarEventCard
        v-else-if="getType(embed) === 'calendar_event'"
        :event-id="getString(embed, 'id')"
      />

      <div
        v-else-if="getType(embed) === 'notable_day'"
        class="flex items-center gap-3 rounded-card bg-base-300/60 p-4"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
        >
          <IconPartyPopper class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold">
            {{ getString(embed, "name") || getString(embed, "localName") || t("post.embed.notableDay") }}
          </div>
          <div class="text-xs text-base-content/65">
            {{ getString(embed, "date") || t("post.embed.notableDayHint") }}
          </div>
        </div>
      </div>

      <EmbedWorkStatusCard
        v-else-if="getType(embed) === 'work_status'"
        :embed="embed"
      />

      <div
        v-else-if="getType(embed) === 'poll'"
        class="rounded-card bg-base-300/60 p-3"
      >
        <div class="flex items-center gap-2 text-sm font-medium">
          <IconVote class="h-4 w-4" />
          <span>{{ t("post.embed.poll") }}</span>
        </div>
        <div v-if="getString(embed, 'title')" class="mt-1 text-sm text-base-content/80">
          {{ getString(embed, "title") }}
        </div>
      </div>

      <div
        v-else
        class="rounded-card bg-base-200/60 px-3 py-2 text-xs text-base-content/55"
      >
        {{ t("post.embed.unsupported", { type: getType(embed) }) }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IconLink, IconPartyPopper, IconVote } from "#components";
import EmbedLinkCard from "./embeds/EmbedLinkCard.vue";
import EmbedSurveyCard from "./embeds/EmbedSurveyCard.vue";
import EmbedFundCard from "./embeds/EmbedFundCard.vue";
import EmbedLocationCard from "./embeds/EmbedLocationCard.vue";
import EmbedCalendarEventCard from "./embeds/EmbedCalendarEventCard.vue";
import EmbedWorkStatusCard from "./embeds/EmbedWorkStatusCard.vue";

const props = withDefaults(
  defineProps<{
    embeds: Record<string, unknown>[];
    interactive?: boolean;
  }>(),
  {
    interactive: true,
  },
);

const { t } = useI18n();

const isLinksExpanded = ref(false);

function getType(embed: Record<string, unknown>): string {
  return typeof embed.type === "string" ? embed.type.toLowerCase() : "unknown";
}

function getString(embed: Record<string, unknown>, key: string): string | null {
  const val = embed[key];
  return typeof val === "string" && val.trim() !== "" ? val.trim() : null;
}

const linkEmbeds = computed(() =>
  props.embeds.filter((e) => getType(e) === "link"),
);

const otherEmbeds = computed(() =>
  props.embeds.filter((e) => getType(e) !== "link"),
);
</script>
