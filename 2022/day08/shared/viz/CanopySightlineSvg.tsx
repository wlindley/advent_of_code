import { useMemo, useState, type MouseEvent } from 'react';
import { DIRS_4 } from '../../../../shared/core';
import { CARDINAL_DIRS, ForestGrid, ForestSightlines, type CardinalDir } from '../index';

export type CanopyVizMode = 'visibility' | 'scenic';

export interface CanopyWavefront {
  readonly dir: CardinalDir;
  readonly coord: number;
}

export interface CanopySightlineSvgProps {
  readonly forest: ForestGrid;
  readonly sightlines: ForestSightlines;
  readonly mode: CanopyVizMode;
  readonly isCellHighlighted?: (row: number, col: number) => boolean;
  readonly wavefront?: CanopyWavefront | null;
  readonly selectedCoord?: readonly [number, number] | null;
  readonly onSelectCoord?: (coord: readonly [number, number] | null) => void;
}

const SVG_W = 540;
const PLOT_X = 30;
const PLOT_Y = 30;
const PLOT_SIZE = 460;
const SVG_H = PLOT_Y + PLOT_SIZE + 42;
const BASE_SHADES = ['#f1f5f9', '#e8eef5', '#dfe7f0', '#d5e0ec', '#cbd8e6', '#c0cfdf', '#b4c6d8', '#a6bbd0', '#97afc7', '#87a2bd'] as const;
const VIS_SHADES = ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#052e16'] as const;
const SCENIC_SHADES = ['#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#d97706', '#b45309', '#92400e', '#78350f', '#451a03'] as const;
const DIR_LABELS = ['U', 'R', 'D', 'L'] as const;

interface GridGeom {
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;
}

function computeGeom(rows: number, cols: number): GridGeom {
  const cellSize = Math.min(PLOT_SIZE / cols, PLOT_SIZE / rows);
  return {
    cellSize,
    originX: PLOT_X + (PLOT_SIZE - cols * cellSize) / 2,
    originY: PLOT_Y + (PLOT_SIZE - rows * cellSize) / 2,
  };
}

function buildBucketPaths(
  forest: ForestGrid,
  geom: GridGeom,
  includeCell?: (r: number, c: number) => boolean,
): readonly string[] {
  const buckets = Array.from({ length: 10 }, () => '');
  const pad = geom.cellSize > 8 ? 0.6 : 0;
  const side = Math.max(0.5, geom.cellSize - pad * 2).toFixed(2);
  for (let r = 0; r < forest.rows; r += 1) {
    const y = (geom.originY + r * geom.cellSize + pad).toFixed(2);
    for (let c = 0; c < forest.cols; c += 1) {
      if (includeCell && !includeCell(r, c)) continue;
      const x = (geom.originX + c * geom.cellSize + pad).toFixed(2);
      const h = forest.heightAt(r, c);
      buckets[h] += `M${x} ${y}h${side}v${side}h-${side}z`;
    }
  }
  return buckets;
}

function pickCell(event: MouseEvent<SVGRectElement>, forest: ForestGrid): readonly [number, number] | null {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const col = Math.floor(((event.clientX - rect.left) / rect.width) * forest.cols);
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * forest.rows);
  return forest.inBounds(row, col) ? [row, col] : null;
}

function WavefrontLine({ wavefront, geom, rows, cols }: { readonly wavefront: CanopyWavefront; readonly geom: GridGeom; readonly rows: number; readonly cols: number }) {
  const isRow = wavefront.dir === 0 || wavefront.dir === 2;
  const pos = (isRow ? geom.originY : geom.originX) + (wavefront.coord + 0.5) * geom.cellSize;
  const x1 = isRow ? geom.originX - 4 : pos;
  const y1 = isRow ? pos : geom.originY - 4;
  const x2 = isRow ? geom.originX + cols * geom.cellSize + 4 : pos;
  const y2 = isRow ? pos : geom.originY + rows * geom.cellSize + 4;
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="5 3" pointerEvents="none" />;
}

function SightlineOverlay({ sightlines, coord, geom }: { readonly sightlines: ForestSightlines; readonly coord: readonly [number, number]; readonly geom: GridGeom }) {
  const [row, col] = coord;
  const cx = geom.originX + (col + 0.5) * geom.cellSize;
  const cy = geom.originY + (row + 0.5) * geom.cellSize;
  const dotR = Math.max(2.4, Math.min(5, geom.cellSize * 0.16));
  return (
    <g pointerEvents="none">
      {CARDINAL_DIRS.map((dir) => {
        const ray = sightlines.rayFor(row, col, dir);
        const [dr, dc] = DIRS_4[dir]!;
        const pad = ray.blocked ? 0 : geom.cellSize * 0.45;
        const ex = geom.originX + (ray.endCol + 0.5) * geom.cellSize + dc * pad;
        const ey = geom.originY + (ray.endRow + 0.5) * geom.cellSize + dr * pad;
        return (
          <g key={dir}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={ray.blocked ? 'var(--warn)' : 'var(--ok)'} strokeWidth={2.2} strokeDasharray={ray.blocked ? '4 3' : undefined} />
            {ray.blocked && <circle cx={ex} cy={ey} r={dotR} fill="var(--err)" stroke="var(--surface)" strokeWidth={1} />}
          </g>
        );
      })}
      <rect x={geom.originX + col * geom.cellSize} y={geom.originY + row * geom.cellSize} width={geom.cellSize} height={geom.cellSize} fill="none" stroke="var(--text)" strokeWidth={2} />
    </g>
  );
}

