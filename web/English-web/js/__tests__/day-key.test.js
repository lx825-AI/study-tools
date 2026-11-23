/**
 * day-key.js 测试 —— 本地日历日工具
 *
 * 这些用例同时守护时区：默认运行在 Asia/Shanghai（UTC+8，见 vitest.config.js），
 * 本地 00:00-08:00 与 UTC 日期不同日，正是 v1.1.0 修掉的偏差窗口。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const App = window.FlashcardApp;

afterEach(() => {
  vi.useRealTimers();
});

describe('时区前提', () => {
  it('测试固定跑在 UTC+8（getTimezoneOffset = -480）', () => {
    expect(new Date().getTimezoneOffset()).toBe(-480);
  });
});

describe('dayKey', () => {
  it('格式化本地日期并补零', () => {
    expect(App.dayKey(new Date(2026, 0, 5, 13, 0))).toBe('2026-01-05');
    expect(App.dayKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('缺省参数取当前时间', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 21, 9, 30));
    expect(App.dayKey()).toBe('2026-08-21');
  });

  it('UTC 与本地跨日：凌晨 00:30 仍算当天（旧实现会落到前一天）', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 21, 0, 30));
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-08-20'); /* 旧口径的错值 */
    expect(App.dayKey()).toBe('2026-08-21');
  });

  it('非法日期返回空串', () => {
    expect(App.dayKey('not-a-date')).toBe('');
    expect(App.dayKey(new Date('x'))).toBe('');
  });
});

describe('isDayKey', () => {
  it('合法 key 通过', () => {
    expect(App.isDayKey('2026-08-21')).toBe(true);
    expect(App.isDayKey('2024-02-29')).toBe(true);
  });

  it('格式错误或溢出日期被拒', () => {
    expect(App.isDayKey('2026-8-1')).toBe(false);
    expect(App.isDayKey('2026-02-30')).toBe(false);
    expect(App.isDayKey('2025-02-29')).toBe(false);
    expect(App.isDayKey('')).toBe(false);
    expect(App.isDayKey(null)).toBe(false);
    expect(App.isDayKey(20260821)).toBe(false);
  });
});

describe('parseDayKey', () => {
  it('解析成本地当天 0 点', () => {
    const d = App.parseDayKey('2026-08-21');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(0);
  });

  it('非法 key 返回 null', () => {
    expect(App.parseDayKey('2026-13-01')).toBe(null);
    expect(App.parseDayKey('bad')).toBe(null);
  });
});

describe('addDays', () => {
  it('跨月/跨年/闰日', () => {
    expect(App.addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(App.addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(App.addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(App.addDays('2025-02-28', 1)).toBe('2025-03-01');
    expect(App.addDays('2026-08-21', 0)).toBe('2026-08-21');
  });

  it('非法入参返回空串', () => {
    expect(App.addDays('bad', 1)).toBe('');
    expect(App.addDays('2026-08-21', NaN)).toBe('');
    expect(App.addDays('2026-08-21', '3')).toBe('');
  });
});

describe('daysBetween', () => {
  it('同月/跨月/负向差值', () => {
    expect(App.daysBetween('2026-08-01', '2026-08-21')).toBe(20);
    expect(App.daysBetween('2026-08-21', '2026-08-21')).toBe(0);
    expect(App.daysBetween('2026-03-01', '2026-02-28')).toBe(-1);
    expect(App.daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('非法 key 返回 NaN', () => {
    expect(Number.isNaN(App.daysBetween('bad', '2026-08-21'))).toBe(true);
  });
});

describe('weekStartKey', () => {
  it('周一为首日：2026-08-21（周五）→ 08-17', () => {
    expect(App.weekStartKey(new Date(2026, 7, 21, 13))).toBe('2026-08-17');
  });

  it('周日归到上一个周一', () => {
    expect(App.weekStartKey(new Date(2026, 7, 23, 13))).toBe('2026-08-17');
  });

  it('周一当天返回自身；跨月正确', () => {
    expect(App.weekStartKey(new Date(2026, 7, 17, 0, 5))).toBe('2026-08-17');
    expect(App.weekStartKey(new Date(2026, 8, 1, 13))).toBe('2026-08-31');
  });

  it('凌晨 00:30 仍按本地日期归周（旧 UTC 口径会算到上周）', () => {
    expect(App.weekStartKey(new Date(2026, 7, 17, 0, 30))).toBe('2026-08-17');
  });
});

describe('todayKey', () => {
  it('等价于 dayKey()', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 21, 7, 59));
    expect(App.todayKey()).toBe(App.dayKey());
    expect(App.todayKey()).toBe('2026-08-21');
  });
});
