<template>
	<NuxtLayout name="app">
		<!-- Mobile Header -->
		<div class="lg:hidden sticky z-10 mb-4 -mx-4 -mt-4 top-16">
			<div
				class="flex items-center gap-4 bg-base-100 pl-6 pr-4 py-3"
			>
				<button class="btn -ml-2 btn-circle btn-ghost btn-sm" @click="handleBack">
					<IconArrowLeft class="w-5 h-5" />
				</button>
				<div class="flex-1">
					<h1 class="text-lg font-bold">{{ t('post.title') }}</h1>
				</div>
				<button class="btn btn-sm btn-primary gap-1" @click="() => handleReply(post)">
					<IconReply class="w-4 h-4" />
					<span class="hidden sm:inline">{{ t('post.replyBtn') }}</span>
				</button>
			</div>
		</div>

		<div class="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-6">
			<!-- Main Content -->
			<div class="min-w-0">
				<ConfuseSpinner
					v-if="postStatus === 'pending'"
					:message="t('post.loading')"
				/>

				<template v-else-if="post">
					<!-- Original Post -->
					<PostCard
						:post="post"
						:is-detail="true"
						@boost="handleBoost"
						@share="handleShare"
						@reply="handleReply"
						@refresh="refreshPost"
					/>

					<!-- Interaction Tabs -->
					<div class="mt-6">
						<TabsRoot default-value="replies" class="w-full">
							<!-- Tab Bar -->
							<TabsList class="tabs tabs-box bg-base-200/50 p-1 mb-4 overflow-x-auto scrollbar-none">
								<TabsTrigger
									v-for="tab in interactionTabs"
									:key="tab.value"
									:value="tab.value"
							class="tab flex-1 gap-1.5 whitespace-nowrap"
						>
							<component :is="tab.icon" class="h-4 w-4 shrink-0" />
									<span>{{ tab.label }}</span>
								</TabsTrigger>
							</TabsList>

							<!-- Replies Tab -->
							<TabsContent value="replies" class="space-y-4">
							<!-- Reply Input -->
							<div v-if="isAuthenticated" class="card bg-base-100">
								<div class="card-body p-4">
									<div class="flex gap-3">
										<div v-if="userAvatar" class="avatar shrink-0">
											<div class="h-8 w-8 rounded-full">
												<FileImage
													:file="userAvatar"
													:alt="userName"
													class="h-full w-full rounded-full object-cover"
												/>
											</div>
										</div>
										<div v-else class="avatar avatar-placeholder shrink-0">
											<div class="h-8 w-8 rounded-full bg-primary text-primary-content">
												<span class="text-xs font-medium">{{ userInitials }}</span>
											</div>
										</div>
										<div class="flex-1">
											<textarea
												v-model="replyContent"
												:placeholder="t('post.replyPlaceholder')"
												class="textarea textarea-bordered w-full min-h-[80px] resize-none"
											/>
											<div class="flex justify-end mt-2">
												<button
													class="btn btn-primary btn-sm gap-1"
													:disabled="!replyContent.trim() || submittingReply"
													@click="submitReply"
												>
													<IconSend class="w-4 h-4" />
													{{ t('post.replySubmit') }}
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Replies List -->
							<div class="space-y-4">
								<PostCard
									v-for="reply in replies"
									:key="reply.id"
									:post="reply"
									:show-reference="false"
									@boost="handleBoost"
									@share="handleShare"
									@reply="handleReply"
								/>
							</div>

							<!-- Empty State -->
								<div
									v-if="replies.length === 0"
									class="text-center py-12"
								>
									<IconMessageCircle class="w-12 h-12 mx-auto text-base-content/20 mb-4" />
									<p class="text-base-content/50">
										{{ t('post.noReplies') }}
									</p>
								</div>
							</TabsContent>

							<!-- Forwards Tab -->
							<TabsContent value="forwards" class="space-y-4">
							<div class="space-y-4">
								<PostCard
									v-for="forward in forwards"
									:key="forward.id"
									:post="forward"
									:show-reference="false"
									@boost="handleBoost"
									@share="handleShare"
									@reply="handleReply"
								/>
							</div>

								<div
									v-if="forwards.length === 0"
									class="text-center py-12"
								>
									<IconForward class="w-12 h-12 mx-auto text-base-content/20 mb-4" />
									<p class="text-base-content/50">
										{{ t('post.noForwards') }}
									</p>
								</div>
							</TabsContent>

							<!-- Boosts Tab -->
							<TabsContent value="boosts" class="space-y-2">
							<div
								v-for="boost in boosts"
								:key="boost.id"
								class="card bg-base-100"
							>
								<div class="card-body p-3">
									<div class="flex items-center gap-3">
										<NuxtLink
											v-if="boost.account"
											:to="`/publishers/${boost.account.name}`"
											class="avatar"
										>
											<div class="h-10 w-10 rounded-full">
												<FileImage
													v-if="getAccountAvatar(boost.account)"
													:file="getAccountAvatar(boost.account)"
													:alt="boost.account.nick || boost.account.name"
													class="h-full w-full rounded-full object-cover"
												/>
												<div
													v-else
													class="h-10 w-10 rounded-full bg-primary text-primary-content flex items-center justify-center"
												>
													<span class="text-sm font-medium">
														{{ getInitials(boost.account.nick || boost.account.name) }}
													</span>
												</div>
											</div>
										</NuxtLink>
										<div class="flex-1 min-w-0">
											<AccountName
												v-if="boost.account"
												:account="boost.account"
												size="sm"
											/>
											<p class="text-xs text-base-content/50">
												{{ t('post.boostedTime', { time: formatRelativeTime(boost.boostedAt) }) }}
											</p>
										</div>
									</div>
								</div>
							</div>

								<div
									v-if="boosts.length === 0"
									class="text-center py-12"
								>
									<IconRepeat2 class="w-12 h-12 mx-auto text-base-content/20 mb-4" />
									<p class="text-base-content/50">
										{{ t('post.noBoosts') }}
									</p>
								</div>
							</TabsContent>

							<!-- Reactions Tab -->
							<TabsContent value="reactions" class="space-y-2">
							<div
								v-for="reaction in reactionList"
								:key="reaction.id"
								class="card bg-base-100"
							>
								<div class="card-body p-3">
									<div class="flex items-center gap-3">
										<NuxtLink
											v-if="reaction.account"
											:to="`/publishers/${reaction.account.name}`"
											class="avatar"
										>
											<div class="h-10 w-10 rounded-full">
												<FileImage
													v-if="getAccountAvatar(reaction.account)"
													:file="getAccountAvatar(reaction.account)"
													:alt="reaction.account.nick || reaction.account.name"
													class="h-full w-full rounded-full object-cover"
												/>
												<div
													v-else
													class="h-10 w-10 rounded-full bg-primary text-primary-content flex items-center justify-center"
												>
													<span class="text-sm font-medium">
														{{ getInitials(reaction.account.nick || reaction.account.name) }}
													</span>
												</div>
											</div>
										</NuxtLink>
										<div class="flex-1 min-w-0">
											<AccountName
												v-if="reaction.account"
												:account="reaction.account"
												size="sm"
											/>
											<p class="text-xs text-base-content/50">
												{{ formatRelativeTime(reaction.createdAt) }}
											</p>
										</div>
										<div class="flex items-center gap-2">
											<span class="text-xs text-base-content/60">
												{{ getReactionLabel(reaction.symbol) }}
											</span>
											<img
												v-if="hasSticker(reaction.symbol)"
												:src="getStickerUrl(reaction.symbol)"
												:alt="getReactionLabel(reaction.symbol)"
												class="w-6 h-6 object-contain"
											>
											<span v-else class="text-lg">
												{{ getReactionEmoji(reaction.symbol) }}
											</span>
										</div>
									</div>
								</div>
							</div>

								<div
									v-if="reactionList.length === 0"
									class="text-center py-12"
								>
									<IconSmilePlus class="w-12 h-12 mx-auto text-base-content/20 mb-4" />
									<p class="text-base-content/50">
										{{ t('post.noReactions') }}
									</p>
								</div>
							</TabsContent>
						</TabsRoot>
					</div>
				</template>

				<!-- Error State -->
				<div v-else class="alert alert-warning">
					<IconAlertTriangle class="w-5 h-5" />
					<span>{{ t('post.notFound') }}</span>
				</div>
			</div>

			<!-- Right Sidebar - Publisher Info (20rem, matches ExploreSidebar rail) -->
			<aside class="hidden w-full self-start sticky top-20 xl:block">
				<PublisherSidebar
					v-if="post?.publisher"
					:publisher="post?.publisher"
				/>
			</aside>
		</div>
	</NuxtLayout>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post';
