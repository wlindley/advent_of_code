import { useMemo } from 'react';
import { buildMetricsOverTime } from '../data/metricsSeries';
import type { QualityReport } from '../data/quality';
import { formatDuration, type StatusDocument } from '../data/status';
import { formatUsd, type TokenUsageReport } from '../data/tokenUsage';
import type { MetricsScope } from '../data/viewState';
import { TimeSeriesChart } from './TimeSeriesChart';

export interface MetricsChartsViewProps {
  readonly statusDoc: StatusDocument;
  readonly qualityReport?: QualityReport;
  readonly tokenUsage?: TokenUsageReport;
  readonly scope: MetricsScope;
  readonly onSelectScope: (scope: MetricsScope) => void;
}

const fmtUsd = (v: number): string => formatUsd(v);
const fmtMin = (v: number): string => `${v.toFixed(1)}m`;
const fmtMs = (v: number): string => `${v.toFixed(1)} ms`;
const fmtPct = (v: number): string => `${v.toFixed(1)}%`;
const fmtInt = (v: number): string => String(Math.round(v));
const fmtDec = (v: number): string => v.toFixed(1);

export function MetricsChartsView({
  statusDoc,
  qualityReport,
  tokenUsage,
  scope,
  onSelectScope,
}: MetricsChartsViewProps) {
  const data = useMemo(
    () => buildMetricsOverTime(statusDoc, qualityReport, tokenUsage, scope),
    [statusDoc, qualityReport, tokenUsage, scope],
  );
  const scopeLabel = scope === 'overall' ? 'Overall (All Years)' : `Advent of Code ${scope}`;

  return (
    <div className="stack">
      <section className="card stack">
        <div className="quality-header">
          <div>
            <span className="eyebrow">Metrics Over Time</span>
            <h2 className="year-heading">{scopeLabel}</h2>
          </div>
          <div className="scope-filter-bar" role="group" aria-label="Filter metrics by scope">
            <button
              type="button"
              className={scope === 'overall' ? 'primary' : undefined}
              aria-pressed={scope === 'overall'}
              onClick={() => onSelectScope('overall')}
            >
              Overall
            </button>
            {statusDoc.years.map((entry) => (
              <button
                key={entry.year}
                type="button"
                className={scope === entry.year ? 'primary' : undefined}
                aria-pressed={scope === entry.year}
                onClick={() => onSelectScope(entry.year)}
              >
                {entry.year}
              </button>
            ))}
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-tile">
            <span className="eyebrow">Solved Stars</span>
            <strong className="nowrap">★ {data.summary.solvedCount}</strong>
          </div>
          <div className="metric-tile">
            <span className="eyebrow">Est. API Cost</span>
            <strong className="nowrap">{formatUsd(data.summary.totalCostUsd)}</strong>
            <span className="metric-sub nowrap">
              {data.summary.includesSharedOverhead ? 'incl. coordinator & shared' : `attributed ${scope} subagents`}
            </span>
          </div>
          <div className="metric-tile">
            <span className="eyebrow">Est. Cost / Star</span>
            <strong className="nowrap">{formatUsd(data.summary.costPerStarUsd)}</strong>
          </div>
          <div className="metric-tile">
            <span className="eyebrow">Avg Maintainability</span>
            <strong className="nowrap">{data.summary.avgMi.toFixed(1)}</strong>
          </div>
          <div className="metric-tile">
            <span className="eyebrow">Median Solve Time</span>
            <strong className="nowrap">{formatDuration(data.summary.medianSolveSeconds)}</strong>
          </div>
        </div>
      </section>

      <section className="card stack">
        <span className="eyebrow">Cost &amp; Token Efficiency</span>
        <div className="charts-grid">
          <TimeSeriesChart title="Cumulative Estimated Cost" subtitle="Running API cost (Total, Neon, Flash) in 30-min buckets" series={data.cumulativeCostUsd} formatValue={fmtUsd} yMin={0} />
          <TimeSeriesChart title="Estimated Cost per Star" subtitle="Cumulative USD divided by cumulative solved stars" series={data.costPerStarUsd} formatValue={fmtUsd} yMin={0} />
          <TimeSeriesChart title="Spend Rate (30-Min Buckets)" subtitle="Estimated API cost incurred per 30-minute window" series={data.intervalCostUsd} formatValue={fmtUsd} yMin={0} />
          <TimeSeriesChart title="Cache Hit & Flash Offload" subtitle="Cumulative prompt cache hit rate and Flash turn share" series={data.efficiencyPct} formatValue={fmtPct} yMin={0} yMax={100} />
        </div>
      </section>

      <section className="card stack">
        <span className="eyebrow">Solution Progress &amp; Speed</span>
        <div className="charts-grid">
          <TimeSeriesChart title="Cumulative Stars Solved" subtitle="Verified AoC stars accumulated chronologically" series={data.cumulativeStars} formatValue={fmtInt} yMin={0} />
          <TimeSeriesChart title="Active Solve Time per Part" subtitle="Active minutes per star (excluding human wait) + 5-part median" series={data.solveDurationMinutes} formatValue={fmtMin} yMin={0} />
          <TimeSeriesChart title="Personal Input Runtime" subtitle="Measured solver execution time (ms) + 5-part median" series={data.runtimeMs} formatValue={fmtMs} yMin={0} />
          <TimeSeriesChart title="Cumulative First-Try Accuracy" subtitle="Percentage of stars accepted on the first submission" series={data.firstTryRatePct} formatValue={fmtPct} yMin={0} yMax={100} />
        </div>
      </section>

      <section className="card stack">
        <span className="eyebrow">Code Quality Over Time</span>
        <div className="charts-grid">
          <TimeSeriesChart title="Maintainability Index (MI)" subtitle="Per-part MI and running mean as puzzles were solved" series={data.maintainabilityIndex} formatValue={fmtDec} yMin={60} yMax={100} referenceLine={{ value: 80, label: 'Grade A (80)' }} />
          <TimeSeriesChart title="Cumulative Codebase Size (SLOC)" subtitle="Production vs. test source lines added per solved part" series={data.slocGrowth} formatValue={fmtInt} yMin={0} />
          <TimeSeriesChart title="Cyclomatic Complexity" subtitle="Max and average cyclomatic complexity per solved part" series={data.cyclomaticComplexity} formatValue={fmtDec} yMin={0} />
          <TimeSeriesChart title="V8 Code Coverage" subtitle="Minimum statement/branch/function/line coverage per part" series={data.coveragePct} formatValue={fmtPct} yMin={80} yMax={100} />
        </div>
      </section>
    </div>
  );
}
