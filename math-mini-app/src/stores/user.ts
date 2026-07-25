import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { silentLogin } from '@/services/auth'

interface User {
  openid: string
  isNew: boolean
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLogin = computed(() => !!user.value)

  async function login() {
    const res = await silentLogin()
    if (res) user.value = res
  }

  return { user, isLogin, login }
})
