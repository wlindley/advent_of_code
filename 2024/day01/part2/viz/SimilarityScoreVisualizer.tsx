import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import type { LocationLists } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LocationMatch,
  buildRightFrequencies,
  solver,
  type SimilarityTraceFrame,
} from '../domain';

const MAX_SCAN_ROWS = 8;

function parseTraceState(rawInput: string) {
  try {
    const lists = solver.parse(rawInput);
    return {
      ok: true as const,
      lists,
      rightCounts: buildRightFrequencies(lists),
      frames: solver.trace!(lists, { maxSteps: DEFAULT_MAX_TRACE_STEPS }),
    };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
  }
}

function scaleBigIntToY(value: bigint, minVal: bigint, span: bigint): number {
  if (span === 0n) return 188;
  return 188 - (Number(((value - minVal) * 1_000_000n) / span) / 1_000_000) * 156;
}

function buildScorePolyline(frames: readonly SimilarityTraceFrame[], minVal: bigint, span: bigint): string {
  const denom = Math.max(1, frames.length - 1);
  return frames
    .map((f, i) => `${(18 + (i / denom) * 284).toFixed(1)},${scaleBigIntToY(f.cumulativeScore, minVal, span).toFixed(1)}`)
    .join(' ');
}

function ScanMatchRow({ match, y, activeIndex }: { readonly match: LocationMatch; readonly y: number; readonly activeIndex: number }) {
  const isActive = match.index === activeIndex;
  const isDone = match.index < activeIndex;
  const hasHit = match.rightCount > 0;
  const stroke = isActive ? 'var(--accent)' : isDone && hasHit ? 'var(--ok)' : 'var(--border)';
  const textFill = isActive ? 'var(--accent)' : isDone ? 'var(--text)' : 'var(--muted)';
  const countFill = isActive ? 'var(--gold)' : hasHit && isDone ? 'var(--ok)' : 'var(--muted)';

  return (
    <g>
      <line x1={96} y1={y} x2={212} y2={y} stroke={stroke} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive || isDone ? undefined : '3 3'} />
      <rect x={14} y={y - 10} width={82} height={20} rx={5} fill="var(--surface)" stroke={stroke} strokeWidth={isActive ? 2 : 1} />
      <rect x={122} y={y - 9} width={58} height={18} rx={9} fill="var(--surface)" stroke={stroke} strokeWidth={1} />
      <rect x={212} y={y - 10} width={94} height={20} rx={5} fill="var(--surface)" stroke={stroke} strokeWidth={isActive ? 2 : 1} />
      <text x={55} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={isActive ? 700 : 500} fill={textFill}>{match.locationId}</text>
      <text x={151} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={countFill}>x {match.rightCount}</text>
      <text x={259} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={isActive ? 700 : 500} fill={textFill}>+{match.contribution.toString()}</text>
    </g>
  );
}

function LeftScanMatchSvg({ lists, rightCounts, scannedCount }: {
  readonly lists: LocationLists; readonly rightCounts: ReadonlyMap<number, number>; readonly scannedCount: number;
}) {
  const activeIndex = scannedCount - 1;
  const start = Math.max(0, Math.min(lists.size - MAX_SCAN_ROWS, Math.max(0, activeIndex) - 3));
  const end = Math.min(lists.size, start + MAX_SCAN_ROWS);
  const rows: LocationMatch[] = [];
  for (let idx = start; idx < end; idx += 1) {
    const id = lists.left[idx]!;
    rows.push(new LocationMatch(idx, id, rightCounts.get(id) ?? 0));
  }
  const height = Math.max(56, rows.length * 28 + 26);

  return (
    <svg viewBox={`0 0 320 ${height}`} width={320} height={height} role="img" aria-label="Left scan match window" style={{ maxWidth: '100%', display: 'block' }}>
      <text x={55} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">Left ID</text>
      <text x={151} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">Right Freq</text>
      <text x={259} y={14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">Contribution</text>
      {rows.map((match, i) => <ScanMatchRow key={match.index} match={match} y={32 + i * 28} activeIndex={activeIndex} />)}
    </svg>
  );
}

function CumulativeScoreCurveSvg({ frames, step }: { readonly frames: readonly SimilarityTraceFrame[]; readonly step: number }) {
  let minVal = 0n;
  let maxVal = 0n;
  for (const f of frames) {
    if (f.cumulativeScore < minVal) minVal = f.cumulativeScore;
    if (f.cumulativeScore > maxVal) maxVal = f.cumulativeScore;
  }
  const span = maxVal - minVal;
  const denom = Math.max(1, frames.length - 1);
  const activeX = 18 + (step / denom) * 284;
  const activeY = scaleBigIntToY(frames[step]!.cumulativeScore, minVal, span);

  return (
    <svg viewBox="0 0 320 220" width={320} height={220} role="img" aria-label="Cumulative similarity score curve" style={{ maxWidth: '100%', display: 'block' }}>
      <rect x={12} y={24} width={296} height={172} rx={6} fill="var(--surface)" stroke="var(--border)" />
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--text)">Cumulative Score ({minVal.toString()} .. {maxVal.toString()})</text>
      <polyline fill="none" stroke="var(--border)" strokeWidth={1.5} points={buildScorePolyline(frames, minVal, span)} />
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={buildScorePolyline(frames.slice(0, step + 1), minVal, span)} />
      <circle cx={activeX} cy={activeY} r={4.5} fill="var(--gold)" stroke="var(--text)" strokeWidth={1} />
      <text x={160} y={212} textAnchor="middle" fontSize={10} fill="var(--text)">Scanned items (0 to {frames[frames.length - 1]!.totalItems})</text>
    </svg>
  );
}

function togglePlayWithRewind(playback: PlaybackState, totalSteps: number) {
  if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
  playback.togglePlay();
}

function scrubWithPause(playback: PlaybackState, nextStep: number) {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

export function SimilarityScoreVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => parseTraceState(rawInput), [rawInput]);
  const frames: readonly SimilarityTraceFrame[] = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;

  const frame = frames[playback.step]!;
  const m = frame.activeMatch;
  const activeLabel = m ? `Item #${m.index + 1}: ${m.locationId} x ${m.rightCount} = ${m.contribution.toString()}` : 'Start (0 scanned)';
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Scanned: {frame.scannedCount} / {frame.totalItems}</span>
        <span className="badge">{activeLabel}</span>
        <span className={`badge ${frame.scannedCount === frame.totalItems ? 'status-solved' : ''}`}>Score: {frame.cumulativeScore.toString()}</span>
        {state.lists.size >= DEFAULT_MAX_TRACE_STEPS && <span className="muted">Sampled {frames.length} frames of {state.lists.size} items</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', margin: '0.5rem 0' }}>
        <LeftScanMatchSvg lists={state.lists} rightCounts={state.rightCounts} scannedCount={frame.scannedCount} />
        <CumulativeScoreCurveSvg frames={frames} step={playback.step} />
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayWithRewind(playback, frames.length)}
        onStepChange={(next) => scrubWithPause(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