import type { Boost, PostReaction } from '~/utils/api';
import {
	fetchPost,
	fetchPostReplies,
	fetchPostForwards,
	fetchPostBoosts,
	fetchPostReactionList,
} from '~/utils/api';
import { getFileUrl } from '~/utils/files';
import {
	IconArrowLeft,
	IconReply,
	IconAlertTriangle,
	IconMessageCircle,
	IconForward,
	IconRepeat2,
	IconSmilePlus,
	IconSend,
} from '#components';
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const { isAuthenticated, user } = auth;

const postId = computed(() => route.params.id as string);

// Tab state is managed by reka-ui TabsRoot

// Reply state
const replyContent = ref('');
const submittingReply = ref(false);

// User info
const userName = computed(() => user.value?.nick || user.value?.name || '');
const userAvatar = computed(() => user.value?.profile?.picture ?? null);
const userInitials = computed(() => {
	const name = user.value?.name || '?';
	return name.slice(0, 2).toUpperCase();
});

// Load the primary post and secondary interaction lists together. These are
// independent requests; keeping them in one async-data wave removes four
// serial network round trips during navigation.
const [
	{
		data: post,
		status: postStatus,
		refresh: refreshPost,
	},
	{ data: replies },
	{ data: forwards },
	{ data: boosts },
	{ data: reactionList },
] = await Promise.all([
	useAsyncData(
		() => `post-${postId.value}`,
		() => fetchPost(postId.value),
		{ watch: [postId] },
	),
	useAsyncData(
		() => `post-replies-${postId.value}`,
		() => fetchPostReplies(postId.value),
		{ watch: [postId], default: () => [] },
	),
	useAsyncData(
		() => `post-forwards-${postId.value}`,
		async () => {
			const result = await fetchPostForwards(postId.value);
			return result.posts;
		},
		{ watch: [postId], default: () => [] },
	),
	useAsyncData(
		() => `post-boosts-${postId.value}`,
		async () => {
			const result = await fetchPostBoosts(postId.value);
			return result.items;
		},
		{ watch: [postId], default: () => [] },
	),
	useAsyncData(
		() => `post-reactions-${postId.value}`,
		async () => {
			const result = await fetchPostReactionList(postId.value);
			return result.items;
		},
		{ watch: [postId], default: () => [] },
	),
]);

