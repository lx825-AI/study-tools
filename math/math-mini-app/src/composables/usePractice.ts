/**
 * 公式测验状态机：SETUP → QUIZ/FLASHCARD → RESULT（方案 8.2，移植自 math-web usePractice）。
 * 题库来源：全部 / 收藏 / 错题；答错自动写入错题本并同步云端。
 */
import { ref, computed, type Ref } from 'vue'
import type { Formula } from '@/data/types'
import formulaData from '@/data/formulas-university'
import { getItem, setItem } from '@/utils/storage'
import { formulaKey, cloudKey } from '@/utils/keys'
import { syncer } from '@/services/sync'

export interface PoolItem {
  formula: Formula
  sectionId: string
  index: number
}

export interface Question extends PoolItem {
  options: { latex: string; correct: boolean }[]
}

export type PracticePhase = 'setup' | 'quiz' | 'flashcard' | 'result'
export type QuizMode = 'mcq' | 'flashcard'
export type PoolMode = 'all' | 'favorites' | 'mistakes'

export interface MistakeEntry {
  sectionId: string
  formulaIndex: number
  wrongCount: number
  lastWrong: number
}

const SCORE_KEY = 'math:practice-scores'
const MISTAKE_KEY = 'math:mistakes'
const MAX_SCORES = 50
const MAX_MISTAKES = 200

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const allFormulas: PoolItem[] = Object.entries(formulaData).flatMap(([sid, sec]) =>
  sec.formulas.map((f, i) => ({ formula: f, sectionId: sid, index: i }))
)

function buildMcqQuestions(pool: PoolItem[], count: number): Question[] {
  const selected = shuffle(pool).slice(0, Math.min(count, pool.length))
  return selected.map((s) => {
    const distractors = shuffle(pool.filter((p) => p.formula.name !== s.formula.name)).slice(0, 3)
    const options = shuffle([
      { latex: s.formula.latex, correct: true },
      ...distractors.map((d) => ({ latex: d.formula.latex, correct: false })),
    ])
    return { ...s, options }
  })
}

export function loadMistakes(): MistakeEntry[] {
  return getItem<MistakeEntry[]>(MISTAKE_KEY, [])
}

function addMistake(sectionId: string, formulaIndex: number): number {
  const mistakes = loadMistakes()
  const existing = mistakes.find(
    (m) => m.sectionId === sectionId && m.formulaIndex === formulaIndex
  )
  if (existing) {
    existing.wrongCount++
    existing.lastWrong = Date.now()
  } else {
    mistakes.push({ sectionId, formulaIndex, wrongCount: 1, lastWrong: Date.now() })
  }
  if (mistakes.length > MAX_MISTAKES) {
    mistakes.sort((a, b) => a.lastWrong - b.lastWrong)
    mistakes.splice(0, mistakes.length - MAX_MISTAKES)
  }
  setItem(MISTAKE_KEY, mistakes)
  return mistakes.length
}

export function loadScores(): number[] {
  return getItem<number[]>(SCORE_KEY, [])
}

function saveScore(score: number, total: number): void {
  const scores = loadScores()
  scores.push(Math.round((score / total) * 100))
  if (scores.length > MAX_SCORES) scores.shift()
  setItem(SCORE_KEY, scores)
  syncer.write('quiz_records', {
    _id: `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mode: 'mcq',
    totalQuestions: total,
    correctAnswers: score,
  })
}

export function usePractice(favorites: Ref<Set<string>>) {
  const phase = ref<PracticePhase>('setup')
  const poolMode = ref<PoolMode>('all')
  const quizMode = ref<QuizMode>('mcq')
  const count = ref(10)
  const questions = ref<Question[]>([])
  const qIndex = ref(0)
  const score = ref(0)
  const answers = ref<boolean[]>([])
  const selectedOption = ref<number | null>(null)
  const flashcardFlipped = ref(false)
  const flashcardKnown = ref(0)
  const mistakeCount = ref(loadMistakes().length)

  const pool = computed<PoolItem[]>(() => {
    if (poolMode.value === 'favorites') {
      return allFormulas.filter((f) => favorites.value.has(formulaKey(f.sectionId, f.index)))
    }
    if (poolMode.value === 'mistakes') {
      return loadMistakes()
        .map((m) => allFormulas.find((f) => f.sectionId === m.sectionId && f.index === m.formulaIndex))
        .filter((x): x is PoolItem => !!x)
    }
    return allFormulas
  })

  const resetRound = () => {
    qIndex.value = 0
    score.value = 0
    answers.value = []
    selectedOption.value = null
    flashcardFlipped.value = false
    flashcardKnown.value = 0
  }

  const startQuiz = () => {
    resetRound()
    if (quizMode.value === 'flashcard') {
      questions.value = shuffle(pool.value)
        .slice(0, Math.min(count.value, pool.value.length))
        .map((s) => ({ ...s, options: [] }))
      phase.value = 'flashcard'
      return
    }
    questions.value = buildMcqQuestions(pool.value, count.value)
    phase.value = 'quiz'
  }

  /** 每日挑战：固定 5 道选择题，从全部公式抽取 */
  const startDailyChallenge = () => {
    resetRound()
    questions.value = buildMcqQuestions(allFormulas, 5)
    phase.value = 'quiz'
  }

  const advanceOrFinish = (finalScore: number) => {
    if (qIndex.value + 1 >= questions.value.length) {
      phase.value = 'result'
      saveScore(finalScore, questions.value.length)
    } else {
      qIndex.value++
      selectedOption.value = null
      flashcardFlipped.value = false
    }
  }

  const handleMcqAnswer = (optIndex: number) => {
    if (selectedOption.value !== null) return // 防重复点击
    const q = questions.value[qIndex.value]
    const correct = q.options[optIndex].correct
    selectedOption.value = optIndex
    const newScore = score.value + (correct ? 1 : 0)
    score.value = newScore
    answers.value = [...answers.value, correct]
    if (!correct) mistakeCount.value = addMistake(q.sectionId, q.index)
    setTimeout(() => advanceOrFinish(newScore), correct ? 800 : 1800)
  }

  const handleFlashcardKnown = () => {
    flashcardKnown.value++
    advanceOrFinish(flashcardKnown.value)
  }

  const handleFlashcardUnknown = () => {
    const q = questions.value[qIndex.value]
    mistakeCount.value = addMistake(q.sectionId, q.index)
    advanceOrFinish(flashcardKnown.value)
  }

  const goToSetup = () => {
    phase.value = 'setup'
    questions.value = []
  }

  return {
    phase, poolMode, quizMode, count, questions, qIndex, score, answers,
    selectedOption, flashcardFlipped, flashcardKnown, mistakeCount, pool,
    startQuiz, startDailyChallenge, handleMcqAnswer,
    handleFlashcardKnown, handleFlashcardUnknown, goToSetup,
  }
}
