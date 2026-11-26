import type { MonkeyBoard } from './board';
import { facingToVec3, foldFrame, mapSeamPosition, vec3Key, type FaceFrame } from './cubeFrame';
import { FACING_DELTAS, type Pose, type Topology } from './types';

interface PlayableBounds {
  readonly playable: number;
  readonly minRow: number;
  readonly maxRow: number;
  readonly minCol: number;
  readonly maxCol: number;
}

function blockKey(blockRow: number, blockCol: number): string {
  return `${blockRow},${blockCol}`;
}

function measureBounds(board: MonkeyBoard): PlayableBounds {
  let playable = 0;
  let minRow = board.height;
  let maxRow = -1;
  let minCol = board.width;
  let maxCol = -1;
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      if (!board.isPlayable(r, c)) continue;
      playable += 1;
      if (r < minRow) minRow = r;
      if (r > maxRow) maxRow = r;
      if (c < minCol) minCol = c;
      if (c > maxCol) maxCol = c;
    }
  }
  if (playable === 0) throw new Error('Board has no playable tiles');
  return { playable, minRow, maxRow, minCol, maxCol };
}

function countBlockTiles(board: MonkeyBoard, rowStart: number, colStart: number, size: number): number {
  let count = 0;
  for (let dr = 0; dr < size; dr += 1) {
    for (let dc = 0; dc < size; dc += 1) {
      if (board.isPlayable(rowStart + dr, colStart + dc)) count += 1;
    }
  }
  return count;
}

function extractBlocks(
  board: MonkeyBoard,
  faceSize: number,
  bounds: PlayableBounds,
): readonly (readonly [number, number])[] {
  const blockRows = Math.ceil((bounds.maxRow - bounds.minRow + 1) / faceSize);
  const blockCols = Math.ceil((bounds.maxCol - bounds.minCol + 1) / faceSize);
  const fullCount = faceSize * faceSize;
  const blocks: [number, number][] = [];
  for (let br = 0; br < blockRows; br += 1) {
    for (let bc = 0; bc < blockCols; bc += 1) {
      const count = countBlockTiles(
        board,
        bounds.minRow + br * faceSize,
        bounds.minCol + bc * faceSize,
        faceSize,
      );
      if (count !== 0 && count !== fullCount) {
        throw new Error(`Partial or misaligned ${faceSize}x${faceSize} block at (${br}, ${bc})`);
      }
      if (count === fullCount) blocks.push([br, bc]);
    }
  }
  return blocks;
}

function expandFaceNeighbors(
  cur: FaceFrame,
  blockSet: ReadonlySet<string>,
  faceByBlock: Map<string, FaceFrame>,
  faceByNormal: Map<string, FaceFrame>,
  queue: FaceFrame[],
): void {
  for (const facing of [0, 1, 2, 3] as const) {
    const nbrRow = cur.blockRow + FACING_DELTAS[facing][0];
    const nbrCol = cur.blockCol + FACING_DELTAS[facing][1];
    const key = blockKey(nbrRow, nbrCol);
    if (!blockSet.has(key) || faceByBlock.has(key)) continue;
    const next = foldFrame(cur, facing, nbrRow, nbrCol);
    const nKey = vec3Key(next.n);
    if (faceByNormal.has(nKey)) throw new Error('Overlapping cube face normals in net');
    faceByBlock.set(key, next);
    faceByNormal.set(nKey, next);
    queue.push(next);
  }
}

function foldCubeNet(blocks: readonly (readonly [number, number])[]) {
  const blockSet = new Set(blocks.map(([r, c]) => blockKey(r, c)));
  const [startRow, startCol] = blocks[0]!;
  const root: FaceFrame = Object.freeze({
    blockRow: startRow,
    blockCol: startCol,
    r: Object.freeze([1, 0, 0] as const),
    d: Object.freeze([0, 1, 0] as const),
    n: Object.freeze([0, 0, 1] as const),
  });
  const faceByBlock = new Map<string, FaceFrame>([[blockKey(startRow, startCol), root]]);
  const faceByNormal = new Map<string, FaceFrame>([[vec3Key(root.n), root]]);
  const queue: FaceFrame[] = [root];
  for (let head = 0; head < queue.length; head += 1) {
    expandFaceNeighbors(queue[head]!, blockSet, faceByBlock, faceByNormal, queue);
  }
  if (faceByBlock.size !== 6) {
    throw new Error(`Disconnected cube net: folded ${faceByBlock.size} of 6 faces`);
  }
  return { faces: Object.freeze(queue), faceByBlock, faceByNormal };
}

/** Part 2 3D folded cube-net topology with BFS face-frame orientation and seam mapping. */
export class CubeNetTopology implements Topology {
  readonly name = 'cube-net';
  readonly faceSize: number;
  readonly faces: readonly FaceFrame[];
  private readonly board: MonkeyBoard;
  private readonly originRow: number;
  private readonly originCol: number;
  private readonly faceByBlock: ReadonlyMap<string, FaceFrame>;
  private readonly faceByNormal: ReadonlyMap<string, FaceFrame>;

  constructor(board: MonkeyBoard) {
    const bounds = measureBounds(board);
    const faceSize = Math.round(Math.sqrt(bounds.playable / 6));
    if (6 * faceSize * faceSize !== bounds.playable) {
      throw new Error(`Playable tile count ${bounds.playable} cannot form 6 square faces`);
    }
    const folded = foldCubeNet(extractBlocks(board, faceSize, bounds));
    this.board = board;
    this.faceSize = faceSize;
    this.originRow = bounds.minRow;
    this.originCol = bounds.minCol;
    this.faces = folded.faces;
    this.faceByBlock = folded.faceByBlock;
    this.faceByNormal = folded.faceByNormal;
    Object.freeze(this);
  }

  /** Steps one cell on the folded cube, rotating position and facing across seams. */
  step(pose: Pose): Pose {
    const br = Math.floor((pose.row - this.originRow) / this.faceSize);
    const bc = Math.floor((pose.col - this.originCol) / this.faceSize);
    const frame = this.faceByBlock.get(blockKey(br, bc));
    if (!frame) throw new Error(`Pose (${pose.row}, ${pose.col}) is not on a cube face`);
    const [dr, dc] = FACING_DELTAS[pose.facing];
    const nr = pose.row + dr;
    const nc = pose.col + dc;
    if (this.board.isPlayable(nr, nc)) return { row: nr, col: nc, facing: pose.facing };
    const localRow = pose.row - (this.originRow + frame.blockRow * this.faceSize);
    const localCol = pose.col - (this.originCol + frame.blockCol * this.faceSize);
    const target = this.faceByNormal.get(vec3Key(facingToVec3(frame, pose.facing)))!;
    const mapped = mapSeamPosition(frame, target, localRow, localCol, this.faceSize);
    return {
      row: this.originRow + target.blockRow * this.faceSize + mapped.localRow,
      col: this.originCol + target.blockCol * this.faceSize + mapped.localCol,
      facing: mapped.facing,
    };
  }
}
