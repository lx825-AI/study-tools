<template>
  <canvas
    v-if="!failed"
    type="2d"
    :id="canvasId"
    class="formula-canvas"
    :style="{ width: size.width + 'px', height: size.height + 'px' }"
    @click="emit('copy', latex)"
    @longpress="emit('export')"
  />
  <!-- 渲染失败降级：直接显示 LaTeX 源码（方案 5.7 纯文本兜底） -->
  <text v-else class="latex-fallback" @click="emit('copy', latex)">{{ latex }}</text>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'
import { formulaRenderer } from '@/utils/formula/renderer'
import type { CanvasLike } from '@/utils/formula/renderer'
import { usePreferencesStore } from '@/stores/preferences'

const props = withDefaults(
  defineProps<{
    latex: string
    fontSize?: number
    color?: string
    /** 渲染延迟（ms）：列表中错开 Canvas 挂载避免首屏卡顿 */
    delay?: number
  }>(),
  { fontSize: 18, color: '', delay: 0 }
)

const emit = defineEmits<{
  copy: [latex: string]
  export: []
}>()

const prefs = usePreferencesStore()
const failed = ref(false)
const size = ref({ width: 0, height: 0 })
const canvasId = `fc-${Math.random().toString(36).slice(2, 10)}`
const instance = getCurrentInstance()

// 缓存画布句柄供图片导出
let mpCanvasNode: CanvasLike | null = null
let h5CanvasEl: HTMLCanvasElement | null = null

const inkColor = computed(() => props.color || (prefs.isDark ? '#dfe6e9' : '#2d3436'))

function getDpr(): number {
  try {
    return uni.getWindowInfo?.().pixelRatio ?? uni.getSystemInfoSync().pixelRatio ?? 1
  } catch {
    return 1
  }
}

function paint(canvas: CanvasLike) {
  try {
    mpCanvasNode = canvas
    size.value = formulaRenderer.render(props.latex, canvas, {
      fontSize: props.fontSize,
      color: inkColor.value,
      dpr: getDpr(),
    })
    failed.value = false
  } catch (e) {
    console.warn('[math-miniapp] 公式渲染失败，降级为文本:', props.latex, e)
    failed.value = true
  }
}

function render() {
  // #ifdef MP-WEIXIN
  uni
    .createSelectorQuery()
    .in(instance?.proxy)
    .select(`#${canvasId}`)
    .fields({ node: true }, () => {}) // 类型声明要求回调参数，结果统一走 exec
    .exec((res) => {
      const node = res?.[0]?.node as CanvasLike | undefined
      if (node) paint(node)
      else failed.value = true
    })
  // #endif
  // #ifdef H5
  renderH5(0)
  // #endif
}

// #ifdef H5
/** H5 端 uni-canvas 内部 <canvas> 异步创建，重试等待挂载 */
function renderH5(attempt: number) {
  const root = document.getElementById(canvasId)
  const el =
    root?.tagName === 'CANVAS'
      ? (root as HTMLCanvasElement)
      : (root?.querySelector('canvas') as HTMLCanvasElement | null)
  if (el) {
    h5CanvasEl = el
    paint(el as unknown as CanvasLike)
    return
  }
  if (attempt < 20) setTimeout(() => renderH5(attempt + 1), 50)
  else failed.value = true
}
// #endif

/** 导出为图片：MP 保存到相册，H5 触发下载 */
async function toImage(): Promise<void> {
  // #ifdef MP-WEIXIN
  if (!mpCanvasNode) {
    uni.showToast({ title: '画布尚未就绪', icon: 'none' })
    return
  }
  // 请求相册写入权限
  try {
    await uni.authorize({ scope: 'writePhotosAlbum' })
  } catch {
    // 权限被拒绝 → 引导设置
    try {
      await uni.openSetting()
    } catch { /* 仍然拒绝 */ }
    return
  }
  try {
    const res = await new Promise<{ tempFilePath: string }>((resolve, reject) => {
      ;(uni.canvasToTempFilePath as any)({
        canvas: mpCanvasNode,
        success: resolve,
        fail: reject,
      })
    })
    await uni.saveImageToPhotosAlbum({ filePath: res.tempFilePath })
    uni.showToast({ title: '已保存到相册', icon: 'success' })
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
  // #endif
  // #ifdef H5
  if (!h5CanvasEl) {
    uni.showToast({ title: '画布尚未就绪', icon: 'none' })
    return
  }
  h5CanvasEl.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formula.png'
    a.click()
    URL.revokeObjectURL(url)
    uni.showToast({ title: '图片已下载', icon: 'success' })
  })
  // #endif
}

onMounted(() => {
  if (props.delay && props.delay > 0) setTimeout(render, props.delay)
  else render()
})
watch(() => [props.latex, props.fontSize, inkColor.value], render)

defineExpose({ toImage })
</script>

<style scoped>
.formula-canvas {
  display: block;
}
.latex-fallback {
  font-family: 'Courier New', monospace;
  font-size: 24rpx;
  color: var(--text-secondary);
  word-break: break-all;
}
</style>
