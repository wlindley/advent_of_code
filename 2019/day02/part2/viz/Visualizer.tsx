import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  formatInstructionSummary,
  traceGravityAssist,
  type AlarmTraceFrame,
} from '../../shared';
import { TapeGridPanel } from '../../shared/viz/TapeGridPanel';
import {
  DEFAULT_HEATMAP_SAMPLES,
  PART2_SEARCH_CONFIG,
  PART2_TARGET,
  buildSearchHeatmap,
  findGravityAssistMatch,
  solver,
  type GravityAssistMatch,
  type SearchHeatmap,
} from '../domain';
import { SearchHeatmapPanel } from './SearchHeatmapPanel';

type VisualizationState =
  | {
      readonly ok: true;
      readonly match: GravityAssistMatch;
      readonly heatmap: SearchHeatmap;
      readonly frames: readonly AlarmTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVisualizationState(rawInput: string): VisualizationState {
  try {
    const program = solver.parse(rawInput);
    const match = findGravityAssistMatch(program, PART2_SEARCH_CONFIG);
    const heatmap = buildSearchHeatmap(
      program,
      PART2_TARGET,
      PART2_SEARCH_CONFIG.maxInput,
      DEFAULT_HEATMAP_SAMPLES,
    );
    const frames = traceGravityAssist(program, match.inputs, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, match, heatmap, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function MatchTelemetry({
  match,
  frame,
  sampledCount,
}: {
  readonly match: GravityAssistMatch;
  readonly frame: AlarmTraceFrame;
  readonly sampledCount: number;
}) {
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge status-solved">Answer: {match.answerCode.toString()}</span>
        <span className="badge">Noun: {match.inputs.noun.toString()}</span>
        <span className="badge">Verb: {match.inputs.verb.toString()}</span>
        <span className="badge">Strategy: {match.strategy}</span>
        <span className="badge">Evaluated: {match.evaluatedCount}</span>
        <span className="badge">
          Step {frame.step.stepIndex + 1} / {frame.totalSteps}
        </span>
        <span className="badge">mem[0]: {frame.memory[0]!.toString()}</span>
        {frame.totalSteps > sampledCount && (
          <span className="muted">Sampled {sampledCount} of {frame.totalSteps} steps</span>
        )}
      </div>
      <div className="card" style={{ marginBottom: 0, padding: '0.65rem 0.9rem' }}>
        <code>{formatInstructionSummary(frame.step)}</code>
      </div>
    </div>
  );
}

/** AoC 2019 Day 2 Part 2 interactive search landscape and winning Intcode execution visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildVisualizationState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  return (
    <div className="stack">
      <MatchTelemetry match={state.match} frame={frame} sampledCount={frames.length} />
      <SearchHeatmapPanel heatmap={state.heatmap} match={state.match} target={PART2_TARGET} />
      <TapeGridPanel frame={frame} />
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
