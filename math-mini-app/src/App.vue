<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { syncer } from '@/services/sync'

onLaunch(() => {
  // 静默登录（仅微信小程序环境生效，其余环境纯本地运行）
  const userStore = useUserStore()
  void userStore.login().finally(() => {
    // 登录后尝试 flush 离线队列
    void syncer.flush()
  })
})
</script>

<style lang="scss">
/* 全局样式 */
@import './uni.scss';
</style>
