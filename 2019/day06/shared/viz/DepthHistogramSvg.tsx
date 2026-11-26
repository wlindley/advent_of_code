import type { HistogramBin } from '../types';
import type { OrbitTraceFrame } from '../policy';

export interface DepthHistogramSvgProps {
  readonly bins: readonly HistogramBin[];
  readonly frame: OrbitTraceFrame;
  readonly activeTransferDepths: ReadonlySet<number>;
  readonly maxDepth: number;
}

function getBinFill(
  bin: HistogramBin,
  frame: OrbitTraceFrame,
  activeTransferDepths: ReadonlySet<number>,
): string {
  if (frame.kind === 'depth-sweep') {
    if (frame.activeDepth >= bin.depthStart && frame.activeDepth <= bin.depthEnd) {
      return 'var(--accent)';
    }
    return bin.depthEnd < frame.activeDepth ? 'var(--ok)' : 'var(--border)';
  }
  for (let d = bin.depthStart; d <= bin.depthEnd; d += 1) {
    if (activeTransferDepths.has(d)) return 'var(--accent)';
  }
  return 'var(--border)';
}

/** Bounded depth-shell histogram (`<= 48` bins) summarizing node counts by orbital depth. */
export function DepthHistogramSvg({
  bins,
  frame,
  activeTransferDepths,
  maxDepth,
}: DepthHistogramSvgProps) {
  const width = 760;
  const height = 180;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxNodes = Math.max(1, ...bins.map((b) => b.nodeCount));
  const slotW = plotW / Math.max(1, bins.length);

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Orbital depth shell histogram"
    >
      <title>Node distribution across orbital depth shells</title>
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border)" />
      <line x1={padL} y1={padT + plotH} x2={width - padR} y2={padT + plotH} stroke="var(--border)" />
      <text className="chart-axis-text" x={padL - 6} y={padT + 9} textAnchor="end">
        {maxNodes}
      </text>
      <text className="chart-axis-text" x={padL - 6} y={padT + plotH} textAnchor="end">
        0
      </text>
      <text className="chart-axis-text" x={padL} y={height - 8} textAnchor="start">
        depth 0
      </text>
      <text className="chart-axis-text" x={width - padR} y={height - 8} textAnchor="end">
        depth {maxDepth}
      </text>
      {bins.map((bin, idx) => {
        const barH = Math.max(2, (bin.nodeCount / maxNodes) * plotH);
        const barW = Math.max(2, slotW - 2);
        const x = padL + idx * slotW + 1;
        const y = padT + plotH - barH;
        const label =
          bin.depthStart === bin.depthEnd
            ? `Depth ${bin.depthStart}: ${bin.nodeCount} nodes (+${bin.orbitContribution} orbits)`
            : `Depths ${bin.depthStart}-${bin.depthEnd}: ${bin.nodeCount} nodes (+${bin.orbitContribution} orbits)`;
        return (
          <rect
            key={`${bin.depthStart}-${bin.depthEnd}`}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={2}
            fill={getBinFill(bin, frame, activeTransferDepths)}
          >
            <title>{label}</title>
          </rect>
        );
      })}
    </svg>
  );
}
