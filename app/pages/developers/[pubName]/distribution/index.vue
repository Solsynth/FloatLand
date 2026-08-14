<template>
  <NuxtLayout name="developer">
    <div class="mx-auto max-w-5xl">
      <AdminPageHeader
        :title="t('developer.apps.distribution.title')"
        :description="t('developer.apps.distribution.description')"
      >
        <template #actions>
          <button class="btn btn-primary btn-sm" type="button" @click="openCreateDrawer">
            <IconPlus class="h-4 w-4" />
            {{ t('developer.apps.distribution.createProduct') }}
          </button>
        </template>
      </AdminPageHeader>

      <div v-if="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <section v-else class="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div v-if="products.length" class="flex flex-col gap-3 border-b border-base-300 bg-base-200/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/75">{{ t('developer.apps.distribution.catalog') }}</p>
            <p class="mt-1 text-xs text-base-content/55">{{ t('developer.apps.distribution.productCount', { count: products.length }) }}</p>
          </div>
          <label class="input input-sm flex w-full items-center gap-2 sm:max-w-xs">
            <IconSearch class="h-4 w-4 text-base-content/45" />
            <input v-model="searchQuery" type="search" :placeholder="t('developer.apps.distribution.searchProducts')" :aria-label="t('developer.apps.distribution.searchProducts')" />
          </label>
        </div>
        <div v-if="visibleProducts.length" class="divide-y divide-base-300">
          <article
            v-for="product in visibleProducts"
            :key="product.id"
            class="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-base-300 bg-base-200">
                <IconPackage class="h-5 w-5 text-base-content/60" />
              </div>
              <div class="min-w-0">
                <h2 class="font-semibold">
                  {{ localizedDistributionText(product.names, product.name, localizationLocales) }}
                </h2>
                <p class="font-mono text-xs text-base-content/55">{{ product.slug }}</p>
                <p v-if="product.description || Object.keys(product.descriptions || {}).length" class="mt-2 max-w-2xl text-sm text-base-content/65">
                  {{ localizedDistributionText(product.descriptions, product.description, localizationLocales) }}
                </p>
                <p class="mt-2 text-xs text-base-content/50">
                  {{ t('developer.apps.distribution.updatedAt') }} {{ formatDate(product.updatedAt) }}
                </p>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap justify-end gap-2 self-start sm:self-center">
              <NuxtLink
                class="btn btn-outline btn-sm"
                :to="productPath(product.slug)"
              >
                {{ t('developer.apps.distribution.manage') }}
                <IconChevronRight class="h-4 w-4" />
              </NuxtLink>
              <button
                class="btn btn-ghost btn-sm text-error"
                type="button"
                :disabled="deletingProductId === product.id"
                @click="deleteProduct(product)"
              >
                <span v-if="deletingProductId === product.id" class="loading loading-spinner loading-sm" />
                <IconTrash v-else class="h-4 w-4" />
                <span class="sr-only">{{ t('developer.apps.distribution.deleteProduct') }}</span>
              </button>
            </div>
          </article>
        </div>

        <div v-else class="flex flex-col items-center px-4 py-16 text-center sm:px-6">
          <IconSearch v-if="products.length" class="mb-4 h-10 w-10 text-base-content/25" />
          <IconPackage v-else class="mb-4 h-10 w-10 text-base-content/25" />
          <p class="text-base-content/60">{{ products.length ? t('developer.apps.distribution.noMatches') : t('developer.apps.distribution.noProducts') }}</p>
          <button v-if="products.length && searchQuery" class="btn btn-ghost btn-sm mt-4" type="button" @click="searchQuery = ''">
            {{ t('developer.apps.distribution.clearSearch') }}
          </button>
          <button v-else class="btn btn-primary btn-sm mt-4" type="button" @click="openCreateDrawer">
            <IconPlus class="h-4 w-4" />
            {{ t('developer.apps.distribution.createProduct') }}
          </button>
        </div>
      </section>

      <AdminDrawer
        :open="createDrawerOpen"
        :title="t('developer.apps.distribution.createProductTitle')"
        content-class="!w-full !max-w-none sm:!w-[65vw]"
        @update:open="createDrawerOpen = $event"
      >
        <form class="space-y-5" @submit.prevent="createProduct">
          <div class="space-y-4">
            <div class="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
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
                <button
                  class="btn btn-outline btn-sm"
                  type="button"
                  :disabled="!newProductLanguage"
                  @click="addProductLocalization"
                >
                  <IconPlus class="h-4 w-4" />
                  {{ t('developer.apps.distribution.addLanguage') }}
                </button>
              </div>
            </div>
            <div
              v-for="(entry, index) in productForm.localizations"
              :key="entry.id"
              class="grid gap-4 border-b border-base-300 pb-4 last:border-0 last:pb-0 sm:grid-cols-2"
            >
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t('developer.apps.distribution.productName') }}</legend>
                <div class="flex gap-2">
                  <select v-model="entry.locale" class="select w-32" :aria-label="t('developer.apps.distribution.selectLanguage')">
                    <option v-for="option in localeOptionsFor(productForm.localizations, index)" :key="option.code" :value="option.code">
                      {{ option.name }}
                    </option>
                  </select>
                  <input
                    v-model="entry.name"
                    type="text"
                    class="input w-full"
                    :placeholder="t('developer.apps.distribution.productName')"
                    required
                  />
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
            <p class="label">{{ t('developer.apps.distribution.productSlugHint') }}</p>
          </fieldset>
          <div class="flex justify-end gap-2 pt-4">
            <button class="btn btn-ghost" type="button" @click="createDrawerOpen = false">
