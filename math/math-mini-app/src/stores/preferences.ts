import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ThemeMode } from '@/data/types'

export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref<ThemeMode>(
    (uni.getStorageSync('prefs:theme') as ThemeMode) || 'auto'
  )
  const fontSize = ref<'small' | 'medium' | 'large'>(
    uni.getStorageSync('prefs:fontSize') || 'medium'
  )

  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    // auto: follow system
    const sysInfo = uni.getSystemInfoSync()
    return sysInfo.theme === 'dark'
  })

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    uni.setStorageSync('prefs:theme', mode)
  }

  function setFontSize(size: 'small' | 'medium' | 'large') {
    fontSize.value = size
    uni.setStorageSync('prefs:fontSize', size)
  }

  return { theme, fontSize, isDark, setTheme, setFontSize }
})
