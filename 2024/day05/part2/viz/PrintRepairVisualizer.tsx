import { useId, useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type PrintRepairTraceFrame } from '../domain';
import { PrintRepairSvg } from './PrintRepairSvg';

type ParsedVizState =
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'empty'; readonly totalUpdates: number }
  | { readonly kind: 'frames'; readonly frames: readonly PrintRepairTraceFrame[] };

function buildVizState(rawInput: string): ParsedVizState {
  try {
    const queue = solver.parse(rawInput);
    const frames = solver.trace!(queue, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return frames.length === 0 ? { kind: 'empty', totalUpdates: queue.updates.length } : { kind: 'frames', frames };
  } catch (error) {
    return { kind: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

function StatusBadges({ frame }: { readonly frame: PrintRepairTraceFrame }) {
  return (
    <div className="meta-row">
      <span className="badge">Repair: <code>{frame.repairedCountSoFar} / {frame.totalInvalidUpdates}</code> (Update #{frame.updateIndex + 1})</span>
      <span className="badge status-blocked">Violations fixed: <code>{frame.violationCount}</code> · Moved: <code>{frame.movedPageCount}</code></span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Repaired middle: <code>{frame.repairedMiddlePage}</code></span>
      <span className="badge status-solved">Sum: <strong className="gold"><code>{frame.middleSumSoFar}</code></strong></span>
    </div>
  );
}

function LegendAndControls({ totalSteps, playback }: { readonly totalSteps: number; readonly playback: PlaybackState }) {
  return (
    <>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--err)' }}>Top crimson arcs</strong>: violated before</span><span>·</span>
        <span><strong style={{ color: 'var(--accent)' }}>Blue ribbons</strong>: moved pages</span><span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Gold</strong>: repaired middle</span><span>·</span>
        <span><strong style={{ color: 'var(--ok)' }}>Bottom green arcs</strong>: satisfied after</span>
      </div>
      <PlaybackControls
        step={playback.step} totalSteps={totalSteps} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => { if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0); playback.togglePlay(); }}
        onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
        onSpeedChange={playback.setSpeedMs}
      />
    </>
  );
}

export function PrintRepairVisualizer({ rawInput }: VisualizerProps) {
  const markerId = useId();
  const state = useMemo(() => buildVizState(rawInput), [rawInput]);
  const frames = state.kind === 'frames' ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 550);

  if (state.kind === 'error') {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }
  if (state.kind === 'empty') {
    return (
      <div className="meta-row">
        <span className="badge status-solved">
          All {state.totalUpdates} updates are already valid — no repairs needed (sum: <code>0</code>).
        </span>
      </div>
    );
  }

  const frame = frames[playback.step] ?? frames[0]!;
  return (
    <div>
      <StatusBadges frame={frame} />
      <PrintRepairSvg frame={frame} markerId={markerId} />
      <LegendAndControls totalSteps={frames.length} playback={playback} />
    </div>
  );
}
