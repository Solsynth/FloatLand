<template>
	<div
		v-if="publisher || verification || homePage"
		class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
	>
		<template v-if="publisher">
			<span class="text-base-content/50">by</span>
			<span class="flex items-center gap-1.5">
				<span
					class="w-4 h-4 overflow-hidden rounded-full bg-base-200 flex items-center justify-center flex-shrink-0"
				>
					<FileImage
						v-if="publisher.picture"
						:file="publisher.picture"
						loading="lazy"
						class="w-full h-full object-cover"
					/>
					<IconUser v-else class="w-3 h-3 text-base-content/40" />
				</span>
				<span class="font-semibold text-base-content/70">
					{{ publisher.nick || publisher.name }}
				</span>
			</span>
		</template>

		<span
			v-if="verification"
			class="inline-flex items-center gap-1 font-semibold"
			:style="{ color: verificationColor }"
			:title="verificationTooltip"
		>
			<component
				:is="verificationIcon"
				class="w-3.5 h-3.5 flex-shrink-0"
				:style="{ color: verificationColor, fill: verificationColor, stroke: verificationColor }"
			/>
			{{ verification.title || 'Verified' }}
		</span>

		<a
			v-if="homePage"
			:href="homePage"
			target="_blank"
			rel="noopener noreferrer"
			class="link link-primary"
		>
			{{ homePageLabel }}
		</a>
	</div>
</template>

<script setup lang="ts">
import {
	IconUser,
	IconCircleCheck,
	IconUserCheck,
	IconBadgeCheck,
	IconBuilding2,
	IconPalette,
	IconCode,
	IconClapperboard,
} from '#components';
import type { AppPublisher, VerificationMark } from '~/utils/api';

const props = defineProps<{
	publisher?: AppPublisher | null;
	verification?: VerificationMark | null;
	homePage?: string | null;
}>();

// Verification marks are indexed by `type` (VerificationMarkType), matching the
// account badge mapping in AccountName.vue.
const kVerificationIcons = [
	IconCircleCheck,
	IconUserCheck,
	IconBadgeCheck,
	IconBuilding2,
	IconPalette,
	IconCode,
	IconClapperboard,
];

const kVerificationColors = [
	'#14b8a6',
	'#38bdf8',
	'#6366f1',
	'#ef4444',
	'#f97316',
	'#3b82f6',
	'#818cf8',
];

const verificationIcon = computed(() => {
	const type = props.verification?.type ?? 0;
	return kVerificationIcons[type] || IconBadgeCheck;
});

const verificationColor = computed(() => {
	const type = props.verification?.type ?? 0;
	return kVerificationColors[type] || '#3b82f6';
});

const verificationTooltip = computed(() => {
	const mark = props.verification;
	if (!mark) return '';
	const title = mark.title || 'Verified';
	return mark.description ? `${title}\n${mark.description}` : title;
});

const homePageLabel = computed(() => {
	if (!props.homePage) return '';
	try {
		return new URL(props.homePage).host;
	} catch {
		return props.homePage;
	}
});
</script>