// Tab configuration
const { t } = useI18n();

const interactionTabs = computed(() => [
	{
		value: 'replies',
		label: t('post.tabReplies'),
		icon: IconMessageCircle,
		count: replies.value?.length,
	},
	{
		value: 'forwards',
		label: t('post.tabForwards'),
		icon: IconForward,
		count: forwards.value?.length,
	},
	{
		value: 'boosts',
		label: t('post.tabBoosts'),
		icon: IconRepeat2,
		count: boosts.value?.length,
	},
	{
		value: 'reactions',
		label: t('post.tabReactions'),
		icon: IconSmilePlus,
		count: reactionList.value?.length,
	},
]);

// Sticker helpers
const stickerSymbols = new Set([
	'thumb_up', 'heart', 'clap', 'party', 'laugh', 'cry', 'angry', 'confuse', 'pray',
	'thumb_down', 'thinking', 'speechless', 'hello', 'eat', 'onegai', 'sleepy', 'sorry',
	'ridicule', 'salute', 'shock',
]);

function hasSticker(symbol: string): boolean {
	return stickerSymbols.has(symbol.toLowerCase());
}

function getStickerUrl(symbol: string): string {
	return `/images/stickers/${symbol.toLowerCase()}.webp`;
}

function getReactionEmoji(symbol: string): string {
	const emojiMap: Record<string, string> = {
		thumb_up: '👍',
		heart: '❤️',
		clap: '👏',
		party: '🎉',
		laugh: '😂',
		cry: '😭',
		angry: '😡',
		confuse: '🧐',
		pray: '🙏',
		hello: '👋',
		shock: '😱',
		speechless: '😶',
		ridicule: '😏',
		salute: '🫡',
		thumb_down: '👎',
	};
	return emojiMap[symbol.toLowerCase()] || '❓';
}

