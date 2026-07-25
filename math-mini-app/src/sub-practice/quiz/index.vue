<template>
  <view class="page" :class="{ dark: isDark }">
    <!-- SETUP：设置面板 -->
    <view v-if="p.phase.value === 'setup'" class="setup">
      <view class="setup-card">
        <text class="setup-title">🎯 公式测验</text>

        <text class="field-label">题库来源</text>
        <view class="option-row">
          <text
            v-for="opt in poolOptions"
            :key="opt.value"
            class="opt-chip"
            :class="{ active: p.poolMode.value === opt.value }"
            @click="p.poolMode.value = opt.value"
          >{{ opt.label }}</text>
        </view>

        <text class="field-label">测验模式</text>
        <view class="option-row">
          <text
            class="opt-chip"
            :class="{ active: p.quizMode.value === 'mcq' }"
            @click="p.quizMode.value = 'mcq'"
          >📝 选择题</text>
          <text
            class="opt-chip"
            :class="{ active: p.quizMode.value === 'flashcard' }"
            @click="p.quizMode.value = 'flashcard'"
          >🃏 闪卡记忆</text>
        </view>

        <text class="field-label">题目数量</text>
        <view class="option-row">
          <text
            v-for="n in [5, 10, 20]"
            :key="n"
            class="opt-chip"
            :class="{ active: p.count.value === n }"
            @click="p.count.value = n"
          >{{ n }} 题</text>
        </view>

        <view class="start-btn" :class="{ disabled: p.pool.value.length === 0 }" @click="start">
          开始测验（{{ p.pool.value.length }} 题可用）
        </view>
        <text v-if="p.pool.value.length === 0" class="empty-hint">
          {{ p.poolMode.value === 'favorites' ? '收藏夹为空，先去收藏一些公式吧' : '错题本为空，太棒了！' }}
        </text>
      </view>
    </view>

    <!-- QUIZ：选择题 -->
    <McqQuestion
      v-else-if="p.phase.value === 'quiz' && currentQuestion"
      :question="currentQuestion"
      :q-index="p.qIndex.value"
      :total="p.questions.value.length"
      :selected="p.selectedOption.value"
      @answer="p.handleMcqAnswer"
    />

    <!-- FLASHCARD：闪卡 -->
    <FlashcardQuestion
      v-else-if="p.phase.value === 'flashcard' && currentQuestion"
      :question="currentQuestion"
      :q-index="p.qIndex.value"
      :total="p.questions.value.length"
      @known="p.handleFlashcardKnown"
      @unknown="p.handleFlashcardUnknown"
    />

    <!-- RESULT：结果 -->
    <QuizResult
      v-else-if="p.phase.value === 'result'"
      :score="displayScore"
      :total="p.questions.value.length"
      :questions="p.questions.value"
      :answers="p.answers.value"
      @restart="p.startQuiz"
      @back="p.goToSetup"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePractice } from '@/composables/usePractice'
import { useFavorites } from '@/composables/useFavorites'
import { useTheme } from '@/composables/useTheme'
import McqQuestion from '@/components/McqQuestion.vue'
import FlashcardQuestion from '@/components/FlashcardQuestion.vue'
import QuizResult from '@/components/QuizResult.vue'

const { isDark } = useTheme()
const { favorites } = useFavorites()
const p = usePractice(favorites)

const poolOptions = computed(() => [
  { value: 'all' as const, label: '📚 全部公式' },
  { value: 'favorites' as const, label: `⭐ 收藏（${favorites.value.size}）` },
  { value: 'mistakes' as const, label: `❌ 错题（${p.mistakeCount.value}）` },
])

const currentQuestion = computed(() => p.questions.value[p.qIndex.value] ?? null)

// 闪卡模式的成绩用 flashcardKnown，选择题用 score
const displayScore = computed(() =>
  p.quizMode.value === 'flashcard' ? p.flashcardKnown.value : p.score.value
)

function start() {
  if (p.pool.value.length === 0) return
  p.startQuiz()
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.setup-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
.setup-title {
  font-size: 40rpx;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
  text-align: center;
  margin-bottom: var(--spacing-lg);
}
.field-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  display: block;
  margin: var(--spacing-md) 0 var(--spacing-xs);
}
.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.opt-chip {
  font-size: var(--font-sm);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1rpx solid var(--border-color);
  border-radius: 32rpx;
  padding: 12rpx 28rpx;
}
.opt-chip.active {
  color: #fff;
  background: var(--brand-color);
  border-color: var(--brand-color);
}
.start-btn {
  margin-top: var(--spacing-xl);
  text-align: center;
  padding: 24rpx 0;
  background: var(--brand-color);
  color: #fff;
  font-size: var(--font-lg);
  font-weight: 600;
  border-radius: var(--radius-md);
}
.start-btn.disabled {
  opacity: 0.4;
}
.empty-hint {
  display: block;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-sm);
}
</style>
