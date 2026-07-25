<template>
  <view class="page" :class="{ dark: isDark }">
    <SearchBar :model-value="query" @update:model-value="setQuery" @confirm="onConfirm" />

    <!-- 搜索历史（未搜索时展示） -->
    <view v-if="!isSearching && history.length > 0" class="history-block">
      <view class="block-header">
        <text class="block-title">搜索历史</text>
        <text class="block-action" @click="clearHistory">清空</text>
      </view>
      <view class="history-chips">
        <text v-for="h in history" :key="h" class="history-chip" @click="setQuery(h); onConfirm(h)">
          {{ h }}
        </text>
      </view>
    </view>

    <!-- 筛选面板（搜索时展示） -->
    <FilterPanel
      v-if="isSearching"
      v-model:subject="subjectFilter"
      v-model:level="levelFilter"
      class="filters"
    />

    <!-- 搜索结果 -->
    <view v-if="isSearching" class="results">
      <view class="block-header">
        <text class="block-title">{{ results.length }} 条结果</text>
        <text class="block-action" @click="toggleSort">
          {{ sortBySection ? '按章节 ↓' : '按匹配度' }}
        </text>
      </view>
      <EmptyState
        v-if="results.length === 0"
        emoji="🔍"
        title="没有找到相关公式"
        desc="试试更换关键词，或调整学科/难度筛选"
      />
      <view v-else class="result-list">
        <view
          v-for="item in visibleResults"
          :key="`${item.sectionId}:${item.formulaIndex}`"
          class="result-card"
          @click="goDetail(item)"
        >
          <view class="result-header">
            <text class="result-name">{{ formulaOf(item)?.name }}</text>
            <text class="result-section">{{ item.sectionTitle }}</text>
          </view>
          <scroll-view scroll-x class="result-canvas" :show-scrollbar="false">
            <FormulaCanvas
              v-if="formulaOf(item)"
              :latex="formulaOf(item)!.latex"
              :font-size="15"
            />
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { useFormulaStore } from '@/stores/formulas'
import { useSearch, type SearchResult } from '@/composables/useSearch'
import { useSearchHistory } from '@/composables/useSearchHistory'
import { useTheme } from '@/composables/useTheme'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import SearchBar from '@/components/SearchBar.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import EmptyState from '@/components/EmptyState.vue'
import FormulaCanvas from '@/components/FormulaCanvas.vue'

const store = useFormulaStore()
const { isDark } = useTheme()
const {
  query, setQuery, results, isSearching,
  subjectFilter, levelFilter, sortBySection, toggleSort,
} = useSearch()
const { history, add, clear: clearHistory } = useSearchHistory()
const infinite = useInfiniteScroll(20)

const visibleResults = computed(() => results.value.slice(0, infinite.pageCount.value * 20))

// 搜索条件变化时重置分页
watch([() => results.value.length], () => infinite.reset())

function loadMore() {
  infinite.loadMore(visibleResults.value.length, results.value.length)
}

onReachBottom(() => loadMore())

function onConfirm(q: string) {
  setQuery(q)
  add(q)
}

function formulaOf(item: SearchResult) {
  return store.data[item.sectionId]?.formulas[item.formulaIndex]
}

function goDetail(item: SearchResult) {
  add(query.value)
  uni.navigateTo({
    url: `/sub-browse/detail/index?section=${item.sectionId}&index=${item.formulaIndex}`,
  })
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.history-block {
  margin-top: var(--spacing-md);
}
.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: var(--spacing-md) 0 var(--spacing-sm);
}
.block-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}
.block-action {
  font-size: var(--font-sm);
  color: var(--brand-color);
}
.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.history-chip {
  font-size: var(--font-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border-radius: 32rpx;
  padding: 10rpx 24rpx;
}
.filters {
  margin-top: var(--spacing-md);
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.result-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--spacing-xs);
}
.result-name {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  margin-right: var(--spacing-sm);
}
.result-section {
  font-size: 20rpx;
  color: var(--text-secondary);
}
.result-canvas {
  width: 100%;
  white-space: nowrap;
}
</style>
