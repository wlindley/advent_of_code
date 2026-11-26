import { useMemo } from 'react';
import { sampleTraceIndices } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import type { MemoryInstruction } from '../../shared';
import {
  computeInstructionStates,
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  type ConditionalMulTraceFrame,
} from '../domain';
import { ConditionalTapeSvg } from './ConditionalTapeSvg';

const MAX_OVERVIEW_SLOTS = 72;
const MAX_WINDOW_ROWS = 5;

function rowOutcome(inst: MemoryInstruction, enabled: boolean): { readonly text: string; readonly outcome: string } {
  if (inst.kind !== 'mul') {
    return inst.kind === 'do' ? { text: 'do()', outcome: 'ENABLE' } : { text: "don't()", outcome: 'DISABLE' };
  }
  return { text: `mul(${inst.x},${inst.y})`, outcome: enabled ? `+${inst.product}` : 'SKIP' };
}

function InstructionRow({ inst, enabled, idx, y, activeIdx }: {
  readonly inst: MemoryInstruction; readonly enabled: boolean; readonly idx: number; readonly y: number; readonly activeIdx: number;
}) {
  const isActive = idx === activeIdx;
  const baseColor = inst.kind === 'mul' ? (enabled ? 'var(--ok)' : 'var(--muted)') : 'var(--accent)';
  const stroke = isActive ? 'var(--gold)' : idx < activeIdx ? baseColor : 'var(--border)';
  const { text, outcome } = rowOutcome(inst, enabled);
  return (
    <g>
      <rect x={16} y={y - 11} width={288} height={20} rx={5} fill="var(--surface)" stroke={stroke} strokeWidth={isActive ? 2 : 1} />
      <text x={24} y={y + 3} fontSize={10} fontWeight={700} fill={isActive ? 'var(--accent)' : 'var(--muted)'}>#{idx + 1}</text>
      <text x={60} y={y + 3} fontSize={10} fontFamily="ui-monospace, monospace" fill={enabled || inst.kind !== 'mul' ? 'var(--text)' : 'var(--muted)'}>{text}</text>
      <text x={296} y={y + 3} textAnchor="end" fontSize={10} fontWeight={700} fill={idx <= activeIdx ? baseColor : 'var(--muted)'}>{outcome}</text>
    </g>
  );
}

function OverviewRibbon({ instructions, states, processedCount }: {
  readonly instructions: readonly MemoryInstruction[]; readonly states: readonly boolean[]; readonly processedCount: number;
}) {
  const indices = sampleTraceIndices(instructions.length, MAX_OVERVIEW_SLOTS);
  const colW = indices.length > 0 ? 288 / indices.length : 288;
  const activeIdx = processedCount - 1;
  return (
    <g>
      <rect x={16} y={158} width={288} height={34} rx={4} fill="var(--bg)" stroke="var(--border)" />
      {indices.map((idx, slot) => {
        const fill = idx === activeIdx ? 'var(--gold)' : states[idx] ? 'var(--ok)' : 'var(--muted)';
        return <rect key={idx} x={18 + slot * colW} y={163} width={Math.max(2, colW - 1)} height={24} rx={1} fill={fill} opacity={idx < processedCount ? 0.92 : 0.32} />;
      })}
    </g>
  );
}

function ExecutionTimelineSvg({ instructions, states, processedCount }: {
  readonly instructions: readonly MemoryInstruction[]; readonly states: readonly boolean[]; readonly processedCount: number;
}) {
  const activeIdx = processedCount - 1;
  const start = Math.max(0, Math.min(instructions.length - MAX_WINDOW_ROWS, Math.max(0, activeIdx) - 2));
  const rows = instructions.slice(start, Math.min(instructions.length, start + MAX_WINDOW_ROWS));
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Conditional execution timeline" style={{ maxWidth: '100%', display: 'block' }}>
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Gate &amp; Instruction Timeline ({instructions.length})</text>
      {rows.length > 0 ? (
        rows.map((inst, offset) => (
          <InstructionRow key={start + offset} inst={inst} enabled={states[start + offset]!} idx={start + offset} y={38 + offset * 24} activeIdx={activeIdx} />
        ))
      ) : (
        <text x={160} y={96} textAnchor="middle" fontSize={11} fill="var(--muted)">No mul/do/don't tokens found</text>
      )}
      <OverviewRibbon instructions={instructions} states={states} processedCount={processedCount} />
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">72-slot gate ribbon (green = enabled, gray = disabled, gold = active)</text>
    </svg>
  );
}

export function ConditionalMulVisualizer({ rawInput }: VisualizerProps) {
  const { memory, states, frames } = useMemo(() => {
    const parsed = solver.parse(rawInput);
    return { memory: parsed, states: computeInstructionStates(parsed), frames: solver.trace!(parsed, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  }, [rawInput]);
  const playback = usePlayback(frames.length, rawInput, 260);
  const frame: ConditionalMulTraceFrame = frames[playback.step]!;
  const isDone = frame.processedCount === frame.totalInstructions;
  return (
    <div>
      <div className="meta-row">
        <span className={`badge ${frame.enabled ? 'status-solved' : ''}`}>{frame.enabled ? 'ENABLED' : 'DISABLED'}</span>
        <span className="badge">Step: {frame.processedCount} / {frame.totalInstructions}</span>
        <span className="badge">Executed: {frame.executedMulCount} · Skipped: {frame.skippedMulCount}</span>
        <span className={`badge ${isDone ? 'status-solved' : ''}`}>Running Sum: {frame.runningSum}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', margin: '0.5rem 0' }}>
        <ConditionalTapeSvg raw={memory.raw} instructions={memory.instructions} states={states} active={frame.activeInstruction} enabled={frame.enabled} totalInstructions={frame.totalInstructions} />
        <ExecutionTimelineSvg instructions={memory.instructions} states={states} processedCount={frame.processedCount} />
      </div>
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => { if (!playback.isPlaying && playback.step >= frames.length - 1) playback.setStep(0); playback.togglePlay(); }}
        onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
