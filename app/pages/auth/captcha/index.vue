<template>
	<div class="auth-page">
		<div class="auth-panel auth-panel--compact text-center">
			<div class="mb-4 flex flex-col items-center gap-3">
				<div class="auth-status-icon bg-primary/15 text-primary">
					<IconShieldCheck class="w-5 h-5" />
				</div>
				<div>
					<h1 class="text-xl font-black">{{ t("captcha.title") }}</h1>
					<p class="text-xs text-base-content/60">{{ t("captcha.subtitle") }}</p>
				</div>
			</div>

			<div class="my-4">
				<CaptchaWidget @verified="useToken" />
			</div>

			<p class="mt-5 text-xs text-base-content/60">
				{{ t("captcha.hostedBy") }}
				<a
					href="https://github.com/Solsynth/DysonNetwork"
					class="link link-primary"
					target="_blank"
					rel="noreferrer"
				>DysonNetwork.Sphere</a>
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { IconShieldCheck } from '#components';

definePageMeta({ layout: false });

const { t } = useI18n();

defineOgImage('UniOgImage', { title: t("captcha.seoTitle"), description: t("captcha.seoDescription") })

useSolarSeo({
    title: t("captcha.seoTitle"),
    description: t("captcha.seoDescription"),
});

const route = useRoute();

function useToken(value: string) {
	const finalToken = value.trim();
	if (!finalToken) return;

	if (window.parent !== window) {
		window.parent.postMessage(`captcha_tk=${finalToken}`, '*');
	}

	const redirectUri = route.query.redirect_uri as string;
	if (redirectUri) {
		const url = new URL(redirectUri);
		url.searchParams.set('captcha_tk', finalToken);
		window.location.href = url.toString();
	}
}
</script>
