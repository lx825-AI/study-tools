/**
 * stats-aggregate.js 测试 —— 统计页纯聚合函数（对齐小程序口径）
 */
import { describe, it, expect } from 'vitest';

const App = window.FlashcardApp;

/** 与实现同款的 UTC key 生成（保留时刻的 Date → toISOString；12:00 UTC 保证 UTC+8 下同日） */
function utcKey(y, m, d) {
  return new Date(Date.UTC(y, m, d, 12)).toISOString().slice(0, 10);
}

/* 固定"现在"：2026-08-21（周五）UTC 中午，本地同日 20:00，getDay/toISOString 一致 */
const NOW = new Date(Date.UTC(2026, 7, 21, 12));

describe('mergeLogs', () => {
  it('合并两日志，同日深度覆盖快速', () => {
    const merged = App.mergeLogs(
      { '2026-08-01': { cardsStudied: 5 }, '2026-08-02': { cardsStudied: 3 } },
      { '2026-08-02': { cardsStudied: 10 }, '2026-08-03': { cardsStudied: 7 } }
    );
    expect(merged['2026-08-01'].cardsStudied).toBe(5);
    expect(merged['2026-08-02'].cardsStudied).toBe(10); /* deep 覆盖 */
    expect(merged['2026-08-03'].cardsStudied).toBe(7);
  });

  it('仅 quick 时全部合入', () => {
    const merged = App.mergeLogs({ '2026-08-01': { cardsStudied: 5 } }, {});
    expect(merged['2026-08-01'].cardsStudied).toBe(5);
  });

  it('空对象输入返回空对象', () => {
    expect(Object.keys(App.mergeLogs({}, {})).length).toBe(0);
  });
});

describe('buildWeekSeries', () => {
  it('周一为首日 7 天窗口，指标正确', () => {
    const log = {};
    log[utcKey(2026, 7, 17)] = { cardsStudied: 50, correct: 40, wrong: 10 }; /* 周一 */
    log[utcKey(2026, 7, 18)] = { cardsStudied: 30, correct: 24, wrong: 6 };  /* 周二 */
    const s = App.buildWeekSeries(log, NOW);
    expect(s.weekWords).toBe(80);
    expect(s.weekDays).toBe(2);
    expect(s.weekAccuracy).toBe(80);
    expect(s.bars.length).toBe(7);
    expect(s.bars.map(b => b.label)).toEqual(['一', '二', '三', '四', '五', '六', '日']);
  });

  it('柱高 clamp：1000→60、1→4、0→0', () => {
    const log = {};
    log[utcKey(2026, 7, 17)] = { cardsStudied: 1000 };
    log[utcKey(2026, 7, 18)] = { cardsStudied: 1 };
    const s = App.buildWeekSeries(log, NOW);
    expect(s.bars[0].heightPx).toBe(60);
    expect(s.bars[1].heightPx).toBe(4);
    expect(s.bars[2].heightPx).toBe(0);
  });

  it('趋势 ↑：本周多于上周', () => {
    const log = {};
    log[utcKey(2026, 7, 17)] = { cardsStudied: 80 };
    log[utcKey(2026, 7, 10)] = { cardsStudied: 50 }; /* 上周 */
    const s = App.buildWeekSeries(log, NOW);
    expect(s.weekTrend).toBe('↑ 60%');
    expect(s.trendDown).toBe(false);
    expect(s.weekSubText).toBe('上周 50 词');
  });

  it('趋势 ↓ 与「新增」', () => {
    const down = App.buildWeekSeries({ [utcKey(2026, 7, 17)]: { cardsStudied: 40 }, [utcKey(2026, 7, 10)]: { cardsStudied: 100 } }, NOW);
    expect(down.weekTrend).toBe('↓ 60%');
    expect(down.trendDown).toBe(true);

    const fresh = App.buildWeekSeries({ [utcKey(2026, 7, 17)]: { cardsStudied: 10 } }, NOW);
    expect(fresh.weekTrend).toBe('新增');
    expect(fresh.weekSubText).toBe('首次学习');
  });

  it('正确率副文案三档边界 80/60', () => {
    const good = App.buildWeekSeries({ [utcKey(2026, 7, 17)]: { cardsStudied: 10, correct: 8, wrong: 2 } }, NOW);
    expect(good.weekAccuracyText).toBe('正确率优秀');
    const mid = App.buildWeekSeries({ [utcKey(2026, 7, 17)]: { cardsStudied: 10, correct: 6, wrong: 4 } }, NOW);
    expect(mid.weekAccuracyText).toBe('继续努力');
    const bad = App.buildWeekSeries({ [utcKey(2026, 7, 17)]: { cardsStudied: 10, correct: 5, wrong: 5 } }, NOW);
    expect(bad.weekAccuracyText).toBe('需要加强');
  });

  it('学习天数副文案 5 天边界', () => {
    const log = {};
    for (let i = 0; i < 5; i++) log[utcKey(2026, 7, 17 + i)] = { cardsStudied: 1, correct: 1, wrong: 0 };
    expect(App.buildWeekSeries(log, NOW).weekDayText).toBe('坚持得很好');
    delete log[utcKey(2026, 7, 21)];
    expect(App.buildWeekSeries(log, NOW).weekDayText).toBe('加油多来几天');
  });
});

