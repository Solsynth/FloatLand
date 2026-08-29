<template>
	<div class="auth-page">
		<div class="auth-panel auth-panel--compact">
			<ConfuseSpinner v-if="loading" message="Loading..." />

			<template v-else-if="status">
				<!-- Pending: show approval UI -->
				<template v-if="status.status === 'pending'">
					<div class="flex flex-col items-center text-center mb-6">
						<div class="auth-status-icon bg-primary/15 text-primary">
							<IconPlug class="w-7 h-7 text-primary" />
						</div>
						<h1 class="text-2xl font-bold">Device Authorization</h1>
						<p class="text-sm text-base-content/60 mt-1">
							A device is requesting access to your account
						</p>
						<div class="mt-4 flex items-center gap-3 text-left">
							<div class="avatar">
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
							<div class="min-w-0">
								<p class="font-bold text-base truncate">{{ clientInfo?.clientName || status.clientName || status.clientId }}</p>
								<p class="text-sm text-base-content/50">wants access to your account</p>
							</div>
						</div>
					</div>

					<div v-if="error" class="alert alert-error text-sm mb-4">
						<IconAlertCircle class="w-4 h-4" />
						<span>{{ error }}</span>
					</div>

					<div class="auth-detail-block mb-4">
						<p class="text-xs text-base-content/50 mb-2">User Code</p>
						<p class="text-2xl font-mono font-bold tracking-wider">{{ status.userCode }}</p>
					</div>

					<div class="auth-detail-block mb-6">
						<p class="mb-3 text-sm font-semibold flex items-center gap-2">
							<IconShield class="w-4 h-4 text-primary" />
							Requested permissions
						</p>
						<ul v-if="status.scopes?.length" class="space-y-2 text-sm">
							<li v-for="scope in status.scopes" :key="scope" class="flex items-start gap-2">
								<IconAlertTriangle v-if="scope === '*'" class="w-4 h-4 mt-0.5 text-warning flex-shrink-0" />
								<IconCheck v-else class="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
								<span>{{ getScopeLabel(scope) }}</span>
							</li>
						</ul>
						<p v-else class="text-sm text-base-content/60">No explicit scopes requested.</p>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<button class="btn btn-primary" :disabled="isSubmitting" @click="handleApprove">
							<IconLoader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
							<IconCheck v-else class="w-4 h-4" />
							Approve
						</button>
						<button class="btn btn-outline" :disabled="isSubmitting" @click="handleDecline">
							<IconX class="w-4 h-4" />
							Deny
						</button>
					</div>
				</template>

				<!-- Already approved/declined/expired -->
				<div v-else class="flex flex-col items-center justify-center py-8 text-center">
					<div
						class="auth-status-icon mb-4"
						:class="{
							'bg-success/20': status.status === 'approved',
							'bg-error/20': status.status === 'declined' || status.status === 'expired',
						}"
					>
						<IconCheck v-if="status.status === 'approved'" class="w-8 h-8 text-success" />
						<IconX v-else class="w-8 h-8 text-error" />
					</div>
					<h2 class="text-xl font-bold">
						{{ status.status === 'approved' ? 'Device Authorized' : status.status === 'expired' ? 'Code Expired' : 'Request Denied' }}
					</h2>
					<p class="text-base-content/60 text-sm mt-1">
						{{ status.status === 'approved' ? 'You can close this page.' : status.status === 'expired' ? 'This code has expired. Request a new one from your device.' : 'The device request was denied.' }}
					</p>
				</div>
			</template>

			<!-- Error state -->
			<div v-else class="flex flex-col items-center justify-center py-8 text-center">
				<div class="auth-status-icon mb-4 bg-error/20">
					<IconAlertCircle class="w-8 h-8 text-error" />
				</div>
				<h2 class="text-xl font-bold">Invalid Code</h2>
				<p class="text-base-content/60 text-sm mt-1">
					{{ error || 'Could not find this device code.' }}
				</p>
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
} from '#components';
import type { AuthorizeClientInfo } from '~/utils/api';

definePageMeta({
	layout: false,
	middleware: 'auth',
});

defineOgImage('UniOgImage', { title: 'Device Authorization', description: 'Authorize a device to access your Solar Network account.' })

useSolarSeo({
	title: "Device Authorization",
	description: "Authorize a device to access your Solar Network account.",
});

const route = useRoute();
const loading = ref(true);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

const status = ref<{
	userCode: string;
	clientId: string;
	clientName?: string;
	picture?: { id?: string };
	scopes: string[];
	status: string;
	expiresAt: string;
} | null>(null);
const clientInfo = ref<AuthorizeClientInfo | null>(null);

const clientPictureUrl = computed(() => {
	return clientInfo.value?.picture || status.value?.picture || null;
});

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

async function loadStatus() {
	const code = route.query.code as string;
	if (!code) {
		loading.value = false;
		return;
	}

	try {
		const { getAuthorizeClientInfo, getDeviceCodeStatus } = await import('~/utils/api');
		status.value = await getDeviceCodeStatus(code);
		try {
			clientInfo.value = await getAuthorizeClientInfo(
				new URLSearchParams({ client_id: status.value.clientId }),
			);
		} catch (e) {
			console.warn('Failed to load device client info:', e);
		}
	} catch (e) {
		console.error('Failed to load device code:', e);
		error.value = e instanceof Error ? e.message : 'Failed to load device code';
	} finally {
		loading.value = false;
	}
}

async function handleApprove() {
	isSubmitting.value = true;
	error.value = null;
	try {
		const { approveDeviceCode } = await import('~/utils/api');
		await approveDeviceCode(route.query.code as string);
		status.value = { ...status.value!, status: 'approved' };
	} catch (e) {
		error.value = e instanceof Error ? e.message : 'Failed to approve';
	} finally {
		isSubmitting.value = false;
	}
}

async function handleDecline() {
	isSubmitting.value = true;
	error.value = null;
	try {
		const { declineDeviceCode } = await import('~/utils/api');
		await declineDeviceCode(route.query.code as string);
		status.value = { ...status.value!, status: 'declined' };
	} catch (e) {
		error.value = e instanceof Error ? e.message : 'Failed to decline';
	} finally {
		isSubmitting.value = false;
	}
}

onMounted(() => {
	loadStatus();
});
</script>
