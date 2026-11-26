import type { JetPattern } from './jetPattern';
import {
  FULL_ROW,
  LEFT_WALL_MASK,
  RIGHT_WALL_MASK,
  ROCK_COUNT,
  rockMaskAt,
  type RockShapeIndex,
  SPAWN_HEIGHT_GAP,
} from './rocks';

export interface SettledRockSnapshot {
  readonly shapeIndex: RockShapeIndex;
  readonly mask: number;
  readonly bottomY: number;
  readonly jetsUsed: number;
}

export interface ChamberWindowSnapshot {
  readonly windowBaseY: number;
  readonly windowRows: readonly number[];
  readonly reachableRows: readonly number[];
}

/** Propagates reachable air horizontally across `empty` cells from top-entry `seed` bits. */
export function floodRow(seed: number, empty: number): number {
  let reach = seed & empty;
  if (reach === 0) return 0;
  let next = (reach | (reach << 1) | (reach >>> 1)) & empty;
  while (next !== reach) {
    reach = next;
    next = (reach | (reach << 1) | (reach >>> 1)) & empty;
  }
  return reach;
}

/** Bitmask-accelerated 7-column vertical rock chamber simulator. */
export class Chamber {
  private readonly jets: JetPattern;
  private readonly rows: number[] = [FULL_ROW];
  private rockIdx: RockShapeIndex = 0;
  private jetIdx = 0;

  constructor(jets: JetPattern) {
    this.jets = jets;
  }

  /** Current height of the settled rock tower above the floor (`y = 0`). */
  get height(): number {
    return this.rows.length - 1;
  }

  /** Next rock shape index (`0..4`) to spawn. */
  get nextRockIndex(): RockShapeIndex {
    return this.rockIdx;
  }

  /** Next jet stream cursor index (`0..jets.length - 1`). */
  get nextJetIndex(): number {
    return this.jetIdx;
  }

  /** Spawns and drops the next rock until it comes to rest, returning its settled snapshot. */
  dropNextRock(): SettledRockSnapshot {
    const shapeIndex = this.rockIdx;
    let mask = rockMaskAt(shapeIndex);
    let bottomY = this.height + SPAWN_HEIGHT_GAP;
    let jetsUsed = 0;

    while (true) {
      mask = this.pushRock(mask, bottomY);
      jetsUsed += 1;
      if ((mask & this.windowAt(bottomY - 1)) !== 0) break;
      bottomY -= 1;
    }

    this.settleRock(mask, bottomY);
    this.rockIdx = ((shapeIndex + 1) % ROCK_COUNT) as RockShapeIndex;
    return Object.freeze({ shapeIndex, mask, bottomY, jetsUsed });
  }

  /** Returns top-down reachable air masks from `height` down to the first seal (or `y = 1`). */
  reachableProfile(): number[] {
    const profile: number[] = [];
    let reach = FULL_ROW;
    for (let y = this.height; y > 0; y -= 1) {
      reach = floodRow(reach, ~this.rows[y]! & FULL_ROW);
      if (reach === 0) break;
      profile.push(reach);
    }
    return profile;
  }

  /** Builds a canonical cycle-detection key combining rock cursor, jet cursor, and reachable cavity. */
  stateKey(): string {
    const profile = this.reachableProfile();
    let hex = '';
    for (let i = 0; i < profile.length; i += 1) {
      hex += profile[i]!.toString(16).padStart(2, '0');
    }
    return `${this.rockIdx}:${this.jetIdx}:${hex}`;
  }

  /** Captures up to `maxRows` top chamber rows and their reachable-air masks as frozen arrays. */
  snapshotWindow(maxRows: number): ChamberWindowSnapshot {
    const windowBaseY = Math.max(0, this.height - maxRows + 1);
    const windowRows = this.rows.slice(windowBaseY);
    const reachableRows = new Array<number>(windowRows.length).fill(0);
    const profile = this.reachableProfile();
    const limit = Math.min(profile.length, maxRows);
    for (let k = 0; k < limit; k += 1) {
      reachableRows[this.height - k - windowBaseY] = profile[k]!;
    }
    return Object.freeze({
      windowBaseY,
      windowRows: Object.freeze(windowRows),
      reachableRows: Object.freeze(reachableRows),
    });
  }

  private windowAt(bottomY: number): number {
    const limit = Math.min(4, this.rows.length - bottomY);
    let mask = 0;
    for (let i = 0; i < limit; i += 1) {
      mask |= this.rows[bottomY + i]! << (i * 8);
    }
    return mask;
  }

  private pushRock(mask: number, bottomY: number): number {
    const isLeft = this.jets.isLeftAt(this.jetIdx);
    this.jetIdx = (this.jetIdx + 1) % this.jets.length;
    if (isLeft) {
      if ((mask & LEFT_WALL_MASK) !== 0) return mask;
      const shifted = mask << 1;
      return (shifted & this.windowAt(bottomY)) === 0 ? shifted : mask;
    }
    if ((mask & RIGHT_WALL_MASK) !== 0) return mask;
    const shifted = mask >>> 1;
    return (shifted & this.windowAt(bottomY)) === 0 ? shifted : mask;
  }

  private settleRock(mask: number, bottomY: number): void {
    for (let i = 0; i < 4; i += 1) {
      const byte = (mask >>> (i * 8)) & FULL_ROW;
      if (byte === 0) break;
      const rowY = bottomY + i;
      if (rowY === this.rows.length) this.rows.push(byte);
      else this.rows[rowY]! |= byte;
    }
  }
}
