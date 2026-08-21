/**
 * study-panel.js 测试 —— 单轨作答（v2.8：SM-2 已删除，EF/repetitions 由 applyEbbinghaus 维护）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const App = window.FlashcardApp;

function freshCard(overrides = {}) {
  return Object.assign({ id: 'test-id' }, overrides);
}

describe('applyEbbinghaus 单轨作答语义（study-panel 调用的核心路径）', () => {
  let card;

  beforeEach(() => {
    card = freshCard();
  });

  describe('答对 (passed = true, quality = correct)', () => {
    it('stage 0→1，EF +0.1，repetitions +1', () => {
      const result = App.applyEbbinghaus(card, true, 'correct');
      expect(card.ebbinghausStage).toBe(1);
      expect(card.easeFactor).toBeCloseTo(2.6, 5);
      expect(card.repetitions).toBe(1);
      expect(result.isMastered).toBe(false);
    });

    it('nextReview 为明天（stage 1 间隔 1 天）', () => {
      App.applyEbbinghaus(card, true);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(card.ebbinghausNextReview).toBe(tomorrow.toISOString().slice(0, 10));
    });

    it('不再写 nextReview 字段（单轨退役）', () => {
      App.applyEbbinghaus(card, true);
      expect(card.nextReview).toBeUndefined();
    });
  });

  describe('答错 (passed = false)', () => {
    it('EF -0.2（下限 1.3），repetitions 重置 0', () => {
      card.easeFactor = 2.5;
      card.repetitions = 5;
      App.applyEbbinghaus(card, false);
      expect(card.easeFactor).toBeCloseTo(2.3, 5);
      expect(card.repetitions).toBe(0);
    });

    it('连续失败计数递增', () => {
      App.applyEbbinghaus(card, false);
      expect(card._consecutiveFails).toBe(1);
    });
  });
});

describe('v2.8 审查修复回归', () => {
  it('checkSpelling 回看态直接返回，不触达 DOM（B1）', () => {
    App.isReviewing = true;
    App.spellMode = true;
    App.studyQueue = [freshCard({ id: 'a' })];
    App.studyIndex = 0;
    expect(() => App.checkSpelling()).not.toThrow();
    App.isReviewing = false;
  });

  it('exitReviewMode 清空旧 failed 会话状态（B3）', () => {
    App.state.decks = [{ id: 'd1', name: '测试', cards: [freshCard({ id: 'a' })] }];
    App.state.currentDeckId = 'd1';
    const spyRender = vi.spyOn(App, 'renderStudyPanel').mockImplementation(() => {});
    const origToast = App.showToast; /* showToast 定义在 app.js，测试环境未加载 */
    App.showToast = vi.fn();

    App.studyQueue = [freshCard({ id: 'a' })];
    App.studyIndex = 1;
    App.studyCompletedWords = 5;
    App.studyResults = [{ cardId: 'a', passed: false }];
    App.isReviewMode = true;

    App.exitReviewMode();

    expect(App.studyQueue).toEqual([]);
    expect(App.studyResults).toEqual([]);
    expect(App.isReviewMode).toBe(false);
    expect(App.studyMode).toBe('review');

    App.showToast = origToast;
    spyRender.mockRestore();
    App.state.currentDeckId = null;
    App.state.decks = [];
  });

  it('完成面板同卡先错后对：✅/❌ 按卡去重显示（B5）', () => {
    document.body.innerHTML =
      '<div id="studyNoDeck"></div>' +
      '<div id="studyContent"></div>' +
      '<div id="studyComplete"></div>' +
      '<div id="studyEmpty"></div>' +
      '<div id="studyModeSelect"></div>' +
      '<div id="completeTitle"></div>' +
      '<div id="completeStats"></div>' +
      '<button id="btnRestart"></button>';
    App.state.decks = [{ id: 'd1', name: '测试', cards: [freshCard({ id: 'a' })] }];
    App.state.currentDeckId = 'd1';
    sessionStorage.removeItem('flashcard-study-progress');

    App.studyMode = 'new';
    App.studyQueue = [];
    App.studyIndex = 0;
    App.studyCompletedWords = 1;
    App.studyInitialQueueLength = 1;
    App.studyPassed = 1;
    App.studyFailed = 1;
    App.studyStartTime = Date.now() - 60000;
    App.isReviewMode = false;
    App.studyResults = [
      { cardId: 'a', word: 'a', passed: false },
      { cardId: 'a', word: 'a', passed: true },
    ];

    App.renderStudyPanel();

    const statsHtml = document.getElementById('completeStats').innerHTML;
    expect(statsHtml).toContain('✅ 1');
    expect(statsHtml).toContain('❌ 0');
    expect(document.getElementById('completeTitle').textContent).toBe('完美通关！🎉');

    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });
});

