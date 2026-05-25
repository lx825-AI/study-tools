/* ui.js —— 跨面板渲染 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 牌组选择器 */
  App.renderDeckSelect = function () {
    let sel = document.getElementById('deckSelect');
    let currentVal = sel.value;
    sel.innerHTML = '<option value="">-- 请选择牌组 --</option>';
    App.state.decks.forEach(function (d) {
      let opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name + ' (' + d.cards.length + '张)';
      sel.appendChild(opt);
    });
    sel.value = App.state.currentDeckId || '';
  };

  /* 牌组面板 */
  App.renderDeckPanel = function () {
    let grid = document.getElementById('deckGrid');
    let empty = document.getElementById('decksEmpty');

    if (App.state.decks.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    grid.innerHTML = App.state.decks.map(function (d) {
      let diffHtml = '';
      if (d.cards.length > 0) {
        let avg = App.avgDifficulty(d);
        let level = Math.ceil(avg / (App.DIFFICULTY_MAX / 5));
        diffHtml = Array.from({ length: 5 }, function (_, i) {
          return '<span' + (i < level ? ' class="active"' : '') + '></span>';
        }).join('');
      }
      return '<div class="deck-card">' +
        '<div class="deck-info">' +
          '<div class="deck-name">' + App.escHtml(d.name) + '</div>' +
          '<div class="deck-count">' + d.cards.length + ' 张卡片</div>' +
          '<div class="deck-difficulty">' + diffHtml + '</div>' +
        '</div>' +
        '<div class="deck-actions">' +
          '<button class="btn btn-outline btn-sm" data-action="study" data-deck="' + d.id + '">学习</button>' +
          '<button class="btn btn-outline btn-sm" data-action="edit" data-deck="' + d.id + '">编辑</button>' +
          '<button class="btn btn-outline btn-sm" data-action="export" data-deck="' + d.id + '" title="导出为JSON">导出</button>' +
          '<button class="btn btn-danger btn-sm" data-action="delete" data-deck="' + d.id + '">删除</button>' +
        '</div>' +
      '</div>';
    }).join('');
  };

  /* Tab 切换 */
  App.switchTab = function (tab) {
    document.querySelectorAll('nav button').forEach(function (b) { b.classList.remove('active'); });
    let tabBtn = document.querySelector('nav button[data-tab="' + tab + '"]');
    if (tabBtn) tabBtn.classList.add('active');

    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('visible'); });
    let panelMap = { decks: 'panelDecks', study: 'panelStudy', typing: 'panelTyping', preview: 'panelPreview', cards: 'panelCards', stats: 'panelStats' };
    let panelId = panelMap[tab];
    if (panelId) document.getElementById(panelId).classList.add('visible');

    if (tab === 'study') {
      let deck = App.getCurrentDeck();
      if (deck && deck.cards.length > 0) App.startStudy();
      else App.renderStudyPanel();
    }
    if (tab === 'typing') {
      let d = App.getCurrentDeck();
      if (d && d.cards.length > 0) App.startTyping();
      else App.renderTypingPanel();
    }
    if (tab === 'preview') App.renderPreviewPanel();
    if (tab === 'cards') App.renderCardsPanel();
    if (tab === 'stats') App.renderStatsPanel();
  };

  /* 更新导航标签上的待复习角标 */
  App.updateNavBadges = function () {
    let today = new Date().toISOString().slice(0, 10);
    let dueCount = 0;
    App.state.decks.forEach(function (d) {
      d.cards.forEach(function (c) {
        if (c.nextReview && c.nextReview <= today) dueCount++;
      });
    });

    let studyBtn = document.querySelector('nav button[data-tab="study"]');
    if (studyBtn) {
      let existing = studyBtn.querySelector('.nav-badge');
      if (existing) existing.remove();
      if (dueCount > 0) {
        let badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.textContent = dueCount > 99 ? '99+' : dueCount;
        studyBtn.appendChild(badge);
      }
    }
  };

  /* 全量刷新 */
  App.renderAll = function () {
    App.renderDeckSelect();
    App.renderDeckPanel();
    App.renderCardsPanel();
    App.renderStudyPanel();
    App.renderTypingPanel();
    App.renderPreviewPanel();
    if (App.renderStatsPanel) App.renderStatsPanel();
    App.updateNavBadges();
  };

})(FlashcardApp);
