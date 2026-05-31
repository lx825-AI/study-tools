/* study-panel.js —— 翻卡学习（支持多模式 + 艾宾浩斯） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.studyQueue = [];
  App.studyIndex = 0;
  App.isFlipped = false;
  App.studyPassed = 0;
  App.studyFailed = 0;
  App.studyOrder = 'difficulty';      // 'difficulty' | 'random' | 'sequential'
  App.studyStartTime = null;
  App.spellMode = false;              /* 拼写模式开关 */
  App.spellAnswered = false;          /* 当前卡片是否已拼写作答 */

  /* 学习模式: 'new' | 'review' | 'failed' | 'mixed' */
  App.studyMode = 'review';
  /* 每次新词学习数量 */
  App.newWordsPerSession = parseInt(localStorage.getItem('flashcard-new-words-per-session') || '10', 10);

  App.isReviewMode = false;
  App.reviewSourceDeckId = null;

  /* ========== SM-2 间隔重复算法 ========== */
  App.applySM2 = function (card, passed) {
    if (card.repetitions === undefined) card.repetitions = 0;
    if (card.easeFactor === undefined) card.easeFactor = 2.5;
    if (card.interval === undefined) card.interval = 0;

    if (passed) {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions++;
    } else {
      card.repetitions = 0;
      card.interval = 1;
      card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
    }

    var next = new Date();
    next.setDate(next.getDate() + card.interval);
    card.nextReview = next.toISOString().slice(0, 10);

    card.difficulty = Math.max(0, Math.min(App.DIFFICULTY_MAX, Math.round((3.0 - card.easeFactor) * 3)));
  };

  /* ========== 队列构建（按模式） ========== */
  App.buildStudyQueue = function (deck) {
    var cards;

    if (App.studyMode === 'new') {
      cards = App.getNewWordCards(deck, App.newWordsPerSession);
    } else if (App.studyMode === 'review') {
      cards = App.getReviewCards(deck);
    } else {
      /* mixed / legacy: 所有卡片 */
      cards = deck.cards.map(function (c) { return Object.assign({}, c); });
    }

    /* 排序 */
    if (App.studyOrder === 'random') {
      for (var i = cards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp;
      }
    } else if (App.studyOrder === 'sequential') {
      /* 保持原序 */
    } else {
      /* difficulty: 低 EF 优先（难的在前） */
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
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.studyStartTime = Date.now();
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
    App.studyStartTime = Date.now();
    App.renderStudyPanel();
  };

  /** 智能混合：复习优先 + 新词补充 */
  App.startMixed = function () {
    var deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;

    App.studyMode = 'mixed';
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;

    var reviewCards = App.getReviewCards(deck);
    var newCards = App.getNewWordCards(deck, Math.max(3, App.newWordsPerSession - reviewCards.length));

    App.studyQueue = reviewCards.concat(newCards);
    /* 低 EF 优先 */
    App.studyQueue.sort(function (a, b) {
      return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
    });

    if (App.studyQueue.length === 0) {
      App.showToast('✅ 暂无学习内容', 'info', 2000);
      App.renderStudyPanel();
      return;
    }

    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.studyStartTime = Date.now();
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
    App.studyStartTime = Date.now();
    App.renderStudyPanel();
    App.showToast('📋 错题复习模式：共 ' + App.studyQueue.length + ' 个需强化记忆的词', 'info', 2500);
  };

  App.exitReviewMode = function () {
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;
    App.studyMode = 'review';
    App.startReview();
  };

  /* 返回到模式选择界面 */
  App.returnToModeSelect = function () {
    App.studyQueue = [];
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.spellMode = false;
    App.spellAnswered = false;
    App.isReviewMode = false;
    App.reviewSourceDeckId = null;
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
        order: App.studyOrder,
        queue: App.studyQueue,
        index: App.studyIndex,
        passed: App.studyPassed,
        failed: App.studyFailed,
        startTime: App.studyStartTime,
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
      if (Date.now() - progress.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem('flashcard-study-progress');
        return false;
      }
      App.studyMode = progress.mode || 'review';
      App.isReviewMode = progress.isReview || false;
      App.reviewSourceDeckId = progress.reviewSourceDeckId || null;
      App.studyOrder = progress.order || 'difficulty';
      App.studyQueue = progress.queue || [];
      App.studyIndex = progress.index || 0;
      App.studyPassed = progress.passed || 0;
      App.studyFailed = progress.failed || 0;
      App.studyStartTime = progress.startTime || Date.now();
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
      var shortcutHint = document.querySelector('#studyContent .shortcut-hint');
      var cardScene = document.querySelector('#studyContent .card-scene');
      var studyActions = document.querySelector('#studyContent .study-actions');
      if (studyHeader) studyHeader.style.display = '';
      if (shortcutHint) shortcutHint.style.display = '';
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
      /* 如果没有队列内容，显示模式选择引导 */
      if (App.studyQueue.length === 0 && App.studyIndex === 0) {
        content.style.display = 'block';
        App._renderModeGuide(deck);
        return;
      }

      complete.style.display = 'block';
      var total = App.studyPassed + App.studyFailed;
      var accuracy = total > 0 ? Math.round(App.studyPassed / total * 100) : 0;
      var elapsedSec = App.studyStartTime ? Math.round((Date.now() - App.studyStartTime) / 1000) : 0;
      var min = Math.floor(elapsedSec / 60);
      var sec = elapsedSec % 60;
      var timeStr = min > 0 ? min + '分' + sec + '秒' : sec + '秒';
      var rate = total > 0 && elapsedSec > 0 ? Math.round(total / elapsedSec * 60) : 0;

      var modeLabel = '';
      if (App.studyMode === 'new') modeLabel = ' 📖 新词学习';
      else if (App.studyMode === 'review') modeLabel = ' 🔁 复习巩固';
      else if (App.studyMode === 'failed') modeLabel = ' 📋 错题强化';
      else if (App.studyMode === 'mixed') modeLabel = ' 🎯 智能混合';

      var title = App.studyFailed === 0 ? '完美通关！🎉' :
        accuracy >= 70 ? '不错哦！👍' : '继续加油！💪';

      document.getElementById('completeTitle').textContent = title;
      document.getElementById('completeStats').innerHTML =
        '<div class="complete-mode-badge">' + modeLabel + '</div>' +
        '<div class="complete-stats-row">' +
          '<span class="complete-stat">✅ ' + App.studyPassed + '</span>' +
          '<span class="complete-stat">❌ ' + App.studyFailed + '</span>' +
          '<span class="complete-stat">🎯 ' + accuracy + '%</span>' +
        '</div>' +
        '<div class="complete-stats-row" style="margin-top:8px;">' +
          '<span class="complete-stat">⏱ ' + timeStr + '</span>' +
          '<span class="complete-stat">⚡ ' + rate + '词/分</span>' +
        '</div>';

      if (App.studyPassed > 0 && App.studyFailed <= total / 3) {
        App.spawnConfetti();
      }

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
          'mixed': '🎯 再来一组混合',
          'failed': '🔄 再复习一轮',
        }[App.studyMode] || '再来一轮';

        restartBtn.onclick = function () {
          if (App.studyMode === 'new') App.startNewWords();
          else if (App.studyMode === 'review') App.startReview();
          else if (App.studyMode === 'mixed') App.startMixed();
          else App.startReview();
        };

        if (exitBtn2) exitBtn2.style.display = 'none';

        if (App.studyFailed > 0) {
          if (!reviewFailedBtn) {
            reviewFailedBtn = document.createElement('button');
            reviewFailedBtn.id = 'btnReviewRound';
            reviewFailedBtn.className = 'btn btn-outline';
            reviewFailedBtn.style.marginTop = '8px';
            restartBtn.parentNode.appendChild(reviewFailedBtn);
          }
          reviewFailedBtn.textContent = '📋 复习本轮 ' + App.studyFailed + ' 个错题';
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
    var shortcutHint = document.querySelector('#studyContent .shortcut-hint');
    var cardScene = document.querySelector('#studyContent .card-scene');
    var studyActions = document.querySelector('#studyContent .study-actions');
    if (studyHeader) studyHeader.style.display = '';
    if (shortcutHint) shortcutHint.style.display = '';
    if (cardScene) cardScene.style.display = '';
    if (studyActions) studyActions.style.display = '';

    /* 显示拼写模式区域 */
    var spellSection = document.getElementById('spellModeSection');
    if (spellSection) spellSection.style.display = 'block';
    /* 重置拼写状态 */
    App._resetSpellState();
    /* 如果拼写模式关闭，隐藏输入区域 */
    if (!App.spellMode) {
      var spellInputArea = document.getElementById('spellInputArea');
      if (spellInputArea) spellInputArea.style.display = 'none';
      var toggleBtn = document.getElementById('btnToggleSpell');
      if (toggleBtn) { toggleBtn.textContent = '⌨️ 拼写模式'; toggleBtn.classList.remove('spell-active'); }
    }

    var card = App.studyQueue[App.studyIndex];
    var modeTag = {
      'new': '📖 新词学习',
      'review': '🔁 复习巩固',
      'failed': '📋 错题强化',
      'mixed': '🎯 智能混合',
    }[App.studyMode] || '';

    var deckName = App.isReviewMode
      ? '📋 错题复习'
      : (deck ? deck.name : '');
    document.getElementById('studyDeckName').innerHTML = App.isReviewMode
      ? '<span class="review-mode-badge">📋 错题复习</span> ' + App.escHtml(card._deckName || '')
      : '<span class="mode-tag mode-' + App.studyMode + '">' + modeTag + '</span> ' + App.escHtml(deckName);

    document.getElementById('studyProgress').textContent =
      '第 ' + (App.studyIndex + 1) + ' / ' + App.studyQueue.length + ' 张' +
      (App.isReviewMode ? ' · 来源: ' + (card._deckName || '') : '');

    document.getElementById('progressFill').style.width =
      ((App.studyIndex / App.studyQueue.length) * 100) + '%';

    /* 正面 */
    var frontHtml = App.escHtml(App.getCardFront(card));
    if (card.phonetic) {
      frontHtml += ' <span class="card-front-phonetic">' + App.escHtml(card.phonetic) + '</span>';
    }

    /* 难度 + 艾宾浩斯阶段 */
    var sourceDeck = deck;
    if (App.isReviewMode && card._deckId) {
      sourceDeck = App.getDeck(card._deckId);
    }
    var deckCard = sourceDeck ? sourceDeck.cards.find(function (c) { return c.id === card.id; }) : null;
    var ef = deckCard ? deckCard.easeFactor : card.easeFactor;

    var diffHtml = '';
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

    document.getElementById('cardFrontText').innerHTML = frontHtml + diffHtml;

    /* 背面 */
    var parts = [];
    var defs = card.definitions || [card.back || ''];
    if (!Array.isArray(defs)) defs = [defs];
    var phonetic = card.phonetic || '';
    var pos = card.pos || '';

    if (phonetic || pos) {
      parts.push('<div class="card-phonetic-pos">' +
        (phonetic ? '<span class="card-phonetic">' + App.escHtml(phonetic) + '</span>' : '') +
        (pos ? '<span class="card-pos-tag">' + App.escHtml(pos) + '</span>' : '') +
      '</div>');
    }

    parts.push('<div class="card-defs">' + defs.map(function (d, i) {
      return '<div class="card-def-item">' + (defs.length > 1 ? (i + 1) + '. ' : '') + App.escHtml(d) + '</div>';
    }).join('') + '</div>');

    var phrases = card.phrases || [];
    if (phrases.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">词组搭配</div>' +
        phrases.map(function (p) {
          return '<div class="card-phrase"><span class="phrase-en">' + App.escHtml(p.en) + '</span><span class="phrase-zh">' + App.escHtml(p.zh) + '</span></div>';
        }).join('') + '</div>');
    }

    var sentences = card.sentences || [];
    if (sentences.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">例句</div>' +
        sentences.map(function (s) {
          return '<div class="card-sentence"><div class="sentence-en">' + App.escHtml(s.en) + '</div>' +
            (s.zh ? '<div class="sentence-zh">' + App.escHtml(s.zh) + '</div>' : '') + '</div>';
        }).join('') + '</div>');
    }

    var synonyms = card.synonyms || [];
    var antonyms = card.antonyms || [];
    if (synonyms.length > 0 || antonyms.length > 0) {
      var synAnt = '';
      if (synonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">同:</span> ' + App.escHtml(synonyms.join(', ')) + '</div>';
      if (antonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">反:</span> ' + App.escHtml(antonyms.join(', ')) + '</div>';
      parts.push('<div class="card-section">' + synAnt + '</div>');
    }

    var confused = card.confused || [];
    if (confused.length > 0) {
      parts.push('<div class="card-section"><div class="card-confused"><span class="syn-ant-label">易混淆:</span> ' + App.escHtml(confused.join(', ')) + '</div></div>');
    }

    /* SM-2 + 艾宾浩斯信息 */
    if (card.nextReview || card.ebbinghausNextReview) {
      var ebInfo = '';
      var ebS = deckCard ? deckCard.ebbinghausStage : card.ebbinghausStage;
      if (typeof ebS === 'number') {
        ebInfo = ' | 艾宾浩斯: L' + ebS + ' ' + (App.EB_STAGES[ebS] ? App.EB_STAGES[ebS].label : '');
      }
      parts.push('<div class="card-sm2-info">' +
        '下次复习: ' + (card.ebbinghausNextReview || card.nextReview) +
        ' | 间隔: ' + (card.interval || 0) + '天 | EF: ' + (card.easeFactor || 2.5).toFixed(1) +
        ebInfo +
      '</div>');
    }

    document.getElementById('cardBackText').innerHTML = parts.join('');

    var el = document.getElementById('flashcard');
    el.classList.remove('flipped');
    App.isFlipped = false;
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

          /* 智能混合 */
          '<div class="mode-card" id="modeCardMixed">' +
            '<div class="mode-card-icon">🎯</div>' +
            '<div class="mode-card-body">' +
              '<div class="mode-card-title">智能混合</div>' +
              '<div class="mode-card-desc">复习优先，穿插新词，高效利用时间</div>' +
              '<div class="mode-card-count">复习' + reviewCount + ' + 新词' + Math.min(newCount, App.newWordsPerSession) + '</div>' +
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

        /* 新词数量设置 */
        '<div class="mode-setting">' +
          '<label>每次新词数:</label>' +
          '<input type="number" id="newWordsPerSessionInput" value="' + App.newWordsPerSession +
            '" min="3" max="50" step="1" style="width:60px;text-align:center;">' +
          '<button class="btn btn-outline btn-sm" id="btnSaveNewWordsCount">保存</button>' +
        '</div>' +
      '</div>';

    /* 替换 studyContent 下的内容（保留 header + scene 容器但隐藏它们） */
    var studyHeader = document.querySelector('#studyContent .study-header');
    var shortcutHint = document.querySelector('#studyContent .shortcut-hint');
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
    if (shortcutHint) shortcutHint.style.display = 'none';
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
    document.getElementById('modeCardMixed').addEventListener('click', function () {
      App.studyMode = 'mixed';
      App.startMixed();
    });
    document.getElementById('modeCardFailed').addEventListener('click', function () {
      App.studyMode = 'failed';
      App.startFailedReview();
    });

    document.getElementById('btnSaveNewWordsCount').addEventListener('click', function () {
      var v = parseInt(document.getElementById('newWordsPerSessionInput').value, 10);
      if (v >= 3 && v <= 50) {
        App.newWordsPerSession = v;
        localStorage.setItem('flashcard-new-words-per-session', String(v));
        App.showToast('每次新词数已设为 ' + v, 'success', 1500);
        App._renderModeGuide(deck);
      }
    });
  };

  /* ========== 作答 ========== */
  App.answerStudy = function (passed) {
    if (!App.isFlipped) {
      document.getElementById('flashcard').classList.add('flipped');
      App.isFlipped = true;
      return;
    }

    var card = App.studyQueue[App.studyIndex];
    var deck = App.isReviewMode && card._deckId ? App.getDeck(card._deckId) : App.getCurrentDeck();
    var deckCard = deck ? deck.cards.find(function (c) { return c.id === card.id; }) : null;

    if (deckCard) {
      /* SM-2 难度调整 */
      App.applySM2(deckCard, passed);

      /* 艾宾浩斯阶段推进 */
      App.applyEbbinghaus(deckCard, passed);

      /* 同步回队列副本 */
      card.easeFactor = deckCard.easeFactor;
      card.repetitions = deckCard.repetitions;
      card.interval = deckCard.interval;
      card.nextReview = deckCard.nextReview;
      card.ebbinghausStage = deckCard.ebbinghausStage;
      card.ebbinghausNextReview = deckCard.ebbinghausNextReview;

      if (passed) { App.studyPassed++; }
      else { App.studyFailed++; }

      App.trackLearning(passed ? 1 : 0);
    }

    App.studyIndex++;
    App.isFlipped = false;
    App.saveData();
    App.saveStudyProgress();
    App.updateNavBadges();

    if (App.studyIndex >= App.studyQueue.length) {
      /* 完成时恢复学习组件显示 */
      var guideEl2 = document.getElementById('studyModeGuide');
      if (guideEl2) guideEl2.remove();
      var header2 = document.querySelector('#studyContent .study-header');
      var hint2 = document.querySelector('#studyContent .shortcut-hint');
      var scene2 = document.querySelector('#studyContent .card-scene');
      var actions2 = document.querySelector('#studyContent .study-actions');
      if (header2) header2.style.display = '';
      if (hint2) hint2.style.display = '';
      if (scene2) scene2.style.display = '';
      if (actions2) actions2.style.display = '';
      var spellSection2 = document.getElementById('spellModeSection');
      if (spellSection2) spellSection2.style.display = 'none';

      App.renderStudyPanel();
      App.renderDeckSelect();
    } else {
      /* 最后 3 张时重排序 */
      if (App.studyIndex >= App.studyQueue.length - 3) {
        var remaining = App.studyQueue.slice(App.studyIndex);
        remaining.sort(function (a, b) {
          return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
        });
        App.studyQueue = App.studyQueue.slice(0, App.studyIndex).concat(remaining);
      }
      App.renderStudyPanel();
    }
  };

  /* ========== 拼写模式 ========== */

  App.toggleSpellMode = function () {
    App.spellMode = !App.spellMode;
    App.spellAnswered = false;

    var toggleBtn = document.getElementById('btnToggleSpell');
    var inputArea = document.getElementById('spellInputArea');
    var spellInput = document.getElementById('spellInput');
    var spellFeedback = document.getElementById('spellFeedback');
    var failBtn = document.getElementById('btnFail');
    var passBtn = document.getElementById('btnPass');

    if (App.spellMode) {
      if (toggleBtn) toggleBtn.textContent = '🔤 退出拼写';
      if (toggleBtn) toggleBtn.classList.add('spell-active');
      if (inputArea) inputArea.style.display = 'block';
      if (spellInput) { spellInput.value = ''; spellInput.focus(); }
      if (spellFeedback) { spellFeedback.textContent = ''; spellFeedback.className = 'spell-feedback'; }
      /* 拼写模式下调整按钮文本 */
      if (failBtn) failBtn.textContent = '✗ 跳过';
      if (passBtn) passBtn.style.display = 'none'; /* 拼写正确自动通过 */
    } else {
      if (toggleBtn) toggleBtn.textContent = '⌨️ 拼写模式';
      if (toggleBtn) toggleBtn.classList.remove('spell-active');
      if (inputArea) inputArea.style.display = 'none';
      if (spellInput) spellInput.value = '';
      if (spellFeedback) { spellFeedback.textContent = ''; spellFeedback.className = 'spell-feedback'; }
      if (failBtn) failBtn.textContent = '✗ 不会';
      if (passBtn) passBtn.style.display = '';
    }
  };

  /** 拼写检查 */
  App.checkSpelling = function () {
    if (!App.spellMode) return;
    if (App.spellAnswered) return;
    if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) return;

    var input = document.getElementById('spellInput');
    var feedback = document.getElementById('spellFeedback');
    var userInput = (input.value || '').trim();
    if (!userInput) return;

    var card = App.studyQueue[App.studyIndex];
    var correctAnswer = (card.front || card.word || '').replace(/\s+/g, '').toLowerCase();
    var normalized = userInput.replace(/\s+/g, '').toLowerCase();

    App.spellAnswered = true;
    input.disabled = true;

    if (normalized === correctAnswer) {
      /* 拼写正确 → 自动通过 */
      feedback.textContent = '✅ 拼写正确！' + (card.phonetic ? ' ' + card.phonetic : '');
      feedback.className = 'spell-feedback spell-correct';
      input.className = 'spell-input-correct';

      /* 朗读单词 */
      App.speak(card.front || card.word);

      /* 短暂延迟后自动进入下一张 */
      setTimeout(function () {
        App.spellAnswered = false;
        input.disabled = false;
        input.className = '';
        input.value = '';
        feedback.textContent = '';
        feedback.className = 'spell-feedback';

        /* 先翻卡展示答案，然后标记通过 */
        document.getElementById('flashcard').classList.add('flipped');
        App.isFlipped = true;
        App.answerStudy(true);
      }, 1000);
    } else {
      /* 拼写错误 */
      var correctWord = App.escHtml(card.front || card.word);
      feedback.innerHTML = '❌ 正确答案：<strong>' + correctWord + '</strong>';
      feedback.className = 'spell-feedback spell-wrong';
      input.className = 'spell-input-wrong';

      /* 自动翻卡显示答案 */
      document.getElementById('flashcard').classList.add('flipped');
      App.isFlipped = true;

      /* 显示 pass/fail 按钮让用户手动判断 */
      var passBtn = document.getElementById('btnPass');
      var failBtn = document.getElementById('btnFail');
      if (passBtn) passBtn.style.display = '';
      if (failBtn) failBtn.textContent = '✗ 不会';

      /* 2秒后可重新输入或手动作答 */
      setTimeout(function () {
        input.disabled = false;
        input.focus();
      }, 1500);
    }
  };

  /** 重置拼写状态（切换卡片时调用） */
  App._resetSpellState = function () {
    App.spellAnswered = false;
    var input = document.getElementById('spellInput');
    var feedback = document.getElementById('spellFeedback');
    if (input) { input.value = ''; input.disabled = false; input.className = ''; }
    if (feedback) { feedback.textContent = ''; feedback.className = 'spell-feedback'; }
  };

  App.cycleOrder = function () {
    var orderCycle = { difficulty: 'random', random: 'sequential', sequential: 'difficulty' };
    App.studyOrder = orderCycle[App.studyOrder];
    var labels = {
      difficulty: { icon: '⚡', label: '智能排序' },
      random:     { icon: '🔀', label: '乱序' },
      sequential: { icon: '📋', label: '正序' }
    };
    var info = labels[App.studyOrder];
    ['btnStudyOrder', 'btnTypingOrder'].forEach(function (btnId) {
      var btn = document.getElementById(btnId);
      if (!btn) return;
      btn.innerHTML = '<span class="order-icon">' + info.icon + '</span><span class="order-label">' + info.label + '</span><span class="order-arrow">▾</span>';
    });

    var deck = App.getCurrentDeck();
    if (!deck) return;
    App.studyQueue = App.buildStudyQueue(deck);
    App.studyIndex = 0;
    App.isFlipped = false;
    App.studyPassed = 0;
    App.studyFailed = 0;

    App.renderStudyPanel();
  };

})(FlashcardApp);
