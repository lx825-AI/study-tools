<template>
  <view class="mcq">
    <view class="question-card">
      <text class="question-label">以下哪个是</text>
      <text class="question-name">「{{ question.formula.name }}」</text>
      <text class="question-progress">{{ qIndex + 1 }} / {{ total }}</text>
    </view>
    <view class="options">
      <view
        v-for="(opt, i) in question.options"
        :key="i"
        class="option-card"
        :class="optionClass(i, opt.correct)"
        @click="select(i)"
      >
        <scroll-view scroll-x class="option-scroll" :show-scrollbar="false">
          <FormulaCanvas :latex="opt.latex" :font-size="15" :color="optionColor(i, opt.correct)" />
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Question } from '@/composables/usePractice'
import FormulaCanvas from './FormulaCanvas.vue'

const props = defineProps<{
  question: Question
  qIndex: number
  total: number
  selected: number | null
}>()

const emit = defineEmits<{ answer: [optIndex: number] }>()

function select(i: number) {
  if (props.selected !== null) return
  emit('answer', i)
}

function optionClass(i: number, correct: boolean) {
  if (props.selected === null) return ''
  if (correct) return 'correct'
  if (i === props.selected) return 'wrong'
  return 'dimmed'
}

function optionColor(i: number, correct: boolean) {
  if (props.selected === null) return ''
  if (correct) return '#00b894'
  if (i === props.selected) return '#e17055'
  return ''
}
</script>

<style scoped>
.question-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}
.question-label {
  font-size: var(--font-base);
  color: var(--text-secondary);
}
.question-name {
  font-size: var(--font-lg);
  font-weight: bold;
  color: var(--text-primary);
  flex: 1;
}
.question-progress {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.option-card {
  background: var(--bg-primary);
  border: 2rpx solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: border-color 0.2s;
}
.option-card.correct {
  border-color: #00b894;
  background: rgba(0, 184, 148, 0.08);
}
.option-card.wrong {
  border-color: #e17055;
  background: rgba(225, 112, 85, 0.08);
}
.option-card.dimmed {
  opacity: 0.5;
}
.option-scroll {
  width: 100%;
  white-space: nowrap;
}
</style>
