import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  type AsteroidMap,
  DEFAULT_MAX_TRACE_FRAMES,
  type MonitoringStationSolver,
  type StationTraceFrame,
} from '../index';
import { AsteroidFieldSvg } from './AsteroidFieldSvg';

interface MonitoringStationVisualizerProps<TAnswer, TTrace extends StationTraceFrame> {
  readonly rawInput: string;
  readonly solver: MonitoringStationSolver<TAnswer, TTrace>;
}

type TraceState =
  | {
      readonly ok: true;
      readonly map: AsteroidMap;
      readonly frames: readonly StationTraceFrame[];
      readonly answerLabel: string;
    }
  | { readonly ok: false; readonly message: string };

function buildTraceState<TAnswer, TTrace extends StationTraceFrame>(
  rawInput: string,
  solver: MonitoringStationSolver<TAnswer, TTrace>,
): TraceState {
  try {
    const map = solver.parse(rawInput);
    const frames = solver.trace(map, { maxSteps: DEFAULT_MAX_TRACE_FRAMES });
    const answerLabel = solver.policy.formatAnswer(solver.solve(map));
    return { ok: true, map, frames, answerLabel };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function FrameStatusBadges({ frame, answerLabel, policyLabel }: { frame: StationTraceFrame; answerLabel: string; policyLabel: string }) {
  if (frame.kind === 'monitor-scan') {
    return (
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">{policyLabel}</span>
        <span className="badge">
          Candidate {frame.stepIndex + 1} / {frame.totalCandidates} ({frame.candidate.x}, {frame.candidate.y})
        </span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Visible: {frame.detectedCount}
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Best ({frame.bestStation.x}, {frame.bestStation.y}): {frame.bestDetectedCount}
        </span>
        <span className="badge">Result: {answerLabel}</span>
      </div>
    );
  }

  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policyLabel}</span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Station ({frame.station.x}, {frame.station.y})
      </span>
      <span className="badge">
        Vaporized {frame.vaporizedCount} / {frame.totalTargets}
      </span>
      <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>
        {frame.activeEvent === null
          ? 'Laser poised at 12:00'
          : `Hit #${frame.activeEvent.order}: (${frame.activeEvent.target.x}, ${frame.activeEvent.target.y})`}
      </span>
      <span className="badge">Result: {answerLabel}</span>
    </div>
  );
}

/** Interactive Monitoring Station radar-visibility and laser-sweep visualizer. */
export function MonitoringStationVisualizer<TAnswer, TTrace extends StationTraceFrame>({
  rawInput,
  solver,
}: MonitoringStationVisualizerProps<TAnswer, TTrace>) {
  const state = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 140);

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
      <FrameStatusBadges frame={frame} answerLabel={state.answerLabel} policyLabel={solver.policy.label} />
      <AsteroidFieldSvg map={state.map} frame={frame} />
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
