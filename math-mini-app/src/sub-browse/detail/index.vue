<template>
  <view v-if="formula" class="page" :class="{ dark: isDark }">
    <view class="formula-panel">
      <view class="panel-header">
        <text class="formula-name">{{ formula.name }}</text>
        <text class="fav-btn" :class="{ active: isFav }" @click="toggleFav">
          {{ isFav ? '★' : '☆' }}
        </text>
      </view>
      <scroll-view scroll-x class="canvas-scroll" :show-scrollbar="false">
        <FormulaCanvas ref="canvasRef" :latex="formula.latex" :font-size="canvasFontSize" @copy="copyLatex" @export="showActions" />
      </scroll-view>
      <view class="nav-row">
        <text class="nav-btn" :class="{ disabled: index <= 0 }" @click="go(-1)">← 上一条</text>
        <text class="nav-pos">{{ index + 1 }} / {{ section?.formulas.length }}</text>
        <text class="nav-btn" :class="{ disabled: index >= (section?.formulas.length ?? 1) - 1 }" @click="go(1)">下一条 →</text>
      </view>
    </view>

    <view class="info-card">
      <text class="info-title">📌 要点</text>
      <text class="info-text">{{ formula.note }}</text>
    </view>

    <view v-if="formula.detail" class="info-card">
      <text class="info-title">📖 详解</text>
      <text class="info-text">{{ formula.detail }}</text>
    </view>

    <view class="info-card">
      <view class="note-header">
        <text class="info-title">📝 我的笔记</text>
        <text v-if="noteDraft !== savedNote" class="save-btn" @click="saveNote">保存</text>
      </view>
      <textarea
        v-model="noteDraft"
        class="note-editor"
        placeholder="记录你的理解、口诀、易错点…"
        :maxlength="2000"
        auto-height
      />
    </view>

    <view class="action-row">
      <view class="action-btn" @click="copyLatex">📋 复制 LaTeX</view>
      <view class="action-btn" @click="copyMarkdown">📄 复制 Markdown</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFormulaStore } from '@/stores/formulas'
import { useFavorites } from '@/composables/useFavorites'
import { useNotes } from '@/composables/useNotes'
import { useRecent } from '@/composables/useRecent'
import { useProgress } from '@/composables/useProgress'
import { useTheme } from '@/composables/useTheme'
import { usePageQuery } from '@/composables/usePageQuery'
import { usePreferencesStore } from '@/stores/preferences'
import FormulaCanvas from '@/components/FormulaCanvas.vue'

const canvasRef = ref<InstanceType<typeof FormulaCanvas> | null>(null)

const store = useFormulaStore()
const { has, toggle } = useFavorites()
const { getNote, setNote } = useNotes()
const { add: addRecent } = useRecent()
const { markViewed } = useProgress()
const { isDark } = useTheme()
const prefs = usePreferencesStore()

const query = usePageQuery()
const sectionId = ref('')
const index = ref(0)
const noteDraft = ref('')

const section = computed(() => store.data[sectionId.value] ?? null)
const formula = computed(() => section.value?.formulas[index.value] ?? null)
const isFav = computed(() => has(sectionId.value, index.value))
const savedNote = computed(() => getNote(sectionId.value, index.value))
const canvasFontSize = computed(() => ({ small: 17, medium: 20, large: 24 })[prefs.fontSize])

function openFormula() {
  if (!formula.value) return
  uni.setNavigationBarTitle({ title: formula.value.name })
  noteDraft.value = getNote(sectionId.value, index.value)
  addRecent(sectionId.value, index.value)
  markViewed(sectionId.value, index.value)
}

// 路由参数变化（含 H5 同页面复用）→ 重新加载公式
watch(
  query,
  (q) => {
    if (!q.section) return
    const nextIndex = Number(q.index ?? 0)
    if (q.section === sectionId.value && nextIndex === index.value) return
    sectionId.value = q.section
    index.value = nextIndex
    openFormula()
  },
  { immediate: true }
)

function go(delta: number) {
  const next = index.value + delta
  if (!section.value || next < 0 || next >= section.value.formulas.length) return
  index.value = next
  openFormula()
}

function toggleFav() {
  toggle(sectionId.value, index.value)
  uni.showToast({ title: isFav.value ? '已收藏 ★' : '已取消收藏', icon: 'none' })
}

function saveNote() {
  setNote(sectionId.value, index.value, noteDraft.value)
  uni.showToast({ title: '笔记已保存 ✅', icon: 'none' })
}

function copyLatex() {
  uni.setClipboardData({
    data: formula.value?.latex ?? '',
    success: () => uni.showToast({ title: '已复制 LaTeX', icon: 'none' }),
  })
}

function copyMarkdown() {
  const f = formula.value
  if (!f) return
  uni.setClipboardData({
    data: `## ${f.name}\n\n$$\n${f.latex}\n$$\n\n> ${f.note}`,
    success: () => uni.showToast({ title: '已复制 Markdown', icon: 'none' }),
  })
}

function showActions() {
  const list = ['复制 LaTeX', '复制 Markdown', '📷 保存图片', isFav.value ? '取消收藏' : '收藏']
  uni.showActionSheet({
    itemList: list,
    success: ({ tapIndex }) => {
      if (tapIndex === 0) copyLatex()
      else if (tapIndex === 1) copyMarkdown()
      else if (tapIndex === 2) canvasRef.value?.toImage()
      else if (tapIndex === 3) toggleFav()
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
.formula-panel {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
.formula-name {
  font-size: var(--font-xl);
  font-weight: bold;
  color: var(--text-primary);
  flex: 1;
}
.fav-btn {
  font-size: 48rpx;
  color: var(--text-secondary);
  line-height: 1;
}
.fav-btn.active {
  color: #f39c12;
}
.canvas-scroll {
  width: 100%;
  white-space: nowrap;
  padding: var(--spacing-md) 0;
}
.nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid var(--border-color);
  padding-top: var(--spacing-sm);
}
.nav-btn {
  font-size: var(--font-base);
  color: var(--brand-color);
}
.nav-btn.disabled {
  color: var(--text-secondary);
  opacity: 0.4;
}
.nav-pos {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.info-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.info-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: var(--spacing-xs);
}
.info-text {
  font-size: var(--font-base);
  color: var(--text-primary);
  line-height: 1.7;
}
.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.save-btn {
  font-size: var(--font-sm);
  color: var(--brand-color);
}
.note-editor {
  width: 100%;
  min-height: 140rpx;
  font-size: var(--font-base);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  box-sizing: border-box;
}
.action-row {
  display: flex;
  gap: var(--spacing-sm);
}
.action-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  background: var(--bg-primary);
  border: 1rpx solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  color: var(--text-primary);
}
</style>
