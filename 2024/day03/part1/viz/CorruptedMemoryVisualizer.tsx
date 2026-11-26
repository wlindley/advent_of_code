import { useMemo } from 'react';
import { sampleTraceIndices } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import { type MemoryInstruction, type MulInstruction } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type MulScanTraceFrame } from '../domain';

const TAPE_WINDOW = 36;
const TAPE_COLS = 18;
const MAX_OVERVIEW_BARS = 72;
const MAX_WINDOW_ROWS = 5;

function computeTapeStart(rawLength: number, activeMul: MulInstruction | null): number {
  if (rawLength <= TAPE_WINDOW || !activeMul) return 0;
  const center = Math.floor((activeMul.start + activeMul.end) / 2);
  return Math.max(0, Math.min(rawLength - TAPE_WINDOW, center - Math.floor(TAPE_WINDOW / 2)));
}

function tapeCellColor(idx: number, visible: readonly MemoryInstruction[], activeMul: MulInstruction | null): string {
  if (activeMul && idx >= activeMul.start && idx < activeMul.end) return 'var(--gold)';
  for (const inst of visible) {
    if (idx >= inst.start && idx < inst.end) return inst.kind === 'mul' ? 'var(--ok)' : 'var(--accent)';
  }
  return 'var(--border)';
}

