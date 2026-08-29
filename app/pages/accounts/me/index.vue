<template>
	<NuxtLayout name="app">
		<ConfuseSpinner
			v-if="isLoading || authStore.isLoading"
			message="Loading profile..."
		/>

		<div
			v-else-if="!authStore.isAuthenticated"
			class="mx-auto max-w-md p-6"
		>
			<div class="card">
				<div class="card-body items-center text-center gap-4">
					<IconUser class="text-base-content/50 w-12 h-12" />
					<h1 class="text-xl font-bold">Not Signed In</h1>
					<p class="text-base-content/60">
						Sign in to view your profile.
					</p>
					<div class="flex gap-2">
						<NuxtLink to="/login" class="btn btn-primary">
							Sign In
						</NuxtLink>
						<NuxtLink to="/register" class="btn btn-outline">
							Create Account
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>

		<div v-else-if="authStore.user" class="mx-auto max-w-6xl">
			<!-- Content Grid -->
			<div class="grid gap-4 px-4 py-4 lg:px-6 lg:grid-cols-3">
				<!-- Left Column - Main Content -->
				<div class="lg:col-span-2">
					<!-- Profile Header -->
					<section class="relative overflow-hidden">
						<div
							class="h-32 w-full overflow-hidden rounded-box bg-base-200 sm:h-40"
						>
							<FileImage
								v-if="backgroundUrl"
								:file="backgroundUrl"
								:alt="`${displayName} background`"
								class="h-full w-full object-cover"
							/>
						</div>
						<div
							class="mx-auto -mt-16 flex flex-col gap-3 px-4 pb-4 sm:-mt-16 sm:flex-row sm:items-end"
						>
							<div class="shrink-0 mb-12">
								<div v-if="avatarUrl" class="avatar">
									<div
										class="h-20 w-20 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-24 sm:w-24"
									>
										<FileImage
											:file="avatarUrl"
											:alt="displayName"
										/>
									</div>
								</div>
								<div v-else class="avatar avatar-placeholder">
									<div
										class="h-20 w-20 rounded-box bg-primary text-primary-content ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-24 sm:w-24"
									>
                                        <span class="text-xl font-semibold">
                                            {{ getInitials(displayName) }}
                                        </span>
									</div>
								</div>
							</div>
							<div class="min-w-0 flex-1 lg:pt-20 max-lg:-mt-10">
								<div class="flex flex-wrap items-center gap-2">
									<h1
										class="truncate text-xl font-black sm:text-2xl"
									>
										{{ displayName }}
									</h1>
									<span
										v-if="authStore.user.profile?.verification"
										class="badge gap-1 badge-primary"
									>
                      <IconShieldCheck class="w-3 h-3" />
                      {{ authStore.user.profile.verification.title || 'Verified' }}
                  </span>
								</div>
								<p
									class="truncate text-sm text-base-content/60"
								>
									@{{ authStore.user.name }}
								</p>
								<ActivityPresence
									:account="authStore.user"
									class="mt-1"
								/>
							</div>
						</div>
					</section>

					<!-- Compact Bio -->
					<div class="card mb-4">
						<div class="card-body p-4">
							<!-- eslint-disable vue/no-v-html -->
							<div
								v-if="bioHtml"
								class="prose prose-sm max-w-none break-words line-clamp-3 prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:break-all prose-code:text-primary prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic"
								v-html="bioHtml"
								@click="handleMarkdownClick"
							/>
							<!-- eslint-enable vue/no-v-html -->
							<p
								v-else
								class="text-sm text-base-content/50 italic"
							>
								No bio yet.
							</p>
						</div>
					</div>

					<!-- Menu Items -->
					<div class="space-y-3">
						<!-- Profile Section -->
						<div class="card bg-base-100">
							<div class="card-body p-2">
								<NuxtLink
									:to="`/accounts/${authStore.user.name}`"
									class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
								>
									<IconUser
										class="w-5 h-5 text-base-content/70"
									/>
									<span class="flex-1">
										View Public Profile
									</span>
									<IconChevronRight
										class="w-4 h-4 text-base-content/50"
									/>
								</NuxtLink>

								<NuxtLink
									to="/accounts/me/settings"
									class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
								>
									<IconSettings
										class="w-5 h-5 text-base-content/70"
									/>
									<span class="flex-1">Edit Profile</span>
									<IconChevronRight
										class="w-4 h-4 text-base-content/50"
									/>
								</NuxtLink>
							</div>
						</div>

						<!-- Account Section -->
						<div class="card bg-base-100">
							<div class="card-body p-2">
							<NuxtLink
								to="/accounts/me/activation"
								class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
							>
								<IconShieldCheck class="w-5 h-5 text-base-content/70" />
								<span class="flex-1">Account activation</span>
								<IconChevronRight class="w-4 h-4 text-base-content/50" />
							</NuxtLink>
							<NuxtLink
								to="/accounts/me/wallet"
								class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
							>
								<IconCreditCard
									class="w-5 h-5 text-base-content/70"
								/>
								<span class="flex-1">Wallet</span>
								<IconChevronRight
									class="w-4 h-4 text-base-content/50"
								/>
							</NuxtLink>

							<a
								href="https://api.solian.app/passport/accounts/me/passbook/member"
								target="_blank"
								rel="noopener"
								class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
							>
								<IconWallet
									class="w-5 h-5 text-base-content/70"
								/>
								<span class="flex-1">Add Solarpass to Apple Wallet</span>
								<IconExternalLink
									class="w-4 h-4 text-base-content/50"
								/>
							</a>

								<NuxtLink
									to="/accounts/me/badges"
									class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
								>
									<IconMedal
										class="w-5 h-5 text-base-content/70"
									/>
									<span class="flex-1">Badges</span>
									<IconChevronRight
										class="w-4 h-4 text-base-content/50"
									/>
								</NuxtLink>

								<NuxtLink
									to="/accounts/me/relationships"
									class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
								>
									<IconUsers
										class="w-5 h-5 text-base-content/70"
									/>
									<span class="flex-1">Relationships</span>
									<IconChevronRight
										class="w-4 h-4 text-base-content/50"
									/>
								</NuxtLink>

								<NuxtLink
									to="/accounts/me/notifications"
									class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
								>
									<IconBell
										class="w-5 h-5 text-base-content/70"
									/>
									<span class="flex-1">Notifications</span>
									<span
										v-if="unreadCount > 0"
										class="badge badge-primary badge-sm"
									>
                                        {{ unreadCount }}
                                    </span>
									<IconChevronRight
										class="w-4 h-4 text-base-content/50"
									/>
								</NuxtLink>
							</div>
						</div>

						<!-- Settings Section -->
						<div class="card bg-base-100">
							<div class="card-body p-2">
								<NuxtLink
									to="/settings"
									class="flex items-center gap-3 p-3 rounded-box hover:bg-base-200 transition-colors"
								>
									<IconSettings
										class="w-5 h-5 text-base-content/70"
									/>
									<span class="flex-1">App Settings</span>
									<IconChevronRight
										class="w-4 h-4 text-base-content/50"
									/>
								</NuxtLink>

								<button
									class="flex w-full items-center gap-3 rounded-box p-3 text-left transition-colors hover:bg-base-200"
									@click="showLogoutConfirm = true"
								>
									<IconLogOut class="w-5 h-5 text-error" />
									<span class="flex-1 text-error"
									>Log Out</span
									>
									<IconChevronRight
										class="w-4 h-4 text-base-content/50"
									/>
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Column - Sidebar -->
				<div class="space-y-4 hidden lg:block">
					<!-- Leveling Progress -->
					<LevelingProgress
						v-if="authStore.user.profile?.level"
						:level="authStore.user.profile.level"
						:experience="authStore.user.profile.experience || 0"
						:progress="authStore.user.profile.levelingProgress || 0"
					/>
				</div>
			</div>
		</div>

		<!-- Logout Confirmation Modal -->
		<dialog :open="showLogoutConfirm" class="modal">
			<div class="modal-box max-w-sm">
				<h3 class="font-bold text-lg">Log Out</h3>
				<p class="py-4">Are you sure you want to log out?</p>
				<div class="modal-action">
					<form method="dialog">
						<button
							class="btn btn-ghost"
							@click="showLogoutConfirm = false"
						>
							Cancel
						</button>
					</form>
					<button
						class="btn btn-error"
						:disabled="isLoggingOut"
						@click="logout"
					>
						<IconLoader
							v-if="isLoggingOut"
							class="w-4 h-4 animate-spin"
						/>
						<IconLogOut v-else class="w-4 h-4" />
						Log Out
					</button>
				</div>
			</div>
			<form method="dialog" class="modal-backdrop">
				<button @click="showLogoutConfirm = false">close</button>
			</form>
		</dialog>
	</NuxtLayout>
