import { D4_COUNT, type D4Orientation, type SquareBitmap, transformSquare } from './d4';

export const SEA_MONSTER_HEIGHT = 3;
export const SEA_MONSTER_WIDTH = 20;

export const SEA_MONSTER_OFFSETS: readonly (readonly [number, number])[] = [
  [0, 18],
  [1, 0],
  [1, 5],
  [1, 6],
  [1, 11],
  [1, 12],
  [1, 17],
  [1, 18],
  [1, 19],
  [2, 1],
  [2, 4],
  [2, 7],
  [2, 10],
  [2, 13],
  [2, 16],
];

/** Sea-monster detection result for one oriented borderless image. */
export class SeaMonsterScan {
  readonly orientation: D4Orientation;
  readonly image: SquareBitmap;
  private readonly monsterMask: Uint8Array;
  readonly monsterCount: number;

  constructor(
    orientation: D4Orientation,
    image: SquareBitmap,
    monsterMask: Uint8Array,
    monsterCount: number,
  ) {
    this.orientation = orientation;
    this.image = image;
    this.monsterMask = monsterMask;
    this.monsterCount = monsterCount;
  }

  get hashCount(): number {
    const total = this.image.side * this.image.side;
    let count = 0;
    for (let i = 0; i < total; i += 1) {
      count += this.image.atIndex(i);
    }
    return count;
  }

  get monsterCellCount(): number {
    let count = 0;
    for (let i = 0; i < this.monsterMask.length; i += 1) {
      count += this.monsterMask[i]!;
    }
    return count;
  }

  get waterRoughness(): number {
    return this.hashCount - this.monsterCellCount;
  }

  isMonsterCell(r: number, c: number): boolean {
    return this.monsterMask[r * this.image.side + c]! === 1;
  }
}

function matchesMonsterAt(image: SquareBitmap, r: number, c: number): boolean {
  for (const [dr, dc] of SEA_MONSTER_OFFSETS) {
    if (image.at(r + dr, c + dc) !== 1) return false;
  }
  return true;
}

function markMonster(mask: Uint8Array, side: number, r: number, c: number): void {
  for (const [dr, dc] of SEA_MONSTER_OFFSETS) {
    mask[(r + dr) * side + (c + dc)] = 1;
  }
}

function scanOrientation(image: SquareBitmap, orientation: D4Orientation): SeaMonsterScan {
  const { side } = image;
  const mask = new Uint8Array(side * side);
  let monsterCount = 0;
  for (let r = 0; r <= side - SEA_MONSTER_HEIGHT; r += 1) {
    for (let c = 0; c <= side - SEA_MONSTER_WIDTH; c += 1) {
      if (!matchesMonsterAt(image, r, c)) continue;
      monsterCount += 1;
      markMonster(mask, side, r, c);
    }
  }
  return new SeaMonsterScan(orientation, image, mask, monsterCount);
}

/** Scans all 8 D4 orientations of a stitched image and returns the sea-monster match scan. */
export function scanSeaMonsters(stitched: SquareBitmap): SeaMonsterScan {
  let best = scanOrientation(stitched, 0);
  for (let o = 1; o < D4_COUNT; o += 1) {
    const ori = o as D4Orientation;
    const candidate = scanOrientation(transformSquare(stitched, ori), ori);
    if (candidate.monsterCellCount > best.monsterCellCount) {
      best = candidate;
    }
  }
  return best;
}
