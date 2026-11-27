import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_FRAMES,
  StoichiometrySolver,
  computeDagLayout,
  type DagLayout,
  type StoichiometryTraceFrame,
} from '../index';
import { DemandWaterfallSvg } from './DemandWaterfallSvg';
import { FuelSearchGaugeSvg } from './FuelSearchGaugeSvg';

interface StoichiometryVisualizerProps<TTrace extends StoichiometryTraceFrame> {
  readonly rawInput: string;
  readonly solver: StoichiometrySolver<TTrace>;
}

type VizState<TTrace extends StoichiometryTraceFrame> =
  | {
      readonly ok: true;
      readonly layout: DagLayout;
      readonly frames: readonly TTrace[];
      readonly finalAnswer: string;
    }
  | { readonly ok: false; readonly message: string };

function buildVizState<TTrace extends StoichiometryTraceFrame>(
  rawInput: string,
  solver: StoichiometrySolver<TTrace>,
): VizState<TTrace> {
  try {
    const network = solver.parse(rawInput);
    const layout = computeDagLayout(network);
    const frames = solver.trace(network, { maxSteps: DEFAULT_MAX_TRACE_FRAMES });
    const finalAnswer = solver.policy.formatFrameAnswer(frames[frames.length - 1]!);
    return { ok: true, layout, frames, finalAnswer };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function StoichiometryHud<TTrace extends StoichiometryTraceFrame>({
  label,
  frame,
  finalAnswer,
}: {
  readonly label: string;
  readonly frame: TTrace;
  readonly finalAnswer: string;
}) {
  const status =
    frame.kind === 'demand'
      ? `Active: ${frame.activeChemical ?? 'FUEL'}`
      : `Phase: ${frame.searchStep.phase}`;
  const current =
    frame.kind === 'demand'
      ? `ORE: ${frame.cumulativeOre}`
      : `Best FUEL: ${frame.bestFuel}`;

  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{label}</span>
      <span className="badge">Step {frame.stepIndex} / {frame.totalSteps}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>{status}</span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>{current}</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Answer: {finalAnswer}</span>
    </div>
  );
}

/** Interactive stoichiometry visualizer for AoC 2019 Day 14 Parts 1 and 2. */
export function StoichiometryVisualizer<TTrace extends StoichiometryTraceFrame>({
  rawInput,
  solver,
}: StoichiometryVisualizerProps<TTrace>) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 220);

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
      <StoichiometryHud label={solver.policy.label} frame={frame} finalAnswer={state.finalAnswer} />
      {frame.kind === 'demand' ? (
        <DemandWaterfallSvg layout={state.layout} frame={frame} />
      ) : (
        <FuelSearchGaugeSvg frame={frame} />
      )}
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
