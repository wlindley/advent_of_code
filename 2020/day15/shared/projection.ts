import type { RecentTurnEntry, TurnOrigin } from './engine';
import type { MemoryGameTraceFrame } from './solver';

export type ArcMode = 'in-window' | 'off-window' | 'novel';

export interface TimelineTile {
  readonly index: number;
  readonly turn: number;
  readonly spoken: number;
  readonly origin: TurnOrigin;
  readonly isCurrent: boolean;
  readonly isConsidered: boolean;
  readonly isPreviousMatch: boolean;
}

export interface TimelineArc {
  readonly mode: ArcMode;
  readonly consideredIndex: number | null;
  readonly previousIndex: number | null;
  readonly targetIndex: number;
  readonly label: string;
}

export interface TurnTimelineProjection {
  readonly tiles: readonly TimelineTile[];
  readonly arc: TimelineArc;
  readonly formula: string;
}

export interface SparklinePoint {
  readonly frameIndex: number;
  readonly turn: number;
  readonly distinctCount: number;
  readonly maxSpoken: number;
  readonly xNorm: number;
  readonly distinctYNorm: number;
  readonly maxSpokenYNorm: number;
  readonly isCurrent: boolean;
}

export interface GrowthSparklineProjection {
  readonly points: readonly SparklinePoint[];
  readonly maxDistinct: number;
  readonly peakSpoken: number;
  readonly currentPoint: SparklinePoint | null;
}

/** Formats the active turn's derivation rule as a single-line human-readable formula. */
export function formatRuleFormula(frame: MemoryGameTraceFrame): string {
  if (frame.origin === 'seed') return `Turn ${frame.turn} (Seed): spoke ${frame.spoken}`;
  if (frame.origin === 'novel') return `Turn ${frame.turn} (Novel): ${frame.considered} unseen -> 0`;
  return `Turn ${frame.turn} (Repeat): ${frame.considered} at T${frame.previousTurn} -> (${frame.turn - 1} - ${frame.previousTurn}) = ${frame.spoken}`;
}

function findTurnIndex(entries: readonly RecentTurnEntry[], targetTurn: number): number {
  for (let i = 0; i < entries.length; i += 1) {
    if (entries[i]!.turn === targetTurn) return i;
  }
  return -1;
}

function resolveTimelineArc(
  frame: MemoryGameTraceFrame,
  entries: readonly RecentTurnEntry[],
  targetIndex: number,
  consideredIndex: number | null,
): TimelineArc {
  if (frame.previousTurn === null) {
    const label = frame.origin === 'seed' ? 'Starting seed' : 'First occurrence -> 0';
    return Object.freeze({ mode: 'novel', consideredIndex, previousIndex: null, targetIndex, label });
  }
  const previousIndex = findTurnIndex(entries, frame.previousTurn);
  if (previousIndex !== -1) {
    const label = `T${frame.previousTurn} -> T${frame.turn - 1} (age ${frame.age})`;
    return Object.freeze({ mode: 'in-window', consideredIndex, previousIndex, targetIndex, label });
  }
  const label = `T${frame.previousTurn} (off-window) -> T${frame.turn - 1} (age ${frame.age})`;
  return Object.freeze({ mode: 'off-window', consideredIndex, previousIndex: null, targetIndex, label });
}

/** Projects a trace frame's 16-turn sliding window into tile flags and lookback arc geometry. */
export function projectTurnTimeline(frame: MemoryGameTraceFrame): TurnTimelineProjection {
  const entries = frame.recentTurns;
  const formula = formatRuleFormula(frame);
  if (entries.length === 0) {
    const arc = Object.freeze({
      mode: 'novel' as const, consideredIndex: null, previousIndex: null, targetIndex: -1, label: 'No turns recorded',
    });
    return Object.freeze({ tiles: Object.freeze([]), arc, formula });
  }
  const targetIndex = entries.length - 1;
  const consideredIndex = frame.origin === 'seed' ? null : targetIndex - 1;
  const arc = resolveTimelineArc(frame, entries, targetIndex, consideredIndex);
  const tiles: TimelineTile[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i]!;
    tiles.push(Object.freeze({
      index: i, turn: entry.turn, spoken: entry.spoken, origin: entry.origin,
      isCurrent: i === targetIndex, isConsidered: i === consideredIndex, isPreviousMatch: i === arc.previousIndex,
    }));
  }
  return Object.freeze({ tiles: Object.freeze(tiles), arc, formula });
}

function normalizeSparklinePoints(
  frames: readonly MemoryGameTraceFrame[],
  clampedIndex: number,
  maxDistinct: number,
  peakSpoken: number,
): readonly SparklinePoint[] {
  const denomX = Math.max(1, frames.length - 1);
  const denomDistinct = Math.max(1, maxDistinct);
  const denomPeak = Math.max(1, peakSpoken);
  const points: SparklinePoint[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    const f = frames[i]!;
    points.push(Object.freeze({
      frameIndex: i, turn: f.turn, distinctCount: f.distinctCount, maxSpoken: f.maxSpoken,
      xNorm: frames.length === 1 ? 0.5 : i / denomX,
      distinctYNorm: f.distinctCount / denomDistinct,
      maxSpokenYNorm: f.maxSpoken / denomPeak,
      isCurrent: i === clampedIndex,
    }));
  }
  return Object.freeze(points);
}

/** Projects sampled trace frames into normalized coordinates for the growth sparkline chart. */
export function projectGrowthSparkline(
  frames: readonly MemoryGameTraceFrame[],
  currentIndex: number,
): GrowthSparklineProjection {
  if (frames.length === 0) {
    return Object.freeze({ points: Object.freeze([]), maxDistinct: 0, peakSpoken: 0, currentPoint: null });
  }
  let [maxDistinct, peakSpoken] = [0, 0];
  for (const frame of frames) {
    maxDistinct = Math.max(maxDistinct, frame.distinctCount);
    peakSpoken = Math.max(peakSpoken, frame.maxSpoken);
  }
  const clampedIndex = Math.max(0, Math.min(currentIndex, frames.length - 1));
  const points = normalizeSparklinePoints(frames, clampedIndex, maxDistinct, peakSpoken);
  return Object.freeze({ points, maxDistinct, peakSpoken, currentPoint: points[clampedIndex]! });
}
