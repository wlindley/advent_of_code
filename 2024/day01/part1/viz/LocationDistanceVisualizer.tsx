import { useMemo } from 'react';
import { sampleTraceIndices } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  sortLocationColumns,
  solver,
  type DistanceTraceFrame,
  type SortedLocationColumns,
} from '../domain';

interface RibbonSample {
  readonly rank: number;
  readonly low: number;
  readonly high: number;
  readonly paired: boolean;
  readonly active: boolean;
}

const MAX_PAIR_ROWS = 8;
const MAX_RIBBON_COLS = 72;

function buildRibbonSamples(sorted: SortedLocationColumns, pairedCount: number): readonly RibbonSample[] {
  const activeRank = pairedCount - 1;
  return sampleTraceIndices(sorted.left.length, MAX_RIBBON_COLS).map((rank) => {
    const l = sorted.left[rank]!;
    const r = sorted.right[rank]!;
    return { rank, low: Math.min(l, r), high: Math.max(l, r), paired: rank < pairedCount, active: rank === activeRank };
  });
}

function PairingRow({ rank, y, left, right, activeRank }: {
  readonly rank: number; readonly y: number; readonly left: number; readonly right: number; readonly activeRank: number;
}) {
  const isActive = rank === activeRank;
  const isDone = rank < activeRank;
  const stroke = isActive ? 'var(--accent)' : isDone ? 'var(--ok)' : 'var(--border)';
  const fill = isActive ? 'var(--accent)' : isDone ? 'var(--text)' : 'var(--muted)';
  return (
    <g>
      <line x1={104} y1={y} x2={216} y2={y} stroke={stroke} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive || isDone ? undefined : '3 3'} />
      <rect x={16} y={y - 10} width={84} height={20} rx={5} fill="var(--surface)" stroke={stroke} strokeWidth={isActive ? 2 : 1} />
      <rect x={220} y={y - 10} width={84} height={20} rx={5} fill="var(--surface)" stroke={stroke} strokeWidth={isActive ? 2 : 1} />
      <rect x={136} y={y - 9} width={48} height={18} rx={9} fill="var(--surface)" stroke={stroke} strokeWidth={1} />
      <text x={58} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={isActive ? 700 : 500} fill={fill}>{left}</text>
      <text x={160} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={isActive ? 'var(--accent)' : 'var(--muted)'}>{Math.abs(left - right)}</text>
      <text x={262} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={isActive ? 700 : 500} fill={fill}>{right}</text>
    </g>
  );
}

function ColumnPairingSvg({ sorted, pairedCount }: { readonly sorted: SortedLocationColumns; readonly pairedCount: number }) {
  const activeRank = pairedCount - 1;
  const start = Math.max(0, Math.min(sorted.left.length - MAX_PAIR_ROWS, Math.max(0, activeRank) - 3));
  const end = Math.min(sorted.left.length, start + MAX_PAIR_ROWS);
  const rows = Array.from({ length: end - start }, (_, idx) => start + idx);
  const height = Math.max(56, rows.length * 28 + 26);

  return (
    <svg viewBox={`0 0 320 ${height}`} width={320} height={height} role="img" aria-label="Sorted rank pairing window" style={{ maxWidth: '100%', display: 'block' }}>
      <text x={58} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--muted)">Left (sorted)</text>
      <text x={160} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--muted)">|Δ|</text>
      <text x={262} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--muted)">Right (sorted)</text>
      {rows.map((rank, i) => (
        <PairingRow key={rank} rank={rank} y={32 + i * 28} left={sorted.left[rank]!} right={sorted.right[rank]!} activeRank={activeRank} />
      ))}
    </svg>
  );
}

function OrderStatisticRibbonSvg({ sorted, pairedCount }: { readonly sorted: SortedLocationColumns; readonly pairedCount: number }) {
  const samples = buildRibbonSamples(sorted, pairedCount);
  const last = sorted.left.length - 1;
  const minVal = last >= 0 ? Math.min(sorted.left[0]!, sorted.right[0]!) : 0;
  const maxVal = last >= 0 ? Math.max(sorted.left[last]!, sorted.right[last]!) : 1;
  const span = Math.max(1, maxVal - minVal);
  const colW = samples.length > 0 ? 296 / samples.length : 296;

  return (
    <svg viewBox="0 0 320 220" width={320} height={220} role="img" aria-label="Order-statistic distance ribbon" style={{ maxWidth: '100%', display: 'block' }}>
      <rect x={12} y={24} width={296} height={172} rx={6} fill="var(--bg)" stroke="var(--border)" />
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Order-Statistic Gap Ribbon ({minVal} .. {maxVal})</text>
      {samples.map((s, idx) => {
        const yHigh = 188 - ((s.high - minVal) / span) * 156;
        const yLow = 188 - ((s.low - minVal) / span) * 156;
        const color = s.active ? 'var(--gold)' : s.paired ? 'var(--accent)' : 'var(--border)';
        return <rect key={s.rank} x={14 + idx * colW} y={yHigh} width={Math.max(2, colW - 1)} height={Math.max(3, yLow - yHigh)} rx={1} fill={color} opacity={s.paired ? 0.9 : 0.45} />;
      })}
      <text x={160} y={212} textAnchor="middle" fontSize={10} fill="var(--muted)">Sorted rank index (0 → {Math.max(0, last)})</text>
    </svg>
  );
}

function parseTraceState(rawInput: string) {
  try {
    const lists = solver.parse(rawInput);
    return { ok: true as const, sorted: sortLocationColumns(lists), frames: solver.trace!(lists, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
  }
}

export function LocationDistanceVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => parseTraceState(rawInput), [rawInput]);
  const frames: readonly DistanceTraceFrame[] = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;

  const frame = frames[playback.step]!;
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Paired: {frame.pairedCount} / {frame.totalPairs}</span>
        <span className="badge">
          {frame.activePair ? `Rank #${frame.activePair.rank + 1}: |${frame.activePair.left} - ${frame.activePair.right}| = ${frame.activePair.distance}` : 'Start (0 paired)'}
        </span>
        <span className={`badge ${frame.pairedCount === frame.totalPairs ? 'status-solved' : ''}`}>Total Distance: {frame.cumulativeDistance}</span>
        {state.sorted.left.length >= DEFAULT_MAX_TRACE_STEPS && <span className="muted">Sampled {frames.length} frames of {state.sorted.left.length} pairs</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', margin: '0.5rem 0' }}>
        <ColumnPairingSvg sorted={state.sorted} pairedCount={frame.pairedCount} />
        <OrderStatisticRibbonSvg sorted={state.sorted} pairedCount={frame.pairedCount} />
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
