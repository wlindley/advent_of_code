import {
  computeBudgetFillRatio,
  computeLogScalePosition,
  formatCompactBigInt,
  type SearchTraceFrame,
} from '../index';

interface FuelSearchGaugeSvgProps {
  readonly frame: SearchTraceFrame;
}

const SVG_WIDTH = 640;
const BAR_X = 24;
const BAR_WIDTH = 592;

/** Log-scale FUEL bracket & ORE budget meter SVG for search-phase trace frames. */
export function FuelSearchGaugeSvg({ frame }: FuelSearchGaugeSvgProps) {
  const step = frame.searchStep;
  const scaleMax = frame.maxFuel > 0n ? frame.maxFuel * 2n : 2n;
  const lowX = BAR_X + computeLogScalePosition(step.low, scaleMax) * BAR_WIDTH;
  const highX = BAR_X + computeLogScalePosition(step.high, scaleMax) * BAR_WIDTH;
  const candX = BAR_X + computeLogScalePosition(step.candidateFuel, scaleMax) * BAR_WIDTH;
  const fillRatio = computeBudgetFillRatio(step.oreRequired, frame.oreBudget);
  const statusColor = step.fits ? 'var(--ok)' : 'var(--err)';

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>
          Phase: {step.phase} · Candidate {formatCompactBigInt(step.candidateFuel)} FUEL
        </span>
        <span className="muted">
          Range [{formatCompactBigInt(step.low)}, {formatCompactBigInt(step.high)}] · Best {frame.bestFuel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} 150`}
        role="img"
        aria-label="FUEL search range and ORE budget gauge"
        style={{ width: '100%', display: 'block', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}
      >
        <text x={BAR_X} y={24} fill="var(--text)" fontSize={11} fontWeight={600}>
          FUEL Search Bracket (log2 scale)
        </text>
        <rect x={BAR_X} y={34} width={BAR_WIDTH} height={16} rx={4} fill="var(--surface)" stroke="var(--border)" />
        <rect x={lowX} y={34} width={Math.max(4, highX - lowX)} height={16} rx={3} fill="var(--accent)" fillOpacity={0.22} stroke="var(--accent)" />
        <circle cx={candX} cy={42} r={5} fill={statusColor} stroke="var(--surface)" strokeWidth={1.5} />
        <text x={BAR_X} y={68} fill="var(--muted)" fontSize={10} fontFamily="ui-monospace, monospace">
          Low: {formatCompactBigInt(step.low)} · Candidate: {formatCompactBigInt(step.candidateFuel)} · High: {formatCompactBigInt(step.high)}
        </text>
        <text x={BAR_X} y={96} fill="var(--text)" fontSize={11} fontWeight={600}>
          ORE Budget Usage ({step.fits ? 'Fits' : 'Exceeds Budget'})
        </text>
        <rect x={BAR_X} y={106} width={BAR_WIDTH} height={16} rx={4} fill="var(--surface)" stroke="var(--border)" />
        <rect x={BAR_X} y={106} width={fillRatio * BAR_WIDTH} height={16} rx={4} fill={statusColor} />
        <text x={BAR_X} y={138} fill="var(--muted)" fontSize={10} fontFamily="ui-monospace, monospace">
          Required: {formatCompactBigInt(step.oreRequired)} / Budget: {formatCompactBigInt(frame.oreBudget)} ORE
        </text>
      </svg>
    </div>
  );
}
