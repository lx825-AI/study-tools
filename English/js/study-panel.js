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

    var next = new Date();
    next.setDate(next.getDate() + card.interval);
    card.nextReview = next.toISOString().slice(0, 10);

    /* 同步显示难度: EF 1.3→5, EF 2.5→3, EF 3.0+→0 */
    card.difficulty = Math.max(0, Math.min(App.DIFFICULTY_MAX, Math.round((3.0 - card.easeFactor) * 3)));
  };

  App.buildStudyQueue = function (deck) {
    var cards = deck.cards.map(function (c) { return Object.assign({}, c); });
    if (App.studyOrder === 'random') {
      for (var i = cards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp;
      }
    } else if (App.studyOrder === 'difficulty') {
      /* SM-2 模式：到期卡片优先，按难度系数升序（难的在前） */
      var today = new Date().toISOString().slice(0, 10);
      cards.sort(function (a, b) {
        var aDue = !a.nextReview || a.nextReview <= today;
        var bDue = !b.nextReview || b.nextReview <= today;
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
      });
    }
    return cards;
  };

  App.startStudy = function () {
    var deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;
    App.studyQueue = App.buildStudyQueue(deck);
    App.studyIndex = 0;
    App.studyPassed = 0;
    App.studyFailed = 0;
    App.isFlipped = false;
    App.renderStudyPanel();
  };

  App.renderStudyPanel = function () {
    var deck = App.getCurrentDeck();
    var noDeck = document.getElementById('studyNoDeck');
    var content = document.getElementById('studyContent');
    var complete = document.getElementById('studyComplete');
    var empty = document.getElementById('studyEmpty');

    noDeck.style.display = 'none';
    content.style.display = 'none';
    complete.style.display = 'none';
    empty.style.display = 'none';

    if (!deck) { noDeck.style.display = 'block'; return; }
    if (deck.cards.length === 0) { empty.style.display = 'block'; return; }

    if (App.studyQueue.length === 0 || App.studyIndex >= App.studyQueue.length) {
      complete.style.display = 'block';
      var total = App.studyPassed + App.studyFailed;
      document.getElementById('completeTitle').textContent =
        App.studyFailed === 0 ? '完美通关！' : App.studyFailed <= total / 3 ? '不错哦！' : '继续加油！';
      document.getElementById('completeStats').textContent =
        '本轮 ' + total + ' 张卡片，会了 ' + App.studyPassed + ' 张，不会 ' + App.studyFailed + ' 张';
      if (App.studyPassed > 0 && App.studyFailed <= total / 3) {
        App.spawnConfetti();
      }
      return;
    }

    content.style.display = 'block';

    var card = App.studyQueue[App.studyIndex];
    document.getElementById('studyDeckName').textContent = deck.name;
    document.getElementById('studyProgress').textContent =
      '第 ' + (App.studyIndex + 1) + ' / ' + App.studyQueue.length + ' 张';
    document.getElementById('progressFill').style.width =
      ((App.studyIndex / App.studyQueue.length) * 100) + '%';

    /* 卡片正面：单词 + 音标 */
    var frontHtml = App.escHtml(card.front || card.word);
    if (card.phonetic) {
      frontHtml += ' <span class="card-front-phonetic">' + App.escHtml(card.phonetic) + '</span>';
    }
    document.getElementById('cardFrontText').innerHTML = frontHtml;

    /* 卡片背面：丰富数据 + SM-2 状态 */
    var parts = [];
    var defs = card.definitions || [card.back || ''];
    if (!Array.isArray(defs)) defs = [defs];
    var phonetic = card.phonetic || '';
    var pos = card.pos || '';

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
    var phrases = card.phrases || [];
    if (phrases.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">词组搭配</div>' +
        phrases.map(function (p) {
          return '<div class="card-phrase"><span class="phrase-en">' + App.escHtml(p.en) + '</span><span class="phrase-zh">' + App.escHtml(p.zh) + '</span></div>';
        }).join('') + '</div>');
    }

    /* 例句 */
    var sentences = card.sentences || [];
    if (sentences.length > 0) {
      parts.push('<div class="card-section"><div class="card-section-title">例句</div>' +
        sentences.map(function (s) {
          return '<div class="card-sentence"><div class="sentence-en">' + App.escHtml(s.en) + '</div>' +
            (s.zh ? '<div class="sentence-zh">' + App.escHtml(s.zh) + '</div>' : '') + '</div>';
        }).join('') + '</div>');
    }

    /* 同义词/反义词 */
    var synonyms = card.synonyms || [];
    var antonyms = card.antonyms || [];
    if (synonyms.length > 0 || antonyms.length > 0) {
      var synAnt = '';
      if (synonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">同:</span> ' + App.escHtml(synonyms.join(', ')) + '</div>';
      if (antonyms.length > 0) synAnt += '<div class="card-syn-ant"><span class="syn-ant-label">反:</span> ' + App.escHtml(antonyms.join(', ')) + '</div>';
      parts.push('<div class="card-section">' + synAnt + '</div>');
    }

    /* 易混淆词 */
    var confused = card.confused || [];
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

    var el = document.getElementById('flashcard');
    el.classList.remove('flipped');
    App.isFlipped = false;
  };

  App.answerStudy = function (passed) {
    if (!App.isFlipped) {
      document.getElementById('flashcard').classList.add('flipped');
      App.isFlipped = true;
      return;
    }

    var card = App.studyQueue[App.studyIndex];
    var deck = App.getCurrentDeck();
    var deckCard = deck.cards.find(function (c) { return c.id === card.id; });
    if (deckCard) {
      App.applySM2(deckCard, passed);
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
        var remaining = App.studyQueue.slice(App.studyIndex);
        var today = new Date().toISOString().slice(0, 10);
        remaining.sort(function (a, b) {
          var aDue = !a.nextReview || a.nextReview <= today;
          var bDue = !b.nextReview || b.nextReview <= today;
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
    var orderCycle = { difficulty: 'random', random: 'sequential', sequential: 'difficulty' };
    App.studyOrder = orderCycle[App.studyOrder];
    var labels = { difficulty: '📊 难度', random: '🔀 乱序', sequential: '📋 正序' };
    var label = labels[App.studyOrder];
    document.getElementById('btnStudyOrder').textContent = label;
    document.getElementById('btnTypingOrder').textContent = label;

    var deck = App.getCurrentDeck();
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
