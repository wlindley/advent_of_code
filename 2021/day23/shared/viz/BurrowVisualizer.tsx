import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  type AmphipodSolver,
  type BurrowPosition,
  type BurrowTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  SPECIES,
} from '../index';
import { AmphipodBurrowSvg } from './AmphipodBurrowSvg';

export interface BurrowVisualizerProps {
  readonly rawInput: string;
  readonly solver: AmphipodSolver;
}

type TraceModel =
  | { readonly ok: true; readonly frames: readonly BurrowTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceModel(rawInput: string, solver: AmphipodSolver): TraceModel {
  try {
    const diagram = solver.parse(rawInput);
    const frames = solver.trace(diagram, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatPosition(pos: BurrowPosition): string {
  return pos.kind === 'hallway' ? `H${pos.slot}` : `${SPECIES[pos.room]}${pos.depth + 1}`;
}

function formatMoveCaption(frame: BurrowTraceFrame): string {
  if (frame.lastMove === null) {
    return `Initial burrow configuration (${frame.totalAmphipods} amphipods, h >= ${frame.heuristicRemaining}).`;
  }
  const { species, from, to, energy, steps } = frame.lastMove;
  return `Moved ${species}: ${formatPosition(from)} -> ${formatPosition(to)} (${steps} steps, +${energy} energy).`;
}

function TelemetryBadges({ frame }: { readonly frame: BurrowTraceFrame }) {
  return (
    <div className="meta-row" aria-label="Amphipod burrow telemetry">
      <span className="badge">
        Move {frame.stepIndex} / {frame.totalMoves}
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Energy {frame.cumulativeEnergy.toLocaleString()}
      </span>
      <span className="badge">Step +{frame.moveEnergy.toLocaleString()}</span>
      <span
        className="badge"
        style={{
          borderColor: frame.isGoal ? 'var(--ok)' : 'var(--gold)',
          color: frame.isGoal ? 'var(--ok)' : 'var(--gold)',
        }}
      >
        Settled {frame.settledCount} / {frame.totalAmphipods}
      </span>
      <span className="badge">h ≥ {frame.heuristicRemaining.toLocaleString()}</span>
    </div>
  );
}

/** Interactive step-by-step Amphipod burrow visualizer shared by Part 1 and Part 2. */
export function BurrowVisualizer({ rawInput, solver }: BurrowVisualizerProps) {
  const model = useMemo(() => buildTraceModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 450);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize amphipod burrow: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
      <figure className="chart-card">
        <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
          <strong>Amphipod Burrow ({solver.policy.label})</strong>
          <span className="chart-sub muted">
            A* expanded {activeFrame.statesExpanded.toLocaleString()} states
          </span>
        </div>
        <AmphipodBurrowSvg state={activeFrame.state} lastMove={activeFrame.lastMove} />
        <figcaption className="chart-sub muted">{formatMoveCaption(activeFrame)}</figcaption>
      </figure>
    </div>
  );
}
