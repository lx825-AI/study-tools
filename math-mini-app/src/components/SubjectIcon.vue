<template>
  <view class="subject-icon" :style="{ backgroundColor: color + '22' }">
    <text class="emoji">{{ emoji }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  emoji: string
  color: string
}>()
</script>

<style scoped>
.subject-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.emoji {
  font-size: 44rpx;
}
</style>
