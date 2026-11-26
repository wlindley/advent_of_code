import { useEffect, useRef } from 'react';
import { CELL_EMPTY, CELL_EXTERIOR, CELL_LAVA, CELL_TRAPPED_AIR, type DropletTraceFrame } from '../index';

const SIZE = 360;
const PAD = 28;

interface SlicePalette {
  readonly surface: string; readonly border: string; readonly text: string; readonly gold: string;
}

export interface DropletSliceCanvasProps { readonly frame: DropletTraceFrame; }

function readPalette(el: HTMLElement): SlicePalette {
  const s = getComputedStyle(el);
  return {
    surface: s.getPropertyValue('--surface').trim() || '#ffffff',
    border: s.getPropertyValue('--border').trim() || '#d0d7de',
    text: s.getPropertyValue('--text').trim() || '#1f2328',
    gold: s.getPropertyValue('--gold').trim() || '#9a6700',
  };
}

function fillCell(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, step: number): void {
  if (kind === CELL_LAVA) ctx.fillStyle = '#334155';
  else if (kind === CELL_EXTERIOR) ctx.fillStyle = 'rgba(8, 145, 178, 0.22)';
  else if (kind === CELL_TRAPPED_AIR) ctx.fillStyle = 'rgba(217, 119, 6, 0.38)';
  else ctx.fillStyle = 'rgba(100, 116, 139, 0.08)';
  ctx.fillRect(x + 0.5, y + 0.5, Math.max(1, step - 1), Math.max(1, step - 1));
}

function drawExposedEdges(
  ctx: CanvasRenderingContext2D, cells: Uint8Array, sizeX: number, sizeY: number,
  lx: number, ly: number, x: number, y: number, step: number, target: number, gold: string,
): void {
  const dirs: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
    [-1, 0, x, y, x, y + step], [1, 0, x + step, y, x + step, y + step],
    [0, -1, x, y, x + step, y], [0, 1, x, y + step, x + step, y + step],
  ];
  ctx.lineWidth = Math.max(1.5, Math.min(3, step * 0.14));
  for (const [dx, dy, x1, y1, x2, y2] of dirs) {
    const nx = lx + dx, ny = ly + dy;
    if (nx < 0 || nx >= sizeX || ny < 0 || ny >= sizeY) continue;
    const nKind = cells[ny * sizeX + nx]!;
    if (nKind !== target && nKind !== CELL_TRAPPED_AIR) continue;
    ctx.strokeStyle = nKind === CELL_TRAPPED_AIR ? '#d97706' : gold;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawSlice(ctx: CanvasRenderingContext2D, frame: DropletTraceFrame, palette: SlicePalette): void {
  const { sizeX, sizeY } = frame.droplet;
  const cells = frame.sliceCells;
  const step = Math.floor((SIZE - PAD * 2) / Math.max(sizeX, sizeY));
  const ox = Math.floor((SIZE - sizeX * step) / 2);
  const oy = Math.floor((SIZE - sizeY * step) / 2) - 4;
  const target = frame.mode === 'exterior' ? CELL_EXTERIOR : CELL_EMPTY;

  for (let ly = 0; ly < sizeY; ly += 1) {
    for (let lx = 0; lx < sizeX; lx += 1) {
      const kind = cells[ly * sizeX + lx]!, x = ox + lx * step, y = oy + ly * step;
      fillCell(ctx, kind, x, y, step);
      if (kind === CELL_LAVA) drawExposedEdges(ctx, cells, sizeX, sizeY, lx, ly, x, y, step, target, palette.gold);
    }
  }
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, sizeX * step, sizeY * step);
  ctx.fillStyle = palette.text;
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`Z = ${frame.worldZ}  |  Cubes: ${frame.sliceLavaCount}  |  Faces: ${frame.sliceExposedFaces}`, 12, SIZE - 10);
}

const STYLE = { display: 'block', width: '100%', maxWidth: `${SIZE}px`, aspectRatio: '1/1', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' } as const;

/** HiDPI Canvas2D XY cross-section at `frame.worldZ` highlighting lava, air, and exposed in-plane edges. */
export function DropletSliceCanvas({ frame }: DropletSliceCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(SIZE * dpr);
    canvas.height = Math.round(SIZE * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const palette = readPalette(canvas);
    ctx.fillStyle = palette.surface;
    ctx.fillRect(0, 0, SIZE, SIZE);
    drawSlice(ctx, frame, palette);
  }, [frame]);
  return <canvas ref={ref} aria-label="2D XY lava droplet slice" style={STYLE} />;
}
