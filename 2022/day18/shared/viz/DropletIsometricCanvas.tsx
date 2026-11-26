import { useEffect, useRef } from 'react';
import { CELL_LAVA, type DropletTraceFrame } from '../index';

const CANVAS_W = 460;
const CANVAS_H = 380;

interface IsoContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly slices: readonly Uint8Array[];
  readonly yaw: number;
  readonly nx: number;
  readonly ny: number;
  readonly spanX: number;
  readonly spanY: number;
  readonly activeLz: number;
  readonly sizeX: number;
  readonly hw: number;
  readonly hh: number;
  readonly vz: number;
  readonly originX: number;
  readonly originY: number;
  readonly gold: string;
}

export interface DropletIsometricCanvasProps {
  readonly frame: DropletTraceFrame;
  readonly yaw: number;
}

function unrotate(rx: number, ry: number, yaw: number, nx: number, ny: number): readonly [number, number] {
  const step = ((yaw % 4) + 4) % 4;
  if (step === 1) return [ry, ny - 1 - rx];
  if (step === 2) return [nx - 1 - rx, ny - 1 - ry];
  if (step === 3) return [nx - 1 - ry, rx];
  return [rx, ry];
}

function isLava(slices: readonly Uint8Array[], sizeX: number, lz: number, ux: number, uy: number): boolean {
  const slice = slices[lz];
  return Boolean(slice && slice[(uy + 1) * sizeX + (ux + 1)] === CELL_LAVA);
}

function fillQuad(ctx: CanvasRenderingContext2D, pts: ReadonlyArray<readonly [number, number]>, fill: string, stroke: string | null): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (!stroke) return;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawVoxel(d: IsoContext, rx: number, ry: number, lz: number): void {
  const [ux, uy] = unrotate(rx, ry, d.yaw, d.nx, d.ny);
  if (!isLava(d.slices, d.sizeX, lz, ux, uy)) return;
  const cx = d.originX + (rx - ry) * d.hw;
  const cy = d.originY + (rx + ry) * d.hh - (lz - 1) * d.vz;
  const active = lz === d.activeLz;
  const stroke = d.hw >= 4.5 ? 'rgba(15, 23, 42, 0.28)' : null;

  if (active || !isLava(d.slices, d.sizeX, lz + 1, ux, uy)) {
    fillQuad(d.ctx, [[cx, cy - d.hh], [cx + d.hw, cy], [cx, cy + d.hh], [cx - d.hw, cy]], active ? '#eab308' : '#64748b', stroke);
  }
  const [rxNx, rxNy] = unrotate(rx + 1, ry, d.yaw, d.nx, d.ny);
  if (rx + 1 >= d.spanX || !isLava(d.slices, d.sizeX, lz, rxNx, rxNy)) {
    fillQuad(d.ctx, [[cx, cy + d.hh], [cx + d.hw, cy], [cx + d.hw, cy + d.vz], [cx, cy + d.hh + d.vz]], active ? d.gold : '#334155', stroke);
  }
  const [ryNx, ryNy] = unrotate(rx, ry + 1, d.yaw, d.nx, d.ny);
  if (ry + 1 >= d.spanY || !isLava(d.slices, d.sizeX, lz, ryNx, ryNy)) {
    fillQuad(d.ctx, [[cx - d.hw, cy], [cx, cy + d.hh], [cx, cy + d.hh + d.vz], [cx - d.hw, cy + d.vz]], active ? '#ca8a04' : '#475569', stroke);
  }
}

function buildContext(ctx: CanvasRenderingContext2D, frame: DropletTraceFrame, yaw: number, gold: string): IsoContext {
  const { droplet, activeLz } = frame;
  const nx = droplet.sizeX - 2;
  const ny = droplet.sizeY - 2;
  const nz = droplet.sizeZ - 2;
  const odd = ((yaw % 2) + 2) % 2 === 1;
  const spanX = odd ? ny : nx;
  const spanY = odd ? nx : ny;
  const unit = Math.min(28, (CANVAS_W - 44) / ((spanX + spanY) * 0.866), (CANVAS_H - 52) / ((spanX + spanY) * 0.45 + nz * 0.92));
  const hw = unit * 0.866;
  const hh = unit * 0.45;
  const vz = unit * 0.92;
  const minY = -(nz - 1) * vz - hh;
  const maxY = (spanX + spanY - 2) * hh + hh + vz;
  const slices: Uint8Array[] = [];
  for (let lz = 0; lz <= activeLz; lz += 1) slices.push(droplet.sliceOccupancy(lz));
  return {
    ctx, slices, yaw, nx, ny, spanX, spanY, activeLz, sizeX: droplet.sizeX,
    hw, hh, vz, originX: CANVAS_W / 2 + ((spanY - spanX) * hw) / 2, originY: (CANVAS_H - (minY + maxY)) / 2, gold,
  };
}

const STYLE = { display: 'block', width: '100%', maxWidth: `${CANVAS_W}px`, aspectRatio: `${CANVAS_W}/${CANVAS_H}`, border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' } as const;

/** HiDPI Canvas2D isometric 3D lava droplet view sliced up to `frame.activeLz`. */
export function DropletIsometricCanvas({ frame, yaw }: DropletIsometricCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CANVAS_W * dpr);
    canvas.height = Math.round(CANVAS_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const styles = getComputedStyle(canvas);
    ctx.fillStyle = styles.getPropertyValue('--surface').trim() || '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const iso = buildContext(ctx, frame, yaw, styles.getPropertyValue('--gold').trim() || '#9a6700');
    for (let lz = 1; lz <= frame.activeLz; lz += 1) {
      for (let ry = 0; ry < iso.spanY; ry += 1) {
        for (let rx = 0; rx < iso.spanX; rx += 1) drawVoxel(iso, rx, ry, lz);
      }
    }
    ctx.fillStyle = styles.getPropertyValue('--muted').trim() || '#59636e';
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`z <= ${frame.worldZ} (yaw ${(((yaw % 4) + 4) % 4) * 90}°)`, 12, CANVAS_H - 10);
  }, [frame, yaw]);
  return <canvas ref={ref} aria-label="3D isometric lava droplet cross-section" style={STYLE} />;
}
