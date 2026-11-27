import type { ReactNode } from 'react';
import { sampleTraceIndices } from '../../../../shared/core';
import type { OctopusStepFrame } from '../index';

const WIDTH = 640;
const HEIGHT = 180;
const PAD_LEFT = 42;
const PAD_RIGHT = 14;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;
const MAX_BARS = 240;

interface SparkGeometry {
  readonly plotW: number;
  readonly plotH: number;
  readonly maxY: number;
}

function buildSampledIndices(total: number): readonly number[] {
  return total > MAX_BARS
    ? sampleTraceIndices(total, MAX_BARS)
    : Array.from({ length: total }, (_, i) => i);
}

function findPlayheadX(
  step: number,
  total: number,
  plotW: number,
): number | null {
  if (step <= 0 || total <= 0) return null;
  const ratio = total === 1 ? 0.5 : (step - 1) / (total - 1);
  return PAD_LEFT + ratio * plotW;
}

function renderBars(
  frame: OctopusStepFrame,
  indices: readonly number[],
  geom: SparkGeometry,
): ReactNode[] {
  const barW = Math.max(1.5, geom.plotW / Math.max(1, indices.length) - 0.8);
  const { flashHistory, step, grid } = frame;
  return indices.map((histIdx, pos) => {
    const val = flashHistory[histIdx] ?? 0;
    const h = (val / geom.maxY) * geom.plotH;
    const x = PAD_LEFT + (pos / Math.max(1, indices.length)) * geom.plotW;
    const y = PAD_TOP + geom.plotH - h;
    const isSync = val === grid.size;
    const isCurrent = histIdx + 1 === step;
    const fill = isSync ? 'var(--ok)' : isCurrent ? 'var(--gold)' : 'var(--accent)';
    return (
      <rect
        key={histIdx}
        x={x}
        y={y}
        width={barW}
        height={Math.max(1, h)}
        fill={fill}
        opacity={histIdx + 1 <= step ? 0.95 : 0.3}
      />
    );
  });
}

/** Step-by-step flashes bar chart with full-synchronization ceiling line and playhead cursor. */
export function FlashSparklineSvg({ frame }: { readonly frame: OctopusStepFrame }) {
  const { flashHistory, grid, step } = frame;
  const geom: SparkGeometry = {
    plotW: WIDTH - PAD_LEFT - PAD_RIGHT,
    plotH: HEIGHT - PAD_TOP - PAD_BOTTOM,
    maxY: Math.max(1, grid.size),
  };
  const indices = buildSampledIndices(flashHistory.length);
  const syncY = PAD_TOP;
  const cursorX = findPlayheadX(step, flashHistory.length, geom.plotW);
  const peak = flashHistory.reduce((acc, v) => Math.max(acc, v), 0);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ marginTop: 0, justifyContent: 'space-between' }}>
        <strong>Flashes Per Step (1–{flashHistory.length})</strong>
        <span className="muted" style={{ fontSize: '0.82rem' }}>
          Peak: <strong>{peak}</strong> · Sync Threshold: <strong>{grid.size}</strong>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="chart-svg"
        role="img"
        aria-label={`Flashes per step chart across ${flashHistory.length} steps, current step ${step} with ${frame.stepFlashes} flashes`}
      >
        <line x1={PAD_LEFT} y1={syncY} x2={WIDTH - PAD_RIGHT} y2={syncY} className="chart-ref-line" />
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP + geom.plotH}
          x2={WIDTH - PAD_RIGHT}
          y2={PAD_TOP + geom.plotH}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <text x={PAD_LEFT - 6} y={syncY + 4} textAnchor="end" className="chart-ref-text">
          {grid.size}
        </text>
        <text x={PAD_LEFT - 6} y={PAD_TOP + geom.plotH + 4} textAnchor="end" className="chart-axis-text">
          0
        </text>
        <text x={WIDTH - PAD_RIGHT} y={syncY - 4} textAnchor="end" className="chart-ref-text">
          Full Sync ({grid.size})
        </text>
        {renderBars(frame, indices, geom)}
        {cursorX !== null && (
          <line
            x1={cursorX}
            y1={PAD_TOP - 4}
            x2={cursorX}
            y2={PAD_TOP + geom.plotH + 4}
            stroke="var(--warn)"
            strokeWidth={1.8}
            strokeDasharray="3 2"
          />
        )}
        <text x={PAD_LEFT} y={HEIGHT - 6} className="chart-axis-text">
          Step 1
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} textAnchor="end" className="chart-axis-text">
          Step {flashHistory.length}
        </text>
      </svg>
    </div>
  );
}