describe('自动播放发音（对齐小程序 speakCurrentCard：换卡 300ms 后朗读）', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    App.speak = vi.fn();
    sessionStorage.removeItem('flashcard-study-progress');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  function setupReviewCard() {
    App.state.decks = [{ id: 'd1', name: '测试', cards: [freshCard({ id: 'a', front: 'abandon' })] }];
    App.state.currentDeckId = 'd1';
    App.studyMode = 'review';
    App.studyQueue = [{ id: 'a', front: 'abandon' }];
    App.studyIndex = 0;
    App.isReviewMode = false;
    App.studyCompletedWords = 0;
  }

  it('渲染新卡 300ms 后自动播放当前词', () => {
    vi.useFakeTimers();
    setupReviewCard();
    App.renderStudyPanel();
    expect(App.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(App.speak).toHaveBeenCalledTimes(1);
    expect(App.speak).toHaveBeenCalledWith('abandon');
  });

  it('300ms 内重复渲染只播最后一张词（_speakTimer 防叠加）', () => {
    vi.useFakeTimers();
    setupReviewCard();
    App.renderStudyPanel();
    App.studyQueue = [{ id: 'b', front: 'balance' }];
    App.renderStudyPanel();
    vi.advanceTimersByTime(300);
    expect(App.speak).toHaveBeenCalledTimes(1);
    expect(App.speak).toHaveBeenCalledWith('balance');
  });

  it('学习面板不可见时不播放（后台门控）', () => {
    vi.useFakeTimers();
    setupReviewCard();
    document.getElementById('panelStudy').classList.remove('visible');
    App.renderStudyPanel();
    vi.advanceTimersByTime(300);
    expect(App.speak).not.toHaveBeenCalled();
  });

  it('完成面板分支不触发播放', () => {
    vi.useFakeTimers();
    App.state.decks = [{ id: 'd1', name: '测试', cards: [freshCard({ id: 'a' })] }];
    App.state.currentDeckId = 'd1';
    App.studyMode = 'new';
    App.studyQueue = [];
    App.studyIndex = 0;
    App.studyCompletedWords = 1;
    App.studyInitialQueueLength = 1;
    App.studyPassed = 1;
    App.studyFailed = 0;
    App.studyStartTime = Date.now() - 60000;
    App.isReviewMode = false;
    App.studyResults = [{ cardId: 'a', word: 'a', passed: true }];
    App.renderStudyPanel();
    vi.advanceTimersByTime(300);
    expect(App.speak).not.toHaveBeenCalled();
  });
});

