import { formatDayFolder, formatPartKey, type PuzzlePart } from '../../shared/core';
import {
  computeQualityGrade,
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
} from '../data/status';
import { QualityPanel } from './QualityPanel';

export interface DashboardViewProps {
  readonly statusDoc: StatusDocument;
  readonly qualityReport?: QualityReport;
  readonly selectedYear: number;
  readonly onSelectYear: (year: number) => void;
}

const STATUS_LABELS = {
  solved: 'Solved ★',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  pending: 'Pending',
} as const;

export function DashboardView({ statusDoc, qualityReport, selectedYear, onSelectYear }: DashboardViewProps) {
  const yearData = statusDoc.years.find((entry) => entry.year === selectedYear) ?? statusDoc.years[0];
  const activeParts = findActiveParts(statusDoc);
  if (!yearData) {
    return <section className="card">No years configured yet.</section>;
  }

  const progress = computeYearProgress(yearData);
  const yearQuality = qualityReport ? findYearQuality(qualityReport, yearData.year) : undefined;
  const days = Array.from({ length: yearData.totalDays }, (_, index) => index + 1);

  return (
    <>
      <section className="card">
        <div className="year-tabs">
          {statusDoc.years.map((entry) => (
            <button
              key={entry.year}
              type="button"
              className={entry.year === yearData.year ? 'primary' : undefined}
              onClick={() => onSelectYear(entry.year)}
            >
              {entry.year}
            </button>
          ))}
        </div>
        <div className="progress-row">
          <strong className="gold">★ {progress.solvedParts} / {progress.totalParts}</strong>
          <progress max={progress.totalParts} value={progress.solvedParts}>
            {progress.completionPercent}%
          </progress>
          <span>{progress.completionPercent}%</span>
        </div>
        <p className="muted">
          In progress: {progress.inProgressParts} · Blocked: {progress.blockedParts} · Pending: {progress.pendingParts} · Solve time:{' '}
          <span className="nowrap">{formatDuration(progress.totalSolveSeconds)} total</span> /{' '}
          <span className="nowrap">{formatDuration(progress.elapsedSolveSeconds)} elapsed</span> · Updated {statusDoc.updatedAt}
        </p>
      </section>

      {qualityReport && (
        <section className="card">
          <div className="quality-grid">
            <QualityPanel title="Overall Code Quality" subtitle="All modules" scope={qualityReport.overall} />
            {yearQuality && (
              <QualityPanel title={`${yearData.year} Puzzles Quality`} subtitle="Puzzle modules" scope={yearQuality} />
            )}
          </div>
        </section>
      )}

      {activeParts.length > 0 && (
        <section className="card">
          <span className="eyebrow">Currently In Flight</span>
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

      <section className="grid-days" aria-label={`Advent of Code ${yearData.year} calendar`}>
        {days.map((day) => {
          const p1 = findPartRecord(statusDoc, yearData.year, day, 1);
          const p2 = findPartRecord(statusDoc, yearData.year, day, 2);
          const title = p1?.title || p2?.title || `Day ${day}`;
          const renderPartPill = (partNum: PuzzlePart, record = partNum === 1 ? p1 : p2) => {
            const state = record?.status ?? 'pending';
            return (
              <a
                key={partNum}
                className={`part-pill status-${state}`}
                href={`#/${yearData.year}/${formatDayFolder(day)}/part${partNum}`}
              >
                P{partNum}: {record?.status === 'solved' ? `★ ${formatDuration(computeSolveDurationSeconds(record))}` : state === 'in_progress' ? 'WIP' : state === 'blocked' ? '!' : '—'}
              </a>
            );
          };

          const q1 = qualityReport ? findPartQuality(qualityReport, formatPartKey(yearData.year, day, 1)) : undefined;
          const q2 = qualityReport ? findPartQuality(qualityReport, formatPartKey(yearData.year, day, 2)) : undefined;
          const renderMiniQuality = (label: string, q?: ReturnType<typeof findPartQuality>) =>
            q ? `${label} ${computeQualityGrade(q)} (${minCoveragePercent(q.coverage)}% · MI ${q.complexity.maintainabilityIndex})` : null;
          const qLine = [renderMiniQuality('P1', q1), renderMiniQuality('P2', q2)].filter(Boolean);

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
              {qLine.length > 0 && (
                <div className="day-quality">
                  {qLine.map((text) => (
                    <span key={text}>{text}</span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}
