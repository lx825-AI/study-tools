/* wrong-words.js —— 错词本面板：EF≤1.8 跨牌组收集、批量练习、导出、移出 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /** 将卡片移出错词本（EF 重置回 2.5） */
  App.resetFailedCard = function (cardId) {
    var found = false;
    App.state.decks.forEach(function (deck) {
      deck.cards.forEach(function (c) {
        if (c.id === cardId) {
          c.easeFactor = 2.5;
          found = true;
        }
      });
    });
    if (found) {
      App.saveData();
      App.renderWrongWordsPanel();
      App.updateNavBadges();
    }
  };

  /** 本周错题数（从学习日志聚合近 7 天 wrong） */
  App.getWeekWrongCount = function () {
    var log = App.loadLearningLog();
    var total = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var key = d.toISOString().slice(0, 10);
      total += (log[key] && log[key].wrong) || 0;
    }
    return total;
  };

  /** 渲染错词本面板 */
  App.renderWrongWordsPanel = function () {
    var panel = document.getElementById('panelWrong');
    if (!panel) return;

    var failed = App.collectFailedCards();
    var weekWrong = App.getWeekWrongCount();

    var html = '<div class="section-title">📋 错词本</div>' +
      '<div class="stats-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + failed.length + '</div>' +
          '<div class="stat-label">待强化词汇</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + weekWrong + '</div>' +
          '<div class="stat-label">本周错题数</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:8px;margin:12px 0;">' +
        '<button class="btn btn-primary btn-sm" id="btnWrongPractice"' + (failed.length === 0 ? ' disabled' : '') + '>🔁 批量练习</button>' +
      '</div>';

    if (failed.length === 0) {
      html += '<div class="empty-state" style="padding:32px 0;text-align:center;color:var(--text-muted);">🎉 暂无错词，继续保持！</div>';
    } else {
      html += '<div class="failed-words-list">' + failed.map(function (f) {
        var card = f.card;
        var def = (card.definitions && card.definitions[0]) || card.back || '';
        return '<div class="failed-word-item">' +
          '<div class="failed-word-main">' +
            '<span class="failed-word">' + App.escHtml(card.word || card.front) + '</span>' +
            (card.phonetic ? '<span class="failed-phonetic">' + App.escHtml(card.phonetic) + '</span>' : '') +
            '<span class="failed-def">' + App.escHtml(def) + '</span>' +
          '</div>' +
          '<div class="failed-word-meta">' +
            '<span class="failed-ef">EF: ' + ((card.easeFactor || 2.5).toFixed(1)) + '</span>' +
            '<span class="failed-deck">' + App.escHtml(f.deckName) + '</span>' +
            '<button class="btn btn-outline btn-sm" data-remove-card="' + card.id + '">移出</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    panel.innerHTML = html;

    /* 批量练习：切到学习 tab 并启动错题强化 */
    var practiceBtn = document.getElementById('btnWrongPractice');
    if (practiceBtn) practiceBtn.addEventListener('click', function () {
      App.switchTab('study');
      App.startFailedReview();
    });

    /* 移出错词本 */
    panel.querySelectorAll('[data-remove-card]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        App.resetFailedCard(btn.getAttribute('data-remove-card'));
      });
    });
  };
})(FlashcardApp);
