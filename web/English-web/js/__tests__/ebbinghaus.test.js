/**
 * ebbinghaus.js 测试 —— 艾宾浩斯遗忘曲线复习调度
 */
import { describe, it, expect, beforeEach } from 'vitest';

const App = window.FlashcardApp;

function freshCard(overrides) {
  return Object.assign({
    id: 'eb-test',
    front: 'test',
    back: '测试',
    ebbinghausStage: 0,
    ebbinghausNextReview: '',
    ebbinghausHistory: [],
    easeFactor: 2.5,
    repetitions: 0,
    interval: 0,
    nextReview: ''
  }, overrides || {});
}

describe('initEbbinghaus', () => {
  it('应为缺失 ebbinghausStage 的卡片初始化为 0', () => {
    var c = { id: '1' };
    App.initEbbinghaus(c);
    expect(c.ebbinghausStage).toBe(0);
    expect(c.ebbinghausNextReview).toBe('');
    expect(Array.isArray(c.ebbinghausHistory)).toBe(true);
  });

  it('已有字段的卡片应保持原值', () => {
    var c = { id: '1', ebbinghausStage: 3, ebbinghausNextReview: '2026-06-15', ebbinghausHistory: [{ stage: 2, date: '2026-06-01', passed: true }] };
    App.initEbbinghaus(c);
    expect(c.ebbinghausStage).toBe(3);
    expect(c.ebbinghausNextReview).toBe('2026-06-15');
  });
});

describe('isNewWord', () => {
  it('stage 0 为新词', () => {
    expect(App.isNewWord(freshCard({ ebbinghausStage: 0 }))).toBe(true);
  });

  it('未初始化 stage 为新词', () => {
    expect(App.isNewWord({ id: '1' })).toBe(true);
  });

  it('stage > 0 不是新词', () => {
    expect(App.isNewWord(freshCard({ ebbinghausStage: 1 }))).toBe(false);
    expect(App.isNewWord(freshCard({ ebbinghausStage: 7 }))).toBe(false);
  });
});

describe('isDueToday', () => {
  it('ebbinghausNextReview 为空时返回 false', () => {
    expect(App.isDueToday(freshCard())).toBe(false);
  });

  it('今天或更早到期返回 true', () => {
    var today = new Date().toISOString().slice(0, 10);
    expect(App.isDueToday(freshCard({ ebbinghausNextReview: today }))).toBe(true);
  });

  it('未来到期返回 false', () => {
    var future = new Date();
    future.setDate(future.getDate() + 30);
    expect(App.isDueToday(freshCard({ ebbinghausNextReview: future.toISOString().slice(0, 10) }))).toBe(false);
  });

  it('过去日期返回 true（逾期）', () => {
    expect(App.isDueToday(freshCard({ ebbinghausNextReview: '2020-01-01' }))).toBe(true);
  });
});

describe('isOverdue', () => {
  it('ebbinghausNextReview 为空时返回 false', () => {
    expect(App.isOverdue(freshCard())).toBe(false);
  });

  it('今天到期不算逾期', () => {
    var today = new Date().toISOString().slice(0, 10);
    expect(App.isOverdue(freshCard({ ebbinghausNextReview: today }))).toBe(false);
  });

  it('过去日期算逾期', () => {
    expect(App.isOverdue(freshCard({ ebbinghausNextReview: '2020-01-01' }))).toBe(true);
  });
});

describe('getOverdueDays', () => {
  it('ebbinghausNextReview 为空时返回 0', () => {
    expect(App.getOverdueDays(freshCard())).toBe(0);
  });

  it('今天到期逾期天数为 0', () => {
    var today = new Date().toISOString().slice(0, 10);
    expect(App.getOverdueDays(freshCard({ ebbinghausNextReview: today }))).toBe(0);
  });

  it('过去日期返回正数', () => {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var days = App.getOverdueDays(freshCard({ ebbinghausNextReview: yesterday.toISOString().slice(0, 10) }));
    expect(days).toBeGreaterThanOrEqual(1);
  });

  it('无效日期字符串不崩溃', () => {
    expect(App.getOverdueDays(freshCard({ ebbinghausNextReview: 'not-a-date' }))).toBe(0);
  });
});

