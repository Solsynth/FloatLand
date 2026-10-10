<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-7xl space-y-5">
      <DistributionProductHeader
        :product="product"
        :publisher-name="publisherName"
        :product-slug="slug"
        :refreshing="isLoadingProduct"
        @refresh="reload"
      />

      <div v-if="!isHydrated || isLoadingProduct" class="space-y-3" aria-busy="true" :aria-label="t('common.loading')">
        <div class="skeleton h-64 w-full rounded-box" />
        <div class="skeleton h-24 w-full rounded-box" />
      </div>

      <template v-else-if="product">
        <section class="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 class="font-semibold">{{ t('developer.apps.distribution.editProduct') }}</h2>
          <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.hints.settings') }}</p>

          <form class="mt-5 space-y-5" @submit.prevent="saveProduct">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t('developer.apps.distribution.productSlug') }}</legend>
              <input
                v-model="productForm.slug"
                type="text"
                class="input w-full"
                :placeholder="t('developer.apps.distribution.productSlug')"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
              <p class="mt-1 text-xs text-base-content/60">{{ t('developer.apps.distribution.productSlugHint') }}</p>
            </fieldset>
            <div class="grid gap-4 border border-base-300 bg-base-100 p-4 rounded-box">
              <div>
                <h2 class="font-medium">{{ t('developer.apps.distribution.productMedia') }}</h2>
                <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.productMediaHint') }}</p>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ t('developer.apps.distribution.productIcon') }}</legend>
                  <div class="flex flex-wrap items-center gap-3">
                    <FileImage
                      v-if="productForm.icon"
                      :file="productForm.icon"
                      class="h-16 w-16 shrink-0 rounded-box object-cover"
                      alt=""
                    />
                    <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center rounded-box bg-base-200 text-base-content/40">
                      <IconImage class="h-6 w-6" />
                    </div>
                    <button class="btn btn-outline btn-sm" type="button" @click="pickProductIcon">
                      {{ t('developer.apps.distribution.chooseImage') }}
                    </button>
                    <button v-if="productForm.icon" class="btn btn-ghost btn-sm text-error" type="button" @click="removeProductIcon">
                      {{ t('common.remove') }}
                    </button>
                  </div>
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ t('developer.apps.distribution.productBackground') }}</legend>
                  <div class="flex flex-wrap items-center gap-3">
                    <FileImage
                      v-if="productForm.background"
                      :file="productForm.background"
                      class="h-16 w-16 shrink-0 rounded-box object-cover"
                      alt=""
                    />
                    <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center rounded-box bg-base-200 text-base-content/40">
                      <IconImage class="h-6 w-6" />
                    </div>
                    <button class="btn btn-outline btn-sm" type="button" @click="pickProductBackground">
                      {{ t('developer.apps.distribution.chooseImage') }}
                    </button>
                    <button v-if="productForm.background" class="btn btn-ghost btn-sm text-error" type="button" @click="removeProductBackground">
                      {{ t('common.remove') }}
                    </button>
                  </div>
                </fieldset>
              </div>
              <div>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <span class="text-sm font-medium">{{ t('developer.apps.distribution.productPreviews') }}</span>
                  <button class="btn btn-outline btn-sm" type="button" @click="pickProductPreviews">
                    {{ t('developer.apps.distribution.chooseImages') }}
                  </button>
                </div>
                <div v-if="productForm.previews.length" class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  <div v-for="(preview, index) in productForm.previews" :key="preview.id || index" class="group relative">
                    <FileImage
                      v-if="preview.id"
                      :src="getFileUrl(preview.id) ?? ''"
                      class="aspect-video w-full rounded-box object-cover"
                      alt=""
                    />
                    <div v-else class="flex aspect-video w-full items-center justify-center rounded-box bg-base-200 text-base-content/40">
                      <IconImage class="h-5 w-5" />
                    </div>
                    <button
                      class="btn btn-circle btn-xs btn-error absolute right-1 top-1 opacity-100 transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      type="button"
                      :title="t('common.remove')"
                      :aria-label="t('common.remove')"
                      @click="removeProductPreview(index)"
                    >
                      <IconX class="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <div class="flex flex-col gap-3 border border-base-300 bg-base-100 p-4 rounded-box sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 class="font-medium">{{ t('developer.apps.distribution.localizedMetadata') }}</h2>
                  <p class="mt-1 text-sm text-base-content/60">{{ t('developer.apps.distribution.localizationRequired') }}</p>
                </div>
                <div class="flex gap-2">
                  <select v-model="newProductLanguage" class="select select-sm" :aria-label="t('developer.apps.distribution.selectLanguage')">
                    <option value="">{{ t('developer.apps.distribution.selectLanguage') }}</option>
                    <option v-for="option in availableProductLocaleOptions" :key="option.code" :value="option.code">
                      {{ option.name }}
                    </option>
                  </select>
                  <button class="btn btn-outline btn-sm" type="button" :disabled="!newProductLanguage" @click="addProductLocalization">
                    <IconPlus class="h-4 w-4" />
                    {{ t('developer.apps.distribution.addLanguage') }}
                  </button>
                </div>
              </div>
              <div
                v-for="(entry, index) in productForm.localizations"
                :key="entry.id"
                class="grid gap-4 border border-base-300 p-4 rounded-box sm:grid-cols-2"
              >
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ t('developer.apps.distribution.productName') }}</legend>
                  <div class="flex gap-2">
                    <select v-model="entry.locale" class="select w-32" :aria-label="t('developer.apps.distribution.selectLanguage')">
                      <option v-for="option in productLocaleOptionsFor(index)" :key="option.code" :value="option.code">
                        {{ option.name }}
                      </option>
                    </select>
                    <input v-model="entry.name" type="text" class="input w-full" :placeholder="t('developer.apps.distribution.productName')" required />
                  </div>
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ t('developer.apps.distribution.productDescription') }}</legend>
                  <textarea
                    v-model="entry.description"
                    class="textarea min-h-24 w-full"
                    :placeholder="t('developer.apps.distribution.productDescription')"
                    rows="2"
                    required
                  />
                </fieldset>
                <button
                  v-if="productForm.localizations.length > 1"
                  class="btn btn-ghost btn-sm justify-self-start text-error sm:col-span-2"
                  type="button"
                  @click="removeProductLocalization(index)"
                >
                  {{ t('common.remove') }} {{ localeName(entry.locale) }}
                </button>
              </div>
            </div>
            <div class="flex flex-wrap justify-end gap-2 pt-4">
              <button class="btn btn-ghost" type="button" :disabled="isSavingProduct" @click="resetProductForm">{{ t('common.cancel') }}</button>
              <button class="btn btn-primary" type="submit" :disabled="isSavingProduct">
                <span v-if="isSavingProduct" class="loading loading-spinner loading-sm" />
                {{ t('common.save') }}
              </button>
            </div>
          </form>
        </section>

        <section class="rounded-box border border-error/30 bg-error/[0.04] p-5 shadow-sm">
          <h2 class="font-semibold text-error">{{ t('developer.apps.distribution.deleteProduct') }}</h2>
          <p class="mt-1 text-sm text-base-content/60">
            {{ t('developer.apps.distribution.deleteProductConfirm', { name: productName || slug }) }}
          </p>
          <div class="mt-4 flex justify-end">
            <button
              class="btn btn-ghost btn-sm text-error"
              type="button"
              :disabled="isDeletingProduct"
              @click="deleteProduct()"
            >
              <span v-if="isDeletingProduct" class="loading loading-spinner loading-sm" />
              <IconTrash v-else class="h-4 w-4" />
              <span>{{ t('developer.apps.distribution.deleteProduct') }}</span>
            </button>
          </div>
        </section>
      </template>

      <CloudFileDrawer
        v-model:open="productIconPickerOpen"
        :allowed-types="['image']"
        :crop-aspect-ratio="1"
        usage="distribution.product.icon"
        @select="onProductIconSelected"
      />
      <CloudFileDrawer
        v-model:open="productBackgroundPickerOpen"
        :allowed-types="['image']"
        :crop-aspect-ratio="16 / 7"
        usage="distribution.product.background"
        @select="onProductBackgroundSelected"
      />
      <CloudFileDrawer
        v-model:open="productPreviewsPickerOpen"
        :allowed-types="['image']"
        :allow-multiple="true"
        usage="distribution.product.previews"
        @select="onProductPreviewsSelected"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconImage, IconPlus, IconTrash, IconX } from '#components'
