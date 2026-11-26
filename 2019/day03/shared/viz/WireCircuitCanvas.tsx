import { useEffect, useRef } from 'react';
import {
  projectPoint,
  type Viewport,
  type WireBounds,
  type WireSegment,
  type WireTraceFrame,
} from '../index';

interface CircuitPalette {
  readonly surface: string;
  readonly border: string;
  readonly accent: string;
  readonly warn: string;
  readonly gold: string;
  readonly ok: string;
  readonly text: string;
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 440;
const CANVAS_PADDING = 28;
const VIEWPORT: Viewport = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, padding: CANVAS_PADDING };
const CANVAS_STYLE = {
  width: '100%',
  height: 'auto',
  aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'var(--surface)',
  display: 'block',
} as const;

function cssVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

function readPalette(canvas: HTMLCanvasElement): CircuitPalette {
  const styles = getComputedStyle(canvas);
  return {
    surface: cssVar(styles, '--surface', '#ffffff'),
    border: cssVar(styles, '--border', '#d0d7de'),
    accent: cssVar(styles, '--accent', '#0969da'),
    warn: cssVar(styles, '--warn', '#bc4c00'),
    gold: cssVar(styles, '--gold', '#9a6700'),
    ok: cssVar(styles, '--ok', '#1a7f37'),
    text: cssVar(styles, '--text', '#1f2328'),
  };
}

function drawAxes(ctx: CanvasRenderingContext2D, bounds: WireBounds, palette: CircuitPalette): void {
  const origin = projectPoint({ x: 0n, y: 0n }, bounds, VIEWPORT);
  ctx.save();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_PADDING, origin.y);
  ctx.lineTo(CANVAS_WIDTH - CANVAS_PADDING, origin.y);
  ctx.moveTo(origin.x, CANVAS_PADDING);
  ctx.lineTo(origin.x, CANVAS_HEIGHT - CANVAS_PADDING);
  ctx.stroke();
  ctx.restore();
}

function drawWirePath(
  ctx: CanvasRenderingContext2D,
  segments: readonly WireSegment[],
  visibleCount: number,
  bounds: WireBounds,
  color: string,
): void {
  if (visibleCount <= 0) return;
  const start = projectPoint({ x: 0n, y: 0n }, bounds, VIEWPORT);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  let tip = start;
  for (let i = 0; i < visibleCount; i += 1) {
    tip = projectPoint(segments[i]!.end, bounds, VIEWPORT);
    ctx.lineTo(tip.x, tip.y);
  }
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMarkers(ctx: CanvasRenderingContext2D, frame: WireTraceFrame, palette: CircuitPalette): void {
  const origin = projectPoint({ x: 0n, y: 0n }, frame.bounds, VIEWPORT);
  ctx.save();
  for (const crossing of frame.discoveredCrossings) {
    const pt = projectPoint(crossing.point, frame.bounds, VIEWPORT);
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (frame.bestCrossing !== null) {
    const bestPt = projectPoint(frame.bestCrossing.point, frame.bounds, VIEWPORT);
    ctx.strokeStyle = palette.ok;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bestPt.x, bestPt.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = palette.text;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderCircuit(canvas: HTMLCanvasElement, frame: WireTraceFrame): void {
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
  canvas.width = Math.round(CANVAS_WIDTH * dpr);
  canvas.height = Math.round(CANVAS_HEIGHT * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const palette = readPalette(canvas);
  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawAxes(ctx, frame.bounds, palette);
  drawWirePath(ctx, frame.pair.first, frame.firstVisibleCount, frame.bounds, palette.accent);
  drawWirePath(ctx, frame.pair.second, frame.secondVisibleCount, frame.bounds, palette.warn);
  drawMarkers(ctx, frame, palette);
}

/** Responsive HiDPI canvas plotting both wires, origin axes, and discovered crossings. */
export function WireCircuitCanvas({ frame }: { readonly frame: WireTraceFrame }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current !== null) renderCircuit(canvasRef.current, frame);
  }, [frame]);

  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Wire circuit at step ${frame.stepIndex + 1} of ${frame.totalSteps}`}
        style={CANVAS_STYLE}
      />
      <div className="chart-legend muted">
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderTopColor: 'var(--accent)' }} /> Wire 1</span>
        <span className="chart-legend-item"><span className="legend-swatch" style={{ borderTopColor: 'var(--warn)' }} /> Wire 2</span>
        <span className="chart-legend-item">● Origin (0, 0)</span>
        <span className="chart-legend-item" style={{ color: 'var(--gold)' }}>● Crossing</span>
        <span className="chart-legend-item" style={{ color: 'var(--ok)' }}>◎ Best Crossing</span>
      </div>
    </div>
  );
}
