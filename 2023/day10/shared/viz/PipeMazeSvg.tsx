import { DIRS_4 } from '../../../../shared/core';
import type { MainLoop, PipeMaze, GridCoord, PipeShape } from '../index';
import { bitToDirIndex, pipePorts } from '../index';
import { PALETTE, distanceColor } from './palette';

export type ClutterMode = 'dim' | 'hide';

export interface PipeMazeViewProps {
  readonly maze: PipeMaze;
  readonly loop: MainLoop;
  readonly activeDistance?: number;
  readonly frontA?: GridCoord;
  readonly frontB?: GridCoord;
  readonly clutterMode: ClutterMode;
  readonly enclosedMask?: Uint8Array;
  readonly revealedUpToRow?: number;
  readonly activeScanRow?: number;
}

const CELL = 24;
const HALF = CELL / 2;

function pipePath(shape: PipeShape, row: number, col: number): string {
  const cx = col * CELL + HALF;
  const cy = row * CELL + HALF;
  const [p1, p2] = pipePorts(shape);
  const [dr1, dc1] = DIRS_4[bitToDirIndex(p1)]!;
  const [dr2, dc2] = DIRS_4[bitToDirIndex(p2)]!;
  return `M ${cx + dc1 * HALF} ${cy + dr1 * HALF} L ${cx} ${cy} L ${cx + dc2 * HALF} ${cy + dr2 * HALF}`;
}

function isRowRevealed(row: number, revealedUpToRow?: number): boolean {
  return revealedUpToRow === undefined || row <= revealedUpToRow;
}

function renderCell(row: number, col: number, props: PipeMazeViewProps) {
  const { maze, loop, activeDistance, clutterMode, enclosedMask, revealedUpToRow } = props;
  const idx = row * maze.cols + col;
  const isEnclosed = enclosedMask?.[idx] === 1 && isRowRevealed(row, revealedUpToRow);
  const onLoop = loop.isOnLoop(row, col);
  const tile = maze.effectiveTileAt(row, col);
  const dist = onLoop ? loop.distanceAt(row, col) : -1;
  const discovered = onLoop && (activeDistance === undefined || dist <= activeDistance);
  const stroke = discovered ? distanceColor(dist / loop.farthestDistance) : PALETTE.border;
  const cx = col * CELL + HALF;
  const cy = row * CELL + HALF;

  return (
    <g key={idx}>
      {isEnclosed && (
        <rect x={col * CELL + 1} y={row * CELL + 1} width={CELL - 2} height={CELL - 2} rx={3} fill={PALETTE.enclosedFill} />
      )}
      {onLoop && (
        <path d={pipePath(tile as PipeShape, row, col)} fill="none" stroke={stroke} strokeWidth={discovered ? 4 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {!onLoop && clutterMode === 'dim' && tile !== '.' && (
        <path d={pipePath(tile, row, col)} fill="none" stroke={PALETTE.clutter} strokeWidth={1.6} strokeOpacity={0.4} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {!onLoop && clutterMode === 'dim' && tile === '.' && !isEnclosed && (
        <circle cx={cx} cy={cy} r={1.3} fill={PALETTE.clutter} fillOpacity={0.5} />
      )}
      {isEnclosed && <circle cx={cx} cy={cy} r={3} fill={PALETTE.ok} />}
    </g>
  );
}

function renderFrontHalo(coord: GridCoord | undefined, color: string, key: string) {
  if (!coord) return null;
  const cx = coord.col * CELL + HALF;
  const cy = coord.row * CELL + HALF;
  return (
    <g key={key}>
      <circle cx={cx} cy={cy} r={7.5} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.85} />
      <circle cx={cx} cy={cy} r={3.5} fill={color} />
    </g>
  );
}

/** Crisp SVG pipe maze renderer for small grids (<= 25x25). */
export function PipeMazeSvg(props: PipeMazeViewProps) {
  const { maze, activeScanRow, frontA, frontB } = props;
  const width = maze.cols * CELL;
  const height = maze.rows * CELL;
  const sx = maze.start.col * CELL + HALF;
  const sy = maze.start.row * CELL + HALF;

  const cells = [];
  for (let r = 0; r < maze.rows; r += 1) {
    for (let c = 0; c < maze.cols; c += 1) cells.push(renderCell(r, c, props));
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Pipe maze grid" style={{ width: '100%', maxWidth: `${Math.min(640, width * 1.6)}px`, height: 'auto', display: 'block', margin: '0 auto', background: PALETTE.surface }}>
      {activeScanRow !== undefined && (
        <rect x={0} y={activeScanRow * CELL} width={width} height={CELL} fill={PALETTE.scanLine} />
      )}
      {cells}
      <circle cx={sx} cy={sy} r={7} fill={PALETTE.surface} stroke={PALETTE.accent} strokeWidth={2} />
      <text x={sx} y={sy + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={PALETTE.accent}>S</text>
      {renderFrontHalo(frontA, PALETTE.gold, 'frontA')}
      {renderFrontHalo(frontB, PALETTE.gold, 'frontB')}
    </svg>
  );
}
