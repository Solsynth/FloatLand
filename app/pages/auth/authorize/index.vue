<template>
	<div class="auth-page auth-page--authorization">
		<div class="auth-panel auth-panel--authorization">
			<div class="grid md:grid-cols-[1fr_1.1fr]">
				<!-- Left Column: Branding & App -->
				<section
				class="auth-rail auth-authorization__rail"
				>
					<div class="flex flex-col gap-5">
						<img src="/favicon.png" alt="Solar Network" class="auth-brand-mark">
						<div>
							<h1 class="text-3xl leading-tight font-black">Grant Access</h1>
							<p class="text-sm text-base-content/60 mt-2">
								Review the permissions before authorizing this application.
							</p>
						</div>
					</div>

					<!-- User Account Info -->
					<div
						v-if="auth.user.value"
						class="auth-detail-block flex items-center gap-3"
					>
						<div class="avatar">
							<div class="w-11 h-11 rounded-full overflow-hidden">
								<FileImage
									v-if="userAvatarUrl"
									:file="userAvatarUrl"
									loading="lazy"
									class="w-full h-full object-cover"
								/>
								<div
									v-else
									class="w-full h-full flex items-center justify-center bg-primary/15 text-primary"
								>
									<IconUser class="w-5 h-5" />
								</div>
							</div>
						</div>
						<div class="min-w-0">
							<p class="font-bold truncate text-sm">
								{{ auth.user.value?.nick || auth.user.value?.name || 'Unknown User' }}
							</p>
							<p class="text-xs text-base-content/50 truncate">
								@{{ auth.user.value?.name }}
							</p>
						</div>
					</div>
				</section>

				<!-- Right Column: Permissions & Actions -->
				<section class="auth-main min-h-96 justify-between">
					<ConfuseSpinner v-if="loading" message="Authorizing..." />

					<template v-else-if="clientInfo">
						<div>
							<!-- Error Message -->
							<div
								v-if="error"
								class="alert alert-error text-sm mb-4"
							>
								<IconAlertCircle class="w-4 h-4" />
								<span>{{ error }}</span>
							</div>

							<!-- App Info Summary -->
							<div class="flex flex-col items-start text-left mb-6">
								<div class="avatar self-start mb-2">
									<div class="w-11 h-11 overflow-hidden rounded-md border border-base-300">
										<FileImage
											v-if="clientPictureUrl"
											:file="clientPictureUrl"
											loading="lazy"
											class="w-full h-full object-cover"
										/>
										<div
											v-else
											class="w-full h-full flex items-center justify-center bg-primary/15 text-primary"
										>
											<IconPlug class="w-5 h-5" />
										</div>
									</div>
								</div>
								<p class="font-bold text-xl">
									{{ clientInfo.clientName || 'Unknown App' }}
								</p>
								<p class="text-sm text-base-content/50">
									wants access to your account
								</p>
								<AppOwnerInfo
									:publisher="appPublisher"
									:verification="appVerification"
									:home-page="appHomePage"
								/>
							</div>

							<!-- Permissions -->
							<div class="auth-detail-block">
								<p class="mb-3 text-sm font-semibold flex items-center gap-2">
									<IconShield class="w-4 h-4 text-primary" />
									Requested permissions
								</p>
								<ul
									v-if="clientInfo.scopes?.length"
									class="space-y-2 text-sm"
								>
								<li
									v-for="scope in clientInfo.scopes"
									:key="scope"
									class="flex items-start gap-2"
								>
									<IconAlertTriangle
										v-if="scope === '*'"
										class="w-4 h-4 mt-0.5 text-warning flex-shrink-0"
									/>
									<IconCheck
										v-else
										class="w-4 h-4 mt-0.5 text-success flex-shrink-0"
									/>
									<span>{{ getScopeLabel(scope) }}</span>
								</li>
							</ul>
								<p v-else class="text-sm text-base-content/60">
									No explicit scopes provided.
								</p>
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="mt-6 grid grid-cols-2 gap-3">
							<button
								class="btn btn-primary"
								:disabled="isAuthorizing"
								@click="handleApprove"
							>
								<IconLoader
									v-if="isAuthorizing"
									class="w-4 h-4 animate-spin"
								/>
								<IconCheck v-else class="w-4 h-4" />
								Authorize
							</button>
							<button
								class="btn btn-outline"
								:disabled="isAuthorizing"
								@click="handleDeny"
							>
								<IconX class="w-4 h-4" />
								Deny
							</button>
						</div>
					</template>

					<!-- Error State -->
					<div
						v-else
						class="flex flex-col items-center justify-center py-8 text-center"
					>
						<div class="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-4">
							<IconAlertCircle class="w-8 h-8 text-error" />
						</div>
						<h2 class="text-xl font-bold">Authorization Failed</h2>
						<p class="text-base-content/60 text-sm mt-1">
							Failed to load authorization request
						</p>
					</div>
				</section>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	IconPlug,
	IconCheck,
	IconAlertTriangle,
	IconAlertCircle,
	IconLoader,
	IconX,
	IconShield,
	IconUser,
} from '#components';
import type { AuthorizeClientInfo, PublicApp } from '~/utils/api';

