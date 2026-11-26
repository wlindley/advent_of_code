import { BOARD_SIZE, type BoardSnapshot, type WinningLine } from '../index';

export interface BingoBoardCardProps {
  readonly snapshot: BoardSnapshot;
  readonly activeDrawValue: number;
}

function isWinningCell(lines: readonly WinningLine[], row: number, col: number): boolean {
  return lines.some(
    (line) => (line.kind === 'row' && line.index === row) || (line.kind === 'col' && line.index === col),
  );
}

function cellStyle(isMarked: boolean, isWinCell: boolean, isLatest: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    padding: '0.35rem 0.2rem',
    borderRadius: '6px',
    fontSize: '0.82rem',
    fontVariantNumeric: 'tabular-nums',
    outline: isLatest ? '2px solid var(--accent)' : 'none',
    outlineOffset: '1px',
  };
  if (isWinCell) {
    return { ...base, background: 'var(--gold)', color: 'var(--surface)', border: '2px solid var(--gold)', fontWeight: 700 };
  }
  if (isMarked) {
    return { ...base, background: 'var(--ok)', color: 'var(--surface)', border: '1px solid var(--ok)', fontWeight: 600 };
  }
  return { ...base, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' };
}

function headerBadge(snapshot: BoardSnapshot): { label: string; style: React.CSSProperties } {
  if (snapshot.winState === 'target-won') {
    return { label: 'Target Winner', style: { borderColor: 'var(--gold)', color: 'var(--gold)' } };
  }
  if (snapshot.winState === 'won') {
    return { label: 'Won', style: { borderColor: 'var(--ok)', color: 'var(--ok)' } };
  }
  return { label: 'Playing', style: { borderColor: 'var(--border)', color: 'var(--muted)' } };
}

/** 5x5 Bingo board card highlighting marked cells, latest draw, and completed winning lines. */
export function BingoBoardCard({ snapshot, activeDrawValue }: BingoBoardCardProps) {
  const badge = headerBadge(snapshot);
  const cardBorder = snapshot.winState === 'target-won' ? 'var(--gold)' : snapshot.winState === 'won' ? 'var(--ok)' : 'var(--border)';

  return (
    <article className="day-card" style={{ borderColor: cardBorder }}>
      <div className="day-header">
        <span>Board #{snapshot.boardId + 1}</span>
        <span className="badge" style={badge.style}>{badge.label}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`, gap: '0.3rem' }}>
        {snapshot.cells.map((value, idx) => {
          const r = Math.floor(idx / BOARD_SIZE);
          const c = idx % BOARD_SIZE;
          const marked = snapshot.isMarked(r, c);
          const winCell = isWinningCell(snapshot.winningLines, r, c);
          return (
            <div key={idx} style={cellStyle(marked, winCell, marked && value === activeDrawValue)}>
              {value}
            </div>
          );
        })}
      </div>
      <div className="day-header muted" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
        <span className="nowrap">Marked {snapshot.markedCount}/25</span>
        <span className="nowrap">Unmarked sum: {String(snapshot.unmarkedSum)}</span>
      </div>
    </article>
  );
}
