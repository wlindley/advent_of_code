import { describe, expect, it } from 'vitest';
import { buildMetricsOverTime } from './metricsSeries';
import type { QualityReport, ScopeQuality } from './quality';
import type { StatusDocument } from './status';
import type { TokenUsageReport } from './tokenUsage';

function makeQuality(mi: number, sloc: number, testSloc: number, maxCc: number): ScopeQuality {
  return {
    coverage: {
      statements: { covered: 10, total: 10 },
      branches: { covered: 10, total: 10 },
      functions: { covered: 5, total: 5 },
      lines: { covered: 10, total: 10 },
    },
    complexity: {
      fileCount: 2,
      sloc,
      testSloc,
      functionCount: 4,
      totalCyclomatic: maxCc + 3,
      maxCyclomatic: maxCc,
      maxNestingDepth: 2,
      maxFunctionSloc: 18,
      nestedFunctionCount: 0,
      maintainabilityIndex: mi,
      maxCyclomaticHotspot: null,
      maxNestingHotspot: null,
      longestFunctionHotspot: null,
    },
  };
}

const STATUS_DOC: StatusDocument = {
  updatedAt: '2026-11-26T17:00:00Z',
  years: [
    {
      year: 2025,
      totalDays: 12,
      parts: [
        {
          year: 2025,
          day: 1,
          part: 1,
          title: 'Secret Entrance',
          puzzleUrl: 'https://adventofcode.com/2025/day/1',
          status: 'solved',
          summary: 's',
          algorithmSummary: 'a',
          complexity: 'O(N)',
          runtime: 'main-thread',
          personalInputElapsedMs: 1.5,
          attemptsCount: 1,
          learnings: [],
          startedAt: '2026-11-26T10:00:00Z',
          verifiedAt: '2026-11-26T10:06:00Z',
        },
        {
          year: 2025,
          day: 1,
          part: 2,
          title: 'Secret Entrance',
          puzzleUrl: 'https://adventofcode.com/2025/day/1#part2',
          status: 'pending',
        },
      ],
    },
    {
      year: 2024,
      totalDays: 25,
      parts: [
        {
          year: 2024,
          day: 1,
          part: 1,
          title: 'Historian Hysteria',
          puzzleUrl: 'https://adventofcode.com/2024/day/1',
          status: 'solved',
          summary: 's',
          algorithmSummary: 'a',
          complexity: 'O(N)',
          runtime: 'main-thread',
          personalInputElapsedMs: 2.5,
          attemptsCount: 2,
          learnings: [],
          startedAt: '2026-11-26T11:00:00Z',
          verifiedAt: '2026-11-26T11:03:00Z',
        },
      ],
    },
  ],
};

const QUALITY_REPORT: QualityReport = {
  generatedAt: '2026-11-26T17:00:00Z',
  overall: makeQuality(92, 200, 300, 5),
  years: { '2025': makeQuality(90, 100, 150, 4), '2024': makeQuality(94, 100, 150, 5) },
  parts: {
    '2025/day01/part1': makeQuality(90, 100, 150, 4),
    '2024/day01/part1': makeQuality(94, 120, 180, 6),
  },
  files: [],
};

const TOKEN_REPORT: TokenUsageReport = {
  generatedAt: '2026-11-26T17:00:00Z',
  subagentsScanned: 2,
  budgetTargetTokens: null,
  tiers: [{ tier: 'Gemini 4 Neon', turns: 4, inputTokens: 1_000_000, cacheReadTokens: 0, outputTokens: 0 }],
  timeline: [
    { bucketStart: '2026-11-26T10:00:00Z', scope: '2025', tier: 'Gemini 4 Neon', turns: 2, inputTokens: 500_000, cacheReadTokens: 0, outputTokens: 0 },
    { bucketStart: '2026-11-26T11:00:00Z', scope: '2024', tier: 'Gemini 4 Neon', turns: 2, inputTokens: 500_000, cacheReadTokens: 0, outputTokens: 0 },
  ],
};

describe('metricsSeries', () => {
  it('builds overall solution, quality, and cost time series in chronological order', () => {
    const overall = buildMetricsOverTime(STATUS_DOC, QUALITY_REPORT, TOKEN_REPORT, 'overall');
    expect(overall.summary).toEqual({
      solvedCount: 2,
      totalCostUsd: 2,
      costPerStarUsd: 1,
      avgMi: 92,
      medianSolveSeconds: 270,
      includesSharedOverhead: true,
    });
    expect(overall.cumulativeStars[0]?.points.map((p) => p.label)).toEqual(['2025 D1P1', '2024 D1P1']);
    expect(overall.solveDurationMinutes[0]?.points.map((p) => p.value)).toEqual([6, 3]);
    expect(overall.solveDurationMinutes[1]?.points.map((p) => p.value)).toEqual([6, 4.5]);
    expect(overall.firstTryRatePct[0]?.points.map((p) => p.value)).toEqual([100, 50]);
    expect(overall.maintainabilityIndex[0]?.points.map((p) => p.value)).toEqual([90, 94]);
    expect(overall.maintainabilityIndex[1]?.points.map((p) => p.value)).toEqual([90, 92]);
    expect(overall.slocGrowth[0]?.points.map((p) => p.value)).toEqual([100, 220]);
    expect(overall.slocGrowth[1]?.points.map((p) => p.value)).toEqual([150, 330]);
    expect(overall.coveragePct[0]?.points.map((p) => p.value)).toEqual([100, 100]);
    expect(overall.cumulativeCostUsd[0]?.points.map((p) => p.value)).toEqual([1, 2]);
  });

  it('filters cleanly by year and falls back gracefully without quality or timeline data', () => {
    const year2024 = buildMetricsOverTime(STATUS_DOC, QUALITY_REPORT, TOKEN_REPORT, 2024);
    expect(year2024.summary).toEqual({
      solvedCount: 1,
      totalCostUsd: 1,
      costPerStarUsd: 1,
      avgMi: 94,
      medianSolveSeconds: 180,
      includesSharedOverhead: false,
    });
    expect(year2024.cumulativeStars[0]?.points.map((p) => p.label)).toEqual(['D1P1']);

    const noTimelineTokens: TokenUsageReport = {
      generatedAt: '2026-11-26T17:00:00Z',
      subagentsScanned: 1,
      budgetTargetTokens: null,
      tiers: [{ tier: 'Gemini 4 Neon', turns: 1, inputTokens: 1_000_000, cacheReadTokens: 0, outputTokens: 0 }],
    };
    const fallback = buildMetricsOverTime(STATUS_DOC, undefined, noTimelineTokens, 'overall');
    expect(fallback.summary.totalCostUsd).toBe(2);
    expect(fallback.summary.avgMi).toBe(0);
    expect(fallback.maintainabilityIndex[0]?.points).toEqual([]);

    const emptyYear = buildMetricsOverTime(STATUS_DOC, QUALITY_REPORT, TOKEN_REPORT, 2022);
    expect(emptyYear.summary.solvedCount).toBe(0);
    expect(emptyYear.summary.costPerStarUsd).toBe(0);
    expect(emptyYear.summary.medianSolveSeconds).toBe(0);
  });
});
