import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  CRT_HEIGHT,
  CRT_WIDTH,
  CpuProgram,
  CpuTimeline,
  CrtTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  buildCrtTrace,
  formatInstruction,
  instructionCycles,
} from '../index';
import { OscilloscopeChart } from './OscilloscopeChart';

export interface CrtTimelineVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<CpuProgram, number | string, CrtTraceFrame>;
  readonly probeCycles?: readonly number[];
  readonly showProbes?: boolean;
  readonly showCrtMatrix?: boolean;
}

type VizState =
  | { readonly ok: true; readonly program: CpuProgram; readonly timeline: CpuTimeline; readonly frames: readonly CrtTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const panelStyle = { border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.65rem', background: 'var(--surface)' } as const;

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<CpuProgram, number | string, CrtTraceFrame>,
  probeCycles: readonly number[],
): VizState {
  try {
    const program = solver.parse(rawInput);
    const timeline = CpuTimeline.execute(program);
    const frames = solver.trace
      ? solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS })
      : buildCrtTrace(timeline, probeCycles, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, program, timeline, frames };
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

function TelemetryBadges({ program, frame, frameCount, showProbes }: {
  readonly program: CpuProgram;
  readonly frame: CrtTraceFrame;
  readonly frameCount: number;
  readonly showProbes: boolean;
}) {
  const s = frame.snapshot;
  const instr = program.instructions[s.instructionIndex]!;
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Cycle: <code>{frame.cycle} / {frame.totalCycles}</code>
      </span>
      <span className="badge">
        Instr #{s.instructionIndex + 1}/{program.instructionCount}: <code>{formatInstruction(instr)} ({s.subCycle}/{instructionCycles(instr)})</code>
      </span>
      <span className="badge">
        X: <code>{s.xChanged ? `${s.xDuring} → ${s.xAfter}` : s.xDuring}</code>
      </span>
      <span className={`badge ${s.spriteLit ? 'status-solved' : ''}`}>
        CRT ({s.crtRow}, {s.crtCol}) · <strong>{s.spriteLit ? 'LIT' : 'DARK'}</strong>
      </span>
      {showProbes && (
        <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
          Signal sum: <strong>{frame.cumulativeSignalStrength}</strong>
        </span>
      )}
      {frameCount < frame.totalCycles && <span className="muted">Sampled {frameCount} of {frame.totalCycles} cycles</span>}
    </div>
  );
}

function RasterSpriteStrip({ frame }: { readonly frame: CrtTraceFrame }) {
  const s = frame.snapshot;
  const stripStyle = { display: 'grid', gridTemplateColumns: `repeat(${CRT_WIDTH}, minmax(0, 1fr))`, gap: '2px', marginTop: '0.25rem' } as const;
  return (
    <div style={{ marginTop: '0.6rem' }}>
      <div className="eyebrow">40-Column Raster Beam &amp; 3-Pixel Sprite (X = {s.xDuring})</div>
      <div style={stripStyle}>
        {Array.from({ length: CRT_WIDTH }, (_, col) => {
          const inSprite = Math.abs(col - s.xDuring) <= 1;
          const isBeam = col === s.crtCol;
          const background = isBeam ? (s.spriteLit ? 'var(--ok)' : 'var(--accent)') : inSprite ? 'var(--gold)' : 'var(--surface)';
          const color = isBeam || inSprite ? 'var(--surface)' : 'var(--muted)';
          const cellStyle = { textAlign: 'center' as const, fontSize: '0.62rem', lineHeight: '1.35rem', borderRadius: '3px', border: `1px solid ${isBeam ? 'var(--text)' : 'var(--border)'}`, background, color, fontWeight: isBeam ? 700 : 500 };
          return <div key={col} title={`col ${col}`} style={cellStyle}>{isBeam ? (s.spriteLit ? '#' : '.') : inSprite ? 'S' : ''}</div>;
        })}
      </div>
    </div>
  );
}

