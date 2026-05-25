import { useState, useCallback, useMemo } from 'react';
import type { Formula } from '../data/types';
import formulaData from '../data/formulas';
import katex from 'katex';

function renderLatexStr(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch {
    return latex;
  }
}

interface Question {
  formula: Formula;
  sectionId: string;
  index: number;
  options: { latex: string; correct: boolean }[];
}

interface PracticeProps {
  favorites: Set<string>;
  onFav: (sectionId: string, index: number) => void;
  onCopy: (sectionId: string, index: number) => void;
  onClose: () => void;
}

type Phase = 'setup' | 'quiz' | 'result';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDistractors(
  correct: Formula,
  pool: { formula: Formula; sectionId: string; index: number }[],
  count: number,
): Formula[] {
  const others = pool
    .filter(p => p.formula.name !== correct.name)
    .map(p => p.formula);
  return shuffle(others).slice(0, count);
}

const SCORE_KEY = 'math-practice-scores';

function loadScores(): number[] {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveScore(score: number, total: number) {
  const scores = loadScores();
  scores.push(Math.round((score / total) * 100));
  if (scores.length > 50) scores.shift();
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
}

export default function PracticePanel({ favorites, onFav, onCopy, onClose }: PracticeProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [poolMode, setPoolMode] = useState<'all' | 'favorites'>('all');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const allFormulas = useMemo(() => {
    const result: { formula: Formula; sectionId: string; index: number }[] = [];
    Object.entries(formulaData).forEach(([sid, sec]) => {
      sec.formulas.forEach((f, i) => {
        result.push({ formula: f, sectionId: sid, index: i });
      });
    });
    return result;
  }, []);

  const pool = useMemo(() => {
    if (poolMode === 'favorites') {
      return allFormulas.filter(f => favorites.has(`${f.sectionId}:${f.index}`));
    }
    return allFormulas;
  }, [poolMode, allFormulas, favorites]);

  const startQuiz = useCallback(() => {
    const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
    const qs: Question[] = selected.map(s => {
      const distractors = getDistractors(s.formula, pool, 3);
      const options = shuffle([
        { latex: s.formula.latex, correct: true },
        ...distractors.map(d => ({ latex: d.latex, correct: false })),
      ]);
      return { formula: s.formula, sectionId: s.sectionId, index: s.index, options };
    });
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setPhase('quiz');
  }, [pool, count]);

  const handleAnswer = useCallback((optIndex: number) => {
    const q = questions[qIndex];
    const correct = q.options[optIndex].correct;
    setSelectedOption(optIndex);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    setAnswers(prev => [...prev, correct]);

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        setPhase('result');
        saveScore(newScore, questions.length);
      } else {
        setQIndex(prev => prev + 1);
        setSelectedOption(null);
      }
    }, correct ? 800 : 1800);
  }, [qIndex, questions, score]);

  const scores = useMemo(() => loadScores(), [phase]);

  if (phase === 'setup') {
    return (
      <div className="practice-panel">
        <div className="practice-header">
          <h2>公式测验</h2>
        </div>
        <div className="practice-setup">
          <div className="practice-field">
            <label>题目来源</label>
            <div className="practice-options">
              <button
                className={`btn btn-sm ${poolMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPoolMode('all')}
              >
                全部公式 ({allFormulas.length} 条)
              </button>
              <button
                className={`btn btn-sm ${poolMode === 'favorites' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPoolMode('favorites')}
                disabled={favorites.size === 0}
              >
                收藏夹 ({favorites.size} 条)
              </button>
            </div>
          </div>
          <div className="practice-field">
            <label>题目数量</label>
            <div className="practice-options">
              {[5, 10, 20].map(n => (
                <button
                  key={n}
                  className={`btn btn-sm ${count === n ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCount(n)}
                  disabled={n > pool.length}
                >
                  {n} 题
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={startQuiz}
            disabled={pool.length < 4}
            style={{ marginTop: 16, width: '100%' }}
          >
            {pool.length < 4
              ? '需要至少 4 条公式才能开始测验'
              : `开始测验 (${Math.min(count, pool.length)} 题)`}
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
                    style={{ height: `${s}%`, backgroundColor: s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--warning)' : 'var(--danger)' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              最近 {Math.min(10, scores.length)} 次 · 平均 {Math.round(scores.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, scores.length))}%
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = questions[qIndex];
    const answered = selectedOption !== null;
    return (
      <div className="practice-panel">
        <div className="practice-progress">
          <div className="practice-progress-bar">
            <div
              className="practice-progress-fill"
              style={{ width: `${((qIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
          <span>{qIndex + 1} / {questions.length}</span>
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
              else if (i === selectedOption) cls += ' wrong';
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={answered}
                onClick={() => handleAnswer(i)}
                dangerouslySetInnerHTML={{ __html: renderLatexStr(opt.latex) }}
              />
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ color: 'var(--success)' }}>{answers.filter(Boolean).length}</span>
          {' / '}
          <span style={{ color: 'var(--danger)' }}>{answers.filter(a => !a).length}</span>
          {'  '}✔ | ✘
        </div>
      </div>
    );
  }

  // result phase
  return (
    <div className="practice-panel">
      <h2 style={{ textAlign: 'center' }}>测验完成</h2>
      <div className="practice-result">
        <div className="practice-result-score">{score} / {questions.length}</div>
        <div className="practice-result-pct">
          {Math.round((score / questions.length) * 100)}%
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
          {score === questions.length
            ? '满分！太厉害了！'
            : score / questions.length >= 0.8
            ? '表现优秀！'
            : score / questions.length >= 0.6
            ? '还不错，继续加油！'
            : '多加练习，你可以的！'}
        </div>

        <div className="practice-result-answers">
          {questions.map((q, i) => (
            <div key={i} className={`practice-result-item ${answers[i] ? 'correct' : 'wrong'}`}>
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
          <button className="btn btn-primary" onClick={startQuiz}>再来一轮</button>
          <button className="btn btn-outline" onClick={() => setPhase('setup')}>返回设置</button>
          <button className="btn btn-outline" onClick={onClose}>退出测验</button>
        </div>
      </div>
    </div>
  );
}
