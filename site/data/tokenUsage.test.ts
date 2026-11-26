import { describe, expect, it } from 'vitest';
import {
  cacheHitPercent,
  flashTurnPercent,
  formatTokenCount,
  tokensPerStar,
  totalCacheReadTokens,
  totalFreshTokens,
  totalOutputTokens,
  totalTurns,
  type TokenUsageReport,
} from './tokenUsage';

describe('tokenUsage derived metrics', () => {
  it('computes totals, cache hit rate, flash offload %, and tokens per star', () => {
    const report: TokenUsageReport = {
      generatedAt: '2026-11-26T00:00:00Z',
      subagentsScanned: 10,
      budgetTargetTokens: 10_000_000,
      tiers: [
        { tier: 'Gemini 4 Neon', turns: 40, inputTokens: 1_000_000, cacheReadTokens: 9_000_000, outputTokens: 200_000 },
        { tier: 'Gemini Flash', turns: 60, inputTokens: 500_000, cacheReadTokens: 4_500_000, outputTokens: 300_000 },
      ],
    };
    expect(totalFreshTokens(report)).toBe(1_500_000);
    expect(totalOutputTokens(report)).toBe(500_000);
    expect(totalCacheReadTokens(report)).toBe(13_500_000);
    expect(totalTurns(report)).toBe(100);
    expect(cacheHitPercent(report)).toBe(90);
    expect(flashTurnPercent(report)).toBe(60);
    expect(tokensPerStar(report, 20)).toBe(100_000);
    expect(tokensPerStar(report, 0)).toBe(0);
    expect(formatTokenCount(5_660_000)).toBe('5.66M');
    expect(formatTokenCount(312_400)).toBe('312k');
    expect(formatTokenCount(42)).toBe('42');
  });

  it('handles empty token reports safely', () => {
    const empty: TokenUsageReport = {
      generatedAt: '2026-11-26T00:00:00Z',
      subagentsScanned: 0,
      budgetTargetTokens: null,
      tiers: [],
    };
    expect(cacheHitPercent(empty)).toBe(0);
    expect(flashTurnPercent(empty)).toBe(0);
    expect(tokensPerStar(empty, 5)).toBe(0);
  });
});
