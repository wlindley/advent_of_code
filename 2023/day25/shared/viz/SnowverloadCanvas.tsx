import { useEffect, useRef } from 'react';
import type { MinCutTraceFrame, NodePoint, WiringGraph } from '../index';

export interface SnowverloadCanvasProps {
  readonly graph: WiringGraph;
  readonly frame: MinCutTraceFrame;
}

const WIDTH = 680;
const HEIGHT = 360;
const PAD = 24;
const INNER_W = WIDTH - PAD * 2;
const INNER_H = HEIGHT - PAD * 2;
const PATH_COLORS = ['#0969da', '#1a7f37', '#9a6700'] as const;

function toX(nx: number): number { return PAD + nx * INNER_W; }
function toY(ny: number): number { return PAD + ny * INNER_H; }

function drawBackdrop(ctx: CanvasRenderingContext2D, frame: MinCutTraceFrame): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = frame.phase === 'severed' ? 'rgba(207, 34, 46, 0.05)' : 'rgba(9, 105, 218, 0.04)';
  ctx.fillRect(toX(0.42), 8, toX(0.58) - toX(0.42), HEIGHT - 16);
  ctx.save();
  ctx.strokeStyle = '#d0d7de';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(toX(0.5), 12);
  ctx.lineTo(toX(0.5), HEIGHT - 12);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#59636e';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText(`Cluster S (${frame.result.sizeS})`, PAD, 16);
  ctx.fillText(`Cluster T (${frame.result.sizeT})`, toX(0.62), 16);
}

function drawBgEdges(ctx: CanvasRenderingContext2D, graph: WiringGraph, frame: MinCutTraceFrame): void {
  const { points } = frame.layout;
  const n = graph.vertexCount;
  const cutKeys = new Set(frame.result.cutEdges.map((e) => e.u * n + e.v));
  ctx.strokeStyle = n > 120 ? 'rgba(89, 99, 110, 0.12)' : 'rgba(89, 99, 110, 0.28)';
  ctx.lineWidth = n > 120 ? 0.8 : 1.1;
  ctx.beginPath();
  for (let e = 0; e < graph.edgeCount; e += 1) {
    const edge = graph.edges[e]!;
    if (cutKeys.has(edge.u * n + edge.v)) continue;
    ctx.moveTo(toX(points[edge.u]!.x), toY(points[edge.u]!.y));
    ctx.lineTo(toX(points[edge.v]!.x), toY(points[edge.v]!.y));
  }
  ctx.stroke();
}

function drawCutWires(ctx: CanvasRenderingContext2D, frame: MinCutTraceFrame, points: readonly NodePoint[]): void {
  const severed = frame.phase === 'severed';
  ctx.save();
  ctx.strokeStyle = severed || frame.phase === 'residual-cut' ? '#cf222e' : '#9a6700';
  ctx.lineWidth = severed || frame.phase === 'residual-cut' ? 2.6 : 1.8;
  if (severed) ctx.setLineDash([5, 4]);
  for (const edge of frame.result.cutEdges) {
    const p1 = points[edge.u]!;
    const p2 = points[edge.v]!;
    ctx.beginPath();
    ctx.moveTo(toX(p1.x), toY(p1.y));
    if (severed) {
      ctx.lineTo(toX(p1.x + (p2.x - p1.x) * 0.34), toY(p1.y + (p2.y - p1.y) * 0.34));
      ctx.moveTo(toX(p2.x), toY(p2.y));
      ctx.lineTo(toX(p2.x - (p2.x - p1.x) * 0.34), toY(p2.y - (p2.y - p1.y) * 0.34));
    } else {
      ctx.lineTo(toX(p2.x), toY(p2.y));
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawDisjointPaths(ctx: CanvasRenderingContext2D, frame: MinCutTraceFrame, points: readonly NodePoint[]): void {
  for (let p = 0; p < frame.activePathCount; p += 1) {
    const path = frame.result.disjointPaths[p]!;
    ctx.strokeStyle = PATH_COLORS[p]!;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i < path.length; i += 1) {
      const pt = points[path[i]!]!;
      if (i === 0) ctx.moveTo(toX(pt.x), toY(pt.y)); else ctx.lineTo(toX(pt.x), toY(pt.y));
    }
    ctx.stroke();
  }
}

function drawNodes(ctx: CanvasRenderingContext2D, graph: WiringGraph, frame: MinCutTraceFrame): void {
  const { points } = frame.layout;
  const r = graph.vertexCount > 120 ? 2.4 : 4.6;
  const sides: readonly [readonly number[], string][] = [[frame.result.sideS, '#0969da'], [frame.result.sideT, '#1a7f37']];
  for (const [nodes, color] of sides) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const u of nodes) {
      const pt = points[u]!;
      ctx.moveTo(toX(pt.x) + r, toY(pt.y));
      ctx.arc(toX(pt.x), toY(pt.y), r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  for (const [u, color] of [[frame.result.source, '#1f2328'], [frame.probeTarget, '#cf222e']] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(toX(points[u]!.x), toY(points[u]!.y), r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (graph.vertexCount > 36) return;
  ctx.fillStyle = '#1f2328';
  ctx.font = '600 10px ui-monospace, monospace';
  for (let u = 0; u < graph.vertexCount; u += 1) ctx.fillText(graph.labelOf(u), toX(points[u]!.x) + 6, toY(points[u]!.y) + 3);
}

/** HiDPI bipartite canvas rendering S/T clusters, 3 disjoint flow paths, and severed cut wires. */
export function SnowverloadCanvas({ graph, frame }: SnowverloadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(WIDTH * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackdrop(ctx, frame);
    drawBgEdges(ctx, graph, frame);
    drawCutWires(ctx, frame, frame.layout.points);
    drawDisjointPaths(ctx, frame, frame.layout.points);
    drawNodes(ctx, graph, frame);
  }, [graph, frame]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
      <canvas ref={canvasRef} aria-label={`Snowverload min-cut canvas at step ${frame.step} of ${frame.totalSteps}`} style={{ width: `${WIDTH}px`, maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text)' }}>
        <span><strong style={{ color: 'var(--accent)' }}>●</strong> Side S</span>
        <span><strong style={{ color: 'var(--ok)' }}>●</strong> Side T</span>
        <span><strong style={{ color: 'var(--gold)' }}>—</strong> Flow paths (1–3)</span>
        <span><strong style={{ color: 'var(--err)' }}>✂</strong> 3-wire min-cut</span>
      </div>
    </div>
  );
}
