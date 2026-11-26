import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_TRACE_MAX_STEPS,
  type EncodeStepFrame,
  type FuelTraceFrame,
  type SnafuLedger,
  SnafuNumber,
} from '../index';
import { SnafuEncodeCascade } from './SnafuEncodeCascade';
import { SnafuPlaceBreakdown } from './SnafuPlaceBreakdown';

export interface SnafuVisualizerProps {
  readonly rawInput: string;
  readonly solver: Required<PuzzleSolver<SnafuLedger, string, FuelTraceFrame>>;
  readonly partLabel: string;
}

type VizState =
  | {
      readonly ok: true;
      readonly ledger: SnafuLedger;
      readonly frames: readonly FuelTraceFrame[];
      readonly encodeFrames: readonly EncodeStepFrame[];
      readonly totalNumber: SnafuNumber;
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: Required<PuzzleSolver<SnafuLedger, string, FuelTraceFrame>>,
): VizState {
  try {
    const ledger = solver.parse(rawInput);
    const frames = solver.trace(ledger, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    const encodeFrames = frames.filter((f): f is EncodeStepFrame => f.kind === 'encode');
    return { ok: true, ledger, frames, encodeFrames, totalNumber: new SnafuNumber(ledger.totalSnafu) };
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

/** Shared interactive visualizer for Day 25 SNAFU ledger summing and balanced base-5 encoding. */
export function SnafuVisualizer({ rawInput, solver, partLabel }: SnafuVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>
      </div>
    );
  }

  const isComplete = playback.step === frames.length - 1;
  const visibleEncode =
    frame.kind === 'encode' ? state.encodeFrames.filter((f) => f.placeIndex <= frame.placeIndex) : [];

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">{partLabel}</span>
        <span className="badge">
          Entries <code>{state.ledger.count}</code> (max width <code>{state.ledger.maxLength}</code>)
        </span>
        <span className="badge">
          Phase <code>{frame.kind === 'accumulate' ? 'Accumulate' : 'Encode'}</code>
        </span>
        <span className={isComplete ? 'badge status-solved' : 'badge'}>
          <strong className="gold">
            {frame.kind === 'accumulate'
              ? `Running: ${frame.runningDecimal.toString()} (${frame.runningSnafu})`
              : isComplete
                ? `Fuel SNAFU: ${state.ledger.totalSnafu}`
                : `Building: ${frame.partialSnafu}`}
          </strong>
        </span>
      </div>
      {frame.kind === 'accumulate' ? (
        <SnafuPlaceBreakdown
          title={`Entry #${frame.entryIndex + 1} / ${state.ledger.count} (${frame.previousDecimal.toString()} + ${frame.entry.decimal.toString()} = ${frame.runningDecimal.toString()})`}
          number={frame.entry}
        />
      ) : (
        <>
          <SnafuEncodeCascade frames={visibleEncode} activePlaceIndex={frame.placeIndex} />
          {isComplete ? <SnafuPlaceBreakdown title="Final Canonical SNAFU" number={state.totalNumber} /> : null}
        </>
      )}
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
