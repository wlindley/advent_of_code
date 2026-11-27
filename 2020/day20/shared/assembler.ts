import { canonicalEdge, SquareBitmap } from './d4';
import type { JigsawPuzzle } from './parser';
import type { Tile, TileOrientation } from './tile';

interface EdgeIndex {
  readonly canonTileCount: Map<number, number>;
  readonly byLeft: Map<number, TileOrientation[]>;
  readonly byTop: Map<number, TileOrientation[]>;
}

/** Solved square arrangement of oriented tiles with borderless stitching helpers. */
export class AssembledGrid {
  readonly gridSide: number;
  readonly tileSize: number;
  readonly tiles: readonly Tile[];
  readonly placements: readonly TileOrientation[];

  constructor(gridSide: number, tileSize: number, tiles: readonly Tile[], placements: readonly TileOrientation[]) {
    this.gridSide = gridSide;
    this.tileSize = tileSize;
    this.tiles = tiles;
    this.placements = placements;
  }

  at(r: number, c: number): TileOrientation {
    return this.placements[r * this.gridSide + c]!;
  }

  get cornerIds(): readonly [number, number, number, number] {
    const last = this.gridSide - 1;
    return [this.at(0, 0).tileId, this.at(0, last).tileId, this.at(last, 0).tileId, this.at(last, last).tileId];
  }

  get cornerProduct(): bigint {
    const [tl, tr, bl, br] = this.cornerIds;
    return BigInt(tl) * BigInt(tr) * BigInt(bl) * BigInt(br);
  }

  isCorner(r: number, c: number): boolean {
    const last = this.gridSide - 1;
    return (r === 0 || r === last) && (c === 0 || c === last);
  }

  pixelAt(tr: number, tc: number, lr: number, lc: number): number {
    const placed = this.at(tr, tc);
    return this.tiles[placed.tileIndex]!.pixelAt(placed.ori, lr, lc);
  }

  stitchBorderless(): SquareBitmap {
    const inner = this.tileSize - 2;
    const side = this.gridSide * inner;
    const pixels = new Uint8Array(side * side);
    for (let tr = 0; tr < this.gridSide; tr += 1) {
      for (let tc = 0; tc < this.gridSide; tc += 1) {
        for (let lr = 0; lr < inner; lr += 1) {
          const rowOffset = (tr * inner + lr) * side + tc * inner;
          for (let lc = 0; lc < inner; lc += 1) {
            pixels[rowOffset + lc] = this.pixelAt(tr, tc, lr + 1, lc + 1);
          }
        }
      }
    }
    return new SquareBitmap(side, pixels);
  }
}

function pushEdgeBucket(map: Map<number, TileOrientation[]>, key: number, ori: TileOrientation): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(ori);
  else map.set(key, [ori]);
}

function buildEdgeIndex(puzzle: JigsawPuzzle): EdgeIndex {
  const canonTileCount = new Map<number, number>();
  const byLeft = new Map<number, TileOrientation[]>();
  const byTop = new Map<number, TileOrientation[]>();
  for (const tile of puzzle.tiles) {
    const idOri = tile.orientation(0);
    // Deduplicate per-tile canonical edges so self-duplicate borders cannot inflate counts to >= 2.
    const seenCanon = new Set<number>([
      canonicalEdge(idOri.top, puzzle.tileSize),
      canonicalEdge(idOri.right, puzzle.tileSize),
      canonicalEdge(idOri.bottom, puzzle.tileSize),
      canonicalEdge(idOri.left, puzzle.tileSize),
    ]);
    for (const c of seenCanon) canonTileCount.set(c, (canonTileCount.get(c) ?? 0) + 1);
    for (const ori of tile.orientations) {
      pushEdgeBucket(byLeft, ori.left, ori);
      pushEdgeBucket(byTop, ori.top, ori);
    }
  }
  return { canonTileCount, byLeft, byTop };
}

function outerScore(ori: TileOrientation, tileSize: number, counts: Map<number, number>): number {
  const topOuter = counts.get(canonicalEdge(ori.top, tileSize))! === 1 ? 1 : 0;
  const leftOuter = counts.get(canonicalEdge(ori.left, tileSize))! === 1 ? 1 : 0;
  return topOuter + leftOuter;
}

function sortedAnchors(puzzle: JigsawPuzzle, index: EdgeIndex): TileOrientation[] {
  const all: TileOrientation[] = [];
  for (const tile of puzzle.tiles) {
    for (const ori of tile.orientations) all.push(ori);
  }
  all.sort(
    (a, b) =>
      outerScore(b, puzzle.tileSize, index.canonTileCount) -
        outerScore(a, puzzle.tileSize, index.canonTileCount) ||
      a.tileId - b.tileId ||
      a.ori - b.ori,
  );
  return all;
}

function selectCandidates(
  pos: number,
  side: number,
  index: EdgeIndex,
  anchors: readonly TileOrientation[],
  placed: readonly TileOrientation[],
): readonly TileOrientation[] {
  if (pos === 0) return anchors;
  if (pos % side === 0) return index.byTop.get(placed[pos - side]!.bottom)!;
  return index.byLeft.get(placed[pos - 1]!.right)!;
}

function dfsAssemble(
  pos: number,
  puzzle: JigsawPuzzle,
  index: EdgeIndex,
  anchors: readonly TileOrientation[],
  used: Uint8Array,
  placed: TileOrientation[],
): boolean {
  const side = puzzle.gridSide;
  if (pos === side * side) return true;
  const r = Math.floor(pos / side);
  const c = pos % side;
  const checkTop = r > 0 && c > 0;
  const reqTop = checkTop ? placed[pos - side]!.bottom : 0;

  for (const cand of selectCandidates(pos, side, index, anchors, placed)) {
    if (used[cand.tileIndex]) continue;
    if (checkTop && cand.top !== reqTop) continue;
    if (c < side - 1 && index.canonTileCount.get(canonicalEdge(cand.right, puzzle.tileSize))! < 2) continue;
    if (r < side - 1 && index.canonTileCount.get(canonicalEdge(cand.bottom, puzzle.tileSize))! < 2) continue;
    used[cand.tileIndex] = 1;
    placed[pos] = cand;
    if (dfsAssemble(pos + 1, puzzle, index, anchors, used, placed)) return true;
    used[cand.tileIndex] = 0;
  }
  return false;
}

/** Assembles jigsaw tiles into a unique edge-matched square grid via pruned DFS. */
export function assembleGrid(puzzle: JigsawPuzzle): AssembledGrid {
  const index = buildEdgeIndex(puzzle);
  const anchors = sortedAnchors(puzzle, index);
  const used = new Uint8Array(puzzle.tiles.length);
  const placed = new Array<TileOrientation>(puzzle.tiles.length);
  if (!dfsAssemble(0, puzzle, index, anchors, used, placed)) {
    throw new Error('Unable to assemble jigsaw tiles into a valid grid');
  }
  return new AssembledGrid(puzzle.gridSide, puzzle.tileSize, puzzle.tiles, placed);
}
