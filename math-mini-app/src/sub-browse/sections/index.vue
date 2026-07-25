<template>
  <view class="page" :class="{ dark: isDark }">
    <view class="subject-header" :style="{ borderLeftColor: subject.color }">
      <SubjectIcon :emoji="subject.emoji" :color="subject.color" />
      <view class="subject-info">
        <text class="subject-name">{{ subject.name }}</text>
        <text class="subject-desc">{{ sections.length }} 个章节 · {{ totalFormulas }} 条公式</text>
      </view>
    </view>

    <view class="section-list">
      <view v-for="sec in sections" :key="sec.id" class="section-card" @click="goFormulas(sec.id)">
        <view class="section-main">
          <text class="section-title">{{ sec.title }}</text>
          <text class="section-count">{{ sec.formulas.length }} 条</text>
        </view>
        <ProgressBar :percent="getPercent(sec.id, sec.formulas.length)" :color="subject.color" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormulaStore } from '@/stores/formulas'
import { SUBJECTS } from '@/data/subjects'
import { useProgress } from '@/composables/useProgress'
import { useTheme } from '@/composables/useTheme'
import { usePageQuery } from '@/composables/usePageQuery'
import SubjectIcon from '@/components/SubjectIcon.vue'
import ProgressBar from '@/components/ProgressBar.vue'

const store = useFormulaStore()
const { getPercent } = useProgress()
const { isDark } = useTheme()

const query = usePageQuery()
const subjectId = computed(() => query.value.subject ?? 'calc')
const subject = computed(() => SUBJECTS.find((s) => s.id === subjectId.value) ?? SUBJECTS[0])

const sections = computed(() =>
  Object.values(store.data).filter((sec) => sec.subject === subject.value.name)
)

const totalFormulas = computed(() =>
  sections.value.reduce((sum, sec) => sum + sec.formulas.length, 0)
)

function goFormulas(sectionId: string) {
  uni.navigateTo({ url: `/sub-browse/formulas/index?section=${sectionId}` })
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.subject-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  border-left: 6rpx solid;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.subject-info {
  display: flex;
  flex-direction: column;
}
.subject-name {
  font-size: var(--font-xl);
  font-weight: bold;
  color: var(--text-primary);
}
.subject-desc {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: 4rpx;
}
.section-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.section-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.section-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}
.section-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}
.section-count {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
</style>
