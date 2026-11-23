/**
 * quick-mode.js 测试 —— 快速学习模式（对齐小程序语义）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const App = window.FlashcardApp;

function freshCard(overrides = {}) {
  return Object.assign({
    id: 'test-id',
    ebbinghausStage: 0,
    ebbinghausNextReview: '',
    ebbinghausHistory: [],
    easeFactor: 2.5,
    repetitions: 0,
  }, overrides);
}

describe('applyQuickResult', () => {
  describe('答对 (passed = true)', () => {
    it('stage 0：推进 0→1、EF+0.1、reps+1、写一条带 quality 的历史、明天复习', () => {
      const card = freshCard();
      App.applyQuickResult(card, true);
      expect(card.ebbinghausStage).toBe(1);
      expect(card.easeFactor).toBeCloseTo(2.6, 5);
      expect(card.repetitions).toBe(1);
      expect(card.ebbinghausHistory.length).toBe(1);
      expect(card.ebbinghausHistory[0].passed).toBe(true);
      expect(card.ebbinghausHistory[0].quality).toBe('correct');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(card.ebbinghausNextReview).toBe(tomorrow.toISOString().slice(0, 10));
    });

    it('stage 3：原样保留（不被降级——核心回归）', () => {
      const card = freshCard({ ebbinghausStage: 3, ebbinghausNextReview: '2026-09-01', easeFactor: 2.8, repetitions: 4 });
      App.applyQuickResult(card, true);
      expect(card.ebbinghausStage).toBe(3);
      expect(card.easeFactor).toBe(2.8);
      expect(card.repetitions).toBe(4);
      expect(card.ebbinghausNextReview).toBe('2026-09-01');
      expect(card.ebbinghausHistory.length).toBe(0);
    });

    it('stage 7（已掌握）：原样保留', () => {
      const card = freshCard({ ebbinghausStage: 7 });
      App.applyQuickResult(card, true);
      expect(card.ebbinghausStage).toBe(7);
    });
  });

  describe('答错 (passed = false)', () => {
    it('阶段与 EF 不动，wrongCount/wrongDates/_consecutiveFails 递增', () => {
      const card = freshCard({ ebbinghausStage: 2, ebbinghausNextReview: '2026-09-01' });
      App.applyQuickResult(card, false);
      expect(card.ebbinghausStage).toBe(2);
      expect(card.easeFactor).toBe(2.5);
      expect(card.wrongCount).toBe(1);
      expect(card.wrongDates).toEqual([new Date().toISOString().slice(0, 10)]);
      expect(card._consecutiveFails).toBe(1);
      expect(card.ebbinghausHistory.length).toBe(0);
    });

    it('重复答错 wrongCount 累计', () => {
      const card = freshCard({ wrongCount: 3 });
      App.applyQuickResult(card, false);
      App.applyQuickResult(card, false);
      expect(card.wrongCount).toBe(5);
    });
  });
});

describe('buildStudyQueue - quick 分支', () => {
  beforeEach(() => {
    localStorage.removeItem('flashcard-daily-goal');
    App.studyMode = 'quick';
  });

  function makeDeck(cards) {
    return { id: 'd1', name: '测试', cards };
  }

  function daysAgoDate(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  it('只包含 stage<5 的卡片（排除 stage 5/6/7）', () => {
    const deck = makeDeck([
      freshCard({ id: 'a', ebbinghausStage: 0 }),
      freshCard({ id: 'b', ebbinghausStage: 4, ebbinghausNextReview: daysAgoDate(1) }),
      freshCard({ id: 'c', ebbinghausStage: 5, ebbinghausNextReview: daysAgoDate(1) }),
      freshCard({ id: 'd', ebbinghausStage: 7, ebbinghausNextReview: daysAgoDate(1) }),
    ]);
    const queue = App.buildStudyQueue(deck);
    const ids = queue.map((c) => c.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('新词排最前', () => {
    const deck = makeDeck([
      freshCard({ id: 'old', ebbinghausStage: 3, ebbinghausNextReview: daysAgoDate(1) }),
      freshCard({ id: 'new', ebbinghausStage: 0 }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(queue[0].id).toBe('new');
  });

  it('同为非新词时到期优先于未到期', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const deck = makeDeck([
      freshCard({ id: 'future', ebbinghausStage: 2, ebbinghausNextReview: future.toISOString().slice(0, 10) }),
      freshCard({ id: 'due', ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(1) }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(queue[0].id).toBe('due');
  });

  it('同到期按逾期天数降序、同逾期阶段低优先', () => {
    const deck = makeDeck([
      freshCard({ id: 'mild', ebbinghausStage: 2, ebbinghausNextReview: daysAgoDate(2) }),
      freshCard({ id: 'severe', ebbinghausStage: 3, ebbinghausNextReview: daysAgoDate(9) }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(queue[0].id).toBe('severe');
  });

  it('截断到 dailyGoal', () => {
    localStorage.setItem('flashcard-daily-goal', '3');
    const deck = makeDeck([
      freshCard({ id: 'a', ebbinghausStage: 0 }),
      freshCard({ id: 'b', ebbinghausStage: 0 }),
      freshCard({ id: 'c', ebbinghausStage: 0 }),
      freshCard({ id: 'd', ebbinghausStage: 0 }),
      freshCard({ id: 'e', ebbinghausStage: 0 }),
    ]);
    const queue = App.buildStudyQueue(deck);
    expect(queue.length).toBe(3);
  });

  it('畸形字符串 stage 经 initEbbinghaus 归一为新词进队（旧数据防御）', () => {
    const deck = makeDeck([freshCard({ id: 'broken', ebbinghausStage: '3' })]);
    const queue = App.buildStudyQueue(deck);
    expect(queue.length).toBe(1);
    expect(queue[0].ebbinghausStage).toBe(0);
  });
});

describe('loadQuickLog', () => {
  beforeEach(() => {
    localStorage.removeItem(App.QUICK_LOG_KEY);
  });

  it('无日志时返回空对象', () => {
    expect(App.loadQuickLog()).toEqual({});
  });

  it('存储损坏时返回空对象', () => {
    localStorage.setItem(App.QUICK_LOG_KEY, '{invalid json');
    expect(App.loadQuickLog()).toEqual({});
  });
});

describe('answerStudy quick 分支空卡守卫（B2）', () => {
  it('deckCard 不存在时不崩溃，队列照常推进且不计数', () => {
    App.state.decks = [{ id: 'd1', name: '测试', cards: [] }];
    App.state.currentDeckId = 'd1';
    const spyRender = vi.spyOn(App, 'renderStudyPanel').mockImplementation(() => {});
    const spyBadges = vi.spyOn(App, 'updateNavBadges').mockImplementation(() => {});
    const spySave = vi.spyOn(App, 'saveData').mockImplementation(() => {});

    App.studyMode = 'quick';
    App.studyQueue = [freshCard({ id: 'a' }), freshCard({ id: 'b' })];
    App.studyIndex = 0;
    App.isFlipped = true;
    App.isReviewing = false;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.studyCompletedWords = 0;
    App.studyResults = [];

    expect(() => App.answerStudy(true)).not.toThrow();
    expect(App.studyIndex).toBe(1);
    expect(App.studyCompletedWords).toBe(1);
    expect(App.studyPassed).toBe(0); /* 幽灵卡不计入作答 */
    expect(App.studyResults.length).toBe(0);

    spyRender.mockRestore();
    spyBadges.mockRestore();
    spySave.mockRestore();
    App.state.currentDeckId = null;
    App.state.decks = [];
  });
});
