import { useMemo, useState, type ReactNode } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { CascadeTraceFrame, DEFAULT_MAX_TRACE_STEPS, solver } from '../domain';
import { computeBarRatio, computeVisibleWindow, formatCompactBigInt, type ScaleMode } from './waveLayout';

type TraceState =
  | { readonly ok: true; readonly frames: readonly CascadeTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const PLOT_LEFT = 16;
const PLOT_WIDTH = 608;
const BASE_Y = 174;
const MAX_BAR_H = 100;

function buildTrace(rawInput: string): TraceState {
  try {
    const cards = solver.parse(rawInput);
    return { ok: true, frames: solver.trace!(cards, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderHeader(
  frame: CascadeTraceFrame,
  sampledCount: number,
  scaleMode: ScaleMode,
  onScaleChange: (mode: ScaleMode) => void,
) {
  return (
    <div className="meta-row" style={{ justifyContent: 'space-between' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">Card #{frame.card.id} ({frame.cardIndex + 1} / {frame.totalCards})</span>
        <span className="badge">Copies: <strong>{formatCompactBigInt(frame.activeCopies)}</strong></span>
        <span className={`badge ${frame.clampedSpan > 0 ? 'status-solved' : ''}`}>
          {frame.matchCount} matches (+{formatCompactBigInt(frame.spawnedCopies)} spawned)
        </span>
        <span className="badge">Total: <strong className="gold">{formatCompactBigInt(frame.runningTotal)}</strong></span>
        {frame.totalCards > sampledCount && <span className="muted">Sampled {sampledCount} / {frame.totalCards}</span>}
      </div>
      <div className="playback-buttons" role="group" aria-label="Scale mode">
        <button type="button" className={scaleMode === 'log2' ? 'primary' : ''} onClick={() => onScaleChange('log2')}>Log2</button>
        <button type="button" className={scaleMode === 'linear' ? 'primary' : ''} onClick={() => onScaleChange('linear')}>Linear</button>
      </div>
    </div>
  );
}

function barColor(idx: number, frame: CascadeTraceFrame): string {
  if (idx === frame.cardIndex) return 'var(--accent)';
  if (idx > frame.cardIndex && idx <= frame.clampedEndIndex) return 'var(--ok)';
  if (idx < frame.cardIndex) return 'var(--muted)';
  return 'var(--border)';
}

function barHeight(copies: bigint, peak: bigint, scaleMode: ScaleMode): number {
  return Math.max(8, computeBarRatio(copies, peak, scaleMode) * MAX_BAR_H);
}

function renderArcs(frame: CascadeTraceFrame, start: number, end: number, slotW: number, scaleMode: ScaleMode): ReactNode[] {
  const arcs: ReactNode[] = [];
  const peak = frame.peakCopies;
  const srcX = PLOT_LEFT + (frame.cardIndex - start + 0.5) * slotW;
  const srcY = BASE_Y - barHeight(frame.activeCopies, peak, scaleMode);
  const lastTarget = Math.min(frame.clampedEndIndex, end - 1);
  for (let target = frame.cardIndex + 1; target <= lastTarget; target += 1) {
    const dstX = PLOT_LEFT + (target - start + 0.5) * slotW;
    const dstY = BASE_Y - barHeight(frame.cardCopies[target]!, peak, scaleMode);
    const arcY = Math.max(12, Math.min(srcY, dstY) - 14 - Math.min(36, (target - frame.cardIndex) * 5));
    arcs.push(
      <path key={`arc-${target}`} d={`M ${srcX} ${srcY} Q ${(srcX + dstX) / 2} ${arcY} ${dstX} ${dstY}`} fill="none" stroke="var(--ok)" strokeWidth={1.6} opacity={0.85}>
        <title>{`+${frame.activeCopies} copies to card ${target + 1}`}</title>
      </path>,
    );
  }
  return arcs;
}

function renderBars(frame: CascadeTraceFrame, start: number, end: number, slotW: number, scaleMode: ScaleMode): ReactNode[] {
  const nodes: ReactNode[] = [];
  const barW = Math.max(4, slotW * 0.72);
  const peak = frame.peakCopies;
  const labelEvery = Math.max(1, Math.ceil((end - start) / 12));
  for (let idx = start; idx < end; idx += 1) {
    const copies = frame.cardCopies[idx]!;
    const h = barHeight(copies, peak, scaleMode);
    const x = PLOT_LEFT + (idx - start) * slotW + (slotW - barW) / 2;
    const isPeak = copies === peak && peak > 1n;
    nodes.push(
      <g key={idx}>
        <rect x={x} y={BASE_Y - h} width={barW} height={h} rx={3} fill={barColor(idx, frame)} stroke={isPeak ? 'var(--gold)' : 'var(--text)'} strokeWidth={isPeak ? 2 : 0.6}>
          <title>{`Card ${idx + 1}: ${copies.toString()} copies`}</title>
        </rect>
        {(idx - start) % labelEvery === 0 && <text x={x + barW / 2} y={194} textAnchor="middle" fontSize={10} fill="var(--muted)">{idx + 1}</text>}
      </g>,
    );
  }
  return nodes;
}

function renderWaveSvg(frame: CascadeTraceFrame, scaleMode: ScaleMode) {
  const { start, end } = computeVisibleWindow(frame.cardIndex, frame.totalCards, 48);
  const slotW = PLOT_WIDTH / (end - start);
  return (
    <div style={{ padding: '0.5rem 0.65rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <svg viewBox="0 0 640 210" style={{ width: '100%', display: 'block' }} role="img" aria-label="Scratchcard cascade wave">
        <line x1={PLOT_LEFT} y1={BASE_Y} x2={PLOT_LEFT + PLOT_WIDTH} y2={BASE_Y} stroke="var(--border)" strokeWidth={1.5} />
        {renderArcs(frame, start, end, slotW, scaleMode)}
        {renderBars(frame, start, end, slotW, scaleMode)}
      </svg>
      <div className="meta-row" style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--accent)' }}>Active</strong></span>
        <span><strong style={{ color: 'var(--ok)' }}>Cascade Target</strong></span>
        <span><strong style={{ color: 'var(--muted)' }}>Settled</strong></span>
        <span><strong className="gold">Gold Border = Peak ({formatCompactBigInt(frame.peakCopies)})</strong></span>
      </div>
    </div>
  );
}

export function CascadeWaveVisualizer({ rawInput }: VisualizerProps) {
  const [scaleMode, setScaleMode] = useState<ScaleMode>('log2');
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  if (!traceState.ok) return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  if (frames.length === 0) return <p className="muted">No scratchcards to visualize.</p>;
  const frame = frames[playback.step]!;
  return (
    <div>
      {renderHeader(frame, frames.length, scaleMode, setScaleMode)}
      {renderWaveSvg(frame, scaleMode)}
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, frames.length)}
        onStepChange={(next) => selectStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
