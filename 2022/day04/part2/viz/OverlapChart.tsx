import type { ClosedInterval } from '../../../../shared/core';
import type { AssignmentPair } from '../../shared';
import type { OverlapTraceFrame } from '../domain';

const SVG_W = 640;
const PLOT_X = 58;
const PLOT_W = 564;

function projectSpan(start: bigint, end: bigint, bounds: ClosedInterval) {
  const totalUnits = bounds.end - bounds.start + 1n;
  const startFrac = Number(((start - bounds.start) * 10000n) / totalUnits) / 10000;
  const spanFrac = Number(((end - start + 1n) * 10000n) / totalUnits) / 10000;
  const w = Math.max(4, spanFrac * PLOT_W);
  return { x: Math.min(PLOT_X + PLOT_W - w, PLOT_X + startFrac * PLOT_W), w };
}

function orderedDisjointBounds(pair: AssignmentPair) {
  return pair.first.end < pair.second.start
    ? { lower: pair.first, upper: pair.second }
    : { lower: pair.second, upper: pair.first };
}

function statusCaption(pair: AssignmentPair): string {
  const overlap = pair.overlapInterval;
  if (overlap) {
    return overlap.length === 1n
      ? `Endpoint touch at section ${overlap.start} (1 shared section)`
      : `Overlap: ${overlap.start}–${overlap.end} (${overlap.length} sections)`;
  }
  const { lower, upper } = orderedDisjointBounds(pair);
  if (upper.start > lower.end + 1n) {
    return `Disjoint: ${upper.start - lower.end - 1n} missing sections (${lower.end + 1n}–${upper.start - 1n})`;
  }
  return `Adjacent disjoint: ${lower.end} | ${upper.start} (0 shared sections)`;
}

interface RangeBarProps { readonly label: string; readonly interval: ClosedInterval; readonly bounds: ClosedInterval; readonly y: number; readonly stroke: string; }

function RangeBarRow({ label, interval, bounds, y, stroke }: RangeBarProps) {
  const { x, w } = projectSpan(interval.start, interval.end, bounds);
  return (
    <g>
      <text x={8} y={y + 16} fontSize={12} fontWeight={600} fill="var(--text)">{label}</text>
      <rect x={PLOT_X} y={y} width={PLOT_W} height={24} rx={4} fill="var(--bg)" stroke="var(--border)" />
      <rect x={x} y={y} width={w} height={24} rx={4} fill="var(--surface)" stroke={stroke} strokeWidth={2} />
      <text x={x + w / 2} y={y + 16} fontSize={11} fontWeight={600} textAnchor="middle" fill="var(--text)">{`${interval.start}–${interval.end}`}</text>
    </g>
  );
}

function DisjointMarker({ pair, bounds }: { readonly pair: AssignmentPair; readonly bounds: ClosedInterval }) {
  const { lower, upper } = orderedDisjointBounds(pair);
  if (upper.start > lower.end + 1n) {
    const gap = projectSpan(lower.end + 1n, upper.start - 1n, bounds);
    return (
      <g stroke="var(--muted)" strokeWidth={1.5}>
        <line x1={gap.x} y1={56} x2={gap.x + gap.w} y2={56} strokeDasharray="3 2" />
        <line x1={gap.x} y1={51} x2={gap.x} y2={61} />
        <line x1={gap.x + gap.w} y1={51} x2={gap.x + gap.w} y2={61} />
      </g>
    );
  }
  const lowBar = projectSpan(lower.start, lower.end, bounds);
  const upBar = projectSpan(upper.start, upper.end, bounds);
  const splitX = (lowBar.x + lowBar.w + upBar.x) / 2;
  return <line x1={splitX} y1={24} x2={splitX} y2={88} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="2 2" />;
}

function OverlapMarker({ pair, bounds }: { readonly pair: AssignmentPair; readonly bounds: ClosedInterval }) {
  const overlap = pair.overlapInterval;
  if (!overlap) return <DisjointMarker pair={pair} bounds={bounds} />;
  const band = projectSpan(overlap.start, overlap.end, bounds);
  if (overlap.length === 1n) {
    const cx = band.x + band.w / 2;
    return (
      <g>
        <line x1={cx} y1={20} x2={cx} y2={92} stroke="var(--gold)" strokeWidth={2} strokeDasharray="3 2" />
        <polygon points={`${cx},50 ${cx + 6},56 ${cx},62 ${cx - 6},56`} fill="var(--gold)" />
      </g>
    );
  }
  return <rect x={band.x} y={20} width={band.w} height={74} rx={3} fill="var(--ok)" fillOpacity={0.14} stroke="var(--ok)" strokeDasharray="4 3" />;
}

export function OverlapChart({ frame }: { readonly frame: OverlapTraceFrame }) {
  const { pair, globalBounds } = frame;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.5rem', margin: '0.5rem 0' }}>
      <svg viewBox={`0 0 ${SVG_W} 112`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Section overlap comparison">
        <text x={PLOT_X} y={14} fontSize={11} fill="var(--muted)">{globalBounds.start.toString()}</text>
        <text x={PLOT_X + PLOT_W} y={14} fontSize={11} textAnchor="end" fill="var(--muted)">{globalBounds.end.toString()}</text>
        <RangeBarRow label="Elf 1" interval={pair.first} bounds={globalBounds} y={24} stroke={pair.hasOverlap ? 'var(--ok)' : 'var(--accent)'} />
        <RangeBarRow label="Elf 2" interval={pair.second} bounds={globalBounds} y={64} stroke={pair.hasOverlap ? 'var(--gold)' : 'var(--muted)'} />
        <OverlapMarker pair={pair} bounds={globalBounds} />
        <text x={PLOT_X} y={107} fontSize={11} fill="var(--muted)">{statusCaption(pair)}</text>
      </svg>
    </div>
  );
}
