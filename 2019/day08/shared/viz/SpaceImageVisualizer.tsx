import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_FRAMES,
  type LayerDigitCounts,
  type SpaceImageSolver,
  type SpaceImageTraceFrame,
} from '../index';
import { LayerHistogramSvg } from './LayerHistogramSvg';
import { SpaceImageGridSvg } from './SpaceImageGridSvg';

interface SpaceImageVisualizerProps<TAnswer> {
  readonly rawInput: string;
  readonly solver: SpaceImageSolver<TAnswer>;
}

type TraceResult =
  | {
      readonly ok: true;
      readonly frames: readonly SpaceImageTraceFrame[];
      readonly allLayerCounts: readonly LayerDigitCounts[];
      readonly answerLabel: string;
    }
  | { readonly ok: false; readonly message: string };

function buildTraceState<TAnswer>(rawInput: string, solver: SpaceImageSolver<TAnswer>): TraceResult {
  try {
    const image = solver.parse(rawInput);
    const frames = solver.trace(image, { maxSteps: DEFAULT_MAX_TRACE_FRAMES });
    const allLayerCounts = image.allLayerCounts();
    const answerLabel = solver.policy.formatAnswer(solver.solve(image));
    return { ok: true, frames, allLayerCounts, answerLabel };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive Space Image Format layer-inspection and progressive composite visualizer. */
export function SpaceImageVisualizer<TAnswer>({ rawInput, solver }: SpaceImageVisualizerProps<TAnswer>) {
  const state = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 160);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const slots = frame.decodedSlots;

  return (
    <div className="stack">
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">{solver.policy.name}</span>
        <span className="badge">
          Layer {frame.layerIndex + 1} / {frame.totalLayers}
        </span>
        <span className="badge">
          0s: {frame.layerCounts.zeros} · 1s: {frame.layerCounts.ones} · 2s: {frame.layerCounts.twos}
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Best #{frame.bestLayerIndex + 1} (0s: {frame.bestLayerCounts.zeros}, checksum: {frame.bestChecksum})
        </span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Resolved {frame.resolvedPixelCount} / {frame.dimensions.layerSize} ({Math.round(frame.completionRatio * 100)}%)
        </span>
        <span className="badge">Result: {state.answerLabel}</span>
      </div>
      {slots !== null ? (
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="eyebrow">Decoded Slots</span>
          {slots.map((ch, idx) => (
            <span key={idx} className="badge" style={{ fontFamily: 'monospace' }}>
              {ch ?? '?'}
            </span>
          ))}
        </div>
      ) : null}
      <SpaceImageGridSvg frame={frame} />
      <LayerHistogramSvg
        allLayerCounts={state.allLayerCounts}
        activeLayerIndex={frame.layerIndex}
        bestLayerIndex={frame.bestLayerIndex}
      />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
