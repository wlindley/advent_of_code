import type { ExpenseEntry, KSumTraceFrame } from '../index';

export interface ExpenseBarChartProps {
  readonly sorted: readonly ExpenseEntry[];
  readonly frame: KSumTraceFrame;
}

const SVG_W = 720;
const SVG_H = 190;
const PAD_X = 18;
const PLOT_H = 146;
const BASE_Y = 172;
const LEGEND_ITEMS: readonly [string, string][] = [
  ['var(--gold)', 'Anchor'],
  ['var(--accent)', 'Left (L)'],
  ['var(--warn)', 'Right (R)'],
  ['var(--ok)', 'Match'],
];

function getBarColor(index: number, frame: KSumTraceFrame): { color: string; active: boolean } {
  if (frame.verdict === 'match' && frame.selectedPositions.includes(index)) return { color: 'var(--ok)', active: true };
  if (frame.anchorPositions.includes(index)) return { color: 'var(--gold)', active: true };
  if (index === frame.leftPos) return { color: 'var(--accent)', active: true };
  if (index === frame.rightPos) return { color: 'var(--warn)', active: true };
  return { color: 'var(--border)', active: false };
}

function getPointerTag(index: number, frame: KSumTraceFrame): string | null {
  const anchorIdx = frame.anchorPositions.indexOf(index);
  if (anchorIdx >= 0) return `A${anchorIdx + 1}`;
  if (index === frame.leftPos) return 'L';
  if (index === frame.rightPos) return 'R';
  return null;
}

function ChartLegend() {
  return (
    <div className="chart-legend">
      {LEGEND_ITEMS.map(([color, label]) => (
        <span key={label} className="chart-legend-item">
          <span className="legend-swatch" style={{ borderTopColor: color, borderTopWidth: 4 }} />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

interface ExpenseBarProps {
  readonly entry: ExpenseEntry;
  readonly idx: number;
  readonly slotW: number;
  readonly maxVal: number;
  readonly frame: KSumTraceFrame;
}

function ExpenseBar({ entry, idx, slotW, maxVal, frame }: ExpenseBarProps) {
  const { color, active } = getBarColor(idx, frame);
  const barW = Math.max(1.5, slotW * 0.78);
  const h = Math.max(3, (entry.value / maxVal) * PLOT_H);
  const x = PAD_X + idx * slotW + (slotW - barW) / 2;
  const tag = getPointerTag(idx, frame);
  return (
    <g>
      <rect x={x} y={BASE_Y - h} width={barW} height={h} rx={1.5} fill={color} opacity={active ? 1 : 0.65}>
        <title>{`#${entry.originalIndex + 1} (sorted ${idx}): ${entry.value}`}</title>
      </rect>
      {tag && (
        <text x={x + barW / 2} y={16} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
          {tag}
        </text>
      )}
    </g>
  );
}

export function ExpenseBarChart({ sorted, frame }: ExpenseBarChartProps) {
  const maxVal = Math.max(...sorted.map((entry) => entry.value), frame.target, 1);
  const slotW = (SVG_W - PAD_X * 2) / sorted.length;
  const targetY = BASE_Y - (frame.target / maxVal) * PLOT_H;
  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <strong style={{ fontSize: '0.9rem' }}>Sorted Expense Spectrum ({sorted.length} entries)</strong>
        <ChartLegend />
      </div>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="chart-svg"
        role="img"
        aria-label={`Sorted expense bars with active positions ${frame.selectedPositions.join(', ')}`}
      >
        <line x1={PAD_X} y1={targetY} x2={SVG_W - PAD_X} y2={targetY} className="chart-ref-line" />
        <text x={SVG_W - PAD_X} y={Math.max(14, targetY - 5)} textAnchor="end" className="chart-ref-text">
          Target {frame.target}
        </text>
        {sorted.map((entry, idx) => (
          <ExpenseBar key={entry.originalIndex} entry={entry} idx={idx} slotW={slotW} maxVal={maxVal} frame={frame} />
        ))}
      </svg>
    </div>
  );
}
