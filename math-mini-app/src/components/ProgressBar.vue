<template>
  <view class="progress-wrap">
    <view class="progress-track">
      <view
        class="progress-fill"
        :style="{ width: percent + '%', backgroundColor: color }"
      />
    </view>
    <text v-if="showText" class="progress-text">{{ percent }}%</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percent: number
    color?: string
    showText?: boolean
  }>(),
  { color: '#0984e3', showText: true }
)

const percent = computed(() => Math.min(100, Math.max(0, Math.round(props.percent))))
</script>

<style scoped>
.progress-wrap {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.progress-track {
  flex: 1;
  height: 12rpx;
  background: var(--border-color);
  border-radius: 6rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 20rpx;
  color: var(--text-secondary);
  min-width: 56rpx;
  text-align: right;
}
</style>
