import { useEffect, useRef } from 'react';
import { formatVaultStatus, type VaultRenderMetrics, type VaultTraceFrame } from '../index';

interface Palette {
  readonly bg: string;
  readonly surface: string;
  readonly text: string;
  readonly accent: string;
  readonly gold: string;
  readonly ok: string;
  readonly warn: string;
  readonly err: string;
}

function readPalette(canvas: HTMLCanvasElement): Palette {
  const s = getComputedStyle(canvas);
  const tok = (k: string, fb: string) => s.getPropertyValue(k).trim() || fb;
  return {
    bg: tok('--bg', '#f6f8fa'),
    surface: tok('--surface', '#ffffff'),
    text: tok('--text', '#1f2328'),
    accent: tok('--accent', '#0969da'),
    gold: tok('--gold', '#9a6700'),
    ok: tok('--ok', '#1a7f37'),
    warn: tok('--warn', '#bc4c00'),
    err: tok('--err', '#cf222e'),
  };
}

function drawDoorOrKey(
  ctx: CanvasRenderingContext2D,
  frame: VaultTraceFrame,
  r: number,
  c: number,
  cs: number,
  x: number,
  y: number,
  p: Palette,
): void {
  const cell = frame.map.cellOf(r, c);
  const doorBit = frame.map.doorBitAtCell(cell);
  if (doorBit !== 0) {
    const open = (doorBit & frame.collectedMask) !== 0;
    ctx.strokeStyle = open ? p.ok : p.warn;
    ctx.fillStyle = open ? p.bg : p.warn;
    ctx.lineWidth = Math.max(1, cs * 0.12);
    ctx.fillRect(x + 1, y + 1, Math.max(1, cs - 2), Math.max(1, cs - 2));
    if (open) ctx.strokeRect(x + 1, y + 1, Math.max(1, cs - 2), Math.max(1, cs - 2));
    if (cs >= 11) {
      ctx.fillStyle = open ? p.ok : p.surface;
      ctx.fillText(frame.map.grid.at(r, c), x + cs / 2, y + cs / 2);
    }
  }
  const keyId = frame.map.keyIdAtCell(cell);
  if (keyId >= 0) {
    const key = frame.map.keys[keyId]!;
    const held = (key.bit & frame.collectedMask) !== 0;
    ctx.fillStyle = held ? p.ok : p.gold;
    ctx.beginPath();
    ctx.arc(x + cs / 2, y + cs / 2, Math.max(2, cs * (held ? 0.16 : 0.34)), 0, Math.PI * 2);
    ctx.fill();
    if (!held && cs >= 11) {
      ctx.fillStyle = p.surface;
      ctx.fillText(key.letter, x + cs / 2, y + cs / 2);
    }
  }
}

function drawVaultCells(ctx: CanvasRenderingContext2D, frame: VaultTraceFrame, m: VaultRenderMetrics, p: Palette): void {
  const cs = m.cellSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.max(8, Math.floor(cs * 0.56))}px ui-monospace, monospace`;
  for (let r = 0; r < frame.map.rows; r += 1) {
    for (let c = 0; c < frame.map.cols; c += 1) {
      const x = m.pad + c * cs;
      const y = m.pad + r * cs;
      if (frame.map.isWallCell(frame.map.cellOf(r, c))) {
        ctx.fillStyle = p.text;
        ctx.fillRect(x, y, cs, cs);
      } else {
        ctx.fillStyle = p.surface;
        ctx.fillRect(x, y, cs, cs);
        drawDoorOrKey(ctx, frame, r, c, cs, x, y, p);
      }
    }
  }
}

function drawSingleRobot(
  ctx: CanvasRenderingContext2D,
  trail: readonly { readonly row: number; readonly col: number }[],
  len: number,
  color: string,
  active: boolean,
  m: VaultRenderMetrics,
  p: Palette,
): void {
  const cs = m.cellSize;
  if (len > 1) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = Math.max(1.5, cs * 0.24);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < len; i += 1) {
      const px = m.pad + trail[i]!.col * cs + cs / 2;
      const py = m.pad + trail[i]!.row * cs + cs / 2;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
  const cur = trail[len - 1]!;
  ctx.fillStyle = color;
  ctx.strokeStyle = active ? p.err : p.surface;
  ctx.lineWidth = Math.max(1.2, cs * 0.16);
  ctx.beginPath();
  ctx.arc(m.pad + cur.col * cs + cs / 2, m.pad + cur.row * cs + cs / 2, Math.max(2.6, cs * 0.38), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** HiDPI light-mode canvas renderer for Day 18 vault corridors, doors, keys, and robot trails. */
export function VaultCanvas({ frame, metrics }: { readonly frame: VaultTraceFrame; readonly metrics: VaultRenderMetrics }) {
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
    drawVaultCells(ctx, frame, metrics, p);
    const colors = [p.accent, p.ok, p.warn, p.gold];
    for (let r = 0; r < frame.trailLengths.length; r += 1) {
      drawSingleRobot(ctx, frame.robotTrails[r]!, frame.trailLengths[r]!, colors[r % colors.length]!, frame.activeRobotIndex === r, metrics, p);
    }
  }, [frame, metrics]);

  return (
    <div className="card" style={{ margin: 0, padding: '0.75rem', background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>{formatVaultStatus(frame)}</span>
        <span className="muted">Grid {frame.map.rows}×{frame.map.cols} · Robots {frame.map.entrances.length}</span>
      </div>
      <canvas ref={canvasRef} role="img" aria-label="Many-Worlds Interpretation vault exploration canvas" style={{ width: '100%', maxWidth: `${metrics.width}px`, height: 'auto', display: 'block', margin: '0 auto', borderRadius: '6px', border: '1px solid var(--border)' }} />
    </div>
  );
}
