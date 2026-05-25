import { useState, useEffect, useCallback } from 'react';

const HASH_MAP: Record<string, string> = {
  favorites: '__favorites__',
  recent: '__recent__',
};

const REVERSE_MAP: Record<string, string> = {
  __favorites__: 'favorites',
  __recent__: 'recent',
};

function hashToSection(hash: string): string {
  const h = hash.replace(/^#/, '');
  return HASH_MAP[h] || h || 'calc-limit';
}

function sectionToHash(section: string): string {
  return REVERSE_MAP[section] || section;
}

export default function useHashRoute(validSections: Set<string>) {
  const [current, setCurrent] = useState(() =>
    hashToSection(window.location.hash),
  );

  useEffect(() => {
    const handler = () => {
      const next = hashToSection(window.location.hash);
      if (validSections.has(next) || next.startsWith('__')) {
        setCurrent(next);
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [validSections]);

  const navigate = useCallback(
    (sectionId: string) => {
      const hash = sectionToHash(sectionId);
      if (location.hash.slice(1) !== hash) {
        history.pushState(null, '', '#' + hash);
      }
      setCurrent(sectionId);
    },
    [],
  );

  return { currentSection: current, navigate };
}
