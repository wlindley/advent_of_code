import { useMemo, type ReactNode } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  ChronospatialProgram,
  DEFAULT_MAX_TRACE_STEPS,
  formatOutput,
  type ThreeBitValue,
  type VmTraceFrame,
} from '../index';
import { DisassemblyTape } from './DisassemblyTape';
import { RegisterPanel } from './RegisterPanel';

export interface ChronospatialDebuggerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<ChronospatialProgram, unknown, VmTraceFrame>;
  readonly partLabel: string;
  readonly targetOutput?: readonly ThreeBitValue[];
  readonly extraPanel?: ReactNode;
  readonly maxTraceSteps?: number;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly VmTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  solver: PuzzleSolver<ChronospatialProgram, unknown, VmTraceFrame>,
  maxSteps: number,
): TraceState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace?.(program, { maxSteps }) ?? [];
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatActionBadge(frame: VmTraceFrame): string {
  const { lastAction } = frame;
  if (lastAction === null) return 'init';
  const jumpNote = lastAction.jumped ? ' (jump)' : '';
  return `${lastAction.mnemonic} ${lastAction.operandLabel} -> ip=${lastAction.nextIp}${jumpNote}`;
}

function DebuggerHud({ frame, partLabel }: { readonly frame: VmTraceFrame; readonly partLabel: string }) {
  const statusColor = frame.halted ? 'var(--ok)' : 'var(--accent)';
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">{partLabel}</span>
      <span className="badge" style={{ borderColor: statusColor, color: statusColor }}>
        {frame.halted ? 'HALTED' : 'RUNNING'}
      </span>
      <span className="badge">Step: <code>{frame.step}/{frame.totalSteps}</code></span>
      <span className="badge">IP: <code>{frame.ip}</code></span>
      <span className="badge">Last: <code>{formatActionBadge(frame)}</code></span>
      <span
        className={frame.halted ? 'badge status-solved' : 'badge'}
        style={frame.halted ? { borderColor: 'var(--gold)' } : undefined}
      >
        Out: <strong className={frame.halted ? 'gold' : undefined}><code>{formatOutput(frame.output) || '∅'}</code></strong>
      </span>
    </div>
  );
}

/** Interactive Chronospatial 3-bit VM trace debugger reusable across Day 17 Part 1 and Part 2. */
export function ChronospatialDebugger({
  rawInput,
  solver,
  partLabel,
  targetOutput,
  extraPanel,
  maxTraceSteps = DEFAULT_MAX_TRACE_STEPS,
}: ChronospatialDebuggerProps) {
  const state = useMemo(() => buildTraceState(rawInput, solver, maxTraceSteps), [rawInput, solver, maxTraceSteps]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${partLabel}`, 160);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <DebuggerHud frame={frame} partLabel={partLabel} />
      <RegisterPanel registers={frame.registers} prevRegisters={frame.prevRegisters} />
      <DisassemblyTape
        instructions={frame.program.instructions}
        disassembly={frame.disassembly}
        ip={frame.ip}
        halted={frame.halted}
        output={frame.output}
        targetOutput={targetOutput}
      />
      {extraPanel}
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
