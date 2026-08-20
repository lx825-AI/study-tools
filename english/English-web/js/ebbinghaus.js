/* ebbinghaus.js —— 艾宾浩斯遗忘曲线复习调度（与小程序 English-mini-app 行为一致） */
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

  /** 初始化卡片的艾宾浩斯字段（兼容旧数据），夹紧 stage 到 [0, 7]（镜像小程序） */
  App.initEbbinghaus = function (card) {
    /* NaN 的 typeof 也是 'number'，需要额外检查 */
    if (typeof card.ebbinghausStage !== 'number' || isNaN(card.ebbinghausStage)) {
      card.ebbinghausStage = 0;
    }
    /* 夹紧到合法范围 */
    if (card.ebbinghausStage < 0) card.ebbinghausStage = 0;
    if (card.ebbinghausStage > App.EB_MASTERED_STAGE) card.ebbinghausStage = App.EB_MASTERED_STAGE;
    if (!card.ebbinghausNextReview) {
      card.ebbinghausNextReview = '';
    }
    if (!Array.isArray(card.ebbinghausHistory)) {
      card.ebbinghausHistory = [];
    }
    /* 截断历史记录（保留最近 100 条，防止存储膨胀） */
    if (card.ebbinghausHistory.length > 100) {
      card.ebbinghausHistory = card.ebbinghausHistory.slice(-100);
    }
    /* 初始化连续失败计数 */
    if (typeof card._consecutiveFails !== 'number') {
      card._consecutiveFails = 0;
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

  /** 获取逾期天数（用于排序优先级；日期统一 UTC 解析，修复本地 00:00-08:00 窗口今日到期被误判逾期） */
  App.getOverdueDays = function (card) {
    if (!card.ebbinghausNextReview) return 0;
    var today = new Date();
    today.setUTCHours(0, 0, 0, 0); /* UTC 日界 */
    var reviewDate = new Date(card.ebbinghausNextReview + 'T00:00:00Z');
    if (isNaN(reviewDate.getTime())) return 0;
    return Math.max(0, Math.round((today - reviewDate) / (1000 * 60 * 60 * 24)));
  };

  /**
   * 计算逾期遗忘惩罚（暴露为 App 方法便于测试，镜像小程序）
   * 逾期越久，阶段降得越多
   * @param {Object} card - 卡片对象
   * @returns {number} 需要降低的阶段数
   */
  App.getOverduePenalty = function (card) {
    var overdueDays = App.getOverdueDays(card);
    if (overdueDays <= 3) return 0; /* 1-3天：无惩罚 */
    if (overdueDays <= 7) return 1; /* 4-7天：降1级 */
    return 2;                       /* >7天：降2级 */
  };

  /**
   * 计算智能回退阶段（暴露为 App 方法便于测试，镜像小程序）
   * 根据历史失败次数和当前阶段动态决定
   * @param {Object} card - 卡片对象
   * @returns {number} 回退后的阶段
   */
  App.calculateFallbackStage = function (card) {
    var currentStage = card.ebbinghausStage;
    var consecutiveFails = card._consecutiveFails || 0;

    /* 阶段 ≤ 2 失败：直接回到 stage 1 */
    if (currentStage <= 2) {
      return 1;
    }

    /* 连续失败 ≥ 2 次：回到 stage 1 */
    if (consecutiveFails >= 2) {
      return 1;
    }

    /* 首次失败：回退 1 个阶段（温和惩罚） */
    return Math.max(1, currentStage - 1);
  };

  /**
   * 计算卡片紧急度评分（暴露为 App 方法便于测试，镜像小程序）
   * 综合考虑逾期天数、阶段、难度、历史错误
   * @param {Object} card - 卡片对象
   * @returns {number} 紧急度分数（越高越紧急）
   */
  App.calcUrgencyScore = function (card) {
    var score = 0;

    /* 1. 逾期权重（最高50分）；复用 getOverdueDays（含非法日期 NaN 防御） */
    var overdueDays = App.getOverdueDays(card);

    if (overdueDays > 7) {
      score += 50; /* 严重逾期 */
    } else if (overdueDays > 3) {
      score += 35; /* 中度逾期 */
    } else if (overdueDays > 0) {
      score += 20; /* 轻度逾期 */
    } else {
      score += 10; /* 今日到期 */
    }

    /* 2. 阶段权重（阶段越低越紧急，最高15分） */
    var stage = card.ebbinghausStage || 0;
    if (stage <= 2) {
      score += 15;
    } else if (stage <= 4) {
      score += 10;
    } else {
      score += 5;
    }

    /* 3. 难度权重（easeFactor越低越难，最高15分） */
    var ef = card.easeFactor || 2.5;
    if (ef < 1.8) {
      score += 15; /* 很难 */
    } else if (ef < 2.2) {
      score += 10; /* 较难 */
    } else {
      score += 5; /* 一般 */
    }

    /* 4. 历史错误权重（最高10分） */
    var wrongCount = card.wrongCount || 0;
    if (wrongCount > 3) {
      score += 10;
    } else if (wrongCount > 0) {
      score += 5;
    }

    return score;
  };

  /**
   * 应用艾宾浩斯复习结果（镜像小程序 applyEbbinghaus）
   * @param {Object} card - 卡片对象
   * @param {boolean} passed - 是否通过复习
   * @param {string} quality - 回答质量: 'correct' | 'fuzzy' | 'hesitate' | 'wrong'
   * @returns {Object} 返回复习结果信息
   */
  App.applyEbbinghaus = function (card, passed, quality) {
    quality = quality || 'correct';
    App.initEbbinghaus(card);
    var today = new Date().toISOString().slice(0, 10);

    if (passed) {
      /* 通过：根据质量决定推进幅度 */
      var prevStage = card.ebbinghausStage;

      if (quality === 'correct') {
        /* 完全掌握：推进到下一阶段 */
        if (card.ebbinghausStage < App.EB_MASTERED_STAGE) {
          card.ebbinghausStage++;
        }
      }
      /* 答对 → easeFactor 提升 + repetitions 递增 */
      var ef = card.easeFactor || 2.5;
      card.easeFactor = Math.min(3.5, ef + 0.1);
      card.repetitions = (card.repetitions || 0) + 1;

      /* 逾期通过降级门控改用推进前的 prevStage */
      var overdueDays = App.getOverdueDays(card);
      if (overdueDays > 7 && quality === 'correct' && prevStage > 1) {
        card.ebbinghausStage = Math.max(1, card.ebbinghausStage - 1);
      }

      /* 重置连续失败计数 */
      card._consecutiveFails = 0;

      /* 计算下次复习日期（含自适应微调） */
      var nextStage = App.EB_STAGES[card.ebbinghausStage] || App.EB_STAGES[App.EB_MASTERED_STAGE];
      var interval = nextStage.interval;

      /* 自适应微调：根据 easeFactor 调整间隔（以 2.5 为基准） */
      if (card.easeFactor && card.easeFactor > 0) {
        var modifier = card.easeFactor / 2.5;
        interval = Math.max(1, Math.round(interval * modifier));
      }

      var nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);
      card.ebbinghausNextReview = nextDate.toISOString().slice(0, 10);

      card.ebbinghausHistory.push({
        stage: card.ebbinghausStage,
        date: today,
        passed: true,
        quality: quality,
      });

      return {
        stage: card.ebbinghausStage,
        prevStage: prevStage,
        nextReview: card.ebbinghausNextReview,
        isMastered: card.ebbinghausStage >= App.EB_MASTERED_STAGE,
      };
    } else {
      /* 失败：智能回退 */
      var failPrevStage = card.ebbinghausStage;

      /* 答错 → easeFactor 降低 + repetitions 重置 */
      var failEf = card.easeFactor || 2.5;
      card.easeFactor = Math.max(1.3, failEf - 0.2);
      card.repetitions = 0;

      /* 增加连续失败计数 */
      card._consecutiveFails = (card._consecutiveFails || 0) + 1;

      /* 计算失败回退阶段（基于连续失败次数） */
      var fallbackStage = App.calculateFallbackStage(card);

      /* 计算独立的逾期惩罚阶段（基于原始阶段）— 取两者中更严格的 */
      var overduePenalty = App.getOverduePenalty(card);
      var overdueStage = Math.max(1, (card.ebbinghausStage || 1) - overduePenalty);

      /* 失败回退和逾期惩罚不叠加，取更保守（更低）的阶段 */
      card.ebbinghausStage = Math.min(fallbackStage, overdueStage);

      /* 计算下次复习日期 */
      var retryStage = App.EB_STAGES[card.ebbinghausStage] || App.EB_STAGES[1];
      var retryDate = new Date();
      retryDate.setDate(retryDate.getDate() + retryStage.interval);
      card.ebbinghausNextReview = retryDate.toISOString().slice(0, 10);

      card.ebbinghausHistory.push({
        stage: failPrevStage,
        date: today,
        passed: false,
        quality: quality,
      });

      return {
        stage: card.ebbinghausStage,
        prevStage: failPrevStage,
        nextReview: card.ebbinghausNextReview,
        isMastered: false,
      };
    }
  };

  /**
   * 计算深度模式重插入位置（对齐小程序 markAnswer 动态队列）
   * 答错插回 idx+3；答对按作答后阶段插回 idx+5/+10/+15
   * 出现≥3次或阶段≥4 → 返回 -1 表示永久移出（wordsCompleted+1）
   * @param {Array} queue - 当前队列（当前卡已 splice 移除）
   * @param {number} idx - 当前卡移除前的位置
   * @param {Object} card - 作答后的卡片（applyEbbinghaus 已执行）
   * @param {boolean} passed - 是否答对
   * @param {number} appearances - 本轮出现次数（含本次）
   * @returns {number} 重插入位置；-1 表示永久移出
   */
  App.computeDeepReinsert = function (queue, idx, card, passed, appearances) {
    var maxAppearances = 3;
    var stage = card.ebbinghausStage || 0;
    var pos = -1;

    if (appearances < maxAppearances && stage < 4) {
      if (!passed) {
        pos = idx + 3;
      } else if (stage <= 1) {
        pos = idx + 5;
      } else if (stage === 2) {
        pos = idx + 10;
      } else if (stage === 3) {
        pos = idx + 15;
      }
      if (pos > queue.length) pos = queue.length;
    }
    return pos;
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
    limit = (typeof limit === 'number') ? limit : 10; /* limit=0 显式传参时返回空（对齐小程序） */
    return deck.cards
      .filter(function (c) { return App.isNewWord(c); })
      .slice(0, limit);
  };

  /** 统计牌组的艾宾浩斯阶段分布 */
  App.getEbbinghausStats = function (deck) {
    var stats = { newWords: 0, reviewing: 0, dueToday: 0, mastered: 0, overdue: 0 };
    if (!deck || !deck.cards) return stats;

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

  /** 迁移旧卡片数据：为没有艾宾浩斯字段的卡片初始化（镜像小程序 + Web 特有补种防御） */
  App.migrateCardsEbbinghaus = function () {
    var migrated = 0;
    App.state.decks.forEach(function (deck) {
      deck.cards.forEach(function (card) {
        if (typeof card.ebbinghausStage !== 'number' || isNaN(card.ebbinghausStage)) {
          /* 根据旧 SM-2 状态推断初始阶段 */
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
          card._consecutiveFails = 0;
          migrated++;
        }

        /* Web 特有防御：已进入复习的卡缺调度日期时用旧 SM-2 日期补种（否则永不进入复习队列） */
        if (card.ebbinghausStage > 0 && !card.ebbinghausNextReview && card.nextReview) {
          card.ebbinghausNextReview = card.nextReview;
        }
      });
    });

    if (migrated > 0) {
      App.saveData();
      console.log('Ebbinghaus migration: ' + migrated + ' cards updated');
    }
  };

})(FlashcardApp);
