import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import { type ClawConfig, type ClawMachine, type ClawTraceFrame, DEFAULT_MAX_TRACE_STEPS } from '../index';
import { ClawVectorDiagram } from './ClawVectorDiagram';

export interface ClawContraptionVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<readonly ClawMachine[], bigint, ClawTraceFrame>;
  readonly config: ClawConfig;
}

type VizState =
  | { readonly ok: true; readonly total: bigint; readonly frames: readonly ClawTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<readonly ClawMachine[], bigint, ClawTraceFrame>,
): VizState {
  try {
    const machines = solver.parse(rawInput);
    const total = solver.solve(machines);
    const frames = solver.trace ? solver.trace(machines, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    return { ok: true, total, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function MachineHud({ frame, total }: { readonly frame: ClawTraceFrame; readonly total: bigint }) {
  const { buttonA, buttonB, determinant } = frame.machine;
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Machine <code>#{frame.machineIndex + 1}/{frame.totalMachines}</code>
      </span>
      <span className="badge">
        A<code>({buttonA.x.toString()},{buttonA.y.toString()})</code> · B
        <code>({buttonB.x.toString()},{buttonB.y.toString()})</code> · det=<code>{determinant.toString()}</code>
      </span>
      {frame.outcome.winnable ? (
        <span className="badge status-solved">
          Win: A×<code>{frame.outcome.solution.pressesA.toString()}</code> + B×
          <code>{frame.outcome.solution.pressesB.toString()}</code> = <code>{frame.tokens.toString()}</code> tokens
        </span>
      ) : (
        <span className="badge status-blocked">Unwinnable: <code>{frame.outcome.reason}</code></span>
      )}
      <span className="badge status-solved">
        Wins: <code>{frame.cumulativeWins}</code> · Running:{' '}
        <strong className="gold"><code>{frame.cumulativeTokens.toString()}</code></strong> / Total: <code>{total.toString()}</code>
      </span>
    </div>
  );
}

function MachineChipStrip({
  frames,
  activeStep,
  onSelect,
}: {
  readonly frames: readonly ClawTraceFrame[];
  readonly activeStep: number;
  readonly onSelect: (step: number) => void;
}) {
  return (
    <div className="meta-row" role="group" aria-label="Sampled claw machines">
      {frames.map((f, idx) => {
        const active = idx === activeStep;
        return (
          <button
            key={f.machineIndex}
            type="button"
            onClick={() => onSelect(idx)}
            className={active ? 'primary' : undefined}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.76rem',
              borderColor: active ? 'var(--accent)' : f.outcome.winnable ? 'var(--ok)' : 'var(--border)',
            }}
          >
            #{f.machineIndex + 1} {f.outcome.winnable ? '✓' : '×'}
          </button>
        );
      })}
    </div>
  );
}

function pauseAndSetStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

/** Shared interactive Claw Contraption visualizer for Part 1 and Part 2 configurations. */
export function ClawContraptionVisualizer({ rawInput, solver, config }: ClawContraptionVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const resetKey = `${rawInput}::${config.prizeOffset}::${config.maxPresses ?? 'unbounded'}`;
  const playback = usePlayback(totalSteps, resetKey, 260);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const activeFrame = state.frames[playback.step];
  if (!activeFrame) return <p className="muted">No claw machines to display.</p>;

  return (
    <div>
      <MachineHud frame={activeFrame} total={state.total} />
      <MachineChipStrip frames={state.frames} activeStep={playback.step} onSelect={(next) => pauseAndSetStep(playback, next)} />
      <div style={{ margin: '0.6rem 0' }}>
        <ClawVectorDiagram frame={activeFrame} config={config} />
      </div>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--accent)' }}>Blue</strong>: Button A vector / ray</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Gold</strong>: Button B vector / ray</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--ok)' }}>Green dot</strong>: Won prize</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--err)' }}>Red dot</strong>: Unreachable prize</span>
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => pauseAndSetStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
