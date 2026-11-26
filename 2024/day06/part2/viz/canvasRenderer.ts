import type { CellCoord, LabMap } from '../../shared';
import type { LoopCandidateFrame } from '../domain';

function drawFloorplan(ctx: CanvasRenderingContext2D, map: LabMap, cs: number): void {
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const x = c * cs;
      const y = r * cs;
      ctx.fillStyle = map.isObstacle(r, c) ? '#24292f' : '#ffffff';
      ctx.fillRect(x, y, cs, cs);
      if (cs >= 8) {
        ctx.strokeStyle = '#d0d7de';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      }
    }
  }
}

function drawObstructionPins(
  ctx: CanvasRenderingContext2D,
  obstructions: readonly CellCoord[],
  active: CellCoord | null,
  cs: number,
): void {
  const pad = Math.max(1, cs * 0.14);
  for (let i = 0; i < obstructions.length; i += 1) {
    const o = obstructions[i]!;
    ctx.fillStyle = 'rgba(207, 34, 46, 0.22)';
    ctx.strokeStyle = 'rgba(207, 34, 46, 0.65)';
    ctx.lineWidth = 1;
    ctx.fillRect(o.col * cs + pad, o.row * cs + pad, cs - pad * 2, cs - pad * 2);
    ctx.strokeRect(o.col * cs + pad, o.row * cs + pad, cs - pad * 2, cs - pad * 2);
  }
  if (!active) return;
  const x = active.col * cs;
  const y = active.row * cs;
  ctx.fillStyle = '#cf222e';
  ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.2, cs * 0.1);
  ctx.beginPath();
  ctx.moveTo(x + pad * 1.5, y + pad * 1.5);
  ctx.lineTo(x + cs - pad * 1.5, y + cs - pad * 1.5);
  ctx.moveTo(x + cs - pad * 1.5, y + pad * 1.5);
  ctx.lineTo(x + pad * 1.5, y + cs - pad * 1.5);
  ctx.stroke();
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  vertices: readonly CellCoord[],
  cs: number,
  strokeStyle: string,
  dashed: boolean,
): void {
  if (vertices.length < 2) return;
  const half = cs / 2;
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = Math.max(1.6, cs * 0.14);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dashed) ctx.setLineDash([Math.max(4, cs * 0.24), Math.max(3, cs * 0.16)]);
  ctx.beginPath();
  for (let i = 0; i < vertices.length; i += 1) {
    const v = vertices[i]!;
    const px = v.col * cs + half;
    const py = v.row * cs + half;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawTurnsAndStart(
  ctx: CanvasRenderingContext2D,
  map: LabMap,
  frame: LoopCandidateFrame | null,
  cs: number,
): void {
  const half = cs / 2;
  if (frame) {
    ctx.fillStyle = '#d97706';
    const dotR = Math.max(1.8, cs * 0.17);
    for (let i = 0; i < frame.cycleVertices.length - 1; i += 1) {
      const v = frame.cycleVertices[i]!;
      ctx.beginPath();
      ctx.arc(v.col * cs + half, v.row * cs + half, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#9a6700';
  ctx.lineWidth = Math.max(1.6, cs * 0.13);
  ctx.beginPath();
  ctx.arc(map.startCol * cs + half, map.startRow * cs + half, Math.max(2.6, cs * 0.3), 0, Math.PI * 2);
  ctx.stroke();
}

/** Renders the lab floorplan, all loop obstruction candidates, approach path, and closed loop cycle. */
export function renderLoopObstructionsCanvas(
  canvas: HTMLCanvasElement,
  map: LabMap,
  obstructions: readonly CellCoord[],
  activeFrame: LoopCandidateFrame | null,
  dpr = 1,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cs = Math.max(3, Math.min(36, Math.floor(520 / Math.max(map.rows, map.cols))));
  const width = map.cols * cs;
  const height = map.rows * cs;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  drawFloorplan(ctx, map, cs);
  drawObstructionPins(ctx, obstructions, activeFrame ? activeFrame.obstruction : null, cs);
  if (activeFrame) {
    drawPolyline(ctx, activeFrame.approachVertices, cs, '#0969da', true);
    drawPolyline(ctx, activeFrame.cycleVertices, cs, '#cf222e', false);
  }
  drawTurnsAndStart(ctx, map, activeFrame, cs);
}
