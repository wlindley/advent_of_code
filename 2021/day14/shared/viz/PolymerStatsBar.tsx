import {
  formatCompactBigInt,
  formatGroupedBigInt,
  type FrequencyScaleMode,
  type PolymerTraceFrame,
} from '../index';

export interface PolymerStatsBarProps {
  readonly frame: PolymerTraceFrame;
  readonly targetSteps: number;
  readonly answer: bigint;
  readonly scaleMode: FrequencyScaleMode;
  readonly onScaleChange: (mode: FrequencyScaleMode) => void;
}

/** Compact header strip showing active step metrics, scale toggle, and final answer. */
export function PolymerStatsBar({
  frame,
  targetSteps,
  answer,
  scaleMode,
  onScaleChange,
}: PolymerStatsBarProps) {
  return (
    <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">
          Step: <strong>{frame.step} / {targetSteps}</strong>
        </span>
        <span className="badge" title={formatGroupedBigInt(frame.totalLength)}>
          Length: <strong>{formatCompactBigInt(frame.totalLength)}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Most: <strong>{frame.mostCommon.element} ({formatCompactBigInt(frame.mostCommon.count)})</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Least: <strong>{frame.leastCommon.element} ({formatCompactBigInt(frame.leastCommon.count)})</strong>
        </span>
        <span className="badge" title={formatGroupedBigInt(frame.spread)}>
          Spread: <strong>{formatCompactBigInt(frame.spread)}</strong>
        </span>
        <span className="badge">
          Pairs: <strong>{frame.activePairCount}</strong>
        </span>
      </div>
      <div className="meta-row" style={{ margin: 0 }}>
        <div className="playback-buttons" role="group" aria-label="Frequency scale mode">
          <button
            type="button"
            className={scaleMode === 'linear' ? 'primary' : undefined}
            aria-pressed={scaleMode === 'linear'}
            onClick={() => onScaleChange('linear')}
          >
            Linear
          </button>
          <button
            type="button"
            className={scaleMode === 'log' ? 'primary' : undefined}
            aria-pressed={scaleMode === 'log'}
            onClick={() => onScaleChange('log')}
          >
            Log₂
          </button>
        </div>
        <span className="badge status-solved" title={formatGroupedBigInt(answer)}>
          Answer: <strong>{formatGroupedBigInt(answer)}</strong>
        </span>
      </div>
    </div>
  );
}
