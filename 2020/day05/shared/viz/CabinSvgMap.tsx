import type { BoardingPass, BoardingTraceFrame } from '../index';

export interface CabinSvgMapProps {
  readonly passes: readonly BoardingPass[];
  readonly frame: BoardingTraceFrame;
}

const PAD_X = 24;
const PAD_Y = 18;
const PITCH_X = 5;
const PITCH_Y = 9;
const SEAT_W = 4;
const SEAT_H = 7;
const AISLE_GAP = 8;
const SVG_W = PAD_X + 128 * PITCH_X + 12;
const SVG_H = PAD_Y + 8 * PITCH_Y + AISLE_GAP + 16;

function seatX(row: number): number {
  return PAD_X + row * PITCH_X;
}

function seatY(col: number): number {
  return PAD_Y + col * PITCH_Y + (col >= 4 ? AISLE_GAP : 0);
}

function buildBoardedPath(passes: readonly BoardingPass[], scannedCount: number): string {
  const parts: string[] = [];
  for (let i = 0; i < scannedCount; i += 1) {
    const pass = passes[i];
    if (pass) {
      parts.push(`M${seatX(pass.row)} ${seatY(pass.column)}h${SEAT_W}v${SEAT_H}h-${SEAT_W}z`);
    }
  }
  return parts.join('');
}

function CabinLegend() {
  return (
    <div className="chart-legend" style={{ fontSize: '0.76rem' }}>
      <span className="chart-legend-item">
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', opacity: 0.55 }} />
        Boarded seats
      </span>
      <span className="chart-legend-item">
        <span style={{ display: 'inline-block', width: 10, height: 10, border: '1.5px solid var(--accent)', background: 'var(--bg)' }} />
        BSP search region
      </span>
      <span className="chart-legend-item">
        <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--gold)' }} />
        Active / target seat
      </span>
    </div>
  );
}

/** Horizontal 128x8 aircraft cabin map with batched boarded-seat SVG path and BSP overlay. */
export function CabinSvgMap({ passes, frame }: CabinSvgMapProps) {
  const boardedPath = buildBoardedPath(passes, frame.scannedCount);
  const { activePass, bspStep } = frame;
  const activeColor = bspStep !== null && bspStep.candidateSeatCount === 1 ? 'var(--ok)' : 'var(--gold)';
  const rowTicks = [0, 32, 64, 96, 127];

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <strong style={{ fontSize: '0.88rem' }}>Cabin Occupancy (128 rows × 8 columns)</strong>
        <CabinLegend />
      </div>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="chart-svg"
        role="img"
        aria-label={`Cabin map showing ${frame.scannedCount} scanned boarding passes and seat #${activePass.seatId}`}
      >
        <rect x={PAD_X - 2} y={PAD_Y - 2} width={128 * PITCH_X + 3} height={4 * PITCH_Y + 2} rx={3} fill="var(--bg)" stroke="var(--border)" />
        <rect x={PAD_X - 2} y={seatY(4) - 2} width={128 * PITCH_X + 3} height={4 * PITCH_Y + 2} rx={3} fill="var(--bg)" stroke="var(--border)" />
        {boardedPath.length > 0 && <path d={boardedPath} fill="var(--accent)" fillOpacity={0.55} />}
        {bspStep !== null && (
          <rect
            x={seatX(bspStep.rowLow) - 1}
            y={seatY(bspStep.columnLow) - 1}
            width={(bspStep.rowHigh - bspStep.rowLow + 1) * PITCH_X + 1}
            height={seatY(bspStep.columnHigh) + SEAT_H - seatY(bspStep.columnLow) + 2}
            fill="var(--accent)"
            fillOpacity={0.14}
            stroke="var(--accent)"
            strokeWidth={1.25}
          />
        )}
        <rect
          x={seatX(activePass.row) - 1}
          y={seatY(activePass.column) - 1}
          width={SEAT_W + 2}
          height={SEAT_H + 2}
          rx={1.5}
          fill={activeColor}
          stroke="var(--text)"
          strokeWidth={0.8}
        />
        {rowTicks.map((r) => (
          <text key={r} x={seatX(r) + 2} y={12} textAnchor="middle" className="chart-axis-text">
            {r}
          </text>
        ))}
        {[0, 3, 4, 7].map((c) => (
          <text key={c} x={14} y={seatY(c) + 6} textAnchor="end" className="chart-axis-text">
            {c}
          </text>
        ))}
      </svg>
    </div>
  );
}
