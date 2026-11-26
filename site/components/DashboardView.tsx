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
import { MetricsGuide } from './MetricsGuide';
import { QualityPanel } from './QualityPanel';
import { TokenBudgetCard } from './TokenBudgetCard';

export interface DashboardViewProps {
  readonly statusDoc: StatusDocument;
  readonly qualityReport?: QualityReport;
  readonly tokenUsage?: TokenUsageReport;
  readonly selectedYear: number;
  readonly onSelectYear: (year: number) => void;
}

const STATUS_LABELS = {
  solved: 'Solved ★',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  pending: 'Pending',
} as const;

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
  const prog = computeYearProgress(entry);
  const isComplete = prog.solvedParts === prog.totalParts;
  const icon = isComplete ? '★' : prog.solvedParts > 0 || prog.inProgressParts > 0 ? '◐' : '○';
  return (
    <button
      type="button"
      className={selected ? 'primary' : undefined}
      onClick={onSelect}
    >
      {entry.year} {icon} {prog.solvedParts}/{prog.totalParts}
      {isComplete ? ` · ${formatDuration(prog.totalSolveSeconds)}` : ''}
    </button>
  );
}

export function DashboardView({
  statusDoc,
  qualityReport,
  tokenUsage,
  selectedYear,
  onSelectYear,
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
                {part.status === 'in_progress' ? `${part.phase} — ${part.inFlightWork}` : part.status === 'blocked' ? part.reason : ''}
              </span>
            </div>
          ))}
        </section>
      )}

      <div className="year-tabs" role="tablist" aria-label="Advent of Code years">
        {statusDoc.years.map((entry) => (
          <YearTabButton
            key={entry.year}
            entry={entry}
            selected={entry.year === yearData.year}
            onSelect={() => onSelectYear(entry.year)}
          />
        ))}
      </div>

      <section className="card stack">
        <div className="quality-header">
          <div>
            <span className="eyebrow">{yearData.year} Year Summary</span>
            <h2 className="year-heading">
              Advent of Code {yearData.year} · {isYearComplete ? 'Completed ★' : 'In Progress'}
            </h2>
          </div>
          <span className="badge nowrap">
            {isYearComplete ? 'Total solve time' : 'Active solve time'}: {formatDuration(progress.totalSolveSeconds)}
          </span>
        </div>

        <div className="progress-row">
          <strong className="gold">★ {progress.solvedParts} / {progress.totalParts}</strong>
          <progress max={progress.totalParts} value={progress.solvedParts}>
            {progress.completionPercent}%
          </progress>
          <span className="nowrap">{progress.completionPercent}%</span>
        </div>

        <p className="muted">
          In progress: {progress.inProgressParts} · Blocked: {progress.blockedParts} · Pending: {progress.pendingParts} · Updated {statusDoc.updatedAt}
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
        {days.map((day) => {
          const p1 = findPartRecord(statusDoc, yearData.year, day, 1);
          const p2 = findPartRecord(statusDoc, yearData.year, day, 2);
          const title = p1?.title || p2?.title || `Day ${day}`;
          const renderPartPill = (partNum: PuzzlePart, record = partNum === 1 ? p1 : p2) => {
            const state = record?.status ?? 'pending';
            const quality = qualityReport
              ? findPartQuality(qualityReport, formatPartKey(yearData.year, day, partNum))
              : undefined;
            return (
              <a
                key={partNum}
                className={`part-pill status-${state}`}
                href={`#/${yearData.year}/${formatDayFolder(day)}/part${partNum}`}
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
          };

          return (
            <article key={day} className="day-card">
              <div className="day-header">
                <span>Day {day}</span>
                <a href={`https://adventofcode.com/${yearData.year}/day/${day}`} target="_blank" rel="noreferrer">
                  AoC ↗
                </a>
              </div>
              <div className="muted">{title}</div>
              <div className="part-links">
                {renderPartPill(1)}
                {renderPartPill(2)}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
