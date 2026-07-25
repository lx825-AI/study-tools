<template>
  <view class="page" :class="{ dark: isDark }">
    <EmptyState
      v-if="items.length === 0"
      emoji="⭐"
      title="还没有收藏任何公式"
      desc="浏览公式时点击 ☆ 即可收藏，收藏后可云端同步"
      button-text="去逛逛"
      @action="goHome"
    />
    <template v-else>
      <view class="toolbar">
        <text class="count">共 {{ totalCount }} 条收藏</text>
        <text class="export-btn" @click="exportMarkdown">📤 导出 Markdown</text>
      </view>
      <view class="formula-list">
        <FormulaCard
          v-for="item in visibleItems"
          :key="`${item.sectionId}:${item.formulaIndex}`"
          :section-id="item.sectionId"
          :formula-index="item.formulaIndex"
          :formula="item.formula"
        />
      </view>
      <view v-if="visibleItems.length < totalCount" class="load-more" @click="loadMore">
        加载更多（{{ visibleItems.length }}/{{ totalCount }}）
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { useFormulaStore } from '@/stores/formulas'
import { useFavorites } from '@/composables/useFavorites'
import { useTheme } from '@/composables/useTheme'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import FormulaCard from '@/components/FormulaCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useFormulaStore()
const { list } = useFavorites()
const { isDark } = useTheme()
const infinite = useInfiniteScroll(15)

const items = computed(() =>
  list.value
    .map((f) => ({
      ...f,
      formula: store.data[f.sectionId]?.formulas[f.formulaIndex],
    }))
    .filter((x) => !!x.formula)
)

const totalCount = computed(() => items.value.length)
const visibleItems = computed(() => items.value.slice(0, infinite.pageCount.value * 15))

// 收藏列表变化时重置分页
watch(totalCount, () => infinite.reset())

function loadMore() {
  infinite.loadMore(visibleItems.value.length, totalCount.value)
}

onReachBottom(() => loadMore())

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

function exportMarkdown() {
  const md = visibleItems.value
    .map((item) => {
      const sec = store.data[item.sectionId]
      return `## ${item.formula.name}（${sec?.title}）\n\n$$\n${item.formula.latex}\n$$\n\n> ${item.formula.note}`
    })
    .join('\n\n---\n\n')
  uni.setClipboardData({
    data: `# 我的数学公式收藏（${totalCount.value} 条）\n\n${md}`,
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'none' }),
  })
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}
.count {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.export-btn {
  font-size: var(--font-sm);
  color: var(--brand-color);
}
.formula-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
