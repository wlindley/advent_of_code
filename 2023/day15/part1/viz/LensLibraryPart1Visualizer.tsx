import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import { HASH_BUCKET_COUNT } from '../../shared';
import { HashPipelineRibbon } from '../../shared/viz/HashPipelineRibbon';
import { DEFAULT_MAX_TRACE_STEPS, solver, type HashSequenceFrame } from '../domain';
import { HashBucketHeatmap } from './HashBucketHeatmap';

type VizData =
  | {
      readonly ok: true;
      readonly frames: readonly HashSequenceFrame[];
      readonly peakBucketCount: number;
      readonly finalSum: number;
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const steps = solver.parse(rawInput);
    const frames = solver.trace?.(steps, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    const last = frames[frames.length - 1];
    return {
      ok: true,
      frames,
      peakBucketCount: Math.max(1, last?.maxBucketCount ?? 1),
      finalSum: last ? last.runningSum : solver.solve(steps),
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
  finalSum,
}: {
  readonly frame: HashSequenceFrame;
  readonly finalSum: number;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">
        Tokens: <strong>{frame.processedCount} / {frame.totalSteps}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Current: <code>{frame.token}</code> → <strong>{frame.tokenHash}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Occupied buckets: <strong>{frame.occupiedBuckets} / {HASH_BUCKET_COUNT}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Running sum: <strong>{frame.runningSum}</strong>
      </span>
      <span className="badge">
        Target: <strong>{finalSum}</strong>
      </span>
    </div>
  );
}

/** Interactive HASH pipeline & 256-bucket heatmap visualizer for AoC 2023 Day 15 Part 1. */
export function LensLibraryPart1Visualizer({ rawInput }: VisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 180);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) {
    return <p className="error-text" role="alert">Invalid sequence input: {data.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No sequence tokens available to visualize.</p>;
  }

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} finalSum={data.finalSum} />
      <HashPipelineRibbon
        text={activeFrame.token}
        transitions={activeFrame.charTransitions}
        resultLabel="HASH"
        subtitle={`Step ${activeFrame.processedCount} of ${activeFrame.totalSteps}`}
      />
      <HashBucketHeatmap
        bucketCounts={activeFrame.bucketCounts}
        activeBucket={activeFrame.tokenHash}
        peakBucketCount={data.peakBucketCount}
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