function HeightLabels({ forest, geom, isHighlighted }: { readonly forest: ForestGrid; readonly geom: GridGeom; readonly isHighlighted: (r: number, c: number) => boolean }) {
  const fontSize = Math.max(9, Math.min(16, geom.cellSize * 0.46));
  const labels = [];
  for (let r = 0; r < forest.rows; r += 1) {
    for (let c = 0; c < forest.cols; c += 1) {
      const h = forest.heightAt(r, c);
      const dark = isHighlighted(r, c) && h >= 5;
      labels.push(
        <text key={`${r}-${c}`} x={geom.originX + (c + 0.5) * geom.cellSize} y={geom.originY + (r + 0.5) * geom.cellSize} fontSize={fontSize} fontWeight={700} textAnchor="middle" dominantBaseline="central" fill={dark ? '#ffffff' : 'var(--text)'} fontFamily="ui-monospace, monospace" pointerEvents="none">
          {h}
        </text>,
      );
    }
  }
  return <g>{labels}</g>;
}

function LegendHeader({ mode }: { readonly mode: CanopyVizMode }) {
  return (
    <g>
      <text x={PLOT_X} y={18} fontSize={11} fontWeight={700} fill="var(--text)">
        {mode === 'visibility' ? 'Canopy Visibility Heatmap' : 'Scenic Score Inspector'}
      </text>
      <line x1={250} y1={14} x2={272} y2={14} stroke="var(--ok)" strokeWidth={2.4} />
      <text x={277} y={18} fontSize={10.5} fill="var(--muted)">Clear ray</text>
      <line x1={340} y1={14} x2={362} y2={14} stroke="var(--warn)" strokeWidth={2.2} strokeDasharray="4 3" />
      <circle cx={362} cy={14} r={3} fill="var(--err)" />
      <text x={369} y={18} fontSize={10.5} fill="var(--muted)">Blocked ray</text>
    </g>
  );
}

function formatFooter(forest: ForestGrid, sightlines: ForestSightlines, coord: readonly [number, number] | null): string {
  if (!coord) return `${forest.rows}×${forest.cols} canopy — hover or click any tree to inspect 4-way sightlines`;
  const [r, c] = coord;
  const h = forest.heightAt(r, c);
  const dirs = CARDINAL_DIRS.map((d) => `${DIR_LABELS[d]}:${sightlines.distanceAt(r, c, d)}`).join(' ');
  return `(${r},${c}) h=${h} · ${sightlines.isVisible(r, c) ? 'visible' : 'hidden'} · scenic=${sightlines.scenicScore(r, c)} · ${dirs}`;
}

/** Reusable batched-path canopy heatmap and 4-way sightline SVG inspector. */
export function CanopySightlineSvg({ forest, sightlines, mode, isCellHighlighted, wavefront, selectedCoord, onSelectCoord }: CanopySightlineSvgProps) {
  const [hovered, setHovered] = useState<readonly [number, number] | null>(null);
  const geom = useMemo(() => computeGeom(forest.rows, forest.cols), [forest.rows, forest.cols]);
  const basePaths = useMemo(() => buildBucketPaths(forest, geom), [forest, geom]);
  const highlightFn = isCellHighlighted ?? ((r: number, c: number) => sightlines.isVisible(r, c));
  const overlayPaths = buildBucketPaths(forest, geom, highlightFn);
  const overlayShades = mode === 'visibility' ? VIS_SHADES : SCENIC_SHADES;
  const activeCoord = hovered ?? selectedCoord ?? null;
  const gridW = forest.cols * geom.cellSize;
  const gridH = forest.rows * geom.cellSize;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.5rem', margin: '0.5rem 0' }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', maxWidth: 560, height: 'auto', display: 'block', margin: '0 auto' }} role="img" aria-label="Canopy sightline heatmap">
        <LegendHeader mode={mode} />
        {basePaths.map((d, h) => (d ? <path key={`b-${h}`} d={d} fill={BASE_SHADES[h]} /> : null))}
        {overlayPaths.map((d, h) => (d ? <path key={`o-${h}`} d={d} fill={overlayShades[h]} /> : null))}
        {forest.rows <= 15 && forest.cols <= 15 && <HeightLabels forest={forest} geom={geom} isHighlighted={highlightFn} />}
        {wavefront && <WavefrontLine wavefront={wavefront} geom={geom} rows={forest.rows} cols={forest.cols} />}
        {activeCoord && <SightlineOverlay sightlines={sightlines} coord={activeCoord} geom={geom} />}
        <rect x={geom.originX} y={geom.originY} width={gridW} height={gridH} fill="transparent" style={{ cursor: 'crosshair' }} onPointerMove={(e) => setHovered(pickCell(e, forest))} onPointerLeave={() => setHovered(null)} onClick={(e) => { const c = pickCell(e, forest); onSelectCoord?.(c && selectedCoord && c[0] === selectedCoord[0] && c[1] === selectedCoord[1] ? null : c); }} />
        <text x={PLOT_X} y={SVG_H - 14} fontSize={11} fontWeight={600} fill="var(--text)" fontFamily="ui-monospace, monospace">{formatFooter(forest, sightlines, activeCoord)}</text>
      </svg>
    </div>
  );
}
