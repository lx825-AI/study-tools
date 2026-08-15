<template>
  <view class="empty-state">
    <text class="empty-emoji">{{ emoji }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
    <view v-if="buttonText" class="empty-btn" @click="emit('action')">{{ buttonText }}</view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    emoji?: string
    title: string
    desc?: string
    buttonText?: string
  }>(),
  { emoji: '📭', desc: '', buttonText: '' }
)

const emit = defineEmits<{ action: [] }>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx var(--spacing-md);
  gap: var(--spacing-sm);
}
.empty-emoji {
  font-size: 80rpx;
}
.empty-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}
.empty-desc {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  text-align: center;
}
.empty-btn {
  margin-top: var(--spacing-md);
  padding: 16rpx 48rpx;
  background: var(--brand-color);
  color: #fff;
  font-size: var(--font-base);
  border-radius: 40rpx;
}
</style>
