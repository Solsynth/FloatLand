<template>
  <div class="max-w-3xl mx-auto space-y-6 min-w-0">
    <h1 class="text-2xl font-bold mb-6 pt-4">
      {{ t("settings.profileTitle") }}
    </h1>

    <!-- Profile Header Preview with Images -->
    <section class="settings-panel overflow-hidden">
      <div class="relative">
        <!-- Background Image -->
        <div
          class="settings-profile-cover aspect-16/7 bg-base-200 overflow-hidden cursor-pointer group"
          @click="triggerBackgroundUpload"
        >
          <FileImage
            v-if="backgroundUrl"
            :file="backgroundUrl"
            class="w-full h-full object-cover"
            alt="Background"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-base-content/40"
          >
            <IconImagePlus class="w-8 h-8" />
          </div>
          <div
            class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <span class="text-white flex items-center gap-2">
              <IconCamera class="w-5 h-5" />
              {{ t("settings.changeBackground") }}
            </span>
          </div>
        </div>

        <!-- Avatar -->
        <div class="absolute -bottom-8 left-6">
          <div
            class="w-20 h-20 rounded-full bg-base-100 p-1 cursor-pointer group"
            @click="triggerAvatarUpload"
          >
            <div class="w-full h-full rounded-full overflow-hidden relative">
              <FileImage
                v-if="avatarUrl"
                :file="avatarUrl"
                class="w-full h-full object-cover"
                alt="Avatar"
              />
              <div
                v-else
                class="w-full h-full bg-primary text-primary-content flex items-center justify-center text-xl font-bold"
              >
                {{ getInitials(displayName) }}
              </div>
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <IconCamera class="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Hidden file inputs -->
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleAvatarUpload"
        />
        <input
          ref="backgroundInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleBackgroundUpload"
        />
      </div>

      <div class="pt-10 pb-4 px-6">
        <h2 class="text-lg font-semibold">{{ displayName }}</h2>
        <p class="text-sm text-base-content/60">@{{ user?.name }}</p>
      </div>
    </section>

    <!-- Basic Info Form -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg mb-4">{{ t("settings.basicInfo") }}</h2>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.username") }}
            </legend>
            <input
              v-model="basicForm.name"
              type="text"
              class="input input-bordered w-full"
              disabled
            />
            <p class="label">{{ t("settings.usernameCannotChange") }}</p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.nickname") }}
            </legend>
            <input
              v-model="basicForm.nick"
              type="text"
              class="input input-bordered w-full"
              :placeholder="t('settings.nicknamePlaceholder')"
            />
          </fieldset>

          <div class="grid grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("compose.language") }}
              </legend>
              <select
                v-model="basicForm.language"
                class="select select-bordered w-full"
              >
                <option value="en-us">English (US)</option>
                <option value="zh-hans">简体中文</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.region") }}
              </legend>
              <select
                v-model="basicForm.region"
                class="select select-bordered w-full"
              >
                <option value="US">United States</option>
                <option value="CN">China</option>
                <option value="JP">Japan</option>
              </select>
            </fieldset>
          </div>

          <div class="flex justify-end pt-2">
            <button
              class="btn btn-primary"
              :disabled="isSavingBasic"
              @click="saveBasicInfo"
            >
              <IconLoader v-if="isSavingBasic" class="w-4 h-4 animate-spin" />
              <IconSave v-else class="w-4 h-4" />
              {{ t("settings.saveChanges") }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Profile Details Form -->
    <section class="settings-panel">
      <div class="settings-panel__body">
        <h2 class="card-title text-lg mb-4">
          {{ t("settings.profileDetails") }}
        </h2>

        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.firstName") }}
              </legend>
              <input
                v-model="profileForm.firstName"
                type="text"
                class="input input-bordered w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.middleName") }}
              </legend>
              <input
                v-model="profileForm.middleName"
                type="text"
                class="input input-bordered w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.lastName") }}
              </legend>
              <input
                v-model="profileForm.lastName"
                type="text"
                class="input input-bordered w-full"
              />
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("account.bio") }}</legend>
            <textarea
              v-model="profileForm.bio"
              class="textarea textarea-bordered h-32 w-full"
              :placeholder="t('settings.bioPlaceholder')"
            />
          </fieldset>

          <div class="grid grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.gender") }}
              </legend>
              <input
                v-model="profileForm.gender"
                type="text"
                class="input input-bordered w-full"
                placeholder="e.g. Male, Female, Non-binary"
                list="gender-options"
              />
              <datalist id="gender-options">
                <option value="Male" />
                <option value="Female" />
                <option value="Non-binary" />
                <option value="Other" />
              </datalist>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.pronouns") }}
              </legend>
              <input
                v-model="profileForm.pronouns"
                type="text"
                class="input input-bordered w-full"
                placeholder="e.g. they/them"
              />
            </fieldset>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.location") }}
              </legend>
              <input
                v-model="profileForm.location"
                type="text"
                class="input input-bordered w-full"
                placeholder="City, Country"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {{ t("settings.timeZone") }}
              </legend>
              <div class="join w-full">
                <input
                  v-model="profileForm.timeZone"
                  type="text"
                  class="input input-bordered join-item flex-1"
                  placeholder="Select timezone"
                />
                <button
                  class="btn join-item"
                  :disabled="isDetectingTimezone"
                  @click="detectTimezone"
                >
                  <IconLoader
                    v-if="isDetectingTimezone"
                    class="w-4 h-4 animate-spin"
                  />
                  <IconLocate v-else class="w-4 h-4" />
                </button>
              </div>
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.birthday") }}
            </legend>
            <input
              v-model="profileForm.birthday"
              type="date"
              class="input input-bordered w-full"
            />
          </fieldset>

          <div class="pt-4">
            <h3 class="font-semibold mb-3">{{ t("settings.links") }}</h3>
            <div class="space-y-3">
              <div
                v-for="(link, index) in links"
                :key="index"
                class="flex gap-2 items-end"
              >
                <fieldset class="fieldset flex-1">
                  <input
                    v-model="link.name"
                    type="text"
                    class="input input-bordered input-sm w-full"
                    placeholder="Name (e.g. Twitter)"
                  />
                </fieldset>
                <fieldset class="fieldset flex-[2]">
                  <input
                    v-model="link.url"
                    type="url"
                    class="input input-bordered input-sm w-full"
                    placeholder="https://..."
                  />
                </fieldset>
                <button
                  class="btn btn-ghost btn-sm text-error"
                  @click="removeLink(index)"
                >
                  <IconTrash class="w-4 h-4" />
                </button>
              </div>
              <button class="btn btn-outline btn-sm" @click="addLink">
                <IconPlus class="w-4 h-4" />
                {{ t("settings.addLink") }}
              </button>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              class="btn btn-primary"
              :disabled="isSavingProfile"
              @click="saveProfile"
            >
              <IconLoader v-if="isSavingProfile" class="w-4 h-4 animate-spin" />
              <IconSave v-else class="w-4 h-4" />
              {{ t("settings.saveProfile") }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  IconLoader,
  IconSave,
  IconCamera,
  IconImagePlus,
  IconTrash,
  IconPlus,
  IconLocate,
} from "#components";
import { updateAccount, updateProfile } from "~/utils/api";

