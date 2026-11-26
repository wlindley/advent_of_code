import { assertNonNegativeBigInt, type RangeMap } from './rangeMap';

/** Immutable parsed almanac containing initial seed IDs and a chained list of category maps. */
export class Almanac {
  readonly seeds: readonly bigint[];
  readonly maps: readonly RangeMap[];

  constructor(seeds: Iterable<bigint>, maps: Iterable<RangeMap>) {
    const seedList = Array.from(seeds);
    if (seedList.length === 0) {
      throw new RangeError('Almanac must contain at least one seed');
    }
    for (let i = 0; i < seedList.length; i += 1) {
      assertNonNegativeBigInt(seedList[i]!, `seeds[${i}]`);
    }

    const mapList = Array.from(maps);
    if (mapList.length === 0) {
      throw new RangeError('Almanac must contain at least one RangeMap');
    }
    for (let i = 1; i < mapList.length; i += 1) {
      const prev = mapList[i - 1]!;
      const next = mapList[i]!;
      if (prev.destCategory !== next.sourceCategory) {
        throw new RangeError(
          `Discontinuous map chain: "${prev.destCategory}" cannot connect to "${next.sourceCategory}"`,
        );
      }
    }

    this.seeds = Object.freeze(seedList);
    this.maps = Object.freeze(mapList);
    Object.freeze(this);
  }

  get categories(): readonly string[] {
    const names: string[] = [this.maps[0]!.sourceCategory];
    for (const map of this.maps) {
      names.push(map.destCategory);
    }
    return Object.freeze(names);
  }
}
