/* stats-panel.js —— 学习统计面板（重设计：对齐小程序 stats.vue + 保留 Web 特有模块） */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 学习记录 key */
  App.LEARNING_LOG_KEY = 'flashcard-learning-log';

  /* 加载学习日志: { 'YYYY-MM-DD': { correct, wrong, cardsStudied, duration, completedGoal } } */
  App.loadLearningLog = function () {
    try {
      let raw = localStorage.getItem(App.LEARNING_LOG_KEY);
      let log = raw ? JSON.parse(raw) : {};
      return log && typeof log === 'object' ? log : {}; /* 对象形状守卫（对齐 loadQuickLog） */
    } catch (e) { return {}; }
  };

  /**
   * 会话结果去重（对齐小程序 processedCards）：同一卡片多次作答只保留最后一次结果
   * @param {Array} results - [{cardId, word, passed}]
   * @returns {Array} 去重后的结果（保持顺序）
   */
  App.dedupeStudyResults = function (results) {
    if (!Array.isArray(results) || results.length === 0) return [];
    var seen = {};
    var unique = [];
    /* 尾到头遍历：后出现的作答覆盖先出现的（保留每卡最后一次结果） */
    for (var i = results.length - 1; i >= 0; i--) {
      var r = results[i];
      if (!seen[r.cardId]) {
        seen[r.cardId] = true;
        unique.unshift(r);
      }
    }
    return unique;
  };

  /**
   * 会话完成汇总写入日志（对齐小程序 saveProgress）：
   * 按卡去重统计 correct/wrong，附 cardsStudied/duration/completedGoal；当日覆盖语义
   */
  App.finalizeStudyLog = function () {
    var results = App.studyResults;
    if (!Array.isArray(results) || results.length === 0) return;
    var unique = App.dedupeStudyResults(results);
    if (unique.length === 0) return;

    var today = new Date().toISOString().slice(0, 10);
    var correct = unique.filter(function (r) { return r.passed; }).length;
    var duration = App.studyStartTime ? Math.round((Date.now() - App.studyStartTime) / 1000) : 0;
    var entry = {
      date: today,
      cardsStudied: unique.length,
      correct: correct,
      wrong: unique.length - correct,
      duration: duration,
      completedGoal: App.studyCompletedWords >= App.studyInitialQueueLength,
    };

    var key = (App.studyMode === 'quick') ? App.QUICK_LOG_KEY : App.LEARNING_LOG_KEY;
    var log = (key === App.QUICK_LOG_KEY) ? App.loadQuickLog() : App.loadLearningLog();
    /* 早退条目不覆盖当日已完成会话（切 tab 弃置会话不再回退当日统计）；
       当日只有早退条目时仍覆盖为最新早退，完成条目覆盖语义不变 */
    if (!entry.completedGoal && log[today] && log[today].completedGoal === true) return;
    log[today] = entry; /* 覆盖当日条目（对齐小程序 logs[today] = progressData） */
    try { localStorage.setItem(key, JSON.stringify(log)); } catch (e) { /* 忽略存储错误 */ }
  };

  /* 计算连续打卡天数 */
  App.calcStreak = function (log) {
    let streak = 0;
    let d = new Date();
    while (true) {
      let key = d.toISOString().slice(0, 10);
      if (log[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  };

  /* ===== 日历翻月状态（会话内粘住；year=0 哨兵 = 首次渲染取当月）与渲染上下文 ===== */
  var _calState = { year: 0, month: 0 };
  var _calContext = { studiedMap: {}, todayStr: '' };

  /* ===== HTML 构建器 ===== */

  function _htmlEmpty() {
    return '<div class="stats-empty">' +
      '<div class="stats-empty-icon">📊</div>' +
      '<div class="stats-empty-title">还没有学习数据</div>' +
      '<div class="stats-empty-desc">开始学习后，这里会展示你的学习统计</div>' +
      '<button id="btnStatsGoStudy" class="stats-empty-btn">开始学习 →</button>' +
    '</div>';
  }

  /** KPI 指标行（Web 仪表盘：4 张居中大数字卡） */
  function _htmlKpiRow(streak, weekWords, weekAccuracy, goalPercent) {
    function kpi(icon, value, label) {
      return '<div class="kpi-card">' +
        '<div class="kpi-value">' + icon + ' ' + value + '</div>' +
        '<div class="kpi-label">' + label + '</div>' +
      '</div>';
    }
    return '<div class="stats-kpi">' +
      kpi('🔥', streak + ' 天', '连续打卡') +
      kpi('📊', weekWords, '本周单词') +
      kpi('🎯', weekAccuracy + '%', '正确率') +
      kpi('⚡', goalPercent + '%', '目标进度') +
    '</div>';
  }

  function _htmlReportCard(series) {
    return '<div class="report-card">' +
      '<div class="report-header">' +
        '<span class="report-title">📊 本周学习报告</span>' +
        '<span class="report-trend' + (series.trendDown ? ' down' : '') + '">' + series.weekTrend + '</span>' +
      '</div>' +
      '<div class="report-grid">' +
        '<div class="report-item">' +
          '<span class="report-value">' + series.weekWords + '</span>' +
          '<span class="report-label">学习单词</span>' +
          '<span class="report-sub">' + App.escHtml(series.weekSubText) + '</span>' +
        '</div>' +
        '<div class="report-item">' +
          '<span class="report-value accent">' + series.weekDays + '/7</span>' +
          '<span class="report-label">学习天数</span>' +
          '<span class="report-sub">' + App.escHtml(series.weekDayText) + '</span>' +
        '</div>' +
        '<div class="report-item">' +
          '<span class="report-value success">' + series.weekAccuracy + '%</span>' +
          '<span class="report-label">正确率</span>' +
          '<span class="report-sub">' + App.escHtml(series.weekAccuracyText) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="week-chart">' +
        series.bars.map(function (b) {
          return '<div class="week-bar-col">' +
            '<span class="week-bar-num">' + b.total + '</span>' +
            '<div class="week-bar" style="height:' + b.heightPx + 'px" title="' + b.label + '：' + b.total + ' 词"></div>' +
            '<span class="week-bar-label">' + b.label + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function _htmlOverviewGrid(totalCards, masteredCount, dueToday, dueTomorrow) {
    return '<div class="stats-grid">' +
      '<div class="stat-card">' +
        '<div class="stat-value">' + totalCards + '</div>' +
        '<div class="stat-label">总词汇量</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-value">' + masteredCount + '</div>' +
        '<div class="stat-label">已掌握</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-value" style="color:' + (dueToday > 0 ? 'var(--danger-text)' : 'var(--success)') + '">' + dueToday + '</div>' +
        '<div class="stat-label">今日待复习</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-value">' + dueTomorrow + '</div>' +
        '<div class="stat-label">明日待复习</div>' +
      '</div>' +
    '</div>';
  }

  /** 打卡日历 HTML（数据来自 _calState/_calContext；翻月时局部重建以保住热力图滚动位） */
  function _htmlCalendar() {
    var cal = App.buildCalendarData(_calState.year, _calState.month, _calContext.studiedMap, _calContext.todayStr);
    var cellsHtml = cal.cells.map(function (c) {
      if (c.empty) return '<span class="calendar-day is-empty"></span>';
      var cls = 'calendar-day' +
        (c.isToday ? ' is-today' : '') +
        (c.studied ? ' is-studied' : '');
      return '<span class="' + cls + '">' + c.day + '</span>';
    }).join('');
    return '<div id="statsCalendarWrap">' +
      '<div class="calendar-card">' +
        '<div class="calendar-header">' +
          '<button class="calendar-nav" id="calPrev" aria-label="上一月">‹</button>' +
          '<span class="calendar-title">' + cal.title + '</span>' +
          '<button class="calendar-nav" id="calNext" aria-label="下一月">›</button>' +
        '</div>' +
        '<div class="calendar-weekdays">' +
          App.WEEKDAY_LABELS.map(function (w) { return '<span class="weekday">' + w + '</span>'; }).join('') +
        '</div>' +
        '<div class="calendar-grid">' + cellsHtml + '</div>' +
      '</div>' +
    '</div>';
  }

  function _htmlHeatmapCard(weeks) {
    var colsHtml = weeks.map(function (col) {
      return '<div class="heatmap-col">' +
        col.map(function (c) {
          /* 未来日期格淡显且无 tooltip（对齐小程序 isFuture 区分） */
          var futureCls = c.isFuture ? ' is-future' : '';
          var title = c.isFuture ? '' : ' title="' + c.date + ': ' + c.count + ' 次学习"';
          return '<div class="heatmap-cell heat12-l' + c.level + futureCls + '"' + title + '></div>';
        }).join('') +
      '</div>';
    }).join('');
    var legendCells = [0, 1, 2, 3, 4].map(function (l) {
      return '<span class="legend-cell heat12-l' + l + '"></span>';
    }).join('');
    return '<div class="heatmap-card">' +
      '<div class="heatmap-header">' +
        '<span class="heatmap-title">学习热力图（近 26 周）</span>' +
        '<div class="heatmap-legend"><span class="legend-label">少</span>' + legendCells + '<span class="legend-label">多</span></div>' +
      '</div>' +
      '<div class="heatmap-grid">' +
        '<div class="week-labels">' +
          App.WEEKDAY_LABELS.map(function (w) { return '<span class="day-label">' + w + '</span>'; }).join('') +
        '</div>' +
        '<div class="heatmap-scroll"><div class="heatmap-columns">' + colsHtml + '</div></div>' +
      '</div>' +
    '</div>';
  }

  function _htmlEbDistribution(distItems) {
    return '<div class="stats-section">' +
      '<div class="section-title">🧠 艾宾浩斯阶段分布</div>' +
      '<div class="eb-distribution">' +
        distItems.map(function (d) {
          return '<div class="eb-dist-row">' +
            '<span class="eb-dist-stage">' + d.label + '</span>' +
            '<span class="eb-dist-track"><span class="eb-dist-fill" style="width:' + d.percent + '%;background:' + d.color + '"></span></span>' +
            '<span class="eb-dist-count">' + d.count + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function _htmlFailedWords(weekWrong, failedCards) {
    var topFailed = failedCards
      .slice()
      .sort(function (a, b) { return (a.card.easeFactor || 2.5) - (b.card.easeFactor || 2.5); })
      .slice(0, 5)
      .map(function (f) {
        return '<div class="failed-word-item">' +
          '<span class="failed-word">' + App.escHtml(f.card.word || f.card.front) + '</span>' +
          '<span class="failed-ef">EF: ' + ((f.card.easeFactor || 2.5).toFixed(1)) + '</span>' +
          '<span class="failed-deck">' + App.escHtml(f.deckName) + '</span>' +
        '</div>';
      }).join('');
    return '<div class="stats-section">' +
      '<div class="section-title">📋 错题统计</div>' +
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
      '<div class="failed-words-list">' + topFailed + '</div>' : '') +
    '</div>';
  }

  /* ===== 事件绑定 ===== */

  /** 翻月（-1 上一月 / +1 下一月）后局部重建日历卡 */
  function _changeMonth(delta) {
    _calState.month += delta;
    if (_calState.month > 11) { _calState.month = 0; _calState.year++; }
    if (_calState.month < 0) { _calState.month = 11; _calState.year--; }
    App._renderCalendarCard();
  }

  /** 只重建日历卡 DOM（翻月不重建整页，保热力图滚动位置） */
  App._renderCalendarCard = function () {
    var wrap = document.getElementById('statsCalendarWrap');
    if (!wrap) return;
    wrap.innerHTML = _htmlCalendar();
    var prevBtn = document.getElementById('calPrev');
    var nextBtn = document.getElementById('calNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { _changeMonth(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { _changeMonth(1); });
  };

  function bindStatsEvents() {
    var goStudyBtn = document.getElementById('btnStatsGoStudy');
    if (goStudyBtn) goStudyBtn.addEventListener('click', function () { App.switchTab('study'); });

    var prevBtn = document.getElementById('calPrev');
    var nextBtn = document.getElementById('calNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { _changeMonth(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { _changeMonth(1); });
  }

  /* ===== 主渲染 ===== */
  App.renderStatsPanel = function () {
    var panel = document.getElementById('panelStats');
    if (!panel) return;

    var now = new Date();
    var todayKey = now.toISOString().slice(0, 10);
    var tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowKey = tomorrow.toISOString().slice(0, 10);

    /* 合并快速/深度日志（对齐小程序统计口径：quick 学习计入统计） */
    var mergedLog = App.mergeLogs(App.loadQuickLog(), App.loadLearningLog());

    /* 全量卡片聚合（现有口径：initEbbinghaus 归一 + 到期检测；decks 未初始化时防御） */
    var allCards = [];
    (App.state.decks || []).forEach(function (d) { allCards = allCards.concat(d.cards); });
    allCards.forEach(function (c) { App.initEbbinghaus(c); });
    var totalCards = allCards.length;

    var dueToday = 0, dueTomorrow = 0;
    allCards.forEach(function (c) {
      if (App.isDueToday(c)) dueToday++;
      if (c.ebbinghausNextReview === tomorrowKey) dueTomorrow++;
    });
    var distItems = App.stageDistribution(allCards);
    var masteredCount = distItems[7].count;

    /* 空状态：无卡片且无任何学习日志 */
    var logEntries = Object.keys(mergedLog);
    if (totalCards === 0 && logEntries.length === 0) {
      _calState = { year: 0, month: 0 }; /* 复位翻月状态：数据重新出现时日历回当月 */
      panel.innerHTML = _htmlEmpty();
      bindStatsEvents();
      return;
    }

    /* 打卡/周报/曲线数据 */
    var streak = App.calcStreak(mergedLog);
    var weekSeries = App.buildWeekSeries(mergedLog, now);
    var heatmapWeeks = App.buildHeatmapWeeks(mergedLog, now, 26); /* 近 26 周（半年，GitHub 风格） */
    var curveEntries = Object.values(mergedLog);

    /* 每日目标（KPI 行目标进度用；设置入口在学习模式选择引导页） */
    var dailyGoal = App.getDailyGoal();
    var todayData = mergedLog[todayKey] || { correct: 0, wrong: 0 };
    var todayTotal = todayData.correct + todayData.wrong;
    var goalPercent = Math.min(100, Math.round(todayTotal / dailyGoal * 100));

    /* 日历上下文（studiedMap + 今日；翻月状态首次渲染取当月） */
    if (_calState.year === 0) {
      _calState.year = now.getFullYear();
      _calState.month = now.getMonth();
    }
    var studiedMap = {};
    logEntries.forEach(function (k) {
      if ((mergedLog[k].cardsStudied || 0) > 0) studiedMap[k] = true;
    });
    _calContext = { studiedMap: studiedMap, todayStr: todayKey };

    var failedCards = App.collectFailedCards ? App.collectFailedCards() : [];

    /* 双列仪表盘布局：KPI 行 → 左列（报告/总览/错题）→ 右列（日历/曲线/目标/分享）→ 热力图与阶段分布跨列 */
    panel.innerHTML =
      _htmlKpiRow(streak, weekSeries.weekWords, weekSeries.weekAccuracy, goalPercent) +
      '<div class="stats-cols">' +
        '<div class="stats-col">' +
          _htmlReportCard(weekSeries) +
          _htmlOverviewGrid(totalCards, masteredCount, dueToday, dueTomorrow) +
          _htmlFailedWords(weekSeries.weekWrong, failedCards) +
        '</div>' +
        '<div class="stats-col">' +
          _htmlCalendar() +
          App.renderCurveSectionHtml(curveEntries) +
        '</div>' +
      '</div>' +
      _htmlHeatmapCard(heatmapWeeks) +
      _htmlEbDistribution(distItems);

    bindStatsEvents();
    App.drawStatsCurve();
  };
})(FlashcardApp);
