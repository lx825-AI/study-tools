<template>
  <view class="flashcard">
    <view class="question-progress">{{ qIndex + 1 }} / {{ total }}</view>
    <view class="card" @click="flipped = !flipped">
      <view v-if="!flipped" class="card-face">
        <text class="face-label">公式名称</text>
        <text class="face-name">{{ question.formula.name }}</text>
        <text class="face-hint">点击卡片查看公式</text>
      </view>
      <view v-else class="card-face">
        <scroll-view scroll-x class="face-scroll" :show-scrollbar="false">
          <FormulaCanvas :latex="question.formula.latex" :font-size="18" />
        </scroll-view>
        <text v-if="question.formula.note" class="face-note">{{ question.formula.note }}</text>
      </view>
    </view>
    <view v-if="flipped" class="judge-row">
      <view class="judge-btn unknown" @click="emit('unknown')">😕 还不熟</view>
      <view class="judge-btn known" @click="emit('known')">😎 已掌握</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Question } from '@/composables/usePractice'
import FormulaCanvas from './FormulaCanvas.vue'

const props = defineProps<{
  question: Question
  qIndex: number
  total: number
}>()

const emit = defineEmits<{
  known: []
  unknown: []
}>()

const flipped = ref(false)
watch(() => props.qIndex, () => {
  flipped.value = false
})
</script>

<style scoped>
.question-progress {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-sm);
}
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  min-height: 360rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  margin-bottom: var(--spacing-md);
}
.card-face {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}
.face-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.face-name {
  font-size: 40rpx;
  font-weight: bold;
  color: var(--text-primary);
  text-align: center;
}
.face-hint {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  opacity: 0.6;
}
.face-scroll {
  width: 100%;
  white-space: nowrap;
}
.face-note {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  text-align: center;
}
.judge-row {
  display: flex;
  gap: var(--spacing-sm);
}
.judge-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  color: #fff;
}
.judge-btn.unknown {
  background: #e17055;
}
.judge-btn.known {
  background: #00b894;
}
</style>