function TapeCellGrid({ raw, winStart, instructions, activeMul }: {
  readonly raw: string; readonly winStart: number; readonly instructions: readonly MemoryInstruction[]; readonly activeMul: MulInstruction | null;
}) {
  const winEnd = Math.min(raw.length, winStart + TAPE_WINDOW);
  const visible = instructions.filter((inst) => inst.end > winStart && inst.start < winEnd);
  return (
    <g>
      {Array.from({ length: winEnd - winStart }, (_, offset) => {
        const idx = winStart + offset;
        const ch = raw[idx]!;
        const label = ch === '\n' ? '↵' : ch === '\r' ? '␍' : ch;
        const x = 16 + (offset % TAPE_COLS) * 16;
        const y = 34 + Math.floor(offset / TAPE_COLS) * 32;
        const color = tapeCellColor(idx, visible, activeMul);
        const isBorder = color === 'var(--border)';
        return (
          <g key={idx}>
            <rect x={x} y={y} width={15} height={24} rx={3} fill={isBorder ? 'var(--bg)' : 'var(--surface)'} stroke={color} strokeWidth={color === 'var(--gold)' ? 1.8 : 1} />
            <text x={x + 7.5} y={y + 16} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill={isBorder ? 'var(--muted)' : color}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}

function CorruptedTapeSvg({ raw, instructions, activeMul, totalMuls }: {
  readonly raw: string; readonly instructions: readonly MemoryInstruction[]; readonly activeMul: MulInstruction | null; readonly totalMuls: number;
}) {
  const winStart = computeTapeStart(raw.length, activeMul);
  const winEnd = Math.min(raw.length, winStart + TAPE_WINDOW);
  const inspectorText = activeMul
    ? `Active: mul(${activeMul.x}, ${activeMul.y}) = ${activeMul.product} @ [${activeMul.start}..${activeMul.end})`
    : totalMuls === 0 ? 'No valid mul(X,Y) tokens found' : 'Ready — step forward to scan tokens';
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Corrupted memory tape window" style={{ maxWidth: '100%', display: 'block' }}>
      <rect x={12} y={24} width={296} height={168} rx={6} fill="var(--bg)" stroke="var(--border)" />
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Memory Tape Window</text>
      <text x={304} y={15} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--accent)">[{winStart}..{winEnd}) / {raw.length}</text>
      {raw.length > 0 ? <TapeCellGrid raw={raw} winStart={winStart} instructions={instructions} activeMul={activeMul} /> : <text x={160} y={76} textAnchor="middle" fontSize={11} fill="var(--muted)">Empty input stream</text>}
      <rect x={20} y={118} width={280} height={58} rx={5} fill="var(--surface)" stroke={activeMul ? 'var(--gold)' : 'var(--border)'} />
      <text x={160} y={151} textAnchor="middle" fontSize={11} fontWeight={700} fill={activeMul ? 'var(--text)' : 'var(--muted)'}>{inspectorText}</text>
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">gold = active mul · green = valid mul · blue = do/don't · ↵ = newline</text>
    </svg>
  );
}

function TimelineRow({ mul, idx, y, activeIdx }: { readonly mul: MulInstruction; readonly idx: number; readonly y: number; readonly activeIdx: number }) {
  const isActive = idx === activeIdx;
  const color = isActive ? 'var(--gold)' : idx <= activeIdx ? 'var(--ok)' : 'var(--border)';
  return (
    <g>
      <rect x={16} y={y - 11} width={288} height={20} rx={5} fill="var(--surface)" stroke={color} strokeWidth={isActive ? 2 : 1} />
      <text x={24} y={y + 3} fontSize={10} fontWeight={700} fill={isActive ? 'var(--accent)' : 'var(--muted)'}>#{idx + 1}</text>
      <text x={60} y={y + 3} fontSize={10} fontFamily="ui-monospace, monospace" fill="var(--text)">mul({mul.x},{mul.y})</text>
      <text x={296} y={y + 3} textAnchor="end" fontSize={10} fontWeight={700} fill={color === 'var(--border)' ? 'var(--muted)' : color}>+{mul.product}</text>
    </g>
  );
}

function OverviewStrip({ muls, processedCount }: { readonly muls: readonly MulInstruction[]; readonly processedCount: number }) {
  const indices = sampleTraceIndices(muls.length, MAX_OVERVIEW_BARS);
  const maxProduct = muls.reduce((best, mul) => Math.max(best, mul.product), 1);
  const colW = indices.length > 0 ? 288 / indices.length : 288;
  const activeIdx = processedCount - 1;
  return (
    <g>
      <rect x={16} y={158} width={288} height={34} rx={4} fill="var(--bg)" stroke="var(--border)" />
      {indices.map((idx, slot) => {
        const mul = muls[idx]!;
        const done = idx < processedCount;
        const fill = idx === activeIdx ? 'var(--gold)' : done ? 'var(--ok)' : 'var(--border)';
        const h = Math.max(4, Math.round((mul.product / maxProduct) * 26));
        return <rect key={idx} x={18 + slot * colW} y={189 - h} width={Math.max(2, colW - 1)} height={h} rx={1} fill={fill} opacity={done ? 0.92 : 0.45} />;
      })}
    </g>
  );
}

function ContributionTimelineSvg({ muls, processedCount }: { readonly muls: readonly MulInstruction[]; readonly processedCount: number }) {
  const activeIdx = processedCount - 1;
  const start = Math.max(0, Math.min(muls.length - MAX_WINDOW_ROWS, Math.max(0, activeIdx) - 2));
  const rows = muls.slice(start, Math.min(muls.length, start + MAX_WINDOW_ROWS));
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Multiplication contribution timeline" style={{ maxWidth: '100%', display: 'block' }}>
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Contribution Timeline ({muls.length} muls)</text>
      {rows.length > 0 ? (
        rows.map((mul, offset) => <TimelineRow key={start + offset} mul={mul} idx={start + offset} y={38 + offset * 24} activeIdx={activeIdx} />)
      ) : (
        <text x={160} y={96} textAnchor="middle" fontSize={11} fill="var(--muted)">No valid mul(X,Y) tokens to sum</text>
      )}
      <OverviewStrip muls={muls} processedCount={processedCount} />
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">72-bar product overview (gold = active, green = summed)</text>
    </svg>
  );
}

export function CorruptedMemoryVisualizer({ rawInput }: VisualizerProps) {
  const { memory, frames } = useMemo(() => {
    const parsed = solver.parse(rawInput);
    return { memory: parsed, frames: solver.trace!(parsed, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  }, [rawInput]);
  const playback = usePlayback(frames.length, rawInput, 260);
  const frame: MulScanTraceFrame = frames[playback.step]!;
  const muls = memory.mulInstructions;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Matched: {frame.processedCount} / {frame.totalMuls}</span>
        <span className="badge">{frame.activeMul ? `mul(${frame.activeMul.x},${frame.activeMul.y}) = ${frame.activeMul.product}` : 'Start (0 summed)'}</span>
        <span className={`badge ${frame.processedCount === frame.totalMuls ? 'status-solved' : ''}`}>Running Sum: {frame.runningSum}</span>
        {muls.length >= DEFAULT_MAX_TRACE_STEPS && <span className="muted">Sampled {frames.length} frames of {muls.length} muls</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', margin: '0.5rem 0' }}>
        <CorruptedTapeSvg raw={memory.raw} instructions={memory.instructions} activeMul={frame.activeMul} totalMuls={frame.totalMuls} />
        <ContributionTimelineSvg muls={muls} processedCount={frame.processedCount} />
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