describe('buildCalendarData', () => {
  it('2026-06 首日恰为周一，无前置占位', () => {
    const cal = App.buildCalendarData(2026, 5, {}, '2026-08-21'); /* month 0-based：5=6 月 */
    expect(cal.title).toBe('2026年 6月');
    expect(cal.cells[0]).toEqual({ day: '1', isToday: false, studied: false });
    expect(cal.cells.length).toBe(30);
  });

  it('2026-08 首日为周六，5 个占位 + 打卡/今日标记', () => {
    const studiedMap = { '2026-08-15': true };
    const cal = App.buildCalendarData(2026, 7, studiedMap, '2026-08-15');
    expect(cal.title).toBe('2026年 8月');
    expect(cal.cells.slice(0, 5).every(c => c.empty)).toBe(true);
    expect(cal.cells.length).toBe(36); /* 5 占位 + 31 天 */
    const day15 = cal.cells[5 + 14];
    expect(day15.day).toBe('15');
    expect(day15.isToday).toBe(true);
    expect(day15.studied).toBe(true);
  });

  it('翻月边界：1 月上一月为去年 12 月', () => {
    expect(App.buildCalendarData(2026, 0, {}, '').title).toBe('2026年 1月');
    expect(App.buildCalendarData(2025, 11, {}, '').title).toBe('2025年 12月');
  });
});

describe('heatLevel / buildHeatmapWeeks', () => {
  it('5 档阈值 0/5/10/20/21', () => {
    expect(App.heatLevel(0)).toBe(0);
    expect(App.heatLevel(5)).toBe(1);
    expect(App.heatLevel(10)).toBe(2);
    expect(App.heatLevel(20)).toBe(3);
    expect(App.heatLevel(21)).toBe(4);
  });

  it('12~13 列、每列 7 格、首列对齐周一', () => {
    const weeks = App.buildHeatmapWeeks({}, NOW);
    expect(weeks.length).toBeGreaterThanOrEqual(12);
    expect(weeks.length).toBeLessThanOrEqual(13);
    weeks.forEach(col => expect(col.length).toBe(7));
    const firstDate = weeks[0][0].date;
    expect(new Date(firstDate + 'T00:00:00Z').getUTCDay()).toBe(1);
  });

  it('末列包含今天，count/level 映射正确', () => {
    const todayKey = NOW.toISOString().slice(0, 10);
    const log = { [todayKey]: { cardsStudied: 12 } };
    const weeks = App.buildHeatmapWeeks(log, NOW);
    const last = weeks[weeks.length - 1];
    expect(last.some(c => c.date === todayKey)).toBe(true);
    const today = last.find(c => c.date === todayKey);
    expect(today.count).toBe(12);
    expect(today.level).toBe(3);
  });

  it('未来日期格 isFuture=true 且 count=0', () => {
    const todayKey = NOW.toISOString().slice(0, 10);
    const weeks = App.buildHeatmapWeeks({}, NOW);
    const last = weeks[weeks.length - 1];
    const future = last.filter(c => c.date > todayKey);
    expect(future.length).toBeGreaterThan(0);
    future.forEach(c => {
      expect(c.isFuture).toBe(true);
      expect(c.count).toBe(0);
    });
    expect(last.find(c => c.date === todayKey).isFuture).toBe(false);
  });
});

