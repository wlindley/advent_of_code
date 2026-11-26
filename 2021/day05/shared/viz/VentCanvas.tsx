import { useEffect, useRef } from 'react';
import { ViewportTransform, type VentField, type VentPoint, type VentSelectionPolicy, type VentTraceFrame } from '../index';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const CANVAS_PADDING = 18;

export interface VentCanvasProps {
  readonly field: VentField;
  readonly policy: VentSelectionPolicy;
  readonly frames: readonly VentTraceFrame[];
  readonly activeIndex: number;
}

interface CanvasPalette {
  readonly surface: string;
  readonly border: string;
  readonly muted: string;
  readonly accent: string;
  readonly warn: string;
  readonly gold: string;
  readonly err: string;
  readonly text: string;
}

function readToken(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const val = styles.getPropertyValue(name).trim();
  return val.length > 0 ? val : fallback;
}

function resolveCanvasColors(canvas: HTMLCanvasElement): CanvasPalette {
  const styles = getComputedStyle(canvas);
  return {
    surface: readToken(styles, '--surface', '#ffffff'),
    border: readToken(styles, '--border', '#d0d7de'),
    muted: readToken(styles, '--muted', '#59636e'),
    accent: readToken(styles, '--accent', '#0969da'),
    warn: readToken(styles, '--warn', '#bc4c00'),
    gold: readToken(styles, '--gold', '#9a6700'),
    err: readToken(styles, '--err', '#cf222e'),
    text: readToken(styles, '--text', '#1f2328'),
  };
}

function drawSegments(
  ctx: CanvasRenderingContext2D, field: VentField, policy: VentSelectionPolicy,
  processedCount: number, vp: ViewportTransform, colors: CanvasPalette,
): void {
  const lastIdx = processedCount - 1;
  for (let i = 0; i < processedCount; i += 1) {
    const seg = field.segments[i]!;
    const included = policy.includes(seg);
    const isLatest = i === lastIdx;
    ctx.setLineDash(included ? [] : [4, 4]);
    ctx.strokeStyle = included ? (isLatest ? colors.text : colors.accent) : (isLatest ? colors.warn : colors.muted);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.globalAlpha = isLatest ? 0.95 : included ? 0.45 : 0.35;
    ctx.lineWidth = isLatest ? 2.4 : included ? 1.5 : 1;
    const x1 = vp.toCanvasX(seg.start.x);
    const y1 = vp.toCanvasY(seg.start.y);
    if (seg.start.equals(seg.end)) {
      ctx.beginPath();
      ctx.arc(x1, y1, isLatest ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(vp.toCanvasX(seg.end.x), vp.toCanvasY(seg.end.y));
      ctx.stroke();
    }
  }
}

function drawPointSet(ctx: CanvasRenderingContext2D, points: readonly VentPoint[], vp: ViewportTransform, color: string, radius: number): void {
  if (points.length === 0) return;
  ctx.fillStyle = color;
  for (const pt of points) {
    ctx.beginPath();
    ctx.arc(vp.toCanvasX(pt.x), vp.toCanvasY(pt.y), radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderVentCanvas(
  canvas: HTMLCanvasElement, field: VentField, policy: VentSelectionPolicy,
  frames: readonly VentTraceFrame[], activeIndex: number,
): void {
  const ctx = canvas.getContext('2d');
  const activeFrame = frames[activeIndex];
  if (ctx === null || activeFrame === undefined) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = resolveCanvasColors(canvas);
  const vp = new ViewportTransform(field.bounds, CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_PADDING);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
  drawSegments(ctx, field, policy, activeFrame.processedSegmentCount, vp, colors);
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.9;
  const overlapRadius = Math.max(2, Math.min(4.5, vp.scale * 0.28));
  const intenseRadius = Math.max(2.6, Math.min(5.5, vp.scale * 0.36));
  for (let i = 0; i <= activeIndex; i += 1) drawPointSet(ctx, frames[i]!.addedOverlaps, vp, colors.gold, overlapRadius);
  for (let i = 0; i <= activeIndex; i += 1) drawPointSet(ctx, frames[i]!.addedIntense, vp, colors.err, intenseRadius);
  ctx.globalAlpha = 1;
}

/** HiDPI Canvas 2D renderer for hydrothermal vent segments and overlap hotspots. */
export function VentCanvas({ field, policy, frames, activeIndex }: VentCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeFrame = frames[activeIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas !== null) renderVentCanvas(canvas, field, policy, frames, activeIndex);
  }, [field, policy, frames, activeIndex]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
      aria-label={`Hydrothermal vent grid: ${activeFrame ? `${activeFrame.overlapCount} overlaps, ${activeFrame.intenseCount} intense` : 'empty'}`}
    />
  );
}