</template>

<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown';
import { useAuthStore } from '~/stores/auth';
import {
	IconUser,
	IconShieldCheck,
	IconSettings,
	IconChevronRight,
	IconCreditCard,
	IconMedal,
	IconUsers,
	IconBell,
	IconLogOut,
	IconLoader
} from '#components';

const authStore = useAuthStore();
const router = useRouter();

const isLoading = ref(true);
const isLoggingOut = ref(false);
const showLogoutConfirm = ref(false);
const unreadCount = ref(0);

const displayName = computed(
	() => authStore.user?.nick || authStore.user?.name || 'Unknown'
);
const avatarUrl = computed(() => authStore.user?.profile?.picture ?? null);
const backgroundUrl = computed(() => authStore.user?.profile?.background ?? null);
const bioHtml = computed(() => {
	if (!authStore.user?.profile?.bio) return '';
	return renderMarkdown(authStore.user.profile.bio);
});

function getInitials(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.map((p) => p[0]?.toUpperCase())
			.slice(0, 2)
			.join('') || '?'
	);
}

async function logout() {
	isLoggingOut.value = true;
	try {
		await authStore.logout();
		showLogoutConfirm.value = false;
		await router.push('/');
	} finally {
		isLoggingOut.value = false;
	}
}

function handleMarkdownClick(e: MouseEvent) {
	const target = e.target as HTMLElement;
	if (target.closest('.mention-chip')) {
		e.preventDefault();
		const href = target.closest('a')?.getAttribute('href');
		if (href) {
			navigateTo(href);
		}
		return;
	}
	if (target.classList.contains('spoiler')) {
		target.classList.toggle('revealed');
	}
}

onMounted(async () => {
	isLoading.value = true;
	try {
		// Wait for auth to be initialized
		if (!authStore.isAuthenticated) {
			await authStore.initAuth();
		}
		// If still no user data but we have a token, fetch it
		if (authStore.isAuthenticated && !authStore.user) {
			await authStore.fetchUser();
		}
	} finally {
		isLoading.value = false;
	}
});

defineOgImage('UniOgImage', { title: 'My Account' })

useSolarSeo({
	title: 'My Account',
});
</script>
