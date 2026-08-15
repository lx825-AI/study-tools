/**
 * 主题切换：状态存 preferences store（CSS 变量方案）。
 * 小程序无法动态修改 page 节点类，各页面根 view 绑定 :class="{ dark: isDark }"。
 */
import { computed } from 'vue'
import { usePreferencesStore } from '@/stores/preferences'
import type { ThemeMode } from '@/data/types'

export function useTheme() {
  const prefs = usePreferencesStore()

  const cycleTheme = () => {
    const order: ThemeMode[] = ['auto', 'light', 'dark']
    const next = order[(order.indexOf(prefs.theme) + 1) % order.length]
    prefs.setTheme(next)
  }

  return {
    theme: computed(() => prefs.theme),
    isDark: computed(() => prefs.isDark),
    setTheme: prefs.setTheme,
    cycleTheme,
  }
}
