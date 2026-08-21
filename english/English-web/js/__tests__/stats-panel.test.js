/**
 * stats-panel.test.js —— 会话汇总统计（对齐小程序 saveProgress）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const App = window.FlashcardApp;

describe('dedupeStudyResults', () => {
  it('同一卡片多次作答只保留最后一次结果', () => {
    const results = [
      { cardId: 'a', word: 'a', passed: true },
      { cardId: 'b', word: 'b', passed: false },
      { cardId: 'a', word: 'a', passed: false },
    ];
    const unique = App.dedupeStudyResults(results);
    expect(unique.length).toBe(2);
    expect(unique.find((r) => r.cardId === 'a').passed).toBe(false);
    expect(unique.find((r) => r.cardId === 'b').passed).toBe(false);
  });

  it('空与非法输入返回空数组', () => {
    expect(App.dedupeStudyResults([])).toEqual([]);
    expect(App.dedupeStudyResults(null)).toEqual([]);
  });
});

describe('finalizeStudyLog', () => {
  beforeEach(() => {
    localStorage.removeItem(App.LEARNING_LOG_KEY);
    localStorage.removeItem(App.QUICK_LOG_KEY);
  });

  function setupStudy(mode, results) {
    App.studyMode = mode;
    App.studyResults = results;
    App.studyStartTime = Date.now() - 60000;
    App.studyCompletedWords = 10;
    App.studyInitialQueueLength = 10;
  }

  it('深度模式写入 learning-log 且结构完整', () => {
    setupStudy('new', [
      { cardId: 'a', word: 'a', passed: true },
      { cardId: 'b', word: 'b', passed: false },
    ]);
    App.finalizeStudyLog();
    const log = App.loadLearningLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(log[today]).toBeDefined();
    expect(log[today].cardsStudied).toBe(2);
    expect(log[today].correct).toBe(1);
    expect(log[today].wrong).toBe(1);
    expect(log[today].duration).toBeGreaterThanOrEqual(60);
    expect(log[today].completedGoal).toBe(true);
  });

  it('快速模式写入 quick-log 且不污染 learning-log', () => {
    setupStudy('quick', [{ cardId: 'a', word: 'a', passed: true }]);
    App.finalizeStudyLog();
    expect(Object.keys(App.loadLearningLog()).length).toBe(0);
    const quickLog = App.loadQuickLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(quickLog[today].correct).toBe(1);
  });

  it('同卡多次作答去重后统计', () => {
    setupStudy('review', [
      { cardId: 'a', word: 'a', passed: true },
      { cardId: 'a', word: 'a', passed: false },
    ]);
    App.finalizeStudyLog();
    const log = App.loadLearningLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(log[today].cardsStudied).toBe(1);
    expect(log[today].correct).toBe(0);
  });

  it('当日覆盖语义：两次会话第二次覆盖', () => {
    setupStudy('review', [{ cardId: 'a', word: 'a', passed: true }]);
    App.finalizeStudyLog();
    setupStudy('review', [
      { cardId: 'b', word: 'b', passed: false },
      { cardId: 'c', word: 'c', passed: false },
    ]);
    App.finalizeStudyLog();
    const log = App.loadLearningLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(log[today].cardsStudied).toBe(2);
    expect(log[today].wrong).toBe(2);
  });

  it('早退（completedWords 未达初始队列）completedGoal=false', () => {
    setupStudy('new', [{ cardId: 'a', word: 'a', passed: true }]);
    App.studyCompletedWords = 3; /* 3/10 早退 */
    App.finalizeStudyLog();
    const log = App.loadLearningLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(log[today].completedGoal).toBe(false);
  });

  it('早退条目不覆盖当日已完成会话（切 tab 弃置不倒退统计）', () => {
    /* 上午完成会话 */
    setupStudy('new', [{ cardId: 'a', word: 'a', passed: true }]);
    App.finalizeStudyLog();
    /* 下午新会话早退 */
    setupStudy('new', [{ cardId: 'b', word: 'b', passed: true }]);
    App.studyCompletedWords = 1; /* 1/10 早退 */
    App.studyInitialQueueLength = 10;
    App.finalizeStudyLog();
    const log = App.loadLearningLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(log[today].completedGoal).toBe(true); /* 不被早退覆盖 */
    expect(log[today].cardsStudied).toBe(1);
  });

  it('当日只有早退条目时再次早退仍覆盖为最新', () => {
    setupStudy('new', [{ cardId: 'a', word: 'a', passed: true }]);
    App.studyCompletedWords = 2;
    App.studyInitialQueueLength = 10;
    App.finalizeStudyLog();
    App.studyResults = [
      { cardId: 'b', word: 'b', passed: false },
      { cardId: 'c', word: 'c', passed: false },
    ];
    App.finalizeStudyLog();
    const log = App.loadLearningLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(log[today].completedGoal).toBe(false);
    expect(log[today].cardsStudied).toBe(2);
  });

  it('零作答不写日志', () => {
    setupStudy('review', []);
    App.finalizeStudyLog();
    expect(Object.keys(App.loadLearningLog()).length).toBe(0);
  });
});

describe('returnToModeSelect 早退守卫（B7）', () => {
  beforeEach(() => {
    localStorage.removeItem(App.LEARNING_LOG_KEY);
  });

  it('已完成会话不再重复写日志（completedGoal 不被覆盖为 false）', () => {
    App.studyMode = 'new';
    App.studyResults = [{ cardId: 'a', word: 'a', passed: true }];
    App.studyStartTime = Date.now() - 60000;
    App.studyCompletedWords = 1;
    App.studyInitialQueueLength = 1;

    /* 模拟自然完成：completedGoal=true 已写入 */
    App.finalizeStudyLog();
    const today = new Date().toISOString().slice(0, 10);
    expect(App.loadLearningLog()[today].completedGoal).toBe(true);

    /* 完成面板后再次触发返回模式选择 */
    const spyRender = vi.spyOn(App, 'renderStudyPanel').mockImplementation(() => {});
    App.returnToModeSelect();
    spyRender.mockRestore();

    expect(App.loadLearningLog()[today].completedGoal).toBe(true);
  });
});
