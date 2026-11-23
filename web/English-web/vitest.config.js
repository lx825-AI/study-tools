import { defineConfig } from 'vitest/config';

/* 固定运行时时区：日志/到期/打卡全部按本地日历日计算，
 * 测试必须在确定时区下跑（Asia/Shanghai = UTC+8），否则 CI（UTC）与本地结论不一致 */
process.env.TZ = 'Asia/Shanghai';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['js/__tests__/**/*.test.js'],
    setupFiles: ['js/__tests__/setup.js'],
  },
});
