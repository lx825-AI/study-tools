import { useState, useCallback, useMemo } from 'react';

const CHALLENGE_KEY = 'math-daily-challenge';

interface DailyState {
  date: string; // YYYY-MM-DD
  completed: boolean;
  score: number;
  total: number;
  streak: number;
  lastCompletedDate: string; // YYYY-MM-DD of last completion
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadState(): DailyState {
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY);
    return raw ? JSON.parse(raw) : { date: '', completed: false, score: 0, total: 0, streak: 0, lastCompletedDate: '' };
  } catch {
    return { date: '', completed: false, score: 0, total: 0, streak: 0, lastCompletedDate: '' };
  }
}

function saveState(state: DailyState) {
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(state));
}

export function useDailyChallenge() {
  const today = getToday();
  const [state, setState] = useState<DailyState>(() => {
    const saved = loadState();
    // 如果日期变了，重置完成状态但保留 streak
    if (saved.date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      // 如果上次完成是昨天，保持 streak；否则重置
      const streak = saved.lastCompletedDate === yesterdayStr ? saved.streak : 0;

      const fresh: DailyState = { date: today, completed: false, score: 0, total: 5, streak, lastCompletedDate: saved.lastCompletedDate };
      saveState(fresh);
      return fresh;
    }
    return saved;
  });

  const isCompleted = state.completed;
  const streak = state.streak;

  const completeChallenge = useCallback((score: number, total: number) => {
    const newState: DailyState = {
      date: today,
      completed: true,
      score,
      total,
      streak: state.streak + 1,
      lastCompletedDate: today,
    };
    setState(newState);
    saveState(newState);
  }, [today, state.streak]);

  const emoji = useMemo(() => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '💪';
    if (streak >= 3) return '📚';
    return '';
  }, [streak]);

  return { isCompleted, streak, today, emoji, completeChallenge };
}
