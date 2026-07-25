<template>
  <view class="page" :class="{ dark: isDark }">
    <view v-if="section" class="header">
      <view class="header-main">
        <text class="title">{{ section.title }}</text>
        <text class="subtitle">{{ section.formulas.length }} 条公式 · 已看 {{ viewedCount(section.id) }} 条</text>
      </view>
      <ProgressBar :percent="getPercent(section.id, section.formulas.length)" :color="subject.color" />
    </view>

    <view class="formula-list">
      <FormulaCard
        v-for="i in visibleIndices"
        :key="i"
        :section-id="section!.id"
        :formula-index="i"
        :formula="section!.formulas[i]"
      />
    </view>
    <view v-if="visibleCount < totalCount" class="load-more" @click="loadMore">加载更多（{{ visibleCount }}/{{ totalCount }}）</view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { useFormulaStore } from '@/stores/formulas'
import { subjectOfSection } from '@/data/subjects'
import { useProgress } from '@/composables/useProgress'
import { useTheme } from '@/composables/useTheme'
import { usePageQuery } from '@/composables/usePageQuery'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import FormulaCard from '@/components/FormulaCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'

const store = useFormulaStore()
const { getPercent, viewedCount } = useProgress()
const { isDark } = useTheme()
const infinite = useInfiniteScroll(10)

const query = usePageQuery()
const sectionId = computed(() => query.value.section ?? '')
const section = computed(() => store.data[sectionId.value] ?? null)
const subject = computed(() => subjectOfSection(sectionId.value))

const totalCount = computed(() => section.value?.formulas.length ?? 0)
const visibleCount = computed(() => infinite.pageCount.value * 10)
/** 当前页面渲染的公式索引范围（触底加载时递增） */
const visibleIndices = computed(() => {
  const max = Math.min(infinite.pageCount.value * 10, totalCount.value)
  return Array.from({ length: max }, (_, i) => i)
})

// 切章节时重置分页
watch(sectionId, (id) => {
  infinite.reset()
  if (store.data[id]) uni.setNavigationBarTitle({ title: store.data[id].title })
})

function loadMore() {
  infinite.loadMore(visibleCount.value, totalCount.value)
}

onReachBottom(() => loadMore())
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.header {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.header-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--spacing-sm);
}
.title {
  font-size: var(--font-xl);
  font-weight: bold;
  color: var(--text-primary);
}
.subtitle {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.formula-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
