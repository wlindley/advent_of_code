import type { ProbePoint, TargetArea, TrickShotTraceFrame } from '../index';

const SVG_W = 640;
const SVG_H = 280;
const PAD = { left: 48, right: 20, top: 24, bottom: 32 };

interface PlotBounds {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
}

interface CoordMapper {
  readonly toX: (x: number) => number;
  readonly toY: (y: number) => number;
}

function computePlotBounds(
  target: TargetArea,
  bestArc: readonly ProbePoint[],
  candidateArc: readonly ProbePoint[],
): PlotBounds {
  let xMax = Math.max(target.xMax, 1);
  let yMin = Math.min(target.yMin, 0);
  let yMax = 0;
  for (const pt of [...bestArc, ...candidateArc]) {
    if (pt.x > xMax) xMax = pt.x;
    if (pt.y < yMin) yMin = pt.y;
    if (pt.y > yMax) yMax = pt.y;
  }
  return { xMin: 0, xMax, yMin, yMax: Math.max(yMax, 1) };
}

function createMapper(bounds: PlotBounds): CoordMapper {
  const plotW = SVG_W - PAD.left - PAD.right;
  const plotH = SVG_H - PAD.top - PAD.bottom;
  const spanX = Math.max(1, bounds.xMax - bounds.xMin);
  const spanY = Math.max(1, bounds.yMax - bounds.yMin);
  return {
    toX: (x) => PAD.left + ((x - bounds.xMin) / spanX) * plotW,
    toY: (y) => SVG_H - PAD.bottom - ((y - bounds.yMin) / spanY) * plotH,
  };
}

function toPolylinePoints(points: readonly ProbePoint[], mapper: CoordMapper): string {
  return points.map((pt) => `${mapper.toX(pt.x).toFixed(1)},${mapper.toY(pt.y).toFixed(1)}`).join(' ');
}

function TargetBox({ target, mapper }: { readonly target: TargetArea; readonly mapper: CoordMapper }) {
  const x1 = mapper.toX(target.xMin);
  const x2 = mapper.toX(target.xMax);
  const y1 = mapper.toY(target.yMax);
  const y2 = mapper.toY(target.yMin);
  return (
    <g>
      <rect
        x={x1}
        y={y1}
        width={Math.max(4, x2 - x1)}
        height={Math.max(4, y2 - y1)}
        fill="rgba(26, 127, 55, 0.14)"
        stroke="var(--ok)"
        strokeWidth={1.5}
      />
      <text x={x1 + 4} y={y1 - 4} className="chart-axis-text" style={{ fill: 'var(--ok)', fontWeight: 600 }}>
        Target
      </text>
    </g>
  );
}

/** Interactive SVG trajectory arc showing probe flight, apex height, and target hits. */
export function BallisticArcSvg({ frame }: { readonly frame: TrickShotTraceFrame }) {
  const { target, bestArc, maxApexY } = frame.snapshot;
  const activeArc =
    frame.phase === 'arc' ? bestArc.slice(0, frame.revealedArcCount) : frame.candidateArc;
  const bounds = computePlotBounds(target, bestArc, frame.candidateArc);
  const mapper = createMapper(bounds);
  const yZero = mapper.toY(0);
  const head = activeArc[activeArc.length - 1];

  return (
    <figure className="chart-card">
      <figcaption style={{ fontWeight: 600, fontSize: '0.88rem' }}>
        Ballistic Trajectory Arc
      </figcaption>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Ballistic probe trajectory and target area">
        <line x1={PAD.left} y1={yZero} x2={SVG_W - PAD.right} y2={yZero} className="chart-grid" />
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={SVG_H - PAD.bottom} className="chart-grid" />
        {maxApexY > 0 && (
          <>
            <line x1={PAD.left} y1={mapper.toY(maxApexY)} x2={SVG_W - PAD.right} y2={mapper.toY(maxApexY)} className="chart-ref-line" />
            <text x={PAD.left + 6} y={mapper.toY(maxApexY) - 4} className="chart-ref-text">
              Apex y={maxApexY}
            </text>
          </>
        )}
        <TargetBox target={target} mapper={mapper} />
        <polyline fill="none" stroke="var(--border)" strokeWidth={1.25} strokeDasharray="4 3" points={toPolylinePoints(bestArc, mapper)} />
        {activeArc.length > 0 && (
          <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={toPolylinePoints(activeArc, mapper)} />
        )}
        {activeArc.map((pt) => (
          <circle
            key={pt.step}
            cx={mapper.toX(pt.x)}
            cy={mapper.toY(pt.y)}
            r={pt.inTarget ? 3.8 : 2.2}
            fill={pt.inTarget ? 'var(--ok)' : 'var(--accent)'}
          />
        ))}
        {head && (
          <circle cx={mapper.toX(head.x)} cy={mapper.toY(head.y)} r={4.8} fill="none" stroke="var(--gold)" strokeWidth={2} />
        )}
        <text x={PAD.left} y={SVG_H - 10} className="chart-axis-text">x=0</text>
        <text x={SVG_W - PAD.right - 36} y={SVG_H - 10} className="chart-axis-text">x={bounds.xMax}</text>
        <text x={6} y={yZero + 4} className="chart-axis-text">0</text>
        <text x={6} y={SVG_H - PAD.bottom} className="chart-axis-text">{bounds.yMin}</text>
      </svg>
    </figure>
  );
}
