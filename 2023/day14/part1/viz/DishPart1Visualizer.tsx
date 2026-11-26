import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DishCanvas } from '../../shared/viz/DishCanvas';
import { DEFAULT_MAX_TRACE_STEPS, solver, type Part1TraceStep } from '../domain';

type VizData =
  | {
      readonly ok: true;
      readonly frames: readonly Part1TraceStep[];
      readonly maxRowLoad: number;
      readonly finalLoad: number;
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const platform = solver.parse(rawInput);
    const frames = solver.trace?.(platform, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    const last = frames[frames.length - 1];
    const peakLoad = last ? Math.max(1, ...last.platform.rowLoads, ...platform.rowLoads) : 1;
    return {
      ok: true,
      frames,
      maxRowLoad: peakLoad,
      finalLoad: last ? last.platform.northLoad : platform.northLoad,
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
  finalLoad,
}: {
  readonly frame: Part1TraceStep;
  readonly finalLoad: number;
}) {
  const { platform, settledColumns } = frame;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">
        Grid: <strong>{platform.height}×{platform.width}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Settled cols: <strong>{settledColumns} / {platform.width}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Rounded rocks: <strong>{platform.roundedCount}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        North load: <strong>{platform.northLoad}</strong>
      </span>
      <span className="badge">
        Target: <strong>{finalLoad}</strong>
      </span>
    </div>
  );
}

/** Interactive column-by-column north-tilt visualizer for AoC 2023 Day 14 Part 1. */
export function DishPart1Visualizer({ rawInput }: VisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 160);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) {
    return <p className="error-text" role="alert">Invalid platform input: {data.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No platform frames available to visualize.</p>;
  }

  const highlightColumn =
    activeFrame.settledColumns < activeFrame.platform.width ? activeFrame.settledColumns : undefined;

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} finalLoad={data.finalLoad} />
      <DishCanvas
        platform={activeFrame.platform}
        highlightColumn={highlightColumn}
        activeDirection="north"
        showRowLoads
        maxRowLoad={data.maxRowLoad}
        ariaLabel={`North tilt step ${activeFrame.step + 1}, ${activeFrame.settledColumns} of ${activeFrame.platform.width} columns settled`}
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
