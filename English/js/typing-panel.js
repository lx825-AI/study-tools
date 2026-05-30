/* typing-panel.js —— 打字模式 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.typingQueue = [];
  App.typingIndex = 0;
  App.typingCorrect = 0;
  App.typingWrong = 0;
  App.typingDone = false;

  App.renderTypingPanel = function () {
    let deck = App.getCurrentDeck();
    document.getElementById('typingNoDeck').style.display = 'none';
    document.getElementById('typingContent').style.display = 'none';
    document.getElementById('typingComplete').style.display = 'none';
    document.getElementById('typingEmpty').style.display = 'none';

    if (!deck) { document.getElementById('typingNoDeck').style.display = 'block'; return; }
    if (deck.cards.length === 0) { document.getElementById('typingEmpty').style.display = 'block'; return; }

    if (App.typingQueue.length === 0 || App.typingIndex >= App.typingQueue.length) {
      if (App.typingDone) {
        document.getElementById('typingComplete').style.display = 'block';
        let total = App.typingCorrect + App.typingWrong;
        let rate = total > 0 ? Math.round(App.typingCorrect / total * 100) : 0;
        document.getElementById('typingCompleteTitle').textContent =
          rate >= 90 ? '🏆 太棒了！' : rate >= 60 ? '👍 继续加油！' : '💪 多多练习！';
        document.getElementById('typingCompleteStats').textContent =
          '正确 ' + App.typingCorrect + ' / ' + total + '（' + rate + '%），错误 ' + App.typingWrong;
        return;
      }
      return;
    }

    document.getElementById('typingContent').style.display = 'block';
    let card = App.typingQueue[App.typingIndex];
    var isReviewMode = card._deckId !== undefined;
    document.getElementById('typingDeckName').textContent = isReviewMode
      ? '📋 错题打字 · ' + (card._deckName || '')
      : deck.name;

    /* 释义 + 可选音标/词性提示 */
    let wordHtml = App.escHtml(card.back || (card.definitions || [''])[0]);
    if (card.phonetic) {
      wordHtml += ' <span class="typing-phonetic">' + App.escHtml(card.phonetic) + '</span>';
    }
    if (card.pos) {
      wordHtml += ' <span class="typing-pos-tag">' + App.escHtml(card.pos) + '</span>';
    }
    document.getElementById('typingWord').innerHTML = wordHtml;

    document.getElementById('typingCorrect').textContent = App.typingCorrect;
    document.getElementById('typingWrong').textContent = App.typingWrong;
    document.getElementById('typingProgressFill').style.width =
      ((App.typingIndex / App.typingQueue.length) * 100) + '%';
    document.getElementById('typingInput').value = '';
    document.getElementById('typingInput').className = '';
    document.getElementById('typingFeedback').textContent = '';
    document.getElementById('typingFeedback').className = 'typing-feedback';
    document.getElementById('btnTypingSubmit').style.display = '';
    document.getElementById('btnTypingNext').style.display = 'none';
    document.getElementById('typingInput').focus();
  };

  App.startTyping = function () {
    let deck = App.getCurrentDeck();
    if (!deck || deck.cards.length === 0) return;
    App.typingQueue = App.buildStudyQueue(deck);
    App.typingIndex = 0;
    App.typingCorrect = 0;
    App.typingWrong = 0;
    App.typingDone = false;
    App.renderTypingPanel();
  };

  /* 错题打字复习 */
  App.startTypingFailed = function () {
    var failedCards = App.collectFailedCards();
    if (failedCards.length === 0) {
      App.showToast('暂无需要复习的错题！🎉', 'success', 2000);
      return;
    }
    App.typingQueue = failedCards.map(function (f) {
      return Object.assign({}, f.card, { _deckName: f.deckName, _deckId: f.deckId });
    }).sort(function (a, b) {
      return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
    });
    App.typingIndex = 0;
    App.typingCorrect = 0;
    App.typingWrong = 0;
    App.typingDone = false;
    /* 直接切换到打字面板 */
    document.querySelectorAll('nav button').forEach(function (b) { b.classList.remove('active'); });
    var tabBtn = document.querySelector('nav button[data-tab="typing"]');
    if (tabBtn) tabBtn.classList.add('active');
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('visible'); });
    document.getElementById('panelTyping').classList.add('visible');
    /* 隐藏空状态提示，渲染打字内容 */
    document.getElementById('typingNoDeck').style.display = 'none';
    document.getElementById('typingEmpty').style.display = 'none';
    App.typingIndex = 0;
    App.typingDone = false;
    App.renderTypingPanel();
    App.showToast('📋 错题打字模式：共 ' + App.typingQueue.length + ' 个需强化记忆的词', 'info', 2500);
  };

  App.submitTyping = function () {
    if (App.typingQueue.length === 0 || App.typingIndex >= App.typingQueue.length) return;
    let input = document.getElementById('typingInput').value.trim();
    if (!input) return;
    let card = App.typingQueue[App.typingIndex];
    let correctAnswer = (card.front || card.word || '').replace(/\s+/g, '').toLowerCase();
    let userInput = input.replace(/\s+/g, '').toLowerCase();
    let isCorrect = correctAnswer === userInput;

    let feedback = document.getElementById('typingFeedback');
    let inputEl = document.getElementById('typingInput');
    document.getElementById('btnTypingSubmit').style.display = 'none';

    if (isCorrect) {
      App.typingCorrect++;
      inputEl.className = 'correct';
      feedback.textContent = '✅ 正确！';
      feedback.className = 'typing-feedback correct';
      var d = card._deckId ? App.getDeck(card._deckId) : App.getCurrentDeck();
      var dc = d ? d.cards.find(function (c) { return c.id === card.id; }) : null;
      if (dc) App.applySM2(dc, true);
      App.trackLearning(1);
      App.saveData();
      App.updateNavBadges();
      /* 答对后朗读 */
      App.speak(card.front || card.word);
      setTimeout(function () {
        App.typingIndex++;
        if (App.typingIndex >= App.typingQueue.length) { App.typingDone = true; }
        App.renderTypingPanel();
      }, 800);
    } else {
      App.typingWrong++;
      inputEl.className = 'wrong';
      feedback.innerHTML = '❌ 错误！正确答案：<strong>' + App.escHtml(card.front || card.word) + '</strong>';
      feedback.className = 'typing-feedback wrong';
      var d2 = card._deckId ? App.getDeck(card._deckId) : App.getCurrentDeck();
      var dc2 = d2 ? d2.cards.find(function (c) { return c.id === card.id; }) : null;
      if (dc2) App.applySM2(dc2, false);
      App.trackLearning(0);
      App.updateNavBadges();
      document.getElementById('btnTypingNext').style.display = '';
      document.getElementById('btnTypingNext').focus();
    }

    document.getElementById('typingCorrect').textContent = App.typingCorrect;
    document.getElementById('typingWrong').textContent = App.typingWrong;
  };

  App.nextTyping = function () {
    App.typingIndex++;
    App.saveData();
    if (App.typingIndex >= App.typingQueue.length) { App.typingDone = true; }
    App.renderTypingPanel();
  };

})(FlashcardApp);
