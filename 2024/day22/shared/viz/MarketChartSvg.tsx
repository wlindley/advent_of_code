import type { MarketSnapshot } from '../index';

const W = 680;
const H = 228;
const PAD_L = 42;
const PAD_R = 20;
const PAD_T = 22;
const PAD_B = 46;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

function xPos(idx: number, count: number): number {
  return count <= 1 ? PAD_L + PLOT_W / 2 : PAD_L + (idx / (count - 1)) * PLOT_W;
}

function yPos(price: number): number {
  return PAD_T + ((9 - price) / 9) * PLOT_H;
}

function formatDelta(d: number): string {
  return d > 0 ? `+${d}` : String(d);
}

function TriggerBand({
  matchedIdx,
  count,
  price,
  matchedStep,
}: {
  readonly matchedIdx: number;
  readonly count: number;
  readonly price: number;
  readonly matchedStep: number;
}) {
  const x0 = xPos(matchedIdx - 4, count);
  const x1 = xPos(matchedIdx, count);
  const cy = yPos(price);
  return (
    <g>
      <rect
        x={x0}
        y={PAD_T}
        width={Math.max(4, x1 - x0)}
        height={PLOT_H}
        fill="rgba(154, 103, 0, 0.14)"
        stroke="var(--gold)"
        strokeDasharray="4 3"
      />
      <circle cx={x1} cy={cy} r={9} fill="none" stroke="var(--gold)" strokeWidth={2.5} />
      <circle cx={x1} cy={cy} r={4.5} fill="var(--gold)" />
      <text x={x1} y={Math.max(13, cy - 12)} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--gold)">
        t={matchedStep} ({price})
      </text>
    </g>
  );
}

function PricePolyline({ snapshot }: { readonly snapshot: MarketSnapshot }) {
  const win = snapshot.activeWindow;
  const prices = win.prices;
  const deltas = win.deltas;
  const n = prices.length;
  const mIdx = win.matchedStep === null ? null : win.matchedStep - win.startStep;
  const pts = prices.map((p, i) => `${xPos(i, n).toFixed(1)},${yPos(p).toFixed(1)}`).join(' ');
  const deltaStep = n > 24 ? 2 : 1;

  return (
    <g>
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts} />
      {prices.map((p, i) => {
        const cx = xPos(i, n);
        const cy = yPos(p);
        const d = deltas[i] ?? null;
        const inMatch = mIdx !== null && i > mIdx - 4 && i <= mIdx;
        const showDelta = d !== null && (inMatch || i % deltaStep === 0);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={i === mIdx ? 4.5 : n > 28 ? 2.5 : 3.2} fill={i === mIdx ? 'var(--gold)' : 'var(--accent)'} />
            {showDelta && (
              <text
                x={cx}
                y={H - PAD_B + 15}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={inMatch ? 700 : 500}
                fill={inMatch ? 'var(--gold)' : 'var(--muted)'}
              >
                {formatDelta(d)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Price-stream SVG chart with 4-delta trigger band, sell halo, and buyer progress strip. */
export function MarketChartSvg({ snapshot }: { readonly snapshot: MarketSnapshot }) {
  const win = snapshot.activeWindow;
  const n = win.prices.length;
  const mIdx = win.matchedStep === null ? null : win.matchedStep - win.startStep;
  const pct = snapshot.totalBuyers > 0 ? (snapshot.revealedBuyerCount / snapshot.totalBuyers) * 100 : 0;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.75rem' }}>
      <div className="meta-row" style={{ marginTop: 0, justifyContent: 'space-between', fontSize: '0.82rem' }}>
        <span>
          <strong>Buyer #{snapshot.activeBuyer.buyerIndex + 1}</strong>{' '}
          <span className="muted">(seed <code>{snapshot.activeBuyer.initialSecret}</code>)</span>
        </span>
        <span className="muted">Window steps <code>{win.startStep}..{win.endStep}</code></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Buyer banana price chart" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 3, 6, 9].map((tick) => (
          <g key={tick}>
            <line x1={PAD_L} y1={yPos(tick)} x2={W - PAD_R} y2={yPos(tick)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD_L - 8} y={yPos(tick) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{tick}</text>
          </g>
        ))}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="var(--border)" strokeWidth={1.2} />
        {mIdx !== null && win.matchedStep !== null && (
          <TriggerBand matchedIdx={mIdx} count={n} price={win.prices[mIdx]!} matchedStep={win.matchedStep} />
        )}
        <PricePolyline snapshot={snapshot} />
        <text x={PAD_L} y={H - 8} textAnchor="start" fontSize={11} fill="var(--muted)">t={win.startStep}</text>
        <text x={W - PAD_R} y={H - 8} textAnchor="end" fontSize={11} fill="var(--muted)">t={win.endStep}</text>
      </svg>
      <div style={{ marginTop: '0.45rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
          <span>Buyer scan progress</span>
          <span><code>{snapshot.revealedBuyerCount} / {snapshot.totalBuyers}</code></span>
        </div>
        <div style={{ height: 7, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ width: `${pct.toFixed(1)}%`, height: '100%', background: snapshot.isComplete ? 'var(--ok)' : 'var(--accent)' }} />
        </div>
      </div>
    </div>
  );
}
