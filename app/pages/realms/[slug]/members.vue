<template>
	<NuxtLayout name="app">
		<!-- Loading -->
		<ConfuseSpinner v-if="status === 'pending'" :message="t('realms.loading')" />

		<!-- Not Found -->
		<div v-else-if="notFound" class="mx-auto max-w-2xl p-6">
			<div class="card">
				<div class="card-body items-center text-center">
					<IconUsers class="text-base-content/50 w-10 h-10" />
					<h1 class="text-xl font-bold">{{ t("realms.notFound") }}</h1>
				</div>
			</div>
		</div>

		<!-- Error -->
		<div v-else-if="error" class="mx-auto max-w-2xl p-6">
			<div class="alert alert-error">
				<span>{{ error }}</span>
			</div>
		</div>

		<!-- Members List -->
		<div v-else-if="realm" class="mx-auto max-w-4xl space-y-6">
			<!-- Header -->
			<div class="flex items-center gap-4 px-4 lg:px-0">
				<NuxtLink :to="`/realms/${realm.slug}`" class="btn btn-ghost btn-square">
					<IconArrowLeft class="w-5 h-5" />
				</NuxtLink>
				<div class="min-w-0 flex-1">
					<h1 class="text-xl font-bold truncate">{{ realm.name }}</h1>
					<p class="text-sm text-base-content/60">
						{{ t("realms.membersCount", { count: total }) }}
					</p>
				</div>
				<button
					v-if="canInvite"
					class="btn btn-primary btn-sm"
					@click="showInviteModal = true"
				>
					<IconUserPlus class="w-4 h-4" />
					{{ t("realms.inviteBtn") }}
				</button>
			</div>

			<!-- Filters -->
			<div class="card">
				<div class="card-body p-4">
					<div class="flex flex-wrap gap-2">
						<div class="join flex-1">
							<input
								v-model="searchQuery"
								type="text"
								:placeholder="t('realms.searchMembers')"
								class="input input-bordered join-item w-full"
								@keydown.enter="reloadMembers"
							>
							<button class="btn btn-primary join-item" @click="reloadMembers">
								<IconSearch class="w-4 h-4" />
							</button>
						</div>
						<select v-model="roleFilter" class="select select-bordered" @change="reloadMembers">
							<option value="">{{ t("realms.allRoles") }}</option>
							<option value="0">{{ t("realms.roleMember") }}</option>
							<option value="1">{{ t("realms.roleModerator") }}</option>
							<option value="2">{{ t("realms.roleAdmin") }}</option>
							<option value="3">{{ t("realms.roleOwner") }}</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Members Grid -->
			<div v-if="members.length > 0" class="grid gap-3 sm:grid-cols-2">
				<div
					v-for="member in members"
					:key="member.id"
					class="card bg-base-200/50 hover:bg-base-200 transition-colors"
				>
					<div class="card-body p-4">
						<div class="flex items-start gap-3">
							<!-- Avatar -->
							<NuxtLink :to="`/@${member.account?.name}`" class="shrink-0">
								<div v-if="member.account?.profile.picture?.id" class="avatar">
									<div class="w-12 h-12 rounded-full">
										<img
											:src="getFileUrl(member.account.profile.picture.id)!"
											:alt="member.nick || member.account?.nick || member.account?.name"
										>
									</div>
								</div>
								<div v-else class="avatar avatar-placeholder">
									<div
										class="w-12 h-12 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold">
										{{ getInitials(member.nick || member.account?.nick || member.account?.name || '?') }}
									</div>
								</div>
							</NuxtLink>

							<!-- Info -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<NuxtLink
										:to="`/@${member.account?.name}`"
										class="font-semibold truncate hover:underline"
									>
										{{ member.nick || member.account?.nick || member.account?.name }}
									</NuxtLink>
									<span
										class="badge badge-sm"
										:class="getRoleBadgeClass(member.role)"
									>
                                        {{ getRoleLabel(member.role) }}
                                    </span>
									<span
										v-if="member.label"
										class="badge badge-sm"
										:style="getLabelStyle(member.label)"
									>
                                        {{ member.label.name }}
                                    </span>
								</div>
								<p class="text-sm text-base-content/60 truncate">
									@{{ member.account?.name }}
								</p>
								<!-- eslint-disable vue/no-v-html -->
								<div
									v-if="member.bio"
									class="prose prose-xs max-w-none break-words line-clamp-2 prose-headings:mb-1 prose-headings:text-xs prose-p:my-0.5 prose-a:text-primary prose-a:no-underline prose-code:text-primary prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs mt-1"
									v-html="renderMarkdown(member.bio)"
								/>
								<!-- eslint-enable vue/no-v-html -->
								<div class="flex items-center gap-3 mt-2 text-xs text-base-content/40">
                                    <span class="flex items-center gap-1">
                                        <IconZap class="w-3 h-3" />
                                        {{ t("realms.lv", { level: member.level }) }}
                                    </span>
									<span v-if="member.experience > 0">
                                        {{ t("realms.xp", { xp: member.experience }) }}
                                    </span>
								</div>
							</div>

							<!-- Actions -->
							<div v-if="canManage && member.accountId !== currentUserId" class="dropdown dropdown-end">
								<button class="btn btn-ghost btn-square btn-sm">
									<IconMoreVertical class="w-4 h-4" />
								</button>
								<ul class="dropdown-content menu menu-sm bg-base-100 rounded-box z-10 shadow-lg w-40">
									<li v-if="myRole && myRole > member.role">
										<button @click="promoteMember(member)">
											<IconArrowUp class="w-4 h-4" />
											{{ t("realms.promote") }}
										</button>
									</li>
									<li v-if="myRole && myRole > member.role">
										<button @click="demoteMember(member)">
											<IconArrowDown class="w-4 h-4" />
											{{ t("realms.demote") }}
										</button>
									</li>
									<li class="divider" />
									<li>
										<button class="text-error" @click="kickMember(member)">
											<IconUserX class="w-4 h-4" />
											{{ t("realms.remove") }}
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Load More -->
			<div v-if="members.length > 0" class="text-center">
				<button
					v-if="hasMore"
					class="btn btn-outline"
					:disabled="isLoading"
					@click="loadMore"
				>
					<IconLoader v-if="isLoading" class="w-4 h-4 animate-spin" />
					<span>{{ t("common.loadMore") }}</span>
				</button>
				<p v-else-if="members.length > 10" class="text-sm text-base-content/50">
					{{ t("realms.noMoreMembers") }}
				</p>
			</div>

			<!-- Empty State -->
			<div v-else class="card bg-base-200/50">
				<div class="card-body items-center text-center py-12">
					<IconSearch class="w-12 h-12 text-base-content/30 mb-4" />
					<h2 class="text-lg font-bold">{{ t("realms.noMembersFound") }}</h2>
					<p class="text-base-content/60 text-sm">
						{{ t("realms.noMembersHint") }}
					</p>
				</div>
			</div>
		</div>
	</NuxtLayout>
