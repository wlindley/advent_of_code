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
} from '../data/tokenUsage';

export interface TokenBudgetCardProps {
  readonly report: TokenUsageReport;
  readonly solvedStars: number;
}

export function TokenBudgetCard({ report, solvedStars }: TokenBudgetCardProps) {
  const fresh = totalFreshTokens(report);
  const output = totalOutputTokens(report);
  const cached = totalCacheReadTokens(report);
  const consumed = fresh + output;
  const turns = totalTurns(report);
  const flashPct = flashTurnPercent(report);
  const budgetPct =
    report.budgetTargetTokens && report.budgetTargetTokens > 0
      ? Math.min(100, Math.round((consumed / report.budgetTargetTokens) * 1000) / 10)
      : null;

  return (
    <div className="token-card">
      <div className="quality-header">
        <div>
          <strong>Token Budget &amp; Model Mix</strong>
          <span className="muted"> · {turns} turns across {report.subagentsScanned + 1} agents</span>
        </div>
        <span className="badge nowrap">
          {formatTokenCount(fresh)} fresh · {formatTokenCount(output)} out
        </span>
      </div>

      {budgetPct !== null && report.budgetTargetTokens !== null && (
        <div className="progress-row">
          <span className="muted nowrap">Budget ({formatTokenCount(report.budgetTargetTokens)})</span>
          <progress max={100} value={budgetPct}>{budgetPct}%</progress>
          <strong className="nowrap">{budgetPct}%</strong>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-tile">
          <span className="eyebrow">Fresh + Output</span>
          <strong className="nowrap">{formatTokenCount(consumed)}</strong>
          <div className="metric-sub">
            <span className="nowrap">{formatTokenCount(tokensPerStar(report, solvedStars))} / star</span>
          </div>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Prompt Cache</span>
          <strong className="nowrap">{cacheHitPercent(report)}% hit</strong>
          <div className="metric-sub">
            <span className="nowrap">{formatTokenCount(cached)} cached reads</span>
          </div>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Model Tiering</span>
          <strong className="nowrap">{flashPct}% Flash</strong>
          <div className="metric-sub">
            {report.tiers.map((tier) => (
              <span key={tier.tier} className="nowrap">
                {tier.tier.replace('Gemini ', '')}: {tier.turns}t
              </span>
            ))}
          </div>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Account Quota</span>
          <strong className="nowrap">Settings / <code>/usage</code></strong>
          <div className="metric-sub">
            <span>Rolling 5h/weekly quota lives in Antigravity Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
