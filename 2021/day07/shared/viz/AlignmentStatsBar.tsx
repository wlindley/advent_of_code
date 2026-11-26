import {
  formatSignedCompactBigInt,
  formatSignedGroupedBigInt,
  type AlignmentSearchFrame,
  type FuelCostModel,
} from '../index';

export interface AlignmentStatsBarProps {
  readonly frame: AlignmentSearchFrame;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly fleetSize: number;
  readonly answer: bigint;
  readonly model: FuelCostModel;
}

function directionText(frame: AlignmentSearchFrame): string {
  if (frame.direction === 'left') return '← Left half';
  if (frame.direction === 'right') return '→ Right half';
  return '✓ Converged';
}

/** Light-mode telemetry badges for crab alignment binary search playback. */
export function AlignmentStatsBar({
  frame,
  stepIndex,
  totalSteps,
  fleetSize,
  answer,
  model,
}: AlignmentStatsBarProps) {
  const dirColor = frame.isConverged ? 'var(--ok)' : 'var(--warn)';

  return (
    <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Step <strong>{stepIndex + 1}</strong> / {totalSteps}
        </span>
        <span className="badge">{model.label}</span>
        <span className="badge">Crabs: <strong>{fleetSize}</strong></span>
        <span className="badge">
          Bracket: <strong>[{formatSignedCompactBigInt(frame.lo)}, {formatSignedCompactBigInt(frame.hi)}]</strong>
        </span>
        <span className="badge">
          Mid <strong>{formatSignedGroupedBigInt(frame.mid)}</strong>: {formatSignedCompactBigInt(frame.midFuel)}
        </span>
        <span className="badge" style={{ borderColor: dirColor, color: dirColor }}>
          {directionText(frame)}
        </span>
      </div>
      <span className="badge status-solved">
        Min Fuel: <strong>{formatSignedGroupedBigInt(answer)}</strong>
      </span>
    </div>
  );
}
