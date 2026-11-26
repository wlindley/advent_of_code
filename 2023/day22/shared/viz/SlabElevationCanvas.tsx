import { type MouseEvent, useEffect, useMemo, useRef } from 'react';
import type { Bounds3D, SettledBrick, SettledStack, SlabTraceFrame, SupportGraph } from '../index';
import { formatBrickLabel } from '../index';

export interface SlabElevationCanvasProps {
  readonly stack: SettledStack; readonly graph: SupportGraph; readonly initialBounds: Bounds3D;
  readonly frame: SlabTraceFrame; readonly selectedIndex: number | null;
  readonly cascadeIndices: readonly number[]; readonly onSelectBrick: (index: number | null) => void;
}

const PAD = 20, TOP = 26, GAP = 26, VIEW_W = 320;
const COLORS = {
  bg: '#ffffff', grid: '#e6ebf1', ground: '#59636e', airborne: 'rgba(89, 99, 110, 0.24)',
  settled: '#4b6b88', last: '#0969da', trail: 'rgba(9, 105, 218, 0.18)',
  safe: '#1a7f37', loadBearing: '#bf8700', cascade: '#cf222e', selected: '#1f2328',
};
const LEGEND: readonly (readonly [string, string])[] = [
  ['Safe', COLORS.safe], ['Load-bearing', COLORS.loadBearing], ['Cascade fall', COLORS.cascade],
  ['Selected', COLORS.selected], ['Dropping', COLORS.last], ['Airborne', COLORS.airborne],
];

function computeViewH(maxZ: number): number {
  return Math.min(340, Math.max(160, maxZ * Math.min(28, Math.max(2, Math.floor(320 / maxZ)))));
}

function brickRect(b: SettledBrick, z1: number, z2: number, isFront: boolean, bounds: Bounds3D, viewH: number, maxZ: number) {
  const ox = isFront ? PAD : PAD + VIEW_W + GAP;
  const span = isFront ? bounds.xMax - bounds.xMin + 1 : bounds.yMax - bounds.yMin + 1;
  const minC = isFront ? bounds.xMin : bounds.yMin;
  const scale = VIEW_W / span;
  const zScale = viewH / maxZ;
  const a1 = isFront ? b.xMin : b.yMin;
  const a2 = isFront ? b.xMax : b.yMax;
  return { x: ox + (a1 - minC) * scale, y: TOP + viewH - z2 * zScale, w: Math.max(2, (a2 - a1 + 1) * scale), h: Math.max(2, (z2 - z1 + 1) * zScale) };
}

function brickColor(i: number, frame: SlabTraceFrame, graph: SupportGraph, selected: number | null, cascade: ReadonlySet<number>): string {
  if (i >= frame.settledCount) return COLORS.airborne;
  if (!frame.isFinal) return i === frame.lastBrickIndex ? COLORS.last : COLORS.settled;
  if (cascade.has(i)) return COLORS.cascade;
  if (i === selected) return COLORS.selected;
  return graph.isSafe(i) ? COLORS.safe : COLORS.loadBearing;
}

function drawBrick(
  ctx: CanvasRenderingContext2D, b: SettledBrick, i: number, frame: SlabTraceFrame,
  graph: SupportGraph, bounds: Bounds3D, viewH: number, isFront: boolean,
  selected: number | null, cascade: ReadonlySet<number>,
): void {
  const settled = i < frame.settledCount;
  const r = brickRect(b, settled ? b.zMin : b.initialZMin, settled ? b.zMax : b.initialZMin + b.height - 1, isFront, bounds, viewH, bounds.zMax);
  if (!frame.isFinal && i === frame.lastBrickIndex && b.dropDistance > 0) {
    const air = brickRect(b, b.initialZMin, b.initialZMin + b.height - 1, isFront, bounds, viewH, bounds.zMax);
    ctx.fillStyle = COLORS.trail;
    ctx.fillRect(r.x, air.y, r.w, r.y + r.h - air.y);
  }
  ctx.fillStyle = brickColor(i, frame, graph, selected, cascade);
  ctx.fillRect(r.x + 0.5, r.y + 0.5, Math.max(1, r.w - 1), Math.max(1, r.h - 1));
  if (i === selected && frame.isFinal) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 1, r.y + 1, Math.max(1, r.w - 2), Math.max(1, r.h - 2));
    ctx.lineWidth = 1;
  }
  if (r.w >= 16 && r.h >= 12) {
    ctx.fillStyle = settled ? '#ffffff' : '#1f2328'; ctx.font = '600 11px ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(formatBrickLabel(b.id), r.x + r.w / 2, r.y + r.h / 2);
  }
}

function drawProjection(
  ctx: CanvasRenderingContext2D, stack: SettledStack, graph: SupportGraph, bounds: Bounds3D,
  frame: SlabTraceFrame, viewH: number, isFront: boolean, selected: number | null, cascade: ReadonlySet<number>,
): void {
  const ox = isFront ? PAD : PAD + VIEW_W + GAP;
  ctx.fillStyle = '#1f2328';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(isFront ? 'Front Projection (X-Z)' : 'Side Projection (Y-Z)', ox, 17);
  ctx.strokeStyle = COLORS.grid;
  ctx.strokeRect(ox, TOP, VIEW_W, viewH);
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(ox, TOP + viewH, VIEW_W, 3);
  for (let i = 0; i < stack.length; i += 1) {
    drawBrick(ctx, stack.bricks[i]!, i, frame, graph, bounds, viewH, isFront, selected, cascade);
  }
}

/** Dual X-Z / Y-Z orthographic elevation canvas with click-to-inspect cascades. */
export function SlabElevationCanvas({
  stack, graph, initialBounds, frame, selectedIndex, cascadeIndices, onSelectBrick,
}: SlabElevationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewH = useMemo(() => computeViewH(initialBounds.zMax), [initialBounds.zMax]);
  const width = PAD * 2 + VIEW_W * 2 + GAP;
  const height = TOP + viewH + 22;
  const cascadeSet = useMemo(() => new Set(cascadeIndices), [cascadeIndices]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    drawProjection(ctx, stack, graph, initialBounds, frame, viewH, true, selectedIndex, cascadeSet);
    drawProjection(ctx, stack, graph, initialBounds, frame, viewH, false, selectedIndex, cascadeSet);
  }, [stack, graph, initialBounds, frame, width, height, viewH, selectedIndex, cascadeSet]);

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !frame.isFinal) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) * width) / rect.width;
    const py = ((event.clientY - rect.top) * height) / rect.height;
    const inFront = px >= PAD && px <= PAD + VIEW_W;
    const inSide = px >= PAD + VIEW_W + GAP && px <= PAD + VIEW_W * 2 + GAP;
    if (!inFront && !inSide) { onSelectBrick(null); return; }
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const b = stack.bricks[i]!;
      const r = brickRect(b, b.zMin, b.zMax, inFront, initialBounds, viewH, initialBounds.zMax);
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        onSelectBrick(i === selectedIndex ? null : i);
        return;
      }
    }
    onSelectBrick(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        aria-label="Sand slabs dual orthographic elevation projection"
        style={{ width: `${width}px`, maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border)', cursor: frame.isFinal ? 'pointer' : 'default' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', fontSize: '0.8rem', color: 'var(--text)' }}>
        {LEGEND.map(([label, color]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, border: '1px solid var(--border)', display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
