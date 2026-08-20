/* study-panel.js —— 翻卡学习（支持多模式 + 艾宾浩斯） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.studyQueue = [];
  App.studyIndex = 0;
  App.isFlipped = false;
  App.studyPassed = 0;
  App.studyFailed = 0;
  App.studyStartTime = null;
  App.spellMode = false;              /* 拼写模式开关（纯练习，不参与学习进度） */

  /* 学习模式: 'new' | 'review' | 'failed' | 'quick' */
  App.studyMode = 'review';
  /* 每次新词学习数量 */
  App.newWordsPerSession = parseInt(localStorage.getItem('flashcard-new-words-per-session') || '10', 10);

  App.isReviewMode = false;
  App.reviewSourceDeckId = null;

  /* 深度模式动态队列状态（对齐小程序） */
  App.studyCompletedWords = 0;      /* 永久移出的词数 */
  App.studyInitialQueueLength = 0;  /* 会话初始队列长度 */
  App.studyResults = [];            /* 作答记录 [{cardId, word, passed}]，会话完成时按卡去重汇总 */
  App.studyLastCardId = null;       /* 最近作答的卡 id（回看用） */
  App.isReviewing = false;          /* 回看状态 */
  App.studyReviewReturnIndex = 0;   /* 回看返回位置 */

  /* ========== 艾宾浩斯单轨调度（v2.8：SM-2 双轨已删除，EF/repetitions 统一由 applyEbbinghaus 维护） ========== */

  /* ========== 队列构建（按模式） ========== */
  App.buildStudyQueue = function (deck) {
    var today = new Date().toISOString().slice(0, 10);
    var dailyGoal = parseInt(localStorage.getItem('flashcard-daily-goal') || '10', 10);
    if (!isFinite(dailyGoal) || dailyGoal <= 0) dailyGoal = 10; /* 默认 10（对齐小程序）+ 损坏值兜底 */
    var cards;

    if (App.studyMode === 'new') {
      cards = App.getNewWordCards(deck, App.newWordsPerSession);
    } else if (App.studyMode === 'review') {
      /* 复习模式：到期词 + 紧急度综合评分排序 + 软上限 50（对齐小程序） */
      cards = App.getReviewCards(deck).map(function (c) {
        c._urgencyScore = App.calcUrgencyScore(c);
        return c;
      }).sort(function (a, b) {
        return b._urgencyScore - a._urgencyScore;
      }).slice(0, Math.max(dailyGoal, Math.min(50, deck.cards.length)));
    } else if (App.studyMode === 'quick') {
      /* 快速模式：stage<5 + 新词/到期/逾期优先级排序 + 截断 dailyGoal（对齐小程序） */
      cards = deck.cards.filter(function (c) {
        return (c.ebbinghausStage || 0) < 5;
      }).sort(function (a, b) {
        var aStage = a.ebbinghausStage || 0;
        var bStage = b.ebbinghausStage || 0;
        /* 新词优先 */
        if (aStage === 0 && bStage > 0) return -1;
        if (aStage > 0 && bStage === 0) return 1;
        /* 都不是新词 */
        if (aStage > 0 && bStage > 0) {
          var aDue = a.ebbinghausNextReview && a.ebbinghausNextReview <= today;
          var bDue = b.ebbinghausNextReview && b.ebbinghausNextReview <= today;
          /* 到期的优先 */
          if (aDue && !bDue) return -1;
          if (!aDue && bDue) return 1;
          /* 都到期或都不到期，按逾期天数降序 */
          var aOverdue = App.getOverdueDays(a);
          var bOverdue = App.getOverdueDays(b);
          if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        }
        /* 同逾期，阶段低的优先 */
        return (a.ebbinghausStage || 0) - (b.ebbinghausStage || 0);
      }).slice(0, dailyGoal);
    } else {
      /* failed 等兜底: 所有卡片 */
      cards = deck.cards.map(function (c) { return Object.assign({}, c); });
    }

    /* new 保持词书原序（动态队列在 answerStudy 重插）、quick/review 各自排序；failed 等兜底按低 EF 优先 */
    if (App.studyMode !== 'new' && App.studyMode !== 'quick' && App.studyMode !== 'review') {
      cards.sort(function (a, b) {
        return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
      });
    }

    return cards;
  };

  /* ========== 错题收集 ========== */
  App.collectFailedCards = function () {
    var failed = [];
    App.state.decks.forEach(function (deck) {
      deck.cards.forEach(function (c) {
        if (typeof c.easeFactor === 'number' && c.easeFactor <= 1.8 && c.repetitions > 0) {
          failed.push({ card: c, deckName: deck.name, deckId: deck.id });
        }
      });
    });
    return failed;
  };

  App.collectDueCards = function (deck) {
    return App.getReviewCards(deck);
  };

  /* ========== 学习模式入口 ========== */

  /** 学习新词 */
  App.startNewWords = function () {
    var deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;

    App.studyMode = 'new';
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;

    var newCards = App.getNewWordCards(deck, App.newWordsPerSession);
    if (newCards.length === 0) {
      App.showToast('🎉 该牌组没有新词了！所有单词已进入复习循环', 'success', 2500);
      App.renderStudyPanel();
      return;
    }

    App.studyQueue = App.buildStudyQueue(deck);
    /* 深度动态队列会话初始化（对齐小程序 initStudy） */
    App.studyQueue.forEach(function (c) {
      App.initEbbinghaus(c);
      c._sessionAppearances = 0;
      c._consecutiveFails = 0;
    });
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.spellMode = false;
    App.studyStartTime = Date.now();
    App.studyCompletedWords = 0;
    App.studyInitialQueueLength = App.studyQueue.length;
    App.studyResults = [];
    App.studyLastCardId = null;
    App.isReviewing = false;
    App.studyReviewReturnIndex = 0;
    App.renderStudyPanel();
  };

  /** 复习到期卡片 */
  App.startReview = function () {
    var deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;

    App.studyMode = 'review';
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;

    var reviewCards = App.getReviewCards(deck);
    if (reviewCards.length === 0) {
      App.showToast('✅ 今日无待复习卡片！可以学习新词或休息一下', 'success', 2500);
      App.renderStudyPanel();
      return;
    }

    App.studyQueue = App.buildStudyQueue(deck);
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.spellMode = false;
    App.studyStartTime = Date.now();
    App.studyCompletedWords = 0;
    App.studyInitialQueueLength = App.studyQueue.length;
    App.studyResults = [];
    App.studyLastCardId = null;
    App.isReviewing = false;
    App.studyReviewReturnIndex = 0;
    App.renderStudyPanel();
  };

  /** 错题复习 */
  App.startFailedReview = function () {
    var failedCards = App.collectFailedCards();
    if (failedCards.length === 0) {
      App.showToast('暂无需要复习的错题，继续加油！🎉', 'success', 2000);
      return;
    }
    App.studyMode = 'failed';
    App.isReviewMode = true;
    App.reviewSourceDeckId = App.state.currentDeckId;
    App.studyQueue = failedCards.map(function (f) {
      return Object.assign({}, f.card, { _deckName: f.deckName, _deckId: f.deckId });
    }).sort(function (a, b) {
      return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
    });
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.spellMode = false;
    App.studyStartTime = Date.now();
    App.studyCompletedWords = 0;
    App.studyInitialQueueLength = App.studyQueue.length;
    App.studyResults = [];
    App.studyLastCardId = null;
    App.isReviewing = false;
    App.studyReviewReturnIndex = 0;
    App.renderStudyPanel();
    App.showToast('📋 错题复习模式：共 ' + App.studyQueue.length + ' 个需强化记忆的词', 'info', 2500);
  };

  App.exitReviewMode = function () {
    App.clearStudySessionState();
    App.studyMode = 'review';
    App.startReview();
  };

  /* 清空学习会话状态（早退/退出错题复习共用；不含统计落库与快照清理） */
  App.clearStudySessionState = function () {
    App.studyQueue = [];
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.spellMode = false;
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;
    App.studyCompletedWords = 0;
    App.studyInitialQueueLength = 0;
    App.studyResults = [];
    App.studyLastCardId = null;
    App.isReviewing = false;
    App.studyReviewReturnIndex = 0;
  };

  /* 返回到模式选择界面 */
  App.returnToModeSelect = function () {
    /* 早退也汇总（completedGoal=false），对齐小程序确认退出写 saveProgress；已完成会话不重复写入 */
    if (App.finalizeStudyLog && App.studyResults && App.studyResults.length > 0 &&
        App.studyCompletedWords < App.studyInitialQueueLength) {
      App.studyCompletedWords = 0; /* 早退未完成 */
      App.finalizeStudyLog();
    }
    App.clearStudySessionState();
    App.saveStudyProgress();
    /* 清除 DOM 中的模式引导，renderStudyPanel 会重新创建 */
    var guideEl = document.getElementById('studyModeGuide');
    if (guideEl) guideEl.remove();
    App.renderStudyPanel();
  };

  /* 旧版兼容接口 */
  App.startStudy = function () {
    App.startReview();
  };

  /** 回看上一张（深度模式，对齐小程序 goPrevCard） */
  App.goPrevCard = function () {
    if (App.studyMode !== 'new') return;
    if (App.isReviewing) {
      /* 回看中再点：返回原位置 */
      App.studyIndex = App.studyReviewReturnIndex;
      App.isReviewing = false;
    } else {
      var prevIdx = -1;
      for (var i = App.studyQueue.length - 1; i >= 0; i--) {
        if (App.studyQueue[i].id === App.studyLastCardId) { prevIdx = i; break; }
      }
      if (prevIdx < 0) {
        App.showToast('上一个单词已完成学习', 'info', 2000);
        return;
      }
      App.studyReviewReturnIndex = App.studyIndex;
      App.studyIndex = prevIdx;
      App.isReviewing = true;
    }
    App.isFlipped = false;
    App.renderStudyPanel();
  };

  /* ========== 学习进度持久化（sessionStorage） ========== */
  App.saveStudyProgress = function () {
    if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) {
      sessionStorage.removeItem('flashcard-study-progress');
      return;
    }
    try {
      var progress = {
        mode: App.studyMode,
        isReview: App.isReviewMode,
        reviewSourceDeckId: App.reviewSourceDeckId,
        queue: App.studyQueue,
        index: App.studyIndex,
        passed: App.studyPassed,
        failed: App.studyFailed,
        startTime: App.studyStartTime,
        elapsed: App.studyStartTime ? (Date.now() - App.studyStartTime) : 0,
        completedWords: App.studyCompletedWords,
        initialQueueLength: App.studyInitialQueueLength,
        results: App.studyResults,
        lastCardId: App.studyLastCardId,
        isReviewing: App.isReviewing,
        reviewReturnIndex: App.studyReviewReturnIndex,
        timestamp: Date.now(),
      };
      sessionStorage.setItem('flashcard-study-progress', JSON.stringify(progress));
    } catch (e) { /* 忽略存储错误 */ }
  };

  App.restoreStudyProgress = function () {
    try {
      var raw = sessionStorage.getItem('flashcard-study-progress');
      if (!raw) return false;
      var progress = JSON.parse(raw);
      /* 会话 TTL 2 小时（对齐小程序 useSessionRecovery） */
      if (Date.now() - progress.timestamp > 2 * 60 * 60 * 1000) {
        sessionStorage.removeItem('flashcard-study-progress');
        return false;
      }
      /* 旧会话 mode='mixed' 归一化为 review（智能混合模式已删除） */
      App.studyMode = (progress.mode === 'mixed') ? 'review' : (progress.mode || 'review');
      App.isReviewMode = progress.isReview || false;
      App.reviewSourceDeckId = progress.reviewSourceDeckId || null;
      App.studyQueue = progress.queue || [];
      /* 校验队列卡仍存在于对应牌组（防学习途中删卡产生空引用） */
      var currentDeck = App.getCurrentDeck();
      if (currentDeck) {
        App.studyQueue = App.studyQueue.filter(function (q) {
          var source = q._deckId ? App.getDeck(q._deckId) : currentDeck;
          return source && source.cards.some(function (c) { return c.id === q.id; });
        });
      }
      /* 旧线性 new 会话快照（v2.8 前）：index>0 语义失效，一次性迁移为从头继续 */
      App.studyIndex = (progress.mode === 'new' && progress.index > 0) ? 0 : (progress.index || 0);
      App.studyPassed = progress.passed || 0;
      App.studyFailed = progress.failed || 0;
      /* 时长口径对齐小程序 timerSeconds：恢复后 startTime 重锚，不计页面关闭期间空闲 */
      App.studyStartTime = progress.elapsed ? Date.now() - progress.elapsed : (progress.startTime || Date.now());
      App.studyCompletedWords = progress.completedWords || 0;
      App.studyInitialQueueLength = progress.initialQueueLength || App.studyQueue.length;
      App.studyResults = progress.results || [];
      App.studyLastCardId = progress.lastCardId || null;
      App.isReviewing = progress.isReviewing || false;
      App.studyReviewReturnIndex = progress.reviewReturnIndex || 0;
      App.isFlipped = false;
      return App.studyQueue.length > 0 && App.studyIndex < App.studyQueue.length;
    } catch (e) { return false; }
  };

  /* ========== 渲染 ========== */
  App.renderStudyPanel = function () {
    var deck = App.getCurrentDeck();
    var noDeck = document.getElementById('studyNoDeck');
    var content = document.getElementById('studyContent');
    var complete = document.getElementById('studyComplete');
    var empty = document.getElementById('studyEmpty');
    var modeSelect = document.getElementById('studyModeSelect');

    /* 尝试恢复未完成的学习进度 */
    if (App.studyQueue.length === 0 && App.restoreStudyProgress()) {
      /* 已恢复进度，继续显示学习内容 */
      var guideEl = document.getElementById('studyModeGuide');
      if (guideEl) guideEl.remove();
      noDeck.style.display = 'none';
      empty.style.display = 'none';
      content.style.display = 'block';
      var studyHeader = document.querySelector('#studyContent .study-header');
      var cardScene = document.querySelector('#studyContent .card-scene');
      var studyActions = document.querySelector('#studyContent .study-actions');
      if (studyHeader) studyHeader.style.display = '';
      if (cardScene) cardScene.style.display = '';
      if (studyActions) studyActions.style.display = '';
      App.showToast('📌 已恢复上次学习进度 (' + (App.studyIndex + 1) + '/' + App.studyQueue.length + ')', 'info', 2000);
    }

    noDeck.style.display = 'none';
    content.style.display = 'none';
    complete.style.display = 'none';
    empty.style.display = 'none';

    if (!App.isReviewMode) {
      if (!deck) { noDeck.style.display = 'block'; return; }
      if (deck.cards.length === 0) { empty.style.display = 'block'; return; }
    }

    /* 学习完成状态 */
    if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) {
      /* 如果没有队列内容，显示模式选择引导（深度模式完成时 completedWords>0，不误进引导） */
      if (App.studyQueue.length === 0 && App.studyIndex === 0 && App.studyCompletedWords === 0) {
        content.style.display = 'block';
        App._renderModeGuide(deck);
        return;
      }

      complete.style.display = 'block';
      /* 完成统计用按卡去重口径（对齐小程序 complete 页 uniqueResults） */
      var uniqueResults = App.dedupeStudyResults ? App.dedupeStudyResults(App.studyResults || []) : [];
      var uniquePassed = uniqueResults.filter(function (r) { return r.passed; }).length;
      var uniqueFailed = uniqueResults.length - uniquePassed;
      var total = uniqueResults.length > 0 ? uniqueResults.length : (App.studyPassed + App.studyFailed);
      var accuracy = total > 0 ? Math.round(
        (uniqueResults.length > 0 ? uniquePassed : App.studyPassed) / total * 100
      ) : 0;
      /* ✅/❌ 与 accuracy 同口径（按卡去重，先错后对的卡只计最终结果） */
      var displayPassed = uniqueResults.length > 0 ? uniquePassed : App.studyPassed;
      var displayFailed = uniqueResults.length > 0 ? uniqueFailed : App.studyFailed;
      var elapsedSec = App.studyStartTime ? Math.round((Date.now() - App.studyStartTime) / 1000) : 0;
      var min = Math.floor(elapsedSec / 60);
      var sec = elapsedSec % 60;
      var timeStr = min > 0 ? min + '分' + sec + '秒' : sec + '秒';
      var rate = total > 0 && elapsedSec > 0 ? Math.round(total / elapsedSec * 60) : 0;

      var modeLabel = '';
      if (App.studyMode === 'new') modeLabel = ' 📖 新词学习';
      else if (App.studyMode === 'review') modeLabel = ' 🔁 复习巩固';
      else if (App.studyMode === 'failed') modeLabel = ' 📋 错题强化';
      else if (App.studyMode === 'quick') modeLabel = ' ⚡ 快速浏览';

      var title = displayFailed === 0 ? '完美通关！🎉' :
        accuracy >= 70 ? '不错哦！👍' : '继续加油！💪';

      document.getElementById('completeTitle').textContent = title;
      document.getElementById('completeStats').innerHTML =
        '<div class="complete-mode-badge">' + modeLabel + '</div>' +
        '<div class="complete-stats-row">' +
          '<span class="complete-stat">✅ ' + displayPassed + '</span>' +
          '<span class="complete-stat">❌ ' + displayFailed + '</span>' +
          '<span class="complete-stat">🎯 ' + accuracy + '%</span>' +
        '</div>' +
        '<div class="complete-stats-row" style="margin-top:8px;">' +
          '<span class="complete-stat">⏱ ' + timeStr + '</span>' +
          '<span class="complete-stat">⚡ ' + rate + '词/分</span>' +
        '</div>';

      /* 按钮区域 */
      var restartBtn = document.getElementById('btnRestart');
      var reviewFailedBtn = document.getElementById('btnReviewRound');
      var exitBtn2 = document.getElementById('btnExitReview');

      if (App.isReviewMode) {
        restartBtn.textContent = '🔄 再复习一轮';
        restartBtn.onclick = App.startFailedReview;
        if (!exitBtn2) {
          exitBtn2 = document.createElement('button');
          exitBtn2.id = 'btnExitReview';
          exitBtn2.className = 'btn btn-outline';
          exitBtn2.textContent = '↩ 退出复习';
          exitBtn2.onclick = function () { App.exitReviewMode(); };
          restartBtn.parentNode.appendChild(exitBtn2);
        }
        exitBtn2.style.display = '';
        if (reviewFailedBtn) reviewFailedBtn.style.display = 'none';
      } else {
        restartBtn.textContent = {
          'new': '📖 再学一组新词',
          'review': '🔁 再来一组复习',
          'failed': '🔄 再复习一轮',
          'quick': '⚡ 再快速过一遍',
        }[App.studyMode] || '再来一轮';

        restartBtn.onclick = function () {
          if (App.studyMode === 'new') App.startNewWords();
          else if (App.studyMode === 'review') App.startReview();
          else if (App.studyMode === 'quick') App.startQuickMode();
          else App.startReview();
        };

        if (exitBtn2) exitBtn2.style.display = 'none';

        if (displayFailed > 0) {
          if (!reviewFailedBtn) {
            reviewFailedBtn = document.createElement('button');
            reviewFailedBtn.id = 'btnReviewRound';
            reviewFailedBtn.className = 'btn btn-outline';
            reviewFailedBtn.style.marginTop = '8px';
            restartBtn.parentNode.appendChild(reviewFailedBtn);
          }
          reviewFailedBtn.textContent = '📋 复习本轮 ' + displayFailed + ' 个错题';
          reviewFailedBtn.style.display = '';
          reviewFailedBtn.onclick = App.startFailedReview;
        } else {
          if (reviewFailedBtn) reviewFailedBtn.style.display = 'none';
        }
      }
      return;
    }

    /* 正常学习状态 */
    content.style.display = 'block';
    if (modeSelect) modeSelect.style.display = 'none';

    /* 清除模式引导 + 恢复被隐藏的学习组件（修复从引导进入学习时的 bug） */
    var guideEl = document.getElementById('studyModeGuide');
    if (guideEl) guideEl.remove();
    var studyHeader = document.querySelector('#studyContent .study-header');
    var cardScene = document.querySelector('#studyContent .card-scene');
    var studyActions = document.querySelector('#studyContent .study-actions');
    if (studyHeader) studyHeader.style.display = '';
    if (cardScene) cardScene.style.display = '';
    if (studyActions) studyActions.style.display = '';

    /* 拼写模式区域 + 拼写 UI（随每次渲染重建：作答按钮显隐、切换按钮文案；槽位在正面动态渲染） */
    var spellSection = document.getElementById('spellModeSection');
    if (spellSection) spellSection.style.display = 'block';
    /* 重置拼写状态 */
    App._resetSpellState();
    var toggleBtn = document.getElementById('btnToggleSpell');
    var failBtnEl = document.getElementById('btnFail');
    var passBtnEl = document.getElementById('btnPass');
    if (App.spellMode) {
      if (toggleBtn) { toggleBtn.textContent = '🔤 退出拼写'; toggleBtn.classList.add('spell-active'); }
      /* 拼写为纯练习：隐藏作答按钮，退出拼写模式后恢复 */
      if (failBtnEl) failBtnEl.style.display = 'none';
      if (passBtnEl) passBtnEl.style.display = 'none';
    } else {
      if (toggleBtn) { toggleBtn.textContent = '⌨️ 拼写模式'; toggleBtn.classList.remove('spell-active'); }
      if (failBtnEl) failBtnEl.style.display = '';
      if (passBtnEl) passBtnEl.style.display = '';
    }

    /* 深度模式：「上一个」按钮可见 + 回看状态禁用作答按钮 */
    var prevBtn = document.getElementById('btnPrevCard');
    if (prevBtn) prevBtn.style.display = (App.studyMode === 'new') ? '' : 'none';
    if (App.studyMode === 'new' && App.isReviewing) {
      if (passBtnEl) passBtnEl.disabled = true;
      if (failBtnEl) failBtnEl.disabled = true;
      if (prevBtn) prevBtn.textContent = '↩ 返回原位置';
    } else {
      if (passBtnEl) passBtnEl.disabled = false;
      if (failBtnEl) failBtnEl.disabled = false;
      if (prevBtn) prevBtn.textContent = '← 上一个';
    }

    var card = App.studyQueue[App.studyIndex];
    var modeTag = {
      'new': '📖 新词学习',
      'review': '🔁 复习巩固',
      'failed': '📋 错题强化',
      'quick': '⚡ 快速浏览',
    }[App.studyMode] || '';

    var deckName = App.isReviewMode
      ? '📋 错题复习'
      : (deck ? deck.name : '');
    document.getElementById('studyDeckName').innerHTML = App.isReviewMode
      ? '<span class="review-mode-badge">📋 错题复习</span> ' + App.escHtml(card._deckName || '')
      : '<span class="mode-tag mode-' + App.studyMode + '">' + modeTag + '</span> ' + App.escHtml(deckName);

    /* 深度模式：按已完成词数显示；其余模式按索引显示 */
    if (App.studyMode === 'new') {
      document.getElementById('studyProgress').textContent =
        '已学 ' + App.studyCompletedWords + ' / ' + App.studyInitialQueueLength + ' 词' +
        (App.isReviewing ? ' · 回看中' : '');
      document.getElementById('progressFill').style.width =
        ((App.studyCompletedWords / Math.max(1, App.studyInitialQueueLength)) * 100) + '%';
    } else {
      document.getElementById('studyProgress').textContent =
        '第 ' + (App.studyIndex + 1) + ' / ' + App.studyQueue.length + ' 张' +
        (App.isReviewMode ? ' · 来源: ' + (card._deckName || '') : '');
      document.getElementById('progressFill').style.width =
        ((App.studyIndex / App.studyQueue.length) * 100) + '%';
    }

    /* 正面（拼写模式为盲拼槽位：逐格输入字母，不显示词形/音标/释义；判定反馈在格子下方卡片内部） */
    var frontHtml;
    var frontHint = document.querySelector('#flashcard .card-front .card-hint');
    if (App.spellMode) {
      frontHtml = '<div class="spell-slots">' + App.buildSpellSlotHtml(card) + '</div>' +
        '<div class="spell-feedback" id="spellFeedback"></div>' +
        '<div class="spell-blind-sub">听发音拼写</div>';
      if (frontHint) frontHint.textContent = '🔊 听发音，在卡片上拼写';
    } else {
      frontHtml = App.escHtml(App.getCardFront(card));
      if (card.phonetic) {
        frontHtml += ' <span class="card-front-phonetic">' + App.escHtml(card.phonetic) + '</span>';
      }
      /* 深度模式计数点 ●●○（剩余出现次数，对齐小程序） */
      if (App.studyMode === 'new' && !App.isReviewMode) {
        var dotsRemaining = 3 - (card._sessionAppearances || 0);
        var dotsHtml = '';
        for (var di = 0; di < 3; di++) dotsHtml += di < dotsRemaining ? '●' : '○';
        frontHtml += ' <span class="eb-dots" title="剩余出现次数">' + dotsHtml + '</span>';
      }
      if (frontHint) frontHint.textContent = '👆 点击卡片翻转查看答案';
    }

    /* 难度 + 艾宾浩斯阶段（盲拼时不渲染，防泄漏阶段信息） */
    var sourceDeck = deck;
    if (App.isReviewMode && card._deckId) {
      sourceDeck = App.getDeck(card._deckId);
    }
    var deckCard = sourceDeck ? sourceDeck.cards.find(function (c) { return c.id === card.id; }) : null;
    var ef = deckCard ? deckCard.easeFactor : card.easeFactor;

    var diffHtml = '';
    if (!App.spellMode) {
      if (typeof ef === 'number') {
        var level = ef >= 2.8 ? 3 : ef >= 2.0 ? 2 : 1;
        var levelText = ef >= 2.8 ? '已掌握' : ef >= 2.0 ? '学习中' : '较难';
        var levelColor = ef >= 2.8 ? 'var(--success)' : ef >= 2.0 ? 'var(--warning)' : 'var(--danger-text)';
        var dots = '';
        for (var d = 0; d < 3; d++) dots += d < level ? '●' : '○';
        diffHtml = '<div class="card-diff-badge" style="color:' + levelColor + ';border-color:' + levelColor + ';">' +
          dots + ' ' + levelText + '</div>';
      }

      /* 艾宾浩斯阶段标签 */
      var ebStage = deckCard ? deckCard.ebbinghausStage : card.ebbinghausStage;
      if (typeof ebStage === 'number' && ebStage > 0 && ebStage < App.EB_MASTERED_STAGE) {
        diffHtml += '<div class="eb-stage-badge">🧠 ' + App.EB_STAGES[ebStage].label + '</div>';
      } else if (ebStage >= App.EB_MASTERED_STAGE) {
        diffHtml += '<div class="eb-stage-badge eb-mastered">✅ 已掌握</div>';
      }
    }

    document.getElementById('cardFrontText').innerHTML = frontHtml + diffHtml;

    /* 背面 — 优先使用源牌组中的完整卡片数据 */
    var parts = [];
    var renderCard = deckCard || card;
    var defs = (renderCard.definitions && renderCard.definitions.length)
      ? renderCard.definitions : [renderCard.back || ''];
    if (!Array.isArray(defs)) defs = [defs];
    var phonetic = renderCard.phonetic || '';
    var pos = renderCard.pos || '';

    if (phonetic || pos) {
      parts.push('<div class="card-phonetic-pos">' +
        (phonetic ? '<span class="card-phonetic">' + App.escHtml(phonetic) + '</span>' : '') +
        (pos ? '<span class="card-pos-tag">' + App.escHtml(pos) + '</span>' : '') +
      '</div>');
    }

    parts.push('<div class="card-defs">' + defs.map(function (d, i) {
      return '<div class="card-def-item">' + (defs.length > 1 ? (i + 1) + '. ' : '') + App.escHtml(d) + '</div>';
    }).join('') + '</div>');

    var phrases = renderCard.phrases || [];
    if (phrases.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">词组搭配</div>' +
        phrases.map(function (p) {
          return '<div class="card-phrase"><span class="phrase-en">' + App.escHtml(p.en) + '</span><span class="phrase-zh">' + App.escHtml(p.zh) + '</span></div>';
        }).join('') + '</div>');
    }

    var sentences = renderCard.sentences || [];
    if (sentences.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">例句</div>' +
        sentences.map(function (s) {
          return '<div class="card-sentence"><div class="sentence-en">' + App.escHtml(s.en) + '</div>' +
            (s.zh ? '<div class="sentence-zh">' + App.escHtml(s.zh) + '</div>' : '') + '</div>';
        }).join('') + '</div>');
    }

    var synonyms = renderCard.synonyms || [];
    var antonyms = renderCard.antonyms || [];
    if (synonyms.length > 0 || antonyms.length > 0) {
      var synAnt = '';
      if (synonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">同:</span> ' + App.escHtml(synonyms.join(', ')) + '</div>';
      if (antonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">反:</span> ' + App.escHtml(antonyms.join(', ')) + '</div>';
      parts.push('<div class="card-section">' + synAnt + '</div>');
    }

    var confused = renderCard.confused || [];
    if (confused.length > 0) {
      parts.push('<div class="card-section"><div class="card-confused"><span class="syn-ant-label">易混淆:</span> ' + App.escHtml(confused.join(', ')) + '</div></div>');
    }

    /* 艾宾浩斯单轨信息（v2.8：调度日期仅 ebbinghausNextReview） */
    if (renderCard.ebbinghausNextReview) {
      var ebInfo = '';
      var ebS = deckCard ? deckCard.ebbinghausStage : renderCard.ebbinghausStage;
      if (typeof ebS === 'number') {
        ebInfo = ' | 艾宾浩斯: L' + ebS + ' ' + (App.EB_STAGES[ebS] ? App.EB_STAGES[ebS].label : '');
      }
      parts.push('<div class="card-sm2-info">' +
        '下次复习: ' + renderCard.ebbinghausNextReview +
        ' | EF: ' + (renderCard.easeFactor || 2.5).toFixed(1) +
        ebInfo +
      '</div>');
    }

    document.getElementById('cardBackText').innerHTML = parts.join('');

    var el = document.getElementById('flashcard');
    el.classList.remove('flipped');
    el.style.removeProperty('transform');
    App.isFlipped = false;

    /* 自动播放当前词发音（对齐小程序 speakCurrentCard：换卡 300ms 后自动朗读；仅学习面板可见时播） */
    var studyPanelEl = document.getElementById('panelStudy');
    if (!studyPanelEl || !studyPanelEl.classList.contains('visible')) return;
    if (App._speakTimer) { clearTimeout(App._speakTimer); App._speakTimer = null; }
    App._speakTimer = setTimeout(function () {
      App._speakTimer = null;
      var currentCard = App.studyQueue[App.studyIndex];
      if (currentCard && typeof App.speak === 'function') {
        App.speak(App.getCardFront(currentCard));
      }
    }, 300);
  };

  /** 渲染模式引导界面 */
  App._renderModeGuide = function (deck) {
    /* 隐藏学习内容，改为显示模式选择引导 */
    document.getElementById('studyContent').style.display = 'block';

    var ebStats = App.getEbbinghausStats(deck);
    var newCount = ebStats.newWords;
    var reviewCount = ebStats.dueToday;
    var masteredCount = ebStats.mastered;
    var overdueCount = ebStats.overdue;

    var guideHtml =
      '<div class="mode-guide">' +
        '<h3 class="mode-guide-title">选择学习模式</h3>' +
        '<div class="mode-guide-subtitle">' + App.escHtml(deck.name) + ' · ' + deck.cards.length + ' 个单词</div>' +

        '<div class="mode-cards">' +

          /* 新词学习 */
          '<div class="mode-card" id="modeCardNew">' +
            '<div class="mode-card-icon">📖</div>' +
            '<div class="mode-card-body">' +
              '<div class="mode-card-title">学习新词</div>' +
              '<div class="mode-card-desc">从未学过的单词，开始第一轮学习</div>' +
              '<div class="mode-card-count ' + (newCount > 0 ? '' : 'count-empty') + '">' +
                newCount + ' 个新词可用' +
              '</div>' +
            '</div>' +
            '<div class="mode-card-arrow">→</div>' +
          '</div>' +

          /* 复习巩固 */
          '<div class="mode-card ' + (reviewCount > 0 ? 'mode-card-primary' : '') + '" id="modeCardReview">' +
            '<div class="mode-card-icon">🔁</div>' +
            '<div class="mode-card-body">' +
              '<div class="mode-card-title">今日复习</div>' +
              '<div class="mode-card-desc">按艾宾浩斯遗忘曲线，复习今日到期的单词</div>' +
              '<div class="mode-card-count ' + (reviewCount > 0 ? 'count-urgent' : 'count-empty') + '">' +
                reviewCount + ' 个待复习' + (overdueCount > 0 ? '（含 ' + overdueCount + ' 个逾期）' : '') +
              '</div>' +
            '</div>' +
            '<div class="mode-card-arrow">→</div>' +
          '</div>' +

          /* 错题强化 */
          '<div class="mode-card" id="modeCardFailed">' +
            '<div class="mode-card-icon">📋</div>' +
            '<div class="mode-card-body">' +
              '<div class="mode-card-title">错题强化</div>' +
              '<div class="mode-card-desc">集中攻克所有牌组中 EF≤1.8 的难词</div>' +
              '<div class="mode-card-count">跨牌组收集</div>' +
            '</div>' +
            '<div class="mode-card-arrow">→</div>' +
          '</div>' +

          /* 快速浏览 */
          '<div class="mode-card" id="modeCardQuick">' +
            '<div class="mode-card-icon">⚡</div>' +
            '<div class="mode-card-body">' +
              '<div class="mode-card-title">快速浏览</div>' +
              '<div class="mode-card-desc">线性过词快速刷词，进度独立记录，不影响深度复习</div>' +
              '<div class="mode-card-count">' + deck.cards.length + ' 个单词过一遍</div>' +
            '</div>' +
            '<div class="mode-card-arrow">→</div>' +
          '</div>' +

        '</div>' +

        /* 学习概览 */
        '<div class="mode-overview">' +
          '<div class="mode-overview-item">' +
            '<span class="overview-num overview-new">' + newCount + '</span>' +
            '<span class="overview-label">新词</span>' +
          '</div>' +
          '<div class="mode-overview-item">' +
            '<span class="overview-num overview-review">' + reviewCount + '</span>' +
            '<span class="overview-label">待复习</span>' +
          '</div>' +
          '<div class="mode-overview-item">' +
            '<span class="overview-num overview-mastered">' + masteredCount + '</span>' +
            '<span class="overview-label">已掌握</span>' +
          '</div>' +
          '<div class="mode-overview-item">' +
            '<span class="overview-num overview-progress">' +
              Math.round((deck.cards.length - newCount) / Math.max(1, deck.cards.length) * 100) + '%' +
            '</span>' +
            '<span class="overview-label">总进度</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* 替换 studyContent 下的内容（保留 header + scene 容器但隐藏它们） */
    var studyHeader = document.querySelector('#studyContent .study-header');
    var cardScene = document.querySelector('#studyContent .card-scene');
    var studyActions = document.querySelector('#studyContent .study-actions');

    /* 移除旧的引导区域 */
    var oldGuide = document.getElementById('studyModeGuide');
    if (oldGuide) oldGuide.remove();

    /* 创建引导区域 */
    var guideEl = document.createElement('div');
    guideEl.id = 'studyModeGuide';
    guideEl.innerHTML = guideHtml;

    /* 插入到 studyContent 的最前面 */
    var studyContent = document.getElementById('studyContent');
    studyContent.insertBefore(guideEl, studyContent.firstChild);

    /* 隐藏学习组件 */
    if (studyHeader) studyHeader.style.display = 'none';
    if (cardScene) cardScene.style.display = 'none';
    if (studyActions) studyActions.style.display = 'none';
    var spellSection = document.getElementById('spellModeSection');
    if (spellSection) spellSection.style.display = 'none';

    /* 绑定事件 */
    document.getElementById('modeCardNew').addEventListener('click', function () {
      App.studyMode = 'new';
      App.startNewWords();
    });
    document.getElementById('modeCardReview').addEventListener('click', function () {
      App.studyMode = 'review';
      App.startReview();
    });
    document.getElementById('modeCardFailed').addEventListener('click', function () {
      App.studyMode = 'failed';
      App.startFailedReview();
    });
    document.getElementById('modeCardQuick').addEventListener('click', function () {
      App.studyMode = 'quick';
      App.startQuickMode();
    });
  };

  /* ========== 作答 ========== */
  App.answerStudy = function (passed) {
    if (App.isReviewing) return; /* 回看状态禁止作答（对齐小程序 markAnswer 首行守卫） */
    /* 会了/不会直接作答推进；翻转仅由点击卡片触发（对齐小程序） */

    var card = App.studyQueue[App.studyIndex];
    var deck = App.isReviewMode && card._deckId ? App.getDeck(card._deckId) : App.getCurrentDeck();
    var deckCard = deck ? deck.cards.find(function (c) { return c.id === card.id; }) : null;

    if (App.studyMode === 'quick') {
      /* 快速模式：仅 stage 0→1（stage>0 答对原样保留），答错追踪（对齐小程序）；卡已删除时跳过作答仅推进 */
      if (deckCard) {
        App.applyQuickResult(deckCard, passed);
        card.ebbinghausStage = deckCard.ebbinghausStage;
        card.ebbinghausNextReview = deckCard.ebbinghausNextReview;
        card.repetitions = deckCard.repetitions;
        card.easeFactor = deckCard.easeFactor;
        card.ebbinghausHistory = deckCard.ebbinghausHistory;
        card.wrongCount = deckCard.wrongCount;
        card.wrongDates = deckCard.wrongDates;
        card._consecutiveFails = deckCard._consecutiveFails;

        if (passed) { App.studyPassed++; }
        else { App.studyFailed++; }

        /* 记录作答结果（会话完成时按卡去重汇总写入 quick 独立日志） */
        App.studyResults = App.studyResults || [];
        App.studyResults.push({ cardId: deckCard.id, word: deckCard.word || deckCard.front, passed: passed });
      }
    } else if (deckCard) {
      /* 单轨：统一走艾宾浩斯（EF/repetitions/智能回退/逾期惩罚均在此维护，与小程序一致） */
      App.applyEbbinghaus(deckCard, passed, passed ? 'correct' : 'wrong');

      /* 答错追踪（错词本与紧急度排序依赖） */
      if (!passed) {
        deckCard.wrongCount = (deckCard.wrongCount || 0) + 1;
        deckCard.wrongDates = deckCard.wrongDates || [];
        deckCard.wrongDates.push(new Date().toISOString().slice(0, 10));
      }

      /* 同步回队列副本 */
      card.easeFactor = deckCard.easeFactor;
      card.repetitions = deckCard.repetitions;
      card.ebbinghausStage = deckCard.ebbinghausStage;
      card.ebbinghausNextReview = deckCard.ebbinghausNextReview;
      card.wrongCount = deckCard.wrongCount;
      card.wrongDates = deckCard.wrongDates;

      if (passed) { App.studyPassed++; }
      else { App.studyFailed++; }

      /* 记录作答结果（会话完成时按卡去重汇总写入日志） */
      App.studyResults = App.studyResults || [];
      App.studyResults.push({ cardId: deckCard.id, word: deckCard.word || deckCard.front, passed: passed });
    }

    /* 深度（new）模式：动态队列 splice + 按阶段重插；其余模式线性推进（对齐小程序） */
    if (App.studyMode === 'new') {
      card._sessionAppearances = (card._sessionAppearances || 0) + 1;
      var deepIdx = App.studyIndex;
      App.studyLastCardId = card.id;
      App.studyQueue.splice(deepIdx, 1);
      var reinsertPos = App.computeDeepReinsert(App.studyQueue, deepIdx, card, passed, card._sessionAppearances);
      if (reinsertPos >= 0) {
        App.studyQueue.splice(reinsertPos, 0, card);
      } else {
        /* 出现≥3次或阶段≥4：永久移出 */
        App.studyCompletedWords++;
      }
      /* studyIndex 保持不动：splice 后下一张自动顶上 */
    } else {
      App.studyIndex++;
      App.studyCompletedWords++;
    }
    App.isFlipped = false;
    App.saveData();
    App.saveStudyProgress();
    App.updateNavBadges();

    if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) {
      /* 会话完成：按卡去重汇总写入学习日志（对齐小程序 saveProgress） */
      if (App.finalizeStudyLog) App.finalizeStudyLog();

      /* 完成时恢复学习组件显示 */
      var guideEl2 = document.getElementById('studyModeGuide');
      if (guideEl2) guideEl2.remove();
      var header2 = document.querySelector('#studyContent .study-header');
      var scene2 = document.querySelector('#studyContent .card-scene');
      var actions2 = document.querySelector('#studyContent .study-actions');
      if (header2) header2.style.display = '';
      if (scene2) scene2.style.display = '';
      if (actions2) actions2.style.display = '';
      var spellSection2 = document.getElementById('spellModeSection');
      if (spellSection2) spellSection2.style.display = 'none';

      App.renderStudyPanel();
      App.renderDeckSelect();
    } else {
      App.renderStudyPanel();
    }
  };

  /* ========== 拼写模式 ========== */

  App.toggleSpellMode = function () {
    if (App.isReviewing) return; /* 回看态禁拼写（与 checkSpelling 守卫一致） */
    App.spellMode = !App.spellMode;
    /* UI 全权交给 renderStudyPanel 重建（盲拼槽位/按钮显隐/切换文案），并触发一次自动播放（对齐小程序进拼写页播一次） */
    App.renderStudyPanel();
    if (App.spellMode) {
      var firstSlot = document.querySelector('.spell-slots .spell-slot');
      if (firstSlot) firstSlot.focus();
    }
  };

  /** 槽位化盲拼：字母→单字符输入框（仅字母槽连续编号），空白→间隔，其余字符→固定展示 */
  App.buildSpellSlotHtml = function (card) {
    var word = card.front || card.word || '';
    var html = '';
    var idx = 0;
    word.split(/\s+/).forEach(function (group, gi) {
      if (gi > 0) html += '<span class="spell-slot-gap"></span>';
      group.split('').forEach(function (ch) {
        if (/[a-zA-Z]/.test(ch)) {
          html += '<input class="spell-slot" type="text" maxlength="1" autocomplete="off"' +
            ' autocapitalize="none" autocorrect="off" spellcheck="false"' +
            ' data-idx="' + idx + '" aria-label="第 ' + (idx + 1) + ' 个字母">';
          idx++;
        } else {
          html += '<span class="spell-slot-fixed">' + App.escHtml(ch) + '</span>';
        }
      });
    });
    return html;
  };

  /* 错误高亮时长（毫秒），测试用常量 */
  App.SPELL_WRONG_DELAY = 600;

  /** 读取全部槽位拼接值（DOM 序 == data-idx 序） */
  App.readSpellSlots = function () {
    var slots = document.querySelectorAll('.spell-slots .spell-slot');
    var out = '';
    for (var i = 0; i < slots.length; i++) out += slots[i].value;
    return out;
  };

  /** 清空槽位值/解除禁用/移除错误与正确高亮类 */
  App._clearSpellSlots = function (slots) {
    for (var i = 0; i < slots.length; i++) {
      slots[i].value = '';
      slots[i].disabled = false;
      slots[i].classList.remove('spell-slot-wrong');
      slots[i].classList.remove('spell-slot-correct');
    }
  };

  /** 拼写检查（纯练习：不翻卡、不推进队列、不写学习日志；对/错均停留当前词，可重拼/重试） */
  App.checkSpelling = function () {
    if (App.isReviewing) return; /* 回看状态禁止拼写作答（与 answerStudy 守卫一致） */
    if (!App.spellMode) return;
    if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) return;

    var feedback = document.getElementById('spellFeedback');
    var userInput = App.readSpellSlots().trim();
    if (!userInput) return;

    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    var slots = document.querySelectorAll('.spell-slots .spell-slot');
    var card = App.studyQueue[App.studyIndex];
    /* 两侧统一剥除非字母：撇号/连字符是槽位中的固定展示，不可输入 */
    var correctAnswer = (card.front || card.word || '').toLowerCase().replace(/[^a-z]/g, '');
    var normalized = userInput.toLowerCase();

    if (normalized === correctAnswer) {
      /* 正确：✅ + 朗读 + 字母保留槽位（绿色边框，不清空重拼，对齐小程序 slot-correct），停留当前词 */
      feedback.textContent = '✅ 拼写正确！' + (card.phonetic ? ' ' + card.phonetic : '');
      feedback.className = 'spell-feedback spell-correct';
      for (var ci = 0; ci < slots.length; ci++) {
        slots[ci].classList.remove('spell-slot-wrong');
        slots[ci].classList.add('spell-slot-correct');
      }
      if (typeof App.speak === 'function') App.speak(card.front || card.word);
    } else {
      /* 错误：❌ + 正确答案 + 槽位短暂红色高亮（禁入），600ms 后清空重拼且答案消失（防照着拼写） */
      feedback.innerHTML = '❌ 正确答案：<strong>' + App.escHtml(card.front || card.word) + '</strong>';
      feedback.className = 'spell-feedback spell-wrong';
      for (var i = 0; i < slots.length; i++) {
        slots[i].disabled = true;
        slots[i].classList.add('spell-slot-wrong');
      }
      App._spellWrongTimer = setTimeout(function () {
        App._spellWrongTimer = null;
        var freshSlots = document.querySelectorAll('.spell-slots .spell-slot');
        App._clearSpellSlots(freshSlots);
        var freshFeedback = document.getElementById('spellFeedback');
        if (freshFeedback) { freshFeedback.textContent = ''; freshFeedback.className = 'spell-feedback'; }
        var firstWrong = document.querySelector('.spell-slots .spell-slot');
        if (firstWrong) firstWrong.focus();
      }, App.SPELL_WRONG_DELAY);
    }
  };

  /** 重置拼写状态（切换卡片/开关拼写时调用；槽位随后由 innerHTML 重建，此处为防御性清理） */
  App._resetSpellState = function () {
    if (App._spellWrongTimer) { clearTimeout(App._spellWrongTimer); App._spellWrongTimer = null; }
    var feedback = document.getElementById('spellFeedback');
    if (feedback) { feedback.textContent = ''; feedback.className = 'spell-feedback'; }
    var slots = document.querySelectorAll('.spell-slots .spell-slot');
    App._clearSpellSlots(slots);
  };

  /* ========== 槽位输入事件委托 ==========
   * 槽位由 renderStudyPanel 每次重建 innerHTML，故在 document 上委托
   * （绑定在 IIFE 顶层而非 app.js init：测试环境不加载 app.js，此处加载时 document 已存在） */

  /* 输入：值过滤（仅字母、取末字符）→ 自动跳格 → 末槽且全满才自动判定 */
  document.addEventListener('input', function (e) {
    if (!App.spellMode) return;
    var slot = e.target.closest && e.target.closest('.spell-slot');
    if (!slot) return;
    /* 正确后修改字母 → 回到输入态，清除陈旧 ✅ 与绿色高亮（对齐小程序 handleSlotInput） */
    var fbEl = document.getElementById('spellFeedback');
    if (fbEl && fbEl.className.indexOf('spell-correct') >= 0) {
      fbEl.textContent = '';
      fbEl.className = 'spell-feedback';
      var allSlots = document.querySelectorAll('.spell-slots .spell-slot');
      for (var k = 0; k < allSlots.length; k++) allSlots[k].classList.remove('spell-slot-correct');
    }
    var v = (slot.value || '').replace(/[^a-zA-Z]/g, '');
    slot.value = v ? v.slice(-1) : '';
    if (!v) return;
    var slots = document.querySelectorAll('.spell-slots .spell-slot');
    var i = [].indexOf.call(slots, slot);
    if (i < slots.length - 1) { slots[i + 1].focus(); return; }
    /* 末格：全部槽位填满才自动判定（防乱序填充误判） */
    for (var j = 0; j < slots.length; j++) { if (!slots[j].value) return; }
    App.checkSpelling();
  });

  /* Backspace：空槽回退上一格并清空其值（有字符时交给浏览器默认删除） */
  document.addEventListener('keydown', function (e) {
    if (!App.spellMode) return;
    var slot = e.target.closest && e.target.closest('.spell-slot');
    if (!slot || e.key !== 'Backspace' || slot.value) return;
    var slots = document.querySelectorAll('.spell-slots .spell-slot');
    var i = [].indexOf.call(slots, slot);
    if (i > 0) { e.preventDefault(); slots[i - 1].value = ''; slots[i - 1].focus(); }
  });

  /* 移动端键盘避让（槽位 focus 时滚动到可视区；jsdom 无 visualViewport/scrollIntoView，防御跳过） */
  document.addEventListener('focusin', function (e) {
    if (!App.spellMode) return;
    var slot = e.target.closest && e.target.closest('.spell-slot');
    if (!slot) return;
    setTimeout(function () {
      if (window.visualViewport) {
        var offset = slot.getBoundingClientRect().bottom - window.visualViewport.height + 20;
        if (offset > 0 && window.scrollBy) window.scrollBy({ top: offset, behavior: 'smooth' });
      } else if (slot.scrollIntoView) {
        slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  });

})(FlashcardApp);
