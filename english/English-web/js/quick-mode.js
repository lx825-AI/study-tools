/* quick-mode.js —— 快速学习模式（对齐小程序：线性过词、独立日志、不污染深度复习） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 快速模式独立日志键（与深度模式 flashcard-learning-log 分离） */
  App.QUICK_LOG_KEY = 'flashcard-quick-log';

  /** 开始快速模式：当前牌组全部卡片线性过一遍 */
  App.startQuickMode = function () {
    var deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;

    App.studyMode = 'quick';
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;

    /* buildStudyQueue 对 quick 走"所有卡片"分支，按难度（EF 升序）排列 */
    App.studyQueue = App.buildStudyQueue(deck);
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.studyStartTime = Date.now();
    App.renderStudyPanel();
  };

  /**
   * 快速模式作答（对齐小程序语义）：
   * - 答对：ebbinghausStage 仅 0→1、nextReview 设为明天、repetitions 至少为 1
   * - 答错：不改动卡片
   * - 不写 ebbinghausHistory，不调 SM-2 —— 不污染深度复习的历史与难度
   */
  App.applyQuickResult = function (card, passed) {
    if (!card) return;
    if (passed) {
      card.ebbinghausStage = 1;
      var next = new Date();
      next.setDate(next.getDate() + 1);
      card.ebbinghausNextReview = next.toISOString().slice(0, 10);
      if (!card.repetitions) card.repetitions = 1;
    }
  };

  /** 快速模式独立日志：按日累计 {correct, wrong} */
  App.trackQuick = function (correct) {
    var today = new Date().toISOString().slice(0, 10);
    var log = App.loadQuickLog();
    if (!log[today]) log[today] = { correct: 0, wrong: 0 };
    if (correct) log[today].correct++;
    else log[today].wrong++;
    try { localStorage.setItem(App.QUICK_LOG_KEY, JSON.stringify(log)); } catch (e) { /* 忽略存储错误 */ }
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
