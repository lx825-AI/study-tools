<template>
  <view class="page" :class="{ dark: isDark }">
    <view class="header">
      <text class="title">📐 数学公式速查</text>
      <text class="subtitle">5 大学科 · 34 章节 · 177 条公式</text>
    </view>

    <!-- 每日挑战入口 -->
    <view class="daily-card" @click="goDaily">
      <view class="daily-left">
        <text class="daily-emoji">🏆</text>
        <view class="daily-info">
          <text class="daily-title">每日挑战</text>
          <text class="daily-desc">
            {{ isCompleted ? `今日已完成 ${state.score}/${state.total}` : '5 道随机选择题，快来打卡' }}
          </text>
        </view>
      </view>
      <view class="daily-right">
        <text v-if="streak > 0" class="streak">{{ emoji }}{{ streak }} 天</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 学科入口 -->
    <view class="section-title">学科浏览</view>
    <view class="subject-grid">
      <view
        v-for="s in subjectCards"
        :key="s.id"
        class="subject-card"
        :style="{ borderLeftColor: s.color }"
        @click="goSections(s.id)"
      >
        <view class="subject-top">
          <text class="subject-emoji">{{ s.emoji }}</text>
          <view class="subject-info">
            <text class="subject-name">{{ s.name }}</text>
            <text class="subject-desc">{{ s.desc }}</text>
          </view>
        </view>
        <ProgressBar :percent="s.percent" :color="s.color" />
      </view>
    </view>

    <!-- 推荐公式 -->
    <view class="section-title">随便看看</view>
    <view class="recommend-list">
      <FormulaCard
        v-for="item in recommends"
        :key="`${item.sectionId}:${item.index}`"
        :section-id="item.sectionId"
        :formula-index="item.index"
        :formula="item.formula"
      />
    </view>

    <!-- 快捷入口 -->
    <view class="quick-row">
      <view class="quick-btn" @click="goRecent">🕐 最近浏览</view>
      <view class="quick-btn" @click="goQuiz">🎯 公式测验</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFormulaStore } from '@/stores/formulas'
import { SUBJECTS } from '@/data/subjects'
import { useProgress } from '@/composables/useProgress'
import { useDailyChallenge } from '@/composables/useDailyChallenge'
import { useTheme } from '@/composables/useTheme'
import type { Formula } from '@/data/types'
import FormulaCard from '@/components/FormulaCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'

interface RecommendItem {
  formula: Formula
  sectionId: string
  index: number
}

const store = useFormulaStore()
const { getPercent } = useProgress()
const { state, isCompleted, streak, emoji } = useDailyChallenge()
const { isDark } = useTheme()

const subjectCards = computed(() =>
  SUBJECTS.map((s) => {
    const sections = Object.values(store.data).filter((sec) => sec.subject === s.name)
    const total = sections.reduce((sum, sec) => sum + sec.formulas.length, 0)
    const viewed = sections.reduce((sum, sec) => sum + getPercent(sec.id, sec.formulas.length) * sec.formulas.length, 0)
    return { ...s, percent: total > 0 ? Math.round(viewed / total) : 0 }
  })
)

const recommends = ref<RecommendItem[]>([])
onLoad(() => {
  // O(4) 随机选取：随机 4 个章节各取首条公式，比全量 shuffle O(n log n) 更高效
  const sectionIds = Object.keys(store.data)
  const picks = new Set<number>()
  while (picks.size < 4 && picks.size < sectionIds.length) {
    picks.add(Math.floor(Math.random() * sectionIds.length))
  }
  recommends.value = [...picks].map((i) => {
    const sid = sectionIds[i]
    const f = store.data[sid].formulas[0]
    return { formula: f, sectionId: sid, index: 0 }
  })
})

function goSections(subjectId: string) {
  uni.navigateTo({ url: `/sub-browse/sections/index?subject=${subjectId}` })
}

function goDaily() {
  uni.navigateTo({ url: '/sub-practice/daily/index' })
}

function goRecent() {
  uni.navigateTo({ url: '/sub-browse/recent/index' })
}

function goQuiz() {
  uni.navigateTo({ url: '/sub-practice/quiz/index' })
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.header {
  text-align: center;
  padding: var(--spacing-lg) 0;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
}
.subtitle {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}
.daily-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--brand-gradient);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.daily-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.daily-emoji {
  font-size: 56rpx;
}
.daily-info {
  display: flex;
  flex-direction: column;
}
.daily-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: #fff;
}
.daily-desc {
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.85);
  margin-top: 4rpx;
}
.daily-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.streak {
  font-size: var(--font-sm);
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
}
.arrow {
  font-size: 36rpx;
  color: #fff;
}
.section-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}
.subject-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}
.subject-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  border-left: 6rpx solid;
  padding: var(--spacing-md);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.subject-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}
.subject-emoji {
  font-size: 48rpx;
}
.subject-info {
  display: flex;
  flex-direction: column;
}
.subject-name {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}
.subject-desc {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: 4rpx;
}
.recommend-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.quick-row {
  display: flex;
  gap: var(--spacing-sm);
}
.quick-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  color: var(--text-primary);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
</style>
