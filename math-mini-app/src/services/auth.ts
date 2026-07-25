/**
 * 微信登录封装：初始化云环境 + 静默登录获取 openid。
 * 仅 MP-WEIXIN 环境生效，其余环境静默跳过（纯本地运行）。
 */
import { callCloud } from './cloud'

export interface LoginResult {
  openid: string
  isNew: boolean
}

let cloudReady = false

export function initCloud(): void {
  if (cloudReady) return
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud) {
    wx.cloud.init({ traceUser: true })
    cloudReady = true
  }
  // #endif
}

export async function silentLogin(): Promise<LoginResult | null> {
  initCloud()
  try {
    return await callCloud<LoginResult>('login')
  } catch {
    return null // 非微信环境或未开通云开发：纯本地运行
  }
}
