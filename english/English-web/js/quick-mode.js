/* quick-mode.js —— 快速学习模式（对齐小程序：stage<5 队列、仅 stage 0→1、答错追踪） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 快速模式独立日志键（与深度模式 flashcard-learning-log 分离） */
  App.QUICK_LOG_KEY = 'flashcard-quick-log';

  /** 开始快速模式：stage<5 的卡片按优先级排序，截断到每日目标 */
  App.startQuickMode = function () {
    var deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;

    App.studyMode = 'quick';
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;

    /* buildStudyQueue 对 quick 走 stage<5 + 优先级排序 + dailyGoal 截断分支 */
    App.studyQueue = App.buildStudyQueue(deck);
    /* 会话级字段初始化（不持久化，镜像小程序 initStudy） */
    App.studyQueue.forEach(function (c) {
      App.initEbbinghaus(c);
      c._sessionAppearances = 0;
      c._consecutiveFails = 0;
    });
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.studyStartTime = Date.now();
    App.studyCompletedWords = 0;
    App.studyInitialQueueLength = App.studyQueue.length;
    App.studyResults = [];
    App.studyLastCardId = null;
    App.isReviewing = false;
    App.studyReviewReturnIndex = 0;
    App.renderStudyPanel();
  };

  /**
   * 快速模式作答（对齐小程序 markAnswer quick 分支）：
   * - 答对且 stage===0：经 applyEbbinghaus 推进 0→1（EF+0.1、reps+1、写一条历史、明天复习）
   * - 答对且 stage>0：原样保留（不降级、不推进）
   * - 答错：wrongCount++/wrongDates/_consecutiveFails++，不降阶段、不动 EF
   */
  App.applyQuickResult = function (card, passed) {
    if (!card) return;
    App.initEbbinghaus(card);

    if (passed) {
      if (!card.ebbinghausStage || card.ebbinghausStage === 0) {
        App.applyEbbinghaus(card, true, 'correct');
      }
      /* stage>0 答对：原样保留 */
    } else {
      var today = new Date().toISOString().slice(0, 10);
      card.wrongCount = (card.wrongCount || 0) + 1;
      card.wrongDates = card.wrongDates || [];
      card.wrongDates.push(today);
      card._consecutiveFails = (card._consecutiveFails || 0) + 1;
    }
  };

  /** 读取快速模式日志 */
  App.loadQuickLog = function () {
    try {
      var raw = localStorage.getItem(App.QUICK_LOG_KEY);
      var log = raw ? JSON.parse(raw) : {};
      return log && typeof log === 'object' ? log : {};
    } catch (e) {
      return {};
    }
  };
})(FlashcardApp);
