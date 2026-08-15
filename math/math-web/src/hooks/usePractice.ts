import { useState, useCallback, useMemo } from 'react';
import type { Formula } from '../data/types';
import formulaData from '../data/formulas';
import katex from 'katex';

// ---- types ----

export interface Question {
  formula: Formula;
  sectionId: string;
  index: number;
  options: { latex: string; correct: boolean }[];
}

export type PracticePhase = 'setup' | 'quiz' | 'flashcard' | 'result';
export type QuizMode = 'mcq' | 'flashcard';
export type PoolMode = 'all' | 'favorites' | 'mistakes';

interface MistakeEntry {
  sectionId: string;
  formulaIndex: number;
  wrongCount: number;
  lastWrong: number;
}

// ---- pure helpers ----

export function renderLatexStr(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch {
    return latex;
  }
}

export function shuffle<T>(arr: T[]): T[] {
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

/** 从题库中选取 count 道选择题，不依赖 React state，避免闭包陈旧问题 */
function buildMcqQuestions(
  pool: { formula: Formula; sectionId: string; index: number }[],
  count: number,
): Question[] {
  const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
  return selected.map(s => {
    const distractors = getDistractors(s.formula, pool, 3);
    const options = shuffle([
      { latex: s.formula.latex, correct: true },
      ...distractors.map(d => ({ latex: d.latex, correct: false })),
    ]);
    return { formula: s.formula, sectionId: s.sectionId, index: s.index, options };
  });
}

// ---- localStorage helpers ----

const SCORE_KEY = 'math-practice-scores';
const MISTAKE_KEY = 'math-mistakes';

export function loadScores(): number[] {
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

export function loadMistakes(): MistakeEntry[] {
  try {
    const raw = localStorage.getItem(MISTAKE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMistakes(mistakes: MistakeEntry[]) {
  localStorage.setItem(MISTAKE_KEY, JSON.stringify(mistakes));
}

function addMistake(sectionId: string, formulaIndex: number) {
  const mistakes = loadMistakes();
  const existing = mistakes.find(
    m => m.sectionId === sectionId && m.formulaIndex === formulaIndex,
  );
  if (existing) {
    existing.wrongCount++;
    existing.lastWrong = Date.now();
  } else {
    mistakes.push({
      sectionId,
      formulaIndex,
      wrongCount: 1,
      lastWrong: Date.now(),
    });
  }
  if (mistakes.length > 200) {
    mistakes.sort((a, b) => a.lastWrong - b.lastWrong);
    mistakes.splice(0, mistakes.length - 200);
  }
  saveMistakes(mistakes);
}

// ---- hook ----

export interface UsePracticeOptions {
  favorites: Set<string>;
}

export function usePractice({ favorites }: UsePracticeOptions) {
  const [phase, setPhase] = useState<PracticePhase>('setup');
  const [poolMode, setPoolMode] = useState<PoolMode>('all');
  const [mistakeCount, setMistakeCount] = useState(() => loadMistakes().length);
  const [quizMode, setQuizMode] = useState<QuizMode>('mcq');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardKnown, setFlashcardKnown] = useState(0);

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
    if (poolMode === 'mistakes') {
      const mistakes = loadMistakes();
      return mistakes
        .map(m => allFormulas.find(
          f => f.sectionId === m.sectionId && f.index === m.formulaIndex,
        ))
        .filter(Boolean) as typeof allFormulas;
    }
    return allFormulas;
  }, [poolMode, allFormulas, favorites]);

  const startQuiz = useCallback(() => {
    if (quizMode === 'flashcard') {
      const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
      const qs: Question[] = selected.map(s => ({
        formula: s.formula,
        sectionId: s.sectionId,
        index: s.index,
        options: [],
      }));
      setQuestions(qs);
      setQIndex(0);
      setFlashcardFlipped(false);
      setFlashcardKnown(0);
      setAnswers([]);
      setPhase('flashcard');
      return;
    }
    const qs = buildMcqQuestions(pool, count);
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setPhase('quiz');
  }, [pool, count, quizMode]);

  /** 每日挑战：固定 5 道选择题，从全部公式中抽取，不依赖 state 避免闭包陈旧 */
  const startDailyChallenge = useCallback(() => {
    const qs = buildMcqQuestions(allFormulas, 5);
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setPhase('quiz');
  }, [allFormulas]);

  const handleMcqAnswer = useCallback((optIndex: number) => {
    const q = questions[qIndex];
    const correct = q.options[optIndex].correct;
    setSelectedOption(optIndex);
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    setAnswers(prev => [...prev, correct]);

    if (!correct) {
      addMistake(q.sectionId, q.index);
      setMistakeCount(prev => prev + 1);
    }

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

  const handleFlashcardKnown = useCallback(() => {
    setFlashcardKnown(prev => prev + 1);
    if (qIndex + 1 >= questions.length) {
      setPhase('result');
      saveScore(flashcardKnown + 1, questions.length);
    } else {
      setQIndex(prev => prev + 1);
      setFlashcardFlipped(false);
    }
  }, [qIndex, questions, flashcardKnown]);

  const handleFlashcardUnknown = useCallback(() => {
    const q = questions[qIndex];
    addMistake(q.sectionId, q.index);
    setMistakeCount(prev => prev + 1);
    if (qIndex + 1 >= questions.length) {
      setPhase('result');
      saveScore(flashcardKnown, questions.length);
    } else {
      setQIndex(prev => prev + 1);
      setFlashcardFlipped(false);
    }
  }, [qIndex, questions, flashcardKnown]);

  const goToSetup = useCallback(() => {
    setPhase('setup');
    setQuestions([]);
  }, []);

  return {
    // state
    phase,
    poolMode,
    setPoolMode,
    mistakeCount,
    quizMode,
    setQuizMode,
    count,
    setCount,
    questions,
    qIndex,
    score,
    answers,
    selectedOption,
    flashcardFlipped,
    setFlashcardFlipped,
    flashcardKnown,
    // computed
    allFormulas,
    pool,
    // actions
    startQuiz,
    startDailyChallenge,
    handleMcqAnswer,
    handleFlashcardKnown,
    handleFlashcardUnknown,
    goToSetup,
  };
}
