import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type CombatSolver,
  type CombatTraceFrame,
} from '../index';
import { CombatArenaSvg } from './CombatArenaSvg';

export interface CombatArenaVisualizerProps {
  readonly rawInput: string;
  readonly solver: CombatSolver;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly CombatTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(rawInput: string, solver: CombatSolver): TraceResult {
  try {
    const decks = solver.parse(rawInput);
    const frames = solver.trace(decks, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function CombatTelemetry({ label, frame }: { readonly label: string; readonly frame: CombatTraceFrame }) {
  const statusClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  return (
    <div className="meta-row">
      <span className="badge">{label}</span>
      <span className={`badge ${statusClass}`}>
        {`Round ${frame.round} / ${frame.totalRounds}${frame.isFinal ? ' · Final' : ''}`}
      </span>
      <span className="badge">{`P1: ${frame.p1Count} cards (${frame.p1Score})`}</span>
      <span className="badge">{`P2: ${frame.p2Count} cards (${frame.p2Score})`}</span>
      {frame.subGamesStarted > 0 && <span className="badge">{`Sub-games: ${frame.subGamesStarted}`}</span>}
      {frame.gameWinner !== null && (
        <span className="badge status-solved">{`Winner: Player ${frame.gameWinner} · ${frame.winningScore}`}</span>
      )}
    </div>
  );
}

/** Shared interactive playback visualizer for AoC 2020 Day 22 Parts 1 and 2. */
export function CombatArenaVisualizer({ rawInput, solver }: CombatArenaVisualizerProps) {
  const state = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 160);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <CombatTelemetry label={solver.policy.label} frame={frame} />
      <CombatArenaSvg frame={frame} />
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
