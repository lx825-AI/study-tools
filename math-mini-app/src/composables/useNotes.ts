/**
 * 公式个人笔记：Markdown 文本，本地即时保存 + 云端同步（最后写入胜出）。
 */
import { ref } from 'vue'
import { getItem, setItem } from '@/utils/storage'
import { formulaKey, cloudKey } from '@/utils/keys'
import { syncer } from '@/services/sync'

const KEY = 'math:notes'

type NotesMap = Record<string, string> // key: formulaKey → 笔记内容

const notes = ref<NotesMap>(getItem<NotesMap>(KEY, {}))

function persist(): void {
  setItem(KEY, notes.value)
}

export function useNotes() {
  const getNote = (sectionId: string, index: number): string =>
    notes.value[formulaKey(sectionId, index)] ?? ''

  const hasNote = (sectionId: string, index: number): boolean =>
    !!notes.value[formulaKey(sectionId, index)]?.trim()

  const setNote = (sectionId: string, index: number, text: string) => {
    const key = formulaKey(sectionId, index)
    const next = { ...notes.value }
    if (text.trim()) next[key] = text
    else delete next[key]
    notes.value = next
    persist()
    syncer.write('notes', {
      _id: cloudKey(sectionId, index),
      sectionId,
      formulaIndex: index,
      content: text,
      deleted: !text.trim(),
    })
  }

  return { notes, getNote, hasNote, setNote }
}

// 远端增量合并：直接覆盖本地（云端 updatedAt 保证后写胜出）
syncer.subscribe((collection, docs) => {
  if (collection !== 'notes') return
  const next = { ...notes.value }
  for (const d of docs) {
    const key = formulaKey(d.sectionId as string, d.formulaIndex as number)
    if (d.deleted) delete next[key]
    else next[key] = d.content as string
  }
  notes.value = next
  persist()
})
