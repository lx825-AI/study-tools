/// <reference types="@dcloudio/types" />

/** 微信小程序全局对象（仅 MP-WEIXIN 环境运行时存在） */
declare const wx: {
  cloud: {
    init: (opts: { env?: string; traceUser?: boolean }) => void
    callFunction: (opts: { name: string; data?: Record<string, unknown> }) => Promise<{
      result: unknown
    }>
  }
}

/**
 * uni-app 生命周期钩子的类型补充：
 * @dcloudio/types 未导出这些成员，但运行时由 @dcloudio/uni-app 提供
 */
declare module '@dcloudio/uni-app' {
  export function onLaunch(hook: () => void): void
  export function onShow(hook: () => void): void
  export function onHide(hook: () => void): void
  export function onLoad(hook: (query?: Record<string, string>) => void): void
  export function onReachBottom(hook: () => void): void
}
