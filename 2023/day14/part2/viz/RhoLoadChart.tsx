import type { Part2TraceStep } from '../domain';

export interface RhoLoadChartProps {
  readonly loadSeries: readonly number[];
  readonly cycleStart: number | null;
  readonly repeatCycle: number | null;
  readonly equivalentCycle: number;
  readonly activeFrame: Part2TraceStep;
}

interface ChartScale {
  readonly maxCycle: number;
  readonly minLoad: number;
  readonly maxLoad: number;
}

const SVG_W = 640;
const SVG_H = 180;
const PAD_L = 46;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 28;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

function xFor(cycle: number, scale: ChartScale): number {
  if (scale.maxCycle <= 0) return PAD_L + PLOT_W / 2;
  return PAD_L + (cycle / scale.maxCycle) * PLOT_W;
}

function yFor(load: number, scale: ChartScale): number {
  if (scale.maxLoad === scale.minLoad) return PAD_T + PLOT_H / 2;
  return PAD_T + ((scale.maxLoad - load) / (scale.maxLoad - scale.minLoad)) * PLOT_H;
}

function buildPolylinePoints(
  loadSeries: readonly number[],
  start: number,
  endInclusive: number,
  scale: ChartScale,
  closureLoad?: number,
): string {
  const pts: string[] = [];
  for (let c = start; c <= endInclusive; c += 1) {
    const load = c < loadSeries.length ? loadSeries[c]! : closureLoad!;
    pts.push(`${xFor(c, scale).toFixed(1)},${yFor(load, scale).toFixed(1)}`);
  }
  return pts.join(' ');
}

function activeCursorCycle(frame: Part2TraceStep, equivalentCycle: number): number {
  if (frame.phase === 'projection') return equivalentCycle;
  return frame.cycle;
}

function renderClosureArc(
  cycleStart: number,
  repeatCycle: number,
  load: number,
  scale: ChartScale,
) {
  const x1 = xFor(repeatCycle, scale);
  const x2 = xFor(cycleStart, scale);
  const y = yFor(load, scale);
  const midX = (x1 + x2) / 2;
  const ctrlY = Math.max(8, y - 28);
  return (
    <path
      d={`M ${x1.toFixed(1)} ${y.toFixed(1)} Q ${midX.toFixed(1)} ${ctrlY.toFixed(1)} ${x2.toFixed(1)} ${y.toFixed(1)}`}
      fill="none"
      stroke="var(--accent)"
      strokeWidth={1.75}
      strokeDasharray="4 3"
    />
  );
}

/** SVG north-load trajectory chart highlighting transient tail, periodic loop, closure, and 1e9 projection. */
export function RhoLoadChart({
  loadSeries,
  cycleStart,
  repeatCycle,
  equivalentCycle,
  activeFrame,
}: RhoLoadChartProps) {
  const hasCycle = cycleStart !== null && repeatCycle !== null;
  const maxCycle = hasCycle ? repeatCycle : Math.max(0, loadSeries.length - 1);
  const scale: ChartScale = {
    maxCycle,
    minLoad: Math.min(...loadSeries),
    maxLoad: Math.max(...loadSeries),
  };
  const transientEnd = hasCycle ? cycleStart : loadSeries.length - 1;
  const transientPts = buildPolylinePoints(loadSeries, 0, transientEnd, scale);
  const cyclePts = hasCycle
    ? buildPolylinePoints(loadSeries, cycleStart, repeatCycle, scale, loadSeries[cycleStart]!)
    : '';
  const cursorCycle = activeCursorCycle(activeFrame, equivalentCycle);
  const cursorX = xFor(cursorCycle, scale);
  const cursorY = yFor(activeFrame.platform.northLoad, scale);
  const eqX = xFor(equivalentCycle, scale);
  const eqY = yFor(loadSeries[equivalentCycle]!, scale);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        role="img"
        aria-label={`Spin-cycle north load trajectory across ${loadSeries.length} observed states`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={SVG_H - PAD_B} stroke="var(--border)" />
        <line x1={PAD_L} y1={SVG_H - PAD_B} x2={SVG_W - PAD_R} y2={SVG_H - PAD_B} stroke="var(--border)" />
        <text x={PAD_L - 6} y={PAD_T + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{scale.maxLoad}</text>
        <text x={PAD_L - 6} y={SVG_H - PAD_B + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{scale.minLoad}</text>
        <text x={PAD_L} y={SVG_H - 8} textAnchor="start" fontSize="11" fill="var(--muted)">c0</text>
        {hasCycle && (
          <text x={xFor(cycleStart, scale)} y={SVG_H - 8} textAnchor="middle" fontSize="11" fill="var(--accent)">μ={cycleStart}</text>
        )}
        <text x={xFor(maxCycle, scale)} y={SVG_H - 8} textAnchor="end" fontSize="11" fill="var(--muted)">c{maxCycle}</text>
        <polyline fill="none" stroke="var(--muted)" strokeWidth={2} points={transientPts} />
        {hasCycle && <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={cyclePts} />}
        {hasCycle && renderClosureArc(cycleStart, repeatCycle, loadSeries[cycleStart]!, scale)}
        <line x1={cursorX} y1={PAD_T} x2={cursorX} y2={SVG_H - PAD_B} stroke="var(--gold)" strokeWidth={1.25} strokeDasharray="3 3" />
        <circle cx={eqX} cy={eqY} r={6} fill="none" stroke="var(--ok)" strokeWidth={2} />
        <circle cx={cursorX} cy={cursorY} r={4.5} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.5} />
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--muted)', paddingTop: '0.25rem' }}>
        <span>— Transient (0..μ)</span>
        <span style={{ color: 'var(--accent)' }}>— Cycle loop (μ..repeat)</span>
        <span style={{ color: 'var(--ok)' }}>○ 1e9 eq (c{equivalentCycle})</span>
        <span style={{ color: 'var(--gold)' }}>● Active (c{cursorCycle})</span>
      </div>
    </div>
  );
}
