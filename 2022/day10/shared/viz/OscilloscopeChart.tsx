import type { CrtTraceFrame } from '../trace';

export interface OscilloscopeChartProps {
  readonly frames: readonly CrtTraceFrame[];
  readonly activeIndex: number;
  readonly minX: number;
  readonly maxX: number;
  readonly probeCycles: readonly number[];
  readonly showProbes: boolean;
}

const W = 720;
const H = 220;
const PAD = { left: 46, right: 16, top: 16, bottom: 26 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

interface Scale {
  readonly totalCycles: number;
  readonly yMin: number;
  readonly yMax: number;
}

function toSvgX(cycle: number, totalCycles: number): number {
  return PAD.left + ((cycle - 1) / Math.max(1, totalCycles - 1)) * PLOT_W;
}

function toSvgY(xVal: number, yMin: number, yMax: number): number {
  return PAD.top + ((yMax - xVal) / Math.max(1, yMax - yMin)) * PLOT_H;
}

function buildStepPath(frames: readonly CrtTraceFrame[], scale: Scale): string {
  const parts: string[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    const f = frames[i]!;
    const x = toSvgX(f.cycle, scale.totalCycles).toFixed(1);
    const y = toSvgY(f.snapshot.xDuring, scale.yMin, scale.yMax).toFixed(1);
    if (i === 0) {
      parts.push(`M${x},${y}`);
    } else {
      const prevY = toSvgY(frames[i - 1]!.snapshot.xDuring, scale.yMin, scale.yMax).toFixed(1);
      parts.push(`L${x},${prevY} L${x},${y}`);
    }
  }
  return parts.join(' ');
}

function buildEnvelopePolygon(frames: readonly CrtTraceFrame[], scale: Scale): string {
  const upper: string[] = [];
  const lower: string[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    const f = frames[i]!;
    const x = toSvgX(f.cycle, scale.totalCycles).toFixed(1);
    if (i > 0) {
      const prev = frames[i - 1]!.snapshot.xDuring;
      upper.push(`${x},${toSvgY(prev + 1, scale.yMin, scale.yMax).toFixed(1)}`);
      lower.push(`${x},${toSvgY(prev - 1, scale.yMin, scale.yMax).toFixed(1)}`);
    }
    upper.push(`${x},${toSvgY(f.snapshot.xDuring + 1, scale.yMin, scale.yMax).toFixed(1)}`);
    lower.push(`${x},${toSvgY(f.snapshot.xDuring - 1, scale.yMin, scale.yMax).toFixed(1)}`);
  }
  return [...upper, ...lower.reverse()].join(' ');
}

function ProbeLine({ cycle, activeCycle, xVal, scale }: {
  readonly cycle: number;
  readonly activeCycle: number;
  readonly xVal: number | undefined;
  readonly scale: Scale;
}) {
  const cx = toSvgX(cycle, scale.totalCycles);
  const reached = cycle <= activeCycle;
  const stroke = reached ? 'var(--gold)' : 'var(--border)';
  return (
    <g>
      <line x1={cx} y1={PAD.top} x2={cx} y2={H - PAD.bottom} stroke={stroke} strokeDasharray="3 3" strokeWidth={reached ? 1.4 : 1} />
      {xVal !== undefined && (
        <circle
          cx={cx}
          cy={toSvgY(xVal, scale.yMin, scale.yMax)}
          r={reached ? 4 : 2.5}
          fill={reached ? 'var(--gold)' : 'var(--surface)'}
          stroke="var(--gold)"
          strokeWidth={1.5}
        />
      )}
    </g>
  );
}

const svgStyle = {
  width: '100%',
  height: 'auto',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  display: 'block',
} as const;

/** Interactive SVG register X oscilloscope with un-clamped sprite envelope and probe lines. */
export function OscilloscopeChart({ frames, activeIndex, minX, maxX, probeCycles, showProbes }: OscilloscopeChartProps) {
  const active = frames[activeIndex] ?? frames[0];
  const last = frames[frames.length - 1];
  if (!active || !last) return null;

  const scale: Scale = { totalCycles: active.totalCycles, yMin: minX - 1, yMax: maxX + 1 };
  const probeMap = new Map(last.completedProbes.map((p) => [p.cycle, p.xDuring]));
  const cursorX = toSvgX(active.cycle, scale.totalCycles);
  const cursorY = toSvgY(active.snapshot.xDuring, scale.yMin, scale.yMax);
  const zeroY = toSvgY(0, scale.yMin, scale.yMax);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Register X oscilloscope waveform" style={svgStyle}>
      <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} fill="none" stroke="var(--border)" />
      {scale.yMin <= 0 && scale.yMax >= 0 && (
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="var(--border)" strokeDasharray="2 4" />
      )}
      <polygon points={buildEnvelopePolygon(frames, scale)} fill="var(--accent)" fillOpacity={0.14} />
      <path d={buildStepPath(frames, scale)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      {showProbes && probeCycles.filter((c) => c <= scale.totalCycles).map((c) => (
        <ProbeLine key={c} cycle={c} activeCycle={active.cycle} xVal={probeMap.get(c)} scale={scale} />
      ))}
      <line x1={cursorX} y1={PAD.top} x2={cursorX} y2={H - PAD.bottom} stroke="var(--ok)" strokeWidth={1.6} />
      <circle cx={cursorX} cy={cursorY} r={4.5} fill="var(--ok)" stroke="var(--surface)" strokeWidth={1.5} />
      <text x={PAD.left - 6} y={PAD.top + 10} textAnchor="end" fontSize={11} fill="var(--muted)">{scale.yMax}</text>
      <text x={PAD.left - 6} y={H - PAD.bottom} textAnchor="end" fontSize={11} fill="var(--muted)">{scale.yMin}</text>
      <text x={PAD.left} y={H - 6} fontSize={11} fill="var(--muted)">Cycle 1</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={11} fill="var(--muted)">Cycle {scale.totalCycles}</text>
    </svg>
  );
}
