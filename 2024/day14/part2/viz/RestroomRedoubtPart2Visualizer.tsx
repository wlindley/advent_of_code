import { useMemo } from 'react';
import { PlaybackControls, type VisualizerProps, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_REDOUBT_SPACE,
  type RedoubtSnapshot,
  type TorusSpace,
  parseRobots,
} from '../../shared';
import { RedoubtCanvas } from '../../shared/viz/RedoubtCanvas';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_SPARKLINE_BINS,
  type EasterEggAnalysis,
  type SparklineBin,
  analyzeEasterEgg,
  buildConvergenceTrace,
  downsamplePeakSeries,
} from '../domain';
import { AdjacencySparkline } from './AdjacencySparkline';

export interface RestroomRedoubtPart2VisualizerProps extends VisualizerProps {
  readonly space?: TorusSpace;
}

type VizState =
  | {
      readonly ok: true;
      readonly analysis: EasterEggAnalysis;
      readonly bins: readonly SparklineBin[];
      readonly frames: readonly RedoubtSnapshot[];
      readonly peakFrameIndex: number;
    }
  | { readonly ok: false; readonly message: string };

function buildPart2State(rawInput: string, space: TorusSpace): VizState {
  try {
    const robots = parseRobots(rawInput);
    const analysis = analyzeEasterEgg(robots, space);
    const bins = downsamplePeakSeries(analysis.adjacencySeries, DEFAULT_SPARKLINE_BINS);
    const frames = buildConvergenceTrace(robots, analysis, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const peakIdx = frames.findIndex((frame) => frame.second === analysis.bestSecond);
    return { ok: true, analysis, bins, frames, peakFrameIndex: Math.max(0, peakIdx) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function Part2Hud({
  snapshot,
  period,
  peakSecond,
  onJumpToPeak,
}: {
  readonly snapshot: RedoubtSnapshot;
  readonly period: number;
  readonly peakSecond: number;
  readonly onJumpToPeak: () => void;
}) {
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">
        Space: <code>{snapshot.space.width}×{snapshot.space.height}</code>
      </span>
      <span className="badge">
        Robots: <code>{snapshot.totalRobots}</code>
      </span>
      <span className="badge">
        Period: <code>{period}s</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        t: <code>{snapshot.second}s</code>{snapshot.label ? ` · ${snapshot.label}` : ''}
      </span>
      <span
        className={snapshot.highlight ? 'badge status-solved' : 'badge'}
        style={snapshot.highlight ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : undefined}
      >
        Adjacent Pairs: <strong><code>{snapshot.adjacentPairs}</code></strong>
      </span>
      <span className="badge">
        Unique Cells: <code>{snapshot.uniqueCells}</code>
      </span>
      <button type="button" onClick={onJumpToPeak} disabled={snapshot.second === peakSecond}>
        Jump to Peak ({peakSecond}s)
      </button>
    </div>
  );
}

/** Interactive convergence & adjacency-sparkline visualizer for Restroom Redoubt Part 2. */
export function RestroomRedoubtPart2Visualizer({
  rawInput,
  space = DEFAULT_REDOUBT_SPACE,
}: RestroomRedoubtPart2VisualizerProps) {
  const state = useMemo(() => buildPart2State(rawInput, space), [rawInput, space]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${space.width}x${space.height}`, 140);

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }
  const snapshot = state.frames[playback.step];
  if (!snapshot) {
    return <p className="error-text">Unable to visualize input: No trace frames</p>;
  }

  return (
    <div className="stack">
      <Part2Hud
        snapshot={snapshot}
        period={state.analysis.period}
        peakSecond={state.analysis.bestSecond}
        onJumpToPeak={() => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(state.peakFrameIndex);
        }}
      />
      <RedoubtCanvas snapshot={snapshot} showQuadrants={false} />
      <AdjacencySparkline
        bins={state.bins}
        period={state.analysis.period}
        bestSecond={state.analysis.bestSecond}
        peakAdjacency={state.analysis.peakAdjacency}
        baselineMean={state.analysis.baselineMeanAdjacency}
        currentSecond={snapshot.second}
      />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
