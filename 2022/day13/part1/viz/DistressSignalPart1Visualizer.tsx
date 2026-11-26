import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import { PacketComparePanel } from '../../shared/viz/PacketComparePanel';
import { DEFAULT_MAX_TRACE_STEPS, solver, type PairTraceFrame } from '../domain';
import { PairIndexGrid } from './PairIndexGrid';

type VizState =
  | { readonly ok: true; readonly frames: readonly PairTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string): VizState {
  try {
    const parsed = solver.parse(rawInput);
    const frames = solver.trace?.(parsed, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) {
    playback.setStep(0);
  }
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) {
    playback.togglePlay();
  }
  playback.setStep(nextStep);
}

function KpiBadges({ frame, frameCount }: {
  readonly frame: PairTraceFrame;
  readonly frameCount: number;
}) {
  return (
    <div className="meta-row" style={{ marginBottom: '0.65rem' }}>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Pair: <code>#{frame.pairIndex} / {frame.totalPairs}</code>
      </span>
      <span className="badge">
        Right-Ordered: <code>{frame.rightOrderCount}</code>
      </span>
      <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
        Index Sum: <strong>{frame.rightOrderIndexSum}</strong>
      </span>
      {frame.isRightOrder ? (
        <span className="badge status-solved">Added +{frame.pairIndex}</span>
      ) : frame.order === 0 ? (
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Equal (Skipped)
        </span>
      ) : (
        <span className="badge status-blocked">Out of Order (Skipped)</span>
      )}
      {frameCount < frame.totalPairs && (
        <span className="muted">Sampled {frameCount} of {frame.totalPairs} pairs</span>
      )}
    </div>
  );
}

/** Interactive visualizer stepping through Part 1 packet pair comparisons. */
export function DistressSignalPart1Visualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput), [rawInput]);
  const frameCount = state.ok ? state.frames.length : 0;
  const playback = usePlayback(frameCount, rawInput, 260);

  if (!state.ok) {
    return <p className="error-text">Cannot visualize input: {state.message}</p>;
  }
  const frame = state.frames[playback.step];
  if (!frame) {
    return <p className="muted">No trace frames available.</p>;
  }

  return (
    <div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frameCount}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frameCount - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
      <KpiBadges frame={frame} frameCount={frameCount} />
      <PairIndexGrid
        frames={state.frames}
        activeStep={playback.step}
        onSelectStep={(next) => handleStepChange(playback, next)}
      />
      <PacketComparePanel
        left={frame.pair.left}
        right={frame.pair.right}
        comparison={frame.comparison}
        leftLabel={`Pair #${frame.pairIndex} Left`}
        rightLabel={`Pair #${frame.pairIndex} Right`}
      />
    </div>
  );
}
