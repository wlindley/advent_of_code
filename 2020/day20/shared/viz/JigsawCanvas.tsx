import { useEffect, useRef } from 'react';
import type { JigsawCellCode, JigsawTraceFrame } from '../index';

export interface JigsawCanvasProps {
  readonly frame: JigsawTraceFrame;
}

interface Palette {
  readonly surface: string;
  readonly bg: string;
  readonly border: string;
  readonly accent: string;
  readonly ok: string;
  readonly gold: string;
}

function readToken(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

function resolvePalette(canvas: HTMLCanvasElement): Palette {
  const s = getComputedStyle(canvas);
  return {
    surface: readToken(s, '--surface', '#ffffff'),
    bg: readToken(s, '--bg', '#f6f8fa'),
    border: readToken(s, '--border', '#d0d7de'),
    accent: readToken(s, '--accent', '#0969da'),
    ok: readToken(s, '--ok', '#1a7f37'),
    gold: readToken(s, '--gold', '#9a6700'),
  };
}

function cellColor(code: JigsawCellCode, palette: Palette): string {
  if (code === 0) return palette.bg;
  if (code === 1) return palette.surface;
  if (code === 3) return palette.gold;
  if (code === 4) return palette.ok;
  return palette.accent;
}

function drawCornerHighlight(ctx: CanvasRenderingContext2D, gridSide: number, pad: number, tilePx: number, gold: string): void {
  const last = gridSide - 1;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  for (const [tr, tc] of [[0, 0], [0, last], [last, 0], [last, last]] as const) {
    ctx.strokeRect(pad + tc * tilePx + 1, pad + tr * tilePx + 1, tilePx - 2, tilePx - 2);
  }
}

function drawTileSeams(ctx: CanvasRenderingContext2D, frame: JigsawTraceFrame, pad: number, cell: number, palette: Palette): void {
  const span = frame.pixelSide * cell;
  if (frame.borderless) {
    ctx.strokeStyle = frame.phase === 'monsters' ? palette.ok : palette.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, span, span);
    return;
  }
  const tilePx = frame.tileSize * cell;
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= frame.gridSide; i += 1) {
    const pos = pad + i * tilePx;
    ctx.beginPath();
    ctx.moveTo(pos, pad);
    ctx.lineTo(pos, pad + span);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad, pos);
    ctx.lineTo(pad + span, pos);
    ctx.stroke();
  }
  if (frame.phase === 'corners') drawCornerHighlight(ctx, frame.gridSide, pad, tilePx, palette.gold);
}

function renderJigsawCanvas(canvas: HTMLCanvasElement, frame: JigsawTraceFrame): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const palette = resolvePalette(canvas);
  const cell = Math.max(2, Math.min(12, Math.floor(576 / frame.pixelSide)));
  const pad = 8;
  const logicalSize = frame.pixelSide * cell + pad * 2;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(logicalSize * dpr);
  canvas.height = Math.round(logicalSize * dpr);
  canvas.style.width = `${logicalSize}px`;
  canvas.style.height = `${logicalSize}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, logicalSize, logicalSize);
  for (let r = 0; r < frame.pixelSide; r += 1) {
    for (let c = 0; c < frame.pixelSide; c += 1) {
      ctx.fillStyle = cellColor(frame.cellCodeAt(r, c), palette);
      ctx.fillRect(pad + c * cell, pad + r * cell, cell, cell);
    }
  }
  drawTileSeams(ctx, frame, pad, cell, palette);
}

/** HiDPI Canvas 2D mosaic renderer for tile assembly, corners, and sea monsters. */
export function JigsawCanvas({ frame }: JigsawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) renderJigsawCanvas(canvas, frame);
  }, [frame]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}># Tile Signal</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Corner Tile</span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Sea Monster</span>
        <span className="badge muted">. Empty / Water</span>
      </div>
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <canvas ref={canvasRef} role="img" aria-label={`Jurassic Jigsaw ${frame.phase} mosaic (${frame.pixelSide} by ${frame.pixelSide})`} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </div>
    </div>
  );
}
