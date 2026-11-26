import type { BoardStatus, BoardWinState } from '../index';

export interface BoardStatusStripProps {
  readonly statuses: readonly BoardStatus[];
  readonly visibleBoardIds: readonly number[];
}

function statusPillStyle(state: BoardWinState, isVisible: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: '0.72rem',
    padding: '0.1rem 0.45rem',
    borderStyle: isVisible ? 'solid' : 'dashed',
  };
  if (state === 'target-won') {
    return { ...base, borderColor: 'var(--gold)', background: 'var(--gold)', color: 'var(--surface)' };
  }
  if (state === 'won') {
    return { ...base, borderColor: 'var(--ok)', color: 'var(--ok)', background: 'var(--surface)' };
  }
  return { ...base, borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--bg)' };
}

/** Compact strip summarizing win status across every board in the game. */
export function BoardStatusStrip({ statuses, visibleBoardIds }: BoardStatusStripProps) {
  const visibleSet = new Set(visibleBoardIds);
  const wonTotal = statuses.filter((s) => s.winState !== 'pending').length;

  return (
    <section className="card" style={{ marginBottom: 0 }} aria-label="Board win status overview">
      <div className="day-header" style={{ marginBottom: '0.45rem' }}>
        <span className="eyebrow">All Boards ({wonTotal} / {statuses.length} Won)</span>
        {statuses.length > visibleBoardIds.length && (
          <span className="muted" style={{ fontSize: '0.78rem' }}>
            Showing {visibleBoardIds.length} of {statuses.length} boards (target pinned)
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {statuses.map((status) => (
          <span
            key={status.boardId}
            className="badge nowrap"
            style={statusPillStyle(status.winState, visibleSet.has(status.boardId))}
            title={
              status.winDrawIndex === null
                ? `Board #${status.boardId + 1}: playing`
                : `Board #${status.boardId + 1}: won at draw #${status.winDrawIndex + 1}`
            }
          >
            #{status.boardId + 1}
          </span>
        ))}
      </div>
    </section>
  );
}
