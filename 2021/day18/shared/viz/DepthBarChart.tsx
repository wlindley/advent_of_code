import type { SnailfishLeaf, SnailfishTraceFrame } from '../index';

export interface DepthBarChartProps {
  readonly frame: SnailfishTraceFrame;
}

const SVG_WIDTH = 760;
const SVG_HEIGHT = 230;
const PAD_LEFT = 42;
const PAD_RIGHT = 16;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

function isFocusedLeaf(frame: SnailfishTraceFrame, index: number): boolean {
  if (frame.focusIndex < 0) return false;
  if (frame.kind === 'explode') return index === frame.focusIndex || index === frame.focusIndex + 1;
  return index === frame.focusIndex;
}

function pickBarColor(leaf: SnailfishLeaf, focused: boolean, isComplete: boolean): string {
  if (focused) return 'var(--accent)';
  if (leaf.depth >= 5) return 'var(--warn)';
  if (leaf.value >= 10) return 'var(--gold)';
  return isComplete ? 'var(--ok)' : 'var(--muted)';
}

function DepthGridLines({ maxDepth, plotHeight }: { readonly maxDepth: number; readonly plotHeight: number }) {
  const levels = Array.from({ length: maxDepth }, (_, idx) => idx + 1);
  return (
    <g>
      {levels.map((depth) => {
        const y = PAD_TOP + plotHeight - (depth / maxDepth) * plotHeight;
        const isThreshold = depth === 5;
        return (
          <g key={depth}>
            <line
              x1={PAD_LEFT}
              x2={SVG_WIDTH - PAD_RIGHT}
              y1={y}
              y2={y}
              className={isThreshold ? 'chart-ref-line' : 'chart-grid'}
            />
            <text
              x={PAD_LEFT - 8}
              y={y + 4}
              textAnchor="end"
              className={isThreshold ? 'chart-ref-text' : 'chart-axis-text'}
            >
              d{depth}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function LeafBar({
  leaf,
  index,
  slotWidth,
  plotHeight,
  maxDepth,
  focused,
  isComplete,
}: {
  readonly leaf: SnailfishLeaf;
  readonly index: number;
  readonly slotWidth: number;
  readonly plotHeight: number;
  readonly maxDepth: number;
  readonly focused: boolean;
  readonly isComplete: boolean;
}) {
  const barWidth = Math.max(3, slotWidth - 3);
  const x = PAD_LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
  const barHeight = (leaf.depth / maxDepth) * plotHeight;
  const y = PAD_TOP + plotHeight - barHeight;
  const fill = pickBarColor(leaf, focused, isComplete);
  const showValue = barWidth >= 13;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={barWidth}
        height={barHeight}
        rx={3}
        fill={fill}
        fillOpacity={focused || leaf.depth >= 5 || leaf.value >= 10 ? 0.92 : 0.72}
        stroke={focused ? 'var(--text)' : 'var(--border)'}
        strokeWidth={focused ? 1.5 : 0.75}
      >
        <title>{`Leaf #${index}: value=${leaf.value}, depth=${leaf.depth}`}</title>
      </rect>
      {showValue ? (
        <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="chart-axis-text" style={{ fill: 'var(--text)' }}>
          {leaf.value}
        </text>
      ) : null}
    </g>
  );
}

/** Flat leaf depth and value bar chart highlighting pending explodes and splits. */
export function DepthBarChart({ frame }: DepthBarChartProps) {
  const leaves = frame.current.leaves;
  const maxDepth = Math.max(5, frame.maxDepth);
  const plotWidth = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slotWidth = plotWidth / Math.max(1, leaves.length);

  return (
    <figure className="chart-card">
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <strong>Flat Tree Depth Profile</strong>
        <span className="chart-sub muted">
          Step {frame.rawIndex + 1} / {frame.totalRawSteps} · Magnitude {frame.magnitude}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="chart-svg"
        role="img"
        aria-label="Snailfish leaf depth and value bar chart"
      >
        <DepthGridLines maxDepth={maxDepth} plotHeight={plotHeight} />
        {leaves.map((leaf, index) => (
          <LeafBar
            key={`${index}-${leaf.depth}-${leaf.value}`}
            leaf={leaf}
            index={index}
            slotWidth={slotWidth}
            plotHeight={plotHeight}
            maxDepth={maxDepth}
            focused={isFocusedLeaf(frame, index)}
            isComplete={frame.isComplete}
          />
        ))}
        <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 8} textAnchor="middle" className="chart-axis-text">
          Leaf Order (left to right · dashed gold line marks explode depth d5)
        </text>
      </svg>
      <figcaption className="chart-caption muted">
        Bar height shows nesting depth; numeric labels above bars show leaf values. Hover any bar for exact coordinates.
      </figcaption>
    </figure>
  );
}
