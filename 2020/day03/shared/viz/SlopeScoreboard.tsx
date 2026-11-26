import type { SlopeProgress, TrajectoryTraceFrame } from '../index';

export interface SlopeScoreboardProps {
  readonly frame: TrajectoryTraceFrame;
  readonly focusedIndex: number;
  readonly onFocusSlope: (index: number) => void;
}

function landingBadge(progress: SlopeProgress): { readonly label: string; readonly className: string } {
  const landing = progress.activeLanding;
  if (!landing) {
    return { label: 'Passing', className: 'badge' };
  }
  if (landing.isTree) {
    return { label: `Tree @ mod ${landing.wrappedCol}`, className: 'badge status-blocked' };
  }
  return { label: `Open @ mod ${landing.wrappedCol}`, className: 'badge status-solved' };
}

/** High-contrast per-slope progress scoreboard with focus selection for multi-slope runs. */
export function SlopeScoreboard({ frame, focusedIndex, onFocusSlope }: SlopeScoreboardProps) {
  const multiSlope = frame.slopes.length > 1;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.6rem' }}>
      {frame.slopes.map((progress, index) => {
        const active = index === focusedIndex;
        const status = landingBadge(progress);
        return (
          <button
            key={progress.slope.label}
            type="button"
            aria-pressed={multiSlope ? active : undefined}
            onClick={() => onFocusSlope(index)}
            style={{
              textAlign: 'left',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.88rem' }}>{progress.slope.label}</strong>
              <span className={status.className}>{status.label}</span>
            </div>
            <div className="muted" style={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
              Steps: {progress.stepsCompleted} | Trees: <strong style={{ color: 'var(--err)' }}>{progress.treeCount}</strong> | Open: {progress.openCount}
            </div>
          </button>
        );
      })}
    </div>
  );
}
