import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import type { GridBounds, MotionPlan } from '../motionPlan';
import { DEFAULT_MAX_TRACE_STEPS, RopeTraceFrame, type RopeBridgeSolver } from '../simulation';
import { RopeCanvas } from './RopeCanvas';
import { buildCumulativeTailIndex, type CumulativeTailIndex } from './ropeViewport';

export interface RopeBridgeVisualizerProps {
  readonly rawInput: string;
  readonly solver: RopeBridgeSolver;
}

type TraceResult =
  | {
      readonly ok: true;
      readonly plan: MotionPlan;
      readonly bounds: GridBounds;
      readonly frames: readonly RopeTraceFrame[];
      readonly tailIndex: CumulativeTailIndex;
    }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(rawInput: string, solver: RopeBridgeSolver): TraceResult {
  try {
    const plan = solver.parse(rawInput);
    const bounds = plan.computeBounds();
    const frames = solver.trace(plan, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const tailIndex = buildCumulativeTailIndex(frames);
    return { ok: true, plan, bounds, frames, tailIndex };
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

interface TelemetryHeaderProps {
  readonly plan: MotionPlan;
  readonly frame: RopeTraceFrame;
  readonly frameIndex: number;
  readonly frameCount: number;
  readonly tailIndex: CumulativeTailIndex;
}

function TelemetryHeader({ plan, frame, frameIndex, frameCount, tailIndex }: TelemetryHeaderProps) {
  const cmd = frame.commandIndex >= 0 ? plan.commands[frame.commandIndex] : undefined;
  const cmdLabel = cmd ? `${cmd.direction} ${cmd.steps} (#${frame.commandIndex + 1}/${plan.commandCount})` : 'Start';
  const visitedSoFar = tailIndex.prefixEnds[frameIndex] ?? 0;
  const totalVisited = tailIndex.cells.length;

  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Cmd: <code>{cmdLabel}</code>
      </span>
      <span className="badge">
        Step: <code>{frame.stepIndex} / {frame.totalSteps}</code>
      </span>
      <span className="badge">
        H <code>({frame.head.x}, {frame.head.y})</code> · T <code>({frame.tail.x}, {frame.tail.y})</code>
      </span>
      <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
        Tail visited: <strong>{visitedSoFar}</strong> / {totalVisited}
      </span>
      {frameCount < frame.totalSteps + 1 && (
        <span className="muted">Sampled {frameCount} of {frame.totalSteps + 1} states</span>
      )}
    </div>
  );
}

/** Shared interactive canvas visualizer for 2022 Day 9 Rope Bridge (Part 1 & Part 2). */
export function RopeBridgeVisualizer({ rawInput, solver }: RopeBridgeVisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 120);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div>
      <TelemetryHeader
        plan={state.plan}
        frame={frame}
        frameIndex={playback.step}
        frameCount={frames.length}
        tailIndex={state.tailIndex}
      />
      <RopeCanvas bounds={state.bounds} frame={frame} frameIndex={playback.step} tailIndex={state.tailIndex} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
