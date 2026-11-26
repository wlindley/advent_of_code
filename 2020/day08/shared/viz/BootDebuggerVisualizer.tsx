import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  BootCodeSolver,
  BootTraceFrame,
  computeDebuggerWindow,
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_WINDOW_ROWS,
} from '../index';
import { DEBUGGER_ROW_HEIGHT, JumpArcSvg } from './JumpArcSvg';

export interface BootDebuggerVisualizerProps {
  readonly rawInput: string;
  readonly solver: BootCodeSolver;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly BootTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildDebuggerTrace(rawInput: string, solver: BootCodeSolver): TraceState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({ solver, frame }: { readonly solver: BootCodeSolver; readonly frame: BootTraceFrame }) {
  const statusClass = frame.phase === 'terminated' ? 'status-solved' : frame.phase === 'loop-detected' ? 'status-in_progress' : '';
  return (
    <div className="meta-row">
      <span className="badge">{solver.policy.label}</span>
      <span className="badge">{`Executed: ${frame.executedSteps} / ${frame.totalSteps}`}</span>
      <span className="badge">{`PC: ${frame.activePc}`}</span>
      <span className={`badge ${statusClass}`}>{`${solver.policy.metricLabel}: ${frame.accumulator.toString()}`}</span>
      {frame.patchedIndex !== null && (
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          {`Patch #${frame.patchedIndex}: ${frame.originalPatchedInstruction?.formatted} → ${frame.patchedInstruction?.formatted}`}
        </span>
      )}
    </div>
  );
}

function InstructionRow({ pc, frame }: { readonly pc: number; readonly frame: BootTraceFrame }) {
  const instr = frame.program.at(pc);
  const visitOrder = frame.visitOrderAt(pc);
  const isActive = frame.activePc === pc;
  const isLoop = frame.phase === 'loop-detected' && isActive;
  const isPatched = frame.patchedIndex === pc;
  const bg = isLoop
    ? 'color-mix(in srgb, var(--warn) 14%, var(--surface))'
    : isActive
      ? 'color-mix(in srgb, var(--accent) 12%, var(--surface))'
      : 'transparent';
  const borderLeft = isPatched ? '3px solid var(--gold)' : isActive ? `3px solid ${isLoop ? 'var(--warn)' : 'var(--accent)'}` : '3px solid transparent';

  return (
    <div
      style={{
        height: `${DEBUGGER_ROW_HEIGHT}px`,
        display: 'grid',
        gridTemplateColumns: '48px 1fr auto',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0 0.6rem',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.84rem',
        fontVariantNumeric: 'tabular-nums',
        background: bg,
        borderLeft,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ color: 'var(--muted)' }}>{String(pc).padStart(4, '0')}</span>
      <span style={{ color: isPatched ? 'var(--gold)' : 'var(--text)', fontWeight: isActive || isPatched ? 700 : 500 }}>
        {instr.formatted}
      </span>
      <span style={{ fontSize: '0.75rem', color: isLoop ? 'var(--warn)' : visitOrder !== null ? 'var(--ok)' : 'var(--muted)' }}>
        {isLoop ? `LOOP (#${visitOrder})` : visitOrder !== null ? `#${visitOrder}` : '·'}
      </span>
    </div>
  );
}

/** Shared interactive boot-code debugger visualizer for Day 8 parts. */
export function BootDebuggerVisualizer({ rawInput, solver }: BootDebuggerVisualizerProps) {
  const state = useMemo(() => buildDebuggerTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 200);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  const win = computeDebuggerWindow(frame, DEFAULT_WINDOW_ROWS);
  const visiblePcs = Array.from({ length: win.visibleCount }, (_, idx) => win.startPc + idx);

  return (
    <div className="stack">
      <TelemetryBadges solver={solver} frame={frame} />
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', overflow: 'hidden' }}>
        {win.hasRowsAbove && <div style={{ padding: '0.2rem 0.6rem', fontSize: '0.76rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{`▲ ${win.startPc} earlier instructions`}</div>}
        <div style={{ display: 'flex', alignItems: 'flex-start', background: 'var(--bg)' }}>
          <JumpArcSvg jumpArc={win.jumpArc} visibleCount={win.visibleCount} />
          <div style={{ flex: 1, minWidth: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
            {visiblePcs.map((pc) => <InstructionRow key={pc} pc={pc} frame={frame} />)}
          </div>
        </div>
        {win.hasRowsBelow && <div style={{ padding: '0.2rem 0.6rem', fontSize: '0.76rem', color: 'var(--muted)' }}>{`▼ ${win.totalRows - win.endPc} later instructions`}</div>}
        {frame.phase === 'terminated' && <div style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ok)', borderTop: '1px solid var(--border)' }}>{`EXIT reached (pc = ${win.totalRows})`}</div>}
      </div>
      <PlaybackControls step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={playback.togglePlay} onStepChange={playback.setStep} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
