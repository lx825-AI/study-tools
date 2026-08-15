<template>
  <view class="result">
    <view class="score-card">
      <view class="score-ring" :style="{ background: ringGradient }">
        <view class="score-inner">
          <text class="score-num">{{ percent }}</text>
          <text class="score-unit">分</text>
        </view>
      </view>
      <text class="score-text">{{ score }} / {{ total }} 题正确</text>
      <text class="score-comment">{{ comment }}</text>
    </view>

    <view v-if="wrongItems.length > 0" class="wrong-block">
      <text class="block-title">错题（{{ wrongItems.length }}）</text>
      <view
        v-for="item in wrongItems"
        :key="`${item.sectionId}:${item.index}`"
        class="wrong-item"
        @click="goDetail(item)"
      >
        <text class="wrong-name">{{ item.formula.name }}</text>
        <text class="wrong-arrow">›</text>
      </view>
    </view>

    <view class="btn-row">
      <view class="btn secondary" @click="emit('restart')">🔄 再来一轮</view>
      <view class="btn primary" @click="emit('back')">✅ 完成</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/composables/usePractice'

const props = defineProps<{
  score: number
  total: number
  questions: Question[]
  answers: boolean[]
}>()

const emit = defineEmits<{
  restart: []
  back: []
}>()

const percent = computed(() => (props.total > 0 ? Math.round((props.score / props.total) * 100) : 0))

const ringGradient = computed(() => {
  const color = percent.value >= 80 ? '#00b894' : percent.value >= 60 ? '#fdcb6e' : '#e17055'
  return `conic-gradient(${color} ${percent.value * 3.6}deg, var(--border-color) 0deg)`
})

const comment = computed(() => {
  if (percent.value === 100) return '满分！太厉害了 🎉'
  if (percent.value >= 80) return '很棒，继续保持 💪'
  if (percent.value >= 60) return '还不错，错题再看看 📖'
  return '别灰心，多练几轮 🌱'
})

const wrongItems = computed(() =>
  props.questions.filter((_, i) => props.answers[i] === false)
)

function goDetail(item: Question) {
  uni.navigateTo({
    url: `/sub-browse/detail/index?section=${item.sectionId}&index=${item.index}`,
  })
}
</script>

<style scoped>
.score-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--spacing-md);
}
.score-ring {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}
.score-inner {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--bg-primary);
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 48rpx;
  box-sizing: border-box;
}
.score-num {
  font-size: 56rpx;
  font-weight: bold;
  color: var(--text-primary);
}
.score-unit {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-left: 4rpx;
}
.score-text {
  font-size: var(--font-lg);
  color: var(--text-primary);
}
.score-comment {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}
.wrong-block {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.block-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: var(--spacing-sm);
}
.wrong-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-top: 1rpx solid var(--border-color);
}
.wrong-name {
  font-size: var(--font-base);
  color: var(--text-primary);
}
.wrong-arrow {
  color: var(--text-secondary);
  font-size: 32rpx;
}
.btn-row {
  display: flex;
  gap: var(--spacing-sm);
}
.btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
}
.btn.primary {
  background: var(--brand-color);
  color: #fff;
}
.btn.secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1rpx solid var(--border-color);
}
</style>
