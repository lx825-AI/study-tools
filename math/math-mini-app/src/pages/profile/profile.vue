<template>
  <view class="page" :class="{ dark: isDark }">
    <!-- 用户卡 -->
    <view class="user-card">
      <text class="avatar">👤</text>
      <text class="nickname">{{ userStore.isLogin ? '微信用户' : '数学爱好者' }}</text>
      <text class="hint">{{ userStore.isLogin ? '已开启云端同步' : '本地模式 · 小程序内登录后可同步数据' }}</text>
    </view>

    <!-- 统计面板 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-number">{{ favCount }}</text>
        <text class="stat-label">收藏</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ totalPercent }}%</text>
        <text class="stat-label">总进度</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ streak }}</text>
        <text class="stat-label">连续打卡</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ mistakeCount }}</text>
        <text class="stat-label">错题</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @click="goTo('/sub-browse/recent/index')">
        <text>🕐 最近浏览</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goTo('/sub-practice/result/index')">
        <text>📊 成绩与错题本</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="showSettings = !showSettings">
        <text>⚙️ 设置</text>
        <text class="arrow">{{ showSettings ? '⌄' : '›' }}</text>
      </view>
      <view v-if="showSettings" class="settings-panel">
        <view class="setting-row">
          <text class="setting-label">主题</text>
          <view class="setting-opts">
            <text
              v-for="t in themeOpts"
              :key="t.value"
              class="opt"
              :class="{ active: prefs.theme === t.value }"
              @click="prefs.setTheme(t.value)"
            >{{ t.label }}</text>
          </view>
        </view>
        <view class="setting-row">
          <text class="setting-label">公式字号</text>
          <view class="setting-opts">
            <text
              v-for="f in fontOpts"
              :key="f.value"
              class="opt"
              :class="{ active: prefs.fontSize === f.value }"
              @click="prefs.setFontSize(f.value)"
            >{{ f.label }}</text>
          </view>
        </view>
        <view class="setting-row">
          <text class="setting-label">学习进度</text>
          <text class="danger-btn" @click="resetProgress">重置</text>
        </view>
      </view>
      <view class="menu-item" @click="showFeedback = !showFeedback">
        <text>💬 反馈建议</text>
        <text class="arrow">{{ showFeedback ? '⌄' : '›' }}</text>
      </view>
      <view v-if="showFeedback" class="feedback-panel">
        <textarea
          v-model="feedbackText"
          class="feedback-input"
          placeholder="公式纠错、功能建议…（最多 500 字）"
          :maxlength="500"
        />
        <view class="feedback-submit" @click="submitFeedback">提交</view>
      </view>
      <view class="menu-item" @click="showAbout">
        <text>ℹ️ 关于</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <text class="version">数学公式速查 v1.0.0</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormulaStore } from '@/stores/formulas'
import { usePreferencesStore } from '@/stores/preferences'
import { useUserStore } from '@/stores/user'
import { useFavorites } from '@/composables/useFavorites'
import { useProgress } from '@/composables/useProgress'
import { useDailyChallenge } from '@/composables/useDailyChallenge'
import { useTheme } from '@/composables/useTheme'
import { loadMistakes } from '@/composables/usePractice'
import { callCloud } from '@/services/cloud'
import type { ThemeMode } from '@/data/types'

const store = useFormulaStore()
const prefs = usePreferencesStore()
const userStore = useUserStore()
const { count: favCount } = useFavorites()
const { progress, reset } = useProgress()
const { streak } = useDailyChallenge()
const { isDark } = useTheme()

const showSettings = ref(false)
const showFeedback = ref(false)
const feedbackText = ref('')

const themeOpts: { value: ThemeMode; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '暗色' },
]
const fontOpts = [
  { value: 'small' as const, label: '小' },
  { value: 'medium' as const, label: '标准' },
  { value: 'large' as const, label: '大' },
]

const totalPercent = computed(() => {
  const total = Object.values(store.data).reduce((sum, sec) => sum + sec.formulas.length, 0)
  const viewed = Object.values(progress.value).reduce((sum, arr) => sum + arr.length, 0)
  return total > 0 ? Math.round((viewed / total) * 100) : 0
})

const mistakeCount = computed(() => loadMistakes().length)

function goTo(url: string) {
  uni.navigateTo({ url })
}

function resetProgress() {
  uni.showModal({
    title: '重置学习进度？',
    content: '将清空所有章节的已浏览记录',
    success: (res) => {
      if (res.confirm) {
        reset()
        uni.showToast({ title: '已重置', icon: 'none' })
      }
    },
  })
}

async function submitFeedback() {
  const content = feedbackText.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' })
    return
  }
  try {
    await callCloud('feedback', { type: 'suggestion', content })
    uni.showToast({ title: '感谢反馈！', icon: 'none' })
  } catch {
    uni.showToast({ title: '当前环境暂不支持提交', icon: 'none' })
  }
  feedbackText.value = ''
  showFeedback.value = false
}

function showAbout() {
  uni.showModal({
    title: '数学公式速查',
    content: '大学数学公式速查工具\n5 大学科 · 34 章节 · 177 条公式\n\n数据本地存储，支持云端同步',
    showCancel: false,
  })
}
</script>

<style scoped>
.page {
  padding: var(--spacing-md);
  min-height: 100vh;
  background: var(--bg-secondary);
}
.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
}
.avatar {
  font-size: 72rpx;
}
.nickname {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-top: var(--spacing-xs);
}
.hint {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}
.stats-row {
  display: flex;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-number {
  font-size: var(--font-xl);
  font-weight: bold;
  color: var(--brand-color);
}
.stat-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: 4rpx;
}
.menu-section {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1rpx solid var(--border-color);
  font-size: var(--font-base);
  color: var(--text-primary);
}
.menu-item:last-child {
  border-bottom: none;
}
.arrow {
  font-size: 32rpx;
  color: var(--text-secondary);
}
.settings-panel,
.feedback-panel {
  padding: var(--spacing-md);
  border-bottom: 1rpx solid var(--border-color);
  background: var(--bg-secondary);
}
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
}
.setting-label {
  font-size: var(--font-base);
  color: var(--text-primary);
}
.setting-opts {
  display: flex;
  gap: var(--spacing-sm);
}
.opt {
  font-size: var(--font-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1rpx solid var(--border-color);
  border-radius: 24rpx;
  padding: 8rpx 24rpx;
}
.opt.active {
  color: #fff;
  background: var(--brand-color);
  border-color: var(--brand-color);
}
.danger-btn {
  font-size: var(--font-sm);
  color: #e17055;
}
.feedback-input {
  width: 100%;
  min-height: 160rpx;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  font-size: var(--font-base);
  color: var(--text-primary);
  box-sizing: border-box;
}
.feedback-submit {
  margin-top: var(--spacing-sm);
  text-align: center;
  padding: 16rpx 0;
  background: var(--brand-color);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: var(--font-base);
}
.version {
  display: block;
  text-align: center;
  font-size: 20rpx;
  color: var(--text-secondary);
  margin-top: var(--spacing-xl);
  opacity: 0.6;
}
</style>
