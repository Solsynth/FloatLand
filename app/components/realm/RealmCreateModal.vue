<template>
    <dialog
        :id="dialogId"
        class="modal"
        :class="{ 'modal-open': modelValue }"
        @close="handleClose"
    >
        <div class="modal-box max-w-lg">
            <form method="dialog">
                <button
                    class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    :disabled="isCreating"
                    @click="handleClose"
                >
                    <IconX class="w-5 h-5" />
                </button>
            </form>

            <h3 class="text-lg font-bold mb-1">{{ t("realms.createModalTitle") }}</h3>
            <p class="text-sm text-base-content/60 mb-6">
                {{ t("realms.createModalDesc") }}
            </p>

            <form class="space-y-4" @submit.prevent="handleSubmit">
                <!-- Name -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-medium">{{ t("realms.name") }}</span>
                        <span v-if="errors.name" class="label-text-alt text-error">{{ errors.name }}</span>
                    </label>
                    <input
                        v-model="form.name"
                        type="text"
                        :placeholder="t('realms.namePlaceholder')"
                        class="input input-bordered w-full"
                        :class="{ 'input-error': errors.name }"
                        maxlength="100"
                        required
                    >
                </div>

                <!-- Slug -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-medium">{{ t("realms.slug") }}</span>
                        <span class="label-text-alt">@{{ form.slug || 'slug' }}</span>
                    </label>
                    <input
                        v-model="form.slug"
                        type="text"
                        :placeholder="t('realms.slugPlaceholder')"
                        class="input input-bordered w-full"
                        :class="{ 'input-error': errors.slug }"
                        maxlength="50"
                        pattern="[a-z0-9-]+"
                        required
                        @input="sanitizeSlug"
                    >
                    <label v-if="errors.slug" class="label">
                        <span class="label-text-alt text-error">{{ errors.slug }}</span>
                    </label>
                    <label v-else class="label">
                        <span class="label-text-alt">{{ t("realms.slugHint") }}</span>
                    </label>
                </div>

                <!-- Description -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-medium">{{ t("realms.description") }}</span>
                        <span class="label-text-alt">{{ form.description?.length || 0 }}/500</span>
                    </label>
                    <textarea
                        v-model="form.description"
                        :placeholder="t('realms.descriptionPlaceholder')"
                        class="textarea textarea-bordered w-full h-24 resize-none"
                        maxlength="500"
                    />
                </div>

                <!-- Type -->
                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-medium">{{ t("realms.type") }}</span>
                    </label>
                    <div class="flex gap-3">
                        <label
                            class="flex-1 cursor-pointer"
                            :class="form.isCommunity ? 'opacity-100' : 'opacity-60'"
                        >
                            <input
                                v-model="form.isCommunity"
                                type="radio"
                                :value="true"
                                class="radio radio-primary hidden"
                            >
                            <div
                                class="card card-compact cursor-pointer transition-all"
                                :class="form.isCommunity ? 'bg-tint' : 'bg-base-200'"
                            >
                                <div class="card-body items-center text-center">
                                    <IconUsers class="w-8 h-8" />
                                    <h4 class="font-bold">{{ t("realms.community") }}</h4>
                                    <p class="text-xs text-base-content/60">{{ t("realms.communityDesc") }}</p>
                                </div>
                            </div>
                        </label>
                        <label
                            class="flex-1 cursor-pointer"
                            :class="!form.isCommunity ? 'opacity-100' : 'opacity-60'"
                        >
                            <input
                                v-model="form.isCommunity"
                                type="radio"
                                :value="false"
                                class="radio radio-primary hidden"
                            >
                            <div
                                class="card card-compact cursor-pointer transition-all"
                                :class="!form.isCommunity ? 'bg-tint' : 'bg-base-200'"
                            >
                                <div class="card-body items-center text-center">
                                    <IconBuilding2 class="w-8 h-8" />
                                    <h4 class="font-bold">{{ t("realms.organization") }}</h4>
                                    <p class="text-xs text-base-content/60">{{ t("realms.organizationDesc") }}</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Visibility -->
                <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-3">
                        <input v-model="form.isPublic" type="checkbox" class="toggle toggle-primary" >
                        <div>
                            <span class="label-text font-medium">{{ t("realms.publicRealm") }}</span>
                            <p class="text-xs text-base-content/60">
                                {{ form.isPublic
                                    ? t("realms.publicRealmOn")
                                    : t("realms.publicRealmOff")
                            }}
                            </p>
                        </div>
                    </label>
                </div>

                <!-- Error -->
                <div v-if="errors.general" class="alert alert-error text-sm">
                    <IconAlertCircle class="w-4 h-4" />
                    {{ errors.general }}
                </div>

                <!-- Actions -->
                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-ghost"
                        :disabled="isCreating"
                        @click="handleClose"
                    >
                        {{ t("realms.cancel") }}
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        :disabled="isCreating || !isValid"
                    >
                        <IconLoader v-if="isCreating" class="w-4 h-4 animate-spin" />
                        <IconCheck v-else class="w-4 h-4" />
                        {{ t("realms.createRealmBtn") }}
                    </button>
                </div>
            </form>
        </div>

        <!-- Backdrop -->
        <form method="dialog" class="modal-backdrop">
            <button :disabled="isCreating" @click="handleClose">close</button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import type { Realm } from '~/types/realm'
