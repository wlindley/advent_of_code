import { useEffect, useRef } from 'react';
import { formatDayFolder, formatPartKey, type PuzzlePart } from '../../shared/core';
import {
  computeQualityGrade,
  filterFilesForScope,
  findPartQuality,
  findYearQuality,
  minCoveragePercent,
  type QualityReport,
} from '../data/quality';
import {
  computeSolveDurationSeconds,
  computeYearProgress,
  findActiveParts,
  findPartRecord,
  formatDuration,
  type StatusDocument,
  type YearProgress,
  type YearStatus,
} from '../data/status';
import type { TokenUsageReport } from '../data/tokenUsage';
import type { DashboardTab, MetricsScope } from '../data/viewState';
import { MetricsChartsView } from './MetricsChartsView';
import { MetricsGuide } from './MetricsGuide';
import { QualityPanel } from './QualityPanel';
import { TokenBudgetCard } from './TokenBudgetCard';

export interface DashboardViewProps {
  readonly statusDoc: StatusDocument;
  readonly qualityReport?: QualityReport;
  readonly tokenUsage?: TokenUsageReport;
  readonly activeTab: DashboardTab;
  readonly onSelectTab: (tab: DashboardTab) => void;
  readonly selectedYear: number;
  readonly onSelectYear: (year: number) => void;
  readonly metricsScope: MetricsScope;
  readonly onSelectMetricsScope: (scope: MetricsScope) => void;
}

const STATUS_LABELS = {
  solved: 'Solved ★',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  pending: 'Pending',
} as const;

