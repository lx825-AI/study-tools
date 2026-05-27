/* study-panel.js —— 翻卡学习 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.studyQueue = [];
  App.studyIndex = 0;
  App.isFlipped = false;
  App.studyPassed = 0;
  App.studyFailed = 0;
  App.studyOrder = 'difficulty'; // 'difficulty' | 'random' | 'sequential'
  App.studyStartTime = null;

  /* SM-2 间隔重复算法 */
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

    let next = new Date();
    next.setDate(next.getDate() + card.interval);
    card.nextReview = next.toISOString().slice(0, 10);

    /* 同步显示难度: EF 1.3→5, EF 2.5→3, EF 3.0+→0 */
    card.difficulty = Math.max(0, Math.min(App.DIFFICULTY_MAX, Math.round((3.0 - card.easeFactor) * 3)));
  };

  App.buildStudyQueue = function (deck) {
    let cards = deck.cards.map(function (c) { return Object.assign({}, c); });
    if (App.studyOrder === 'random') {
      for (let i = cards.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp;
      }
    } else if (App.studyOrder === 'difficulty') {
      /* SM-2 模式：到期卡片优先，按难度系数升序（难的在前） */
      let today = new Date().toISOString().slice(0, 10);
      cards.sort(function (a, b) {
        let aDue = !a.nextReview || a.nextReview <= today;
        let bDue = !b.nextReview || b.nextReview <= today;
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
      });
    }
    return cards;
  };

  App.startStudy = function () {
    let deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;
    App.studyQueue = App.buildStudyQueue(deck);
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.studyStartTime = Date.now();
    App.renderStudyPanel();
  };

  App.renderStudyPanel = function () {
    let deck = App.getCurrentDeck();
    let noDeck = document.getElementById('studyNoDeck');
    let content = document.getElementById('studyContent');
    let complete = document.getElementById('studyComplete');
    let empty = document.getElementById('studyEmpty');

    noDeck.style.display = 'none';
    content.style.display = 'none';
    complete.style.display = 'none';
    empty.style.display = 'none';

    if (!deck) { noDeck.style.display = 'block'; return; }
    if (deck.cards.length === 0) { empty.style.display = 'block'; return; }

    if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) {
      complete.style.display = 'block';
      var total = App.studyPassed + App.studyFailed;
      var accuracy = total > 0 ? Math.round(App.studyPassed / total * 100) : 0;
      var elapsedSec = App.studyStartTime ? Math.round((Date.now() - App.studyStartTime) / 1000) : 0;
      var min = Math.floor(elapsedSec / 60);
      var sec = elapsedSec % 60;
      var timeStr = min > 0 ? min + '分' + sec + '秒' : sec + '秒';
      var rate = total > 0 && elapsedSec > 0 ? Math.round(total / elapsedSec * 60) : 0;
      document.getElementById('completeTitle').textContent =
        App.studyFailed === 0 ? '完美通关！' : accuracy >= 70 ? '不错哦！' : '继续加油！';
      document.getElementById('completeStats').innerHTML =
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
      return;
    }

    content.style.display = 'block';

    let card = App.studyQueue[App.studyIndex];
    document.getElementById('studyDeckName').textContent = deck.name;
    document.getElementById('studyProgress').textContent =
      '第 ' + (App.studyIndex + 1) + ' / ' + App.studyQueue.length + ' 张';
    document.getElementById('progressFill').style.width =
      ((App.studyIndex / App.studyQueue.length) * 100) + '%';

    /* 卡片正面：单词 + 音标 + 难度指示 */
    let frontHtml = App.escHtml(card.front || card.word);
    if (card.phonetic) {
      frontHtml += ' <span class="card-front-phonetic">' + App.escHtml(card.phonetic) + '</span>';
    }
    /* 难度指示: 从真实 deck 数据读取 EF，避免队列副本不同步 */
    var deckCard = deck.cards.find(function (c) { return c.id === card.id; });
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
    document.getElementById('cardFrontText').innerHTML = frontHtml + diffHtml;

    /* 卡片背面：丰富数据 + SM-2 状态 */
    let parts = [];
    let defs = card.definitions || [card.back || ''];
    if (!Array.isArray(defs)) defs = [defs];
    let phonetic = card.phonetic || '';
    let pos = card.pos || '';

    /* 音标 + 词性 */
    if (phonetic || pos) {
      parts.push('<div class="card-phonetic-pos">' +
        (phonetic ? '<span class="card-phonetic">' + App.escHtml(phonetic) + '</span>' : '') +
        (pos ? '<span class="card-pos-tag">' + App.escHtml(pos) + '</span>' : '') +
      '</div>');
    }

    /* 释义 */
    parts.push('<div class="card-defs">' + defs.map(function (d, i) {
      return '<div class="card-def-item">' + (defs.length > 1 ? (i + 1) + '. ' : '') + App.escHtml(d) + '</div>';
    }).join('') + '</div>');

    /* 词组搭配 */
    let phrases = card.phrases || [];
    if (phrases.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">词组搭配</div>' +
        phrases.map(function (p) {
          return '<div class="card-phrase"><span class="phrase-en">' + App.escHtml(p.en) + '</span><span class="phrase-zh">' + App.escHtml(p.zh) + '</span></div>';
        }).join('') + '</div>');
    }

    /* 例句 */
    let sentences = card.sentences || [];
    if (sentences.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">例句</div>' +
        sentences.map(function (s) {
          return '<div class="card-sentence"><div class="sentence-en">' + App.escHtml(s.en) + '</div>' +
            (s.zh ? '<div class="sentence-zh">' + App.escHtml(s.zh) + '</div>' : '') + '</div>';
        }).join('') + '</div>');
    }

    /* 同义词/反义词 */
    let synonyms = card.synonyms || [];
    let antonyms = card.antonyms || [];
    if (synonyms.length > 0 || antonyms.length > 0) {
      let synAnt = '';
      if (synonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">同:</span> ' + App.escHtml(synonyms.join(', ')) + '</div>';
      if (antonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">反:</span> ' + App.escHtml(antonyms.join(', ')) + '</div>';
      parts.push('<div class="card-section">' + synAnt + '</div>');
    }

    /* 易混淆词 */
    let confused = card.confused || [];
    if (confused.length > 0) {
      parts.push('<div class="card-section"><div class="card-confused"><span class="syn-ant-label">易混淆:</span> ' + App.escHtml(confused.join(', ')) + '</div></div>');
    }

    /* SM-2 状态 */
    if (card.nextReview) {
      parts.push('<div class="card-sm2-info">' +
        '下次复习: ' + card.nextReview + ' | 间隔: ' + (card.interval || 0) + '天 | EF: ' + (card.easeFactor || 2.5).toFixed(1) +
      '</div>');
    }

    document.getElementById('cardBackText').innerHTML = parts.join('');

    let el = document.getElementById('flashcard');
    el.classList.remove('flipped');
    App.isFlipped = false;
  };

  App.answerStudy = function (passed) {
    if (!App.isFlipped) {
      document.getElementById('flashcard').classList.add('flipped');
      App.isFlipped = true;
      return;
    }

    let card = App.studyQueue[App.studyIndex];
    let deck = App.getCurrentDeck();
    let deckCard = deck.cards.find(function (c) { return c.id === card.id; });
    if (deckCard) {
      App.applySM2(deckCard, passed);
      /* 同步 SM-2 状态回学习队列副本 */
      card.easeFactor = deckCard.easeFactor;
      card.repetitions = deckCard.repetitions;
      card.interval = deckCard.interval;
      card.nextReview = deckCard.nextReview;
      if (passed) { App.studyPassed++; }
      else { App.studyFailed++; }
    }

    App.studyIndex++;
    App.isFlipped = false;
    App.saveData();
    App.updateNavBadges();

    if (App.studyIndex >= App.studyQueue.length) {
      App.renderStudyPanel();
      App.renderDeckSelect();
    } else {
      if (App.studyIndex >= App.studyQueue.length - 3) {
        let remaining = App.studyQueue.slice(App.studyIndex);
        let today = new Date().toISOString().slice(0, 10);
        remaining.sort(function (a, b) {
          let aDue = !a.nextReview || a.nextReview <= today;
          let bDue = !b.nextReview || b.nextReview <= today;
          if (aDue && !bDue) return -1;
          if (!aDue && bDue) return 1;
          return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
        });
        App.studyQueue = App.studyQueue.slice(0, App.studyIndex).concat(remaining);
      }
      App.renderStudyPanel();
    }
  };

  App.cycleOrder = function () {
    let orderCycle = { difficulty: 'random', random: 'sequential', sequential: 'difficulty' };
    App.studyOrder = orderCycle[App.studyOrder];
    var labels = {
      difficulty: { icon: '⚡', label: '智能复习' },
      random:     { icon: '🔀', label: '乱序' },
      sequential: { icon: '📋', label: '正序' }
    };
    var info = labels[App.studyOrder];
    ['btnStudyOrder', 'btnTypingOrder'].forEach(function (btnId) {
      var btn = document.getElementById(btnId);
      if (!btn) return;
      btn.innerHTML = '<span class="order-icon">' + info.icon + '</span><span class="order-label">' + info.label + '</span><span class="order-arrow">▾</span>';
    });

    let deck = App.getCurrentDeck();
    if (!deck) return;
    App.studyQueue = App.buildStudyQueue(deck);
    App.studyIndex = 0;
    App.isFlipped = false;
    App.studyPassed = 0;
    App.studyFailed = 0;

    /* 同步打字队列 */
    App.typingQueue = App.buildStudyQueue(deck);
    App.typingIndex = 0;
    App.typingCorrect = 0;
    App.typingWrong = 0;
    App.typingDone = false;

    App.renderStudyPanel();
    App.renderTypingPanel();
  };

})(FlashcardApp);