describe('applyEbbinghaus - 通过', () => {
  it('stage 0 → 1，nextReview 为明天', () => {
    var c = freshCard();
    var result = App.applyEbbinghaus(c, true);
    expect(c.ebbinghausStage).toBe(1);
    expect(result.stage).toBe(1);
    expect(result.isMastered).toBe(false);

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(c.ebbinghausNextReview).toBe(tomorrow.toISOString().slice(0, 10));
  });

  it('添加历史记录', () => {
    var c = freshCard();
    App.applyEbbinghaus(c, true);
    expect(c.ebbinghausHistory.length).toBe(1);
    expect(c.ebbinghausHistory[0].passed).toBe(true);
    expect(c.ebbinghausHistory[0].stage).toBe(1);
  });

  it('stage 6 → 7（已掌握，未逾期）', () => {
    var today = new Date().toISOString().slice(0, 10);
    var c = freshCard({ ebbinghausStage: 6, ebbinghausNextReview: today });
    var result = App.applyEbbinghaus(c, true);
    expect(c.ebbinghausStage).toBe(7);
    expect(result.isMastered).toBe(true);
  });

  it('stage 7 保持在 7', () => {
    var c = freshCard({ ebbinghausStage: 7 });
    var result = App.applyEbbinghaus(c, true);
    expect(c.ebbinghausStage).toBe(7);
    expect(result.isMastered).toBe(true);
  });
});

describe('applyEbbinghaus - 失败（智能回退，对齐小程序）', () => {
  it('失败记录 passed 为 false，history 记 prevStage', () => {
    var c = freshCard({ ebbinghausStage: 3 });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausHistory.length).toBe(1);
    expect(c.ebbinghausHistory[0].passed).toBe(false);
    expect(c.ebbinghausHistory[0].stage).toBe(3);
  });

  it('答错降低 EF 0.2（下限 1.3）并重置 repetitions', () => {
    var c = freshCard({ ebbinghausStage: 3, easeFactor: 2.5, repetitions: 5 });
    App.applyEbbinghaus(c, false);
    expect(c.easeFactor).toBeCloseTo(2.3, 5);
    expect(c.repetitions).toBe(0);
    expect(c._consecutiveFails).toBe(1);
    var low = freshCard({ ebbinghausStage: 3, easeFactor: 1.3 });
    App.applyEbbinghaus(low, false);
    expect(low.easeFactor).toBe(1.3);
  });

  it('阶段 ≤2 失败：直接回到 stage 1', () => {
    var c = freshCard({ ebbinghausStage: 2 });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(1);
  });

  it('首次失败（stage>2）：温和回退 1 级', () => {
    var c = freshCard({ ebbinghausStage: 5 });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(4);
  });

  it('连续失败 ≥2：回到 stage 1', () => {
    var c = freshCard({ ebbinghausStage: 5, _consecutiveFails: 1 });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(1);
  });
});

