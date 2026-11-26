import {
  formatGroupedBigInt,
  type GrowthScaleMode,
  type LanternfishTraceFrame,
} from '../index';

export interface SchoolStatsBarProps {
  readonly frame: LanternfishTraceFrame;
  readonly totalDays: number;
  readonly answer: bigint;
  readonly scaleMode: GrowthScaleMode;
  readonly onToggleScale: () => void;
}

/** Light-mode telemetry badges and scale toggle for the lanternfish simulation. */
export function SchoolStatsBar({
  frame,
  totalDays,
  answer,
  scaleMode,
  onToggleScale,
}: SchoolStatsBarProps) {
  return (
    <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Day <strong>{frame.day}</strong> / {totalDays}
        </span>
        <span className="badge">
          Population: <strong>{formatGroupedBigInt(frame.totalPopulation)}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Spawned Today: <strong>{formatGroupedBigInt(frame.spawnedToday)}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}>
          Spawning Next: <strong>{formatGroupedBigInt(frame.spawningNext)}</strong>
        </span>
        <span className="badge status-solved">
          Final Answer: <strong>{formatGroupedBigInt(answer)}</strong>
        </span>
      </div>
      <button
        type="button"
        className={scaleMode === 'log' ? 'primary' : undefined}
        aria-pressed={scaleMode === 'log'}
        onClick={onToggleScale}
      >
        Scale: {scaleMode === 'log' ? 'Log₂' : 'Linear'}
      </button>
    </div>
  );
}