import { cloudFileReference, emptyProductForm, newProductLocalization } from '~/composables/useDistributionProduct'
import { getFileUrl } from '~/utils/files'
import type { DistributionProduct } from '~/types/distribution'
import type { SnCloudFile } from '~/types/drive'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const developer = useDeveloper()

const pubName = computed(() => route.params.pubName as string)
const slug = computed(() => route.params.slug as string)
const publisherName = computed(() => developer.currentDeveloper.value?.publisher?.name || pubName.value)

const {
  product,
  productName,
  isLoadingProduct,
  isHydrated,
  contentLocale,
  localeName,
  localeOptionsFor,
  availableLocaleOptions,
  productLocalizationEntries,
  isSavingProduct,
  isDeletingProduct,
  saveProduct: saveProductForm,
  deleteProduct,
  loadProduct,
} = useDistributionProduct(pubName, slug, 'developer.apps.distribution.tabs.settings')

const productForm = reactive(emptyProductForm(contentLocale.value))
const newProductLanguage = ref('')
/** Set while the form itself rewrites product state, so the watcher below leaves user input alone. */
const isPrefilling = ref(false)

const productIconPickerOpen = ref(false)
const productBackgroundPickerOpen = ref(false)
const productPreviewsPickerOpen = ref(false)

const availableProductLocaleOptions = computed(() => availableLocaleOptions(productForm.localizations))

