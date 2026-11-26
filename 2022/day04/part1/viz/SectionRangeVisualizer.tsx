import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import type { ClosedInterval } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, PAIR_RELATIONS, type PairRelation, type RelationTally } from '../../shared';
import { solver, type AssignmentTraceFrame } from '../domain';

const SVG_W = 640;
const PLOT_X = 58;
const PLOT_W = 564;

const RELATION_LABELS: Readonly<Record<PairRelation, string>> = {
  identical: 'Identical',
  'first-contains-second': 'Elf 1 ⊇ Elf 2',
  'second-contains-first': 'Elf 2 ⊇ Elf 1',
  'partial-overlap': 'Partial Overlap',
  disjoint: 'Disjoint',
};

type TraceResult =
  | { readonly ok: true; readonly frames: readonly AssignmentTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(rawInput: string): TraceResult {
  try {
    const pairs = solver.parse(rawInput);
    return { ok: true, frames: solver.trace!(pairs, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function projectBar(iv: ClosedInterval, bounds: ClosedInterval): { readonly x: number; readonly w: number } {
  const totalUnits = bounds.end - bounds.start + 1n;
  const startFrac = Number(((iv.start - bounds.start) * 1000n) / totalUnits) / 1000;
  const spanFrac = Number(((iv.end - iv.start + 1n) * 1000n) / totalUnits) / 1000;
  const w = Math.max(4, spanFrac * PLOT_W);
  const x = Math.min(PLOT_X + PLOT_W - w, PLOT_X + startFrac * PLOT_W);
  return { x, w };
}

function TelemetryHeader({ frame }: { readonly frame: AssignmentTraceFrame }) {
  const { pair, tally } = frame;
  const badgeColor = pair.hasFullContainment ? 'var(--gold)' : pair.hasOverlap ? 'var(--accent)' : 'var(--border)';
  return (
    <div className="meta-row">
      <span className="badge">Pair: <code>{pair.pairNumber} / {frame.totalPairs}</code></span>
      <span className="badge" style={{ borderColor: badgeColor, color: pair.hasFullContainment ? 'var(--gold)' : 'var(--text)' }}>
        {RELATION_LABELS[pair.relation]}
      </span>
      <span className="badge status-solved">Contained: <strong className="gold">{tally.fullContainmentCount}</strong></span>
      <span className="badge">Overlaps: <code>{tally.overlapCount}</code></span>
      {frame.totalPairs > frame.totalSteps && <span className="muted">Sampled {frame.totalSteps} of {frame.totalPairs}</span>}
    </div>
  );
}

function RangeBarRow({ label, interval, bounds, y, stroke }: {
  readonly label: string;
  readonly interval: ClosedInterval;
  readonly bounds: ClosedInterval;
  readonly y: number;
  readonly stroke: string;
}) {
  const { x, w } = projectBar(interval, bounds);
  return (
    <g>
      <text x={8} y={y + 16} fontSize={12} fontWeight={600} fill="var(--text)">{label}</text>
      <rect x={PLOT_X} y={y} width={PLOT_W} height={24} rx={4} fill="var(--bg)" stroke="var(--border)" />
      <rect x={x} y={y} width={w} height={24} rx={4} fill="var(--surface)" stroke={stroke} strokeWidth={2} />
      <text x={x + w / 2} y={y + 16} fontSize={11} fontWeight={600} textAnchor="middle" fill="var(--text)">
        {`${interval.start}–${interval.end}`}
      </text>
    </g>
  );
}

function IntervalSvgChart({ frame }: { readonly frame: AssignmentTraceFrame }) {
  const { pair, globalBounds } = frame;
  const overlap = pair.overlapInterval;
  const band = overlap ? projectBar(overlap, globalBounds) : null;
  const bandColor = pair.hasFullContainment ? 'var(--gold)' : 'var(--accent)';
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.5rem', margin: '0.5rem 0' }}>
      <svg viewBox={`0 0 ${SVG_W} 112`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Section range comparison">
        <text x={PLOT_X} y={14} fontSize={11} fill="var(--muted)">{globalBounds.start.toString()}</text>
        <text x={PLOT_X + PLOT_W} y={14} fontSize={11} textAnchor="end" fill="var(--muted)">{globalBounds.end.toString()}</text>
        {band && (
          <rect x={band.x} y={20} width={band.w} height={74} rx={3} fill={bandColor} fillOpacity={0.14} stroke={bandColor} strokeDasharray="4 3" />
        )}
        <RangeBarRow label="Elf 1" interval={pair.first} bounds={globalBounds} y={24} stroke={pair.hasFullContainment ? 'var(--gold)' : 'var(--accent)'} />
        <RangeBarRow label="Elf 2" interval={pair.second} bounds={globalBounds} y={64} stroke={pair.hasFullContainment ? 'var(--gold)' : 'var(--ok)'} />
        <text x={PLOT_X} y={107} fontSize={11} fill="var(--muted)">
          {overlap ? `Overlap: ${overlap.start}–${overlap.end} (${overlap.length} sections)` : 'No overlapping sections'}
        </text>
      </svg>
    </div>
  );
}

function RelationTallyStrip({ tally, active }: { readonly tally: RelationTally; readonly active: PairRelation }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.45rem', marginBottom: '0.5rem' }}>
      {PAIR_RELATIONS.map((rel) => {
        const isCurrent = rel === active;
        const isContain = rel !== 'partial-overlap' && rel !== 'disjoint';
        const border = isCurrent ? `2px solid ${isContain ? 'var(--gold)' : 'var(--accent)'}` : '1px solid var(--border)';
        return (
          <div key={rel} style={{ border, borderRadius: 6, padding: '0.35rem 0.5rem', background: isCurrent ? 'var(--bg)' : 'var(--surface)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{RELATION_LABELS[rel]}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isCurrent && isContain ? 'var(--gold)' : 'var(--text)' }}>{tally.countOf(rel)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function SectionRangeVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryHeader frame={frame} />
      <IntervalSvgChart frame={frame} />
      <RelationTallyStrip tally={frame.tally} active={frame.pair.relation} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
