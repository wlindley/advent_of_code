import type { PhaseBand, TargetArea, TrickShotTraceFrame } from '../index';

const SVG_W = 640;
const SVG_H = 280;
const PAD = { left: 48, right: 20, top: 24, bottom: 32 };

interface PhaseMapper {
  readonly toX: (vx: number) => number;
  readonly toY: (vy: number) => number;
}

function createPhaseMapper(target: TargetArea): PhaseMapper {
  const plotW = SVG_W - PAD.left - PAD.right;
  const plotH = SVG_H - PAD.top - PAD.bottom;
  const vxSpan = Math.max(1, target.xMax - target.minFeasibleVx);
  const vySpan = Math.max(1, target.maxFeasibleVy - target.yMin);
  return {
    toX: (vx) => PAD.left + ((vx - target.minFeasibleVx) / vxSpan) * plotW,
    toY: (vy) => SVG_H - PAD.bottom - ((vy - target.yMin) / vySpan) * plotH,
  };
}

function getBandColor(band: PhaseBand, idx: number, frame: TrickShotTraceFrame): string {
  const isRevealed = idx <= frame.activeBandIndex;
  if (!isRevealed) return 'var(--border)';
  if (band.yInterval.vy === frame.snapshot.bestVelocity.vy) return 'var(--gold)';
  if (idx === frame.activeBandIndex && frame.phase === 'sweep') return 'var(--accent)';
  return 'var(--ok)';
}

function PhaseBandRow({
  band,
  idx,
  frame,
  mapper,
}: {
  readonly band: PhaseBand;
  readonly idx: number;
  readonly frame: TrickShotTraceFrame;
  readonly mapper: PhaseMapper;
}) {
  const y = mapper.toY(band.yInterval.vy);
  const color = getBandColor(band, idx, frame);
  return (
    <g>
      {band.vxRanges.map((range) => {
        const x1 = mapper.toX(range.minVx);
        const x2 = mapper.toX(range.maxVx);
        return (
          <rect
            key={`${band.yInterval.vy}-${range.minVx}`}
            x={x1}
            y={y - 2}
            width={Math.max(3, x2 - x1)}
            height={4}
            rx={1}
            fill={color}
          />
        );
      })}
    </g>
  );
}

/** Bounded phase-space heatmap of valid (vx, vy) launch intervals across sampled vy bands. */
export function VelocityPhaseSpaceSvg({ frame }: { readonly frame: TrickShotTraceFrame }) {
  const { target, phaseBands, bestVelocity } = frame.snapshot;
  const mapper = createPhaseMapper(target);
  const activeY = mapper.toY(frame.activeBand.yInterval.vy);
  const showBestPin =
    frame.phase === 'arc' || frame.activeBand.yInterval.vy >= bestVelocity.vy;

  return (
    <figure className="chart-card">
      <figcaption style={{ fontWeight: 600, fontSize: '0.88rem' }}>
        Velocity Phase Space (vx vs vy)
      </figcaption>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Valid launch velocity phase space">
        <line x1={PAD.left} y1={mapper.toY(0)} x2={SVG_W - PAD.right} y2={mapper.toY(0)} className="chart-grid" />
        <line x1={PAD.left} y1={activeY} x2={SVG_W - PAD.right} y2={activeY} className="chart-cursor" />
        {phaseBands.map((band, idx) => (
          <PhaseBandRow key={band.yInterval.vy} band={band} idx={idx} frame={frame} mapper={mapper} />
        ))}
        {showBestPin && (
          <circle
            cx={mapper.toX(bestVelocity.vx)}
            cy={mapper.toY(bestVelocity.vy)}
            r={5.5}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={2}
          />
        )}
        <text x={PAD.left} y={SVG_H - 10} className="chart-axis-text">vx={target.minFeasibleVx}</text>
        <text x={SVG_W - PAD.right - 46} y={SVG_H - 10} className="chart-axis-text">vx={target.xMax}</text>
        <text x={6} y={PAD.top + 4} className="chart-axis-text">{target.maxFeasibleVy}</text>
        <text x={6} y={SVG_H - PAD.bottom} className="chart-axis-text">{target.yMin}</text>
      </svg>
    </figure>
  );
}
