import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DishCanvas } from '../../shared/viz/DishCanvas';
import {
  analyzeSpinCycles,
  buildTraceFromAnalysis,
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  SpinCycleAnalysis,
  type Part2TraceStep,
} from '../domain';
import { RhoLoadChart } from './RhoLoadChart';

type VizData =
  | {
      readonly ok: true;
      readonly analysis: SpinCycleAnalysis;
      readonly frames: readonly Part2TraceStep[];
      readonly maxRowLoad: number;
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const platform = solver.parse(rawInput);
    const analysis = analyzeSpinCycles(platform);
    const frames = buildTraceFromAnalysis(analysis, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    let peak = 1;
    for (const frame of frames) {
      for (const rowLoad of frame.platform.rowLoads) {
        if (rowLoad > peak) peak = rowLoad;
      }
    }
    return { ok: true, analysis, frames, maxRowLoad: peak };
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

function formatCycleLabel(frame: Part2TraceStep): string {
  if (frame.phase === 'projection' && frame.matchedCycle !== null) {
    return `1e9 (≡ c${frame.matchedCycle})`;
  }
  if (frame.phase === 'closure' && frame.matchedCycle !== null) {
    return `c${frame.cycle} → c${frame.matchedCycle}`;
  }
  return `c${frame.cycle}`;
}

function TelemetryBadges({
  frame,
  analysis,
}: {
  readonly frame: Part2TraceStep;
  readonly analysis: SpinCycleAnalysis;
}) {
  const { platform } = frame;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">
        Grid: <strong>{platform.height}×{platform.width}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Phase: <strong>{frame.phase}</strong> ({formatCycleLabel(frame)})
      </span>
      <span className="badge">
        μ / λ: <strong>{analysis.cycleStart ?? '—'} / {analysis.cycleLength ?? '—'}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        North load: <strong>{platform.northLoad}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        1e9 Target: <strong>{analysis.finalLoad}</strong>
      </span>
    </div>
  );
}

/** Interactive spin-cycle and rho-trajectory visualizer for AoC 2023 Day 14 Part 2. */
export function DishPart2Visualizer({ rawInput }: VisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 220);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) {
    return <p className="error-text" role="alert">Invalid platform input: {data.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No spin-cycle frames available to visualize.</p>;
  }

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} analysis={data.analysis} />
      <DishCanvas
        platform={activeFrame.platform}
        activeDirection={activeFrame.phase === 'initial' ? undefined : 'east'}
        showRowLoads
        maxRowLoad={data.maxRowLoad}
        ariaLabel={`Spin cycle step ${activeFrame.step + 1}, phase ${activeFrame.phase}, north load ${activeFrame.platform.northLoad}`}
      />
      <RhoLoadChart
        loadSeries={data.analysis.loadSeries}
        cycleStart={data.analysis.cycleStart}
        repeatCycle={data.analysis.repeatCycle}
        equivalentCycle={data.analysis.equivalentCycle}
        activeFrame={activeFrame}
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
