import type { DrawWindow } from '../index';

export interface DrawStreamBarProps {
  readonly drawWindow: DrawWindow;
  readonly totalDraws: number;
  readonly drawnValue: number;
}

function pillStyle(index: number, activeIndex: number): React.CSSProperties {
  if (index === activeIndex) {
    return {
      borderColor: 'var(--accent)',
      background: 'var(--accent)',
      color: 'var(--surface)',
      fontWeight: 700,
    };
  }
  if (index < activeIndex) {
    return {
      borderColor: 'var(--ok)',
      background: 'var(--surface)',
      color: 'var(--ok)',
      fontWeight: 600,
    };
  }
  return {
    borderColor: 'var(--border)',
    background: 'var(--bg)',
    color: 'var(--muted)',
  };
}

/** Sliding-window bar of called Bingo numbers around the active draw step. */
export function DrawStreamBar({ drawWindow, totalDraws, drawnValue }: DrawStreamBarProps) {
  return (
    <section className="card" style={{ marginBottom: 0 }} aria-label="Bingo draw stream">
      <div className="day-header" style={{ marginBottom: '0.5rem' }}>
        <span className="eyebrow">Called Numbers Window</span>
        <span className="nowrap" style={{ fontSize: '0.85rem' }}>
          Draw {drawWindow.activeIndex + 1} / {totalDraws} (<strong>{drawnValue}</strong>)
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        {drawWindow.startIndex > 0 && <span className="muted">...</span>}
        {drawWindow.values.map((value, offset) => {
          const drawIdx = drawWindow.startIndex + offset;
          return (
            <span
              key={drawIdx}
              className="badge nowrap"
              style={pillStyle(drawIdx, drawWindow.activeIndex)}
              title={`Draw #${drawIdx + 1}: ${value}`}
            >
              {value}
            </span>
          );
        })}
        {drawWindow.endIndex < totalDraws - 1 && <span className="muted">...</span>}
      </div>
    </section>
  );
}
