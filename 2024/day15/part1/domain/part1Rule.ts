import {
  MOVE_DELTAS,
  type MoveDir,
  TILE_BOX,
  TILE_EMPTY,
  type WarehouseRule,
  type WarehouseSpec,
  WarehouseState,
} from '../../shared';

function stepPart1(state: WarehouseState, move: MoveDir): boolean {
  const [dr, dc] = MOVE_DELTAS[move];
  const nr = state.robotRow + dr;
  const nc = state.robotCol + dc;
  let scanR = nr;
  let scanC = nc;

  while (state.cellAt(scanR, scanC) === TILE_BOX) {
    scanR += dr;
    scanC += dc;
  }

  if (state.cellAt(scanR, scanC) !== TILE_EMPTY) {
    return false;
  }

  if (scanR !== nr || scanC !== nc) {
    state.setTile(scanR, scanC, TILE_BOX);
  }
  state.moveRobotTo(nr, nc);
  return true;
}

/** Part 1 push rule: single-width `'O'` crates slide along a line in O(1) endpoint swap. */
export const PART1_PUSH_RULE: WarehouseRule = Object.freeze({
  buildInitialState: (spec: WarehouseSpec) => WarehouseState.fromRows(spec.rows),
  step: stepPart1,
});
