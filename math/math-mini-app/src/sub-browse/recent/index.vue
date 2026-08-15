<template>
  <view class="page" :class="{ dark: isDark }">
    <EmptyState
      v-if="recent.length === 0"
      emoji="🕐"
      title="暂无浏览记录"
      desc="浏览过的公式会出现在这里，方便快速回顾"
    />
    <template v-else>
      <view class="toolbar">
        <text class="count">共 {{ recent.length }} 条</text>
        <text class="clear-btn" @click="handleClear">清空</text>
      </view>
      <view class="formula-list">
        <FormulaCard
          v-for="item in items"
          :key="`${item.sectionId}:${item.formulaIndex}`"
          :section-id="item.sectionId"
          :formula-index="item.formulaIndex"
          :formula="item.formula"
        />
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormulaStore } from '@/stores/formulas'
import { useRecent } from '@/composables/useRecent'
import { useTheme } from '@/composables/useTheme'
import FormulaCard from '@/components/FormulaCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useFormulaStore()
const { recent, clear } = useRecent()
const { isDark } = useTheme()

const items = computed(() =>
  recent.value
    .map((r) => ({
      ...r,
      formula: store.data[r.sectionId]?.formulas[r.formulaIndex],
    }))
    .filter((x) => !!x.formula)
)

function handleClear() {
  uni.showModal({
    title: '清空最近浏览？',
    success: (res) => {
      if (res.confirm) clear()
    },
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
  margin-bottom: var(--spacing-sm);
}
.count {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.clear-btn {
  font-size: var(--font-sm);
  color: var(--brand-color);
}
.formula-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
