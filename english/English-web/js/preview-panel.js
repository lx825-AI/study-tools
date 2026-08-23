/* preview-panel.js —— 预览模式（支持虚拟滚动） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 虚拟滚动配置 */
  var ROW_HEIGHT = 36;          /* 每行近似高度 px */
  var BUFFER = 12;              /* 上下缓冲区行数 */
  var VIRTUAL_THRESHOLD = 200;  /* 超过此数量启用虚拟滚动 */

  /* 虚拟滚动状态 */
  App._pvCards = null;
  App._pvShowPos = false;
  App._pvScrollTop = 0;
  App._pvRange = [0, 0];

  App.renderPreviewPanel = function () {
    let deck = App.getCurrentDeck();
    document.getElementById('previewNoDeck').style.display = 'none';
    document.getElementById('previewContent').style.display = 'none';

    if (!deck) { document.getElementById('previewNoDeck').style.display = 'block'; return; }
    document.getElementById('previewContent').style.display = 'block';
    document.getElementById('previewDeckName').textContent = deck.name;
    document.getElementById('previewCount').textContent = deck.cards.length;

    /* 重置虚拟滚动状态 */
    App._pvCards = null;
    App._pvRange = [0, 0];
    App._pvScrollTop = 0;

    App._renderPreviewTable(deck.cards);
  };

  /** 渲染单行 HTML */
  function rowHTML(c, i, showPos) {
    let front = App.getCardFront(c);
    let back = App.getCardBack(c);
    let pos = c.pos || '';
    let frontHtml = App.escHtml(front);
    let backHtml = App.escHtml(back);
    return '<tr>' +
      '<td class="col-idx">' + (i + 1) + '</td>' +
      '<td class="col-front">' + frontHtml +
        '<button class="speak-btn-sm speak-preview-btn" title="朗读">🔊</button>' +
      '</td>' +
      (showPos ? '<td class="col-pos">' + App.escHtml(pos) + '</td>' : '') +
      '<td class="col-back">' + backHtml + '</td>' +
    '</tr>';
  }

  /** 更新表头 */
  function updateThead(showPos) {
    let thead = document.querySelector('.preview-table thead tr');
    if (!thead) return;
    thead.innerHTML = '<th class="col-idx">#</th>' +
      '<th class="col-front">英文</th>' +
      (showPos ? '<th class="col-pos">词性</th>' : '') +
      '<th class="col-back">释义</th>';
  }

  /** 渲染可见行（虚拟滚动） */
  App._renderVisiblePreviewRows = function () {
    var cards = App._pvCards;
    if (!cards) return;

    var list = document.getElementById('previewTbody');
    if (!list) return;

    var scrollContainer = list.closest('.preview-scroll');
    if (!scrollContainer) return;

    var scrollTop = scrollContainer.scrollTop;
    var viewHeight = scrollContainer.clientHeight || 400;
    var firstVisible = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    var lastVisible = Math.min(cards.length, Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + BUFFER);

    /* 可见范围没变则跳过 */
    if (App._pvRange[0] === firstVisible && App._pvRange[1] === lastVisible) return;
    App._pvRange = [firstVisible, lastVisible];
    App._pvScrollTop = scrollTop;

    var html = '';
    for (var i = firstVisible; i < lastVisible; i++) {
      html += rowHTML(cards[i], i, App._pvShowPos);
    }

    /* 用 top spacer 占位已滚过的行，bottom spacer 占位剩余行 */
    list.innerHTML =
      '<tr aria-hidden="true" style="height:' + (firstVisible * ROW_HEIGHT) + 'px;line-height:0;padding:0;border:none;"></tr>' +
      html +
      '<tr aria-hidden="true" style="height:' + ((cards.length - lastVisible) * ROW_HEIGHT) + 'px;line-height:0;padding:0;border:none;"></tr>';
  };

  App._renderPreviewTable = function (cards) {
    var tbody = document.getElementById('previewTbody');
    var showPos = cards.some(function (c) { return c.pos; });

    updateThead(showPos);

    /* 少量卡片直接全部渲染 */
    if (cards.length <= VIRTUAL_THRESHOLD) {
      App._pvCards = null;
      App._pvRange = [0, 0];

      var scrollContainer = tbody.closest('.preview-scroll');
      if (scrollContainer) {
        scrollContainer.style.overflowY = 'visible';
        scrollContainer.style.maxHeight = '';
      }

      tbody.innerHTML = cards.map(function (c, i) {
        return rowHTML(c, i, showPos);
      }).join('');
      return;
    }

    /* 大量卡片：虚拟滚动 */
    App._pvCards = cards;
    App._pvShowPos = showPos;
    App._pvRange = [0, 0];
    App._pvScrollTop = 0;

    var scrollContainer = tbody.closest('.preview-scroll');
    if (scrollContainer) {
      scrollContainer.style.overflowY = 'auto';
      scrollContainer.style.maxHeight = Math.min(cards.length * ROW_HEIGHT, window.innerHeight * 0.65) + 'px';
      scrollContainer.scrollTop = 0;

      /* 绑定滚动事件（仅一次） */
      if (!scrollContainer._hasPreviewScroll) {
        scrollContainer._hasPreviewScroll = true;
        scrollContainer.addEventListener('scroll', function () {
          App._renderVisiblePreviewRows();
        });
      }
    }

    /* 首次渲染可见行 */
    App._renderVisiblePreviewRows();
  };

})(FlashcardApp);
