/* stats-panel.js —— 学习统计面板 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 学习记录 key */
  App.LEARNING_LOG_KEY = 'flashcard-learning-log';

  /* 加载学习日志: { 'YYYY-MM-DD': { correct: N, wrong: N } } */
  App.loadLearningLog = function () {
    try {
      let raw = localStorage.getItem(App.LEARNING_LOG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };

  /* 记录一次学习（correct: 1=对, 0=错） */
  App.trackLearning = function (correct) {
    let today = new Date().toISOString().slice(0, 10);
    let log = App.loadLearningLog();
    if (!log[today]) log[today] = { correct: 0, wrong: 0 };
    if (correct) log[today].correct++;
    else log[today].wrong++;
    try { localStorage.setItem(App.LEARNING_LOG_KEY, JSON.stringify(log)); } catch (e) {}
  };

  /* 计算连续打卡天数 */
  App.calcStreak = function (log) {
    let streak = 0;
    let d = new Date();
    d.setDate(d.getDate()); // today
    while (true) {
      let key = d.toISOString().slice(0, 10);
      if (log[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  };

  /* 渲染统计面板 */
  App.renderStatsPanel = function () {
    let panel = document.getElementById('panelStats');
    if (!panel) return;

    let log = App.loadLearningLog();
    let now = new Date();
    let todayKey = now.toISOString().slice(0, 10);
    let todayData = log[todayKey] || { correct: 0, wrong: 0 };
    let tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let tomorrowKey = tomorrow.toISOString().slice(0, 10);

    /* 总词汇量/已掌握 */
    let allCards = [];
    App.state.decks.forEach(function (d) { allCards = allCards.concat(d.cards); });
    let totalCards = allCards.length;
    let masteredCount = allCards.filter(function (c) { return (c.easeFactor || 2.5) >= 2.8; }).length;

    /* SM-2 + 艾宾浩斯 统计 */
    /* 艾宾浩斯阶段分布 */
    var ebDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    var dueToday = 0, dueTomorrow = 0;
    allCards.forEach(function (c) {
      App.initEbbinghaus(c);
      var stage = c.ebbinghausStage || 0;
      if (ebDistribution[stage] !== undefined) ebDistribution[stage]++;
      if (App.isDueToday(c)) dueToday++;
      if (c.ebbinghausNextReview === tomorrowKey) dueTomorrow++;
    });
    var totalEB = allCards.length;
    var reviewedCount = totalEB - (ebDistribution[0] || 0);

    /* 连续打卡 */
    let streak = App.calcStreak(log);

    /* 每日目标 */
    let dailyGoal = parseInt(localStorage.getItem('flashcard-daily-goal') || '20', 10);
    let todayTotal = todayData.correct + todayData.wrong;
    let goalPercent = Math.min(100, Math.round(todayTotal / dailyGoal * 100));

    /* 本周统计 */
    let weekStats = [];
    for (let i = 6; i >= 0; i--) {
      let d = new Date(now);
      d.setDate(d.getDate() - i);
      let key = d.toISOString().slice(0, 10);
      let dayData = log[key] || { correct: 0, wrong: 0 };
      weekStats.push({ label: d.getDate() + '日', correct: dayData.correct, wrong: dayData.wrong, total: dayData.correct + dayData.wrong });
    }
    let maxTotal = Math.max.apply(null, weekStats.map(function (s) { return s.total; }).concat([1]));

    panel.innerHTML =
      '<div class="stats-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + totalCards + '</div>' +
          '<div class="stat-label">总词汇量</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + masteredCount + '</div>' +
          '<div class="stat-label">已掌握 (EF≥2.8)</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + todayTotal + '</div>' +
          '<div class="stat-label">今日已学</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + streak + ' 天</div>' +
          '<div class="stat-label">连续打卡</div>' +
        '</div>' +
      '</div>' +

      /* 艾宾浩斯阶段分布 */
      '<div class="section-title" style="margin-top:24px;">🧠 艾宾浩斯遗忘曲线</div>' +
      '<div class="eb-distribution">' +
        App.EB_STAGES.map(function (s) {
          var count = ebDistribution[s.stage] || 0;
          var pct = totalEB > 0 ? Math.round(count / totalEB * 100) : 0;
          var isNew = s.stage === 0;
          var isMastered = s.stage >= App.EB_MASTERED_STAGE;
          return '<div class="eb-dist-item' + (isMastered ? ' eb-mastered' : isNew ? '' : '') + '">' +
            '<div class="eb-dist-count">' + count + '</div>' +
            '<div class="eb-dist-bar-wrap"><div class="eb-dist-bar" style="width:' + pct + '%"></div></div>' +
            '<div class="eb-dist-label">' + s.label + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="stats-grid">' +
        '<div class="stat-card">' +
          '<div class="stat-value" style="color:' + (dueToday > 0 ? 'var(--danger-text)' : 'var(--success)') + '">' + dueToday + '</div>' +
          '<div class="stat-label">今日待复习</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + dueTomorrow + '</div>' +
          '<div class="stat-label">明日待复习</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value">' + reviewedCount + '</div>' +
          '<div class="stat-label">复习进行中</div>' +
        '</div>' +
        '<div class="stat-card">' +
          '<div class="stat-value" style="font-size:20px;">' + (dueToday > 0 ? '📖 去复习' : dueToday === 0 && totalCards > 0 ? '✅ 已清空' : '📝 去添加') + '</div>' +
          '<div class="stat-label">状态</div>' +
        '</div>' +
      '</div>' +

      /* 错题统计 */
      (function () {
        var failedCards = App.collectFailedCards ? App.collectFailedCards() : [];
        var weekWrong = 0;
        weekStats.forEach(function (s) { weekWrong += s.wrong; });
        var topFailed = failedCards
          .sort(function (a, b) { return (a.card.easeFactor || 2.5) - (b.card.easeFactor || 2.5); })
          .slice(0, 5)
          .map(function (f) {
            return '<div class="failed-word-item">' +
              '<span class="failed-word">' + App.escHtml(f.card.word || f.card.front) + '</span>' +
              '<span class="failed-ef">EF: ' + ((f.card.easeFactor || 2.5).toFixed(1)) + '</span>' +
              '<span class="failed-deck">' + App.escHtml(f.deckName) + '</span>' +
            '</div>';
          }).join('');
        return '<div class="section-title" style="margin-top:24px;">📋 错题统计</div>' +
        '<div class="stats-grid">' +
          '<div class="stat-card">' +
            '<div class="stat-value" style="color:' + (failedCards.length > 0 ? 'var(--danger-text)' : 'var(--success)') + '">' + failedCards.length + '</div>' +
            '<div class="stat-label">待强化词汇</div>' +
          '</div>' +
          '<div class="stat-card">' +
            '<div class="stat-value">' + weekWrong + '</div>' +
            '<div class="stat-label">本周错题数</div>' +
          '</div>' +
        '</div>' +
        (topFailed ? '<div class="section-title" style="margin-top:16px;font-size:12px;">📌 最需强化的词</div>' +
        '<div class="failed-words-list">' + topFailed + '</div>' : '');
      })() +

      /* 每日目标 */
      '<div class="section-title" style="margin-top:24px;">🎯 每日目标</div>' +
      '<div class="daily-goal">' +
        '<div class="daily-goal-settings">' +
          '<span>每日目标:</span>' +
          '<input type="number" id="dailyGoalInput" value="' + dailyGoal + '" min="5" max="200" step="5">' +
          '<span>词</span>' +
          '<button class="btn btn-outline btn-sm" id="btnSaveGoal">保存</button>' +
        '</div>' +
        '<div class="daily-goal-progress">' +
          '<div class="daily-goal-fill" style="width:' + goalPercent + '%"></div>' +
        '</div>' +
        '<div style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:6px;">' +
          todayTotal + ' / ' + dailyGoal + ' (' + goalPercent + '%)' +
          (goalPercent >= 100 ? ' 🎉 目标达成！' : '') +
        '</div>' +
      '</div>' +

      /* 周柱状图 */
      '<div class="section-title" style="margin-top:24px;">📊 本周学习量</div>' +
      '<div class="week-chart">' +
        weekStats.map(function (s) {
          let height = maxTotal > 0 ? Math.max(4, Math.round((s.total / maxTotal) * 100)) : 0;
          return '<div class="week-bar-col">' +
            '<div class="week-bar" style="height:' + height + 'px"></div>' +
            '<div class="week-bar-label">' + s.label + '</div>' +
            '<div class="week-bar-num">' + s.total + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      /* 热力图 */
      '<div class="section-title" style="margin-top:24px;">📅 最近 30 天</div>' +
      '<div class="heatmap">' + App._renderHeatmap(log) + '</div>' +

      /* 分享 */
      '<div class="section-title" style="margin-top:24px;">📣 分享</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button id="btnShareAchievement" class="btn btn-outline btn-sm">🏆 分享学习成果</button>' +
      '</div>';

    /* 绑定分享学习成果按钮 */
    let btnShare = document.getElementById('btnShareAchievement');
    if (btnShare) {
      btnShare.addEventListener('click', App.shareAchievement);
    }

    /* 绑定每日目标保存事件（innerHTML 同步赋值后 DOM 已可用） */
      let goalInput = document.getElementById('dailyGoalInput');
      let saveBtn = document.getElementById('btnSaveGoal');
      if (goalInput && saveBtn) {
        saveBtn.addEventListener('click', function () {
          let v = parseInt(goalInput.value, 10);
          if (v >= 5 && v <= 200) {
            localStorage.setItem('flashcard-daily-goal', v);
            App.renderStatsPanel();
          }
        });
      }
  };

  App._renderHeatmap = function (log) {
    let cells = '';
    let now = new Date();
    for (let i = 29; i >= 0; i--) {
      let d = new Date(now);
      d.setDate(d.getDate() - i);
      let key = d.toISOString().slice(0, 10);
      let dayData = log[key] || { correct: 0, wrong: 0 };
      let total = dayData.correct + dayData.wrong;
      let level = total === 0 ? 0 : total < 10 ? 1 : total < 30 ? 2 : total < 60 ? 3 : 4;
      let title = key + ': ' + total + ' 次学习';
      cells += '<div class="heat-cell heat-level-' + level + '" title="' + title + '"></div>';
    }
    return cells;
  };

})(FlashcardApp);
