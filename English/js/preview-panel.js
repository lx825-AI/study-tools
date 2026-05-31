/* preview-panel.js —— 预览模式 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  App.previewAnswersVisible = true;

  App.renderPreviewPanel = function () {
    let deck = App.getCurrentDeck();
    document.getElementById('previewNoDeck').style.display = 'none';
    document.getElementById('previewContent').style.display = 'none';

    if (!deck) { document.getElementById('previewNoDeck').style.display = 'block'; return; }
    document.getElementById('previewContent').style.display = 'block';
    document.getElementById('previewDeckName').textContent = deck.name;
    document.getElementById('previewCount').textContent = deck.cards.length;
    document.getElementById('previewSearch').value = '';

    let btnToggle = document.getElementById('btnToggleAnswer');
    btnToggle.textContent = App.previewAnswersVisible ? '🙈 隐藏释义' : '👁️ 显示释义';

    App._renderPreviewTable(deck.cards);
  };

  App._renderPreviewTable = function (cards, highlightWord) {
    let tbody = document.getElementById('previewTbody');
    let cls = App.previewAnswersVisible ? '' : ' hidden-answer';

    /* 根据当前渲染的卡片重新判断是否有词性数据 */
    let showPos = cards.some(function (c) { return c.pos; });

    /* 动态更新表头 */
    let thead = document.querySelector('.preview-table thead tr');
    if (thead) {
      thead.innerHTML = '<th class="col-idx">#</th>' +
        '<th class="col-front">英文</th>' +
        (showPos ? '<th class="col-pos">词性</th>' : '') +
        '<th class="col-back">释义</th>';
    }

    tbody.innerHTML = cards.map(function (c, i) {
      let front = App.getCardFront(c);
      let back = App.getCardBack(c);
      let pos = c.pos || '';
      let frontHtml = App.escHtml(front);
      let backHtml = App.escHtml(back);
      if (highlightWord && front.toLowerCase() === highlightWord.toLowerCase()) {
        frontHtml = '<mark>' + frontHtml + '</mark>';
      }
      return '<tr>' +
        '<td class="col-idx">' + (i + 1) + '</td>' +
        '<td class="col-front">' + frontHtml +
          '<button class="speak-btn-sm speak-preview-btn" title="朗读">🔊</button>' +
        '</td>' +
        (showPos ? '<td class="col-pos">' + App.escHtml(pos) + '</td>' : '') +
        '<td class="col-back' + cls + '">' + backHtml + '</td>' +
      '</tr>';
    }).join('');
  };

})(FlashcardApp);
