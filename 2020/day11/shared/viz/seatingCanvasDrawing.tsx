import type { SeatGraph, SeatingLayout, SeatingTraceFrame, SeatVisualState } from '../index';

export interface CanvasPalette {
  readonly bg: string;
  readonly surface: string;
  readonly border: string;
  readonly accent: string;
  readonly ok: string;
  readonly err: string;
  readonly gold: string;
}

export interface CanvasGeom {
  readonly pad: number;
  readonly cellSize: number;
  readonly width: number;
  readonly height: number;
}

function readToken(styles: CSSStyleDeclaration, token: string, fallback: string): string {
  const val = styles.getPropertyValue(token).trim();
  return val.length > 0 ? val : fallback;
}

export function resolvePalette(canvas: HTMLCanvasElement): CanvasPalette {
  const s = getComputedStyle(canvas);
  return {
    bg: readToken(s, '--bg', '#f6f8fa'),
    surface: readToken(s, '--surface', '#ffffff'),
    border: readToken(s, '--border', '#d0d7de'),
    accent: readToken(s, '--accent', '#0969da'),
    ok: readToken(s, '--ok', '#1a7f37'),
    err: readToken(s, '--err', '#cf222e'),
    gold: readToken(s, '--gold', '#9a6700'),
  };
}

export function computeCanvasGeom(layout: SeatingLayout): CanvasGeom {
  const pad = 10;
  const cellSize = Math.max(4, Math.min(36, Math.floor(Math.min(680 / layout.cols, 560 / layout.rows))));
  return { pad, cellSize, width: layout.cols * cellSize + pad * 2, height: layout.rows * cellSize + pad * 2 };
}

function fillForState(state: SeatVisualState, palette: CanvasPalette): string {
  if (state === 1) return palette.accent;
  if (state === 2) return palette.ok;
  if (state === 3) return palette.err;
  return palette.surface;
}

function drawSeatCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: number,
  state: SeatVisualState,
  cellSize: number,
  palette: CanvasPalette,
): void {
  ctx.fillStyle = fillForState(state, palette);
  ctx.fillRect(x, y, side, side);
  if (state === 0 && cellSize >= 7) {
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, side - 1, side - 1);
  }
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  layout: SeatingLayout,
  frame: SeatingTraceFrame,
  geom: CanvasGeom,
  palette: CanvasPalette,
): void {
  const gap = geom.cellSize >= 8 ? 1 : 0.25;
  for (let r = 0; r < layout.rows; r += 1) {
    for (let c = 0; c < layout.cols; c += 1) {
      const seatIdx = layout.seatIndexAt(r, c);
      const x = geom.pad + c * geom.cellSize + gap;
      const y = geom.pad + r * geom.cellSize + gap;
      const side = geom.cellSize - gap * 2;
      if (seatIdx !== null) {
        drawSeatCell(ctx, x, y, side, frame.stateAt(seatIdx), geom.cellSize, palette);
      } else if (geom.cellSize >= 10) {
        ctx.fillStyle = palette.border;
        ctx.beginPath();
        ctx.arc(x + side / 2, y + side / 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawInspectorRays(
  ctx: CanvasRenderingContext2D,
  layout: SeatingLayout,
  graph: SeatGraph,
  seatIdx: number,
  geom: CanvasGeom,
  palette: CanvasPalette,
): void {
  const origin = layout.coordOf(seatIdx);
  const ox = geom.pad + (origin.col + 0.5) * geom.cellSize;
  const oy = geom.pad + (origin.row + 0.5) * geom.cellSize;
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = Math.max(1.25, geom.cellSize * 0.08);
  for (const neighborIdx of graph.neighborsOf(seatIdx)) {
    const nc = layout.coordOf(neighborIdx);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(geom.pad + (nc.col + 0.5) * geom.cellSize, geom.pad + (nc.row + 0.5) * geom.cellSize);
    ctx.stroke();
    ctx.strokeRect(geom.pad + nc.col * geom.cellSize + 1, geom.pad + nc.row * geom.cellSize + 1, geom.cellSize - 2, geom.cellSize - 2);
  }
  ctx.lineWidth = Math.max(2, geom.cellSize * 0.12);
  ctx.strokeRect(geom.pad + origin.col * geom.cellSize + 1, geom.pad + origin.row * geom.cellSize + 1, geom.cellSize - 2, geom.cellSize - 2);
}

/** Renders the HiDPI seating grid and optional neighbor-ray overlay. */
export function renderSeatingCanvas(
  canvas: HTMLCanvasElement,
  layout: SeatingLayout,
  graph: SeatGraph,
  frame: SeatingTraceFrame,
  geom: CanvasGeom,
  inspectedSeat: number | null,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const palette = resolvePalette(canvas);
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(geom.width * dpr);
  canvas.height = Math.round(geom.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, geom.width, geom.height);
  drawCells(ctx, layout, frame, geom, palette);
  if (inspectedSeat !== null) {
    drawInspectorRays(ctx, layout, graph, inspectedSeat, geom, palette);
  }
}