function PipelinePanel({ program, frame }: { readonly program: CpuProgram; readonly frame: CrtTraceFrame }) {
  const idx = frame.snapshot.instructionIndex;
  const start = Math.max(0, Math.min(idx - 2, program.instructionCount - 5));
  return (
    <div style={panelStyle}>
      <div className="eyebrow">Instruction Pipeline</div>
      {program.instructions.slice(start, start + 5).map((instr, offset) => {
        const absIdx = start + offset;
        const active = absIdx === idx;
        return (
          <div key={absIdx} style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 400, color: active ? 'var(--accent)' : 'var(--text)' }}>
            <code>#{String(absIdx + 1).padStart(3, '0')}</code> {formatInstruction(instr)} {active ? `← sub ${frame.snapshot.subCycle}/${instructionCycles(instr)}` : ''}
          </div>
        );
      })}
    </div>
  );
}

function ProbeLedgerPanel({ frame, probeCycles }: { readonly frame: CrtTraceFrame; readonly probeCycles: readonly number[] }) {
  const completedMap = new Map(frame.completedProbes.map((p) => [p.cycle, p.signalStrength]));
  return (
    <div style={panelStyle}>
      <div className="eyebrow">Probe Ledger</div>
      {probeCycles.filter((c) => c <= frame.totalCycles).map((cycle) => {
        const strength = completedMap.get(cycle);
        const reached = strength !== undefined;
        return (
          <div key={cycle} style={{ fontSize: '0.82rem', color: reached ? 'var(--text)' : 'var(--muted)', fontWeight: cycle === frame.cycle ? 700 : 400 }}>
            Cycle <code>{cycle}</code>: {reached ? <strong style={{ color: 'var(--gold)' }}>{strength}</strong> : 'pending'}
          </div>
        );
      })}
    </div>
  );
}

function CrtPhosphorMatrix({ timeline, activeCycle }: { readonly timeline: CpuTimeline; readonly activeCycle: number }) {
  return (
    <div style={{ ...panelStyle, marginTop: '0.65rem', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.15 }}>
      <div className="eyebrow">40×6 CRT Phosphor Matrix</div>
      {Array.from({ length: CRT_HEIGHT }, (_, row) => (
        <div key={row}>
          {Array.from({ length: CRT_WIDTH }, (__, col) => {
            const cycle = row * CRT_WIDTH + col + 1;
            const drawn = cycle <= activeCycle && cycle <= timeline.totalCycles;
            const lit = drawn && timeline.snapshotAt(cycle).spriteLit;
            const isHead = cycle === activeCycle;
            return <span key={col} style={{ color: isHead ? 'var(--accent)' : lit ? 'var(--ok)' : 'var(--muted)', fontWeight: lit || isHead ? 700 : 400 }}>{drawn ? (lit ? '#' : '.') : ' '}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

/** Shared interactive visualizer for 2022 Day 10 Cathode-Ray Tube (Part 1 & Part 2). */
export function CrtTimelineVisualizer({ rawInput, solver, probeCycles = [], showProbes = false, showCrtMatrix = false }: CrtTimelineVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver, probeCycles), [rawInput, solver, probeCycles]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 90);
  const frame = frames[playback.step];
  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryBadges program={state.program} frame={frame} frameCount={frames.length} showProbes={showProbes} />
      <OscilloscopeChart frames={frames} activeIndex={playback.step} minX={state.timeline.minX} maxX={state.timeline.maxX} probeCycles={probeCycles} showProbes={showProbes} />
      <RasterSpriteStrip frame={frame} />
      <div style={{ display: 'grid', gridTemplateColumns: showProbes ? '1fr 1fr' : '1fr', gap: '0.75rem', marginTop: '0.65rem' }}>
        <PipelinePanel program={state.program} frame={frame} />
        {showProbes && <ProbeLedgerPanel frame={frame} probeCycles={probeCycles} />}
      </div>
      {showCrtMatrix && <CrtPhosphorMatrix timeline={state.timeline} activeCycle={frame.cycle} />}
      <PlaybackControls step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)} onStepChange={(next) => handleStepChange(playback, next)} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
