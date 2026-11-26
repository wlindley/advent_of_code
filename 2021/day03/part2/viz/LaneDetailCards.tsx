import type { ReactElement } from 'react';
import { formatBitPreview } from '../../shared';
import type { LaneStepSnapshot, LifeSupportTraceFrame } from '../domain';

export interface LaneDetailCardsProps {
  readonly frame: LifeSupportTraceFrame;
}

interface SingleLaneCardProps {
  readonly title: string;
  readonly accentVar: string;
  readonly snapshot: LaneStepSnapshot;
  readonly column: number | null;
}

function buildSampleItems(rows: readonly string[], candidateCount: number): readonly ReactElement[] {
  const items: ReactElement[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    items.push(
      <span key={i} className="badge">
        <code>{formatBitPreview(rows[i]!, 18)}</code>
      </span>,
    );
  }
  if (candidateCount > rows.length) {
    items.push(
      <span key="more" className="muted">
        +{candidateCount - rows.length} more
      </span>,
    );
  }
  return items;
}

function formatTallyLine(snapshot: LaneStepSnapshot, column: number | null): string {
  if (snapshot.tally !== null && snapshot.selectedBit !== null && column !== null) {
    return `Col ${column + 1}: 1s=${snapshot.tally.ones}, 0s=${snapshot.tally.zeros} -> keep '${snapshot.selectedBit}'`;
  }
  if (snapshot.lockedSelection !== null) {
    return `Locked at round ${snapshot.lockedSelection.roundsApplied}`;
  }
  return 'Initial diagnostic report pool';
}

function SingleLaneCard({ title, accentVar, snapshot, column }: SingleLaneCardProps) {
  const locked = snapshot.lockedSelection;
  const badgeColor = locked !== null ? 'var(--ok)' : accentVar;
  const statusLabel = locked !== null ? `Locked (r${locked.roundsApplied})` : 'Active';

  return (
    <div className="proposal-card" style={{ background: 'var(--surface)', borderColor: badgeColor }}>
      <div className="day-header">
        <span>{title}</span>
        <span className="badge" style={{ borderColor: badgeColor, color: badgeColor }}>
          {statusLabel}
        </span>
      </div>
      <div className="meta-row">
        <span className="muted">{formatTallyLine(snapshot, column)}</span>
      </div>
      <div className="meta-row">
        <span className="badge">
          Remaining: <strong>{snapshot.candidateCount}</strong>
        </span>
        {snapshot.eliminatedCount > 0 && (
          <span className="badge" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}>
            Eliminated: -{snapshot.eliminatedCount}
          </span>
        )}
        {locked !== null && (
          <span className="badge status-solved">
            Rating: <strong>{String(locked.rating)}</strong> (<code>{formatBitPreview(locked.bits, 14)}</code>)
          </span>
        )}
      </div>
      <div className="meta-row">{buildSampleItems(snapshot.sampleRows, snapshot.candidateCount)}</div>
    </div>
  );
}

/** Side-by-side detail cards for the active trace step's oxygen and CO2 candidate lanes. */
export function LaneDetailCards({ frame }: LaneDetailCardsProps) {
  return (
    <div className="proposal-grid">
      <SingleLaneCard
        title="Oxygen Generator"
        accentVar="var(--accent)"
        snapshot={frame.oxygen}
        column={frame.column}
      />
      <SingleLaneCard
        title="CO2 Scrubber"
        accentVar="var(--gold)"
        snapshot={frame.co2}
        column={frame.column}
      />
    </div>
  );
}
