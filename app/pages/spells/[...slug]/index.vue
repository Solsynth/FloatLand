<template>
	<div class="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8">
		<div class="w-full max-w-4xl overflow-hidden rounded-box bg-base-100 shadow-sm">
			<div class="grid md:grid-cols-[0.95fr_1.05fr]">
				<!-- Left Column: Branding -->
				<section
					class="flex flex-col justify-between gap-4 bg-base-200 p-6 md:p-8"
				>
					<div class="flex flex-col gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-box bg-primary/10">
							<IconWand2 class="w-6 h-6 text-primary" />
						</div>
						<div>
							<p class="text-xs font-semibold text-base-content/70">
								Magic Spell
							</p>
						</div>
						<div>
							<h1 class="text-3xl leading-tight font-black">
								{{ spell ? (spellTypes[spell.type] ?? 'Unknown Spell') : 'Magic Spell' }}
							</h1>
							<p class="text-sm text-base-content/70 mt-2">
								Review the spell details before applying it to your account.
							</p>
						</div>
					</div>


				</section>

				<!-- Right Column: Spell Content -->
				<section class="flex min-h-96 flex-col justify-between bg-base-100 p-6 md:p-8">
					<!-- Loading State -->
					<div v-if="loading" class="flex flex-col items-center justify-center py-16">
						<ConfuseSpinner message="Loading spell..." />
					</div>

					<!-- Error State -->
					<div v-else-if="error" class="flex flex-col items-center justify-center py-8 text-center">
						<div class="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-4">
							<IconAlertCircle class="w-8 h-8 text-error" />
						</div>
						<h2 class="text-xl font-bold">Spell Error</h2>
						<p class="text-base-content/60 text-sm mt-1">{{ error }}</p>
					</div>

					<!-- Success State -->
					<div v-else-if="done" class="flex flex-col items-center justify-center py-8 text-center">
						<div class="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
							<IconCheck class="w-8 h-8 text-success" />
						</div>
						<h2 class="text-xl font-bold">Spell Applied!</h2>
						<p class="text-base-content/60 text-sm mt-1">
							Your spell has been successfully applied. You can close this tab now.
						</p>
						<button class="btn btn-primary mt-6" @click="navigateTo('/')">
							<IconHome class="w-4 h-4" />
							Go Home
						</button>
					</div>

					<!-- Spell Details & Confirmation -->
					<template v-else-if="spell">
						<div>
							<!-- Spell Info -->
							<div class="space-y-4 text-sm">
								<div class="flex items-center gap-3">
									<IconUser class="w-5 h-5 text-base-content/60" />
									<div>
										<p class="text-xs tracking-wide text-base-content/60 uppercase">Account</p>
										<p class="font-semibold">@{{ spell.account.name }}</p>
									</div>
								</div>

								<div class="flex items-center gap-3">
									<IconClock class="w-5 h-5 text-base-content/60" />
									<div>
										<p class="text-xs tracking-wide text-base-content/60 uppercase">Available at</p>
										<p class="font-semibold">
											{{ new Date(spell.createdAt ?? spell.affectedAt).toLocaleString() }}
										</p>
									</div>
								</div>

								<div v-if="spell.expiredAt" class="flex items-center gap-3">
									<IconCalendar class="w-5 h-5 text-base-content/60" />
									<div>
										<p class="text-xs tracking-wide text-base-content/60 uppercase">Expires</p>
										<p class="font-semibold">{{ new Date(spell.expiredAt).toLocaleString() }}</p>
									</div>
								</div>
							</div>

							<!-- Password Input (for reset password spells) -->
							<div v-if="spell.type === 3" class="mt-6">
								<fieldset class="fieldset">
									<legend class="fieldset-legend">New Password</legend>
									<input
										v-model="newPassword"
										type="password"
										class="input input-bordered w-full"
										placeholder="Enter your new password"
									>
									<p class="fieldset-label text-xs text-base-content/50">
										This spell will reset your account password
									</p>
								</fieldset>
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="mt-6">
							<button
								class="btn btn-primary w-full"
								:disabled="submitting || (spell.type === 3 && !newPassword)"
								@click="apply"
							>
								<IconLoader
									v-if="submitting"
									class="w-4 h-4 animate-spin"
								/>
								<IconCheck v-else class="w-4 h-4" />
								Apply Spell
							</button>
						</div>
					</template>

					<!-- Invalid Spell State -->
					<div v-else class="flex flex-col items-center justify-center py-8 text-center">
						<div class="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-4">
							<IconAlertCircle class="w-8 h-8 text-error" />
						</div>
						<h2 class="text-xl font-bold">Invalid Spell</h2>
						<p class="text-base-content/60 text-sm mt-1">
							This spell link is invalid or has expired.
						</p>
					</div>
				</section>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	IconWand2,
	IconAlertCircle,
	IconCheck,
	IconUser,
	IconClock,
	IconCalendar,
	IconLoader,
	IconHome,
} from '#components';
import { getSpell, applySpell, type SpellInfo } from '~/utils/api';

definePageMeta({ layout: false });

defineOgImage('UniOgImage', { title: 'Spells', description: 'Discover and apply spells on Solar Network.' })

useSolarSeo({
    title: "Spells",
    description: "Discover and apply spells on Solar Network.",
});

const route = useRoute();
const spellWord = computed(() => (route.params.slug as string[])?.join('/') || '');

const spellTypes = [
	'Account Activation',
	'Account Deactivation',
	'Account Deletion',
	'Reset Password',
	'Contact Method Verification',
];

const spell = ref<SpellInfo | null>(null);
const loading = ref(true);
const submitting = ref(false);
const error = ref<string | null>(null);
const done = ref(false);
const newPassword = ref('');

async function fetchSpell() {
	if (!spellWord.value) {
		error.value = 'Invalid spell word';
		loading.value = false;
		return;
	}

	loading.value = true;
	error.value = null;

	try {
		spell.value = await getSpell(spellWord.value);
	} catch (err) {
		error.value = err instanceof Error ? err.message : 'Failed to load spell';
	} finally {
		loading.value = false;
	}
}

async function apply() {
	if (!spell.value || submitting.value || !spellWord.value) return;

	submitting.value = true;
	error.value = null;

	try {
		await applySpell(spellWord.value, spell.value.type === 3 ? newPassword.value : undefined);
		done.value = true;
	} catch (err) {
		error.value = err instanceof Error ? err.message : 'Failed to apply spell';
	} finally {
		submitting.value = false;
	}
}

onMounted(() => {
	fetchSpell();
});
</script>
