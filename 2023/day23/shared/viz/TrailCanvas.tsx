import { useEffect, useMemo, useRef } from 'react';
import { type HikeTraceFrame, SLOPE_DELTA, type SlopeTile, type TrailGraph, type TrailMap } from '../index';

export interface TrailCanvasProps {
  readonly map: TrailMap;
  readonly graph: TrailGraph;
  readonly frame: HikeTraceFrame;
  readonly ignoreSlopes: boolean;
}

const PAD = 12;
const COLORS = {
  bg: '#ffffff', wall: '#24292f', path: '#f6f8fa', slopeBg: '#ddf4ff', slopeFg: '#0969da',
  corridor: 'rgba(89, 99, 110, 0.28)', search: '#9a6700', hike: '#1a7f37',
  junction: '#59636e', start: '#0969da', end: '#cf222e', hiker: '#bf8700',
};
const LEGEND: readonly (readonly [string, string])[] = [
  ['Start', COLORS.start], ['Exit', COLORS.end], ['Active search', COLORS.search],
  ['Optimal hike', COLORS.hike], ['Hiker', COLORS.hiker], ['Corridors', COLORS.corridor],
];

function drawSlopeChevron(
  ctx: CanvasRenderingContext2D, tile: SlopeTile, cx: number, cy: number, size: number,
): void {
  const [dr, dc] = SLOPE_DELTA[tile];
  const r = size * 0.28;
  ctx.strokeStyle = COLORS.slopeFg;
  ctx.lineWidth = Math.max(1.2, size * 0.11);
  ctx.beginPath();
  ctx.moveTo(cx - dc * r - dr * r * 0.7, cy - dr * r - dc * r * 0.7);
  ctx.lineTo(cx + dc * r, cy + dr * r);
  ctx.lineTo(cx - dc * r + dr * r * 0.7, cy - dr * r + dc * r * 0.7);
  ctx.stroke();
}

function drawTerrain(
  ctx: CanvasRenderingContext2D, map: TrailMap, cellSize: number, ignoreSlopes: boolean,
): void {
  for (let cell = 0; cell < map.size; cell += 1) {
    const { row, col } = map.coordOf(cell);
    const tile = map.tileAt(cell);
    const x = PAD + col * cellSize;
    const y = PAD + row * cellSize;
    const isSlope = !ignoreSlopes && tile !== '#' && tile !== '.';
    ctx.fillStyle = tile === '#' ? COLORS.wall : isSlope ? COLORS.slopeBg : COLORS.path;
    ctx.fillRect(x, y, cellSize, cellSize);
    if (isSlope && cellSize >= 9) {
      drawSlopeChevron(ctx, tile as SlopeTile, x + cellSize / 2, y + cellSize / 2, cellSize);
    }
  }
}

function strokeCellChain(
  ctx: CanvasRenderingContext2D, map: TrailMap, cells: readonly number[],
  cellSize: number, color: string, width: number,
): void {
  if (cells.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < cells.length; i += 1) {
    const { row, col } = map.coordOf(cells[i]!);
    const px = PAD + (col + 0.5) * cellSize;
    const py = PAD + (row + 0.5) * cellSize;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawJunctionsAndHiker(
  ctx: CanvasRenderingContext2D, map: TrailMap, graph: TrailGraph,
  frame: HikeTraceFrame, cellSize: number,
): void {
  const jRadius = Math.max(2, cellSize * 0.24);
  for (let id = 0; id < graph.vertexCount; id += 1) {
    const { row, col } = map.coordOf(graph.junctions[id]!);
    ctx.fillStyle = id === graph.startId ? COLORS.start : id === graph.endId ? COLORS.end : COLORS.junction;
    ctx.beginPath();
    ctx.arc(PAD + (col + 0.5) * cellSize, PAD + (row + 0.5) * cellSize, jRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  const { row: hr, col: hc } = map.coordOf(frame.hikerCell);
  ctx.fillStyle = COLORS.hiker;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(PAD + (hc + 0.5) * cellSize, PAD + (hr + 0.5) * cellSize, Math.max(3, cellSize * 0.34), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** HiDPI canvas rendering trail terrain, slopes, contracted corridors, active route, and hiker. */
export function TrailCanvas({ map, graph, frame, ignoreSlopes }: TrailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellSize = Math.max(4, Math.min(24, Math.floor(600 / Math.max(map.rows, map.cols))));
  const width = PAD * 2 + map.cols * cellSize;
  const height = PAD * 2 + map.rows * cellSize;
  const activeCells = useMemo(() => graph.expandVertexPath(frame.vertexPath), [graph, frame.vertexPath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    drawTerrain(ctx, map, cellSize, ignoreSlopes);
    for (const edge of graph.edges) {
      strokeCellChain(ctx, map, edge.cells, cellSize, COLORS.corridor, Math.max(1.2, cellSize * 0.14));
    }
    const routeColor = frame.phase === 'hike' ? COLORS.hike : COLORS.search;
    strokeCellChain(ctx, map, activeCells, cellSize, routeColor, Math.max(2, cellSize * 0.32));
    drawJunctionsAndHiker(ctx, map, graph, frame, cellSize);
  }, [map, graph, frame, ignoreSlopes, cellSize, width, height, activeCells]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
      <canvas
        ref={canvasRef}
        aria-label="Hiking trail network and longest walk visualization"
        style={{ width: `${width}px`, maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', fontSize: '0.8rem', color: 'var(--text)' }}>
        {LEGEND.map(([label, color]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, border: '1px solid var(--border)', display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
