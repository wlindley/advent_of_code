import {
  tierCostUsd,
  type TokenUsageBucket,
  type TokenUsageReport,
} from './tokenUsage';
import type { MetricsScope } from './viewState';

export interface TimePoint {
  readonly timestampMs: number;
  readonly label: string;
  readonly value: number;
  readonly detail: string;
}

export interface ChartSeries {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly points: readonly TimePoint[];
  readonly dashed?: boolean;
}

export interface CostTimeSeries {
  readonly totalCostUsd: number;
  readonly cumulativeCostUsd: readonly ChartSeries[];
  readonly intervalCostUsd: readonly ChartSeries[];
  readonly costPerStarUsd: readonly ChartSeries[];
  readonly efficiencyPct: readonly ChartSeries[];
}

interface BucketRollup {
  readonly bucketStart: string;
  readonly timestampMs: number;
  totalUsd: number;
  neonUsd: number;
  flashUsd: number;
  turns: number;
  flashTurns: number;
  freshTokens: number;
  cacheTokens: number;
}

interface CostAccumulator {
  total: number;
  neon: number;
  flash: number;
  turns: number;
  flashTurns: number;
  fresh: number;
  cache: number;
  readonly cumTotal: TimePoint[];
  readonly cumNeon: TimePoint[];
  readonly cumFlash: TimePoint[];
  readonly intervalPts: TimePoint[];
  readonly perStarPts: TimePoint[];
  readonly cachePctPts: TimePoint[];
  readonly flashPctPts: TimePoint[];
}

const BUCKET_WINDOW_MS = 30 * 60_000;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatShortUtc(timestampMs: number): string {
  const d = new Date(timestampMs);
  const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = d.getUTCDate();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mon} ${day} ${hh}:${mm}Z`;
}

function filterBucketsByScope(
  buckets: readonly TokenUsageBucket[],
  scope: MetricsScope,
): readonly TokenUsageBucket[] {
  if (scope === 'overall') return buckets;
  const target = String(scope);
  return buckets.filter((b) => b.scope === target);
}

function applyBucketToRollup(row: BucketRollup, b: TokenUsageBucket): void {
  const cost = tierCostUsd(b);
  row.totalUsd += cost;
  if (b.tier === 'Gemini Flash') {
    row.flashUsd += cost;
    row.flashTurns += b.turns;
  } else {
    row.neonUsd += cost;
  }
  row.turns += b.turns;
  row.freshTokens += b.inputTokens;
  row.cacheTokens += b.cacheReadTokens;
}

function rollupByTimestamp(buckets: readonly TokenUsageBucket[]): readonly BucketRollup[] {
  const byTime = new Map<string, BucketRollup>();
  for (const b of buckets) {
    let row = byTime.get(b.bucketStart);
    if (!row) {
      row = {
        bucketStart: b.bucketStart, timestampMs: Date.parse(b.bucketStart),
        totalUsd: 0, neonUsd: 0, flashUsd: 0, turns: 0, flashTurns: 0, freshTokens: 0, cacheTokens: 0,
      };
      byTime.set(b.bucketStart, row);
    }
    applyBucketToRollup(row, b);
  }
  return [...byTime.values()].sort((a, b) => a.timestampMs - b.timestampMs);
}

function countSolvedBy(solvedTimestampsMs: readonly number[], cutoffMs: number): number {
  let count = 0;
  for (const ts of solvedTimestampsMs) {
    if (ts <= cutoffMs) count += 1;
  }
  return count;
}

function appendRollupPoint(
  acc: CostAccumulator,
  r: BucketRollup,
  solvedTimestampsMs: readonly number[],
): void {
  acc.total += r.totalUsd;
  acc.neon += r.neonUsd;
  acc.flash += r.flashUsd;
  acc.turns += r.turns;
  acc.flashTurns += r.flashTurns;
  acc.fresh += r.freshTokens;
  acc.cache += r.cacheTokens;

  const label = formatShortUtc(r.timestampMs);
  const totalRounded = roundTo(acc.total, 2);
  acc.cumTotal.push({ timestampMs: r.timestampMs, label, value: totalRounded, detail: `$${totalRounded.toFixed(2)} cumulative` });
  acc.cumNeon.push({ timestampMs: r.timestampMs, label, value: roundTo(acc.neon, 2), detail: `Neon $${acc.neon.toFixed(2)}` });
  acc.cumFlash.push({ timestampMs: r.timestampMs, label, value: roundTo(acc.flash, 2), detail: `Flash $${acc.flash.toFixed(2)}` });
  acc.intervalPts.push({ timestampMs: r.timestampMs, label, value: roundTo(r.totalUsd, 2), detail: `$${r.totalUsd.toFixed(2)} in 30m (${r.turns}t)` });

  const starsSoFar = countSolvedBy(solvedTimestampsMs, r.timestampMs + BUCKET_WINDOW_MS);
  if (starsSoFar > 0) {
    const rate = roundTo(acc.total / starsSoFar, 2);
    acc.perStarPts.push({ timestampMs: r.timestampMs, label, value: rate, detail: `$${rate.toFixed(2)} / star (${starsSoFar}★)` });
  }
  const cacheDenom = acc.fresh + acc.cache;
  const cachePct = cacheDenom > 0 ? roundTo((acc.cache / cacheDenom) * 100, 1) : 0;
  const flashPct = acc.turns > 0 ? roundTo((acc.flashTurns / acc.turns) * 100, 1) : 0;
  acc.cachePctPts.push({ timestampMs: r.timestampMs, label, value: cachePct, detail: `${cachePct}% cache hit` });
  acc.flashPctPts.push({ timestampMs: r.timestampMs, label, value: flashPct, detail: `${flashPct}% Flash turns` });
}

export function buildCostTimeSeries(
  tokenUsage: TokenUsageReport | undefined,
  scope: MetricsScope,
  solvedTimestampsMs: readonly number[],
): CostTimeSeries {
  const rollups = rollupByTimestamp(filterBucketsByScope(tokenUsage?.timeline ?? [], scope));
  const acc: CostAccumulator = {
    total: 0, neon: 0, flash: 0, turns: 0, flashTurns: 0, fresh: 0, cache: 0,
    cumTotal: [], cumNeon: [], cumFlash: [], intervalPts: [], perStarPts: [], cachePctPts: [], flashPctPts: [],
  };
  for (const r of rollups) appendRollupPoint(acc, r, solvedTimestampsMs);

  return {
    totalCostUsd: roundTo(acc.total, 2),
    cumulativeCostUsd: [
      { id: 'total-cost', name: 'Total Cost', color: 'var(--accent)', points: acc.cumTotal },
      { id: 'neon-cost', name: 'Gemini 4 Neon', color: 'var(--warn)', points: acc.cumNeon, dashed: true },
      { id: 'flash-cost', name: 'Gemini Flash', color: 'var(--ok)', points: acc.cumFlash, dashed: true },
    ],
    intervalCostUsd: [{ id: 'interval-cost', name: '30m Spend', color: 'var(--gold)', points: acc.intervalPts }],
    costPerStarUsd: [{ id: 'cost-per-star', name: 'Est. Cost / Star', color: 'var(--accent)', points: acc.perStarPts }],
    efficiencyPct: [
      { id: 'cache-hit', name: 'Prompt Cache Hit %', color: 'var(--ok)', points: acc.cachePctPts },
      { id: 'flash-share', name: 'Flash Turn Offload %', color: 'var(--accent)', points: acc.flashPctPts, dashed: true },
    ],
  };
}
