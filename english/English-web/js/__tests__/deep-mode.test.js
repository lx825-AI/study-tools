/**
 * deep-mode.test.js —— 深度模式动态队列（对齐小程序 markAnswer）
 */
import { describe, it, expect } from 'vitest';

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

describe('computeDeepReinsert', () => {
  it('答错 → idx+3', () => {
    const queue = [freshCard({ id: 'a' }), freshCard({ id: 'b' }), freshCard({ id: 'c' }), freshCard({ id: 'd' }), freshCard({ id: 'e' })];
    const card = freshCard({ id: 'x', ebbinghausStage: 1 });
    expect(App.computeDeepReinsert(queue, 0, card, false, 1)).toBe(3);
  });

  it('答对 stage≤1 → idx+5', () => {
    const queue = Array.from({ length: 10 }, (_, i) => freshCard({ id: 'c' + i }));
    const card = freshCard({ id: 'x', ebbinghausStage: 1 });
    expect(App.computeDeepReinsert(queue, 0, card, true, 1)).toBe(5);
  });

  it('答对 stage 2 → idx+10', () => {
    const queue = Array.from({ length: 15 }, (_, i) => freshCard({ id: 'c' + i }));
    const card = freshCard({ id: 'x', ebbinghausStage: 2 });
    expect(App.computeDeepReinsert(queue, 0, card, true, 1)).toBe(10);
  });

  it('答对 stage 3 → idx+15', () => {
    const queue = Array.from({ length: 20 }, (_, i) => freshCard({ id: 'c' + i }));
    const card = freshCard({ id: 'x', ebbinghausStage: 3 });
    expect(App.computeDeepReinsert(queue, 0, card, true, 1)).toBe(15);
  });

  it('重插位置越界钳制到 queue.length', () => {
    const queue = [freshCard({ id: 'a' }), freshCard({ id: 'b' })];
    const card = freshCard({ id: 'x', ebbinghausStage: 3 });
    expect(App.computeDeepReinsert(queue, 0, card, true, 1)).toBe(2);
  });

  it('出现 ≥3 次 → -1（永久移出）', () => {
    const queue = [freshCard({ id: 'a' }), freshCard({ id: 'b' })];
    const card = freshCard({ id: 'x', ebbinghausStage: 1 });
    expect(App.computeDeepReinsert(queue, 0, card, true, 3)).toBe(-1);
  });

  it('阶段 ≥4 → -1（永久移出）', () => {
    const queue = [freshCard({ id: 'a' }), freshCard({ id: 'b' })];
    const card = freshCard({ id: 'x', ebbinghausStage: 4 });
    expect(App.computeDeepReinsert(queue, 0, card, true, 1)).toBe(-1);
  });
});

