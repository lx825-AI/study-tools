import { useMemo } from 'react';
import {
  usePractice,
  renderLatexStr,
  loadScores,
  type Question,
} from '../hooks/usePractice';
import { useDailyChallenge } from '../hooks/useDailyChallenge';

interface PracticeProps {
  favorites: Set<string>;
  onFav: (sectionId: string, index: number) => void;
  onCopy: (sectionId: string, index: number) => void;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Setup 阶段                                                         */
/* ------------------------------------------------------------------ */

function PracticeSetup({ practice, favorites, daily }: {
  practice: ReturnType<typeof usePractice>;
  favorites: Set<string>;
  daily: ReturnType<typeof useDailyChallenge>;
}) {
  const scores = useMemo(() => loadScores(), []);

  const handleDailyChallenge = () => {
    practice.startDailyChallenge();
  };

  return (
    <div className="practice-panel">
      <div className="practice-header">
        <h2>公式测验</h2>
      </div>

      {/* 每日挑战卡片 */}
      <div className="daily-challenge-card">
        <div className="daily-challenge-info">
          <span className="daily-challenge-icon">{daily.isCompleted ? '✅' : '🎯'}</span>
          <div>
            <div className="daily-challenge-title">
              {daily.isCompleted ? '今日挑战已完成' : '今日挑战'}
            </div>
            <div className="daily-challenge-sub">
              {daily.isCompleted
                ? '明天再来吧！'
                : '5 道随机选择题，看看今天能得几分？'}
            </div>
          </div>
        </div>
        <div className="daily-challenge-streak">
          {daily.emoji && <span>{daily.emoji}</span>}
          <span className="daily-streak-count">{daily.streak}</span>
          <span className="daily-streak-label">天连续</span>
        </div>
        {!daily.isCompleted && (
          <button className="btn btn-primary daily-challenge-btn" onClick={handleDailyChallenge}>
            开始今日挑战
          </button>
        )}
      </div>
      <div className="practice-setup">
        <div className="practice-field">
          <label>题目来源</label>
          <div className="practice-options">
            <button
              className={`btn btn-sm ${practice.poolMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => practice.setPoolMode('all')}
            >
              全部公式 ({practice.allFormulas.length} 条)
            </button>
            <button
              className={`btn btn-sm ${practice.poolMode === 'favorites' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => practice.setPoolMode('favorites')}
              disabled={favorites.size === 0}
            >
              收藏夹 ({favorites.size} 条)
            </button>
            <button
              className={`btn btn-sm ${practice.poolMode === 'mistakes' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => practice.setPoolMode('mistakes')}
              disabled={practice.mistakeCount === 0}
            >
              错题复习 ({practice.mistakeCount} 条)
            </button>
          </div>
        </div>
        <div className="practice-field">
          <label>测验模式</label>
          <div className="practice-options">
            <button
              className={`btn btn-sm ${practice.quizMode === 'mcq' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => practice.setQuizMode('mcq')}
            >
              📝 选择题
            </button>
            <button
              className={`btn btn-sm ${practice.quizMode === 'flashcard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => practice.setQuizMode('flashcard')}
            >
              🃏 闪卡记忆
            </button>
          </div>
        </div>
        <div className="practice-field">
          <label>题目数量</label>
          <div className="practice-options">
            {[5, 10, 20].map(n => (
              <button
                key={n}
                className={`btn btn-sm ${practice.count === n ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => practice.setCount(n)}
                disabled={n > practice.pool.length}
              >
                {n} 题
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={practice.startQuiz}
          disabled={practice.pool.length < 4}
          style={{ marginTop: 16, width: '100%' }}
        >
          {practice.pool.length < 4
            ? '需要至少 4 条公式才能开始测验'
            : `开始测验 (${Math.min(practice.count, practice.pool.length)} 题)`}
        </button>
      </div>

      {scores.length > 0 && (
        <div className="practice-history">
          <h3>历史成绩</h3>
          <div className="practice-score-bar">
            {scores.slice(-10).map((s, i) => (
              <div key={i} className="practice-score-dot" title={`${s}%`}>
                <div
                  className="practice-score-fill"
                  style={{
                    height: `${s}%`,
                    backgroundColor: s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--warning)' : 'var(--danger)',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            最近 {Math.min(10, scores.length)} 次 · 平均{' '}
            {Math.round(scores.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, scores.length))}%
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  闪卡 阶段                                                           */
/* ------------------------------------------------------------------ */

function PracticeFlashcard({ practice }: {
  practice: ReturnType<typeof usePractice>;
}) {
  const q = practice.questions[practice.qIndex];

  return (
    <div className="practice-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="btn btn-sm btn-outline" onClick={practice.goToSetup}>
          退出
        </button>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {practice.qIndex + 1} / {practice.questions.length}
        </span>
      </div>

      <div
        className="flashcard-container"
        onClick={() => practice.setFlashcardFlipped(prev => !prev)}
      >
        <div className={`flashcard${practice.flashcardFlipped ? ' flipped' : ''}`}>
          <div className="flashcard-front">
            <div className="flashcard-label">📖 公式名称</div>
            <div className="flashcard-name">{q.formula.name}</div>
            {q.formula.note && (
              <div className="flashcard-hint">💡 记忆提示：{q.formula.note}</div>
            )}
            <div className="flashcard-tap-hint">👆 点击翻转查看公式</div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-label">📐 公式内容</div>
            <div
              className="flashcard-latex"
              dangerouslySetInnerHTML={{ __html: renderLatexStr(q.formula.latex) }}
            />
            {q.formula.detail && (
              <div className="flashcard-detail">{q.formula.detail}</div>
            )}
            <div className="flashcard-actions">
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={e => { e.stopPropagation(); practice.handleFlashcardUnknown(); }}
              >
                ✗ 不记得
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={e => { e.stopPropagation(); practice.handleFlashcardKnown(); }}
              >
                ✓ 记得了
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>
        <span style={{ color: 'var(--success)' }}>✓ {practice.flashcardKnown}</span>
        {' / '}
        <span style={{ color: 'var(--text-muted)' }}>{practice.questions.length}</span>
        {' 条已掌握'}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  选择题 阶段                                                         */
/* ------------------------------------------------------------------ */

function PracticeQuiz({ practice }: {
  practice: ReturnType<typeof usePractice>;
}) {
  const q = practice.questions[practice.qIndex];
  const answered = practice.selectedOption !== null;

  return (
    <div className="practice-panel">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-sm btn-outline" onClick={practice.goToSetup}>
          退出测验
        </button>
      </div>
      <div className="practice-progress">
        <div className="practice-progress-bar">
          <div
            className="practice-progress-fill"
            style={{ width: `${((practice.qIndex + (answered ? 1 : 0)) / practice.questions.length) * 100}%` }}
          />
        </div>
        <span>{practice.qIndex + 1} / {practice.questions.length}</span>
      </div>

      <div className="practice-question">
        <div className="practice-formula-name">{q.formula.name}</div>
        {q.formula.note && (
          <div className="practice-formula-note">{q.formula.note}</div>
        )}
        {q.formula.detail && (
          <div className="practice-formula-detail">{q.formula.detail}</div>
        )}
      </div>

      <div className="practice-choices">
        {q.options.map((opt, i) => {
          let cls = 'practice-choice';
          if (answered) {
            if (opt.correct) cls += ' correct';
            else if (i === practice.selectedOption) cls += ' wrong';
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={answered}
              onClick={() => practice.handleMcqAnswer(i)}
              dangerouslySetInnerHTML={{ __html: renderLatexStr(opt.latex) }}
            />
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <span style={{ color: 'var(--success)' }}>{practice.answers.filter(Boolean).length}</span>
        {' / '}
        <span style={{ color: 'var(--danger)' }}>{practice.answers.filter(a => !a).length}</span>
        {'  '}✔ | ✘
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  结果 阶段                                                           */
/* ------------------------------------------------------------------ */

function PracticeResult({ practice, favorites, onFav, onCopy, onClose, daily }: {
  practice: ReturnType<typeof usePractice>;
  favorites: Set<string>;
  onFav: (sectionId: string, index: number) => void;
  onCopy: (sectionId: string, index: number) => void;
  onClose: () => void;
  daily: ReturnType<typeof useDailyChallenge>;
}) {
  const { questions, answers, score } = practice;
  const pct = Math.round((score / questions.length) * 100);

  // 每日挑战完成记录（仅对5题全题库模式的快速挑战）
  useMemo(() => {
    if (questions.length === 5 && !daily.isCompleted) {
      daily.completeChallenge(score, questions.length);
    }
  }, []);

  return (
    <div className="practice-panel">
      <h2 style={{ textAlign: 'center' }}>测验完成</h2>
      <div className="practice-result">
        <div className="practice-result-score">{score} / {questions.length}</div>
        <div className="practice-result-pct">{pct}%</div>
        <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
          {pct >= 100 ? '满分！太厉害了！' : pct >= 80 ? '表现优秀！' : pct >= 60 ? '还不错，继续加油！' : '多加练习，你可以的！'}
        </div>

        <div className="practice-result-answers">
          {questions.map((q: Question, i: number) => (
            <div
              key={`${q.sectionId}:${q.index}`}
              className={`practice-result-item ${answers[i] ? 'correct' : 'wrong'}`}
            >
              <div className="practice-result-name">
                {answers[i] ? '✓' : '✗'} {q.formula.name}
              </div>
              <div
                className="practice-result-latex"
                dangerouslySetInnerHTML={{ __html: renderLatexStr(q.formula.latex) }}
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onFav(q.sectionId, q.index)}
                  title={favorites.has(`${q.sectionId}:${q.index}`) ? '取消收藏' : '收藏'}
                >
                  {favorites.has(`${q.sectionId}:${q.index}`) ? '★' : '☆'}
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onCopy(q.sectionId, q.index)}
                >
                  复制 LaTeX
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={practice.startQuiz}>再来一轮</button>
          <button className="btn btn-outline" onClick={practice.goToSetup}>返回设置</button>
          <button className="btn btn-outline" onClick={onClose}>退出测验</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  主组件 — 状态由 usePractice hook 管理，这里只做阶段路由               */
/* ------------------------------------------------------------------ */

export default function PracticePanel({ favorites, onFav, onCopy, onClose }: PracticeProps) {
  const practice = usePractice({ favorites });
  const daily = useDailyChallenge();

  switch (practice.phase) {
    case 'setup':
      return <PracticeSetup practice={practice} favorites={favorites} daily={daily} />;
    case 'flashcard':
      return <PracticeFlashcard practice={practice} />;
    case 'quiz':
      return <PracticeQuiz practice={practice} />;
    case 'result':
      return (
        <PracticeResult
          practice={practice}
          favorites={favorites}
          onFav={onFav}
          onCopy={onCopy}
          onClose={onClose}
          daily={daily}
        />
      );
  }
}
