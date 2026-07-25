/**
 * 云函数调用封装：仅微信小程序环境真实调用，其余环境抛错由调用方降级为纯本地。
 */

export async function callCloud<T = unknown>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud) {
    const res = await wx.cloud.callFunction({ name, data })
    return res.result as T
  }
  // #endif
  throw new Error(`[cloud] 当前环境不支持云函数调用: ${name}`)
}