</button>
            <button class="btn btn-primary" type="submit" :disabled="isCreatingProduct">
              <span v-if="isCreatingProduct" class="loading loading-spinner loading-sm" />
              {{ t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { IconChevronRight, IconPackage, IconPlus, IconSearch, IconTrash } from '#components'
import type { DistributionLocalizedText, DistributionProduct } from '~/types/distribution'
import { createDistributionProduct, deleteDistributionProduct, fetchDistributionProducts, localizedDistributionText } from '~/utils/distribution'

definePageMeta({ middleware: 'developer' })

const { t, locale, locales, localeProperties } = useI18n()
const { $toast } = useNuxtApp()
const route = useRoute()
const developer = useDeveloper()
const { currentDeveloper } = developer
const pubName = computed(() => route.params.pubName as string)
const localizationLocales = computed(() => [localeProperties.value.language, locale.value])
const contentLocale = computed(() => localeProperties.value.language || locale.value || 'en-US')
const contentLocaleOptions = computed(() =>
  (locales.value as Array<{ code: string; language?: string; name?: string }>).map((item) => ({
    code: item.language || item.code,
    name: item.name || item.language || item.code,
  })),
)

type ProductLocalizationEntry = {
  id: string
  locale: string
  name: string
  description: string
}

const products = ref<DistributionProduct[]>([])
const searchQuery = ref('')
const visibleProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return products.value
  return products.value.filter((product) => {
    const localizedNames = Object.values(product.names || {}).join(' ')
    return [product.name, product.slug, product.description, localizedNames]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})
const isLoading = ref(false)
const isCreatingProduct = ref(false)
const deletingProductId = ref<string | null>(null)
const createDrawerOpen = ref(false)
const newProductLanguage = ref('')
const productForm = reactive({
  slug: '',
  localizations: [] as ProductLocalizationEntry[],
})

useSolarSeo({ title: `${t('developer.apps.distribution.title')} · ${pubName.value}` })

function productPath(slug: string) {
  return `/developers/${encodeURIComponent(pubName.value)}/distribution/${encodeURIComponent(slug)}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function localeName(localeCode: string) {
  return contentLocaleOptions.value.find((option) => option.code === localeCode)?.name || localeCode
}

function localeOptionsFor(entries: ProductLocalizationEntry[], index: number) {
  const used = new Set(entries.filter((_, entryIndex) => entryIndex !== index).map((entry) => entry.locale))
  return contentLocaleOptions.value.filter((option) => option.code === entries[index].locale || !used.has(option.code))
}

const availableProductLocaleOptions = computed(() => {
  const used = new Set(productForm.localizations.map((entry) => entry.locale))
  return contentLocaleOptions.value.filter((option) => !used.has(option.code))
})

function newProductLocalization(localeCode = contentLocale.value): ProductLocalizationEntry {
  return { id: crypto.randomUUID(), locale: localeCode, name: '', description: '' }
}

function addProductLocalization() {
  if (!newProductLanguage.value || productForm.localizations.some((entry) => entry.locale === newProductLanguage.value)) return
  productForm.localizations.push(newProductLocalization(newProductLanguage.value))
  newProductLanguage.value = ''
}

function removeProductLocalization(index: number) {
  if (productForm.localizations.length > 1) productForm.localizations.splice(index, 1)
}

function localizedMap(entries: ProductLocalizationEntry[], field: 'name' | 'description') {
  return entries.reduce<DistributionLocalizedText>((result, entry) => {
    result[entry.locale] = entry[field].trim()
    return result
  }, {})
}

function openCreateDrawer() {
  productForm.slug = ''
  productForm.localizations = [newProductLocalization()]
  newProductLanguage.value = ''
  createDrawerOpen.value = true
}

async function loadData() {
  searchQuery.value = ''
  isLoading.value = true
  try {
    await developer.loadDevelopers()
    developer.selectByPublisherName(pubName.value)
    products.value = await fetchDistributionProducts(currentDeveloper.value?.publisher?.name || pubName.value)
  } catch (error) {
    products.value = []
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isLoading.value = false
  }
}

async function createProduct() {
  if (!productForm.localizations.length || productForm.localizations.some((entry) => !entry.name.trim() || !entry.description.trim())) {
    $toast.error(t('developer.apps.distribution.localizationRequired'))
    return
  }
  isCreatingProduct.value = true
  try {
    const publisherName = currentDeveloper.value?.publisher?.name || pubName.value
    const names = localizedMap(productForm.localizations, 'name')
    const descriptions = localizedMap(productForm.localizations, 'description')
    const product = await createDistributionProduct(publisherName, {
      slug: productForm.slug,
      name: localizedDistributionText(names, '', localizationLocales.value),
      names,
      description: localizedDistributionText(descriptions, '', localizationLocales.value),
      descriptions,
    })
    products.value = [...products.value, product]
    createDrawerOpen.value = false
    $toast.success(t('developer.apps.distribution.productCreated'))
    await navigateTo(productPath(product.slug))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    isCreatingProduct.value = false
  }
}

async function deleteProduct(product: DistributionProduct) {
  const { confirm } = useAlert()
  if (!(await confirm(
    t('developer.apps.distribution.deleteProduct'),
    t('developer.apps.distribution.deleteProductConfirm', { name: product.name || product.slug }),
  ))) return
  deletingProductId.value = product.id
  try {
    await deleteDistributionProduct(product.id)
    products.value = products.value.filter((item) => item.id !== product.id)
    $toast.success(t('developer.apps.distribution.productDeleted'))
  } catch (error) {
    $toast.error(error instanceof Error ? error.message : t('developer.apps.distribution.requestFailed'))
  } finally {
    deletingProductId.value = null
  }
}

watch(pubName, loadData, { immediate: true })
</script>
