import type { LabMap, PatrolStep } from '../../shared';

function buildVisitCounts(map: LabMap, steps: readonly PatrolStep[], upToIndex: number): Uint16Array {
  const counts = new Uint16Array(map.size);
  const limit = Math.min(upToIndex, steps.length - 1);
  for (let i = 0; i <= limit; i += 1) {
    const step = steps[i]!;
    if (step.action !== 'turn') counts[step.row * map.cols + step.col]! += 1;
  }
  return counts;
}

function drawFloorplan(ctx: CanvasRenderingContext2D, map: LabMap, counts: Uint16Array, cs: number): void {
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      const x = c * cs, y = r * cs, hits = counts[r * map.cols + c]!;
      ctx.fillStyle = map.isObstacle(r, c)
        ? '#24292f'
        : hits > 1 ? 'rgba(26, 127, 55, 0.34)' : hits === 1 ? 'rgba(26, 127, 55, 0.14)' : '#ffffff';
      ctx.fillRect(x, y, cs, cs);
      if (cs >= 8) {
        ctx.strokeStyle = '#d0d7de';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      }
    }
  }
}

function drawTrailPolyline(ctx: CanvasRenderingContext2D, steps: readonly PatrolStep[], limit: number, cs: number): void {
  const half = cs / 2;
  ctx.strokeStyle = 'rgba(26, 127, 55, 0.8)';
  ctx.lineWidth = Math.max(1.5, cs * 0.14);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= limit; i += 1) {
    const s = steps[i]!;
    if (i === 0) ctx.moveTo(s.col * cs + half, s.row * cs + half);
    else if (s.action !== 'turn') ctx.lineTo(s.col * cs + half, s.row * cs + half);
  }
  ctx.stroke();
}

function drawStartAndTurns(ctx: CanvasRenderingContext2D, steps: readonly PatrolStep[], limit: number, cs: number): void {
  const half = cs / 2, first = steps[0]!;
  ctx.strokeStyle = '#9a6700';
  ctx.lineWidth = Math.max(1.5, cs * 0.12);
  ctx.beginPath();
  ctx.arc(first.col * cs + half, first.row * cs + half, Math.max(2.5, cs * 0.28), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#d97706';
  const dotR = Math.max(1.8, cs * 0.16);
  for (let i = 1; i <= limit; i += 1) {
    const s = steps[i]!;
    if (s.action !== 'turn') continue;
    ctx.beginPath();
    ctx.arc(s.col * cs + half, s.row * cs + half, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuardChevron(ctx: CanvasRenderingContext2D, step: PatrolStep, cs: number): void {
  const r = Math.max(3, cs * 0.36);
  ctx.save();
  ctx.translate(step.col * cs + cs / 2, step.row * cs + cs / 2);
  ctx.rotate((step.dir - 1) * (Math.PI / 2));
  ctx.fillStyle = '#0969da';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, cs * 0.08);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(-r * 0.75, -r * 0.75);
  ctx.lineTo(-r * 0.3, 0);
  ctx.lineTo(-r * 0.75, r * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Renders the lab floorplan, visited heatmap, patrol trail, turn corners, and guard chevron. */
export function renderGuardPatrolCanvas(
  canvas: HTMLCanvasElement, map: LabMap, steps: readonly PatrolStep[], stepIndex: number, dpr = 1,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cs = Math.max(3, Math.min(36, Math.floor(520 / Math.max(map.rows, map.cols))));
  const width = map.cols * cs, height = map.rows * cs;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  const limit = Math.min(stepIndex, steps.length - 1);
  drawFloorplan(ctx, map, buildVisitCounts(map, steps, stepIndex), cs);
  if (limit >= 0) {
    drawTrailPolyline(ctx, steps, limit, cs);
    drawStartAndTurns(ctx, steps, limit, cs);
    drawGuardChevron(ctx, steps[limit]!, cs);
  }
}
