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
    App.spellAnswered = false;
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
