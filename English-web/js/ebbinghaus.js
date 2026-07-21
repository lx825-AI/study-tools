/* ebbinghaus.js —— 艾宾浩斯遗忘曲线复习调度 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 艾宾浩斯复习阶段定义（间隔天数逐步拉长） */
  App.EB_STAGES = [
    { stage: 0, label: '新学',  interval: 0  },
    { stage: 1, label: '1天后',  interval: 1  },
    { stage: 2, label: '2天后',  interval: 2  },
    { stage: 3, label: '4天后',  interval: 4  },
    { stage: 4, label: '7天后',  interval: 7  },
    { stage: 5, label: '15天后', interval: 15 },
    { stage: 6, label: '30天后', interval: 30 },
    { stage: 7, label: '90天后', interval: 90 },
  ];

  App.EB_MASTERED_STAGE = 7;

  /** 初始化卡片的艾宾浩斯字段（兼容旧数据） */
  App.initEbbinghaus = function (card) {
    if (typeof card.ebbinghausStage !== 'number') {
      card.ebbinghausStage = 0;
    }
    if (!card.ebbinghausNextReview) {
      card.ebbinghausNextReview = '';
    }
    if (!Array.isArray(card.ebbinghausHistory)) {
      card.ebbinghausHistory = [];
    }
  };

  /** 判读卡片是否为新词（尚未进入复习循环） */
  App.isNewWord = function (card) {
    return !card.ebbinghausStage || card.ebbinghausStage === 0;
  };

  /** 判读卡片今日是否需要复习 */
  App.isDueToday = function (card) {
    if (!card.ebbinghausNextReview) return false;
    var today = new Date().toISOString().slice(0, 10);
    return card.ebbinghausNextReview <= today;
  };

  /** 判读卡片是否逾期未复习 */
  App.isOverdue = function (card) {
    if (!card.ebbinghausNextReview) return false;
    var today = new Date().toISOString().slice(0, 10);
    return card.ebbinghausNextReview < today;
  };

  /** 获取逾期天数（用于排序优先级） */
  App.getOverdueDays = function (card) {
    if (!card.ebbinghausNextReview) return 0;
    var today = new Date();
    var reviewDate = new Date(card.ebbinghausNextReview + 'T00:00:00');
    if (isNaN(reviewDate.getTime())) return 0;
    return Math.max(0, Math.floor((today - reviewDate) / (1000 * 60 * 60 * 24)));
  };

  /**
   * 应用艾宾浩斯复习结果
   * @param {Object} card - 卡片对象
   * @param {boolean} passed - 是否通过复习
   * @returns {Object} 返回复习结果信息
   */
  App.applyEbbinghaus = function (card, passed) {
    App.initEbbinghaus(card);
    var today = new Date().toISOString().slice(0, 10);

    if (passed) {
      /* 通过：推进到下一阶段 */
      if (card.ebbinghausStage < App.EB_MASTERED_STAGE) {
        card.ebbinghausStage++;
      }
      var nextStage = App.EB_STAGES[card.ebbinghausStage];
      var nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextStage.interval);
      card.ebbinghausNextReview = nextDate.toISOString().slice(0, 10);

      card.ebbinghausHistory.push({
        stage: card.ebbinghausStage,
        date: today,
        passed: true,
      });

      return {
        stage: card.ebbinghausStage,
        nextReview: card.ebbinghausNextReview,
        isMastered: card.ebbinghausStage >= App.EB_MASTERED_STAGE,
      };
    } else {
      /* 失败：回退到阶段 1，重新开始遗忘曲线 */
      var prevStage = card.ebbinghausStage;
      card.ebbinghausStage = 1;
      var retryDate = new Date();
      retryDate.setDate(retryDate.getDate() + App.EB_STAGES[1].interval);
      card.ebbinghausNextReview = retryDate.toISOString().slice(0, 10);

      card.ebbinghausHistory.push({
        stage: prevStage,
        date: today,
        passed: false,
      });

      return {
        stage: 1,
        prevStage: prevStage,
        nextReview: card.ebbinghausNextReview,
        isMastered: false,
      };
    }
  };

  /**
   * 从牌组中获取今日待复习卡片
   * 按逾期天数降序排列（最紧急的优先）
   */
  App.getReviewCards = function (deck) {
    if (!deck || !deck.cards) return [];
    var today = new Date().toISOString().slice(0, 10);
    return deck.cards
      .filter(function (c) {
        App.initEbbinghaus(c);
        return c.ebbinghausNextReview && c.ebbinghausNextReview <= today;
      })
      .sort(function (a, b) {
        /* 逾期天数多的优先 */
        var aOverdue = App.getOverdueDays(a);
        var bOverdue = App.getOverdueDays(b);
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        /* 同逾期，阶段低的优先（基础不牢） */
        return (a.ebbinghausStage || 0) - (b.ebbinghausStage || 0);
      });
  };

  /**
   * 从牌组中获取新词（尚未开始学习的）
   */
  App.getNewWordCards = function (deck, limit) {
    if (!deck || !deck.cards) return [];
    limit = limit || 10;
    return deck.cards
      .filter(function (c) { return App.isNewWord(c); })
      .slice(0, limit);
  };

  /** 统计牌组的艾宾浩斯阶段分布 */
  App.getEbbinghausStats = function (deck) {
    var stats = { newWords: 0, reviewing: 0, dueToday: 0, mastered: 0, overdue: 0 };
    if (!deck || !deck.cards) return stats;
    var today = new Date().toISOString().slice(0, 10);

    deck.cards.forEach(function (c) {
      App.initEbbinghaus(c);
      if (App.isNewWord(c)) {
        stats.newWords++;
      } else if (c.ebbinghausStage >= App.EB_MASTERED_STAGE) {
        stats.mastered++;
      } else {
        stats.reviewing++;
      }
      if (App.isDueToday(c)) stats.dueToday++;
      if (App.isOverdue(c)) stats.overdue++;
    });

    return stats;
  };

  /** 迁移旧卡片数据：为没有艾宾浩斯字段的卡片初始化 */
  App.migrateCardsEbbinghaus = function () {
    var migrated = 0;
    App.state.decks.forEach(function (deck) {
      deck.cards.forEach(function (card) {
        if (typeof card.ebbinghausStage !== 'number') {
          /* 根据 SM-2 状态推断初始阶段 */
          if (card.repetitions > 0 && card.easeFactor >= 2.8) {
            card.ebbinghausStage = Math.min(App.EB_MASTERED_STAGE, card.repetitions);
          } else if (card.repetitions > 0) {
            card.ebbinghausStage = Math.max(1, Math.min(3, card.repetitions));
          } else {
            card.ebbinghausStage = 0;
          }

          if (card.nextReview) {
            card.ebbinghausNextReview = card.nextReview;
          } else {
            var d = new Date();
            d.setDate(d.getDate() + 1);
            card.ebbinghausNextReview = d.toISOString().slice(0, 10);
          }

          card.ebbinghausHistory = [];
          migrated++;
        }
      });
    });

    if (migrated > 0) {
      App.saveData();
      console.log('Ebbinghaus migration: ' + migrated + ' cards updated');
    }
  };

})(FlashcardApp);
