<template>
  <view class="page" :class="{ dark: isDark }">
    <!-- 成绩趋势 -->
    <view class="card">
      <text class="card-title">📈 成绩趋势（近 {{ scores.length }} 次）</text>
      <view v-if="scores.length === 0" class="empty-line">
        <text class="empty-text">还没有测验记录，去做几道题吧</text>
      </view>
      <view v-else class="trend-chart">
        <view
          v-for="(s, i) in scores"
          :key="i"
          class="trend-bar"
          :style="{ height: Math.max(8, s * 1.6) + 'rpx', backgroundColor: barColor(s) }"
          :title="`${s}分`"
        />
      </view>
      <view v-if="scores.length > 0" class="avg-line">
        <text class="avg-text">平均分 {{ avgScore }}</text>
      </view>
    </view>

    <!-- 错题本 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">❌ 错题本（{{ mistakes.length }}）</text>
        <text v-if="mistakes.length > 0" class="review-btn" @click="goReview">去复习</text>
      </view>
      <view v-if="mistakes.length === 0" class="empty-line">
        <text class="empty-text">没有错题，太棒了！</text>
      </view>
      <view
        v-for="m in mistakeItems"
        :key="`${m.sectionId}:${m.formulaIndex}`"
        class="mistake-item"
        @click="goDetail(m)"
      >
        <view class="mistake-main">
          <text class="mistake-name">{{ m.name }}</text>
          <text class="mistake-meta">{{ m.sectionTitle }} · 错 {{ m.wrongCount }} 次</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormulaStore } from '@/stores/formulas'
import { loadScores, loadMistakes } from '@/composables/usePractice'
import { useTheme } from '@/composables/useTheme'

const store = useFormulaStore()
const { isDark } = useTheme()

const scores = computed(() => loadScores().slice(-20))
const avgScore = computed(() =>
  scores.value.length > 0
    ? Math.round(scores.value.reduce((a, b) => a + b, 0) / scores.value.length)
    : 0
)

const mistakes = computed(() => loadMistakes().sort((a, b) => b.wrongCount - a.wrongCount))

const mistakeItems = computed(() =>
  mistakes.value
    .map((m) => ({
      ...m,
      name: store.data[m.sectionId]?.formulas[m.formulaIndex]?.name ?? '未知公式',
      sectionTitle: store.data[m.sectionId]?.title ?? '',
    }))
    .slice(0, 30)
)

function barColor(s: number): string {
  if (s >= 80) return '#00b894'
  if (s >= 60) return '#fdcb6e'
  return '#e17055'
}

function goDetail(m: { sectionId: string; formulaIndex: number }) {
  uni.navigateTo({
    url: `/sub-browse/detail/index?section=${m.sectionId}&index=${m.formulaIndex}`,
  })
}

function goReview() {
  uni.navigateTo({ url: '/sub-practice/quiz/index' })
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}
.review-btn {
  font-size: var(--font-sm);
  color: var(--brand-color);
}
.empty-line {
  padding: var(--spacing-lg) 0;
  text-align: center;
}
.empty-text {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
  height: 180rpx;
  margin-top: var(--spacing-md);
}
.trend-bar {
  flex: 1;
  border-radius: 4rpx 4rpx 0 0;
  min-width: 12rpx;
}
.avg-line {
  margin-top: var(--spacing-sm);
  text-align: right;
}
.avg-text {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.mistake-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-top: 1rpx solid var(--border-color);
  margin-top: var(--spacing-xs);
}
.mistake-main {
  display: flex;
  flex-direction: column;
}
.mistake-name {
  font-size: var(--font-base);
  color: var(--text-primary);
}
.mistake-meta {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: 4rpx;
}
.arrow {
  color: var(--text-secondary);
  font-size: 32rpx;
}
</style>
