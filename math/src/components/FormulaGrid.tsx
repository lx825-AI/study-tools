import type { Section } from '../data/types';
import FormulaCard from './FormulaCard';
import '../styles/formula-card.css';

interface FormulaGridProps {
  section: Section;
  expandedCards: Set<number>;
  onToggleCard: (index: number) => void;
  favorites: Set<string>;
  onToggleFavorite: (sectionId: string, index: number) => void;
  onCopy: (sectionId: string, index: number) => void;
  highlightQuery?: string;
  isGridView?: boolean;
}

function favKey(sectionId: string, index: number): string {
  return `${sectionId}:${index}`;
}

export default function FormulaGrid({
  section,
  expandedCards,
  onToggleCard,
  favorites,
  onToggleFavorite,
  onCopy,
  highlightQuery,
  isGridView,
}: FormulaGridProps) {
  if (!section) return null;

  return (
    <div>
      <h2 className="section-title">{section.title}</h2>
      <div className={`formula-grid${isGridView ? ' grid-view' : ''}`}>
        {section.formulas.map((f, i) => (
          <FormulaCard
            key={i}
            formula={f}
            sectionId={section.id}
            index={i}
            isExpanded={expandedCards.has(i)}
            onToggle={() => onToggleCard(i)}
            isFavorited={favorites.has(favKey(section.id, i))}
            onToggleFavorite={() => onToggleFavorite(section.id, i)}
            onCopy={() => onCopy(section.id, i)}
            highlightQuery={highlightQuery}
            isGridView={isGridView}
          />
        ))}
      </div>
    </div>
  );
}
