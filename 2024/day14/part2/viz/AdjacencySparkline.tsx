import type { SparklineBin } from '../domain';

export interface AdjacencySparklineProps {
  readonly bins: readonly SparklineBin[];
  readonly period: number;
  readonly bestSecond: number;
  readonly peakAdjacency: number;
  readonly baselineMean: number;
  readonly currentSecond: number;
}

const SVG_W = 640;
const SVG_H = 128;
const PAD_X = 14;
const PAD_TOP = 20;
const PAD_BOT = 22;

function xForSecond(second: number, period: number): number {
  const innerW = SVG_W - PAD_X * 2;
  if (period <= 1) return PAD_X + innerW / 2;
  return PAD_X + (Math.min(period - 1, Math.max(0, second)) / (period - 1)) * innerW;
}

function xForBin(index: number, count: number): number {
  const innerW = SVG_W - PAD_X * 2;
  if (count <= 1) return PAD_X + innerW / 2;
  return PAD_X + (index / (count - 1)) * innerW;
}

function yForScore(score: number, maxScore: number): number {
  const innerH = SVG_H - PAD_TOP - PAD_BOT;
  return PAD_TOP + innerH - (score / Math.max(1, maxScore)) * innerH;
}

/** Max-pooled full-period adjacency sparkline highlighting baseline, peak, and current second. */
export function AdjacencySparkline({
  bins,
  period,
  bestSecond,
  peakAdjacency,
  baselineMean,
  currentSecond,
}: AdjacencySparklineProps) {
  const scaleMax = Math.max(1, peakAdjacency);
  const points = bins
    .map((bin, i) => `${xForBin(i, bins.length).toFixed(1)},${yForScore(bin.peakScore, scaleMax).toFixed(1)}`)
    .join(' ');
  const baselineY = yForScore(baselineMean, scaleMax);
  const peakX = xForSecond(bestSecond, period);
  const peakY = yForScore(peakAdjacency, scaleMax);
  const cursorX = xForSecond(currentSecond, period);

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        role="img"
        aria-label={`Adjacency sparkline across ${period} seconds, peak ${peakAdjacency} at ${bestSecond}s`}
        style={{
          width: '100%',
          maxWidth: 640,
          height: 'auto',
          display: 'block',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}
      >
        <line
          x1={PAD_X}
          y1={baselineY}
          x2={SVG_W - PAD_X}
          y2={baselineY}
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        {bins.length > 1 && (
          <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={points} />
        )}
        <line x1={peakX} y1={PAD_TOP} x2={peakX} y2={SVG_H - PAD_BOT} stroke="var(--gold)" strokeWidth={1.5} />
        <circle cx={peakX} cy={peakY} r={4} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.2} />
        <line
          x1={cursorX}
          y1={PAD_TOP - 4}
          x2={cursorX}
          y2={SVG_H - PAD_BOT + 4}
          stroke="var(--accent)"
          strokeWidth={1.8}
        />
        <text x={PAD_X} y={13} fontSize={11} fontWeight={600} fill="var(--text)">
          Peak t={bestSecond}s ({peakAdjacency} pairs)
        </text>
        <text x={SVG_W - PAD_X} y={13} fontSize={11} textAnchor="end" fill="var(--muted)">
          mean {baselineMean.toFixed(1)}
        </text>
        <text x={PAD_X} y={SVG_H - 6} fontSize={10} fill="var(--muted)">
          0s
        </text>
        <text x={SVG_W - PAD_X} y={SVG_H - 6} fontSize={10} textAnchor="end" fill="var(--muted)">
          {Math.max(0, period - 1)}s
        </text>
      </svg>
    </figure>
  );
}
