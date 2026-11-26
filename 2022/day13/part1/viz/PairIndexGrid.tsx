import type { PacketOrder } from '../../shared';
import type { PairTraceFrame } from '../domain';

export interface PairIndexGridProps {
  readonly frames: readonly PairTraceFrame[];
  readonly activeStep: number;
  readonly onSelectStep: (stepIndex: number) => void;
}

function outcomeStyle(order: PacketOrder, reached: boolean): { readonly symbol: string; readonly color: string } {
  if (!reached) return { symbol: '·', color: 'var(--muted)' };
  if (order < 0) return { symbol: '✓', color: 'var(--ok)' };
  if (order > 0) return { symbol: '✗', color: 'var(--err)' };
  return { symbol: '=', color: 'var(--gold)' };
}

/** Clickable 1-based pair outcome grid for Part 1 trace navigation. */
export function PairIndexGrid({ frames, activeStep, onSelectStep }: PairIndexGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
        gap: '0.4rem',
        marginBottom: '0.85rem',
      }}
      role="group"
      aria-label="Packet pair indices"
    >
      {frames.map((frame, idx) => {
        const isCurrent = idx === activeStep;
        const reached = idx <= activeStep;
        const style = outcomeStyle(frame.order, reached);
        return (
          <button
            key={frame.pairIndex}
            type="button"
            onClick={() => onSelectStep(idx)}
            aria-pressed={isCurrent}
            aria-label={`Pair ${frame.pairIndex}`}
            style={{
              padding: '0.35rem 0.4rem',
              borderRadius: 6,
              border: isCurrent ? '2px solid var(--accent)' : `1px solid ${reached ? style.color : 'var(--border)'}`,
              background: isCurrent ? 'var(--bg)' : 'var(--surface)',
              color: style.color,
              fontWeight: isCurrent ? 700 : 600,
              fontSize: '0.8rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ color: 'var(--text)' }}>#{frame.pairIndex}</span>
            <span>{style.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}