describe('会了/不会直接作答推进（不翻转，对齐小程序 markAnswer）', () => {
  let spyRender;
  let spySave;
  let spyBadges;

  beforeEach(() => {
    window.mountStudyDOM();
    sessionStorage.removeItem('flashcard-study-progress');
    spyRender = vi.spyOn(App, 'renderStudyPanel').mockImplementation(() => {});
    spySave = vi.spyOn(App, 'saveData').mockImplementation(() => {});
    spyBadges = vi.spyOn(App, 'updateNavBadges').mockImplementation(() => {});
  });

  afterEach(() => {
    spyRender.mockRestore();
    spySave.mockRestore();
    spyBadges.mockRestore();
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  function setupTwoCards() {
    const cards = [
      freshCard({ id: 'a', front: 'abandon', ebbinghausStage: 0 }),
      freshCard({ id: 'b', front: 'balance', ebbinghausStage: 0 }),
    ];
    App.state.decks = [{ id: 'd1', name: '测试', cards }];
    App.state.currentDeckId = 'd1';
    App.studyMode = 'review';
    App.studyQueue = [cards[0], cards[1]];
    App.studyIndex = 0;
    App.isFlipped = false; /* 关键：未翻转时点会了/不会 */
    App.isReviewing = false;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.studyCompletedWords = 0;
    App.studyResults = [];
    return cards;
  }

  it('未翻转时 answerStudy(true) 直接作答推进且不翻卡', () => {
    const cards = setupTwoCards();
    App.answerStudy(true);
    expect(App.studyIndex).toBe(1);
    expect(App.studyCompletedWords).toBe(1);
    expect(App.studyPassed).toBe(1);
    expect(cards[0].ebbinghausStage).toBe(1); /* 答对 stage 0→1 */
    expect(document.getElementById('flashcard').classList.contains('flipped')).toBe(false);
  });

  it('未翻转时 answerStudy(false) 直接按答错处理并推进', () => {
    const cards = setupTwoCards();
    App.answerStudy(false);
    expect(App.studyIndex).toBe(1);
    expect(App.studyCompletedWords).toBe(1);
    expect(App.studyFailed).toBe(1);
    expect(cards[0].wrongCount).toBe(1); /* 答错追踪生效 */
    expect(document.getElementById('flashcard').classList.contains('flipped')).toBe(false);
  });
});

describe('完成面板返回模式选择入口', () => {
  beforeEach(() => {
    window.mountStudyDOM();
    sessionStorage.removeItem('flashcard-study-progress');
    App.state.decks = [{ id: 'd1', name: '测试', cards: [freshCard({ id: 'a' })] }];
    App.state.currentDeckId = 'd1';
    App.studyMode = 'new';
    App.studyQueue = [];
    App.studyIndex = 0;
    App.studyCompletedWords = 1;
    App.studyInitialQueueLength = 1;
    App.studyPassed = 1;
    App.studyFailed = 0;
    App.studyStartTime = Date.now() - 60000;
    App.isReviewMode = false;
    App.studyResults = [{ cardId: 'a', word: 'a', passed: true }];
  });

  afterEach(() => {
    App.state.currentDeckId = null;
    App.state.decks = [];
    document.body.innerHTML = '';
  });

  it('完成面板渲染后存在「↩ 返回模式选择」按钮', () => {
    App.renderStudyPanel();
    expect(document.getElementById('btnBackToModeSelect')).not.toBeNull();
    expect(document.getElementById('studyComplete').style.display).toBe('block');
  });

  it('点击返回按钮回到「选择学习模式」引导', () => {
    App.renderStudyPanel();
    document.getElementById('btnBackToModeSelect').click();

    expect(App.studyQueue.length).toBe(0);
    const guide = document.getElementById('studyModeGuide');
    expect(guide).not.toBeNull();
    expect(guide.innerHTML).toContain('选择学习模式');
  });

  it('review 分支按钮顺序稳定：再来一轮 → 退出复习 → 返回模式选择', () => {
    /* 先普通分支完成（backBtn 先创建），再切 review 分支（exitBtn2 后创建）模拟顺序抖动场景 */
    App.renderStudyPanel();
    expect(document.getElementById('btnBackToModeSelect')).not.toBeNull();

    App.studyMode = 'failed';
    App.isReviewMode = true;
    App.studyQueue = [];
    App.renderStudyPanel();

    const ids = Array.from(document.querySelectorAll('#studyComplete button')).map(function (b) { return b.id; });
    expect(ids).toEqual(['btnRestart', 'btnExitReview', 'btnBackToModeSelect']);
  });
});
