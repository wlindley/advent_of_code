export type ModelTierName = 'Gemini 4 Neon' | 'Gemini Flash' | 'Other';

export interface ModelTierUsage {
  readonly tier: ModelTierName;
  readonly turns: number;
  readonly inputTokens: number;
  readonly cacheReadTokens: number;
  readonly outputTokens: number;
}

export interface TokenUsageReport {
  readonly generatedAt: string;
  readonly subagentsScanned: number;
  readonly budgetTargetTokens: number | null;
  readonly tiers: readonly ModelTierUsage[];
}

export function totalFreshTokens(report: TokenUsageReport): number {
  return report.tiers.reduce((sum, t) => sum + t.inputTokens, 0);
}

export function totalOutputTokens(report: TokenUsageReport): number {
  return report.tiers.reduce((sum, t) => sum + t.outputTokens, 0);
}

export function totalCacheReadTokens(report: TokenUsageReport): number {
  return report.tiers.reduce((sum, t) => sum + t.cacheReadTokens, 0);
}

export function totalTurns(report: TokenUsageReport): number {
  return report.tiers.reduce((sum, t) => sum + t.turns, 0);
}

export function cacheHitPercent(report: TokenUsageReport): number {
  const fresh = totalFreshTokens(report);
  const cached = totalCacheReadTokens(report);
  const denom = fresh + cached;
  if (denom === 0) return 0;
  return Math.round((cached / denom) * 1000) / 10;
}

export function flashTurnPercent(report: TokenUsageReport): number {
  const turns = totalTurns(report);
  if (turns === 0) return 0;
  const flashTurns = report.tiers
    .filter((t) => t.tier === 'Gemini Flash')
    .reduce((sum, t) => sum + t.turns, 0);
  return Math.round((flashTurns / turns) * 1000) / 10;
}

export function tokensPerStar(report: TokenUsageReport, solvedStars: number): number {
  if (solvedStars <= 0) return 0;
  return Math.round((totalFreshTokens(report) + totalOutputTokens(report)) / solvedStars);
}

export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}k`;
  return String(count);
}
