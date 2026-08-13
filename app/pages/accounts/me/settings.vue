<template>
	<NuxtLayout name="app">
		<div class="grid xl:grid-cols-[1fr_16rem] gap-6 min-w-0">
			<!-- Main Content -->
			<div class="min-w-0">
				<!-- Mobile Tab Navigation -->
				<div class="xl:hidden mb-4 overflow-x-auto pb-2 flex justify-center">
					<div class="tabs tabs-box tabs-sm flex-nowrap min-w-max">
						<NuxtLink
							v-for="item in menuItems"
							:key="item.to"
							:to="item.to"
							class="tab"
							:class="isActiveRoute(item.to) ? 'tab-active' : ''"
						>
							<span class="flex items-center gap-1.5">
								<component :is="item.icon" class="w-4 h-4" />
								{{ item.label }}
							</span>
						</NuxtLink>
					</div>
				</div>

				<NuxtPage />
			</div>

			<!-- Right Sidebar - Settings Navigation -->
			<aside class="hidden xl:block sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
				<div class="mt-4">
					<h2 class="card-title text-lg mb-4 px-2">{{ t('settings.title') }}</h2>
					<ul class="menu menu-vertical p-0 gap-1 w-full">
						<li v-for="item in menuItems" :key="item.to">
							<NuxtLink
								:to="item.to"
								class="flex items-center gap-3 px-3 py-2 rounded-lg"
								:class="isActiveRoute(item.to) ? 'menu-active' : ''"
							>
								<component :is="item.icon" class="w-5 h-5" />
								<span class="text-sm">{{ item.label }}</span>
							</NuxtLink>
						</li>
					</ul>

					<NuxtLink
						:to="`/@${user?.name}`"
						class="btn btn-ghost btn-sm justify-start gap-3 mt-4"
					>
						<IconArrowLeft class="w-5 h-5" />
						<span>{{ t('settings.backToProfile') }}</span>
					</NuxtLink>
				</div>
			</aside>
		</div>
	</NuxtLayout>
</template>

<script setup lang="ts">
import {
	IconUser,
	IconShield,
	IconBell,
	IconPalette,
	IconArrowLeft,
	IconSend,
	IconAlertTriangle,
} from '#components';

const { t } = useI18n();
const route = useRoute();
const { user } = useAuth();

/** Mirrors Island account_settings.dart sections (web-relevant). */
const menuItems = [
	{ to: '/accounts/me/settings', label: t('settings.profile'), icon: IconUser },
	{ to: '/accounts/me/settings/publishing', label: t('settings.publishing'), icon: IconSend },
	{ to: '/accounts/me/settings/notifications', label: t('settings.notifications'), icon: IconBell },
	{ to: '/accounts/me/settings/security', label: t('settings.security'), icon: IconShield },
	{ to: '/accounts/me/settings/appearance', label: t('settings.appearance'), icon: IconPalette },
	{ to: '/accounts/me/settings/account', label: t('settings.account'), icon: IconAlertTriangle },
];

function isActiveRoute(path: string): boolean {
	if (path === '/accounts/me/settings') {
		return route.path === path || route.path === `${path}/` || route.path === `${path}/index`;
	}
	return route.path === path || route.path.startsWith(`${path}/`);
}

defineOgImage('UniOgImage', { title: t('settings.title') })

useSolarSeo({
	title: t('settings.title'),
});
</script>
