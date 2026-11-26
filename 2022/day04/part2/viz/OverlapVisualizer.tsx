import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, PAIR_RELATIONS, type PairRelation, type RelationTally } from '../../shared';
import { solver, type OverlapTraceFrame } from '../domain';
import { OverlapChart } from './OverlapChart';

const RELATION_LABELS: Readonly<Record<PairRelation, string>> = {
  identical: 'Identical',
  'first-contains-second': 'Elf 1 ⊇ Elf 2',
  'second-contains-first': 'Elf 2 ⊇ Elf 1',
  'partial-overlap': 'Partial Overlap',
  disjoint: 'Disjoint',
};

type TraceResult =
  | { readonly ok: true; readonly frames: readonly OverlapTraceFrame[] }
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

function TelemetryHeader({ frame }: { readonly frame: OverlapTraceFrame }) {
  const { pair, tally } = frame;
  const badgeColor = pair.hasOverlap ? 'var(--ok)' : 'var(--border)';
  return (
    <div className="meta-row">
      <span className="badge">Pair: <code>{pair.pairNumber} / {frame.totalPairs}</code></span>
      <span className="badge" style={{ borderColor: badgeColor, color: pair.hasOverlap ? 'var(--ok)' : 'var(--text)' }}>
        {RELATION_LABELS[pair.relation]}
      </span>
      <span className="badge status-solved">Overlaps: <strong className="gold">{tally.overlapCount}</strong></span>
      <span className="badge">Disjoint: <code>{tally.disjointCount}</code></span>
      {frame.totalPairs > frame.totalSteps && <span className="muted">Sampled {frame.totalSteps} of {frame.totalPairs}</span>}
    </div>
  );
}

function RelationTallyStrip({ tally, active }: { readonly tally: RelationTally; readonly active: PairRelation }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.45rem', marginBottom: '0.5rem' }}>
      {PAIR_RELATIONS.map((rel) => {
        const isCurrent = rel === active;
        const isOverlap = rel !== 'disjoint';
        const border = isCurrent ? `2px solid ${isOverlap ? 'var(--ok)' : 'var(--accent)'}` : '1px solid var(--border)';
        return (
          <div key={rel} style={{ border, borderRadius: 6, padding: '0.35rem 0.5rem', background: isCurrent ? 'var(--bg)' : 'var(--surface)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{RELATION_LABELS[rel]}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isCurrent && isOverlap ? 'var(--ok)' : 'var(--text)' }}>{tally.countOf(rel)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function OverlapVisualizer({ rawInput }: VisualizerProps) {
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
      <OverlapChart frame={frame} />
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
