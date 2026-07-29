<template>
    <div class="card bg-base-100">
        <div class="card-body p-4">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <div class="badge badge-primary badge-lg gap-1 font-bold">
                        <IconStar class="w-3 h-3" />
                        Lv {{ level }}
                    </div>
                </div>
                <span class="text-sm font-bold text-primary">
                    {{ Math.round(progress * 100) }}%
                </span>
            </div>

            <div class="relative h-2 overflow-hidden rounded-box bg-base-300">
                <div
                    class="absolute inset-y-0 left-0 rounded-box bg-primary transition-all duration-200"
                    :style="{ width: `${progress * 100}%` }"
                />
            </div>

            <div class="mt-2 text-xs text-base-content/60">
                {{ experience.toLocaleString() }} XP earned
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    level: number;
    experience: number;
    progress: number; // 0.0 to 1.0
}

defineProps<Props>();
</script>