const { t } = useI18n();
const auth = useAuthStore();
const { notify } = useAlert();
const user = computed(() => auth.user);

const isSavingBasic = ref(false);
const isSavingProfile = ref(false);
const isDetectingTimezone = ref(false);

const displayName = computed(
  () => user.value?.nick || user.value?.name || "Unknown",
);
const avatarUrl = computed(() => user.value?.profile?.picture ?? null);
const backgroundUrl = computed(() => user.value?.profile?.background ?? null);

const avatarInput = ref<HTMLInputElement>();
const backgroundInput = ref<HTMLInputElement>();

// Basic info form
const basicForm = reactive({
  name: "",
  nick: "",
  language: "en-us",
  region: "US",
});

// Profile form
const profileForm = reactive({
  firstName: "",
  middleName: "",
  lastName: "",
  bio: "",
  gender: "",
  pronouns: "",
  location: "",
  timeZone: "",
  birthday: "",
});

// Links
const links = ref<{ name: string; url: string }[]>([]);

function resetForms() {
  if (!user.value) return;

  basicForm.name = user.value.name || "";
  basicForm.nick = user.value.nick || "";
  basicForm.language = user.value.language || "en-us";
  basicForm.region = user.value.region || "US";

  profileForm.firstName = user.value.profile?.firstName || "";
  profileForm.middleName = user.value.profile?.middleName || "";
  profileForm.lastName = user.value.profile?.lastName || "";
  profileForm.bio = user.value.profile?.bio || "";
  profileForm.gender = user.value.profile?.gender || "";
  profileForm.pronouns = user.value.profile?.pronouns || "";
  profileForm.location = user.value.profile?.location || "";
  profileForm.timeZone = user.value.profile?.timeZone || "";
  profileForm.birthday = user.value.profile?.birthday?.split("T")[0] || "";

  links.value = user.value.profile?.links?.length
    ? [...user.value.profile.links]
    : [];
}

function triggerAvatarUpload() {
  avatarInput.value?.click();
}

function triggerBackgroundUpload() {
  backgroundInput.value?.click();
}

async function handleAvatarUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    // TODO: Upload file to cloud and get ID
    await notify("Avatar upload coming soon");
  } catch {
    await notify("Failed to upload avatar");
  }
}

async function handleBackgroundUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    // TODO: Upload file to cloud and get ID
    await notify("Background upload coming soon");
  } catch {
    await notify("Failed to upload background");
  }
}

async function saveBasicInfo() {
  isSavingBasic.value = true;
  try {
    await updateAccount({
      nick: basicForm.nick,
      language: basicForm.language,
      region: basicForm.region,
    });
    await auth.refreshUser();
    await notify("Basic info saved successfully");
  } catch (err) {
    await notify(err instanceof Error ? err.message : "Failed to save basic info");
  } finally {
    isSavingBasic.value = false;
  }
}

async function saveProfile() {
  isSavingProfile.value = true;
  try {
    const validLinks = links.value.filter((l) => l.name && l.url);
    await updateProfile({
      bio: profileForm.bio,
      firstName: profileForm.firstName,
      middleName: profileForm.middleName,
      lastName: profileForm.lastName,
      gender: profileForm.gender,
      pronouns: profileForm.pronouns,
      location: profileForm.location,
      timeZone: profileForm.timeZone,
      birthday: profileForm.birthday || null,
      links: validLinks,
    });
    await auth.refreshUser();
    await notify("Profile saved successfully");
  } catch (err) {
    await notify(err instanceof Error ? err.message : "Failed to save profile");
  } finally {
    isSavingProfile.value = false;
  }
}

function addLink() {
  links.value.push({ name: "", url: "" });
}

function removeLink(index: number) {
  links.value.splice(index, 1);
}

async function detectTimezone() {
  isDetectingTimezone.value = true;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    profileForm.timeZone = tz;
    await notify(`Timezone detected: ${tz}`);
  } catch {
    await notify("Failed to detect timezone");
  } finally {
    isDetectingTimezone.value = false;
  }
}

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
}

onMounted(() => {
  resetForms();
});

defineOgImage('UniOgImage', { title: t("settings.profileTitle") })

useSolarSeo({
  title: t("settings.profileTitle"),
});
</script>