function moveTabFocus(event: React.KeyboardEvent<HTMLDivElement>): void {
  const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  if (tabs.length === 0) return;
  const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
  let nextIdx = idx < 0 ? 0 : idx;
  if (event.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') nextIdx = 0;
  else if (event.key === 'End') nextIdx = tabs.length - 1;
  event.preventDefault();
  tabs[nextIdx]?.focus();
}

function YearSummaryStats({ progress }: { readonly progress: YearProgress }) {
  if (progress.solvedParts === 0) return null;
  const firstTryPct = Math.round((progress.firstTryCount / progress.solvedParts) * 100);
  const fastest = progress.fastestPart
    ? `D${progress.fastestPart.day} P${progress.fastestPart.part} (${formatDuration(progress.fastestPart.seconds)})`
    : '—';
  const slowest = progress.slowestPart
    ? `D${progress.slowestPart.day} P${progress.slowestPart.part} (${formatDuration(progress.slowestPart.seconds)})`
    : '—';

  return (
    <div className="metrics-grid">
      <div className="metric-tile">
        <span className="eyebrow">First-Try Rate</span>
        <strong className="nowrap">
          {progress.firstTryCount} / {progress.solvedParts} ({firstTryPct}%)
        </strong>
      </div>
      <div className="metric-tile">
        <span className="eyebrow">Median Solve Time</span>
        <strong className="nowrap">{formatDuration(progress.medianSolveSeconds)}</strong>
        <span className="metric-sub">per part (active)</span>
      </div>
      <div className="metric-tile">
        <span className="eyebrow">Hardest / Fastest</span>
        <strong className="nowrap">{slowest}</strong>
        <span className="metric-sub nowrap">Fastest: {fastest}</span>
      </div>
      <div className="metric-tile">
        <span className="eyebrow">Median Run Speed</span>
        <strong className="nowrap">{progress.medianRunMs.toFixed(2)} ms</strong>
        <span className="metric-sub">personal puzzle input</span>
      </div>
    </div>
  );
}

function YearTabButton({
  entry,
  selected,
  onSelect,
}: {
  readonly entry: YearStatus;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const prog = computeYearProgress(entry);
  const isComplete = prog.solvedParts === prog.totalParts;
  const icon = isComplete ? '★' : prog.solvedParts > 0 || prog.inProgressParts > 0 ? '◐' : '○';

  useEffect(() => {
    if (selected) {
      btnRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [selected]);

  return (
    <button
      ref={btnRef}
      id={`tab-year-${entry.year}`}
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className="tab-btn"
      onClick={onSelect}
    >
      {entry.year} {icon} {prog.solvedParts}/{prog.totalParts}
      {isComplete ? ` · ${formatDuration(prog.totalSolveSeconds)}` : ''}
    </button>
  );
}

function DayCard({
  year,
  day,
  statusDoc,
  qualityReport,
}: {
  readonly year: number;
  readonly day: number;
  readonly statusDoc: StatusDocument;
  readonly qualityReport?: QualityReport;
}) {
  const p1 = findPartRecord(statusDoc, year, day, 1);
  const p2 = findPartRecord(statusDoc, year, day, 2);
  const title = p1?.title || p2?.title || `Day ${day}`;
  const parts: readonly [PuzzlePart, typeof p1][] = [
    [1, p1],
    [2, p2],
  ];

  return (
    <article className="day-card">
      <div className="day-header">
        <span>Day {day}</span>
        <a href={`https://adventofcode.com/${year}/day/${day}`} target="_blank" rel="noreferrer">
          AoC ↗
        </a>
      </div>
      <div className="muted">{title}</div>
      <div className="part-links">
        {parts.map(([partNum, record]) => {
          const state = record?.status ?? 'pending';
          const quality = qualityReport
            ? findPartQuality(qualityReport, formatPartKey(year, day, partNum))
            : undefined;
          return (
            <a
              key={partNum}
              className={`part-pill status-${state}`}
              href={`#/${year}/${formatDayFolder(day)}/part${partNum}`}
            >
              <span className="part-pill-main">
                P{partNum}:{' '}
                {record?.status === 'solved'
                  ? `★ ${formatDuration(computeSolveDurationSeconds(record))}`
                  : state === 'in_progress'
                    ? 'WIP'
                    : state === 'blocked'
                      ? '!'
                      : '—'}
              </span>
              {quality && (
                <span className="part-pill-quality">
                  <span className="nowrap">Grade {computeQualityGrade(quality)}</span>
                  <span className="nowrap">Coverage {minCoveragePercent(quality.coverage)}%</span>
                  <span className="nowrap">Maintainability {quality.complexity.maintainabilityIndex}</span>
                </span>
              )}
            </a>
          );
        })}
      </div>
    </article>
  );
}

export function DashboardView({
  statusDoc,
  qualityReport,
  tokenUsage,
  activeTab,
  onSelectTab,
  selectedYear,
  onSelectYear,
  metricsScope,
  onSelectMetricsScope,
}: DashboardViewProps) {
  const yearData = statusDoc.years.find((entry) => entry.year === selectedYear) ?? statusDoc.years[0];
  const activeParts = findActiveParts(statusDoc);
  const totalSolvedStars = statusDoc.years.reduce(
    (sum, y) => sum + y.parts.filter((p) => p.status === 'solved').length,
    0,
  );
  if (!yearData) {
    return <section className="card">No years configured yet.</section>;
  }

  const progress = computeYearProgress(yearData);
  const isYearComplete = progress.solvedParts === progress.totalParts;
  const yearQuality = qualityReport ? findYearQuality(qualityReport, yearData.year) : undefined;
  const days = Array.from({ length: yearData.totalDays }, (_, index) => index + 1);

  return (
    <>
      <div
        className="tablist dashboard-tabs"
        role="tablist"
        aria-label="Dashboard views"
        onKeyDown={moveTabFocus}
      >
        <button
          id="tab-dashboard-overview"
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          tabIndex={activeTab === 'overview' ? 0 : -1}
          className="tab-btn"
          onClick={() => onSelectTab('overview')}
        >
          Overview
        </button>
        <button
          id="tab-dashboard-metrics"
          type="button"
          role="tab"
          aria-selected={activeTab === 'metrics'}
          tabIndex={activeTab === 'metrics' ? 0 : -1}
          className="tab-btn"
          onClick={() => onSelectTab('metrics')}
        >
          Metrics Over Time
        </button>
      </div>

      {activeTab === 'metrics' ? (
        <div role="tabpanel" aria-labelledby="tab-dashboard-metrics">
          <MetricsChartsView
            statusDoc={statusDoc}
            qualityReport={qualityReport}
            tokenUsage={tokenUsage}
            scope={metricsScope}
            onSelectScope={onSelectMetricsScope}
          />
        </div>
      ) : (
        <div role="tabpanel" aria-labelledby="tab-dashboard-overview">
          <section className="card stack">
            <span className="eyebrow">Overall · Shared &amp; Cross-Year</span>
            {qualityReport && (
              <QualityPanel
                title="Overall Code Quality"
                subtitle="All modules (click metrics to drill down)"
                scope={qualityReport.overall}
                files={qualityReport.files}
              />
            )}
            {tokenUsage && <TokenBudgetCard report={tokenUsage} solvedStars={totalSolvedStars} />}
            <MetricsGuide />
          </section>

          {activeParts.length > 0 && (
            <section className="card">
              <span className="eyebrow">Currently In Flight Across Years</span>
              {activeParts.map((part) => (
                <div key={formatPartKey(part.year, part.day, part.part)} className="meta-row">
                  <span className={`badge status-${part.status}`}>{STATUS_LABELS[part.status]}</span>
                  <a href={`#/${formatPartKey(part.year, part.day, part.part)}`}>
                    {part.year} Day {part.day} Part {part.part}: {part.title}
                  </a>
                  <span className="muted">
                    {part.status === 'in_progress'
                      ? `${part.phase} — ${part.inFlightWork}`
                      : part.status === 'blocked'
                        ? part.reason
                        : ''}
                  </span>
                </div>
              ))}
            </section>
          )}

          <div
            className="tablist year-tabs"
            role="tablist"
            aria-label="Advent of Code years"
            onKeyDown={moveTabFocus}
          >
            {statusDoc.years.map((entry) => (
              <YearTabButton
                key={entry.year}
                entry={entry}
                selected={entry.year === yearData.year}
                onSelect={() => onSelectYear(entry.year)}
              />
            ))}
          </div>

          <div role="tabpanel" aria-labelledby={`tab-year-${yearData.year}`}>
            <section className="card stack">
              <div className="quality-header">
                <div>
                  <span className="eyebrow">{yearData.year} Year Summary</span>
                  <h2 className="year-heading">
                    Advent of Code {yearData.year} · {isYearComplete ? 'Completed ★' : 'In Progress'}
                  </h2>
                </div>
                <span className="badge nowrap">
                  {isYearComplete ? 'Total solve time' : 'Active solve time'}:{' '}
                  {formatDuration(progress.totalSolveSeconds)}
                </span>
              </div>

              <div className="progress-row">
                <strong className="gold">
                  ★ {progress.solvedParts} / {progress.totalParts}
                </strong>
                <progress max={progress.totalParts} value={progress.solvedParts}>
                  {progress.completionPercent}%
                </progress>
                <span className="nowrap">{progress.completionPercent}%</span>
              </div>

              <p className="muted">
                In progress: {progress.inProgressParts} · Blocked: {progress.blockedParts} · Pending:{' '}
                {progress.pendingParts} · Updated {statusDoc.updatedAt}
              </p>

              <YearSummaryStats progress={progress} />

              {yearQuality && qualityReport && (
                <div className="section-divider">
                  <QualityPanel
                    title={`${yearData.year} Code Quality`}
                    subtitle="Year puzzle modules"
                    scope={yearQuality}
                    files={filterFilesForScope(qualityReport.files, String(yearData.year))}
                  />
                </div>
              )}
            </section>

            <section className="grid-days" aria-label={`Advent of Code ${yearData.year} calendar`}>
              {days.map((day) => (
                <DayCard
                  key={day}
                  year={yearData.year}
                  day={day}
                  statusDoc={statusDoc}
                  qualityReport={qualityReport}
                />
              ))}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
