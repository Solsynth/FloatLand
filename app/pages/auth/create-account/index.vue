<template>
	<div class="auth-page">
		<div class="auth-panel auth-panel--split">
			<div class="grid md:grid-cols-2">
				<!-- Brand rail -->
				<aside class="auth-rail">
					<div>
						<img
							src="/favicon.png"
							alt="Solar Network"
							class="auth-brand-mark"
						>
						<p class="mt-5 text-xs text-base-content/50">
							{{ t("auth.createAccount.step", { step: stepIndex }) }}
						</p>
						<h1 class="mt-1.5 text-xl font-semibold tracking-tight">
							{{ t("auth.createAccount.title") }}
						</h1>
						<p class="mt-1.5 text-sm leading-relaxed text-base-content/60">
							{{ t("auth.createAccount.subtitle") }}
						</p>
					</div>

					<div>
						<!-- Step progress -->
						<div class="mb-1.5 flex items-center justify-between text-xs text-base-content/50">
							<span>{{ stepIndex }} / 5</span>
						</div>
						<div class="flex items-center gap-1">
							<div
								v-for="i in 5"
								:key="i"
								class="h-1 flex-1 rounded-full transition-all duration-300"
								:class="i <= stepIndex ? 'bg-primary' : 'bg-base-300'"
							/>
						</div>

						<p class="mt-6 text-sm text-base-content/70">
							<NuxtLink
								:to="loginHref"
								class="link link-primary font-medium"
							>
								{{ t("auth.signIn") }}
							</NuxtLink>
						</p>
					</div>
				</aside>

				<!-- Form panel -->
				<section class="auth-main">
					<div
						v-if="error"
						class="alert alert-error mb-4 text-sm"
					>
						<IconAlertCircle class="h-4 w-4 shrink-0" />
						<span>{{ error }}</span>
					</div>

					<!-- Step 1: Username & Nickname -->
					<div v-if="stage === 'username-nick'" class="flex flex-1 flex-col space-y-4">
						<fieldset class="fieldset">
							<legend class="fieldset-legend">{{ t("auth.createAccount.username") }}</legend>
							<input
								v-model="form.name"
								type="text"
								name="username"
								autocomplete="username"
								class="input input-bordered w-full"
								:placeholder="t('auth.createAccount.usernamePlaceholder')"
								:disabled="submitting"
								@keydown.enter="next"
							>
							<p class="fieldset-label text-xs text-base-content/50">
								{{ t("auth.createAccount.usernameHint") }}
							</p>
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">{{ t("auth.createAccount.nickname") }}</legend>
							<input
								v-model="form.nick"
								type="text"
								name="nickname"
								autocomplete="nickname"
								class="input input-bordered w-full"
								:placeholder="t('auth.createAccount.nicknamePlaceholder')"
								:disabled="submitting"
								@keydown.enter="next"
							>
						</fieldset>
					</div>

					<!-- Step 2: Email -->
					<div v-if="stage === 'email'" class="flex flex-1 flex-col space-y-4">
						<fieldset class="fieldset">
							<legend class="fieldset-legend">{{ t("auth.createAccount.email") }}</legend>
							<input
								v-model="form.email"
								type="email"
								name="email"
								autocomplete="email"
								class="input input-bordered w-full"
								:placeholder="t('auth.createAccount.emailPlaceholder')"
								:disabled="submitting"
								@keydown.enter="next"
							>
							<p class="fieldset-label text-xs text-base-content/50">
								{{ t("auth.createAccount.emailHint") }}
							</p>
						</fieldset>
					</div>

					<!-- Step 3: Password -->
					<div v-if="stage === 'password'" class="flex flex-1 flex-col space-y-4">
						<fieldset class="fieldset">
							<legend class="fieldset-legend">{{ t("auth.createAccount.password") }}</legend>
							<input
								v-model="form.password"
								type="password"
								name="password"
								autocomplete="new-password"
								class="input input-bordered w-full"
								:placeholder="t('auth.createAccount.passwordPlaceholder')"
								:disabled="submitting"
								@keydown.enter="next"
							>
							<p class="fieldset-label text-xs text-base-content/50">
								{{ t("auth.createAccount.passwordHint") }}
							</p>
						</fieldset>
					</div>

					<!-- Step 4: Captcha -->
					<div v-if="stage === 'captcha'" class="flex flex-1 flex-col items-center justify-center space-y-3">
						<p class="text-sm text-base-content/70">
							{{ t("auth.createAccount.captchaTitle") }}
						</p>
						<CaptchaWidget @verified="onCaptchaVerified" />
						<p v-if="form.captchaToken" class="text-xs text-success">
							<IconCheckCircle class="mr-1 inline h-3 w-3" />
							{{ t("auth.createAccount.captchaSuccess") }}
						</p>
					</div>

					<!-- Step 5: Terms -->
					<div v-if="stage === 'terms'" class="flex flex-1 flex-col space-y-4">
						<div class="rounded-lg border border-base-300 bg-base-200/50 p-4 text-sm text-base-content/80">
							<ul class="list-disc space-y-1 pl-5">
								<li>{{ t("auth.createAccount.termsList1") }}</li>
								<li>{{ t("auth.createAccount.termsList2") }}</li>
								<li>{{ t("auth.createAccount.termsList3") }}</li>
							</ul>
						</div>
						<div class="flex items-center gap-2 text-sm text-base-content/70">
							<IconShieldCheck class="h-4 w-4 shrink-0 text-success" />
							<span>{{ t("auth.createAccount.termsAgree") }}</span>
						</div>
					</div>

					<!-- Navigation -->
					<div class="mt-auto grid grid-cols-2 gap-2 pt-6">
						<NuxtLink
							v-if="stage === 'username-nick'"
							:to="loginHref"
							class="btn btn-ghost"
						>
							{{ t("auth.createAccount.login") }}
						</NuxtLink>
						<button
							v-else
							type="button"
							class="btn btn-ghost"
							:disabled="submitting"
							@click="back"
						>
							<IconArrowLeft class="h-4 w-4" />
							{{ t("auth.back") }}
						</button>

						<button
							v-if="stage !== 'terms'"
							type="button"
							class="btn btn-primary"
							:disabled="!canProceed || submitting"
							@click="next"
						>
							{{ t("auth.createAccount.next") }}
							<IconArrowRight class="h-4 w-4" />
						</button>
						<button
							v-else
							type="button"
							class="btn btn-primary"
							:disabled="submitting"
							@click="handleSubmit"
						>
							<IconLoader
								v-if="submitting"
								class="h-4 w-4 animate-spin"
							/>
							<IconCheckCircle v-else class="h-4 w-4" />
							{{ t("auth.createAccount.createAccount") }}
						</button>
					</div>
				</section>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	IconAlertCircle,
	IconArrowLeft,
	IconArrowRight,
	IconCheckCircle,
	IconShieldCheck,
	IconLoader
} from '#components';