import { createRealm } from '~/utils/api'

const { t } = useI18n();

const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'created': [realm: Realm]
}>()

const dialogId = 'realm-create-modal'
const isCreating = ref(false)
const errors = ref<Record<string, string>>({})

const form = ref({
    name: '',
    slug: '',
    description: '',
    isPublic: true,
    isCommunity: true,
})

const isValid = computed(() => {
    return form.value.name.trim().length >= 2 &&
           form.value.slug.trim().length >= 2 &&
           /^[a-z0-9-]+$/.test(form.value.slug)
})

function sanitizeSlug() {
    form.value.slug = form.value.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

function resetForm() {
    form.value = {
        name: '',
        slug: '',
        description: '',
        isPublic: true,
        isCommunity: true,
    }
    errors.value = {}
}

function handleClose() {
    if (isCreating.value) return
    emit('update:modelValue', false)
    setTimeout(resetForm, 300)
}

async function handleSubmit() {
    if (isCreating.value || !isValid.value) return

    isCreating.value = true
    errors.value = {}

    try {
        const realm = await createRealm({
            name: form.value.name.trim(),
            slug: form.value.slug.trim(),
            description: form.value.description.trim() || undefined,
            isPublic: form.value.isPublic,
            isCommunity: form.value.isCommunity,
        })

        emit('created', realm)
        emit('update:modelValue', false)
        resetForm()
    } catch (err) {
        const message = err instanceof Error ? err.message : t("realms.failedToCreate")

        // Parse specific errors
        if (message.toLowerCase().includes('slug')) {
            errors.value.slug = t("realms.slugTaken")
        } else if (message.toLowerCase().includes('name')) {
            errors.value.name = t("realms.invalidName")
        } else {
            errors.value.general = message
        }
    } finally {
        isCreating.value = false
    }
}

// Auto-generate slug from name
watch(() => form.value.name, (name) => {
    if (!form.value.slug || form.value.slug === generateSlug(form.value.name.slice(0, -1))) {
        form.value.slug = generateSlug(name)
    }
})

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50)
}

// Open/close dialog
watch(() => props.modelValue, (isOpen) => {
    const dialog = document.getElementById(dialogId) as HTMLDialogElement
    if (dialog) {
        if (isOpen && !dialog.open) {
            dialog.showModal()
        } else if (!isOpen && dialog.open) {
            dialog.close()
        }
    }
})
</script>
