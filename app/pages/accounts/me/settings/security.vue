<template>
    <div class="max-w-3xl mx-auto space-y-6 min-w-0">
        <h1 class="text-2xl font-bold mb-6 max-lg:px-4">{{ t('settings.securityTitle') }}</h1>

        <!-- Password reset (Island: captcha + recovery email, not in-place change) -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <h2 class="card-title text-lg mb-2">{{ t('settings.changePassword') }}</h2>
                <p class="text-sm text-base-content/60 mb-4">
                    {{ t('settings.passwordChangeDescription') }}
                </p>

                <div v-if="showPasswordCaptcha" class="space-y-3 mb-4">
                    <CaptchaWidget @verified="onPasswordCaptchaVerified" />
                    <button class="btn btn-ghost btn-sm" @click="showPasswordCaptcha = false">
                        {{ t('settings.cancel') }}
                    </button>
                </div>

                <div v-else class="flex flex-wrap gap-2">
                    <button
                        class="btn btn-primary"
                        :disabled="isRequestingPasswordReset"
                        @click="showPasswordCaptcha = true"
                    >
                        <IconLoader v-if="isRequestingPasswordReset" class="w-4 h-4 animate-spin" />
                        <IconKey v-else class="w-4 h-4" />
                        {{ t('settings.requestPasswordChange') }}
                    </button>
                    <p v-if="passwordResetSent" class="text-sm text-success self-center">
                        {{ t('settings.passwordChangeSent') }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Contact methods -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h2 class="card-title text-lg">{{ t('settings.contactMethods') }}</h2>
                    <button class="btn btn-sm btn-primary" @click="showAddContact = true">
                        <IconPlus class="w-4 h-4" />
                        {{ t('settings.addContact') }}
                    </button>
                </div>
                <p class="text-sm text-base-content/60 mb-4">
                    {{ t('settings.contactMethodsDescription') }}
                </p>

                <div v-if="contactsPending" class="flex justify-center py-6">
                    <span class="loading loading-spinner" />
                </div>
                <div v-else-if="contactsError" class="alert alert-error">
                    <span>{{ t('settings.loadContactsFail') }}</span>
                    <button class="btn btn-sm btn-ghost" @click="refreshContacts">{{ t('settings.retry') }}</button>
                </div>
                <div v-else-if="!contacts?.length" class="text-center py-6 text-base-content/60">
                    <p>{{ t('settings.noContacts') }}</p>
                </div>
                <div v-else class="space-y-3">
                    <div
                        v-for="contact in contacts"
                        :key="contact.id"
                        class="flex items-center justify-between gap-3 p-4 bg-base-200 rounded-box"
                    >
                        <div class="min-w-0">
                            <p class="font-medium truncate" :class="{ 'line-through opacity-60': !contact.verifiedAt }">
                                {{ contact.content }}
                            </p>
                            <p class="text-xs text-base-content/60">
                                {{ contact.type === 0 ? t('settings.contactEmail') : t('settings.contactPhone') }}
                                <span v-if="contact.isPrimary" class="badge badge-primary badge-xs ml-1">{{ t('settings.primary') }}</span>
                                <span v-if="contact.isPublic" class="badge badge-ghost badge-xs ml-1">{{ t('settings.public') }}</span>
                                <span v-if="!contact.verifiedAt" class="badge badge-warning badge-xs ml-1">{{ t('settings.unverified') }}</span>
                            </p>
                        </div>
                        <div class="flex gap-1 shrink-0">
                            <button
                                v-if="!contact.verifiedAt"
                                class="btn btn-ghost btn-xs"
                                :disabled="isProcessing === contact.id"
                                :title="t('settings.verifyContact')"
                                @click="requestContactVerify(contact.id)"
                            >
                                <IconMail class="w-4 h-4" />
                            </button>
                            <button
                                v-if="contact.verifiedAt && !contact.isPrimary"
                                class="btn btn-ghost btn-xs"
                                :disabled="isProcessing === contact.id"
                                :title="t('settings.setPrimary')"
                                @click="makePrimaryContact(contact.id)"
                            >
                                <IconCheck class="w-4 h-4" />
                            </button>
                            <button
                                class="btn btn-ghost btn-xs"
                                :disabled="isProcessing === contact.id"
                                :title="contact.isPublic ? t('settings.makePrivate') : t('settings.makePublic')"
                                @click="toggleContactPublic(contact)"
                            >
                                <IconGlobe class="w-4 h-4" />
                            </button>
                            <button
                                class="btn btn-ghost btn-xs text-error"
                                :disabled="isProcessing === contact.id"
                                :title="t('settings.deleteContact')"
                                @click="removeContact(contact.id)"
                            >
                                <IconTrash class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Account connections (OAuth providers) -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h2 class="card-title text-lg">{{ t('settings.accountConnections') }}</h2>
                    <div class="dropdown dropdown-end">
                        <button tabindex="0" class="btn btn-sm btn-primary">
                            <IconPlus class="w-4 h-4" />
                            {{ t('settings.addConnection') }}
                        </button>
                        <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow">
                            <li v-for="provider in connectionProviders" :key="provider">
                                <a :href="getConnectionAuthUrl(provider)" target="_blank" rel="noopener">
                                    {{ provider }}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <p class="text-sm text-base-content/60 mb-4">
                    {{ t('settings.accountConnectionsDescription') }}
                </p>

                <div v-if="connectionsPending" class="flex justify-center py-6">
                    <span class="loading loading-spinner" />
                </div>
                <div v-else-if="connectionsError" class="alert alert-error">
                    <span>{{ t('settings.loadConnectionsFail') }}</span>
                    <button class="btn btn-sm btn-ghost" @click="refreshConnections">{{ t('settings.retry') }}</button>
                </div>
                <div v-else-if="!connections?.length" class="text-center py-6 text-base-content/60">
                    <p>{{ t('settings.noConnections') }}</p>
                </div>
                <div v-else class="space-y-3">
                    <div
                        v-for="conn in connections"
                        :key="conn.id"
                        class="flex items-center justify-between gap-3 p-4 bg-base-200 rounded-box"
                    >
                        <div class="min-w-0">
                            <p class="font-medium">{{ conn.provider }}</p>
                            <p class="text-sm text-base-content/60 truncate">
                                {{ conn.meta?.email || conn.providedIdentifier }}
                            </p>
                        </div>
                        <button
                            class="btn btn-ghost btn-sm text-error shrink-0"
                            :disabled="isProcessing === conn.id"
                            @click="removeConnection(conn.id)"
                        >
                            <IconTrash class="w-4 h-4" />
                            {{ t('settings.disconnect') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Passkeys -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h2 class="card-title text-lg">{{ t('settings.passkeysTitle') }}</h2>
                    <button
                        class="btn btn-sm btn-primary"
                        :disabled="isRegisteringPasskey || !hasRecoveryCode || !passkeySupported"
                        @click="registerPasskey"
                    >
                        <IconLoader v-if="isRegisteringPasskey" class="w-4 h-4 animate-spin" />
                        <IconFingerprint v-else class="w-4 h-4" />
                        {{ t('settings.addPasskey') }}
                    </button>
                </div>
                <p class="text-sm text-base-content/70 mb-4">
                    {{ t('settings.passkeysDescription') }}
                </p>

                <div v-if="!hasRecoveryCode" class="alert alert-warning mb-4">
                    <IconAlertTriangle class="w-5 h-5" />
                    <span>{{ t('settings.recoveryCodeRequired') }}</span>
                </div>

                <div v-else-if="!passkeySupported" class="alert alert-warning mb-4">
                    <IconAlertTriangle class="w-5 h-5" />
                    <span>{{ t('settings.passkeyNotSupported') }}</span>
                </div>

                <div
                    v-if="passkeyFactor"
                    class="flex items-center justify-between p-3 bg-base-200 rounded-box mb-4"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-box flex items-center justify-center"
                            :class="passkeyFactor.enabledAt ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'"
                        >
                            <IconFingerprint class="w-5 h-5" />
                        </div>
                        <div>
                            <p class="font-medium">{{ t('settings.passkeyFactor') }}</p>
                            <p class="text-sm text-base-content/60">
                                {{ passkeyFactor.enabledAt ? t('settings.enabled') : t('settings.disabled') }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            v-if="passkeyFactor.enabledAt"
                            class="btn btn-sm btn-ghost"
                            :disabled="isProcessing === passkeyFactor.id"
                            @click="disableFactor(passkeyFactor)"
                        >
                            <IconLoader v-if="isProcessing === passkeyFactor.id" class="w-4 h-4 animate-spin" />
                            {{ t('settings.disable') }}
                        </button>
                        <button
                            v-else
                            class="btn btn-sm btn-primary"
                            :disabled="isProcessing === passkeyFactor.id"
                            @click="enableFactor(passkeyFactor)"
                        >
                            <IconLoader v-if="isProcessing === passkeyFactor.id" class="w-4 h-4 animate-spin" />
                            {{ t('settings.enable') }}
                        </button>
                    </div>
                </div>

                <div v-if="passkeysPending" class="flex justify-center py-6">
                    <span class="loading loading-spinner loading-lg" />
                </div>

                <div v-else-if="passkeysError" class="alert alert-error">
                    <IconAlertCircle class="w-5 h-5" />
                    <span>{{ t('settings.loadPasskeysFail') }}</span>
                    <button class="btn btn-sm" @click="() => refreshPasskeys()">
                        {{ t('settings.retry') }}
                    </button>
                </div>

                <div v-else-if="!passkeys?.length" class="text-center py-6 text-base-content/60">
                    <IconFingerprint class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{{ t('settings.noPasskeys') }}</p>
                    <p class="text-sm">{{ t('settings.noPasskeysHint') }}</p>
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="passkey in passkeys"
                        :key="passkey.id"
                        class="flex items-center justify-between p-4 bg-base-200 rounded-box gap-3"
                    >
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-box bg-primary text-primary-content flex items-center justify-center shrink-0">
                                <IconKey class="w-5 h-5" />
                            </div>
                            <div class="min-w-0">
                                <p class="font-medium truncate">{{ passkey.label }}</p>
                                <p class="text-sm text-base-content/60">
                                    {{ passkey.createdAt ? formatDate(passkey.createdAt) : '' }}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button
                                class="btn btn-sm btn-ghost"
                                :disabled="isProcessing === passkey.id"
                                :title="t('settings.renamePasskey')"
                                @click="startRenamePasskey(passkey)"
                            >
                                <IconEdit class="w-4 h-4" />
                            </button>
                            <button
                                class="btn btn-sm btn-ghost text-error"
                                :disabled="isProcessing === passkey.id"
                                :title="t('settings.deletePasskey')"
                                @click="removePasskey(passkey)"
                            >
                                <IconLoader v-if="isProcessing === passkey.id" class="w-4 h-4 animate-spin" />
                                <IconTrash v-else class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Auth Factors -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="card-title text-lg">{{ t('settings.twoFactor') }}</h2>
                    <button class="btn btn-sm btn-primary" @click="showAddFactor = true">
                        <IconPlus class="w-4 h-4" />
                        {{ t('settings.addFactor') }}
                    </button>
                </div>

                <div v-if="factorsPending" class="flex justify-center py-8">
                    <span class="loading loading-spinner loading-lg" />
                </div>

                <div v-else-if="factorsError" class="alert alert-error">
                    <IconAlertCircle class="w-5 h-5" />
                    <span>{{ t('settings.loadedFactorsFail') }}</span>
                    <button class="btn btn-sm" @click="() => refreshFactors()">
                        {{ t('settings.retry') }}
                    </button>
                </div>

                <div v-else-if="nonPasskeyFactors.length === 0" class="text-center py-8 text-base-content/60">
                    <IconShield class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{{ t('settings.noFactors') }}</p>
                    <p class="text-sm">{{ t('settings.noFactorsHint') }}</p>
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="factor in nonPasskeyFactors"
                        :key="factor.id"
                        class="flex items-center justify-between p-4 bg-base-200 rounded-box"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-box flex items-center justify-center"
                                :class="factor.enabledAt ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'"
                            >
                                <component
                                    :is="getFactorIcon(factor.type)"
                                    class="w-5 h-5"
                                />
                            </div>
                            <div>
                                <p class="font-medium">{{ getFactorLabel(factor.type) }}</p>
                                <p class="text-sm text-base-content/60">
                                    {{ factor.enabledAt ? t('settings.enabled') : t('settings.disabled') }}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                v-if="factor.enabledAt"
                                class="btn btn-sm btn-ghost"
                                :disabled="isProcessing === factor.id"
                                @click="disableFactor(factor)"
                            >
                                <IconLoader v-if="isProcessing === factor.id" class="w-4 h-4 animate-spin" />
                                <IconX v-else class="w-4 h-4" />
                                {{ t('settings.disable') }}
                            </button>
                            <button
                                v-else
                                class="btn btn-sm btn-primary"
                                :disabled="isProcessing === factor.id"
                                @click="enableFactor(factor)"
                            >
                                <IconLoader v-if="isProcessing === factor.id" class="w-4 h-4 animate-spin" />
                                <IconCheck v-else class="w-4 h-4" />
                                {{ t('settings.enable') }}
                            </button>
                            <button
                                class="btn btn-sm btn-ghost text-error"
                                :disabled="isProcessing === factor.id"
                                @click="deleteFactor(factor)"
                            >
                                <IconTrash class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recovery Codes -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <h2 class="card-title text-lg mb-4">{{ t('settings.recoveryCodes') }}</h2>
                <p class="text-base-content/70 mb-4">
                    Recovery codes allow you to regain access to your account if you lose access to your authentication factors.
                </p>

                <div class="flex gap-2">
                    <button
                        v-if="!hasRecoveryCode"
                        class="btn btn-primary"
                        :disabled="isCreatingRecovery"
                        @click="createRecoveryCode"
                    >
                        <IconLoader v-if="isCreatingRecovery" class="w-4 h-4 animate-spin" />
                        <IconKeyRound v-else class="w-4 h-4" />
                        {{ t('settings.generateRecoveryCodes') }}
                    </button>
                    <div v-else class="flex items-center gap-2 text-success">
                        <IconCheck class="w-5 h-5" />
                        <span>{{ t('settings.recoveryCodesSet') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Auth Devices & Sessions -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="card-title text-lg">{{ t('settings.activeSessions') }}</h2>
                    <button
                        v-if="hasOtherSessions"
                        class="btn btn-sm btn-error btn-outline"
                        :disabled="isLoggingOutAll"
                        @click="logoutAllOtherSessions"
                    >
                        <IconLoader v-if="isLoggingOutAll" class="w-4 h-4 animate-spin" />
                        <IconLogOut v-else class="w-4 h-4" />
                        {{ t('settings.logoutAllOthers') }}
                    </button>
                </div>

                <div class="tabs tabs-bordered mb-4">
                    <button
                        class="tab"
                        :class="{ 'tab-active': activeTab === 'devices' }"
                        @click="activeTab = 'devices'"
                    >
                        <IconSmartphone class="w-4 h-4 mr-1" />
                        {{ t('settings.devices') }}
                    </button>
                    <button
                        class="tab"
                        :class="{ 'tab-active': activeTab === 'sessions' }"
                        @click="activeTab = 'sessions'"
                    >
                        <IconKey class="w-4 h-4 mr-1" />
                        {{ t('settings.sessions') }}
                    </button>
                </div>

                <!-- Devices Tab -->
                <div v-if="activeTab === 'devices'">
                    <div v-if="devicesPending" class="flex justify-center py-8">
                        <span class="loading loading-spinner loading-lg" />
                    </div>

                    <div v-else-if="devicesError" class="alert alert-error">
                        <IconAlertCircle class="w-5 h-5" />
                        <span>{{ t('settings.loadedFactorsFail') }}</span>
                        <button class="btn btn-sm" @click="() => refreshDevices()">
                            {{ t('settings.retry') }}
                        </button>
                    </div>

                    <div v-else-if="devices.length === 0" class="text-center py-8 text-base-content/60">
                        <IconSmartphone class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{{ t('settings.noDevices') }}</p>
                    </div>

                    <div v-else class="space-y-3">
                         <div
                             v-for="device in devices"
                             :key="device.deviceId"
                             class="p-4 bg-base-200 rounded-box cursor-pointer hover:bg-base-300 transition-colors"
                             @click="showDeviceDetail(device)"
                         >
                             <div class="flex items-center gap-3">
                                 <div class="w-10 h-10 rounded-box bg-primary text-primary-content flex items-center justify-center">
                                     <component :is="getPlatformIcon(device.platform)" class="w-5 h-5" />
                                 </div>
                                 <div class="flex-1 min-w-0">
                                     <div class="flex items-center gap-2">
                                         <p class="font-medium truncate">
                                             {{ device.deviceLabel || device.deviceName }}
                                         </p>
                                         <span v-if="device.isCurrent" class="badge badge-primary badge-sm">{{ t('settings.current') }}</span>
                                         <span v-if="device.sessions?.length" class="badge badge-secondary badge-sm">
                                             <IconKey class="w-3 h-3 mr-1" />
                                             {{ device.sessions.length }}
                                         </span>
                                     </div>
                                    <p class="text-sm text-base-content/60">
                                        {{ getPlatformLabel(device.platform) }}
                                        <span v-if="device.sessions?.length">
                                            · {{ t('settings.lastActiveLabel', { date: formatDate(device.sessions[0]!.createdAt) }) }}
                                        </span>
                                    </p>
                                 </div>
                                 <IconChevronRight class="w-5 h-5 text-base-content/40" />
                             </div>
                         </div>
                     </div>
                </div>

                <!-- Sessions Tab -->
                <div v-if="activeTab === 'sessions'">
                    <div class="flex flex-wrap gap-2 mb-4">
                        <button
                            class="btn btn-xs"
                            :class="sessionTypeFilter === null ? 'btn-primary' : 'btn-ghost'"
                            @click="sessionTypeFilter = null"
                        >
                            {{ t('settings.all') }}
                        </button>
                        <button
                            v-for="(info, type) in SESSION_TYPES"
                            :key="type"
                            class="btn btn-xs"
                            :class="sessionTypeFilter === Number(type) ? 'btn-primary' : 'btn-ghost'"
                            @click="sessionTypeFilter = Number(type)"
                        >
                            {{ info.label }}
                        </button>
                    </div>

                    <div v-if="sessionsPending" class="flex justify-center py-8">
                        <span class="loading loading-spinner loading-lg" />
                    </div>

                    <div v-else-if="sessionsError" class="alert alert-error">
                        <IconAlertCircle class="w-5 h-5" />
                        <span>{{ t('settings.loadedFactorsFail') }}</span>
                        <button class="btn btn-sm" @click="() => refreshSessions()">
                            {{ t('settings.retry') }}
                        </button>
                    </div>

                    <div v-else-if="filteredSessions.length === 0" class="text-center py-8 text-base-content/60">
                        <IconKey class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{{ t('settings.noSessions') }}</p>
                    </div>

                    <div v-else class="space-y-3">
                        <div
                            v-for="session in filteredSessions"
                            :key="session.id"
                            class="p-4 bg-base-200 rounded-box"
                        >
                            <div class="flex items-start gap-3">
                                <div
                                    class="w-10 h-10 rounded-box flex items-center justify-center shrink-0"
                                    :class="session.isCurrent ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'"
                                >
                                    <component :is="getSessionTypeIcon(session.type)" class="w-5 h-5" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <p class="font-medium">
                                            {{ session.label || session.userAgent || 'Unknown' }}
                                        </p>
                                        <span v-if="session.isCurrent" class="badge badge-primary badge-sm">{{ t('settings.current') }}</span>
                                        <span v-if="session.childrenCount" class="badge badge-secondary badge-sm">
                                            {{ t('settings.children', { count: session.childrenCount }) }}
                                        </span>
                                    </div>
                                    <div class="text-sm text-base-content/60 mt-1 space-y-1">
                                        <p>{{ t('settings.created', { date: formatDate(session.createdAt) }) }}</p>
                                        <p>{{ t('settings.lastActiveLabel', { date: formatDate(session.lastGrantedAt) }) }}</p>
                                        <p v-if="session.location?.city">
                                            <IconMapPin class="w-3 h-3 inline mr-1" />
                                            {{ t('settings.location', { city: session.location.city }) }}
                                        </p>
                                        <p v-if="session.ipAddress">
                                            <IconGlobe class="w-3 h-3 inline mr-1" />
                                            {{ session.ipAddress }}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    v-if="!session.isCurrent"
                                    class="btn btn-sm btn-ghost text-error"
                                    :disabled="isProcessing === session.id"
                                    @click="logoutSession(session)"
                                >
                                    <IconLoader v-if="isProcessing === session.id" class="w-4 h-4 animate-spin" />
                                    <IconLogOut v-else class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <!-- Add Factor Modal -->
    <dialog class="modal" :class="{ 'modal-open': showAddFactor }">
        <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4">{{ t('settings.addFactorModalTitle') }}</h3>

            <div v-if="!hasRecoveryCode" class="alert alert-warning mb-4">
                <IconAlertTriangle class="w-5 h-5" />
                <span>{{ t('settings.recoveryCodeRequired') }}</span>
            </div>

            <fieldset class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.factorType') }}</legend>
                <select v-model="newFactorType" class="select select-bordered w-full">
                    <option value="">{{ t('settings.selectFactorType') }}</option>
                    <option
                        v-for="(info, type) in availableFactorTypes"
                        :key="type"
                        :value="type"
                    >
                        {{ info.label }}
                    </option>
                </select>
            </fieldset>

            <fieldset v-if="newFactorType === '0'" class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.secret') }}</legend>
                <input
                    v-model="newFactorSecret"
                    type="password"
                    class="input input-bordered w-full"
                    :placeholder="t('settings.enterSecret')"
                >
            </fieldset>

            <fieldset v-if="newFactorType === '4'" class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.pin') }}</legend>
                <input
                    v-model="newFactorPin"
                    type="password"
                    class="input input-bordered w-full"
                    :placeholder="t('settings.pinPlaceholder')"
                    maxlength="6"
                >
            </fieldset>

            <fieldset v-if="newFactorType === '7'" class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.passkeyLabel') }}</legend>
                <input
                    v-model="newPasskeyLabel"
                    type="text"
                    class="input input-bordered w-full"
                    :placeholder="t('settings.passkeyLabelPlaceholder')"
                >
                <p class="label text-xs text-base-content/60">{{ t('settings.passkeyLabelHint') }}</p>
            </fieldset>

            <div v-if="newFactorType" class="text-sm text-base-content/70 mb-4">
                {{ availableFactorTypes[Number(newFactorType)]?.description }}
            </div>

            <div class="modal-action">
                <button class="btn btn-ghost" @click="showAddFactor = false">{{ t('settings.cancel') }}</button>
                <button
                    class="btn btn-primary"
                    :disabled="!canAddFactor || isAddingFactor"
                    @click="addFactor"
                >
                    <IconLoader v-if="isAddingFactor" class="w-4 h-4 animate-spin" />
                    {{ t('settings.addFactor') }}
                </button>
            </div>
        </div>
        <div class="modal-backdrop" @click="showAddFactor = false" />
    </dialog>

    <!-- Enable Factor Modal -->
    <dialog class="modal" :class="{ 'modal-open': showEnableFactor }">
        <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4">{{ t('settings.enableFactorTitle') }}</h3>
            <p class="text-base-content/70 mb-4">
                {{ t('settings.enableFactorDesc') }}
            </p>

            <fieldset class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.verificationCode') }}</legend>
                <input
                    v-model="verificationCode"
                    type="text"
                    class="input input-bordered w-full text-center text-2xl tracking-widest"
                    :placeholder="t('settings.verificationCodePlaceholder')"
                    maxlength="6"
                >
            </fieldset>

            <div class="modal-action">
                <button class="btn btn-ghost" @click="showEnableFactor = false">{{ t('settings.cancel') }}</button>
                <button
                    class="btn btn-primary"
                    :disabled="verificationCode.length < 6 || isEnabling"
                    @click="confirmEnableFactor"
                >
                    <IconLoader v-if="isEnabling" class="w-4 h-4 animate-spin" />
                    {{ t('settings.enable') }}
                </button>
            </div>
        </div>
        <div class="modal-backdrop" @click="showEnableFactor = false" />
    </dialog>

    <!-- Recovery Code Display Modal -->
    <dialog class="modal" :class="{ 'modal-open': showRecoveryCode }">
        <div class="modal-box max-w-md">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-primary text-primary-content rounded-box flex items-center justify-center mx-auto mb-4">
                    <IconKeyRound class="w-8 h-8" />
                </div>
                <h3 class="font-bold text-lg">{{ t('settings.recoveryCodeCreated') }}</h3>
            </div>

            <p class="text-base-content/70 mb-4 text-center">
                {{ t('settings.recoveryCodeSave') }}
            </p>

            <div
                v-if="recoveryCode"
                class="bg-base-200 p-4 rounded-box mb-6"
            >
                <code class="text-lg font-mono block text-center break-all">{{ recoveryCode }}</code>
            </div>

            <div class="modal-action">
                <button class="btn btn-primary w-full" @click="showRecoveryCode = false">
                    <IconCheck class="w-4 h-4 mr-2" />
                    {{ t('settings.iHaveSavedIt') }}
                </button>
            </div>
        </div>
    </dialog>

    <!-- Device Detail Modal -->
    <dialog class="modal" :class="{ 'modal-open': selectedDevice !== null }">
        <div v-if="selectedDevice" class="modal-box max-w-lg">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-lg">{{ t('settings.deviceDetails') }}</h3>
                <button class="btn btn-sm btn-ghost" @click="selectedDevice = null">
                    <IconX class="w-4 h-4" />
                </button>
            </div>

            <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-box bg-primary text-primary-content flex items-center justify-center">
                    <component :is="getPlatformIcon(selectedDevice.platform)" class="w-6 h-6" />
                </div>
                <div>
                    <p class="font-semibold">{{ selectedDevice.deviceLabel || selectedDevice.deviceName }}</p>
                    <p class="text-sm text-base-content/60">{{ getPlatformLabel(selectedDevice.platform) }}</p>
                </div>
                <span v-if="selectedDevice.isCurrent" class="badge badge-primary ml-auto">{{ t('settings.current') }}</span>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-base-200 p-3 rounded-box">
                    <p class="text-xs text-base-content/60">{{ t('settings.deviceId') }}</p>
                    <p class="font-mono text-sm truncate">{{ selectedDevice.deviceId.slice(0, 12) }}</p>
                </div>
                <div class="bg-base-200 p-3 rounded-box">
                    <p class="text-xs text-base-content/60">{{ t('settings.activeSessionsCount') }}</p>
                    <p class="font-semibold">{{ selectedDevice.sessions?.length ?? 0 }}</p>
                </div>
                <div class="bg-base-200 p-3 rounded-box">
                    <p class="text-xs text-base-content/60">{{ t('settings.firstSeen') }}</p>
                    <p class="text-sm">{{ selectedDevice.sessions?.length ? formatDate(selectedDevice.sessions[0]!.createdAt) : '-' }}</p>
                </div>
                <div class="bg-base-200 p-3 rounded-box">
                    <p class="text-xs text-base-content/60">{{ t('settings.lastActive') }}</p>
                    <p class="text-sm">{{ selectedDevice.sessions?.length ? formatDate(selectedDevice.sessions[0]!.lastGrantedAt) : '-' }}</p>
                </div>
            </div>

            <h4 class="font-semibold mb-3">{{ t('settings.sessionsList') }}</h4>
            <div v-if="selectedDevice.sessions?.length" class="space-y-2 max-h-60 overflow-y-auto">
                <div
                    v-for="session in selectedDevice.sessions"
                    :key="session.id"
                    class="p-3 bg-base-200 rounded-box"
                >
                    <div class="flex items-center gap-2">
                        <component :is="getSessionTypeIcon(session.type)" class="w-4 h-4" />
                        <span class="font-medium text-sm">{{ session.label || session.userAgent || 'Unknown' }}</span>
                        <span v-if="session.isCurrent" class="badge badge-primary badge-sm">{{ t('settings.current') }}</span>
                    </div>
                    <div class="text-xs text-base-content/60 mt-1">
                        <p>{{ t('settings.created', { date: formatDate(session.createdAt) }) }}</p>
                        <p v-if="session.location?.city">{{ t('settings.location', { city: session.location.city }) }}</p>
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-4 text-base-content/60">
                <p>{{ t('settings.noActiveSessions') }}</p>
            </div>

            <div class="modal-action">
                <button
                    v-if="!selectedDevice.isCurrent"
                    class="btn btn-error w-full"
                    :disabled="isProcessing === selectedDevice.deviceId"
                    @click="logoutDevice(selectedDevice)"
                >
                    <IconLoader v-if="isProcessing === selectedDevice.deviceId" class="w-4 h-4 animate-spin" />
                    <IconLogOut v-else class="w-4 h-4 mr-2" />
                    {{ t('settings.logoutDevice') }}
                </button>
            </div>
        </div>
        <div class="modal-backdrop" @click="selectedDevice = null" />
    </dialog>

    <!-- Rename Passkey Modal -->
    <dialog class="modal" :class="{ 'modal-open': renamingPasskey !== null }">
        <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4">{{ t('settings.renamePasskey') }}</h3>
            <fieldset class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.passkeyLabel') }}</legend>
                <input
                    v-model="renamePasskeyLabel"
                    type="text"
                    class="input input-bordered w-full"
                    :placeholder="t('settings.passkeyLabelPlaceholder')"
                    @keydown.enter="confirmRenamePasskey"
                >
            </fieldset>
            <div class="modal-action">
                <button class="btn btn-ghost" @click="renamingPasskey = null">{{ t('settings.cancel') }}</button>
                <button
                    class="btn btn-primary"
                    :disabled="!renamePasskeyLabel.trim() || isRenamingPasskey"
                    @click="confirmRenamePasskey"
                >
                    <IconLoader v-if="isRenamingPasskey" class="w-4 h-4 animate-spin" />
                    {{ t('settings.save') }}
                </button>
            </div>
        </div>
        <div class="modal-backdrop" @click="renamingPasskey = null" />
    </dialog>

    <!-- Add contact method modal -->
    <dialog class="modal" :class="{ 'modal-open': showAddContact }">
        <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4">{{ t('settings.addContact') }}</h3>
            <fieldset class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.contactType') }}</legend>
                <select v-model="newContact.type" class="select select-bordered w-full">
                    <option :value="0">{{ t('settings.contactEmail') }}</option>
                    <option :value="1">{{ t('settings.contactPhone') }}</option>
                </select>
            </fieldset>
            <fieldset class="fieldset mb-4">
                <legend class="fieldset-legend">{{ t('settings.contactContent') }}</legend>
                <input
                    v-model="newContact.content"
                    type="text"
                    class="input input-bordered w-full"
                    :placeholder="newContact.type === 0 ? 'you@example.com' : '+1...'"
                >
            </fieldset>
            <div class="modal-action">
                <button class="btn btn-ghost" @click="showAddContact = false">{{ t('settings.cancel') }}</button>
                <button
                    class="btn btn-primary"
                    :disabled="!newContact.content.trim() || isAddingContact"
                    @click="addContact"
                >
                    <IconLoader v-if="isAddingContact" class="w-4 h-4 animate-spin" />
                    {{ t('settings.addContact') }}
                </button>
            </div>
        </div>
        <div class="modal-backdrop" @click="showAddContact = false" />
    </dialog>
    </div>
</template>

<script setup lang="ts">
import {
    IconLoader,
    IconKey,
    IconShield,
    IconLogOut,
    IconCheck,
    IconX,
    IconTrash,
    IconPlus,
    IconAlertCircle,
    IconAlertTriangle,
    IconTimer,
    IconMail,
    IconBell,
    IconFingerprint,
    IconKeyRound,
    IconQrCode,
    IconSmartphone,
    IconGlobe,
    IconLaptop,
    IconMonitor,
    IconTerminal,
    IconHelpCircle,
    IconChevronRight,
    IconMapPin,
    IconEdit,
} from "#components";
import {
    fetchAuthFactors,
    createAuthFactor,
    deleteAuthFactor as apiDeleteFactor,
    enableAuthFactor,
    disableAuthFactor,
    fetchAuthDevices,
    fetchAuthSessions,
    revokeDevice,
    revokeSession,
    revokeAllOtherSessions,
    fetchPasskeys,
    startPasskeyRegistration,
    completePasskeyRegistration,
    updatePasskey,
    deletePasskey as apiDeletePasskey,
    requestPasswordReset,
    fetchContactMethods,
    createContactMethod,
    deleteContactMethod,
    verifyContactMethod,
    setPrimaryContactMethod,
    makeContactPublic,
    makeContactPrivate,
    fetchAccountConnections,
    deleteAccountConnection,
    getConnectionAuthUrl,
} from "~/utils/api";
import {
    FACTOR_TYPES,
    SESSION_TYPES,
    PLATFORM_TYPES,
    type SnAuthFactor,
    type SnAuthDevice,
    type SnAuthSession,
    type SnPasskey,
    type SnContactMethod,
} from "~/types/auth";
import {
    arrayBufferToBase64Url,
    base64UrlToArrayBuffer,
    getPasskeyDeviceName,
    getPasskeyRpId,
    isWebAuthnAvailable,
    stringToArrayBuffer,
} from "~/utils/webauthn";

const { t } = useI18n();
const auth = useAuth();

const isRequestingPasswordReset = ref(false);
const showPasswordCaptcha = ref(false);
const passwordResetSent = ref(false);
const isProcessing = ref<string | null>(null);
const showAddContact = ref(false);
const isAddingContact = ref(false);
const newContact = reactive({ type: 0, content: "" });
const connectionProviders = ["Google", "GitHub", "Discord", "Apple", "Microsoft"];
const isCreatingRecovery = ref(false);
const isAddingFactor = ref(false);
const isEnabling = ref(false);
const isLoggingOutAll = ref(false);
const isRegisteringPasskey = ref(false);
const isRenamingPasskey = ref(false);
const showAddFactor = ref(false);
const showEnableFactor = ref(false);
const showRecoveryCode = ref(false);
const newFactorType = ref("");
const newFactorSecret = ref("");
const newFactorPin = ref("");
const newPasskeyLabel = ref("");
const verificationCode = ref("");
const selectedFactor = ref<SnAuthFactor | null>(null);
const recoveryCode = ref<string | null>(null);
const activeTab = ref<'devices' | 'sessions'>('devices');
const sessionTypeFilter = ref<number | null>(null);
const selectedDevice = ref<SnAuthDevice | null>(null);
const renamingPasskey = ref<SnPasskey | null>(null);
const renamePasskeyLabel = ref("");
const passkeySupported = ref(false);

// Fetch auth factors
const { data: factors, pending: factorsPending, error: factorsError, refresh: refreshFactors } = await useAsyncData(
    "auth-factors",
    () => fetchAuthFactors(),
    { 
        default: () => [],
        server: false,
    },
);

const { data: passkeys, pending: passkeysPending, error: passkeysError, refresh: refreshPasskeys } = await useAsyncData(
    "auth-passkeys",
    () => fetchPasskeys(),
    {
        default: () => [],
        server: false,
    },
);

// Fetch auth devices
const { data: devices, pending: devicesPending, error: devicesError, refresh: refreshDevices } = await useAsyncData(
    "auth-devices",
    () => fetchAuthDevices(),
    { 
        default: () => [],
        server: false,
    },
);

// Fetch auth sessions
const { data: sessions, pending: sessionsPending, error: sessionsError, refresh: refreshSessions } = await useAsyncData(
    "auth-sessions",
    () => fetchAuthSessions(sessionTypeFilter.value ?? undefined),
    { 
        default: () => [], 
        watch: [sessionTypeFilter],
        server: false,
    },
);

const hasRecoveryCode = computed(() =>
    factors.value?.some(f => f.type === 5),
);

const passkeyFactor = computed(() =>
    factors.value?.find(f => f.type === 7) ?? null,
);

/** Passkey factor is managed in its own card; hide it from the generic list. */
const nonPasskeyFactors = computed(() =>
    (factors.value ?? []).filter(f => f.type !== 7),
);

const { data: contacts, pending: contactsPending, error: contactsError, refresh: refreshContacts } = await useAsyncData(
    "auth-contacts",
    () => fetchContactMethods(),
    { default: () => [] as SnContactMethod[], server: false },
);

const { data: connections, pending: connectionsPending, error: connectionsError, refresh: refreshConnections } = await useAsyncData(
    "auth-connections",
    () => fetchAccountConnections(),
    { default: () => [], server: false },
);

const availableFactorTypes = computed(() => {
    const existingTypes = new Set(factors.value?.map(f => f.type) ?? []);
    const result: Record<number, { label: string; description: string; icon: string }> = {};
    for (const [type, info] of Object.entries(FACTOR_TYPES)) {
        const typeNum = Number(type);
        // Recovery codes and passkeys can be re-added (passkey registers another credential)
        if (existingTypes.has(typeNum) && typeNum !== 5 && typeNum !== 7) continue;
        // Physical passport is unavailable on web
        if ((info as { webUnavailable?: boolean }).webUnavailable) continue;
        result[typeNum] = info;
    }
    return result;
});

const canAddFactor = computed(() => {
    if (!newFactorType.value) return false;
    const type = Number(newFactorType.value);
    if (type === 0 && !newFactorSecret.value) return false;
    if (type === 4 && newFactorPin.value.length !== 6) return false;
    if (type === 7 && !passkeySupported.value) return false;
    return true;
});

onMounted(() => {
    passkeySupported.value = isWebAuthnAvailable();
});

const filteredSessions = computed(() => {
    const list = sessions.value;
    if (!list || !Array.isArray(list)) return [];
    if (sessionTypeFilter.value === null) return list;
    return list.filter(s => s.type === sessionTypeFilter.value);
});

const hasOtherSessions = computed(() => {
    const sess = sessions.value;
    const devs = devices.value;
    const hasOtherSess = Array.isArray(sess) && sess.some(s => !s.isCurrent);
    const hasOtherDevs = Array.isArray(devs) && devs.some(d => !d.isCurrent);
    return hasOtherSess || hasOtherDevs;
});

function getFactorIcon(type: number) {
    switch (type) {
        case 0: return IconKey;
        case 1: return IconMail;
        case 2: return IconBell;
        case 3: return IconTimer;
        case 4: return IconShield;
        case 5: return IconKeyRound;
        case 6: return IconFingerprint;
        case 7: return IconFingerprint;
        case 8: return IconQrCode;
        default: return IconKey;
    }
}

function getFactorLabel(type: number) {
    return FACTOR_TYPES[type]?.label || "Unknown";
}

function getPlatformIcon(platform: number) {
    switch (platform) {
        case 1: return IconGlobe;
        case 2: return IconSmartphone;
        case 3: return IconSmartphone;
        case 4: return IconLaptop;
        case 5: return IconMonitor;
        case 6: return IconTerminal;
        default: return IconHelpCircle;
    }
}

function getPlatformLabel(platform: number) {
    return PLATFORM_TYPES[platform]?.label || "Unknown";
}

function getSessionTypeIcon(type: number) {
    const iconName = SESSION_TYPES[type]?.icon || "key";
    switch (iconName) {
        case "key": return IconKey;
        case "link": return IconGlobe;
        case "user-circle": return IconSmartphone;
        case "code": return IconTerminal;
        default: return IconKey;
    }
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function showDeviceDetail(device: SnAuthDevice) {
    selectedDevice.value = device;
}

async function onPasswordCaptchaVerified(token: string) {
    const accountName = auth.user.value?.name;
    if (!accountName) return;
    isRequestingPasswordReset.value = true;
    showPasswordCaptcha.value = false;
    try {
        await requestPasswordReset(accountName, token);
        passwordResetSent.value = true;
        alert(t("settings.passwordChangeSent"));
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.passwordChangeFail"));
    } finally {
        isRequestingPasswordReset.value = false;
    }
}

async function addContact() {
    isAddingContact.value = true;
    try {
        await createContactMethod({
            type: newContact.type,
            content: newContact.content.trim(),
        });
        newContact.content = "";
        newContact.type = 0;
        showAddContact.value = false;
        await refreshContacts();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.addContactFail"));
    } finally {
        isAddingContact.value = false;
    }
}

async function removeContact(id: string) {
    if (!confirm(t("settings.deleteContactConfirm"))) return;
    isProcessing.value = id;
    try {
        await deleteContactMethod(id);
        await refreshContacts();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.deleteContactFail"));
    } finally {
        isProcessing.value = null;
    }
}

async function requestContactVerify(id: string) {
    isProcessing.value = id;
    try {
        await verifyContactMethod(id);
        alert(t("settings.verifyContactSent"));
        await refreshContacts();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.verifyContactFail"));
    } finally {
        isProcessing.value = null;
    }
}

async function makePrimaryContact(id: string) {
    isProcessing.value = id;
    try {
        await setPrimaryContactMethod(id);
        await refreshContacts();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.setPrimaryFail"));
    } finally {
        isProcessing.value = null;
    }
}

async function toggleContactPublic(contact: SnContactMethod) {
    isProcessing.value = contact.id;
    try {
        if (contact.isPublic) {
            await makeContactPrivate(contact.id);
        } else {
            await makeContactPublic(contact.id);
        }
        await refreshContacts();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.togglePublicFail"));
    } finally {
        isProcessing.value = null;
    }
}

async function removeConnection(id: string) {
    if (!confirm(t("settings.disconnectConfirm"))) return;
    isProcessing.value = id;
    try {
        await deleteAccountConnection(id);
        await refreshConnections();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.disconnectFail"));
    } finally {
        isProcessing.value = null;
    }
}

async function ensurePasskeyFactorEnabled(): Promise<void> {
    let factor = passkeyFactor.value;
    if (!factor) {
        factor = await createAuthFactor({ type: 7, secret: null });
        await refreshFactors();
        factor = passkeyFactor.value ?? factor;
    }
    if (factor && !factor.enabledAt) {
        await enableAuthFactor(factor.id);
        await refreshFactors();
    }
}

async function performPasskeyRegistration(label?: string): Promise<void> {
    if (!isWebAuthnAvailable()) {
        throw new Error(t("settings.passkeyNotSupported"));
    }
    if (!hasRecoveryCode.value) {
        throw new Error(t("settings.recoveryCodeRequired"));
    }

    await ensurePasskeyFactorEnabled();

    const deviceId = await auth.getDeviceId();
    const deviceName = getPasskeyDeviceName();
    const rpId = getPasskeyRpId();
    const options = await startPasskeyRegistration({
        deviceId,
        deviceName,
        rpId,
        rpName: "Solar Network",
    });

    const authSelection = options.authenticatorSelection;
    const credential = await navigator.credentials.create({
        publicKey: {
            challenge: base64UrlToArrayBuffer(options.challenge),
            rp: {
                id: options.rpId,
                name: options.rpName,
            },
            user: {
                // Padlock returns user_id as the account GUID string
                id: stringToArrayBuffer(options.userId),
                name: options.userName,
                displayName: options.displayName || options.userName,
            },
            pubKeyCredParams: (options.pubKeyCredParams ?? [{ type: "public-key", alg: -7 }]).map(
                (p) => ({
                    type: (p.type || "public-key") as PublicKeyCredentialType,
                    alg: p.alg,
                }),
            ),
            timeout: options.timeout ?? 60000,
            authenticatorSelection: authSelection
                ? {
                      authenticatorAttachment: authSelection.authenticatorAttachment as
                          | AuthenticatorAttachment
                          | undefined,
                      residentKey: (authSelection.residentKey || "preferred") as ResidentKeyRequirement,
                      userVerification: (authSelection.userVerification ||
                          "preferred") as UserVerificationRequirement,
                      requireResidentKey: false,
                  }
                : {
                      residentKey: "preferred",
                      userVerification: "preferred",
                  },
            attestation: "none",
        },
    }) as PublicKeyCredential | null;

    if (!credential) {
        throw new Error(t("settings.passkeyRegistrationCancelled"));
    }

    const attestation = credential.response as AuthenticatorAttestationResponse;
    await completePasskeyRegistration({
        deviceId,
        label: (label?.trim() || deviceName),
        clientDataJson: arrayBufferToBase64Url(attestation.clientDataJSON),
        attestationObject: arrayBufferToBase64Url(attestation.attestationObject),
    });

    await refreshPasskeys();
    await refreshFactors();
}

async function registerPasskey() {
    isRegisteringPasskey.value = true;
    try {
        await performPasskeyRegistration();
        alert(t("settings.passkeyRegistered"));
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.passkeyRegisterFailed"));
    } finally {
        isRegisteringPasskey.value = false;
    }
}

function startRenamePasskey(passkey: SnPasskey) {
    renamingPasskey.value = passkey;
    renamePasskeyLabel.value = passkey.label;
}

async function confirmRenamePasskey() {
    if (!renamingPasskey.value || !renamePasskeyLabel.value.trim()) return;
    isRenamingPasskey.value = true;
    try {
        await updatePasskey(renamingPasskey.value.id, renamePasskeyLabel.value.trim());
        renamingPasskey.value = null;
        await refreshPasskeys();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.passkeyRenameFailed"));
    } finally {
        isRenamingPasskey.value = false;
    }
}

async function removePasskey(passkey: SnPasskey) {
    if (!confirm(t("settings.deletePasskeyConfirm", { label: passkey.label }))) return;
    isProcessing.value = passkey.id;
    try {
        await apiDeletePasskey(passkey.id);
        await refreshPasskeys();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.passkeyDeleteFailed"));
    } finally {
        isProcessing.value = null;
    }
}

async function addFactor() {
    isAddingFactor.value = true;
    try {
        const type = Number(newFactorType.value);

        if (type === 7) {
            await performPasskeyRegistration(newPasskeyLabel.value);
            alert(t("settings.passkeyRegistered"));
            showAddFactor.value = false;
            newFactorType.value = "";
            newPasskeyLabel.value = "";
            return;
        }

        let secret: string | null = null;
        if (type === 0) {
            secret = newFactorSecret.value;
        } else if (type === 4) {
            secret = newFactorPin.value;
        }

        const factor = await createAuthFactor({
            type,
            secret,
        });

        if (factor.type === 5 && factor.createdResponse?.recovery_code) {
            recoveryCode.value = factor.createdResponse.recovery_code as string;
            showRecoveryCode.value = true;
        }

        alert(t("settings.factorCreated"));
        showAddFactor.value = false;
        newFactorType.value = "";
        newFactorSecret.value = "";
        newFactorPin.value = "";
        newPasskeyLabel.value = "";
        await refreshFactors();
    } catch (err) {
        alert(err instanceof Error ? err.message : t("settings.factorCreateFailed"));
    } finally {
        isAddingFactor.value = false;
    }
}

async function enableFactor(factor: SnAuthFactor) {
    // Recovery code and passkey enable without a verification code
    if (factor.type === 5 || factor.type === 7) {
        isProcessing.value = factor.id;
        try {
            await enableAuthFactor(factor.id);
            alert(t("settings.factorEnabled"));
            await refreshFactors();
        } catch (err) {
            alert(err instanceof Error ? err.message : t("settings.factorEnableFailed"));
        } finally {
            isProcessing.value = null;
        }
        return;
    }

    selectedFactor.value = factor;
    verificationCode.value = "";
    showEnableFactor.value = true;
}

async function confirmEnableFactor() {
    if (!selectedFactor.value) return;

    isEnabling.value = true;
    try {
        await enableAuthFactor(selectedFactor.value.id, verificationCode.value);
        alert("Factor enabled successfully");
        showEnableFactor.value = false;
        await refreshFactors();
    } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to enable factor");
    } finally {
        isEnabling.value = false;
    }
}

async function disableFactor(factor: SnAuthFactor) {
    isProcessing.value = factor.id;
    try {
        await disableAuthFactor(factor.id);
        alert("Factor disabled successfully");
        await refreshFactors();
    } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to disable factor");
    } finally {
        isProcessing.value = null;
    }
}

async function deleteFactor(factor: SnAuthFactor) {
    if (!confirm("Are you sure you want to delete this factor?")) return;

    isProcessing.value = factor.id;
    try {
        await apiDeleteFactor(factor.id);
        alert("Factor deleted successfully");
        await refreshFactors();
    } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete factor");
    } finally {
        isProcessing.value = null;
    }
}

async function createRecoveryCode() {
    isCreatingRecovery.value = true;
    try {
        const factor = await createAuthFactor({ type: 5 });
        if (factor.createdResponse?.recovery_code) {
            recoveryCode.value = factor.createdResponse.recovery_code as string;
            showRecoveryCode.value = true;
        }
        alert("Recovery code created");
        await refreshFactors();
    } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to create recovery code");
    } finally {
        isCreatingRecovery.value = false;
    }
}

async function logoutDevice(device: SnAuthDevice) {
    if (!confirm(`Logout device "${device.deviceLabel || device.deviceName}"?`)) return;

    isProcessing.value = device.deviceId;
    try {
        await revokeDevice(device.deviceId);
        alert("Device logged out successfully");
        selectedDevice.value = null;
        await refreshDevices();
        await refreshSessions();
    } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to logout device");
    } finally {
        isProcessing.value = null;
    }
}

async function logoutSession(session: SnAuthSession) {
    if (!confirm("Logout this session?")) return;

    isProcessing.value = session.id;
    try {
        await revokeSession(session.id);
        alert("Session logged out successfully");
        await refreshSessions();
        await refreshDevices();
    } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to logout session");
    } finally {
        isProcessing.value = null;
    }
}

async function logoutAllOtherSessions() {
    if (!confirm("Logout from all other devices and sessions?")) return;

    isLoggingOutAll.value = true;
    try {
        await revokeAllOtherSessions();
        alert("All other sessions logged out");
        await refreshDevices();
        await refreshSessions();
    } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to logout all sessions");
    } finally {
        isLoggingOutAll.value = false;
    }
}

defineOgImage('UniOgImage', { title: t('settings.securityTitle') })

useSolarSeo({
    title: t('settings.securityTitle'),
});
</script>
