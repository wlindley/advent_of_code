import type { MonkeyBoard } from './board';
import { FACING_DELTAS, type Pose, type Topology } from './types';

/** Part 1 flat-torus wrap-around topology across contiguous row/column spans. */
export class FlatTorusTopology implements Topology {
  readonly name = 'flat-torus';
  private readonly board: MonkeyBoard;

  constructor(board: MonkeyBoard) {
    this.board = board;
    Object.freeze(this);
  }

  /** Advances one tile, scanning backward along the active axis when hitting void. */
  step(pose: Pose): Pose {
    const [dr, dc] = FACING_DELTAS[pose.facing];
    const nr = pose.row + dr;
    const nc = pose.col + dc;
    if (this.board.isPlayable(nr, nc)) {
      return { row: nr, col: nc, facing: pose.facing };
    }
    let wr = pose.row;
    let wc = pose.col;
    while (this.board.isPlayable(wr - dr, wc - dc)) {
      wr -= dr;
      wc -= dc;
    }
    return { row: wr, col: wc, facing: pose.facing };
  }
}
