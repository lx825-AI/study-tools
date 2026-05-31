import { useState, useCallback } from 'react';

const NOTES_KEY = 'math-notes';

interface NotesMap {
  [key: string]: string; // key: "sectionId:formulaIndex"
}

function loadNotes(): NotesMap {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: NotesMap) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function useFormulaNotes() {
  const [notes, setNotes] = useState<NotesMap>(loadNotes);

  const getNote = useCallback(
    (sectionId: string, formulaIndex: number): string => {
      const key = `${sectionId}:${formulaIndex}`;
      return notes[key] || '';
    },
    [notes],
  );

  const setNote = useCallback(
    (sectionId: string, formulaIndex: number, text: string) => {
      const key = `${sectionId}:${formulaIndex}`;
      setNotes(prev => {
        const next = { ...prev };
        if (text.trim()) {
          next[key] = text;
        } else {
          delete next[key];
        }
        saveNotes(next);
        return next;
      });
    },
    [],
  );

  const hasNote = useCallback(
    (sectionId: string, formulaIndex: number): boolean => {
      const key = `${sectionId}:${formulaIndex}`;
      return !!notes[key]?.trim();
    },
    [notes],
  );

  return { getNote, setNote, hasNote };
}