</template>

<script setup lang="ts">
import type { Realm, RealmMember, RealmLabel } from '~/types/realm';
import { fetchRealm, fetchRealmMembers, getMyRealmMembership } from '~/utils/api';
import { getFileUrl } from '~/utils/files';
import { renderMarkdown } from '~/utils/markdown';

const { t } = useI18n();

const route = useRoute();
const auth = useAuth();
const realmSlug = computed(() => route.params.slug as string);

// State
const realm = ref<Realm | null>(null);
const members = ref<RealmMember[]>([]);
const myMembership = ref<RealmMember | null>(null);
const notFound = ref(false);
const error = ref<string | null>(null);
const isLoading = ref(false);
const total = ref(0);
const offset = ref(0);
const hasMore = ref(false);
const searchQuery = ref('');
const roleFilter = ref('');
const showInviteModal = ref(false);

const seoTitle = ref<string>("");
const seoDescription = ref<string>("");

defineOgImage('UniOgImage', { title: computed(() => seoTitle.value || 'Solar Network'), description: computed(() => seoDescription.value || '') })

useHead({
  title: computed(() => seoTitle.value || "Solar Network"),
  meta: [
    { name: "description", content: computed(() => seoDescription.value || "Explore posts, realms, and publishers on Solar Network.") },
    { property: "og:title", content: computed(() => seoTitle.value ? `${seoTitle.value} • Solar Network` : "Solar Network") },
    { property: "og:description", content: computed(() => seoDescription.value || "Explore posts, realms, and publishers on Solar Network.") },
  ],
});

