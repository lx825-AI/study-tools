<template>
  <view class="filter-panel">
    <scroll-view scroll-x class="filter-row" :show-scrollbar="false">
      <view class="chip-list">
        <text
          class="chip"
          :class="{ active: subject === '' }"
          @click="update('subject', '')"
        >全部学科</text>
        <text
          v-for="s in SUBJECTS"
          :key="s.id"
          class="chip"
          :class="{ active: subject === s.id }"
          :style="subject === s.id ? { backgroundColor: s.color, borderColor: s.color } : {}"
          @click="update('subject', s.id)"
        >{{ s.emoji }} {{ s.name }}</text>
      </view>
    </scroll-view>
    <scroll-view scroll-x class="filter-row" :show-scrollbar="false">
      <view class="chip-list">
        <text
          class="chip"
          :class="{ active: level === '' }"
          @click="update('level', '')"
        >全部难度</text>
        <text
          v-for="(meta, key) in LEVEL_META"
          :key="key"
          class="chip"
          :class="{ active: level === key }"
          :style="level === key ? { backgroundColor: meta.color, borderColor: meta.color } : {}"
          @click="update('level', key)"
        >{{ meta.label }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { SUBJECTS, LEVEL_META } from '@/data/subjects'

defineProps<{
  subject: string
  level: string
}>()

const emit = defineEmits<{
  'update:subject': [value: string]
  'update:level': [value: string]
}>()

function update(field: 'subject' | 'level', value: string) {
  if (field === 'subject') emit('update:subject', value)
  else emit('update:level', value)
}
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.filter-row {
  width: 100%;
  white-space: nowrap;
}
.chip-list {
  display: inline-flex;
  gap: var(--spacing-sm);
  padding: 4rpx;
}
.chip {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1rpx solid var(--border-color);
  border-radius: 32rpx;
  padding: 10rpx 24rpx;
}
.chip.active {
  color: #fff;
  background: var(--brand-color);
  border-color: var(--brand-color);
}
</style>