describe('estimateUserCurve', () => {
  it('不足 3 天返回固定回退数组', () => {
    expect(App.estimateUserCurve([{}, {}])).toEqual([0.72, 0.62, 0.52, 0.42, 0.32, 0.25]);
  });

  it('baseRate 超 0.9 夹紧为 0.9', () => {
    const curve = App.estimateUserCurve([{ correct: 10, cardsStudied: 10 }, { correct: 10, cardsStudied: 10 }, { correct: 10, cardsStudied: 10 }]);
    expect(curve[0]).toBe(0.9);
    expect(curve[5]).toBe(0.5); /* max(0.15, 0.9-0.4) */
  });

  it('baseRate 低于 0.6 抬升为 0.6', () => {
    const curve = App.estimateUserCurve([{ correct: 1, cardsStudied: 10 }, { correct: 0, cardsStudied: 5 }, { correct: 1, cardsStudied: 5 }]);
    expect(curve[0]).toBe(0.6);
  });

  it('递减且不低于各档下限', () => {
    const curve = App.estimateUserCurve([{ correct: 7, cardsStudied: 10 }, { correct: 7, cardsStudied: 10 }, { correct: 7, cardsStudied: 10 }]);
    expect(curve[0]).toBeCloseTo(0.7, 5);
    expect(curve[1]).toBeCloseTo(0.62, 5);
    expect(curve[5]).toBeCloseTo(0.3, 5);
    for (let i = 1; i < curve.length; i++) expect(curve[i]).toBeLessThan(curve[i - 1]);
  });
});

describe('curveNoteText', () => {
  it('0 条与不足 3 条文案', () => {
    expect(App.curveNoteText([])).toContain('完成 3 天学习后');
    expect(App.curveNoteText([{}, {}])).toContain('再学习 1 天后');
  });

  it('≥3 条按正确率三档', () => {
    const good = [{ correct: 9, cardsStudied: 10 }, { correct: 9, cardsStudied: 10 }, { correct: 9, cardsStudied: 10 }];
    expect(App.curveNoteText(good)).toContain('坚持复习有效果');
    const mid = [{ correct: 7, cardsStudied: 10 }, { correct: 7, cardsStudied: 10 }, { correct: 7, cardsStudied: 10 }];
    expect(App.curveNoteText(mid)).toContain('保持复习节奏');
    const bad = [{ correct: 3, cardsStudied: 10 }, { correct: 3, cardsStudied: 10 }, { correct: 3, cardsStudied: 10 }];
    expect(App.curveNoteText(bad)).toContain('多复习错词');
  });
});

describe('stageDistribution', () => {
  it('计数 + stage 夹紧 0-7 + 按最大归一化', () => {
    const cards = [
      { ebbinghausStage: 0 }, { ebbinghausStage: 0 },
      { ebbinghausStage: 1 },
      { ebbinghausStage: 7 }, { ebbinghausStage: 10 }, /* 10 夹紧为 7 */
    ];
    const dist = App.stageDistribution(cards);
    expect(dist[0].count).toBe(2);
    expect(dist[1].count).toBe(1);
    expect(dist[7].count).toBe(2);
    expect(dist[0].percent).toBe(100); /* max=2 */
    expect(dist[1].percent).toBe(50);
  });

  it('8 档 label/color 齐全', () => {
    const dist = App.stageDistribution([]);
    expect(dist.length).toBe(8);
    dist.forEach((d, i) => {
      expect(d.label).toBe(App.STAGE_LABELS[i]);
      expect(d.color).toBe(App.STAGE_COLORS[i]);
    });
  });

  it('空卡组全部为 0', () => {
    App.stageDistribution([]).forEach(d => {
      expect(d.count).toBe(0);
      expect(d.percent).toBe(0);
    });
  });
});
