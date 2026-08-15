<template>
  <view class="formula-card" @click="goDetail">
    <view class="card-header">
      <text class="formula-name">{{ formula.name }}</text>
      <view class="header-right">
        <text
          v-if="formula.level"
          class="level-badge"
          :style="{ backgroundColor: levelColor }"
        >{{ levelLabel }}</text>
        <text class="fav-btn" :class="{ active: isFav }" @click.stop="toggleFav">
          {{ isFav ? '★' : '☆' }}
        </text>
      </view>
    </view>
    <scroll-view scroll-x class="canvas-scroll" :show-scrollbar="false">
      <FormulaCanvas
        ref="canvasRef"
        :latex="formula.latex"
        :font-size="fontSize"
        :delay="Math.min(formulaIndex, 8) * 100"
        @copy="copyLatex"
        @export="showActions"
      />
    </scroll-view>
    <view class="card-footer" @click.stop>
      <text class="action-link" @click="copyLatex">📋 复制</text>
      <text class="action-link" @click="showActions">⋯ 更多</text>
      <text v-if="hasNote(sectionId, formulaIndex)" class="note-mark">📝 有笔记</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Formula } from '@/data/types'
import { LEVEL_META } from '@/data/subjects'
import { useFavorites } from '@/composables/useFavorites'
import { useNotes } from '@/composables/useNotes'
import { usePreferencesStore } from '@/stores/preferences'
import FormulaCanvas from './FormulaCanvas.vue'

const props = defineProps<{
  sectionId: string
  formulaIndex: number
  formula: Formula
}>()

const { has, toggle } = useFavorites()
const { hasNote } = useNotes()
const prefs = usePreferencesStore()
const canvasRef = ref<InstanceType<typeof FormulaCanvas> | null>(null)

const isFav = computed(() => has(props.sectionId, props.formulaIndex))
const levelLabel = computed(() => (props.formula.level ? LEVEL_META[props.formula.level].label : ''))
const levelColor = computed(() => (props.formula.level ? LEVEL_META[props.formula.level].color : ''))
const fontSize = computed(() => ({ small: 15, medium: 18, large: 22 })[prefs.fontSize])

function toggleFav() {
  toggle(props.sectionId, props.formulaIndex)
  uni.showToast({ title: isFav.value ? '已收藏' : '已取消', icon: 'none' })
}

function goDetail() {
  uni.navigateTo({ url: `/sub-browse/detail/index?section=${props.sectionId}&index=${props.formulaIndex}` })
}

function copyLatex() {
  uni.setClipboardData({
    data: props.formula.latex,
    success: () => uni.showToast({ title: '已复制 LaTeX', icon: 'none' }),
  })
}

function showActions() {
  const list = ['复制 LaTeX', '复制 Markdown', '📷 保存图片', isFav.value ? '取消收藏' : '收藏']
  uni.showActionSheet({
    itemList: list,
    success: ({ tapIndex }) => {
      if (tapIndex === 0) copyLatex()
      else if (tapIndex === 1) {
        uni.setClipboardData({
          data: `$$\n${props.formula.latex}\n$$`,
          success: () => uni.showToast({ title: '已复制 Markdown', icon: 'none' }),
        })
      } else if (tapIndex === 2) {
        canvasRef.value?.toImage()
      } else if (tapIndex === 3) toggleFav()
    },
  })
}
</script>

<style scoped>
.formula-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
.formula-name {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  margin-right: var(--spacing-sm);
}
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.level-badge {
  font-size: 20rpx;
  color: #fff;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
}
.fav-btn {
  font-size: 40rpx;
  color: var(--text-secondary);
  line-height: 1;
}
.fav-btn.active {
  color: #f39c12;
}
.canvas-scroll {
  width: 100%;
  white-space: nowrap;
  padding: var(--spacing-xs) 0;
}
.card-footer {
  display: flex;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1rpx solid var(--border-color);
}
.action-link {
  font-size: var(--font-sm);
  color: var(--brand-color);
}
.note-mark {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-left: auto;
}
</style>
