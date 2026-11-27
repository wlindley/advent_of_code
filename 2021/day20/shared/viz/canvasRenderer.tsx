import type { TrenchImage } from '../types';

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 440;
const CANVAS_PADDING = 18;
const VOID_MARGIN_CELLS = 3;

type Rgb = readonly [number, number, number];

interface Palette {
  readonly surface: string; readonly border: string; readonly accent: string; readonly gold: string;
  readonly surfaceRgb: Rgb; readonly borderRgb: Rgb; readonly accentRgb: Rgb; readonly goldRgb: Rgb;
}

function parseRgb(css: string, fallback: Rgb): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(css.trim());
  if (hex !== null) {
    const n = Number.parseInt(hex[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(css.trim());
  return rgb !== null ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : fallback;
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

function tok(style: CSSStyleDeclaration, name: string, fallback: string): string {
  return style.getPropertyValue(name).trim() || fallback;
}

function resolvePalette(canvas: HTMLCanvasElement): Palette {
  const s = getComputedStyle(canvas);
  const surface = tok(s, '--surface', '#ffffff');
  const border = tok(s, '--border', '#d0d7de');
  const accent = tok(s, '--accent', '#0969da');
  const gold = tok(s, '--gold', '#9a6700');
  return {
    surface, border, accent, gold,
    surfaceRgb: parseRgb(surface, [255, 255, 255]),
    borderRgb: parseRgb(border, [208, 215, 222]),
    accentRgb: parseRgb(accent, [9, 105, 218]),
    goldRgb: parseRgb(gold, [154, 103, 0]),
  };
}

function buildBuffer(
  image: TrenchImage, viewW: number, viewH: number, offC: number, offR: number, p: Palette,
): HTMLCanvasElement | null {
  const off = document.createElement('canvas');
  off.width = viewW;
  off.height = viewH;
  const offCtx = off.getContext('2d');
  if (offCtx === null) return null;
  const img = offCtx.createImageData(viewW, viewH);
  const voidRgb = image.background === 1 ? mixRgb(p.surfaceRgb, p.goldRgb, 0.35) : mixRgb(p.surfaceRgb, p.borderRgb, 0.32);
  const litRgb = image.background === 1 ? p.goldRgb : p.accentRgb;
  for (let r = 0; r < viewH; r += 1) {
    for (let c = 0; c < viewW; c += 1) {
      const ir = r - offR;
      const ic = c - offC;
      const inBox = ir >= 0 && ir < image.height && ic >= 0 && ic < image.width;
      const rgb = !inBox ? voidRgb : image.pixelAt(ir, ic) === 1 ? litRgb : p.surfaceRgb;
      const k = (r * viewW + c) * 4;
      img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = 255;
    }
  }
  offCtx.putImageData(img, 0, 0);
  return off;
}

function drawOutlines(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, cell: number,
  viewW: number, viewH: number, offC: number, offR: number, image: TrenchImage, p: Palette,
): void {
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, viewW * cell, viewH * cell);
  ctx.strokeStyle = image.background === 1 ? p.gold : p.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(ox + offC * cell, oy + offR * cell, image.width * cell, image.height * cell);
}

/** Renders the current TrenchImage inside a fixed final viewport with HiDPI crisp pixels. */
export function renderTrenchCanvas(
  canvas: HTMLCanvasElement, image: TrenchImage, finalWidth: number, finalHeight: number,
): void {
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const p = resolvePalette(canvas);
  ctx.fillStyle = p.surface;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const viewW = finalWidth + 2 * VOID_MARGIN_CELLS;
  const viewH = finalHeight + 2 * VOID_MARGIN_CELLS;
  const offC = Math.floor((viewW - image.width) / 2);
  const offR = Math.floor((viewH - image.height) / 2);
  const cell = Math.min((CANVAS_WIDTH - 2 * CANVAS_PADDING) / viewW, (CANVAS_HEIGHT - 2 * CANVAS_PADDING) / viewH);
  const ox = (CANVAS_WIDTH - viewW * cell) / 2;
  const oy = (CANVAS_HEIGHT - viewH * cell) / 2;
  const buffer = buildBuffer(image, viewW, viewH, offC, offR, p);
  if (buffer !== null) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, ox, oy, viewW * cell, viewH * cell);
    ctx.restore();
  }
  drawOutlines(ctx, ox, oy, cell, viewW, viewH, offC, offR, image, p);
}
