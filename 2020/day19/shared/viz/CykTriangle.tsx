import { useEffect, useRef } from 'react';

export interface CykTriangleProps {
  readonly triangleRows: readonly string[];
  readonly message: string;
}

interface TrianglePalette {
  readonly codes: Readonly<Record<string, string>>;
  readonly surface: string;
  readonly bg: string;
  readonly border: string;
  readonly text: string;
}

function readPalette(canvas: HTMLCanvasElement): TrianglePalette {
  const styles = getComputedStyle(canvas);
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    codes: {
      '0': token('--ok', '#1a7f37'),
      '4': token('--accent', '#0969da'),
      '3': token('--gold', '#9a6700'),
      w: token('--text', '#1f2328'),
      r: token('--muted', '#59636e'),
      '.': token('--bg', '#f6f8fa'),
    },
    surface: token('--surface', '#ffffff'),
    bg: token('--bg', '#f6f8fa'),
    border: token('--border', '#d0d7de'),
    text: token('--text', '#1f2328'),
  };
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  code: string,
  palette: TrianglePalette,
): void {
  const fill = palette.codes[code] ?? palette.bg;
  ctx.fillStyle = code === 'r' ? `${fill}33` : fill;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  if (size >= 15 && code !== '.') {
    ctx.fillStyle = code === 'r' ? palette.text : palette.surface;
    ctx.font = `600 ${Math.max(9, Math.floor(size * 0.48))}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, x + size / 2, y + size / 2);
  }
}

function drawBaseLabels(
  ctx: CanvasRenderingContext2D,
  message: string,
  centerX: number,
  cell: number,
  palette: TrianglePalette,
): void {
  if (cell < 11) return;
  ctx.fillStyle = palette.text;
  ctx.font = '700 11px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const n = message.length;
  const baseLeft = centerX - (n * cell) / 2;
  for (let i = 0; i < n; i += 1) {
    ctx.fillText(message[i]!, baseLeft + (i + 0.5) * cell, 12 + n * cell);
  }
}

function drawTriangleCanvas(
  canvas: HTMLCanvasElement,
  triangleRows: readonly string[],
  message: string,
): void {
  const n = message.length;
  const ctx = n > 0 ? canvas.getContext('2d') : null;
  if (!ctx) return;

  const palette = readPalette(canvas);
  const cell = Math.max(5, Math.min(26, Math.floor(660 / n)));
  const logicalW = Math.max(240, n * cell + 24);
  const logicalH = n * cell + 34;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  canvas.style.width = `${logicalW}px`;
  canvas.style.height = `${logicalH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, logicalW, logicalH);
  const centerX = logicalW / 2;
  for (let len = 1; len <= n; len += 1) {
    const row = triangleRows[len - 1] ?? '';
    const y = 8 + (n - len) * cell;
    const rowLeft = centerX - ((n - len + 1) * cell) / 2;
    for (let start = 0; start <= n - len; start += 1) {
      drawCell(ctx, rowLeft + start * cell, y, cell, row[start] ?? '.', palette);
    }
  }
  drawBaseLabels(ctx, message, centerX, cell, palette);
}

function TriangleLegend() {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>0: Rule 0</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>4: Rule 42</span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>3: Rule 31</span>
      <span className="badge" style={{ borderColor: 'var(--text)', color: 'var(--text)' }}>w: Witness</span>
      <span className="badge muted">r: Sub-rule</span>
      <span className="badge muted">.: No match</span>
    </div>
  );
}

/** DPR-aware Canvas 2D renderer of the triangular CYK dynamic-programming table. */
export function CykTriangle({ triangleRows, message }: CykTriangleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawTriangleCanvas(canvas, triangleRows, message);
  }, [triangleRows, message]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.65rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
      }}
    >
      <TriangleLegend />
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          aria-label={`CYK parse triangle for ${message}`}
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}