function productLocaleOptionsFor(index: number) {
  return localeOptionsFor(productForm.localizations, index)
}

function prefillProductForm(value: DistributionProduct) {
  productForm.slug = value.slug
  productForm.localizations = productLocalizationEntries(
    value.names,
    value.descriptions,
    value.name,
    value.description,
  )
  productForm.icon = value.icon ?? null
  productForm.background = value.background ?? null
  productForm.previews = value.previews ? [...value.previews] : []
  newProductLanguage.value = ''
}

watch(
  product,
  (value) => {
    if (!value || isPrefilling.value) return
    prefillProductForm(value)
  },
  { immediate: true },
)

function addProductLocalization() {
  if (!newProductLanguage.value || productForm.localizations.some((entry) => entry.locale === newProductLanguage.value)) return
  productForm.localizations.push(newProductLocalization(newProductLanguage.value))
  newProductLanguage.value = ''
}

function removeProductLocalization(index: number) {
  productForm.localizations.splice(index, 1)
}

function pickProductIcon() {
  productIconPickerOpen.value = true
}
function onProductIconSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) productForm.icon = cloudFileReference(file)
}
function removeProductIcon() {
  productForm.icon = null
}

function pickProductBackground() {
  productBackgroundPickerOpen.value = true
}
function onProductBackgroundSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) productForm.background = cloudFileReference(file)
}
function removeProductBackground() {
  productForm.background = null
}

function pickProductPreviews() {
  productPreviewsPickerOpen.value = true
}
function onProductPreviewsSelected(files: SnCloudFile | SnCloudFile[] | null) {
  if (!files) return
  productForm.previews = (Array.isArray(files) ? files : [files]).map(cloudFileReference)
}
function removeProductPreview(index: number) {
  productForm.previews.splice(index, 1)
}

async function saveProduct() {
  if (!product.value) return
  isPrefilling.value = true
  try {
    await saveProductForm(productForm)
  } finally {
    isPrefilling.value = false
  }
}

function resetProductForm() {
  if (!product.value) return
  isPrefilling.value = true
  try {
    prefillProductForm(product.value)
  } finally {
    isPrefilling.value = false
  }
}

async function reload() {
  await loadProduct()
}
</script>
