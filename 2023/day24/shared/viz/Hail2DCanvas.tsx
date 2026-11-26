import { useEffect, useRef } from 'react';
import type { HailTrace2DFrame, IntersectionKind } from '../index';

export interface Hail2DCanvasProps {
  readonly frame: HailTrace2DFrame;
}

const SIZE = 520;
const PAD = 24;
const INNER = SIZE - PAD * 2;
const VIEW_MIN = -0.2;
const VIEW_SPAN = 1.4;

const LEGEND: readonly { readonly label: string; readonly color: string }[] = [
  { label: 'Inside (future)', color: '#1a7f37' },
  { label: 'Outside (future)', color: '#9a6700' },
  { label: 'Past (A / B / both)', color: '#bc4c00' },
  { label: 'Active pair', color: '#0969da' },
];

function toCanvasX(nx: number): number {
  return PAD + ((nx - VIEW_MIN) / VIEW_SPAN) * INNER;
}

function toCanvasY(ny: number): number {
  return SIZE - PAD - ((ny - VIEW_MIN) / VIEW_SPAN) * INNER;
}

function dotColor(kind: Exclude<IntersectionKind, 'parallel'>): string {
  if (kind === 'inside') return '#1a7f37';
  if (kind === 'outside') return '#9a6700';
  return '#bc4c00';
}

function drawBox(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const x0 = toCanvasX(0);
  const y0 = toCanvasY(1);
  const w = toCanvasX(1) - x0;
  const h = toCanvasY(0) - y0;
  ctx.save();
  ctx.fillStyle = 'rgba(9, 105, 218, 0.04)';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = '#0969da';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x0, y0, w, h);
  ctx.restore();
  ctx.fillStyle = '#59636e';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('Test Area [0..1]²', x0 + 6, y0 + 14);
}

function drawRays(ctx: CanvasRenderingContext2D, frame: HailTrace2DFrame): void {
  const activeA = frame.activePair?.indexA ?? -1;
  const activeB = frame.activePair?.indexB ?? -1;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
  ctx.beginPath();
  for (let i = 0; i < frame.rays.length; i += 1) {
    const r = frame.rays[i]!;
    if (r.hailstoneId === activeA || r.hailstoneId === activeB) continue;
    ctx.moveTo(toCanvasX(r.x1), toCanvasY(r.y1));
    ctx.lineTo(toCanvasX(r.x2), toCanvasY(r.y2));
  }
  ctx.stroke();

  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#0969da';
  ctx.beginPath();
  for (let i = 0; i < frame.rays.length; i += 1) {
    const r = frame.rays[i]!;
    if (r.hailstoneId !== activeA && r.hailstoneId !== activeB) continue;
    ctx.moveTo(toCanvasX(r.x1), toCanvasY(r.y1));
    ctx.lineTo(toCanvasX(r.x2), toCanvasY(r.y2));
  }
  ctx.stroke();
}

function drawDots(ctx: CanvasRenderingContext2D, frame: HailTrace2DFrame): void {
  const activeA = frame.activePair?.indexA ?? -1;
  const activeB = frame.activePair?.indexB ?? -1;
  const dots = frame.visibleIntersections;
  for (let i = 0; i < frame.visiblePrefixCount; i += 1) {
    const d = dots[i]!;
    const cx = toCanvasX(d.x);
    const cy = toCanvasY(d.y);
    const isActive = d.indexA === activeA && d.indexB === activeB;
    ctx.fillStyle = dotColor(d.kind);
    ctx.beginPath();
    ctx.arc(cx, cy, isActive ? 4.5 : 2.8, 0, Math.PI * 2);
    ctx.fill();
    if (isActive) {
      ctx.strokeStyle = '#1f2328';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

/** HiDPI 2D XY canvas rendering clipped hailstone rays, test-area box, and crossings. */
export function Hail2DCanvas({ frame }: Hail2DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(SIZE * dpr);
    canvas.height = Math.round(SIZE * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBox(ctx);
    drawRays(ctx, frame);
    drawDots(ctx, frame);
  }, [frame]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', alignItems: 'flex-start' }}>
      <canvas
        ref={canvasRef}
        aria-label={`Hailstone 2D intersection canvas at pair ${frame.step} of ${frame.totalPairs}`}
        style={{
          width: `${SIZE}px`,
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', fontSize: '0.8rem', color: 'var(--text)' }}>
        {LEGEND.map((item) => (
          <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: item.color,
                display: 'inline-block',
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