describe('会话恢复 TTL', () => {
  it('超过 2 小时返回 false 并清除快照', () => {
    const stale = {
      mode: 'new',
      queue: [freshCard({ id: 'a' })],
      index: 0,
      timestamp: Date.now() - (2 * 60 * 60 * 1000 + 60000),
    };
    sessionStorage.setItem('flashcard-study-progress', JSON.stringify(stale));
    expect(App.restoreStudyProgress()).toBe(false);
    expect(sessionStorage.getItem('flashcard-study-progress')).toBeNull();
  });

  it('2 小时内返回 true 并恢复新字段', () => {
    const fresh = {
      mode: 'new',
      queue: [freshCard({ id: 'a' })],
      index: 0,
      timestamp: Date.now() - 60000,
      completedWords: 3,
      initialQueueLength: 10,
      results: [{ cardId: 'a', passed: true }],
    };
    sessionStorage.setItem('flashcard-study-progress', JSON.stringify(fresh));
    expect(App.restoreStudyProgress()).toBe(true);
    expect(App.studyCompletedWords).toBe(3);
    expect(App.studyInitialQueueLength).toBe(10);
    expect(App.studyResults.length).toBe(1);
    sessionStorage.removeItem('flashcard-study-progress');
  });

  it('旧线性 new 快照（index>0）迁移为从头继续', () => {
    const legacy = {
      mode: 'new',
      queue: [freshCard({ id: 'a' }), freshCard({ id: 'b' })],
      index: 1,
      timestamp: Date.now(),
    };
    sessionStorage.setItem('flashcard-study-progress', JSON.stringify(legacy));
    expect(App.restoreStudyProgress()).toBe(true);
    expect(App.studyIndex).toBe(0);
    sessionStorage.removeItem('flashcard-study-progress');
  });

  it('快照含 elapsed 时恢复重锚 studyStartTime（不计页面关闭空闲，B4）', () => {
    App.state.currentDeckId = null;
    const now = Date.now();
    sessionStorage.setItem('flashcard-study-progress', JSON.stringify({
      mode: 'new',
      queue: [freshCard({ id: 'a' })],
      index: 0,
      timestamp: now,
      startTime: now - 120000,
      elapsed: 60000,
      completedWords: 0,
      initialQueueLength: 3,
    }));
    expect(App.restoreStudyProgress()).toBe(true);
    expect(Math.abs(App.studyStartTime - (now - 60000))).toBeLessThan(5000);
    sessionStorage.removeItem('flashcard-study-progress');
  });

  it('恢复时剔除已从牌组删除的卡（B6）', () => {
    App.state.decks = [{ id: 'd1', name: '测试', cards: [freshCard({ id: 'keep' })] }];
    App.state.currentDeckId = 'd1';
    sessionStorage.setItem('flashcard-study-progress', JSON.stringify({
      mode: 'quick',
      queue: [freshCard({ id: 'keep' }), freshCard({ id: 'gone' })],
      index: 0,
      timestamp: Date.now(),
      completedWords: 0,
      initialQueueLength: 2,
    }));
    expect(App.restoreStudyProgress()).toBe(true);
    expect(App.studyQueue.map((c) => c.id)).toEqual(['keep']);
    sessionStorage.removeItem('flashcard-study-progress');
    App.state.currentDeckId = null;
    App.state.decks = [];
  });

  it('恢复时队列全部失效则放弃恢复（B6）', () => {
    App.state.decks = [{ id: 'd1', name: '测试', cards: [] }];
    App.state.currentDeckId = 'd1';
    sessionStorage.setItem('flashcard-study-progress', JSON.stringify({
      mode: 'quick',
      queue: [freshCard({ id: 'gone' })],
      index: 0,
      timestamp: Date.now(),
      completedWords: 0,
      initialQueueLength: 1,
    }));
    expect(App.restoreStudyProgress()).toBe(false);
    sessionStorage.removeItem('flashcard-study-progress');
    App.state.currentDeckId = null;
    App.state.decks = [];
  });
});

describe('回看状态守卫（B1）', () => {
  it('isReviewing 时 answerStudy 不产生任何状态变更', () => {
    App.state.decks = [{ id: 'd1', name: '测试', cards: [freshCard({ id: 'a' })] }];
    App.state.currentDeckId = 'd1';
    App.studyQueue = [freshCard({ id: 'a', ebbinghausStage: 1 })];
    App.studyIndex = 0;
    App.studyMode = 'new';
    App.isFlipped = true;
    App.isReviewing = true;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.studyResults = [];
    App.studyCompletedWords = 0;

    const beforeStage = App.state.decks[0].cards[0].ebbinghausStage;
    App.answerStudy(true);

    expect(App.state.decks[0].cards[0].ebbinghausStage).toBe(beforeStage);
    expect(App.studyResults.length).toBe(0);
    expect(App.studyPassed).toBe(0);
    expect(App.studyQueue.length).toBe(1); /* 未 splice */
    App.state.currentDeckId = null;
    App.state.decks = [];
    App.isReviewing = false;
  });
});
