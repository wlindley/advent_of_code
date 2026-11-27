import { useEffect, useRef } from 'react';
import { formatDonutStatus, type DonutRenderMetrics, type DonutTraceFrame, type PortalNode } from '../index';

interface Palette {
  readonly bg: string;
  readonly surface: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly gold: string;
  readonly ok: string;
  readonly warn: string;
  readonly err: string;
}

const tok = (s: CSSStyleDeclaration, k: string, fb: string): string => s.getPropertyValue(k).trim() || fb;

function readPalette(canvas: HTMLCanvasElement): Palette {
  const s = getComputedStyle(canvas);
  return {
    bg: tok(s, '--bg', '#f6f8fa'),
    surface: tok(s, '--surface', '#ffffff'),
    border: tok(s, '--border', '#d0d7de'),
    text: tok(s, '--text', '#1f2328'),
    muted: tok(s, '--muted', '#59636e'),
    accent: tok(s, '--accent', '#0969da'),
    gold: tok(s, '--gold', '#9a6700'),
    ok: tok(s, '--ok', '#1a7f37'),
    warn: tok(s, '--warn', '#bc4c00'),
    err: tok(s, '--err', '#cf222e'),
  };
}

function drawMazeCells(ctx: CanvasRenderingContext2D, frame: DonutTraceFrame, m: DonutRenderMetrics, p: Palette): void {
  const { maze } = frame;
  const cs = m.cellSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.max(7, Math.floor(cs * 0.65))}px ui-monospace, monospace`;
  for (let r = 0; r < maze.rows; r += 1) {
    for (let c = 0; c < maze.cols; c += 1) {
      const ch = maze.charAt(r, c);
      const [x, y] = [m.pad + c * cs, m.pad + r * cs];
      if (ch === '#') {
        ctx.fillStyle = p.text;
        ctx.fillRect(x, y, cs, cs);
      } else if (ch === '.') {
        ctx.fillStyle = p.surface;
        ctx.fillRect(x, y, cs, cs);
      } else if (ch !== ' ') {
        ctx.fillStyle = p.bg;
        ctx.fillRect(x, y, cs, cs);
        if (cs >= 7) {
          ctx.fillStyle = p.muted;
          ctx.fillText(ch, x + cs / 2, y + cs / 2);
        }
      }
    }
  }
}

function portalColor(portal: PortalNode, startId: number, goalId: number, p: Palette): string {
  if (portal.id === startId || portal.id === goalId) return p.ok;
  return portal.side === 'inner' ? p.accent : p.warn;
}

function drawPortalMarkers(ctx: CanvasRenderingContext2D, frame: DonutTraceFrame, m: DonutRenderMetrics, p: Palette): void {
  const { maze } = frame;
  const cs = m.cellSize;
  const radius = Math.max(2, cs * 0.34);
  for (const portal of maze.portals) {
    ctx.strokeStyle = portalColor(portal, maze.startId, maze.goalId, p);
    ctx.lineWidth = Math.max(1.2, cs * 0.16);
    ctx.beginPath();
    ctx.arc(m.pad + portal.col * cs + cs / 2, m.pad + portal.row * cs + cs / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawWarpArc(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, p: Palette): void {
  const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
  ctx.save();
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx - (y2 - y1) * 0.18, my + (x2 - x1) * 0.18, x2, y2);
  ctx.stroke();
  ctx.restore();
}

const cellCenter = (coord: number, pad: number, cs: number): number => pad + coord * cs + cs / 2;

function drawActiveTrail(ctx: CanvasRenderingContext2D, frame: DonutTraceFrame, m: DonutRenderMetrics, p: Palette): void {
  const cs = m.cellSize;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i <= frame.stepIndex; i += 1) {
    const [prev, cur] = [frame.path[i - 1]!, frame.path[i]!];
    const [x1, y1] = [cellCenter(prev.col, m.pad, cs), cellCenter(prev.row, m.pad, cs)];
    const [x2, y2] = [cellCenter(cur.col, m.pad, cs), cellCenter(cur.row, m.pad, cs)];
    if (cur.warpedVia !== null) {
      drawWarpArc(ctx, x1, y1, x2, y2, p);
    } else {
      ctx.strokeStyle = p.accent;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = Math.max(1.6, cs * 0.28);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  ctx.restore();
  const cur = frame.path[frame.stepIndex]!;
  ctx.fillStyle = cur.warpedVia !== null ? p.gold : p.err;
  ctx.strokeStyle = p.surface;
  ctx.lineWidth = Math.max(1.2, cs * 0.16);
  ctx.beginPath();
  ctx.arc(cellCenter(cur.col, m.pad, cs), cellCenter(cur.row, m.pad, cs), Math.max(2.6, cs * 0.38), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

interface DonutCanvasProps {
  readonly frame: DonutTraceFrame;
  readonly metrics: DonutRenderMetrics;
  readonly tracksDepth: boolean;
}

/** HiDPI light-mode canvas renderer for Day 20 Donut Maze corridors, portals, and warp arcs. */
export function DonutCanvas({ frame, metrics, tracksDepth }: DonutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = metrics.width * dpr;
    canvas.height = metrics.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const p = readPalette(canvas);
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    drawMazeCells(ctx, frame, metrics, p);
    drawPortalMarkers(ctx, frame, metrics, p);
    drawActiveTrail(ctx, frame, metrics, p);
  }, [frame, metrics]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>{formatDonutStatus(frame, tracksDepth)}</span>
        <span className="muted">Grid {frame.maze.rows}×{frame.maze.cols} · Portals {frame.maze.portals.length}</span>
      </div>
      <canvas ref={canvasRef} role="img" aria-label="Donut Maze exploration and portal warp canvas" style={{ width: '100%', maxWidth: `${metrics.width}px`, height: 'auto', display: 'block', margin: '0 auto', borderRadius: '6px', border: '1px solid var(--border)' }} />
    </div>
  );
}
