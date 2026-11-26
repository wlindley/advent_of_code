import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import { HASH_BUCKET_COUNT } from '../../shared';
import { HashPipelineRibbon } from '../../shared/viz/HashPipelineRibbon';
import {
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  type HashmapTraceFrame,
  type LensMutationOutcome,
} from '../domain';
import { OpticalBenchRack } from './OpticalBenchRack';

type VizData =
  | {
      readonly ok: true;
      readonly frames: readonly HashmapTraceFrame[];
      readonly finalPower: number;
    }
  | { readonly ok: false; readonly message: string };

const OUTCOME_BADGE_STYLE: Record<
  LensMutationOutcome['kind'],
  { readonly color: string; readonly format: (outcome: never) => string }
> = {
  inserted: {
    color: 'var(--ok)',
    format: (o: Extract<LensMutationOutcome, { readonly kind: 'inserted' }>) =>
      `Inserted @ slot ${o.slot + 1}`,
  },
  replaced: {
    color: 'var(--gold)',
    format: (o: Extract<LensMutationOutcome, { readonly kind: 'replaced' }>) =>
      `Replaced slot ${o.slot + 1} (was ${o.previousFocalLength})`,
  },
  removed: {
    color: 'var(--accent)',
    format: (o: Extract<LensMutationOutcome, { readonly kind: 'removed' }>) =>
      `Removed slot ${o.slot + 1} (was ${o.previousFocalLength})`,
  },
  noop: {
    color: 'var(--muted)',
    format: () => 'No-op (absent)',
  },
};

function buildVizData(rawInput: string): VizData {
  try {
    const instructions = solver.parse(rawInput);
    const frames = solver.trace?.(instructions, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    const last = frames[frames.length - 1];
    return {
      ok: true,
      frames,
      finalPower: last ? last.focusingPower : solver.solve(instructions),
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryBadges({
  frame,
  finalPower,
}: {
  readonly frame: HashmapTraceFrame;
  readonly finalPower: number;
}) {
  const badge = OUTCOME_BADGE_STYLE[frame.outcome.kind];
  const outcomeText = badge.format(frame.outcome as never);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">
        Step: <strong>{frame.processedCount} / {frame.totalSteps}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Op: <code>{frame.instruction.rawToken}</code> → Box <strong>{frame.instruction.boxIndex}</strong>
      </span>
      <span className="badge" style={{ borderColor: badge.color, color: badge.color }}>
        {outcomeText}
      </span>
      <span className="badge">
        Boxes: <strong>{frame.occupiedBoxCount} / {HASH_BUCKET_COUNT}</strong> ({frame.totalLensCount} lenses)
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Focusing power: <strong>{frame.focusingPower}</strong>
      </span>
      <span className="badge">
        Target: <strong>{finalPower}</strong>
      </span>
    </div>
  );
}

/** Interactive HASHMAP 256-box optical bench visualizer for AoC 2023 Day 15 Part 2. */
export function LensLibraryPart2Visualizer({ rawInput }: VisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 220);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) {
    return <p className="error-text" role="alert">Invalid sequence input: {data.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No lens instructions available to visualize.</p>;
  }

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} finalPower={data.finalPower} />
      <HashPipelineRibbon
        text={activeFrame.instruction.label}
        transitions={activeFrame.labelTransitions}
        resultLabel="Box"
        subtitle={`Instruction ${activeFrame.instruction.rawToken} (${activeFrame.processedCount} of ${activeFrame.totalSteps})`}
      />
      <OpticalBenchRack
        occupiedBoxes={activeFrame.occupiedBoxes}
        activeBoxIndex={activeFrame.instruction.boxIndex}
        activeLabel={activeFrame.instruction.label}
        outcome={activeFrame.outcome}
      />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(s) => jumpToStep(playback, s)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
