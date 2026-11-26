import { useId } from 'react';
import type { ClawConfig, ClawTraceFrame } from '../index';

export interface ClawVectorDiagramProps {
  readonly frame: ClawTraceFrame;
  readonly config: ClawConfig;
}

const VB_W = 540;
const VB_H = 300;
const PAD_L = 56;
const PAD_T = 22;
const PLOT_W = 456;
const PLOT_H = 242;

interface Point {
  readonly x: number;
  readonly y: number;
}

function bigMax(...values: readonly bigint[]): bigint {
  let best = values[0]!;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! > best) best = values[i]!;
  }
  return best;
}

function normRatio(value: bigint, span: bigint): number {
  return Number((value * 10_000n) / span) / 10_000;
}

function rayExit(dx: bigint, dy: bigint, spanX: bigint, spanY: bigint): { nx: number; ny: number } {
  if (dx * spanY >= dy * spanX) {
    return { nx: 1, ny: Number((dy * 10_000n * spanX) / (dx * spanY)) / 10_000 };
  }
  return { nx: Number((dx * 10_000n * spanY) / (dy * spanX)) / 10_000, ny: 1 };
}

function toSvg(nx: number, ny: number): Point {
  return { x: PAD_L + nx * PLOT_W, y: PAD_T + (1 - ny) * PLOT_H };
}

function formatAxis(val: bigint): string {
  const s = val.toString();
  return s.length > 8 ? Number(val).toExponential(2) : s;
}

function WinnablePath({
  frame,
  origin,
  pTarget,
  spanX,
  spanY,
  arrowA,
  arrowB,
}: {
  readonly frame: ClawTraceFrame;
  readonly origin: Point;
  readonly pTarget: Point;
  readonly spanX: bigint;
  readonly spanY: bigint;
  readonly arrowA: string;
  readonly arrowB: string;
}) {
  if (!frame.outcome.winnable) return null;
  const { buttonA, buttonB } = frame.machine;
  const { pressesA, pressesB } = frame.outcome.solution;
  const mid = toSvg(normRatio(pressesA * buttonA.x, spanX), normRatio(pressesA * buttonA.y, spanY));
  const alt = toSvg(normRatio(pressesB * buttonB.x, spanX), normRatio(pressesB * buttonB.y, spanY));
  return (
    <g>
      <polyline
        points={`${origin.x},${origin.y} ${alt.x},${alt.y} ${pTarget.x},${pTarget.y}`}
        fill="none"
        stroke="var(--border)"
        strokeDasharray="4 4"
        strokeWidth={1.5}
      />
      <line x1={origin.x} y1={origin.y} x2={mid.x} y2={mid.y} stroke="var(--accent)" strokeWidth={2.5} markerEnd={`url(#${arrowA})`} />
      <line x1={mid.x} y1={mid.y} x2={pTarget.x} y2={pTarget.y} stroke="var(--gold)" strokeWidth={2.5} markerEnd={`url(#${arrowB})`} />
      <circle cx={mid.x} cy={mid.y} r={4} fill="var(--accent)" />
      <circle cx={pTarget.x} cy={pTarget.y} r={6} fill="var(--ok)" stroke="var(--surface)" strokeWidth={1.5} />
    </g>
  );
}

function UnwinnableRays({
  frame,
  origin,
  pTarget,
  spanX,
  spanY,
  arrowA,
  arrowB,
}: {
  readonly frame: ClawTraceFrame;
  readonly origin: Point;
  readonly pTarget: Point;
  readonly spanX: bigint;
  readonly spanY: bigint;
  readonly arrowA: string;
  readonly arrowB: string;
}) {
  const { buttonA, buttonB } = frame.machine;
  const exitA = rayExit(buttonA.x, buttonA.y, spanX, spanY);
  const exitB = rayExit(buttonB.x, buttonB.y, spanX, spanY);
  const endA = toSvg(exitA.nx, exitA.ny);
  const endB = toSvg(exitB.nx, exitB.ny);
  return (
    <g>
      <line x1={origin.x} y1={origin.y} x2={endA.x} y2={endA.y} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 4" markerEnd={`url(#${arrowA})`} />
      <line x1={origin.x} y1={origin.y} x2={endB.x} y2={endB.y} stroke="var(--gold)" strokeWidth={2} strokeDasharray="6 4" markerEnd={`url(#${arrowB})`} />
      <circle cx={pTarget.x} cy={pTarget.y} r={6} fill="var(--err)" stroke="var(--surface)" strokeWidth={1.5} />
    </g>
  );
}

/** BigInt-safe SVG vector-space diagram showing button rays, combination path, and target prize. */
export function ClawVectorDiagram({ frame, config }: ClawVectorDiagramProps) {
  const uid = useId();
  const arrowA = `${uid}-arrow-a`;
  const arrowB = `${uid}-arrow-b`;
  const target = frame.machine.targetPrize(config);
  const spanX = bigMax(1n, target.x, frame.machine.buttonA.x, frame.machine.buttonB.x);
  const spanY = bigMax(1n, target.y, frame.machine.buttonA.y, frame.machine.buttonB.y);
  const origin = toSvg(0, 0);
  const pTarget = toSvg(normRatio(target.x, spanX), normRatio(target.y, spanY));
  const xEnd = PAD_L + PLOT_W;
  const yBot = PAD_T + PLOT_H;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Vector space diagram for machine ${frame.machineIndex + 1}`}
      style={{ width: '100%', maxWidth: VB_W, display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
    >
      <defs>
        <marker id={arrowA} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent)" />
        </marker>
        <marker id={arrowB} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--gold)" />
        </marker>
      </defs>
      <line x1={PAD_L} y1={yBot} x2={xEnd} y2={yBot} stroke="var(--border)" strokeWidth={1.5} />
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={yBot} stroke="var(--border)" strokeWidth={1.5} />
      <text x={PAD_L - 6} y={yBot + 14} textAnchor="end" fontSize={11} fill="var(--muted)">0</text>
      <text x={xEnd} y={yBot + 18} textAnchor="end" fontSize={11} fill="var(--muted)">X: {formatAxis(spanX)}</text>
      <text x={PAD_L - 6} y={PAD_T + 8} textAnchor="end" fontSize={11} fill="var(--muted)">Y: {formatAxis(spanY)}</text>
      {frame.outcome.winnable ? (
        <WinnablePath frame={frame} origin={origin} pTarget={pTarget} spanX={spanX} spanY={spanY} arrowA={arrowA} arrowB={arrowB} />
      ) : (
        <UnwinnableRays frame={frame} origin={origin} pTarget={pTarget} spanX={spanX} spanY={spanY} arrowA={arrowA} arrowB={arrowB} />
      )}
      <circle cx={origin.x} cy={origin.y} r={4} fill="var(--text)" />
    </svg>
  );
}