function getReactionLabel(symbol: string): string {
	const labelMap: Record<string, string> = {
		thumb_up: t('post.reactionLike'),
		heart: t('post.reactionHeart'),
		clap: t('post.reactionClap'),
		party: t('post.reactionParty'),
		laugh: t('post.reactionLaugh'),
		cry: t('post.reactionCry'),
		angry: t('post.reactionAngry'),
		confuse: t('post.reactionConfused'),
		pray: t('post.reactionPray'),
		thumb_down: t('post.reactionDislike'),
		thinking: t('post.reactionThinking'),
		speechless: t('post.reactionSpeechless'),
		hello: t('post.reactionHello'),
		eat: t('post.reactionEat'),
		onegai: t('post.reactionPlease'),
		sleepy: t('post.reactionSleepy'),
		sorry: t('post.reactionSorry'),
		ridicule: t('post.reactionRidicule'),
		salute: t('post.reactionSalute'),
		shock: t('post.reactionShock'),
	};
	return labelMap[symbol.toLowerCase()] || symbol;
}

// Helper functions
function getAccountAvatar(account: { profile?: { picture?: { id: string } } }) {
	return account.profile?.picture ?? null;
}

function getInitials(name: string): string {
	if (!name || name === 'Unknown') return '?';
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function formatRelativeTime(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return t('post.justNow');
	if (minutes < 60) return t('post.minutesAgo', { m: minutes });
	if (hours < 24) return t('post.hoursAgo', { h: hours });
	if (days < 7) return t('post.daysAgo', { d: days });
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// SEO computed properties
const seoTitle = computed(() => {
	if (!post.value) return 'Solar Network'
	return post.value.title || `${post.value.publisher?.nick || post.value.publisher?.name}'s Post`
})

const seoDescription = computed(() => {
	if (!post.value) return ''
	return post.value.description || post.value.content.slice(0, 160)
})

const seoImageUrl = computed(() => {
	if (!post.value) return ''
	return post.value.attachments[0]?.url || getFileUrl(post.value.attachments[0]?.id) || ''
})

const authorAvatarId = computed(() => post.value?.publisher?.picture?.id || '')
const authorName = computed(() => post.value?.publisher?.nick || post.value?.publisher?.name || 'Unknown')

// OG Image - pass only ID, component fetches data server-side
defineOgImage('PostOgImage', { postId: computed(() => route.params.id as string) })

// SEO Meta Tags
useSolarSeo({
	title: () => seoTitle.value,
	description: () => seoDescription.value,
	image: () => seoImageUrl.value || undefined,
	url: () => post.value ? `https://solian.app/posts/${post.value.id}` : 'https://solian.app',
	type: 'article',
	datePublished: () => post.value?.createdAt,
	dateModified: () => post.value?.updatedAt,
	author: () => post.value?.publisher?.nick || post.value?.publisher?.name,
	publisher: 'Solar Network',
	breadcrumbs: () => post.value ? [
		{ name: 'Home', item: 'https://solian.app' },
		{ name: seoTitle.value, item: `https://solian.app/posts/${post.value.id}` }
	] : []
});

function handleBack() {
	if (typeof window !== 'undefined' && window.history.length > 1) {
		router.back();
		return;
	}
	router.push('/');
}

function handleReply(post?: Post) {
	if (post) {
		const compose = useCompose();
		compose.initializeFromState({
			content: '',
			replyingTo: post,
		});
		const event = new CustomEvent('open-compose');
		window.dispatchEvent(event);
	}
}

function handleBoost(_p: Post) {
	// TODO: Implement boost
}

function handleShare(p: Post) {
	if (navigator.share) {
		navigator.share({
			title: p.title || t('home.sharePostFallbackTitle'),
			text: p.content.slice(0, 100),
			url: window.location.href,
		});
	}
}

async function submitReply() {
	if (!replyContent.value.trim() || submittingReply.value) return;

	submittingReply.value = true;
	try {
		// TODO: Implement reply submission via API
		replyContent.value = '';
		// Refresh replies
	} catch (e) {
		console.error('Failed to submit reply:', e);
	} finally {
		submittingReply.value = false;
	}
}
</script>

<style scoped>
.scrollbar-none {
	-ms-overflow-style: none;
	scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
	display: none;
}
</style>
