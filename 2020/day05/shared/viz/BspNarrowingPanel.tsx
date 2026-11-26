import type { BoardingTraceFrame } from '../index';

export interface BspNarrowingPanelProps {
  readonly frame: BoardingTraceFrame;
}

function BitCell({ ch, index, resolvedCount, isBsp }: {
  readonly ch: string;
  readonly index: number;
  readonly resolvedCount: number;
  readonly isBsp: boolean;
}) {
  const bitVal = ch === 'B' || ch === 'R' ? '1' : '0';
  const isCurrent = isBsp && index === resolvedCount - 1;
  const isResolved = !isBsp || index < resolvedCount;
  const borderColor = isCurrent ? 'var(--accent)' : isResolved ? 'var(--ok)' : 'var(--border)';
  const textColor = isResolved ? 'var(--text)' : 'var(--muted)';

  return (
    <div
      style={{
        minWidth: 32,
        padding: '0.3rem 0.35rem',
        borderRadius: 6,
        border: `1.5px solid ${borderColor}`,
        background: isCurrent ? 'var(--bg)' : 'var(--surface)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1rem',
      }}
    >
      <code style={{ fontWeight: 700, fontSize: '0.92rem', color: textColor }}>{ch}</code>
      <span style={{ fontSize: '0.68rem', color: isResolved ? 'var(--accent)' : 'var(--muted)' }}>{bitVal}</span>
    </div>
  );
}

function BoundsSummary({ frame }: BspNarrowingPanelProps) {
  const { activePass, bspStep } = frame;
  const rowText = bspStep ? `[${bspStep.rowLow} .. ${bspStep.rowHigh}] (${bspStep.rowCount})` : `[${activePass.row}]`;
  const colText = bspStep ? `[${bspStep.columnLow} .. ${bspStep.columnHigh}] (${bspStep.columnCount})` : `[${activePass.column}]`;
  const candidates = bspStep ? `${bspStep.candidateSeatCount} candidate(s)` : 'Decoded pass';
  const formula = `${activePass.row} × 8 + ${activePass.column} = ${activePass.seatId}`;

  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">Row: <code>{rowText}</code></span>
      <span className="badge">Col: <code>{colText}</code></span>
      <span className="badge">{candidates}</span>
      <span className="badge status-solved">ID: <code>{formula}</code></span>
    </div>
  );
}

/** Displays the 10-bit F/B/L/R ribbon, live BSP intervals, and seat ID arithmetic. */
export function BspNarrowingPanel({ frame }: BspNarrowingPanelProps) {
  const { activePass, bspStep } = frame;
  const isBsp = bspStep !== null;
  const resolvedCount = bspStep ? bspStep.stepIndex : 10;
  const chars = activePass.code.split('');
  const stepNote = bspStep
    ? bspStep.symbol === null
      ? 'Step 0 / 10 · Initial full cabin [0..127] × [0..7]'
      : `Step ${bspStep.stepIndex} / 10 · Symbol '${bspStep.symbol}' -> ${bspStep.half} ${bspStep.axis} half`
    : `Scanning pass ${frame.scannedCount} / ${frame.totalPasses} · ${activePass.code}`;

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <strong style={{ fontSize: '0.88rem' }}>{isBsp ? 'Binary Space Partitioning' : 'Boarding Pass Bit Ribbon'}</strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>{stepNote}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
        {chars.slice(0, 7).map((ch, idx) => (
          <BitCell key={idx} ch={ch} index={idx} resolvedCount={resolvedCount} isBsp={isBsp} />
        ))}
        <span aria-hidden="true" className="muted" style={{ padding: '0 0.25rem', fontWeight: 700 }}>|</span>
        {chars.slice(7).map((ch, idx) => (
          <BitCell key={idx + 7} ch={ch} index={idx + 7} resolvedCount={resolvedCount} isBsp={isBsp} />
        ))}
      </div>
      <BoundsSummary frame={frame} />
    </div>
  );
}