describe('applyEbbinghaus - 逾期惩罚', () => {
  function daysAgoDate(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  it('逾期 1-3 天：无惩罚', () => {
    var c = freshCard({ ebbinghausStage: 5, ebbinghausNextReview: daysAgoDate(2) });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(4); /* 仅首次失败回退 1 级 */
  });

  it('逾期 4-7 天：降 1 级（与回退取更严，本例持平）', () => {
    var c = freshCard({ ebbinghausStage: 5, ebbinghausNextReview: daysAgoDate(5) });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(4); /* fallback=4, overdueStage=4, min=4 */
  });

  it('逾期 >7 天：降 2 级（与回退取更严）', () => {
    var c = freshCard({ ebbinghausStage: 5, ebbinghausNextReview: daysAgoDate(10) });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(3); /* fallback=4, overdueStage=3, min=3 */
  });

  it('逾期 >7 天且 stage≤2：惩罚不叠加，仍回 stage 1', () => {
    var c = freshCard({ ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(10) });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(1);
  });
});

describe('applyEbbinghaus - 通过（EF 自适应，对齐小程序）', () => {
  it('答对 EF +0.1（封顶 3.5）且 repetitions+1', () => {
    var c = freshCard({ ebbinghausStage: 0, easeFactor: 2.5, repetitions: 0 });
    App.applyEbbinghaus(c, true);
    expect(c.easeFactor).toBeCloseTo(2.6, 5);
    expect(c.repetitions).toBe(1);
    var high = freshCard({ ebbinghausStage: 1, easeFactor: 3.5 });
    App.applyEbbinghaus(high, true);
    expect(high.easeFactor).toBe(3.5);
  });

  it('间隔自适应：EF 3.5 时 stage1 间隔 round(1×1.4)=1', () => {
    var c = freshCard({ ebbinghausStage: 0, easeFactor: 3.5 });
    App.applyEbbinghaus(c, true);
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(c.ebbinghausNextReview).toBe(tomorrow.toISOString().slice(0, 10));
  });

  it('历史记录含 quality', () => {
    var c = freshCard();
    App.applyEbbinghaus(c, true, 'correct');
    expect(c.ebbinghausHistory[0].quality).toBe('correct');
  });

  it('答对重置连续失败计数', () => {
    var c = freshCard({ ebbinghausStage: 3, _consecutiveFails: 2 });
    App.applyEbbinghaus(c, true);
    expect(c._consecutiveFails).toBe(0);
  });

  it('逾期>7天答对且 prevStage>1：降级门控（推进后退 1 级）', () => {
    var d = new Date();
    d.setDate(d.getDate() - 10);
    var c = freshCard({ ebbinghausStage: 3, ebbinghausNextReview: d.toISOString().slice(0, 10) });
    App.applyEbbinghaus(c, true);
    expect(c.ebbinghausStage).toBe(3); /* 推进到 4 后降 1 级回 3 */
  });

  it('逾期>7天答对但 prevStage=1：不触发降级门控', () => {
    var d = new Date();
    d.setDate(d.getDate() - 10);
    var c = freshCard({ ebbinghausStage: 1, ebbinghausNextReview: d.toISOString().slice(0, 10) });
    App.applyEbbinghaus(c, true);
    expect(c.ebbinghausStage).toBe(2);
  });
});

describe('initEbbinghaus 防御（对齐小程序）', () => {
  it('NaN stage 归 0', () => {
    var c = freshCard({ ebbinghausStage: NaN });
    App.initEbbinghaus(c);
    expect(c.ebbinghausStage).toBe(0);
  });

  it('stage 越界夹紧到 [0, 7]', () => {
    var high = freshCard({ ebbinghausStage: 10 });
    var low = freshCard({ ebbinghausStage: -3 });
    App.initEbbinghaus(high);
    App.initEbbinghaus(low);
    expect(high.ebbinghausStage).toBe(7);
    expect(low.ebbinghausStage).toBe(0);
  });

  it('历史截断保留最近 100 条', () => {
    var history = [];
    for (var i = 0; i < 150; i++) history.push({ stage: 1, date: 'x', passed: true });
    var c = freshCard({ ebbinghausHistory: history });
    App.initEbbinghaus(c);
    expect(c.ebbinghausHistory.length).toBe(100);
  });

  it('初始化 _consecutiveFails 为 0', () => {
    var c = freshCard();
    App.initEbbinghaus(c);
    expect(c._consecutiveFails).toBe(0);
  });
});

describe('getReviewCards', () => {
  it('空牌组返回空数组', () => {
    expect(App.getReviewCards(null)).toEqual([]);
    expect(App.getReviewCards({ cards: [] })).toEqual([]);
  });

  it('只返回已到期卡片', () => {
    var today = new Date().toISOString().slice(0, 10);
    var future = new Date();
    future.setDate(future.getDate() + 7);
    var deck = {
      cards: [
        freshCard({ id: 'a', ebbinghausNextReview: today, ebbinghausStage: 1 }),
        freshCard({ id: 'b', ebbinghausNextReview: future.toISOString().slice(0, 10), ebbinghausStage: 1 }),
        freshCard({ id: 'c', ebbinghausNextReview: '2020-01-01', ebbinghausStage: 2 }),
      ]
    };
    var result = App.getReviewCards(deck);
    expect(result.length).toBe(2); // a and c are due, b is future
  });

  it('按逾期天数降序排列', () => {
    var deck = {
      cards: [
        freshCard({ id: 'a', ebbinghausNextReview: '2026-05-31', ebbinghausStage: 2 }),
        freshCard({ id: 'b', ebbinghausNextReview: '2020-01-01', ebbinghausStage: 2 }),
      ]
    };
    var result = App.getReviewCards(deck);
    expect(result[0].id).toBe('b'); // more overdue first
  });
});

describe('getNewWordCards', () => {
  it('空牌组返回空数组', () => {
    expect(App.getNewWordCards(null, 5)).toEqual([]);
  });

  it('只返回 stage 0 的卡片', () => {
    var deck = {
      cards: [
        freshCard({ id: 'a', ebbinghausStage: 0 }),
        freshCard({ id: 'b', ebbinghausStage: 1 }),
        freshCard({ id: 'c', ebbinghausStage: 0 }),
      ]
    };
    var result = App.getNewWordCards(deck, 10);
    expect(result.length).toBe(2);
  });

  it('限制返回数量', () => {
    var deck = {
      cards: [
        freshCard({ id: 'a', ebbinghausStage: 0 }),
        freshCard({ id: 'b', ebbinghausStage: 0 }),
        freshCard({ id: 'c', ebbinghausStage: 0 }),
      ]
    };
    expect(App.getNewWordCards(deck, 1).length).toBe(1);
  });
});

describe('getEbbinghausStats', () => {
  it('空牌组返回全零统计', () => {
    var stats = App.getEbbinghausStats({ cards: [] });
    expect(stats.newWords).toBe(0);
    expect(stats.mastered).toBe(0);
  });

  it('正确统计各阶段分布', () => {
    var deck = {
      cards: [
        freshCard({ id: 'a', ebbinghausStage: 0 }),
        freshCard({ id: 'b', ebbinghausStage: 1 }),
        freshCard({ id: 'c', ebbinghausStage: 7 }),
      ]
    };
    var stats = App.getEbbinghausStats(deck);
    expect(stats.newWords).toBe(1);
    expect(stats.reviewing).toBe(1);
    expect(stats.mastered).toBe(1);
  });

  it('null 牌组不崩溃', () => {
    var stats = App.getEbbinghausStats(null);
    expect(stats.newWords).toBe(0);
  });
});

describe('v2.8 审查健壮性（B9）', () => {
  it('calcUrgencyScore 对非法日期字符串返回有限分（按今日到期计）', () => {
    var c = freshCard({ ebbinghausNextReview: 'not-a-date', ebbinghausStage: 1 });
    var score = App.calcUrgencyScore(c);
    expect(Number.isFinite(score)).toBe(true);
    /* 今日到期 10 + 阶段≤2 15 + EF 2.5 5 + 错词 0 */
    expect(score).toBe(30);
  });

  it('getNewWordCards limit=0 显式传参时返回空（对齐小程序 slice(0,0)）', () => {
    var deck = { id: 'd1', name: '测试', cards: [freshCard({ id: 'a' }), freshCard({ id: 'b' })] };
    expect(App.getNewWordCards(deck, 0)).toEqual([]);
  });
});
