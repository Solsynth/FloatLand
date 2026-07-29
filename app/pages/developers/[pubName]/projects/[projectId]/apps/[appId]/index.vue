<template>
  <NuxtLayout name="developer">
    <div>
      <div v-if="isLoading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else-if="app">
        <!-- App Header -->
        <div class="flex items-center gap-4 mb-6 -mx-4">
          <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/apps`" class="btn btn-ghost btn-sm">
            <IconArrowLeft class="w-4 h-4" />
            {{ t('developer.apps.title') }}
          </NuxtLink>
        </div>

        <div class="card bg-base-100 shadow-sm mb-6">
          <div class="card-body p-5">
            <div class="flex items-start gap-4">
              <div class="avatar">
                <div class="w-16 rounded-full">
                  <img v-if="getFileUrl(app.picture?.id)" :src="getFileUrl(app.picture?.id)" :alt="app.name" />
                  <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-content text-xl font-bold">
                    {{ app.name?.slice(0, 2).toUpperCase() }}
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <h2 class="text-2xl font-bold">{{ app.name }}</h2>
                <p class="text-base-content/50 mt-1">{{ app.slug }}</p>
                <span
                  class="badge badge-sm mt-2"
                  :class="{
                    'badge-success': app.status === 1,
                    'badge-warning': app.status === 0,
                    'badge-error': app.status === -1,
                  }"
                >
                  {{ app.status === 1 ? 'Active' : app.status === 0 ? 'Draft' : 'Disabled' }}
                </span>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-sm" @click="openEditModal">
                  <IconEdit class="w-4 h-4" />
                  {{ t('common.edit') }}
                </button>
                <button class="btn btn-ghost btn-sm text-error" @click="handleDelete">
                  <IconTrash class="w-4 h-4" />
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
            <p v-if="app.description" class="mt-4 text-base-content/70">
              {{ app.description }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Secrets Section -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title text-base">{{ t('developer.apps.secrets.title') }}</h3>
                <button class="btn btn-primary btn-sm" @click="openCreateSecretModal">
                  <IconPlus class="w-4 h-4" />
                  {{ t('developer.apps.secrets.create') }}
                </button>
              </div>
              <div v-if="createdSecretValue" class="rounded-lg p-3 bg-success/10 border border-success/30 mb-3">
                <div class="text-sm font-medium text-success mb-1">{{ t('developer.apps.secrets.created') }}</div>
                <div class="flex items-center gap-2">
                  <code class="text-xs font-mono bg-base-200 rounded px-2 py-1 flex-1 break-all">{{ createdSecretValue }}</code>
                  <button class="btn btn-ghost btn-xs" @click="copySecret(createdSecretValue)">
                    <IconCopy class="w-3 h-3" />
                  </button>
                </div>
                <p class="text-xs text-base-content/50 mt-1">{{ t('developer.apps.secrets.copyNow') }}</p>
              </div>
              <div v-if="secrets.length > 0" class="space-y-2">
                <div
                  v-for="secret in secrets"
                  :key="secret.id"
                  class="flex items-center gap-3 rounded-lg p-3 bg-base-200"
                >
                  <div class="flex-1">
                    <div class="font-medium text-sm">{{ secret.description || t('developer.apps.secrets.noDescription') }}</div>
                    <div class="text-xs text-base-content/50">
                      {{ secretTypeLabel(secret.type) }} &middot; {{ t('developer.apps.secrets.createdAt') }}: {{ formatDate(secret.createdAt) }}
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-xs text-error" @click="handleDeleteSecret(secret.id)">
                    <IconTrash class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-base-content/50">{{ t('developer.apps.secrets.noSecrets') }}</p>
            </div>
          </div>

          <!-- Products Section -->
          <div class="card bg-base-100 shadow-sm lg:col-span-2">
            <div class="card-body p-4">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="card-title text-base">{{ t('developer.apps.products.title') }}</h3>
                  <p class="text-xs text-base-content/50 mt-0.5">{{ t('developer.apps.products.subtitle') }}</p>
                </div>
                <button class="btn btn-primary btn-sm" @click="openCreateProductModal">
                  <IconPlus class="w-4 h-4" />
                  {{ t('developer.apps.products.create') }}
                </button>
              </div>
              <div v-if="products.length > 0" class="space-y-2">
                <div
                  v-for="product in products"
                  :key="product.id"
                  class="flex items-center gap-3 rounded-lg p-3 bg-base-200"
                >
                  <div class="avatar">
                    <div class="w-10 rounded">
                      <img v-if="getFileUrl(product.picture?.id)" :src="getFileUrl(product.picture?.id)" :alt="product.displayName" />
                      <div v-else class="flex h-10 w-10 items-center justify-center rounded bg-base-300 text-base-content/50 text-xs">
                        {{ product.displayName?.slice(0, 2).toUpperCase() }}
                      </div>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <div class="font-medium text-sm">{{ product.displayName }}</div>
                      <span
                        class="badge badge-xs"
                        :class="isProductEnabled(product) ? 'badge-success' : 'badge-ghost'"
                      >
                        {{ isProductEnabled(product) ? t('developer.apps.products.enabled') : t('developer.apps.products.disabled') }}
                      </span>
                      <span
                        v-if="productRecurrenceLabel(product) !== 'none'"
                        class="badge badge-xs badge-outline"
                      >
                        {{ t(`developer.apps.products.recurrence.${productRecurrenceLabel(product)}`) }}
                      </span>
                      <span
                        v-if="product.fulfillment?.isAddressRequired"
                        class="badge badge-xs badge-warning badge-outline"
                      >
                        {{ t('developer.apps.products.addressRequired') }}
                      </span>
                    </div>
                    <div class="text-xs text-base-content/50 mt-0.5">
                      <code class="font-mono text-xs">{{ product.identifier }}</code>
                      &middot; {{ product.currency }} {{ product.price }}
                      <template v-if="productStockLabel(product)">
                        &middot; {{ productStockLabel(product) }}
                      </template>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" @click="openEditProductModal(product)">
                      <IconEdit class="w-3 h-3" />
                    </button>
                    <button class="btn btn-ghost btn-xs text-error" @click="handleDeleteProduct(product.id)">
                      <IconTrash class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-base-content/50">{{ t('developer.apps.products.noProducts') }}</p>
            </div>
          </div>

          <!-- OAuth Config -->
          <div v-if="app.oauthConfig" class="card bg-base-100 shadow-sm">
            <div class="card-body p-4 flex flex-col">
              <h3 class="card-title text-base mb-4">{{ t('developer.apps.oauth.title') }}</h3>
              <div class="space-y-3 flex-1">
                <div>
                  <div class="text-sm font-medium">{{ t('developer.apps.oauth.clientUri') }}</div>
                  <div class="text-sm text-base-content/70">{{ app.oauthConfig.clientUri || '-' }}</div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.apps.oauth.redirectUris') }}</div>
                  <div v-if="app.oauthConfig.redirectUris.length > 0" class="mt-1 space-y-1">
                    <div v-for="uri in app.oauthConfig.redirectUris" :key="uri" class="text-sm text-base-content/70 bg-base-200 rounded px-2 py-1">
                      {{ uri }}
                    </div>
                  </div>
                  <div v-else class="text-sm text-base-content/50">-</div>
                </div>
                <div>
                  <div class="text-sm font-medium">{{ t('developer.apps.oauth.allowedScopes') }}</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span v-for="scope in app.oauthConfig.allowedScopes" :key="scope" class="badge badge-sm">
                      {{ scope }}
                    </span>
                  </div>
                </div>
                <div class="flex gap-4">
                  <div>
                    <div class="text-sm font-medium">{{ t('developer.apps.oauth.requirePkce') }}</div>
                    <div class="text-sm text-base-content/70">{{ app.oauthConfig.requirePkce ? 'Yes' : 'No' }}</div>
                  </div>
                  <div>
                    <div class="text-sm font-medium">{{ t('developer.apps.oauth.allowOfflineAccess') }}</div>
                    <div class="text-sm text-base-content/70">{{ app.oauthConfig.allowOfflineAccess ? 'Yes' : 'No' }}</div>
                  </div>
                  <div>
                    <div class="text-sm font-medium">{{ t('developer.apps.oauth.isPublicClient') }}</div>
                    <div class="text-sm text-base-content/70">{{ app.oauthConfig.isPublicClient ? 'Yes' : 'No' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Links -->
          <div v-if="app.links" class="card bg-base-100 shadow-sm">
            <div class="card-body p-4 flex flex-col">
              <h3 class="card-title text-base mb-4">{{ t('developer.apps.links.title') }}</h3>
              <div class="space-y-2 flex-1">
                <div v-if="app.links.homePage" class="flex items-center gap-2">
                  <IconLink class="w-4 h-4 text-base-content/50" />
                  <a :href="app.links.homePage" target="_blank" class="link link-primary text-sm">{{ app.links.homePage }}</a>
                </div>
                <div v-if="app.links.privacyPolicy" class="flex items-center gap-2">
                  <IconShield class="w-4 h-4 text-base-content/50" />
                  <a :href="app.links.privacyPolicy" target="_blank" class="link link-primary text-sm">{{ app.links.privacyPolicy }}</a>
                </div>
                <div v-if="app.links.termsOfService" class="flex items-center gap-2">
                  <IconFileText class="w-4 h-4 text-base-content/50" />
                  <a :href="app.links.termsOfService" target="_blank" class="link link-primary text-sm">{{ app.links.termsOfService }}</a>
                </div>
                <p v-if="!app.links.homePage && !app.links.privacyPolicy && !app.links.termsOfService" class="text-sm text-base-content/50">
                  {{ t('developer.apps.links.noLinks') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Notifications Section -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4 flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title text-base">
                  <IconBell class="w-5 h-5" />
                  {{ t('developer.apps.notifications.title') }}
                </h3>
                <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/apps/${appId}/notifications`" class="btn btn-primary btn-sm">
                  <IconFlaskConical class="w-4 h-4" />
                  {{ t('developer.apps.notifications.playground') }}
                </NuxtLink>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <!-- API Endpoint -->
                <div class="rounded-xl bg-base-200/60 p-3 flex flex-col justify-center">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-success badge-xs font-bold">POST</span>
                    <code class="text-[11px] text-base-content/50 font-mono truncate">.../{{ appId.slice(0, 8) }}.../notifications</code>
                  </div>
                  <p class="text-xs text-base-content/50 mt-1.5">{{ t('developer.apps.notifications.auth') }}: <code class="bg-base-200 rounded px-1 text-[11px]">X-Api-Key</code></p>
                </div>
                <!-- Delivery & Targeting -->
                <div class="rounded-xl bg-base-200/60 p-3 flex flex-col justify-center">
                  <div class="text-sm font-semibold mb-1.5">{{ t('developer.apps.notifications.targetingModes') }}</div>
                  <div class="flex flex-wrap gap-1.5">
                    <span class="badge badge-sm badge-outline">{{ t('developer.apps.notifications.singleAccount') }}</span>
                    <span class="badge badge-sm badge-outline">{{ t('developer.apps.notifications.multipleAccounts') }}</span>
                    <span class="badge badge-sm badge-outline">{{ t('developer.apps.notifications.broadcastAll') }}</span>
                  </div>
                  <p class="text-[11px] text-base-content/40 mt-2">{{ t('developer.apps.notifications.noteDelivery') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Board Widgets Section -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4 flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <h3 class="card-title text-base">
                  <IconLayoutDashboard class="w-5 h-5" />
                  {{ t('developer.apps.boardWidgets.title') }}
                </h3>
                <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/apps/${appId}/board-widgets`" class="btn btn-primary btn-sm">
                  <IconSettings class="w-4 h-4" />
                  {{ t('developer.apps.boardWidgets.manage') }}
                </NuxtLink>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <!-- API Endpoint -->
                <div class="rounded-xl bg-base-200/60 p-3 flex flex-col justify-center">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-success badge-xs font-bold">POST</span>
                    <code class="text-[11px] text-base-content/50 font-mono truncate">.../{{ appId.slice(0, 8) }}.../board/payload</code>
                  </div>
                  <p class="text-xs text-base-content/50 mt-1.5">
                    {{ t('developer.apps.boardWidgets.payloadPush.authLabel') }}:
                    <code class="bg-base-200 rounded px-1 text-[11px]">X-App-Secret</code>
                  </p>
                </div>
                <!-- Widgets summary -->
                <div class="rounded-xl bg-base-200/60 p-3 flex flex-col justify-center">
                  <div class="text-sm font-semibold mb-1.5">
                    {{ t('developer.apps.boardWidgets.widgetList') }}
                    <span class="text-base-content/40 font-normal">
                      · {{ app.boardWidgets?.length ?? 0 }}
                    </span>
                  </div>
                  <div v-if="app.boardWidgets && app.boardWidgets.length > 0" class="flex flex-wrap gap-1.5">
                    <span
                      v-for="widget in app.boardWidgets.slice(0, 4)"
                      :key="widget.key"
                      class="badge badge-sm badge-outline"
                      :class="widget.isEnabled ? '' : 'opacity-50'"
                      :title="widget.key"
                    >
                      {{ widget.name || widget.key }}
                    </span>
                    <span
                      v-if="app.boardWidgets.length > 4"
                      class="badge badge-sm badge-ghost"
                    >
                      +{{ app.boardWidgets.length - 4 }}
                    </span>
                  </div>
                  <p v-else class="text-xs text-base-content/40">{{ t('developer.apps.boardWidgets.noWidgets') }}</p>
                  <p class="text-[11px] text-base-content/40 mt-2">
                    <code class="bg-base-200 rounded px-1 text-[10px]">accounts.profile.board</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </template>

      <div v-else class="flex flex-col items-center py-8 text-center">
        <IconBoxes class="w-12 h-12 text-base-content/20 mb-4" />
        <p class="text-base-content/60">{{ t('developer.apps.notFound') }}</p>
        <NuxtLink :to="`/developers/${pubName}/projects/${projectId}/apps`" class="btn btn-primary btn-sm mt-4">
          {{ t('developer.apps.backToList') }}
        </NuxtLink>
      </div>

      <!-- Edit App Drawer -->
      <AdminDrawer
        :open="editModalOpen"
        @update:open="editModalOpen = $event"
        content-class="max-w-2xl"
      >
        <template #header>
          <h3 class="font-bold text-lg truncate">{{ t('common.edit') }} - {{ app?.name }}</h3>
        </template>

        <div class="tabs tabs-border mb-4">
          <button
            v-for="tab in editTabs"
            :key="tab.key"
            class="tab"
            :class="{ 'tab-active': editActiveTab === tab.key }"
            @click="editActiveTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Basic Info Tab -->
        <form v-if="editActiveTab === 'basic'" @submit.prevent="handleUpdateBasic">
          <!-- Picture & Background -->
          <div class="flex items-center gap-4 mb-4">
            <div class="relative group">
              <div class="avatar cursor-pointer" @click="pickPicture">
                <div class="w-16 rounded-full">
                  <img v-if="picturePreview" :src="picturePreview" />
                  <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-base-300 text-base-content/50">
                    <IconCamera class="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" @click="pickPicture">
                <IconCamera class="w-5 h-5 text-white" />
              </div>
            </div>
            <div class="flex-1">
              <div class="relative group cursor-pointer rounded-lg overflow-hidden h-20 bg-base-300" @click="pickBackground">
                <img v-if="backgroundPreview" :src="backgroundPreview" class="w-full h-full object-cover" />
                <div v-else class="flex h-full items-center justify-center text-base-content/50">
                  <span class="text-xs">{{ t('developer.apps.background') ?? 'Background' }}</span>
                </div>
                <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconCamera class="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>


          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.name') }}</legend>
            <input v-model="editForm.name" type="text" class="input w-full" required />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.slug') }}</legend>
            <input v-model="editForm.slug" type="text" class="input w-full" required />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.description') }}</legend>
            <textarea v-model="editForm.description" class="textarea w-full" rows="3" />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.status') }}</legend>
            <select v-model="editForm.status" class="select w-full">
              <option :value="-1">{{ t('developer.apps.statusDisabled') }}</option>
              <option :value="0">{{ t('developer.apps.statusDraft') }}</option>
              <option :value="1">{{ t('developer.apps.statusActive') }}</option>
            </select>
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="editModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isUpdatingApp">
              <span v-if="isUpdatingApp" class="loading loading-spinner loading-sm" />
              {{ t('common.save') }}
            </button>
          </div>
        </form>

        <!-- OAuth Tab -->
        <form v-else-if="editActiveTab === 'oauth'" @submit.prevent="handleUpdateOAuth">
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.oauth.clientUri') }}</legend>
            <input v-model="oauthForm.clientUri" type="url" class="input w-full" placeholder="https://example.com" />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">
              {{ t('developer.apps.oauth.redirectUris') }}
              <span class="text-xs text-base-content/40">one per line</span>
            </legend>
            <textarea v-model="oauthForm.redirectUris" class="textarea w-full" rows="3" placeholder="https://example.com/callback" />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.oauth.allowedScopes') }}</legend>
            <TagsInputRoot
              v-model="oauthForm.allowedScopes"
              :delimiter="/[ ,;\t\n\r]+/"
              add-on-paste
              add-on-blur
              add-on-tab
              class="input flex h-auto min-h-12 w-full flex-wrap items-center gap-2 py-2"
            >
              <TagsInputItem
                v-for="scope in oauthForm.allowedScopes"
                :key="scope"
                :value="scope"
                class="badge badge-primary gap-1"
              >
                <TagsInputItemText />
                <TagsInputItemDelete class="btn btn-ghost btn-xs btn-circle">
                  <IconX class="h-3 w-3" />
                </TagsInputItemDelete>
              </TagsInputItem>
              <TagsInputInput
                class="min-w-32 flex-1 bg-transparent outline-none"
                placeholder="openid"
              />
            </TagsInputRoot>
          </fieldset>
          <div class="flex flex-wrap gap-4 mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="oauthForm.requirePkce" type="checkbox" class="checkbox checkbox-sm" />
              <span class="text-sm">{{ t('developer.apps.oauth.requirePkce') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="oauthForm.allowOfflineAccess" type="checkbox" class="checkbox checkbox-sm" />
              <span class="text-sm">{{ t('developer.apps.oauth.allowOfflineAccess') }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="oauthForm.isPublicClient" type="checkbox" class="checkbox checkbox-sm" />
              <span class="text-sm">{{ t('developer.apps.oauth.isPublicClient') }}</span>
            </label>
          </div>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="editModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isUpdatingApp">
              <span v-if="isUpdatingApp" class="loading loading-spinner loading-sm" />
              {{ t('common.save') }}
            </button>
          </div>
        </form>

        <!-- Links Tab -->
        <form v-else-if="editActiveTab === 'links'" @submit.prevent="handleUpdateLinks">
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.links.homePage') ?? 'Home Page' }}</legend>
            <input v-model="linksForm.homePage" type="url" class="input w-full" placeholder="https://example.com" />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.links.privacyPolicy') ?? 'Privacy Policy' }}</legend>
            <input v-model="linksForm.privacyPolicy" type="url" class="input w-full" placeholder="https://example.com/privacy" />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.links.termsOfService') ?? 'Terms of Service' }}</legend>
            <input v-model="linksForm.termsOfService" type="url" class="input w-full" placeholder="https://example.com/terms" />
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="editModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isUpdatingApp">
              <span v-if="isUpdatingApp" class="loading loading-spinner loading-sm" />
              {{ t('common.save') }}
            </button>
          </div>
        </form>

      </AdminDrawer>

      <!-- Create Secret Drawer -->
      <AdminDrawer
        :open="secretModalOpen"
        :title="t('developer.apps.secrets.create')"
        @update:open="secretModalOpen = $event"
      >
        <form @submit.prevent="handleCreateSecret">
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.secrets.description') }}</legend>
            <input
              v-model="newSecret.description"
              type="text"
              class="input w-full"
            />
          </fieldset>
          <fieldset class="fieldset mb-4">
            <legend class="fieldset-legend">{{ t('developer.apps.secrets.type') }}</legend>
            <select v-model.number="newSecret.type" class="select w-full">
              <option :value="1">{{ t('developer.apps.secrets.typeApiKey') }}</option>
              <option :value="0">{{ t('developer.apps.secrets.typeOidc') }}</option>
            </select>
          </fieldset>
          <div class="flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost" @click="secretModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="isCreatingSecret">
              <span v-if="isCreatingSecret" class="loading loading-spinner loading-sm" />
              {{ t('common.create') }}
            </button>
          </div>
        </form>
      </AdminDrawer>
    </div>

    <!-- File Pickers -->
    <!-- Product Drawer -->
    <AdminDrawer
      :open="productModalOpen"
      :title="editingProduct ? t('developer.apps.products.edit') : t('developer.apps.products.create')"
      @update:open="productModalOpen = $event"
      content-class="max-w-2xl"
    >
      <form @submit.prevent="handleSaveProduct">
        <!-- Media -->
        <div class="flex items-center gap-4 mb-4">
          <div class="relative group">
            <div class="avatar cursor-pointer" @click="pickProductPicture">
              <div class="w-16 rounded">
                <img v-if="productPicturePreview" :src="productPicturePreview" />
                <div v-else class="flex h-16 w-16 items-center justify-center rounded bg-base-300 text-base-content/50">
                  <IconCamera class="w-6 h-6" />
                </div>
              </div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" @click="pickProductPicture">
              <IconCamera class="w-5 h-5 text-white" />
            </div>
          </div>
          <div class="flex-1">
            <div class="relative group cursor-pointer rounded-lg overflow-hidden h-16 bg-base-300" @click="pickProductBackground">
              <img v-if="productBackgroundPreview" :src="productBackgroundPreview" class="w-full h-full object-cover" />
              <div v-else class="flex h-full items-center justify-center text-base-content/50">
                <span class="text-xs">{{ t('developer.apps.products.background') }}</span>
              </div>
              <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconCamera class="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        <!-- Catalog -->
        <div class="divider text-xs text-base-content/40 my-2">{{ t('developer.apps.products.sectionCatalog') }}</div>

        <fieldset class="fieldset mb-4">
          <legend class="fieldset-legend">{{ t('developer.apps.products.sku') }}</legend>
          <input v-model="productForm.sku" type="text" class="input w-full" required :disabled="!!editingProduct" placeholder="premium_boost" />
          <p class="text-xs text-base-content/50 mt-1">
            {{ t('developer.apps.products.identifierHint') }}
          </p>
        </fieldset>
        <fieldset class="fieldset mb-4">
          <legend class="fieldset-legend">{{ t('developer.apps.products.displayName') }}</legend>
          <input v-model="productForm.displayName" type="text" class="input w-full" required />
        </fieldset>
        <fieldset class="fieldset mb-4">
          <legend class="fieldset-legend">{{ t('developer.apps.products.description') }}</legend>
          <textarea v-model="productForm.description" class="textarea w-full" rows="2" />
        </fieldset>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('developer.apps.products.currency') }}</legend>
            <select v-model="productForm.currency" class="select w-full" required>
              <option value="points">points</option>
              <option value="golds">golds</option>
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('developer.apps.products.price') }}</legend>
            <input v-model.number="productForm.price" type="number" class="input w-full" required min="0" step="0.01" />
          </fieldset>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('developer.apps.products.recurrenceLabel') }}</legend>
            <select v-model="productForm.recurrence" class="select w-full">
              <option value="none">{{ t('developer.apps.products.recurrence.none') }}</option>
              <option value="weekly">{{ t('developer.apps.products.recurrence.weekly') }}</option>
              <option value="monthly">{{ t('developer.apps.products.recurrence.monthly') }}</option>
              <option value="yearly">{{ t('developer.apps.products.recurrence.yearly') }}</option>
            </select>
            <p class="text-xs text-base-content/50 mt-1">{{ t('developer.apps.products.recurrenceHint') }}</p>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('developer.apps.products.groupIdentifier') }}</legend>
            <input
              v-model="productForm.groupIdentifier"
              type="text"
              class="input w-full"
              :disabled="productForm.recurrence === 'none'"
              placeholder="premium_tier"
            />
            <p class="text-xs text-base-content/50 mt-1">{{ t('developer.apps.products.groupIdentifierHint') }}</p>
          </fieldset>
        </div>

        <!-- Fulfillment -->
        <div class="divider text-xs text-base-content/40 my-2">{{ t('developer.apps.products.sectionFulfillment') }}</div>

        <label class="flex items-center gap-2 cursor-pointer mb-4">
          <input v-model="productForm.isAddressRequired" type="checkbox" class="checkbox checkbox-sm" />
          <span class="text-sm">{{ t('developer.apps.products.isAddressRequired') }}</span>
        </label>
        <p class="text-xs text-base-content/50 -mt-3 mb-4">{{ t('developer.apps.products.isAddressRequiredHint') }}</p>

        <fieldset class="fieldset mb-4">
          <legend class="fieldset-legend">{{ t('developer.apps.products.requiredScopes') }}</legend>
          <TagsInputRoot
            v-model="productForm.requiredScopes"
            :delimiter="/[ ,;\t\n\r]+/"
            add-on-paste
            add-on-blur
            add-on-tab
            class="input flex h-auto min-h-12 w-full flex-wrap items-center gap-2 py-2"
          >
            <TagsInputItem
              v-for="scope in productForm.requiredScopes"
              :key="scope"
              :value="scope"
              class="badge badge-primary gap-1"
            >
              <TagsInputItemText />
              <TagsInputItemDelete class="btn btn-ghost btn-xs btn-circle">
                <IconX class="h-3 w-3" />
              </TagsInputItemDelete>
            </TagsInputItem>
            <TagsInputInput
              class="min-w-32 flex-1 bg-transparent outline-none"
              placeholder="contacts.read"
            />
          </TagsInputRoot>
          <p class="text-xs text-base-content/50 mt-1">{{ t('developer.apps.products.requiredScopesHint') }}</p>
        </fieldset>

        <!-- State / Stock -->
        <div class="divider text-xs text-base-content/40 my-2">{{ t('developer.apps.products.sectionState') }}</div>

        <label class="flex items-center gap-2 cursor-pointer mb-4">
          <input v-model="productForm.isEnabled" type="checkbox" class="checkbox checkbox-sm" />
          <span class="text-sm">{{ t('developer.apps.products.isEnabled') }}</span>
        </label>
        <p class="text-xs text-base-content/50 -mt-3 mb-4">{{ t('developer.apps.products.isEnabledHint') }}</p>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('developer.apps.products.stockMode') }}</legend>
            <select v-model="productForm.stockMode" class="select w-full">
              <option value="unlimited">{{ t('developer.apps.products.stockModes.unlimited') }}</option>
              <option value="daily">{{ t('developer.apps.products.stockModes.daily') }}</option>
              <option value="weekly">{{ t('developer.apps.products.stockModes.weekly') }}</option>
              <option value="monthly">{{ t('developer.apps.products.stockModes.monthly') }}</option>
              <option value="yearly">{{ t('developer.apps.products.stockModes.yearly') }}</option>
              <option value="manual">{{ t('developer.apps.products.stockModes.manual') }}</option>
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t('developer.apps.products.stockQuantity') }}</legend>
            <input
              v-model.number="productForm.stockQuantity"
              type="number"
              class="input w-full"
              min="0"
              step="1"
              :disabled="productForm.stockMode === 'unlimited'"
              :placeholder="productForm.stockMode === 'unlimited' ? '—' : '100'"
            />
            <p v-if="productForm.stockMode === 'manual'" class="text-xs text-base-content/50 mt-1">
              {{ t('developer.apps.products.stockQuantityManualHint') }}
            </p>
            <p v-else-if="productForm.stockMode !== 'unlimited'" class="text-xs text-base-content/50 mt-1">
              {{ t('developer.apps.products.stockQuantityWindowHint') }}
            </p>
          </fieldset>
        </div>

        <div
          v-if="editingProduct?.state?.lastRestockedAt"
          class="rounded-lg bg-base-200/60 p-3 mb-4 text-xs text-base-content/60"
        >
          {{ t('developer.apps.products.lastRestocked') }}:
          {{ formatDate(String(editingProduct.state.lastRestockedAt)) }}
          <template v-if="editingProduct.state.lastRestockedQuantity != null">
            ({{ editingProduct.state.lastRestockedQuantity }})
          </template>
        </div>

        <div class="flex items-center justify-between gap-3">
          <button type="button" class="btn btn-ghost" @click="productModalOpen = false">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="isSavingProduct">
            <span v-if="isSavingProduct" class="loading loading-spinner loading-sm" />
            {{ editingProduct ? t('common.save') : t('common.create') }}
          </button>
        </div>
      </form>
    </AdminDrawer>

    <CloudFileDrawer
      v-model:open="picturePickerOpen"
      :allowed-types="['image']"
      :crop-aspect-ratio="1"
      usage="app.icon"
      @select="onPictureSelected"
    />
    <CloudFileDrawer
      v-model:open="backgroundPickerOpen"
      :allowed-types="['image']"
      :crop-aspect-ratio="16/7"
      usage="app.background"
      @select="onBackgroundSelected"
    />
    <CloudFileDrawer
      v-model:open="productPicturePickerOpen"
      :allowed-types="['image']"
      :crop-aspect-ratio="1"
      usage="app.product"
      @select="onProductPictureSelected"
    />
    <CloudFileDrawer
      v-model:open="productBackgroundPickerOpen"
      :allowed-types="['image']"
      :crop-aspect-ratio="16/7"
      usage="app.product"
      @select="onProductBackgroundSelected"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import {
  IconArrowLeft,
  IconBell,
  IconEdit,
  IconTrash,
  IconPlus,
  IconBoxes,
  IconLink,
  IconShield,
  IconFileText,
  IconCamera,
  IconCopy,
  IconFlaskConical,
  IconLayoutDashboard,
  IconSettings,
  IconX,
} from '#components'
import {
  TagsInputRoot,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from 'reka-ui'
import { getFileUrl } from '~/utils/files'
import type { SnCloudFile } from '~/types/drive'
import type { CustomApp, CustomAppSecret, AppProduct, AppProductWritePayload } from '~/types/developer'
import {
  fetchCustomApp,
  updateCustomApp,
  deleteCustomApp,
  fetchAppSecrets,
  createAppSecret,
  deleteAppSecret,
  fetchAppProducts,
  createAppProduct,
  updateAppProduct,
  deleteAppProduct,
} from '~/utils/developer'

definePageMeta({ middleware: 'developer' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pubName = computed(() => route.params.pubName as string)
const projectId = computed(() => route.params.projectId as string)
const appId = computed(() => route.params.appId as string)
const developer = useDeveloper()

const app = ref<CustomApp | null>(null)
const secrets = ref<CustomAppSecret[]>([])
const products = ref<AppProduct[]>([])
const isLoading = ref(false)
const secretModalOpen = ref(false)
const isCreatingSecret = ref(false)
const editModalOpen = ref(false)
const isUpdatingApp = ref(false)
const editActiveTab = ref<'basic' | 'oauth' | 'links'>('basic')
const productModalOpen = ref(false)
const isSavingProduct = ref(false)
const editingProduct = ref<AppProduct | null>(null)
const productPictureId = ref<string | null>(null)
const productBackgroundId = ref<string | null>(null)
const productPicturePickerOpen = ref(false)
const productBackgroundPickerOpen = ref(false)



const editTabs = computed(() => [
  { key: 'basic' as const, label: t('developer.apps.name') },
  { key: 'oauth' as const, label: t('developer.apps.oauth.title') },
  { key: 'links' as const, label: t('developer.apps.links.title') },
])

const editForm = reactive({
  name: '',
  slug: '',
  description: '',
  status: 0,
})

const oauthForm = reactive({
  clientUri: '',
  redirectUris: '',
  allowedScopes: [] as string[],
  requirePkce: false,
  allowOfflineAccess: false,
  isPublicClient: false,
})

const linksForm = reactive({
  homePage: '',
  privacyPolicy: '',
  termsOfService: '',
})

const newSecret = reactive({
  description: '',
  type: 0,
})
const createdSecretValue = ref<string | null>(null)

const productForm = reactive({
  sku: '',
  displayName: '',
  description: '',
  currency: '',
  price: 0,
  recurrence: 'none' as 'none' | 'weekly' | 'monthly' | 'yearly',
  groupIdentifier: '',
  isAddressRequired: false,
  requiredScopes: [] as string[],
  isEnabled: true,
  stockMode: 'unlimited' as 'unlimited' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual',
  stockQuantity: null as number | null,
})

// ponytail: full identifier is <project.slug>.<app.slug>.<sku>, stored as-is

const RECURRENCE_BY_NUM: Record<number, 'none' | 'weekly' | 'monthly' | 'yearly'> = {
  0: 'none',
  1: 'weekly',
  2: 'monthly',
  3: 'yearly',
}

const STOCK_MODE_BY_NUM: Record<number, 'unlimited' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual'> = {
  0: 'unlimited',
  1: 'daily',
  2: 'weekly',
  3: 'monthly',
  4: 'yearly',
  5: 'manual',
}

function normalizeRecurrence(value: AppProduct['recurrence']): 'none' | 'weekly' | 'monthly' | 'yearly' {
  if (typeof value === 'number') return RECURRENCE_BY_NUM[value] ?? 'none'
  if (typeof value === 'string') {
    const key = value.toLowerCase()
    if (key === 'weekly' || key === 'monthly' || key === 'yearly' || key === 'none') return key
  }
  return 'none'
}

function normalizeStockMode(value: unknown): 'unlimited' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual' {
  if (typeof value === 'number') return STOCK_MODE_BY_NUM[value] ?? 'unlimited'
  if (typeof value === 'string') {
    const key = value.toLowerCase()
    if (key === 'daily' || key === 'weekly' || key === 'monthly' || key === 'yearly' || key === 'manual' || key === 'unlimited') {
      return key
    }
  }
  return 'unlimited'
}

function isProductEnabled(product: AppProduct) {
  return product.state?.isEnabled !== false
}

function productRecurrenceLabel(product: AppProduct) {
  return normalizeRecurrence(product.recurrence)
}

function productStockLabel(product: AppProduct): string | null {
  const mode = normalizeStockMode(product.state?.stockMode)
  if (mode === 'unlimited') return t('developer.apps.products.stockModes.unlimited')
  const qty = product.state?.stockQuantity
  const modeLabel = t(`developer.apps.products.stockModes.${mode}`)
  return qty != null ? `${modeLabel}: ${qty}` : modeLabel
}

// Picture / background
const pictureId = ref<string | null>(null)
const backgroundId = ref<string | null>(null)
const picturePickerOpen = ref(false)
const backgroundPickerOpen = ref(false)

const picturePreview = computed(() => getFileUrl(pictureId.value))
const backgroundPreview = computed(() => getFileUrl(backgroundId.value))

defineOgImage('UniOgImage', { title: `${t('developer.apps.detail')} - ${pubName.value}` })

useSolarSeo({ title: `${t('developer.apps.detail')} - ${pubName.value}` })

const productPicturePreview = computed(() => getFileUrl(productPictureId.value))
const productBackgroundPreview = computed(() => getFileUrl(productBackgroundId.value))

function formatAmount(amount: number | undefined | null) {
  if (amount == null) return '0'
  return new Intl.NumberFormat().format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

async function loadData() {
  isLoading.value = true
  try {
    await developer.loadDevelopers()
    developer.selectByPublisherName(pubName.value)
    await developer.loadProject(pubName.value, projectId.value)

    const appData = await fetchCustomApp(pubName.value, projectId.value, appId.value)
    app.value = appData
    if (appData) {
      developer.currentApp.value = { id: appData.id, name: appData.name, slug: appData.slug }
    }

    const secretsResult = await fetchAppSecrets(pubName.value, projectId.value, appId.value)
    secrets.value = secretsResult

    const productsResult = await fetchAppProducts(pubName.value, projectId.value, appId.value)
    products.value = productsResult

  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function pickPicture() {
  picturePickerOpen.value = true
}

function pickBackground() {
  backgroundPickerOpen.value = true
}

function onPictureSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    pictureId.value = file.id
  }
}

function onBackgroundSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    backgroundId.value = file.id
  }
}

function openEditModal() {
  if (!app.value) return
  editActiveTab.value = 'basic'
  editForm.name = app.value.name
  editForm.slug = app.value.slug
  editForm.description = app.value.description ?? ''
  editForm.status = app.value.status
  const oc = app.value.oauthConfig
  oauthForm.clientUri = oc?.clientUri ?? ''
  oauthForm.redirectUris = oc?.redirectUris?.join('\n') ?? ''
  oauthForm.allowedScopes = [...(oc?.allowedScopes ?? [])]
  oauthForm.requirePkce = oc?.requirePkce ?? false
  oauthForm.allowOfflineAccess = oc?.allowOfflineAccess ?? false
  oauthForm.isPublicClient = oc?.isPublicClient ?? false
  const lk = app.value.links
  linksForm.homePage = lk?.homePage ?? ''
  linksForm.privacyPolicy = lk?.privacyPolicy ?? ''
  linksForm.termsOfService = lk?.termsOfService ?? ''
  pictureId.value = app.value.picture?.id ?? null
  backgroundId.value = app.value.background?.id ?? null
  editModalOpen.value = true
}

async function handleUpdateBasic() {
  isUpdatingApp.value = true
  try {
    await updateCustomApp(pubName.value, projectId.value, appId.value, {
      name: editForm.name,
      slug: editForm.slug,
      description: editForm.description || null,
      pictureId: pictureId.value ?? undefined,
      backgroundId: backgroundId.value ?? undefined,
      status: editForm.status,
    })
    editModalOpen.value = false
    app.value = await fetchCustomApp(pubName.value, projectId.value, appId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isUpdatingApp.value = false
  }
}

async function handleUpdateOAuth() {
  isUpdatingApp.value = true
  try {
    const uris = oauthForm.redirectUris
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const scopes = oauthForm.allowedScopes
      .map(s => s.trim())
      .filter(Boolean)
    await updateCustomApp(pubName.value, projectId.value, appId.value, {
      oauthConfig: {
        clientUri: oauthForm.clientUri || null,
        redirectUris: uris,
        allowedScopes: scopes,
        requirePkce: oauthForm.requirePkce,
        allowOfflineAccess: oauthForm.allowOfflineAccess,
        isPublicClient: oauthForm.isPublicClient,
      },
    })
    editModalOpen.value = false
    app.value = await fetchCustomApp(pubName.value, projectId.value, appId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isUpdatingApp.value = false
  }
}

async function handleUpdateLinks() {
  isUpdatingApp.value = true
  try {
    await updateCustomApp(pubName.value, projectId.value, appId.value, {
      links: {
        homePage: linksForm.homePage || null,
        privacyPolicy: linksForm.privacyPolicy || null,
        termsOfService: linksForm.termsOfService || null,
      },
    })
    editModalOpen.value = false
    app.value = await fetchCustomApp(pubName.value, projectId.value, appId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isUpdatingApp.value = false
  }
}

async function handleDelete() {
  if (!confirm(t('developer.apps.deleteConfirm'))) return
  try {
    await deleteCustomApp(pubName.value, projectId.value, appId.value)
    router.push(`/developers/${pubName.value}/projects/${projectId.value}/apps`)
  } catch (e) {
    console.error(e)
  }
}

function openCreateSecretModal() {
  newSecret.description = ''
  newSecret.type = 0
  secretModalOpen.value = true
}

async function handleCreateSecret() {
  isCreatingSecret.value = true
  try {
    const created = await createAppSecret(pubName.value, projectId.value, appId.value, {
      description: newSecret.description || undefined,
      type: newSecret.type,
    })
    createdSecretValue.value = created.secret ?? null
    secretModalOpen.value = false
    secrets.value = await fetchAppSecrets(pubName.value, projectId.value, appId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isCreatingSecret.value = false
  }
}

function copySecret(value: string | null) {
  if (value) navigator.clipboard.writeText(value)
}

function secretTypeLabel(type: number) {
  return type === 0 ? 'OIDC' : 'ApiKey'
}

async function handleDeleteSecret(secretId: string) {
  if (!confirm(t('developer.apps.secrets.deleteConfirm'))) return
  try {
    await deleteAppSecret(pubName.value, projectId.value, appId.value, secretId)
    secrets.value = await fetchAppSecrets(pubName.value, projectId.value, appId.value)
  } catch (e) {
    console.error(e)
  }
}

// ── Product handlers ──

function resetProductForm() {
  productForm.sku = ''
  productForm.displayName = ''
  productForm.description = ''
  productForm.currency = 'points'
  productForm.price = 0
  productForm.recurrence = 'none'
  productForm.groupIdentifier = ''
  productForm.isAddressRequired = false
  productForm.requiredScopes = []
  productForm.isEnabled = true
  productForm.stockMode = 'unlimited'
  productForm.stockQuantity = null
  productPictureId.value = null
  productBackgroundId.value = null
}

function openCreateProductModal() {
  editingProduct.value = null
  resetProductForm()
  productModalOpen.value = true
}

function openEditProductModal(product: AppProduct) {
  editingProduct.value = product
  productForm.sku = product.identifier
  productForm.displayName = product.displayName
  productForm.description = product.description ?? ''
  productForm.currency = product.currency
  productForm.price = product.price
  productForm.recurrence = normalizeRecurrence(product.recurrence)
  productForm.groupIdentifier = product.groupIdentifier ?? ''
  productForm.isAddressRequired = product.fulfillment?.isAddressRequired ?? false
  productForm.requiredScopes = [...(product.fulfillment?.requiredScopes ?? [])]
  productForm.isEnabled = product.state?.isEnabled ?? true
  productForm.stockMode = normalizeStockMode(product.state?.stockMode)
  productForm.stockQuantity = product.state?.stockQuantity ?? null
  productPictureId.value = product.picture?.id ?? null
  productBackgroundId.value = product.background?.id ?? null
  productModalOpen.value = true
}

function pickProductPicture() {
  productPicturePickerOpen.value = true
}

function pickProductBackground() {
  productBackgroundPickerOpen.value = true
}

function onProductPictureSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    productPictureId.value = file.id
  }
}

function onProductBackgroundSelected(file: SnCloudFile | SnCloudFile[] | null) {
  if (file && !Array.isArray(file)) {
    productBackgroundId.value = file.id
  }
}

function buildProductPayload(): AppProductWritePayload & {
  identifier: string
  displayName: string
  currency: string
  price: number
} {
  const scopes = productForm.requiredScopes.map(s => s.trim()).filter(Boolean)
  const stockQuantity =
    productForm.stockMode === 'unlimited'
      ? null
      : (productForm.stockQuantity ?? null)

  return {
    identifier: productForm.sku,
    displayName: productForm.displayName,
    description: productForm.description || undefined,
    currency: productForm.currency,
    price: productForm.price,
    pictureId: productPictureId.value ?? undefined,
    backgroundId: productBackgroundId.value ?? undefined,
    recurrence: productForm.recurrence,
    // empty string clears group on PATCH (backend only applies when value is non-null)
    groupIdentifier: productForm.recurrence === 'none' ? '' : (productForm.groupIdentifier || ''),
    fulfillment: {
      isAddressRequired: productForm.isAddressRequired,
      requiredScopes: scopes,
    },
    state: {
      isEnabled: productForm.isEnabled,
      stockMode: productForm.stockMode,
      stockQuantity,
    },
  }
}

async function handleSaveProduct() {
  isSavingProduct.value = true
  try {
    const data = buildProductPayload()
    if (editingProduct.value) {
      await updateAppProduct(pubName.value, projectId.value, appId.value, editingProduct.value.id, data)
    } else {
      await createAppProduct(pubName.value, projectId.value, appId.value, data)
    }
    productModalOpen.value = false
    products.value = await fetchAppProducts(pubName.value, projectId.value, appId.value)
  } catch (e) {
    console.error(e)
  } finally {
    isSavingProduct.value = false
  }
}

async function handleDeleteProduct(productId: string) {
  if (!confirm(t('developer.apps.products.deleteConfirm'))) return
  try {
    await deleteAppProduct(pubName.value, projectId.value, appId.value, productId)
    products.value = await fetchAppProducts(pubName.value, projectId.value, appId.value)
  } catch (e) {
    console.error(e)
  }
}

// Load on mount and when route params change
watch([pubName, projectId, appId], () => {
  loadData()
}, { immediate: true })
</script>
