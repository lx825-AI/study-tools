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

describe('calcStreak', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('仅今天有记录为 1', () => {
    vi.setSystemTime(new Date(2026, 7, 21, 12));
    expect(App.calcStreak({ '2026-08-21': { cardsStudied: 1 } })).toBe(1);
  });

  it('连续 2 天为 2', () => {
    vi.setSystemTime(new Date(2026, 7, 21, 12));
    const log = { '2026-08-21': { cardsStudied: 1 }, '2026-08-20': { cardsStudied: 1 } };
    expect(App.calcStreak(log)).toBe(2);
  });

  it('中间断档从今天重计', () => {
    vi.setSystemTime(new Date(2026, 7, 21, 12));
    const log = {
      '2026-08-21': { cardsStudied: 1 },
      '2026-08-20': { cardsStudied: 1 },
      '2026-08-18': { cardsStudied: 1 }, /* 19 缺 → 断档 */
    };
    expect(App.calcStreak(log)).toBe(2);
  });
});

describe('renderStatsPanel DOM 层（重设计 11 模块）', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="panelStats"></div>';
    localStorage.clear();
    sessionStorage.clear();
    vi.setSystemTime(new Date(2026, 7, 15, 12)); /* 2026-08-15 本地（UTC 同一天） */
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    App.state.decks = [];
    App.state.currentDeckId = null;
  });

  function seedStudyData() {
    App.state.decks = [{
      id: 'd1', name: '四级',
      cards: [
        { id: 'c1', front: 'abandon', easeFactor: 2.5, repetitions: 1, ebbinghausStage: 1, ebbinghausNextReview: '2026-08-15' },
        { id: 'c2', front: 'book', easeFactor: 1.5, repetitions: 3, ebbinghausStage: 2 },
      ],
    }];
    App.state.currentDeckId = 'd1';
    localStorage.setItem(App.LEARNING_LOG_KEY, JSON.stringify({
      '2026-08-15': { date: '2026-08-15', cardsStudied: 10, correct: 8, wrong: 2, duration: 300, completedGoal: true },
    }));
    localStorage.setItem(App.QUICK_LOG_KEY, JSON.stringify({
      '2026-08-14': { date: '2026-08-14', cardsStudied: 5, correct: 4, wrong: 1, duration: 120, completedGoal: true },
    }));
  }

  it('空数据时渲染空状态，点「开始学习」跳学习 tab', () => {
    const spy = vi.spyOn(App, 'switchTab').mockImplementation(function () {});
    App.renderStatsPanel();
    const panel = document.getElementById('panelStats');
    expect(panel.innerHTML).toContain('还没有学习数据');
    expect(panel.querySelector('#btnStatsGoStudy')).not.toBeNull();
    panel.querySelector('#btnStatsGoStudy').click();
    expect(spy).toHaveBeenCalledWith('study');
    spy.mockRestore();
  });

  it('有数据时 11 模块容器齐全且 quick 日志计入打卡（合并口径）', () => {
    seedStudyData();
    App.renderStatsPanel();
    const panel = document.getElementById('panelStats');
    /* 连续打卡：今天 deep + 昨天 quick = 2 天 */
    expect(panel.querySelector('.streak-card .streak-count').textContent).toBe('🔥 2 天');
    expect(panel.querySelector('.report-card')).not.toBeNull();
    expect(panel.querySelectorAll('.report-item').length).toBe(3);
    expect(panel.querySelectorAll('.week-bar').length).toBe(7);
    expect(panel.querySelector('.calendar-card')).not.toBeNull();
    expect(panel.querySelector('.calendar-title').textContent).toBe('2026年 8月');
    expect(panel.querySelector('.heatmap-card')).not.toBeNull();
    const cellCount = panel.querySelectorAll('.heatmap-cell').length;
    expect(cellCount).toBeGreaterThanOrEqual(7 * 12);
    expect(panel.querySelector('.curve-card canvas')).not.toBeNull();
    expect(panel.querySelectorAll('.eb-dist-row').length).toBe(8);
    expect(panel.querySelector('.daily-goal')).not.toBeNull();
    expect(panel.querySelector('#btnShareAchievement')).not.toBeNull();
    /* 总览：2 卡 + 今日待复习 1（nextReview=今天） */
    expect(panel.querySelectorAll('.stats-grid').length).toBeGreaterThanOrEqual(2);
    expect(panel.innerHTML).toContain('待强化词汇');
  });

  it('jsdom 无 canvas 实现时渲染不抛异常（守卫回归）', () => {
    seedStudyData();
    expect(function () { App.renderStatsPanel(); }).not.toThrow();
  });

  it('日历翻月：下一月 → 2026年 9月，再上月两次 → 2026年 7月', () => {
    seedStudyData();
    App.renderStatsPanel();
    document.getElementById('calNext').click();
    expect(document.querySelector('.calendar-title').textContent).toBe('2026年 9月');
    document.getElementById('calPrev').click();
    document.getElementById('calPrev').click();
    expect(document.querySelector('.calendar-title').textContent).toBe('2026年 7月');
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
