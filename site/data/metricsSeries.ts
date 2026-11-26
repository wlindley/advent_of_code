import { formatPartKey } from '../../shared/core';
import { buildCostTimeSeries, type ChartSeries, type TimePoint } from './costSeries';
import {
  averageCyclomatic,
  findPartQuality,
  minCoveragePercent,
  type QualityReport,
  type ScopeQuality,
} from './quality';
import { computeSolveDurationSeconds, type PartRecord, type StatusDocument } from './status';
import { totalEstimatedCostUsd, type TokenUsageReport } from './tokenUsage';
import type { MetricsScope } from './viewState';

export type { ChartSeries, TimePoint } from './costSeries';

export interface MetricsScopeSummary {
  readonly solvedCount: number;
  readonly totalCostUsd: number;
  readonly costPerStarUsd: number;
  readonly avgMi: number;
  readonly medianSolveSeconds: number;
  readonly includesSharedOverhead: boolean;
}

export interface MetricsOverTimeData {
  readonly scope: MetricsScope;
  readonly summary: MetricsScopeSummary;
  readonly cumulativeStars: readonly ChartSeries[];
  readonly solveDurationMinutes: readonly ChartSeries[];
  readonly runtimeMs: readonly ChartSeries[];
  readonly firstTryRatePct: readonly ChartSeries[];
  readonly maintainabilityIndex: readonly ChartSeries[];
  readonly cyclomaticComplexity: readonly ChartSeries[];
  readonly slocGrowth: readonly ChartSeries[];
  readonly coveragePct: readonly ChartSeries[];
  readonly cumulativeCostUsd: readonly ChartSeries[];
  readonly intervalCostUsd: readonly ChartSeries[];
  readonly costPerStarUsd: readonly ChartSeries[];
  readonly efficiencyPct: readonly ChartSeries[];
}

type SolvedRecord = Extract<PartRecord, { readonly status: 'solved' }>;

interface PartSeriesAcc {
  firstTryTotal: number;
  miSum: number;
  cumSloc: number;
  cumTestSloc: number;
  readonly solveSeconds: number[];
  readonly stars: TimePoint[];
  readonly solveMin: TimePoint[];
  readonly runtime: TimePoint[];
  readonly firstTry: TimePoint[];
  readonly mi: TimePoint[];
  readonly miAvg: TimePoint[];
  readonly maxCc: TimePoint[];
  readonly avgCc: TimePoint[];
  readonly sloc: TimePoint[];
  readonly testSloc: TimePoint[];
  readonly cov: TimePoint[];
}

