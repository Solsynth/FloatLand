<template>
	<div v-if="attachments.length" class="attachment-collection">
		<!-- Single attachment -->
		<div v-if="attachments.length === 1" class="single-attachment">
			<div
				class="relative overflow-hidden rounded-box cursor-pointer"
				:style="singleAttachmentStyle"
				@click.prevent.stop="openViewer(0)"
			>
				<AttachmentItem
					v-if="attachments[0]"
					:attachment="attachments[0]"
					:clickable="false"
					class="w-full h-full"
				/>
			</div>
		</div>

		<!-- Multiple attachments - horizontal scroll list -->
		<div v-else class="relative group">
			<div
				ref="scrollContainer"
				class="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
				@scroll="updateScrollState"
			>
				<div
					v-for="(attachment, index) in displayAttachments"
					:key="attachment.id"
					class="shrink-0 snap-start relative overflow-hidden rounded-box cursor-pointer"
					:style="getItemStyle(attachment)"
					@click.prevent.stop="openViewer(index)"
				>
					<AttachmentItem
						:attachment="attachment"
						:clickable="false"
						class="w-full h-full"
					/>

					<!-- Counter overlay for images -->
					<div
						v-if="isImageAttachment(attachment)"
						class="absolute bottom-2 left-2 rounded-box bg-black/60 px-2 py-0.5 text-xs font-medium text-white"
					>
						{{ index + 1 }}/{{ attachments.length }}
					</div>
				</div>
			</div>

			<!-- Scroll arrows (desktop hover) -->
			<button
				v-if="canScrollLeft"
				class="absolute left-2 top-1/2 -translate-y-1/2 btn btn-circle btn-sm border-none bg-black/50 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover:opacity-100"
				@click.prevent.stop="scrollBy(-1)"
			>
				<IconChevronLeft class="w-4 h-4" />
			</button>
			<button
				v-if="canScrollRight"
				class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-circle btn-sm border-none bg-black/50 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover:opacity-100"
				@click.prevent.stop="scrollBy(1)"
			>
				<IconChevronRight class="w-4 h-4" />
			</button>
		</div>

		<!-- Expand/collapse button for many attachments -->
		<button
			v-if="attachments.length > (maxVisible ?? 0) && !showAll"
			class="btn btn-ghost btn-xs mt-2 gap-1"
			@click.prevent.stop="showAll = true"
		>
			<IconChevronDown class="w-3 h-3" />
			Show {{ attachments.length - (maxVisible ?? 0) }} more
		</button>
		<button
			v-if="showAll && attachments.length > (maxVisible ?? 0)"
			class="btn btn-ghost btn-xs mt-2 gap-1"
			@click.prevent.stop="showAll = false"
		>
			<IconChevronUp class="w-3 h-3" />
			Show less
		</button>

	</div>
</template>

<script setup lang="ts">
import type { FileAttachment } from '~/types/post';
import { isImageFile, isVideoFile, isAudioFile } from '~/utils/fileType';
import {
	IconChevronLeft,
	IconChevronRight,
	IconChevronDown,
} from '#components';

interface Props {
	attachments: FileAttachment[];
	maxHeight?: number;
	maxVisible?: number;
}

const props = withDefaults(defineProps<Props>(), {
	maxHeight: 0,
	maxVisible: 6
});

const showAll = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const { open: openLightboxModal } = useLightbox();

// Display attachments based on showAll state
const displayAttachments = computed(() => {
	if (showAll.value) return props.attachments;
	return props.attachments.slice(0, props.maxVisible);
});

// Check attachment type
function isImageAttachment(attachment: FileAttachment): boolean {
	return isImageFile(attachment);
}

// Get aspect ratio from file meta
function getAspectRatio(attachment: FileAttachment): number {
	const width = attachment.fileMeta?.width;
	const height = attachment.fileMeta?.height;
	if (typeof width === 'number' && typeof height === 'number') return width / height;
	const ratio = attachment.fileMeta?.ratio;
	if (typeof ratio === 'number' && ratio > 0) return ratio;
	if (typeof ratio === 'string') {
		const parsed = parseFloat(ratio);
		if (parsed > 0) return parsed;
	}
	return 4 / 3; // Default aspect ratio
}

// Single attachment style
const singleAttachmentStyle = computed(() => {
	if (!props.attachments[0]) return {};
	const ratio = getAspectRatio(props.attachments[0]);
	return {
		aspectRatio: ratio,
		maxHeight: props.maxHeight ? `${props.maxHeight}px` : '500px'
	};
});

// Get item style for horizontal list items
function getItemStyle(attachment: FileAttachment) {
	const isImage = isImageFile(attachment);
	const isAudio = attachment.mimeType?.startsWith('audio');

	if (isAudio) {
		return { width: '280px', height: '120px' };
	}

	if (isImage) {
		const ratio = getAspectRatio(attachment);
		// Calculate width based on aspect ratio, keeping a consistent height
		const height = 240;
		const width = Math.round(height * ratio);
		return {
			width: `${Math.min(width, 400)}px`,
			height: `${height}px`
		};
	}

	return { width: '280px', height: '180px' };
}

// Update scroll state
function updateScrollState() {
	if (!scrollContainer.value) return;
	const el = scrollContainer.value;
	canScrollLeft.value = el.scrollLeft > 10;
	canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10;
}

// Scroll by direction (-1 for left, 1 for right)
function scrollBy(direction: number) {
	if (!scrollContainer.value) return;
	const el = scrollContainer.value;
	const scrollAmount = el.clientWidth * 0.75;
	el.scrollBy({
		left: scrollAmount * direction,
		behavior: 'smooth'
	});
}

// Open the shared LightGallery viewer for every supported media attachment.
function openViewer(index: number) {
	const attachment = displayAttachments.value[index];
	if (!attachment) return;

	const mediaAttachments = props.attachments.filter(
		mediaAttachment =>
			isImageFile(mediaAttachment) ||
			isVideoFile(mediaAttachment) ||
			isAudioFile(mediaAttachment),
	);
	const mediaIndex = mediaAttachments.findIndex(media => media.id === attachment.id);
	if (mediaIndex >= 0) {
		openLightboxModal(mediaAttachments, mediaIndex);
	}
}

// Initialize scroll state on mount
onMounted(() => {
	nextTick(() => {
		updateScrollState();
	});
});
</script>

<style scoped>
.scrollbar-hide {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
	display: none;
}
</style>
