<template>
    <NuxtLayout name="app">
        <ConfuseSpinner v-if="isLoading" message="Loading wallets..." />

        <div v-else-if="!wallets || wallets.length === 0" class="mx-auto max-w-md p-6">
            <div class="card bg-base-100 shadow-sm">
                <div class="card-body items-center text-center gap-6 py-12">
                    <div class="flex h-20 w-20 items-center justify-center rounded-box bg-primary/10">
                        <IconWallet class="text-primary w-10 h-10" />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold">No Wallet</h1>
                        <p class="text-base-content/60 mt-2">
                            Create a wallet to start managing your funds.
                        </p>
                    </div>
                    <button class="btn btn-primary gap-2" @click="showCreateWalletDrawer = true">
                        <IconPlus class="w-4 h-4" />
                        Create Wallet
                    </button>
                </div>
            </div>
        </div>

        <div v-else class="mx-auto max-w-6xl">
            <!-- Header -->
            <div class="flex items-center gap-3 px-4 lg:px-6 py-4">
                <button
                    class="btn btn-ghost btn-square btn-sm"
                    @click="router.back()"
                >
                    <IconArrowLeft class="w-5 h-5" />
                </button>
                <h1 class="text-xl font-bold">Wallet</h1>
                <div class="flex-1" />
                <button
                    class="btn btn-ghost btn-sm gap-2"
                    @click="showCreateWalletDrawer = true"
                >
                    <IconPlus class="w-4 h-4" />
                    <span class="hidden sm:inline">New Wallet</span>
                </button>
            </div>

            <!-- Content Grid -->
            <div class="grid gap-4 px-4 lg:px-6 pb-6 lg:grid-cols-3">
                <!-- Left Column - Main Content -->
                <div class="lg:col-span-2 space-y-4">
                    <!-- Wallet Switcher Card -->
                    <div
                        v-if="wallets.length > 1"
                        class="card bg-base-100 shadow-sm"
                    >
                        <div class="card-body p-3">
                            <div class="dropdown w-full">
                                <div
                                    tabindex="0"
                                    role="button"
                                    class="flex cursor-pointer items-center gap-3 rounded-box p-2 transition-colors hover:bg-base-200/50"
                                >
                                    <div
                                        class="flex h-10 w-10 items-center justify-center rounded-box bg-primary/10 text-primary"
                                    >
                                        <IconBuilding v-if="selectedWallet?.realmId" class="w-5 h-5" />
                                        <IconStar v-else-if="selectedWallet?.isPrimary" class="w-5 h-5" />
                                        <IconWallet v-else class="w-5 h-5" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span class="font-semibold truncate">
                                                {{ selectedWallet?.name || 'Default Wallet' }}
                                            </span>
                                            <span
                                                v-if="selectedWallet?.isPrimary"
                                                class="badge badge-sm badge-primary"
                                            >
                                                {{ selectedWallet?.realmId ? 'Realm' : 'Default' }}
                                            </span>
                                        </div>
                                        <p class="text-xs text-base-content/60">
                                            {{ isBalanceVisible ? formatAmountWithSuffix(currentPocket?.amount || 0) + ' ' + selectedCurrency : '••••••' }}
                                        </p>
                                    </div>
                                    <IconChevronDown class="w-5 h-5 text-base-content/40" />
                                </div>
                                <ul
                                    tabindex="0"
                                    class="dropdown-content menu z-10 mt-2 max-h-60 w-full overflow-auto rounded-box bg-base-200 p-2 shadow-sm"
                                >
                                    <li v-for="w in wallets" :key="w.id">
                                        <button
                                            class="flex items-center gap-3 p-3"
                                            :class="{ 'bg-primary/5': selectedWalletId === w.id }"
                                            @click="selectedWalletId = w.id"
                                        >
                                            <div
                                                class="flex h-8 w-8 items-center justify-center rounded-box bg-primary/10 text-primary"
                                            >
                                                <IconBuilding v-if="w.realmId" class="w-4 h-4" />
                                                <IconStar v-else-if="w.isPrimary" class="w-4 h-4" />
                                                <IconWallet v-else class="w-4 h-4" />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <span class="font-medium truncate block">{{ w.name || 'Default Wallet' }}</span>
                                                <span class="text-xs text-base-content/60">
                                                    {{ formatAmountWithSuffix(getPocketForWallet(w)?.amount || 0) }} {{ selectedCurrency }}
                                                </span>
                                            </div>
                                            <div class="flex items-center gap-1">
                                                <button
                                                    v-if="!w.isPrimary && !w.realmId"
                                                    class="btn btn-ghost btn-xs"
                                                    @click.stop="setDefaultWallet(w.id)"
                                                    title="Set as default"
                                                >
                                                    <IconStar class="w-3 h-3" />
                                                </button>
                                                <button
                                                    class="btn btn-ghost btn-xs"
                                                    @click.stop="togglePublicId(w.id, !w.publicId)"
                                                    :title="w.publicId ? 'Disable public ID' : 'Enable public ID'"
                                                >
                                                    <IconTag class="w-3 h-3" />
                                                </button>
                                            </div>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Balance Card -->
                    <div class="card bg-primary text-primary-content shadow-sm">
                        <div class="card-body">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <IconWallet class="w-5 h-5 opacity-80" />
                                    <span class="font-medium opacity-90">
                                        {{ selectedWallet?.name || 'Balance' }}
                                    </span>
                                    <span
                                        v-if="selectedWallet?.isPrimary"
                                        class="badge badge-sm bg-white/20 text-white border-0"
                                    >
                                        Default
                                    </span>
                                </div>
                                <div class="dropdown dropdown-end">
                                    <button
                                        class="btn btn-ghost btn-sm btn-square text-white/70 hover:text-white hover:bg-white/10"
                                    >
                                        <IconMoreVertical class="w-4 h-4" />
                                    </button>
                                    <ul
                                        class="dropdown-content menu menu-sm z-1 mt-2 w-48 rounded-box bg-base-200 p-2 text-base-content shadow-sm"
                                    >
                                        <li>
                                            <button @click="isBalanceVisible = !isBalanceVisible">
                                                <IconEyeOff v-if="isBalanceVisible" class="w-4 h-4" />
                                                <IconEye v-else class="w-4 h-4" />
                                                {{ isBalanceVisible ? 'Hide Balance' : 'Show Balance' }}
                                            </button>
                                        </li>
                                        <li v-if="isBalanceVisible">
                                            <button @click="isFullAmountVisible = !isFullAmountVisible">
                                                <IconMaximize2 v-if="!isFullAmountVisible" class="w-4 h-4" />
                                                <IconMinimize2 v-else class="w-4 h-4" />
                                                {{ isFullAmountVisible ? 'Collapse Amount' : 'Expand Amount' }}
                                            </button>
                                        </li>
                                        <li>
                                            <button @click="copyToClipboard(selectedWallet?.id || '')">
                                                <IconKey class="w-4 h-4" />
                                                Copy Wallet ID
                                            </button>
                                        </li>
                                        <li v-if="selectedWallet?.publicId">
                                            <button @click="copyToClipboard(selectedWallet.publicId)">
                                                <IconCopy class="w-4 h-4" />
                                                Copy Public ID
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div
                                v-if="selectedWallet?.publicId"
                                class="flex items-center gap-2 mt-2 cursor-pointer hover:opacity-100 opacity-70 transition-opacity"
                                @click="copyToClipboard(selectedWallet.publicId!)"
                            >
                                <IconTag class="w-3 h-3" />
                                <span class="text-xs font-mono">{{ selectedWallet.publicId }}</span>
                                <IconCopy class="w-3 h-3" />
                            </div>
                            <div class="mt-6 flex items-baseline gap-3">
                                <span class="text-4xl font-bold tracking-tight">
                                    {{
                                        isBalanceVisible
                                            ? displayAmount(currentPocket?.amount || 0)
                                            : "••••••"
                                    }}
                                </span>
                                <!-- Currency Selector -->
                                <div class="dropdown">
                                    <button
                                        class="badge badge-lg cursor-pointer gap-1 border-0 bg-white/20 text-white hover:bg-white/30"
                                    >
                                        {{ formatCurrency(selectedCurrency) }}
                                        <IconChevronDown class="w-3 h-3" />
                                    </button>
                                    <ul
                                        class="dropdown-content menu menu-sm z-1 mt-2 w-32 rounded-box bg-base-200 p-2 text-base-content shadow-sm"
                                    >
                                        <li
                                            v-for="pocket in allPockets"
                                            :key="pocket.currency"
                                        >
                                            <button
                                                :class="{ active: selectedCurrency === pocket.currency }"
                                                @click="selectedCurrency = pocket.currency"
                                            >
                                                {{ formatCurrency(pocket.currency) }}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div
                                v-if="currentPocket && currentPocket.heldAmount > 0 && isBalanceVisible"
                                class="mt-2 flex items-center gap-1 text-sm opacity-70"
                            >
                                <IconLock class="w-3 h-3" />
                                Held: {{ formatAmountWithSuffix(currentPocket.heldAmount) }} {{ selectedCurrency }}
                            </div>
                        </div>
                    </div>

                    <!-- Stats Cards -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                                        <IconArrowDownLeft class="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <p class="text-xs text-base-content/60">Income</p>
                                        <p class="font-bold text-success">
                                            {{ formatAmountWithSuffix(filteredStats?.totalIncome || 0) }}
                                        </p>
                                        <p class="text-[10px] text-base-content/40">{{ selectedCurrency }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                                        <IconArrowUpRight class="w-5 h-5 text-error" />
                                    </div>
                                    <div>
                                        <p class="text-xs text-base-content/60">Expense</p>
                                        <p class="font-bold text-error">
                                            {{ formatAmountWithSuffix(filteredStats?.totalOutgoing || 0) }}
                                        </p>
                                        <p class="text-[10px] text-base-content/40">{{ selectedCurrency }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions Card -->
                    <div class="card bg-base-100 shadow-sm">
                        <div class="card-body p-4">
                            <h3 class="text-xs font-semibold text-base-content/60 mb-3">Quick Actions</h3>
                            <div class="grid grid-cols-2 gap-3">
                                <button
                                    class="btn btn-primary h-auto py-4 gap-2"
                                    @click="showTransferDrawer = true"
                                >
                                    <IconSend class="w-5 h-5" />
                                    <span class="font-semibold">Transfer</span>
                                </button>
                                <button
                                    class="btn btn-outline h-auto py-4 gap-2"
                                    @click="showFundDrawer = true"
                                >
                                    <IconGift class="w-5 h-5" />
                                    <span class="font-semibold">Create Fund</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Transactions / Funds Card -->
                    <div class="card bg-base-100 shadow-sm">
                        <div class="card-body p-0">
                            <TabsRoot v-model="activeTab" default-value="transactions">
                                <TabsList class="flex border-b border-base-200 px-4">
                                    <TabsTrigger
                                        value="transactions"
                                        class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-base-content/60 border-b-2 border-transparent transition-colors hover:text-base-content data-[state=active]:text-primary data-[state=active]:border-primary"
                                    >
                                        <IconReceipt class="w-4 h-4" />
                                        Transactions
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="funds"
                                        class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-base-content/60 border-b-2 border-transparent transition-colors hover:text-base-content data-[state=active]:text-primary data-[state=active]:border-primary"
                                    >
                                        <IconGift class="w-4 h-4" />
                                        My Funds
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="transactions">
                                <!-- Filter -->
                                <div class="flex gap-2 px-4 py-3 border-b border-base-200">
                                    <button
                                        class="btn btn-xs"
                                        :class="transactionFilter === 'all' ? 'btn-primary' : 'btn-ghost'"
                                        @click="transactionFilter = 'all'"
                                    >
                                        All
                                    </button>
                                    <button
                                        class="btn btn-xs"
                                        :class="transactionFilter === 'income' ? 'btn-success' : 'btn-ghost'"
                                        @click="transactionFilter = 'income'"
                                    >
                                        Income
                                    </button>
                                    <button
                                        class="btn btn-xs"
                                        :class="transactionFilter === 'expense' ? 'btn-error' : 'btn-ghost'"
                                        @click="transactionFilter = 'expense'"
                                    >
                                        Expense
                                    </button>
                                </div>

                                <!-- Transaction List -->
                                <div class="divide-y divide-base-200/50">
                                    <div
                                        v-for="tx in filteredTransactions"
                                        :key="tx.id"
                                        class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/30 transition-colors cursor-pointer"
                                        @click="openTransactionModal(tx)"
                                    >
                                        <!-- Icon -->
                                        <div
                                            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            :class="
                                                isIncome(tx)
                                                    ? 'bg-success/10 text-success'
                                                    : 'bg-error/10 text-error'
                                            "
                                        >
                                            <IconArrowDownLeft v-if="isIncome(tx)" class="w-5 h-5" />
                                            <IconArrowUpRight v-else class="w-5 h-5" />
                                        </div>

                                        <!-- Info -->
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2">
                                                <span class="font-medium text-sm truncate">
                                                    {{ getTransactionLabel(tx) }}
                                                </span>
                                                <span class="badge badge-xs badge-ghost">{{ tx.currency }}</span>
                                                <span
                                                    v-if="tx.status !== 2"
                                                    class="badge badge-xs"
                                                    :class="getStatusBadgeClass(tx.status)"
                                                >
                                                    {{ getStatusText(tx.status) }}
                                                </span>
                                            </div>
                                            <p class="text-xs text-base-content/50">
                                                {{ formatDate(tx.createdAt) }}
                                            </p>
                                        </div>

                                        <!-- Amount -->
                                        <div class="text-right shrink-0">
                                            <span
                                                class="font-semibold text-sm"
                                                :class="isIncome(tx) ? 'text-success' : 'text-error'"
                                            >
                                                {{ isIncome(tx) ? "+" : "-" }}{{ formatAmount(tx.amount) }}
                                            </span>
                                            <div class="flex items-center justify-end gap-1 mt-0.5">
                                                <IconLock v-if="tx.isFrozen" class="w-3 h-3 text-info" />
                                                <IconClock v-if="tx.requireConfirmation" class="w-3 h-3 text-warning" />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Empty -->
                                    <div
                                        v-if="filteredTransactions.length === 0"
                                        class="py-12 text-center text-base-content/40"
                                    >
                                        <IconReceipt class="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p class="text-sm">No transactions yet</p>
                                    </div>
                                </div>

                                <!-- Load More -->
                                <div v-if="hasMoreTransactions" class="p-3 text-center border-t border-base-200/50">
                                    <button
                                        class="btn btn-ghost btn-sm"
                                        :disabled="isLoadingMore"
                                        @click="loadMoreTransactions"
                                    >
                                        <IconLoader v-if="isLoadingMore" class="w-4 h-4 animate-spin" />
                                        Load More
                                    </button>
                                </div>
                            </TabsContent>

                            <TabsContent value="funds">
                                <div class="divide-y divide-base-200/50">
                                    <div
                                        v-for="fund in funds"
                                        :key="fund.id"
                                        class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/30 transition-colors"
                                    >
                                        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <IconGift class="w-5 h-5 text-primary" />
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 flex-wrap">
                                                <span class="font-medium text-sm">Fund</span>
                                                <span class="badge badge-xs badge-ghost">{{ fund.currency }}</span>
                                                <span class="badge badge-xs" :class="getFundStatusBadgeClass(fund.status)">
                                                    {{ getFundStatusText(fund.status) }}
                                                </span>
                                                <span v-if="fund.isOpen" class="badge badge-xs badge-success">Open</span>
                                            </div>
                                            <p class="text-xs text-base-content/50">
                                                <template v-if="fund.isRaising">
                                                    Raised: {{ formatAmount(fund.raisedAmount) }} / {{ fund.targetAmount > 0 ? formatAmount(fund.targetAmount) : '∞' }}
                                                </template>
                                                <template v-else>
                                                    {{ fund.recipients?.filter(r => r.isReceived).length || 0 }}/{{ fund.recipients?.length || fund.amountOfSplits }} claimed
                                                </template>
                                            </p>
                                        </div>
                                        <div class="text-right shrink-0">
                                            <span class="font-semibold text-sm">{{ formatAmount(fund.totalAmount) }}</span>
                                            <p class="text-[10px] text-base-content/50">
                                                {{ formatAmount(fund.remainingAmount) }} left
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        v-if="funds.length === 0"
                                        class="py-12 text-center text-base-content/40"
                                    >
                                        <IconGift class="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p class="text-sm">No funds created yet</p>
                                    </div>
                                </div>

                                <!-- Load More -->
                                <div v-if="hasMoreFunds" class="p-3 text-center border-t border-base-200/50">
                                    <button
                                        class="btn btn-ghost btn-sm"
                                        :disabled="isLoadingMoreFunds"
                                        @click="loadMoreFunds"
                                    >
                                        <IconLoader v-if="isLoadingMoreFunds" class="w-4 h-4 animate-spin" />
                                        Load More
                                    </button>
                                </div>
                            </TabsContent>
                            </TabsRoot>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Sidebar -->
                <div class="space-y-4 hidden lg:block">
                    <!-- Stats Card -->
                    <div class="card bg-base-100 shadow-sm">
                        <div class="card-body p-4">
                            <h3 class="text-xs font-semibold text-base-content/60 mb-4">Monthly Overview</h3>
                            <div class="space-y-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                        <IconArrowDownLeft class="w-4 h-4 text-success" />
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-xs text-base-content/60">Income</p>
                                        <p class="font-bold text-sm text-success">
                                            {{ formatAmount(filteredStats?.totalIncome || 0) }}
                                            <span class="text-xs font-normal text-base-content/40">{{ selectedCurrency }}</span>
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                                        <IconArrowUpRight class="w-4 h-4 text-error" />
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-xs text-base-content/60">Expense</p>
                                        <p class="font-bold text-sm text-error">
                                            {{ formatAmount(filteredStats?.totalOutgoing || 0) }}
                                            <span class="text-xs font-normal text-base-content/40">{{ selectedCurrency }}</span>
                                        </p>
                                    </div>
                                </div>
                                <div class="divider my-2" />
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <IconWallet class="w-4 h-4 text-primary" />
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-xs text-base-content/60">Balance</p>
                                        <p class="font-bold text-sm">
                                            {{ formatAmount(currentPocket?.amount || 0) }}
                                            <span class="text-xs font-normal text-base-content/40">{{ selectedCurrency }}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Funds Card -->
                    <div v-if="funds.length > 0" class="card bg-base-100 shadow-sm">
                        <div class="card-body p-4">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xs font-semibold text-base-content/60">Recent Funds</h3>
                                <button
                                    v-if="funds.length > 3"
                                    class="btn btn-ghost btn-xs"
                                    @click="activeTab = 'funds'"
                                >
                                    View All
                                </button>
                            </div>
                            <div class="space-y-3">
                                <div
                                    v-for="fund in funds.slice(0, 3)"
                                    :key="fund.id"
                                    class="p-3 bg-base-200/30 rounded-xl"
                                >
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="font-semibold text-sm">
                                            {{ formatAmount(fund.totalAmount) }} {{ fund.currency }}
                                        </span>
                                        <span class="badge badge-xs" :class="getFundStatusBadgeClass(fund.status)">
                                            {{ getFundStatusText(fund.status) }}
                                        </span>
                                    </div>
                                    <progress
                                        class="progress progress-primary w-full h-1.5"
                                        :value="fund.isRaising ? fund.raisedAmount : (fund.recipients?.filter(r => r.isReceived).length || 0)"
                                        :max="fund.isRaising ? (fund.targetAmount || 1) : (fund.recipients?.length || fund.amountOfSplits)"
                                    />
                                    <p class="text-[10px] text-base-content/50 mt-1.5">
                                        <template v-if="fund.isRaising && fund.targetAmount > 0">
                                            {{ formatAmount(fund.raisedAmount) }} / {{ formatAmount(fund.targetAmount) }} raised
                                        </template>
                                        <template v-else>
                                            {{ fund.recipients?.filter(r => r.isReceived).length || 0 }} / {{ fund.recipients?.length || fund.amountOfSplits }} claimed
                                        </template>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Wallet Info Card -->
                    <div v-if="selectedWallet" class="card bg-base-100 shadow-sm">
                        <div class="card-body p-4">
                            <h3 class="text-xs font-semibold text-base-content/60 mb-4">Wallet Info</h3>
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-base-content/60">Name</span>
                                    <span class="font-medium">{{ selectedWallet.name || 'Default' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/60">Type</span>
                                    <span class="font-medium">{{ selectedWallet.realmId ? 'Realm' : 'Personal' }}</span>
                                </div>
                                <div v-if="selectedWallet.publicId" class="flex justify-between items-center">
                                    <span class="text-base-content/60">Public ID</span>
                                    <span
                                        class="font-mono text-xs text-primary cursor-pointer hover:underline"
                                        @click="copyToClipboard(selectedWallet.publicId!)"
                                    >
                                        {{ selectedWallet.publicId.slice(0, 12) }}...
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/60">Created</span>
                                    <span class="text-xs">{{ formatDate(selectedWallet.createdAt) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Create Wallet Drawer -->
            <AdminDrawer
                :open="showCreateWalletDrawer"
                @update:open="showCreateWalletDrawer = $event"
                title="Create New Wallet"
            >
                <div class="space-y-4">
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Wallet Name</legend>
                        <input
                            v-model="createWalletForm.name"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="My Wallet"
                        />
                        <p class="label">Choose a name for your wallet (optional)</p>
                    </fieldset>
                </div>

                <template #footer>
                    <div class="flex gap-3">
                        <button class="btn btn-ghost flex-1" @click="showCreateWalletDrawer = false">
                            Cancel
                        </button>
                        <button class="btn btn-primary flex-1" :disabled="isSubmitting" @click="handleCreateWallet">
                            <IconLoader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                            <IconPlus v-else class="w-4 h-4" />
                            Create
                        </button>
                    </div>
                </template>
            </AdminDrawer>

            <!-- Transfer Drawer -->
            <AdminDrawer
                :open="showTransferDrawer"
                @update:open="showTransferDrawer = $event"
                title="Transfer"
            >
                <div class="space-y-4">
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Amount</legend>
                        <input
                            v-model="transferForm.amount"
                            type="number"
                            step="0.01"
                            class="input input-bordered w-full"
                            placeholder="0.00"
                        />
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Currency</legend>
                        <select v-model="transferForm.currency" class="select select-bordered w-full">
                            <option v-for="pocket in allPockets" :key="pocket.currency" :value="pocket.currency">
                                {{ formatCurrency(pocket.currency) }}
                            </option>
                        </select>
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Payee Type</legend>
                        <div class="join w-full">
                            <button
                                class="btn join-item flex-1"
                                :class="transferForm.payeeType === 'account' ? 'btn-primary' : 'btn-ghost'"
                                @click="transferForm.payeeType = 'account'"
                            >
                                Account
                            </button>
                            <button
                                class="btn join-item flex-1"
                                :class="transferForm.payeeType === 'publicId' ? 'btn-primary' : 'btn-ghost'"
                                @click="transferForm.payeeType = 'publicId'"
                            >
                                Public ID
                            </button>
                        </div>
                    </fieldset>

                    <fieldset v-if="transferForm.payeeType === 'account'" class="fieldset">
                        <legend class="fieldset-legend">Recipient Username</legend>
                        <input
                            v-model="transferForm.recipient"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="username"
                        />
                    </fieldset>

                    <fieldset v-else class="fieldset">
                        <legend class="fieldset-legend">Wallet Public ID</legend>
                        <input
                            v-model="transferForm.publicId"
                            type="text"
                            class="input input-bordered w-full font-mono"
                            placeholder="DNW-XXXX-XXXX-XXXX"
                        />
                        <p class="label">Enter the recipient's wallet public ID</p>
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Remark (optional)</legend>
                        <textarea
                            v-model="transferForm.remark"
                            class="textarea textarea-bordered w-full"
                            rows="2"
                            placeholder="Add a note..."
                        />
                    </fieldset>

                    <!-- Transfer Options -->
                    <div class="bg-base-200/30 rounded-xl p-4 space-y-3">
                        <p class="text-xs font-semibold text-base-content/60">Transfer Options</p>
                        <div class="form-control">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input v-model="transferForm.freeze" type="checkbox" class="toggle toggle-primary toggle-sm" />
                                <div>
                                    <span class="label-text text-sm">Freeze Transfer</span>
                                    <p class="text-xs text-base-content/50">Funds held until confirmed</p>
                                </div>
                            </label>
                        </div>
                        <div class="form-control">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input v-model="transferForm.requireConfirmation" type="checkbox" class="toggle toggle-primary toggle-sm" />
                                <div>
                                    <span class="label-text text-sm">Require Confirmation</span>
                                    <p class="text-xs text-base-content/50">Recipient must confirm</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">PIN Code</legend>
                        <input
                            v-model="transferForm.pinCode"
                            type="password"
                            maxlength="6"
                            class="input input-bordered w-full"
                            placeholder="******"
                        />
                        <p class="label">Enter your 6-digit PIN to authorize</p>
                    </fieldset>
                </div>

                <template #footer>
                    <div class="flex gap-3">
                        <button class="btn btn-ghost flex-1" @click="showTransferDrawer = false">
                            Cancel
                        </button>
                        <button
                            class="btn btn-primary flex-1"
                            :disabled="!isTransferValid || isSubmitting"
                            @click="submitTransfer"
                        >
                            <IconLoader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                            <IconSend v-else class="w-4 h-4" />
                            Send
                        </button>
                    </div>
                </template>
            </AdminDrawer>

            <!-- Fund Drawer -->
            <AdminDrawer
                :open="showFundDrawer"
                @update:open="showFundDrawer = $event"
                title="Create Fund"
            >
                <div class="space-y-4">
                    <!-- Raising Mode Toggle -->
                    <div class="bg-base-200/30 rounded-xl p-4">
                        <div class="form-control">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input v-model="fundForm.isRaising" type="checkbox" class="toggle toggle-primary toggle-sm" />
                                <div>
                                    <span class="label-text text-sm">Raising Mode</span>
                                    <p class="text-xs text-base-content/50">Collect contributions towards a target</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <fieldset v-if="!fundForm.isRaising" class="fieldset">
                        <legend class="fieldset-legend">Total Amount</legend>
                        <input
                            v-model="fundForm.totalAmount"
                            type="number"
                            step="0.01"
                            class="input input-bordered w-full"
                            placeholder="0.00"
                        />
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Currency</legend>
                        <select v-model="fundForm.currency" class="select select-bordered w-full">
                            <option v-for="pocket in allPockets" :key="pocket.currency" :value="pocket.currency">
                                {{ formatCurrency(pocket.currency) }}
                            </option>
                        </select>
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Number of Splits</legend>
                        <input
                            v-model="fundForm.amountOfSplits"
                            type="number"
                            min="1"
                            class="input input-bordered w-full"
                            placeholder="1"
                        />
                        <p class="label">How many people can claim this fund</p>
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Split Type</legend>
                        <div class="join w-full">
                            <button
                                class="btn join-item flex-1"
                                :class="fundForm.splitType === 0 ? 'btn-primary' : 'btn-ghost'"
                                @click="fundForm.splitType = 0"
                            >
                                Even
                            </button>
                            <button
                                class="btn join-item flex-1"
                                :class="fundForm.splitType === 1 ? 'btn-primary' : 'btn-ghost'"
                                @click="fundForm.splitType = 1"
                            >
                                Random
                            </button>
                        </div>
                    </fieldset>

                    <!-- Raising Options -->
                    <template v-if="fundForm.isRaising">
                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">Target Amount</legend>
                            <input
                                v-model="fundForm.targetAmount"
                                type="number"
                                step="0.01"
                                class="input input-bordered w-full"
                                placeholder="0.00"
                            />
                            <p class="label">Set to 0 for unlimited target</p>
                        </fieldset>

                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">Contribution Type</legend>
                            <div class="join w-full">
                                <button
                                    class="btn join-item flex-1"
                                    :class="fundForm.contributionType === 0 ? 'btn-primary' : 'btn-ghost'"
                                    @click="fundForm.contributionType = 0"
                                >
                                    Free
                                </button>
                                <button
                                    class="btn join-item flex-1"
                                    :class="fundForm.contributionType === 1 ? 'btn-primary' : 'btn-ghost'"
                                    @click="fundForm.contributionType = 1"
                                >
                                    Fixed
                                </button>
                            </div>
                        </fieldset>

                        <fieldset v-if="fundForm.contributionType === 1" class="fieldset">
                            <legend class="fieldset-legend">Contribution Amount</legend>
                            <input
                                v-model="fundForm.contributionAmount"
                                type="number"
                                step="0.01"
                                class="input input-bordered w-full"
                                placeholder="0.00"
                            />
                        </fieldset>

                        <div class="form-control">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input v-model="fundForm.isOpen" type="checkbox" class="toggle toggle-primary toggle-sm" />
                                <div>
                                    <span class="label-text text-sm">Open to All</span>
                                    <p class="text-xs text-base-content/50">Anyone can claim this fund</p>
                                </div>
                            </label>
                        </div>

                        <fieldset class="fieldset">
                            <legend class="fieldset-legend">Deadline (optional)</legend>
                            <input
                                v-model="fundForm.deadlineAt"
                                type="datetime-local"
                                class="input input-bordered w-full"
                            />
                        </fieldset>
                    </template>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">Message (optional)</legend>
                        <textarea
                            v-model="fundForm.message"
                            class="textarea textarea-bordered w-full"
                            rows="2"
                            placeholder="Add a message..."
                        />
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">PIN Code</legend>
                        <input
                            v-model="fundForm.pinCode"
                            type="password"
                            maxlength="6"
                            class="input input-bordered w-full"
                            placeholder="******"
                        />
                        <p class="label">Enter your 6-digit PIN to authorize</p>
                    </fieldset>
                </div>

                <template #footer>
                    <div class="flex gap-3">
                        <button class="btn btn-ghost flex-1" @click="showFundDrawer = false">
                            Cancel
                        </button>
                        <button
                            class="btn btn-primary flex-1"
                            :disabled="!isFundValid || isSubmitting"
                            @click="submitFund"
                        >
                            <IconLoader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                            <IconGift v-else class="w-4 h-4" />
                            Create
                        </button>
                    </div>
                </template>
            </AdminDrawer>

            <!-- Transaction Detail Drawer -->
            <AdminDrawer
                :open="!!selectedTransaction"
                @update:open="selectedTransaction = $event ? selectedTransaction : null"
                title="Transaction Detail"
                direction="bottom"
            >
                <div v-if="selectedTransaction" class="space-y-6">
                    <!-- Amount Header -->
                    <div class="text-center py-4">
                        <div
                            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-box"
                            :class="
                                isIncome(selectedTransaction)
                                    ? 'bg-success/10 text-success'
                                    : 'bg-error/10 text-error'
                            "
                        >
                            <IconArrowDownLeft v-if="isIncome(selectedTransaction)" class="w-8 h-8" />
                            <IconArrowUpRight v-else class="w-8 h-8" />
                        </div>
                        <p class="text-sm text-base-content/60">
                            {{ isIncome(selectedTransaction) ? "Received" : "Sent" }}
                        </p>
                        <p
                            class="text-3xl font-bold mt-1"
                            :class="isIncome(selectedTransaction) ? 'text-success' : 'text-error'"
                        >
                            {{ isIncome(selectedTransaction) ? "+" : "-" }}{{ formatAmount(selectedTransaction.amount) }}
                            <span class="text-lg font-normal text-base-content/60">{{ selectedTransaction.currency }}</span>
                        </p>
                        <p class="text-xs text-base-content/50 mt-2">
                            {{ formatDate(selectedTransaction.createdAt, true) }}
                        </p>
                    </div>

                    <!-- Status Badge -->
                    <div class="flex justify-center">
                        <div class="badge badge-lg gap-2" :class="getStatusDetailBadgeClass(selectedTransaction.status)">
                            <component :is="getStatusIcon(selectedTransaction.status)" class="w-4 h-4" />
                            {{ getStatusText(selectedTransaction.status) }}
                        </div>
                    </div>

                    <!-- Transaction Info Card -->
                    <div class="bg-base-200/30 rounded-xl p-4 space-y-3">
                        <p class="text-xs font-semibold text-base-content/60">Transaction Info</p>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-base-content/60">Type</span>
                                <span>{{ selectedTransaction.type === 0 ? "Transfer" : "Payment" }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-base-content/60">Currency</span>
                                <span>{{ selectedTransaction.currency }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Lifecycle Info Card -->
                    <template v-if="selectedTransaction.isFrozen || selectedTransaction.requireConfirmation || selectedTransaction.frozenAt || selectedTransaction.expiresAt || selectedTransaction.confirmedAt">
                        <div class="bg-base-200/30 rounded-xl p-4 space-y-3">
                            <p class="text-xs font-semibold text-base-content/60">Lifecycle</p>
                            <div class="space-y-2 text-sm">
                                <div v-if="selectedTransaction.isFrozen" class="flex justify-between">
                                    <span class="text-base-content/60">Frozen</span>
                                    <span class="badge badge-info badge-xs">Yes</span>
                                </div>
                                <div v-if="selectedTransaction.requireConfirmation" class="flex justify-between">
                                    <span class="text-base-content/60">Confirmation Required</span>
                                    <span class="badge badge-warning badge-xs">Yes</span>
                                </div>
                                <div v-if="selectedTransaction.frozenAt" class="flex justify-between">
                                    <span class="text-base-content/60">Frozen At</span>
                                    <span>{{ formatDate(selectedTransaction.frozenAt, true) }}</span>
                                </div>
                                <div v-if="selectedTransaction.expiresAt" class="flex justify-between">
                                    <span class="text-base-content/60">Expires At</span>
                                    <span :class="{ 'text-error': isExpired(selectedTransaction.expiresAt) }">
                                        {{ formatDate(selectedTransaction.expiresAt, true) }}
                                    </span>
                                </div>
                                <div v-if="selectedTransaction.confirmedAt" class="flex justify-between">
                                    <span class="text-base-content/60">Confirmed At</span>
                                    <span>{{ formatDate(selectedTransaction.confirmedAt, true) }}</span>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Participants Card -->
                    <div class="bg-base-200/30 rounded-xl p-4 space-y-3">
                        <p class="text-xs font-semibold text-base-content/60">Participants</p>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3">
                                <IconArrowUpRight class="w-4 h-4 text-base-content/40" />
                                <span class="text-sm text-base-content/60 w-12">From</span>
                                <span class="font-medium text-sm">{{ selectedTransaction.payerWallet?.account?.nick || "System" }}</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <IconArrowDownLeft class="w-4 h-4 text-base-content/40" />
                                <span class="text-sm text-base-content/60 w-12">To</span>
                                <span class="font-medium text-sm">{{ selectedTransaction.payeeWallet?.account?.nick || "System" }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Remarks -->
                    <div v-if="selectedTransaction.remarks" class="bg-base-200/30 rounded-xl p-4">
                        <p class="text-xs font-semibold text-base-content/60 mb-2">Remarks</p>
                        <p class="text-sm">{{ selectedTransaction.remarks }}</p>
                    </div>

                    <!-- Confirm/Reject Actions -->
                    <template v-if="isPendingForPayee(selectedTransaction)">
                        <div class="flex gap-3">
                            <button
                                class="btn btn-error btn-outline flex-1"
                                :disabled="isSubmitting"
                                @click="handleRejectTransaction"
                            >
                                <IconX class="w-4 h-4" />
                                Reject
                            </button>
                            <button
                                class="btn btn-success flex-1"
                                :disabled="isSubmitting"
                                @click="handleConfirmTransaction"
                            >
                                <IconCheck class="w-4 h-4" />
                                Confirm
                            </button>
                        </div>
                    </template>

                    <!-- Technical Details Card -->
                    <div class="bg-base-200/30 rounded-xl p-4 space-y-3">
                        <p class="text-xs font-semibold text-base-content/60">Technical Details</p>
                        <div class="space-y-2">
                            <div
                                class="flex justify-between items-center cursor-pointer hover:bg-base-300/50 p-2 rounded-lg transition-colors"
                                @click="copyToClipboard(selectedTransaction.id)"
                            >
                                <span class="text-xs text-base-content/60">Transaction ID</span>
                                <span class="font-mono text-xs text-primary flex items-center gap-1">
                                    {{ selectedTransaction.id.slice(0, 8) }}...
                                    <IconCopy class="w-3 h-3" />
                                </span>
                            </div>
                            <div
                                class="flex justify-between items-center cursor-pointer hover:bg-base-300/50 p-2 rounded-lg transition-colors"
                                @click="copyToClipboard(selectedTransaction.payerWalletId || '')"
                            >
                                <span class="text-xs text-base-content/60">Payer Wallet</span>
                                <span class="font-mono text-xs text-primary flex items-center gap-1">
                                    {{ (selectedTransaction.payerWalletId || '-').slice(0, 8) }}...
                                    <IconCopy class="w-3 h-3" />
                                </span>
                            </div>
                            <div
                                class="flex justify-between items-center cursor-pointer hover:bg-base-300/50 p-2 rounded-lg transition-colors"
                                @click="copyToClipboard(selectedTransaction.payeeWalletId || '')"
                            >
                                <span class="text-xs text-base-content/60">Payee Wallet</span>
                                <span class="font-mono text-xs text-primary flex items-center gap-1">
                                    {{ (selectedTransaction.payeeWalletId || '-').slice(0, 8) }}...
                                    <IconCopy class="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDrawer>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import {
    IconWallet,
    IconPlus,
    IconArrowLeft,
    IconMoreVertical,
    IconEye,
    IconEyeOff,
    IconChevronDown,
    IconSend,
    IconGift,
    IconArrowDownLeft,
    IconArrowUpRight,
    IconReceipt,
    IconLoader,
    IconX,
    IconStar,
    IconBuilding,
    IconTag,
    IconCopy,
    IconKey,
    IconLock,
    IconClock,
    IconCheck,
    IconMaximize2,
    IconMinimize2,
} from "#components";
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui';
import type {
    Wallet,
    WalletStats,
    WalletPocket,
    Transaction,
    Fund,
    WalletPinStatus,
} from "~/utils/api";
import {
    fetchWallet,
    fetchWallets,
    createWallet as apiCreateWallet,
    setDefaultWallet as apiSetDefaultWallet,
    enableWalletPublicId,
    disableWalletPublicId,
    fetchWalletStats,
    fetchWalletPinStatus,
    fetchTransactions,
    fetchFunds,
    createTransfer,
    createFund,
    confirmTransaction,
    rejectTransaction,
    fetchAccount,
} from "~/utils/api";

const router = useRouter();

// State
const isLoading = ref(true);
const wallets = ref<Wallet[]>([]);
const selectedWalletId = ref<string | null>(null);
const stats = ref<WalletStats | null>(null);
const pinStatus = ref<WalletPinStatus | null>(null);
const transactions = ref<Transaction[]>([]);
const funds = ref<Fund[]>([]);
const selectedCurrency = ref("points");
const activeTab = ref<string>("transactions");
const transactionFilter = ref<"all" | "income" | "expense">("all");
const isBalanceVisible = ref(true);
const isFullAmountVisible = ref(false);

// Pagination
const txOffset = ref(0);
const fundOffset = ref(0);
const hasMoreTransactions = ref(false);
const hasMoreFunds = ref(false);
const isLoadingMore = ref(false);
const isLoadingMoreFunds = ref(false);

// Drawers
const showCreateWalletDrawer = ref(false);
const showTransferDrawer = ref(false);
const showFundDrawer = ref(false);
const selectedTransaction = ref<Transaction | null>(null);
const isSubmitting = ref(false);

// Forms
const createWalletForm = reactive({ name: "" });
const transferForm = reactive({
    amount: "",
    currency: "points",
    payeeType: "account" as "account" | "publicId",
    recipient: "",
    publicId: "",
    remark: "",
    pinCode: "",
    freeze: false,
    requireConfirmation: false,
});
const fundForm = reactive({
    totalAmount: "",
    currency: "points",
    splitType: 0,
    amountOfSplits: "1",
    message: "",
    pinCode: "",
    isRaising: false,
    isOpen: true,
    targetAmount: "",
    contributionType: 0,
    contributionAmount: "",
    deadlineAt: "",
});

// Computed
const selectedWallet = computed(() => {
    if (!wallets.value.length) return null;
    return wallets.value.find(w => w.id === selectedWalletId.value) || wallets.value[0];
});

const allPockets = computed<WalletPocket[]>(() => {
    if (!selectedWallet.value) return [];
    const currencies = new Set(["points", "golds"]);
    selectedWallet.value.pockets.forEach((p) => currencies.add(p.currency));
    return Array.from(currencies).map((currency) => {
        const existing = selectedWallet.value!.pockets.find((p) => p.currency === currency);
        return existing || {
            id: "",
            currency,
            amount: 0,
            heldAmount: 0,
            availableAmount: 0,
            walletId: selectedWallet.value!.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });
});

const currentPocket = computed(() => allPockets.value.find((p) => p.currency === selectedCurrency.value));
const filteredStats = computed(() => stats.value);

const filteredTransactions = computed(() => {
    if (transactionFilter.value === "all") return transactions.value;
    return transactions.value.filter((tx) => {
        const income = isIncome(tx);
        return transactionFilter.value === "income" ? income : !income;
    });
});

const isTransferValid = computed(() => {
    if (parseFloat(transferForm.amount) <= 0) return false;
    if (transferForm.pinCode.length !== 6) return false;
    if (transferForm.payeeType === 'account') return !!transferForm.recipient.trim();
    return !!transferForm.publicId.trim();
});

const isFundValid = computed(() => {
    if (fundForm.isRaising) return parseInt(fundForm.amountOfSplits) > 0 && fundForm.pinCode.length === 6;
    return parseFloat(fundForm.totalAmount) > 0 && parseInt(fundForm.amountOfSplits) > 0 && fundForm.pinCode.length === 6;
});

// Helpers
function formatAmount(amount: number): string {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAmountWithSuffix(amount: number): string {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}m`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}k`;
    return amount.toFixed(2);
}

function displayAmount(amount: number): string {
    return isFullAmountVisible.value ? formatAmount(amount) : formatAmountWithSuffix(amount);
}

function formatCurrency(currency: string): string {
    return currency.charAt(0).toUpperCase() + currency.slice(1).toLowerCase();
}

function formatDate(dateStr: string, withTime = false): string {
    const date = new Date(dateStr);
    if (withTime) return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function isIncome(tx: Transaction): boolean { return selectedWallet.value?.id === tx.payeeWalletId; }
function getTransactionLabel(tx: Transaction): string { return isIncome(tx) ? (tx.payerWallet?.account?.nick || "System") : (tx.payeeWallet?.account?.nick || "System"); }
function getPocketForWallet(wallet: Wallet): WalletPocket | undefined { return wallet.pockets.find(p => p.currency === selectedCurrency.value); }
function isExpired(dateStr: string): boolean { return new Date(dateStr).getTime() < Date.now(); }
function isPendingForPayee(tx: Transaction): boolean { return (tx.status === 0 || tx.status === 1) && selectedWallet.value?.id === tx.payeeWalletId; }

function getStatusText(status: number): string {
    const map: Record<number, string> = { 0: 'Pending', 1: 'Frozen', 2: 'Confirmed', 3: 'Refunded', 4: 'Cancelled' };
    return map[status] || 'Unknown';
}

function getStatusBadgeClass(status: number): string {
    const map: Record<number, string> = { 0: 'badge-warning', 1: 'badge-info', 2: 'badge-success', 3: 'badge-error', 4: 'badge-ghost' };
    return map[status] || 'badge-ghost';
}

function getStatusDetailBadgeClass(status: number): string {
    const map: Record<number, string> = { 0: 'badge-warning', 1: 'badge-info', 2: 'badge-success', 3: 'badge-error', 4: 'badge-neutral' };
    return map[status] || 'badge-ghost';
}

function getStatusIcon(status: number) {
    const map: Record<number, any> = { 0: IconClock, 1: IconLock, 2: IconCheck, 3: IconArrowLeft, 4: IconX };
    return map[status] || IconReceipt;
}

function getFundStatusText(status: number): string {
    const map: Record<number, string> = { 0: 'Created', 1: 'Partial', 2: 'Completed', 3: 'Expired' };
    return map[status] || 'Unknown';
}

function getFundStatusBadgeClass(status: number): string {
    const map: Record<number, string> = { 0: 'badge-info', 1: 'badge-warning', 2: 'badge-success', 3: 'badge-error' };
    return map[status] || 'badge-ghost';
}

function copyToClipboard(text: string) { navigator.clipboard.writeText(text); }

// API Actions
async function loadData() {
    try {
        const [w, s, txs, fds, ps] = await Promise.all([fetchWallets(), fetchWalletStats(), fetchTransactions(), fetchFunds(), fetchWalletPinStatus()]);
        wallets.value = w;
        stats.value = s;
        transactions.value = txs.items;
        hasMoreTransactions.value = txs.hasMore;
        funds.value = fds.items;
        hasMoreFunds.value = fds.hasMore;
        pinStatus.value = ps;
        if (w.length > 0 && !selectedWalletId.value) {
            const primary = w.find(wallet => wallet.isPrimary) || w[0];
            selectedWalletId.value = primary.id;
        }
        if (selectedWallet.value && selectedWallet.value.pockets.length > 0) {
            selectedCurrency.value = selectedWallet.value.pockets[0].currency;
        }
    } catch (err) { console.error("Failed to load wallet:", err); }
}

async function handleCreateWallet() {
    isSubmitting.value = true;
    try {
        const newWallet = await apiCreateWallet({ name: createWalletForm.name || undefined });
        wallets.value.push(newWallet);
        selectedWalletId.value = newWallet.id;
        showCreateWalletDrawer.value = false;
        createWalletForm.name = "";
    } catch (err) { console.error("Failed to create wallet:", err); await useAlert().notify("Failed to create wallet"); }
    finally { isSubmitting.value = false; }
}

async function setDefaultWallet(walletId: string) {
    try { await apiSetDefaultWallet(walletId); await loadData(); }
    catch (err) { console.error("Failed to set default wallet:", err); await useAlert().notify("Failed to set default wallet"); }
}

async function togglePublicId(walletId: string, enable: boolean) {
    try {
        if (enable) await enableWalletPublicId(walletId);
        else await disableWalletPublicId(walletId);
        await loadData();
    } catch (err) { console.error("Failed to toggle public ID:", err); await useAlert().notify("Failed to toggle public ID"); }
}

async function loadMoreTransactions() {
    isLoadingMore.value = true;
    txOffset.value += 20;
    try { const result = await fetchTransactions(txOffset.value); transactions.value.push(...result.items); hasMoreTransactions.value = result.hasMore; }
    finally { isLoadingMore.value = false; }
}

async function loadMoreFunds() {
    isLoadingMoreFunds.value = true;
    fundOffset.value += 20;
    try { const result = await fetchFunds(fundOffset.value); funds.value.push(...result.items); hasMoreFunds.value = result.hasMore; }
    finally { isLoadingMoreFunds.value = false; }
}

function openTransactionModal(tx: Transaction) { selectedTransaction.value = tx; }

async function submitTransfer() {
    isSubmitting.value = true;
    try {
        let payeeAccountId: string | undefined;
        let payeePublicId: string | undefined;
        if (transferForm.payeeType === 'account') {
            const account = await fetchAccount(transferForm.recipient);
            if (!account?.id) { await useAlert().notify("User not found"); return; }
            payeeAccountId = account.id;
        } else { payeePublicId = transferForm.publicId.trim().toUpperCase(); }
        await createTransfer({
            amount: parseFloat(transferForm.amount), currency: transferForm.currency,
            payeeAccountId, payeePublicId, remark: transferForm.remark || undefined,
            pinCode: transferForm.pinCode, freeze: transferForm.freeze || undefined,
            requireConfirmation: transferForm.requireConfirmation || undefined,
            payerWalletId: selectedWalletId.value || undefined,
        });
        showTransferDrawer.value = false;
        Object.assign(transferForm, { amount: "", recipient: "", publicId: "", remark: "", pinCode: "", freeze: false, requireConfirmation: false });
        await loadData();
    } catch (err) { console.error("Transfer failed:", err); await useAlert().notify("Transfer failed"); }
    finally { isSubmitting.value = false; }
}

async function submitFund() {
    isSubmitting.value = true;
    try {
        await createFund({
            currency: fundForm.currency,
            totalAmount: fundForm.isRaising ? undefined : parseFloat(fundForm.totalAmount),
            splitType: fundForm.splitType, amountOfSplits: parseInt(fundForm.amountOfSplits),
            recipientAccountIds: [], message: fundForm.message || undefined,
            pinCode: fundForm.pinCode || undefined, isRaising: fundForm.isRaising || undefined,
            isOpen: fundForm.isRaising ? fundForm.isOpen : undefined,
            targetAmount: fundForm.isRaising ? parseFloat(fundForm.targetAmount) || 0 : undefined,
            contributionType: fundForm.isRaising ? fundForm.contributionType : undefined,
            contributionAmount: fundForm.isRaising && fundForm.contributionType === 1 ? parseFloat(fundForm.contributionAmount) : undefined,
            deadlineAt: fundForm.isRaising && fundForm.deadlineAt ? new Date(fundForm.deadlineAt).toISOString() : undefined,
            payerWalletId: selectedWalletId.value || undefined,
        });
        showFundDrawer.value = false;
        Object.assign(fundForm, { totalAmount: "", amountOfSplits: "1", message: "", pinCode: "", isRaising: false, isOpen: true, targetAmount: "", contributionType: 0, contributionAmount: "", deadlineAt: "" });
        await loadData();
    } catch (err) { console.error("Fund creation failed:", err); await useAlert().notify("Failed to create fund"); }
    finally { isSubmitting.value = false; }
}

async function handleConfirmTransaction() {
    if (!selectedTransaction.value) return;
    isSubmitting.value = true;
    try { await confirmTransaction(selectedTransaction.value.id); selectedTransaction.value = null; await loadData(); }
    catch (err) { console.error("Failed to confirm transaction:", err); await useAlert().notify("Failed to confirm transaction"); }
    finally { isSubmitting.value = false; }
}

async function handleRejectTransaction() {
    if (!selectedTransaction.value) return;
    isSubmitting.value = true;
    try { await rejectTransaction(selectedTransaction.value.id); selectedTransaction.value = null; await loadData(); }
    catch (err) { console.error("Failed to reject transaction:", err); await useAlert().notify("Failed to reject transaction"); }
    finally { isSubmitting.value = false; }
}

onMounted(async () => { isLoading.value = true; await loadData(); isLoading.value = false; });

defineOgImage('UniOgImage', { title: 'Wallet' })
useSolarSeo({ title: "Wallet" });
</script>