const ROLLING_WINDOW = 5;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function medianOf(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function rollingMedianSeries(points: readonly TimePoint[], decimals: number): readonly TimePoint[] {
  const out: TimePoint[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const start = Math.max(0, i - ROLLING_WINDOW + 1);
    const med = roundTo(medianOf(points.slice(start, i + 1).map((p) => p.value)), decimals);
    const p = points[i]!;
    out.push({ timestampMs: p.timestampMs, label: p.label, value: med, detail: `${med} (5-part median)` });
  }
  return out;
}

function collectSolvedChronologically(statusDoc: StatusDocument, scope: MetricsScope): readonly SolvedRecord[] {
  const years = scope === 'overall' ? statusDoc.years : statusDoc.years.filter((y) => y.year === scope);
  const solved: SolvedRecord[] = [];
  for (const year of years) {
    for (const part of year.parts) {
      if (part.status === 'solved') solved.push(part);
    }
  }
  return solved.sort((a, b) => Date.parse(a.verifiedAt) - Date.parse(b.verifiedAt));
}

function appendQualityPoints(acc: PartSeriesAcc, q: ScopeQuality, ts: number, label: string, title: string): void {
  const mi = q.complexity.maintainabilityIndex;
  acc.miSum += mi;
  const runningAvgMi = roundTo(acc.miSum / (acc.mi.length + 1), 1);
  acc.mi.push({ timestampMs: ts, label, value: mi, detail: `MI ${mi} (${title})` });
  acc.miAvg.push({ timestampMs: ts, label, value: runningAvgMi, detail: `Running avg MI ${runningAvgMi}` });
  acc.maxCc.push({ timestampMs: ts, label, value: q.complexity.maxCyclomatic, detail: `Max CC ${q.complexity.maxCyclomatic}` });
  const avgCc = averageCyclomatic(q.complexity);
  acc.avgCc.push({ timestampMs: ts, label, value: avgCc, detail: `Avg CC ${avgCc}` });
  acc.cumSloc += q.complexity.sloc;
  acc.cumTestSloc += q.complexity.testSloc;
  acc.sloc.push({ timestampMs: ts, label, value: acc.cumSloc, detail: `${acc.cumSloc} prod SLOC` });
  acc.testSloc.push({ timestampMs: ts, label, value: acc.cumTestSloc, detail: `${acc.cumTestSloc} test SLOC` });
  const cov = minCoveragePercent(q.coverage);
  acc.cov.push({ timestampMs: ts, label, value: cov, detail: `${cov}% min V8 coverage` });
}

function appendSolvedPart(
  acc: PartSeriesAcc,
  part: SolvedRecord,
  index: number,
  scope: MetricsScope,
  qualityReport: QualityReport | undefined,
): void {
  const ts = Date.parse(part.verifiedAt);
  const label = scope === 'overall' ? `${part.year} D${part.day}P${part.part}` : `D${part.day}P${part.part}`;
  const sec = computeSolveDurationSeconds(part);
  const mins = roundTo(sec / 60, 2);
  acc.solveSeconds.push(sec);
  if (part.attemptsCount === 1) acc.firstTryTotal += 1;

  acc.stars.push({ timestampMs: ts, label, value: index + 1, detail: `${index + 1}★ · ${part.title}` });
  acc.solveMin.push({ timestampMs: ts, label, value: mins, detail: `${mins}m (${part.title})` });
  const runMs = roundTo(part.personalInputElapsedMs, 2);
  acc.runtime.push({ timestampMs: ts, label, value: runMs, detail: `${runMs} ms (${part.title})` });
  const pct = roundTo((acc.firstTryTotal / (index + 1)) * 100, 1);
  acc.firstTry.push({ timestampMs: ts, label, value: pct, detail: `${acc.firstTryTotal}/${index + 1} (${pct}%)` });

  const q = qualityReport ? findPartQuality(qualityReport, formatPartKey(part.year, part.day, part.part)) : undefined;
  if (q) appendQualityPoints(acc, q, ts, label, part.title);
}

export function buildMetricsOverTime(
  statusDoc: StatusDocument,
  qualityReport: QualityReport | undefined,
  tokenUsage: TokenUsageReport | undefined,
  scope: MetricsScope,
): MetricsOverTimeData {
  const solved = collectSolvedChronologically(statusDoc, scope);
  const acc: PartSeriesAcc = {
    firstTryTotal: 0, miSum: 0, cumSloc: 0, cumTestSloc: 0, solveSeconds: [],
    stars: [], solveMin: [], runtime: [], firstTry: [],
    mi: [], miAvg: [], maxCc: [], avgCc: [], sloc: [], testSloc: [], cov: [],
  };
  for (let i = 0; i < solved.length; i += 1) {
    appendSolvedPart(acc, solved[i]!, i, scope, qualityReport);
  }
  const cost = buildCostTimeSeries(tokenUsage, scope, solved.map((p) => Date.parse(p.verifiedAt)));
  const totalCostUsd =
    scope === 'overall' && tokenUsage && cost.totalCostUsd === 0
      ? roundTo(totalEstimatedCostUsd(tokenUsage), 2)
      : cost.totalCostUsd;

  return {
    scope,
    summary: {
      solvedCount: solved.length,
      totalCostUsd,
      costPerStarUsd: solved.length > 0 ? roundTo(totalCostUsd / solved.length, 2) : 0,
      avgMi: acc.mi.length > 0 ? roundTo(acc.miSum / acc.mi.length, 1) : 0,
      medianSolveSeconds: Math.round(medianOf(acc.solveSeconds)),
      includesSharedOverhead: scope === 'overall',
    },
    cumulativeStars: [{ id: 'stars', name: 'Cumulative Stars', color: 'var(--gold)', points: acc.stars }],
    solveDurationMinutes: [
      { id: 'solve-min', name: 'Active Solve Time (min)', color: 'var(--accent)', points: acc.solveMin },
      { id: 'solve-med', name: '5-Part Rolling Median', color: 'var(--warn)', points: rollingMedianSeries(acc.solveMin, 2), dashed: true },
    ],
    runtimeMs: [
      { id: 'run-ms', name: 'Personal Input Runtime (ms)', color: 'var(--ok)', points: acc.runtime },
      { id: 'run-med', name: '5-Part Rolling Median', color: 'var(--accent)', points: rollingMedianSeries(acc.runtime, 2), dashed: true },
    ],
    firstTryRatePct: [{ id: 'first-try', name: 'Cumulative First-Try %', color: 'var(--ok)', points: acc.firstTry }],
    maintainabilityIndex: [
      { id: 'mi', name: 'Part Maintainability Index', color: 'var(--accent)', points: acc.mi },
      { id: 'mi-avg', name: 'Running Average MI', color: 'var(--ok)', points: acc.miAvg, dashed: true },
    ],
    cyclomaticComplexity: [
      { id: 'max-cc', name: 'Max Cyclomatic Complexity', color: 'var(--warn)', points: acc.maxCc },
      { id: 'avg-cc', name: 'Average Cyclomatic Complexity', color: 'var(--accent)', points: acc.avgCc, dashed: true },
    ],
    slocGrowth: [
      { id: 'prod-sloc', name: 'Cumulative Production SLOC', color: 'var(--accent)', points: acc.sloc },
      { id: 'test-sloc', name: 'Cumulative Test SLOC', color: 'var(--ok)', points: acc.testSloc, dashed: true },
    ],
    coveragePct: [{ id: 'cov-pct', name: 'Min V8 Coverage %', color: 'var(--ok)', points: acc.cov }],
    cumulativeCostUsd: cost.cumulativeCostUsd,
    intervalCostUsd: cost.intervalCostUsd,
    costPerStarUsd: cost.costPerStarUsd,
    efficiencyPct: cost.efficiencyPct,
  };
}