definePageMeta({ layout: false });

const { t } = useI18n();

defineOgImage('UniOgImage', { title: t("auth.seoTitleCreateAccount"), description: t("auth.seoDescriptionCreateAccount") })

useSolarSeo({
    title: t("auth.seoTitleCreateAccount"),
    description: t("auth.seoDescriptionCreateAccount"),
});

type Stage = 'username-nick' | 'email' | 'password' | 'captcha' | 'terms';

const form = reactive({
	name: '',
	nick: '',
	email: '',
	password: '',
	captchaToken: ''
});

const stage = ref<Stage>('username-nick');
const submitting = ref(false);
const error = ref<string | null>(null);
const redirectUrl = ref<string | null>(null);

const loginHref = computed(() =>
	redirectUrl.value
		? `/auth/login?redirect=${encodeURIComponent(redirectUrl.value)}`
		: '/auth/login',
);

const stepIndex = computed(() => {
	const stages: Stage[] = ['username-nick', 'email', 'password', 'captcha', 'terms'];
	return stages.indexOf(stage.value) + 1;
});

const canProceed = computed(() => {
	switch (stage.value) {
		case 'username-nick':
			return /^[A-Za-z0-9_-]{2,256}$/.test(form.name) && form.nick.trim().length > 0 && form.nick.length <= 256;
		case 'email':
			return form.email.trim().length > 0 && !form.email.includes('+') && /.+@.+\..+/.test(form.email);
		case 'password':
			return form.password.length >= 4 && form.password.length <= 128;
		case 'captcha':
			return form.captchaToken.length > 0;
		case 'terms':
			return form.captchaToken.length > 0;
		default:
			return false;
	}
});

function validateCurrentStage(): string | null {
	if (stage.value === 'username-nick') {
		if (!/^[A-Za-z0-9_-]{2,256}$/.test(form.name)) {
			return t("auth.validation.username");
		}
		if (!form.nick.trim() || form.nick.length > 256) {
			return t("auth.validation.nickname");
		}
	}
	if (stage.value === 'email') {
		if (!form.email.trim() || form.email.includes('+') || !/.+@.+\..+/.test(form.email)) {
			return t("auth.validation.email");
		}
	}
	if (stage.value === 'password') {
		if (form.password.length < 4 || form.password.length > 128) {
			return t("auth.validation.password");
		}
	}
	if (stage.value === 'captcha' && !form.captchaToken.trim()) {
		return t("auth.validation.captcha");
	}
	return null;
}

function next() {
	const validationError = validateCurrentStage();
	if (validationError) {
		error.value = validationError;
		return;
	}

	error.value = null;

	if (stage.value === 'username-nick') stage.value = 'email';
	else if (stage.value === 'email') stage.value = 'password';
	else if (stage.value === 'password') stage.value = 'captcha';
	else if (stage.value === 'captcha') stage.value = 'terms';
}

function back() {
	error.value = null;

	if (stage.value === 'email') stage.value = 'username-nick';
	else if (stage.value === 'password') stage.value = 'email';
	else if (stage.value === 'captcha') stage.value = 'password';
	else if (stage.value === 'terms') stage.value = 'captcha';
}

function onCaptchaVerified(token: string) {
	form.captchaToken = token;
	stage.value = 'terms';
}

async function handleSubmit() {
	if (!form.captchaToken.trim()) {
		error.value = t("auth.validation.captchaSubmit");
		stage.value = 'captcha';
		return;
	}

	submitting.value = true;
	error.value = null;

	try {
		const { createAccount } = await import('~/utils/api');
		await createAccount({
			name: form.name.trim(),
			nick: form.nick.trim(),
			email: form.email.trim(),
			password: form.password,
			language: navigator.language?.toLowerCase() || 'en-us',
			captchaToken: form.captchaToken
		});

		const loginUrl = redirectUrl.value
			? `/auth/login?redirect=${encodeURIComponent(redirectUrl.value)}`
			: '/auth/login';
		navigateTo(loginUrl);
	} catch (e) {
		error.value = e instanceof Error ? e.message : t("auth.validation.failedCreate");
	} finally {
		submitting.value = false;
	}
}

onMounted(() => {
	const route = useRoute();
	const tk = route.query.captcha_tk as string;
	if (tk) {
		form.captchaToken = tk;
		stage.value = 'terms';
	}
	// Save redirect param for navigation back to login
	const redirect = route.query.redirect as string;
	if (redirect) {
		redirectUrl.value = redirect;
	}
});
</script>
