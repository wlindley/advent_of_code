import { describe, expect, it } from 'vitest';
import { buildCostTimeSeries, formatShortUtc } from './costSeries';
import type { TokenUsageReport } from './tokenUsage';

const SAMPLE_TOKENS: TokenUsageReport = {
  generatedAt: '2026-11-26T18:00:00Z',
  subagentsScanned: 4,
  budgetTargetTokens: null,
  tiers: [],
  timeline: [
    {
      bucketStart: '2026-11-26T16:30:00Z',
      scope: '2024',
      tier: 'Gemini 4 Neon',
      turns: 10,
      inputTokens: 1_000_000,
      cacheReadTokens: 0,
      outputTokens: 0,
    },
    {
      bucketStart: '2026-11-26T16:00:00Z',
      scope: '2024',
      tier: 'Gemini Flash',
      turns: 0,
      inputTokens: 0,
      cacheReadTokens: 0,
      outputTokens: 0,
    },
    {
      bucketStart: '2026-11-26T16:30:00Z',
      scope: '2024',
      tier: 'Gemini Flash',
      turns: 10,
      inputTokens: 1_000_000,
      cacheReadTokens: 9_000_000,
      outputTokens: 1_000_000,
    },
    {
      bucketStart: '2026-11-26T16:30:00Z',
      scope: 'shared',
      tier: 'Gemini 4 Neon',
      turns: 5,
      inputTokens: 500_000,
      cacheReadTokens: 0,
      outputTokens: 0,
    },
  ],
};

describe('costSeries', () => {
  it('formats short UTC timestamps and handles missing timeline gracefully', () => {
    expect(formatShortUtc(Date.parse('2026-11-26T09:05:00Z'))).toBe('Nov 26 09:05Z');
    const empty = buildCostTimeSeries(undefined, 'overall', []);
    expect(empty.totalCostUsd).toBe(0);
    expect(empty.cumulativeCostUsd[0]?.points).toEqual([]);
  });

  it('computes cumulative cost, interval spend, cost/star, and efficiency for overall vs year scope', () => {
    const solvedTs = [Date.parse('2026-11-26T16:45:00Z'), Date.parse('2026-11-26T16:50:00Z')];
    const overall = buildCostTimeSeries(SAMPLE_TOKENS, 'overall', solvedTs);
    // Neon: 1.5M * $2 = $3.00; Flash: 1M * $0.75 + 9M * $0.075 + 1M * $3.75 = $5.175 -> Total = $8.18
    expect(overall.totalCostUsd).toBe(8.18);
    expect(overall.cumulativeCostUsd[0]?.points.map((p) => p.value)).toEqual([0, 8.18]);
    expect(overall.cumulativeCostUsd[1]?.points.map((p) => p.value)).toEqual([0, 3]);
    expect(overall.cumulativeCostUsd[2]?.points.map((p) => p.value)).toEqual([0, 5.18]);
    expect(overall.intervalCostUsd[0]?.points.map((p) => p.value)).toEqual([0, 8.18]);
    expect(overall.costPerStarUsd[0]?.points.map((p) => p.value)).toEqual([4.09]);
    expect(overall.efficiencyPct[0]?.points.map((p) => p.value)).toEqual([0, 78.3]);
    expect(overall.efficiencyPct[1]?.points.map((p) => p.value)).toEqual([0, 40]);

    const year2024 = buildCostTimeSeries(SAMPLE_TOKENS, 2024, solvedTs);
    // Excludes shared $1.00 -> $7.18
    expect(year2024.totalCostUsd).toBe(7.18);
    expect(year2024.costPerStarUsd[0]?.points.map((p) => p.value)).toEqual([3.59]);

    const year2022 = buildCostTimeSeries(SAMPLE_TOKENS, 2022, []);
    expect(year2022.totalCostUsd).toBe(0);
    expect(year2022.intervalCostUsd[0]?.points).toEqual([]);
  });
});