// Computed
const status = computed(() =>
	realm.value ? 'success' : error.value ? 'error' : 'pending'
);
const myRole = computed(() => myMembership.value?.role ?? null);
const currentUserId = computed(() => auth.user.value?.id ?? '');
const canInvite = computed(() => myRole.value !== null && myRole.value >= 1);
const canManage = computed(() => myRole.value !== null && myRole.value >= 2);

// Methods
function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase())
		.slice(0, 2)
		.join('') || '?';
}

function getRoleLabel(role: number): string {
	const roles = [t("realms.roleMember"), t("realms.roleModerator"), t("realms.roleAdmin"), t("realms.roleOwner")];
	return roles[role] || t("realms.roleMember");
}

function getRoleBadgeClass(role: number): string {
	switch (role) {
		case 3:
			return 'badge-primary';
		case 2:
			return 'badge-secondary';
		case 1:
			return 'badge-accent';
		default:
			return 'badge-ghost';
	}
}

function getLabelStyle(label: RealmLabel): Record<string, string | undefined> {
	return {
		backgroundColor: label.color ? `${label.color}20` : undefined,
		borderColor: label.color || undefined,
		color: label.color || undefined
	};
}

async function reloadMembers() {
	if (!realmSlug.value) return;
	isLoading.value = true;
	error.value = null;
	offset.value = 0;

	try {
		const result = await fetchRealmMembers(realmSlug.value, 50, 0);
		members.value = result.members;
		total.value = result.total;
		offset.value = result.members.length;
		hasMore.value = result.members.length < result.total;
	} catch (err) {
		error.value = err instanceof Error ? err.message : t("realms.failedToLoadMembers");
	} finally {
		isLoading.value = false;
	}
}

async function loadMore() {
	if (!hasMore.value || isLoading.value) return;
	isLoading.value = true;

	try {
		const result = await fetchRealmMembers(realmSlug.value, 50, offset.value);
		const more = result.members;
		members.value = [...members.value, ...more];
		offset.value += more.length;
		hasMore.value = members.value.length < result.total;
	} catch (err) {
		error.value = err instanceof Error ? err.message : t("realms.failedToLoadMembers");
	} finally {
		isLoading.value = false;
	}
}

async function promoteMember(_member: RealmMember) {
	// TODO: Implement promotion API
  await useAlert().notify('Coming soon!');
}

async function demoteMember(_member: RealmMember) {
	// TODO: Implement demotion API
  await useAlert().notify('Coming soon!');
}

async function kickMember(_member: RealmMember) {
	// TODO: Implement kick API
  await useAlert().notify('Coming soon!');
}

// Initial load
onMounted(async () => {
	try {
		const [realmData, membership] = await Promise.all([
			fetchRealm(realmSlug.value),
			getMyRealmMembership(realmSlug.value)
		]);
		realm.value = realmData;
		myMembership.value = membership;

		// Load members
		await reloadMembers();

		// SEO
		seoTitle.value = t("realms.membersTitle", { name: realmData.name });
		seoDescription.value = t("realms.seoMembersDescription", { name: realmData.name });
	} catch (err) {
		if (err instanceof Error && err.message.includes('404')) {
			notFound.value = true;
		} else {
			error.value = err instanceof Error ? err.message : t("realms.failedToLoad");
		}
	}
});
</script>
