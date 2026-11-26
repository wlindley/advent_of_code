import { useEffect, useRef, type ReactNode } from 'react';
import type { GravityAssistMatch, SearchHeatmap } from '../domain';

interface SearchHeatmapPanelProps {
  readonly heatmap: SearchHeatmap;
  readonly match: GravityAssistMatch;
  readonly target: bigint;
}

const CANVAS_SIZE = 264;
const PAD_LEFT = 36;
const PAD_TOP = 14;
const PLOT_SIZE = 212;

function ratioToUnit(value: bigint, maxInput: bigint): number {
  const scaled = (value * 10_000n) / maxInput;
  return Math.max(0, Math.min(1, Number(scaled) / 10_000));
}

function errorToColor(norm: number, okColor: string): string {
  if (norm === 0) return okColor;
  const c = Math.max(0, Math.min(1, norm));
  const low = c < 0.5;
  const t = low ? c * 2 : (c - 0.5) * 2;
  const r = Math.round(low ? 221 + 34 * t : 255 - 48 * t);
  const g = Math.round(low ? 244 + 4 * t : 248 - 214 * t);
  const b = Math.round(low ? 255 - 58 * t : 197 - 151 * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawHeatmapCells(ctx: CanvasRenderingContext2D, heatmap: SearchHeatmap, okColor: string): void {
  const size = heatmap.size;
  const cell = PLOT_SIZE / size;
  for (let ni = 0; ni < size; ni += 1) {
    for (let vi = 0; vi < size; vi += 1) {
      ctx.fillStyle = errorToColor(heatmap.normalizedErrorAt(ni, vi), okColor);
      ctx.fillRect(PAD_LEFT + vi * cell, PAD_TOP + ni * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

function drawAxes(ctx: CanvasRenderingContext2D, maxLabel: string, border: string, muted: string): void {
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD_LEFT, PAD_TOP, PLOT_SIZE, PLOT_SIZE);
  ctx.fillStyle = muted;
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('0', PAD_LEFT - 5, PAD_TOP + 10);
  ctx.fillText(maxLabel, PAD_LEFT - 5, PAD_TOP + PLOT_SIZE);
  ctx.textAlign = 'left';
  ctx.fillText('Verb 0', PAD_LEFT, PAD_TOP + PLOT_SIZE + 16);
  ctx.textAlign = 'right';
  ctx.fillText(maxLabel, PAD_LEFT + PLOT_SIZE, PAD_TOP + PLOT_SIZE + 16);
}

function drawCrosshair(ctx: CanvasRenderingContext2D, heatmap: SearchHeatmap, match: GravityAssistMatch, textColor: string, okColor: string): void {
  const cell = PLOT_SIZE / heatmap.size;
  const span = PLOT_SIZE - cell;
  const x = PAD_LEFT + cell / 2 + ratioToUnit(match.inputs.verb, heatmap.maxInput) * span;
  const y = PAD_TOP + cell / 2 + ratioToUnit(match.inputs.noun, heatmap.maxInput) * span;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(PAD_LEFT, y);
  ctx.lineTo(PAD_LEFT + PLOT_SIZE, y);
  ctx.moveTo(x, PAD_TOP);
  ctx.lineTo(x, PAD_TOP + PLOT_SIZE);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = okColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

function cssVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  return styles.getPropertyValue(name).trim() || fallback;
}

function drawHeatmapCanvas(canvas: HTMLCanvasElement, heatmap: SearchHeatmap, match: GravityAssistMatch): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_SIZE * dpr;
  canvas.height = CANVAS_SIZE * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const styles = getComputedStyle(canvas);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = cssVar(styles, '--surface', '#ffffff');
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const ok = cssVar(styles, '--ok', '#1a7f37');
  drawHeatmapCells(ctx, heatmap, ok);
  drawAxes(ctx, heatmap.maxInput.toString(), cssVar(styles, '--border', '#d0d7de'), cssVar(styles, '--muted', '#59636e'));
  drawCrosshair(ctx, heatmap, match, cssVar(styles, '--text', '#1f2328'), ok);
}

function BasisProbeTable({ match, target }: { readonly match: GravityAssistMatch; readonly target: bigint }) {
  const rows: ReactNode[] = [];
  const labels = ['Intercept (0, 0)', 'Noun +1 (1, 0)', 'Verb +1 (0, 1)'];
  for (let i = 0; i < match.basisProbes.length; i += 1) {
    const probe = match.basisProbes[i]!;
    rows.push(
      <tr key={labels[i]}>
        <td>{labels[i]}</td>
        <td className="nowrap"><code>({probe.inputs.noun.toString()}, {probe.inputs.verb.toString()})</code></td>
        <td className="nowrap"><code>{probe.output.toString()}</code></td>
      </tr>,
    );
  }
  return (
    <div className="stack" style={{ gap: '0.6rem' }}>
      <table className="quality-table">
        <thead><tr><th>Basis Probe</th><th>(noun, verb)</th><th>mem[0]</th></tr></thead>
        <tbody>{rows}</tbody>
      </table>
      <div className="card" style={{ marginBottom: 0, padding: '0.65rem 0.85rem', background: 'var(--bg)' }}>
        <span className="eyebrow">Affine Model Estimate</span>
        <code>{match.intercept.toString()} + ({match.nounSlope.toString()})·n + ({match.verbSlope.toString()})·v = {target.toString()}</code>
      </div>
    </div>
  );
}

/** Light-mode error-landscape heatmap canvas and 3-point affine basis probe panel. */
export function SearchHeatmapPanel({ heatmap, match, target }: SearchHeatmapPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (canvasRef.current) drawHeatmapCanvas(canvasRef.current, heatmap, match);
  }, [heatmap, match]);

  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="day-header" style={{ marginBottom: '0.6rem' }}>
        <span>Error Landscape ({heatmap.size}×{heatmap.size} samples)</span>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Max |error|: {heatmap.maxError.toString()}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'start' }}>
        <div className="stack" style={{ gap: '0.4rem' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            aria-label="Log-error landscape heatmap over noun and verb inputs"
            style={{ width: '100%', maxWidth: CANVAS_SIZE, height: 'auto', display: 'block', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)' }}
          />
          <span className="muted" style={{ fontSize: '0.78rem' }}>
            Y: Noun 0–{heatmap.maxInput.toString()} · X: Verb 0–{heatmap.maxInput.toString()} · Crosshair at ({match.inputs.noun.toString()}, {match.inputs.verb.toString()})
          </span>
        </div>
        <BasisProbeTable match={match} target={target} />
      </div>
    </section>
  );
}
