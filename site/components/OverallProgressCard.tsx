import {
  computeOverallProgress,
  type YearRollupEntry,
  type YearRollupState,
} from '../data/overallProgress';
import { formatDuration, type StatusDocument } from '../data/status';

export interface OverallProgressCardProps {
  readonly statusDoc: StatusDocument;
  readonly selectedYear: number;
  readonly onSelectYear: (year: number) => void;
}

const STATE_ICONS: Record<YearRollupState, string> = {
  completed: '★',
  in_progress: '◐',
  pending: '○',
};

function YearRollupChip({
  entry,
  selected,
  onSelect,
}: {
  readonly entry: YearRollupEntry;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const icon = STATE_ICONS[entry.state];
  return (
    <button
      type="button"
      className={`year-rollup-chip state-${entry.state}${selected ? ' active' : ''}`}
      onClick={onSelect}
      title={`View ${entry.year}: ${entry.solvedParts}/${entry.totalParts} stars (${entry.completionPercent}%)`}
    >
      <span className="year-rollup-top">
        <strong className="nowrap">{entry.year}</strong>
        <span className="nowrap" aria-hidden="true">{icon}</span>
      </span>
      <span className="year-rollup-count nowrap">
        {entry.solvedParts}/{entry.totalParts}
      </span>
      <span className="year-rollup-bar" aria-hidden="true">
        <span className="year-rollup-fill" style={{ width: `${entry.completionPercent}%` }} />
      </span>
    </button>
  );
}

export function OverallProgressCard({
  statusDoc,
  selectedYear,
  onSelectYear,
}: OverallProgressCardProps) {
  const overall = computeOverallProgress(statusDoc);
  const remainingStars = Math.max(0, overall.totalParts - overall.solvedParts);
  const activeYears = overall.completedYears + overall.inProgressYears;
  const pctLabel = overall.completionPercent.toFixed(1);

  return (
    <section className="card stack" aria-labelledby="overall-progress-heading">
      <div className="quality-header">
        <div>
          <span className="eyebrow">All Known Years · Summary Rollup</span>
          <h2 id="overall-progress-heading" className="year-heading">
            Overall Progress ({overall.totalYears} Years)
          </h2>
        </div>
        <span className="badge gold nowrap">
          ★ {overall.solvedParts} / {overall.totalParts} ({pctLabel}%)
        </span>
      </div>

      <div className="progress-row">
        <strong className="gold nowrap">
          ★ {overall.solvedParts} / {overall.totalParts}
        </strong>
        <progress max={overall.totalParts || 1} value={overall.solvedParts}>
          {pctLabel}%
        </progress>
        <span className="nowrap">{pctLabel}%</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-tile">
          <span className="eyebrow">Years Complete</span>
          <strong className="nowrap">
            {overall.completedYears} / {overall.totalYears}
          </strong>
          <span className="metric-sub">
            {overall.inProgressYears} in progress · {overall.pendingYears} queued
          </span>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Stars Remaining</span>
          <strong className="nowrap">{remainingStars} ★</strong>
          <span className="metric-sub">
            {overall.inProgressParts} in flight · {overall.blockedParts} blocked
          </span>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">First-Try Rate</span>
          <strong className="nowrap">
            {overall.firstTryCount} / {overall.solvedParts} ({overall.firstTryPercent}%)
          </strong>
          <span className="metric-sub">solved on first attempt</span>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Total Active Time</span>
          <strong className="nowrap">{formatDuration(overall.totalSolveSeconds)}</strong>
          <span className="metric-sub">
            across {activeYears} active {activeYears === 1 ? 'year' : 'years'}
          </span>
        </div>
      </div>

      <div className="year-rollup-grid" role="group" aria-label="Per-year progress rollup">
        {overall.years.map((entry) => (
          <YearRollupChip
            key={entry.year}
            entry={entry}
            selected={entry.year === selectedYear}
            onSelect={() => onSelectYear(entry.year)}
          />
        ))}
      </div>
    </section>
  );
}
