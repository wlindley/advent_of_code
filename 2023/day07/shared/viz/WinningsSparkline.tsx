import { ratioBigInt, type CamelCardsTraceFrame } from '../trace';

export interface WinningsSparklineProps {
  readonly frames: readonly CamelCardsTraceFrame[];
  readonly activeIndex: number;
  readonly onSelectFrame: (index: number) => void;
}

const SVG_W = 360;
const SVG_H = 120;
const PAD_X = 14;
const PAD_Y = 14;

function buildSparkPoints(frames: readonly CamelCardsTraceFrame[], maxWinnings: bigint): readonly string[] {
  const denom = Math.max(1, frames.length - 1);
  const plotW = SVG_W - PAD_X * 2;
  const plotH = SVG_H - PAD_Y * 2;
  return frames.map((frame, i) => {
    const x = PAD_X + (i / denom) * plotW;
    const y = PAD_Y + (1 - ratioBigInt(frame.runningWinnings, maxWinnings)) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
}

function renderSparkSvg(frames: readonly CamelCardsTraceFrame[], activeIndex: number) {
  const maxWinnings = frames[frames.length - 1]!.runningWinnings;
  const points = buildSparkPoints(frames, maxWinnings);
  const activePoint = points[activeIndex]!.split(',');
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', display: 'block', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }} role="img" aria-label="Cumulative winnings sparkline">
      <polyline fill="none" stroke="var(--border)" strokeWidth={1.8} points={points.join(' ')} />
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2.4} points={points.slice(0, activeIndex + 1).join(' ')} />
      <circle cx={activePoint[0]} cy={activePoint[1]} r={4.5} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  );
}

function renderLedgerRow(frame: CamelCardsTraceFrame, idx: number, isActive: boolean, onSelectFrame: (index: number) => void) {
  return (
    <button
      key={frame.rank}
      type="button"
      onClick={() => onSelectFrame(idx)}
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 60px 1fr auto',
        gap: '0.45rem',
        alignItems: 'center',
        textAlign: 'left',
        fontSize: '0.78rem',
        padding: '0.28rem 0.45rem',
        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
        background: isActive ? 'var(--bg)' : 'var(--surface)',
        fontWeight: isActive ? 700 : 500,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}>#{frame.rank}</span>
      <code style={{ color: 'var(--text)' }}>{frame.ranked.hand.label}</code>
      <span className="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {frame.ranked.handTypeLabel}
      </span>
      <span style={{ color: 'var(--text)' }}>+{frame.winnings.toString()}</span>
    </button>
  );
}

export function WinningsSparkline({ frames, activeIndex, onSelectFrame }: WinningsSparklineProps) {
  const start = Math.max(0, Math.min(activeIndex - 3, frames.length - 7));
  const windowFrames = frames.slice(start, start + 7);
  return (
    <section
      aria-label="Cumulative winnings and rank ledger"
      style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.45rem' }}>
        <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Cumulative Winnings</strong>
        <span className="gold" style={{ fontSize: '0.82rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {frames[frames.length - 1]!.runningWinnings.toString()}
        </span>
      </div>
      {renderSparkSvg(frames, activeIndex)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
        {windowFrames.map((frame, offset) => renderLedgerRow(frame, start + offset, start + offset === activeIndex, onSelectFrame))}
      </div>
    </section>
  );
}
