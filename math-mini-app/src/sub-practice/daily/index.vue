<template>
  <view class="page" :class="{ dark: isDark }">
    <!-- 挑战前：介绍卡片 -->
    <view v-if="p.phase.value === 'setup'" class="intro">
      <view class="intro-card">
        <text class="intro-emoji">🏆</text>
        <text class="intro-title">每日挑战</text>
        <text class="intro-desc">5 道随机选择题，检验今天的公式记忆</text>
        <view class="streak-row">
          <text class="streak-text">连续打卡 {{ streak }} 天</text>
          <text v-if="emoji" class="streak-emoji">{{ emoji }}</text>
        </view>
        <view class="ladder">
          <text
            v-for="rungs in ladder"
            :key="rungs.days"
            class="ladder-item"
            :class="{ reached: streak >= rungs.days }"
          >{{ rungs.emoji }} {{ rungs.days }}天</text>
        </view>
        <view v-if="isCompleted" class="done-card">
          <text class="done-text">✅ 今日已完成：{{ state.score }}/{{ state.total }} 分</text>
          <text class="done-hint">明天再来保持打卡记录！</text>
        </view>
        <view v-else class="start-btn" @click="p.startDailyChallenge">开始挑战</view>
      </view>
    </view>

    <!-- 答题 -->
    <McqQuestion
      v-else-if="p.phase.value === 'quiz' && currentQuestion"
      :question="currentQuestion"
      :q-index="p.qIndex.value"
      :total="p.questions.value.length"
      :selected="p.selectedOption.value"
      @answer="p.handleMcqAnswer"
    />

    <!-- 结果 -->
    <view v-else-if="p.phase.value === 'result'">
      <QuizResult
        :score="p.score.value"
        :total="p.questions.value.length"
        :questions="p.questions.value"
        :answers="p.answers.value"
        @restart="goBack"
        @back="goBack"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { usePractice } from '@/composables/usePractice'
import { useDailyChallenge } from '@/composables/useDailyChallenge'
import { useFavorites } from '@/composables/useFavorites'
import { useTheme } from '@/composables/useTheme'
import McqQuestion from '@/components/McqQuestion.vue'
import QuizResult from '@/components/QuizResult.vue'

const { isDark } = useTheme()
const { favorites } = useFavorites()
const p = usePractice(favorites)
const { state, isCompleted, streak, emoji, completeChallenge } = useDailyChallenge()

const ladder = [
  { days: 3, emoji: '📚' },
  { days: 7, emoji: '💪' },
  { days: 14, emoji: '⭐' },
  { days: 30, emoji: '🔥' },
]

const currentQuestion = computed(() => p.questions.value[p.qIndex.value] ?? null)

// 答题结束 → 记录打卡（只记一次）
const recorded = ref(false)
onLoad(() => {
  recorded.value = false
})
watch(p.phase, (phase) => {
  if (phase === 'result' && !recorded.value) {
    recorded.value = true
    completeChallenge(p.score.value, p.questions.value.length)
  }
})

function goBack() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.intro-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.intro-emoji {
  font-size: 96rpx;
}
.intro-title {
  font-size: 44rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-top: var(--spacing-sm);
}
.intro-desc {
  font-size: var(--font-base);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}
.streak-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
}
.streak-text {
  font-size: var(--font-lg);
  color: var(--text-primary);
  font-weight: 600;
}
.streak-emoji {
  font-size: 40rpx;
}
.ladder {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}
.ladder-item {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  opacity: 0.4;
}
.ladder-item.reached {
  opacity: 1;
  color: var(--text-primary);
}
.start-btn {
  margin-top: var(--spacing-xl);
  padding: 24rpx 80rpx;
  background: var(--brand-color);
  color: #fff;
  font-size: var(--font-lg);
  font-weight: 600;
  border-radius: 48rpx;
}
.done-card {
  margin-top: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}
.done-text {
  font-size: var(--font-lg);
  color: #00b894;
  font-weight: 600;
}
.done-hint {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
</style>
