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

  it('stage 6 → 7（已掌握）', () => {
    var c = freshCard({ ebbinghausStage: 6, ebbinghausNextReview: '2026-01-01' });
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

describe('applyEbbinghaus - 失败', () => {
  it('回退到 stage 1，nextReview 为明天', () => {
    var c = freshCard({ ebbinghausStage: 5, ebbinghausNextReview: '2026-01-01' });
    var result = App.applyEbbinghaus(c, false);
    expect(c.ebbinghausStage).toBe(1);
    expect(result.stage).toBe(1);
    expect(result.prevStage).toBe(5);
    expect(result.isMastered).toBe(false);

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(c.ebbinghausNextReview).toBe(tomorrow.toISOString().slice(0, 10));
  });

  it('失败记录 passed 为 false', () => {
    var c = freshCard({ ebbinghausStage: 3 });
    App.applyEbbinghaus(c, false);
    expect(c.ebbinghausHistory.length).toBe(1);
    expect(c.ebbinghausHistory[0].passed).toBe(false);
    expect(c.ebbinghausHistory[0].stage).toBe(3);
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
