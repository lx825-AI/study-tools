/* daily-quote.js —— 每日英语名言（含中文释义），同一天返回同一句，支持切换 */
var FlashcardApp = window.FlashcardApp || {};
(function (App) {
  'use strict';

  /* 名言库（与小程序端 english_app 同源） */
  App.QUOTES = [
    /* 学习与成长 */
    { text: 'The secret of getting ahead is getting started.', zh: '成功的秘诀在于开始行动。', author: 'Mark Twain' },
    { text: 'Education is not the filling of a pail, but the lighting of a fire.', zh: '教育不是注满一桶水，而是点燃一把火。', author: 'W.B. Yeats' },
    { text: 'The beautiful thing about learning is that nobody can take it away from you.', zh: '学习的美妙之处在于没人能夺走它。', author: 'B.B. King' },
    { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', zh: '如明日将死般生活，如永生般学习。', author: 'Mahatma Gandhi' },
    { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', zh: '告诉我，我会忘记；教我，我会记住；让我参与，我才会学会。', author: 'Benjamin Franklin' },
    { text: 'An investment in knowledge pays the best interest.', zh: '投资知识，回报最丰。', author: 'Benjamin Franklin' },
    { text: 'The more that you read, the more things you will know.', zh: '读得越多，知道得越多。', author: 'Dr. Seuss' },
    { text: 'Learning is a treasure that will follow its owner everywhere.', zh: '学习是跟随主人一生的财富。', author: 'Chinese Proverb' },
    /* 语言与文化 */
    { text: 'A different language is a different vision of life.', zh: '一门不同的语言是另一种人生视角。', author: 'Federico Fellini' },
    { text: 'To have another language is to possess a second soul.', zh: '掌握另一门语言就是拥有第二个灵魂。', author: 'Charlemagne' },
    { text: 'Language is the road map of a culture.', zh: '语言是文化的路线图。', author: 'Rita Mae Brown' },
    { text: 'You can never understand one language until you understand at least two.', zh: '不懂两门语言，就无法真正理解一门语言。', author: 'Geoffrey Willans' },
    { text: 'The limits of my language mean the limits of my world.', zh: '语言的边界就是世界的边界。', author: 'Ludwig Wittgenstein' },
    { text: 'One language sets you in a corridor for life. Two languages open every door along the way.', zh: '一门语言让你走在走廊里，两门语言为你打开沿途每一扇门。', author: 'Frank Smith' },
    { text: 'He who knows no foreign languages knows nothing of his own.', zh: '不懂外语的人，对自己的语言也一无所知。', author: 'Johann Wolfgang von Goethe' },
    /* 坚持与毅力 */
    { text: 'Success is the sum of small efforts, repeated day in and day out.', zh: '成功是日复一日的小努力的积累。', author: 'Robert Collier' },
    { text: 'It does not matter how slowly you go as long as you do not stop.', zh: '前进缓慢没关系，只要你不停下脚步。', author: 'Confucius' },
    { text: 'The only way to do great work is to love what you do.', zh: '做出伟大工作的唯一方法是热爱你所做的事。', author: 'Steve Jobs' },
    { text: 'Believe you can and you are halfway there.', zh: '相信你能做到，你就已经成功了一半。', author: 'Theodore Roosevelt' },
    { text: 'Every expert was once a beginner.', zh: '每个专家都曾是初学者。', author: 'Helen Hayes' },
    { text: 'The journey of a thousand miles begins with a single step.', zh: '千里之行，始于足下。', author: 'Lao Tzu' },
    { text: 'Practice does not make perfect. Only perfect practice makes perfect.', zh: '练习不能成就完美，只有完美的练习才能成就完美。', author: 'Vince Lombardi' },
    { text: 'I have not failed. I have just found 10,000 ways that will not work.', zh: '我没有失败，我只是找到了一万种行不通的方法。', author: 'Thomas Edison' },
    /* 知识与智慧 */
    { text: 'Knowledge is power.', zh: '知识就是力量。', author: 'Francis Bacon' },
    { text: 'The mind is not a vessel to be filled, but a fire to be kindled.', zh: '心灵不是一个需要填满的容器，而是一团需要点燃的火焰。', author: 'Plutarch' },
    { text: 'Reading is to the mind what exercise is to the body.', zh: '阅读之于心灵，犹如运动之于身体。', author: 'Joseph Addison' },
    { text: 'A book is a dream that you hold in your hand.', zh: '书是你握在手中的梦。', author: 'Neil Gaiman' },
    { text: 'The more I read, the more I acquire, the more certain I am that I know nothing.', zh: '我读得越多，越确定自己一无所知。', author: 'Voltaire' },
    { text: 'In the middle of difficulty lies opportunity.', zh: '困难之中蕴藏着机遇。', author: 'Albert Einstein' },
    /* 时间与效率 */
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', zh: '种一棵树最好的时间是二十年前，其次是现在。', author: 'Chinese Proverb' },
    { text: 'Yesterday is history, tomorrow is a mystery, today is a gift.', zh: '昨天是历史，明天是谜团，今天是礼物。', author: 'Alice Morse Earle' },
    { text: 'Do not wait; the time will never be just right.', zh: '不要等待，时机永远不会恰到好处。', author: 'Napoleon Hill' },
    { text: 'Lost time is never found again.', zh: '失去的时间永远找不回来。', author: 'Benjamin Franklin' },
    { text: 'A year from now you may wish you had started today.', zh: '一年后，你可能会希望今天就开始了。', author: 'Karen Lamb' }
  ];

  /* 当前展示索引与切换防抖（对齐小程序 daily-quote.js currentIndex/isQuoteSwitching） */
  var _quoteIndex = 0;
  var _quoteSwitching = false;
  var _quoteTimer1 = null; /* 150ms 后换文本 */
  var _quoteTimer2 = null; /* 再 150ms 后恢复动画态 */

  /** 获取今日名言（每日随机固定，同日同句）；同步展示索引供顺序切换 */
  App.pickTodayQuote = function () {
    var today = new Date().toISOString().slice(0, 10);
    var storedDate = null;
    var index;
    try { storedDate = localStorage.getItem('flashcard-quote-date'); } catch (e) { /* 忽略 */ }

    if (storedDate === today) {
      index = parseInt(localStorage.getItem('flashcard-quote-index') || '0', 10);
    } else {
      index = Math.floor(Math.random() * App.QUOTES.length);
      try {
        localStorage.setItem('flashcard-quote-date', today);
        localStorage.setItem('flashcard-quote-index', String(index));
      } catch (e) { /* 忽略存储错误 */ }
    }

    _quoteIndex = index;
    return App.QUOTES[index];
  };

  /** 顺序循环取下一句（不写 storage，仅会话内切换，对齐小程序 getNextQuote） */
  App.getNextQuote = function () {
    _quoteIndex = (_quoteIndex + 1) % App.QUOTES.length;
    return App.QUOTES[_quoteIndex];
  };

  /** 单条名言 HTML */
  function _quoteHtml(quote) {
    return '<div class="quote-text">“' + App.escHtml(quote.text) + '”</div>' +
      '<div class="quote-zh">' + App.escHtml(quote.zh) + '</div>' +
      '<div class="quote-author">— ' + App.escHtml(quote.author) + '</div>';
  }

  /** 渲染每日一句（对齐小程序：当日固定一句 + 整卡点击顺序切换） */
  App.renderDailyQuote = function () {
    var el = document.getElementById('dailyQuoteCard');
    if (!el) return;
    var quote = App.pickTodayQuote();
    if (!quote) return;
    /* 重建时重置切换态并清掉进行中的切换定时器（对齐小程序 onShow 回到当日句，
       防动画中重建后旧回调仍改写文本） */
    _quoteSwitching = false;
    if (_quoteTimer1) { clearTimeout(_quoteTimer1); _quoteTimer1 = null; }
    if (_quoteTimer2) { clearTimeout(_quoteTimer2); _quoteTimer2 = null; }
    el.classList.remove('quote-switching');
    el.innerHTML = _quoteHtml(quote);
    el.onclick = App.switchQuote; /* 属性绑定：innerHTML 重建不累积监听 */
  };

  /** 点击切换下一句：150ms 淡出动画换文本，150ms 恢复（对齐小程序 switchQuote） */
  App.switchQuote = function () {
    if (_quoteSwitching) return; /* 切换中忽略重复点击 */
    var el = document.getElementById('dailyQuoteCard');
    if (!el) return;
    _quoteSwitching = true;
    el.classList.add('quote-switching');
    _quoteTimer1 = setTimeout(function () {
      _quoteTimer1 = null;
      el.innerHTML = _quoteHtml(App.getNextQuote());
      _quoteTimer2 = setTimeout(function () {
        _quoteTimer2 = null;
        el.classList.remove('quote-switching');
        _quoteSwitching = false;
      }, 150);
    }, 150);
  };
})(FlashcardApp);
