<template>
  <view class="search-bar">
    <text class="search-icon">🔍</text>
    <input
      class="search-input"
      :value="modelValue"
      :placeholder="placeholder"
      confirm-type="search"
      @input="onInput"
      @confirm="emit('confirm', modelValue)"
    />
    <text v-if="modelValue" class="clear-btn" @click="clear">✕</text>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  { placeholder: '搜索公式名称、LaTeX、笔记…' }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  confirm: [value: string]
}>()

function onInput(e: Event) {
  // uni-app 的 input 事件值在 detail.value，与 DOM InputEvent 类型不兼容，运行时结构一致
  emit('update:modelValue', (e as unknown as { detail: { value: string } }).detail.value)
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: 40rpx;
  padding: 16rpx var(--spacing-md);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.search-icon {
  font-size: 28rpx;
}
.search-input {
  flex: 1;
  font-size: var(--font-base);
  color: var(--text-primary);
}
.clear-btn {
  font-size: 28rpx;
  color: var(--text-secondary);
  padding: 0 8rpx;
}
</style>
