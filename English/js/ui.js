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
      var ebStats = d.cards.length > 0 ? App.getEbbinghausStats(d) : null;
      var ebInfo = '';
      if (ebStats) {
        var progressPct = d.cards.length > 0
          ? Math.round((d.cards.length - ebStats.newWords) / d.cards.length * 100) : 0;
        ebInfo = '<div class="deck-eb-stats">' +
          '<span class="deck-stat-item" title="新词">📖' + ebStats.newWords + '</span>' +
          '<span class="deck-stat-item" title="待复习"' +
            (ebStats.dueToday > 0 ? ' style="color:var(--danger-text);font-weight:700"' : '') + '>🔁' + ebStats.dueToday + '</span>' +
          '<span class="deck-stat-item" title="已掌握">✅' + ebStats.mastered + '</span>' +
          '<div class="deck-eb-progress"><div class="deck-eb-fill" style="width:' + progressPct + '%"></div></div>' +
        '</div>';
      }
      return '<div class="deck-card">' +
        '<div class="deck-info">' +
          '<div class="deck-name">' + App.escHtml(d.name) + '</div>' +
          '<div class="deck-count">' + d.cards.length + ' 张卡片</div>' +
          ebInfo +
        '</div>' +
        '<div class="deck-actions">' +
          '<button class="btn btn-outline btn-sm" data-action="study" data-deck="' + d.id + '">学习</button>' +
          '<button class="btn btn-outline btn-sm" data-action="typing" data-deck="' + d.id + '">打字</button>' +
          '<button class="btn btn-outline btn-sm" data-action="edit" data-deck="' + d.id + '">编辑</button>' +
          '<button class="btn btn-outline btn-sm" data-action="export" data-deck="' + d.id + '" title="导出为JSON">导出</button>' +
          '<button class="btn btn-danger btn-sm" data-action="delete" data-deck="' + d.id + '">删除</button>' +
        '</div>' +
      '</div>';
    }).join('');
  };

  /* Tab 切换 */
  App.switchTab = function (tab) {
    /* 顶部导航 */
    document.querySelectorAll('.top-nav button').forEach(function (b) { b.classList.remove('active'); });
    var topBtn = document.querySelector('.top-nav button[data-tab="' + tab + '"]');
    if (topBtn) topBtn.classList.add('active');

    /* 底部导航同步 */
    document.querySelectorAll('.bottom-nav button').forEach(function (b) { b.classList.remove('active'); });
    var bottomBtn = document.querySelector('.bottom-nav button[data-tab="' + tab + '"]');
    if (bottomBtn) bottomBtn.classList.add('active');

    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('visible'); });
    let panelMap = { decks: 'panelDecks', study: 'panelStudy', preview: 'panelPreview', typing: 'panelTyping', cards: 'panelCards', stats: 'panelStats' };
    let panelId = panelMap[tab];
    if (panelId) document.getElementById(panelId).classList.add('visible');

    if (tab === 'study') {
      App.renderStudyPanel();
    }
    if (tab === 'preview') App.renderPreviewPanel();
    if (tab === 'typing') App.renderTypingPanel();
    if (tab === 'cards') App.renderCardsPanel();
    if (tab === 'stats') App.renderStatsPanel();
  };

  /* 更新导航标签上的待复习角标 */
  App.updateNavBadges = function () {
    var today = new Date().toISOString().slice(0, 10);
    var dueCount = 0;
    App.state.decks.forEach(function (d) {
      d.cards.forEach(function (c) {
        App.initEbbinghaus(c);
        if (c.ebbinghausNextReview && c.ebbinghausNextReview <= today) dueCount++;
      });
    });

    var badgeText = dueCount > 99 ? '99+' : String(dueCount);

    /* 顶部导航角标 */
    var topBtn = document.querySelector('.top-nav button[data-tab="study"]');
    if (topBtn) {
      var existing = topBtn.querySelector('.nav-badge');
      if (existing) existing.remove();
      if (dueCount > 0) {
        var badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.textContent = badgeText;
        topBtn.appendChild(badge);
      }
    }

    /* 底部导航角标同步 */
    var mobileBadge = document.getElementById('studyBadgeMobile');
    if (mobileBadge) {
      if (dueCount > 0) {
        mobileBadge.textContent = badgeText;
        mobileBadge.style.display = '';
      } else {
        mobileBadge.style.display = 'none';
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