definePageMeta({
	layout: false,
	middleware: 'auth',
});

defineOgImage('UniOgImage', { title: 'Authorize App', description: 'Authorize an application to access your Solar Network account.' })

useSolarSeo({
	title: "Authorize App",
	description: "Authorize an application to access your Solar Network account.",
});

const route = useRoute();
const auth = useAuth();
const loading = ref(true);
const isAuthorizing = ref(false);
const error = ref<string | null>(null);

const clientInfo = ref<AuthorizeClientInfo | null>(null);
const appInfo = ref<PublicApp | null>(null);

// Cached image URLs
const userAvatarUrl = computed(() => {
	return auth.user.value?.profile?.picture ?? null;
});

const clientPictureUrl = computed(() => {
	return clientInfo.value?.picture ?? appInfo.value?.picture ?? null;
});

// Publisher (developer) and verification mark of the requesting app.
const appPublisher = computed(() => {
	return appInfo.value?.project?.developer?.publisher ?? null;
});

const appVerification = computed(() => {
	return appInfo.value?.verification ?? null;
});

const appHomePage = computed(() => {
	return appInfo.value?.links?.homePage || clientInfo.value?.homeUri || null;
});

// User-friendly scope labels
const scopeLabels: Record<string, string> = {
	openid: 'Read your Solarpass profile',
	profile: 'Read your public profile information',
	email: 'Read your email address',
	'offline_access': 'Access your account when you\'re not logged in',
	'*': 'Full access: this app can do anything as you',
};

function getScopeLabel(scope: string): string {
	return scopeLabels[scope] || scope;
}

async function loadClientInfo() {
	try {
		const query = new URLSearchParams(
			route.query as Record<string, string>
		);
		const { getAuthorizeClientInfo, getPublicApp } = await import('~/utils/api');
		clientInfo.value = await getAuthorizeClientInfo(query);
		// The provider resolves `client_id` to the client slug, which also keys
		// the public app profile (publisher + verification mark).
		if (clientInfo.value.clientId) {
			try {
				appInfo.value = await getPublicApp(clientInfo.value.clientId);
			} catch (e) {
				console.warn('Failed to load app profile:', e);
			}
		}
	} catch (e) {
		console.error('Failed to load client info:', e);
		error.value =
			e instanceof Error ? e.message : 'Failed to load authorization request';
	} finally {
		loading.value = false;
	}
}

async function handleApprove() {
	isAuthorizing.value = true;
	error.value = null;
	try {
		const query = new URLSearchParams(route.query as Record<string, string>);
		const { submitAuthorizeDecision } = await import('~/utils/api');
		const result = await submitAuthorizeDecision(query, true);
		if (result.redirectUri) {
			window.location.href = result.redirectUri;
		} else {
			navigateTo('/');
		}
	} catch (e) {
		error.value =
			e instanceof Error ? e.message : 'Failed to submit authorization';
		isAuthorizing.value = false;
	}
}

async function handleDeny() {
	isAuthorizing.value = true;
	error.value = null;
	try {
		const query = new URLSearchParams(route.query as Record<string, string>);
		const { submitAuthorizeDecision } = await import('~/utils/api');
		const result = await submitAuthorizeDecision(query, false);
		if (result.redirectUri) {
			window.location.href = result.redirectUri;
		} else {
			navigateTo('/');
		}
	} catch (e) {
		error.value = e instanceof Error ? e.message : 'Failed to submit denial';
		isAuthorizing.value = false;
	}
}

onMounted(() => {
	loadClientInfo();
});
</script>
