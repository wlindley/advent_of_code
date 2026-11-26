import {
  MOVE_DELTAS,
  type MoveDir,
  TILE_BOX_LEFT,
  TILE_BOX_RIGHT,
  TILE_EMPTY,
  type TileCode,
  type WarehouseRule,
  type WarehouseSpec,
  WarehouseState,
} from '../../shared';

type WideBoxTile = typeof TILE_BOX_LEFT | typeof TILE_BOX_RIGHT;

const WIDEN_MAP = new Map<string, string>([
  ['#', '##'],
  ['O', '[]'],
  ['.', '..'],
  ['@', '@.'],
]);

function widenRow(row: string): string {
  let widened = '';
  for (const ch of row) {
    const pair = WIDEN_MAP.get(ch);
    if (pair === undefined) throw new Error(`Invalid raw map character '${ch}'`);
    widened += pair;
  }
  return widened;
}

function buildInitialState(spec: WarehouseSpec): WarehouseState {
  return WarehouseState.fromRows(spec.rows.map(widenRow));
}

function isWideBox(tile: TileCode): tile is WideBoxTile {
  return tile === TILE_BOX_LEFT || tile === TILE_BOX_RIGHT;
}

function boxLeftCol(col: number, tile: WideBoxTile): number {
  return tile === TILE_BOX_LEFT ? col : col - 1;
}

function pushHorizontal(state: WarehouseState, nr: number, nc: number, dc: number): boolean {
  let scanC = nc + dc;
  while (isWideBox(state.cellAt(nr, scanC))) {
    scanC += dc;
  }
  if (state.cellAt(nr, scanC) !== TILE_EMPTY) return false;
  for (let col = scanC; col !== nc; col -= dc) {
    const prevTile = state.cellAt(nr, col - dc);
    state.setTile(nr, col, prevTile === TILE_BOX_LEFT ? TILE_BOX_LEFT : TILE_BOX_RIGHT);
  }
  state.moveRobotTo(nr, nc);
  return true;
}

function collectVerticalBoxes(
  state: WarehouseState,
  startRow: number,
  startLeftC: number,
  dr: number,
): readonly number[] | null {
  const width = state.width;
  const queue = [startRow * width + startLeftC];
  const seen = new Set<number>(queue);
  for (let head = 0; head < queue.length; head += 1) {
    const key = queue[head]!;
    const row = Math.floor(key / width);
    const leftC = key - row * width;
    const nextRow = row + dr;
    for (const col of [leftC, leftC + 1]) {
      const tile = state.cellAt(nextRow, col);
      if (tile === TILE_EMPTY) continue;
      if (!isWideBox(tile)) return null;
      const depKey = nextRow * width + boxLeftCol(col, tile);
      if (!seen.has(depKey)) {
        seen.add(depKey);
        queue.push(depKey);
      }
    }
  }
  return queue;
}

function applyVerticalShift(state: WarehouseState, boxes: readonly number[], dr: number): void {
  const width = state.width;
  for (const key of boxes) {
    const row = Math.floor(key / width);
    const leftC = key - row * width;
    state.setTile(row, leftC, TILE_EMPTY);
    state.setTile(row, leftC + 1, TILE_EMPTY);
  }
  for (const key of boxes) {
    const row = Math.floor(key / width);
    const leftC = key - row * width;
    state.setTile(row + dr, leftC, TILE_BOX_LEFT);
    state.setTile(row + dr, leftC + 1, TILE_BOX_RIGHT);
  }
}

function stepPart2(state: WarehouseState, move: MoveDir): boolean {
  const [dr, dc] = MOVE_DELTAS[move];
  const nr = state.robotRow + dr;
  const nc = state.robotCol + dc;
  const nextTile = state.cellAt(nr, nc);
  if (nextTile === TILE_EMPTY) {
    state.moveRobotTo(nr, nc);
    return true;
  }
  if (!isWideBox(nextTile)) return false;
  if (dr === 0) return pushHorizontal(state, nr, nc, dc);
  const boxes = collectVerticalBoxes(state, nr, boxLeftCol(nc, nextTile), dr);
  if (boxes === null) return false;
  applyVerticalShift(state, boxes, dr);
  state.moveRobotTo(nr, nc);
  return true;
}

/** Warehouse Woes Part 2 rule: widens tiles 2x horizontally and pushes linked 2x crates. */
export const PART2_PUSH_RULE: WarehouseRule = Object.freeze({
  buildInitialState,
  step: stepPart2,
});
