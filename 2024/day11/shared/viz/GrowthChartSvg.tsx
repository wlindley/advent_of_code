import { bigintLog2 } from '../../../../shared/core';
import type { PebbleTraceFrame } from '../index';

export interface GrowthChartSvgProps {
  readonly frames: readonly PebbleTraceFrame[];
  readonly activeIndex: number;
}

const WIDTH = 640;
const HEIGHT = 210;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 28;
const PLOT_W = WIDTH - PAD_L - PAD_R;
const PLOT_H = HEIGHT - PAD_T - PAD_B;

function log10Total(total: bigint): number {
  return bigintLog2(total) * Math.LOG10E;
}

function toX(blink: number, minBlink: number, blinkSpan: number): number {
  return PAD_L + ((blink - minBlink) / blinkSpan) * PLOT_W;
}

function toY(logVal: number, maxLog: number): number {
  return PAD_T + PLOT_H - (logVal / maxLog) * PLOT_H;
}

function buildPointsAttr(points: readonly { readonly x: number; readonly y: number }[]): string {
  return points.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
}

function ChartGrid({
  maxLog,
  minBlink,
  maxBlink,
}: {
  readonly maxLog: number;
  readonly minBlink: number;
  readonly maxBlink: number;
}) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <g>
      {ticks.map((ratio) => {
        const val = maxLog * ratio;
        const y = toY(val, maxLog);
        return (
          <g key={ratio}>
            <line x1={PAD_L} y1={y} x2={WIDTH - PAD_R} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}
      <line x1={PAD_L} y1={PAD_T + PLOT_H} x2={WIDTH - PAD_R} y2={PAD_T + PLOT_H} stroke="var(--border)" />
      <text x={PAD_L} y={HEIGHT - 8} textAnchor="start" fontSize="10" fill="var(--muted)">
        Blink {minBlink}
      </text>
      <text x={WIDTH - PAD_R} y={HEIGHT - 8} textAnchor="end" fontSize="10" fill="var(--muted)">
        Blink {maxBlink}
      </text>
    </g>
  );
}

/** Dual-curve log10 growth SVG chart comparing total vs distinct stone counts. */
export function GrowthChartSvg({ frames, activeIndex }: GrowthChartSvgProps) {
  if (frames.length === 0) return null;
  const minBlink = frames[0]!.blink;
  const maxBlink = frames[frames.length - 1]!.blink;
  const blinkSpan = Math.max(1, maxBlink - minBlink);
  const totalLogs = frames.map((f) => log10Total(f.totalStones));
  const distinctLogs = frames.map((f) => Math.log10(Math.max(1, f.distinctStones)));
  const maxLog = Math.max(1, ...totalLogs, ...distinctLogs);

  const totalPts = frames.map((f, i) => ({
    x: toX(f.blink, minBlink, blinkSpan),
    y: toY(totalLogs[i]!, maxLog),
  }));
  const distinctPts = frames.map((f, i) => ({
    x: toX(f.blink, minBlink, blinkSpan),
    y: toY(distinctLogs[i]!, maxLog),
  }));

  const safeIdx = Math.min(Math.max(0, activeIndex), frames.length - 1);
  const curTotal = totalPts[safeIdx]!;
  const curDistinct = distinctPts[safeIdx]!;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.6rem' }}>
      <div className="meta-row" style={{ margin: '0 0 0.35rem', fontSize: '0.78rem' }}>
        <strong>Growth Curve (log10)</strong>
        <span style={{ color: 'var(--accent)' }}>● Total Stones</span>
        <span style={{ color: 'var(--ok)' }}>● Distinct Stones</span>
        <span style={{ color: 'var(--gold)' }}>│ Active Blink {frames[safeIdx]!.blink}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Stone population growth chart">
        <ChartGrid maxLog={maxLog} minBlink={minBlink} maxBlink={maxBlink} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth="2.4" points={buildPointsAttr(totalPts)} />
        <polyline fill="none" stroke="var(--ok)" strokeWidth="2.2" points={buildPointsAttr(distinctPts)} />
        <line x1={curTotal.x} y1={PAD_T} x2={curTotal.x} y2={PAD_T + PLOT_H} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="4 2" />
        <circle cx={curTotal.x} cy={curTotal.y} r="4.2" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
        <circle cx={curDistinct.x} cy={curDistinct.y} r="4.2" fill="var(--ok)" stroke="var(--surface)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
