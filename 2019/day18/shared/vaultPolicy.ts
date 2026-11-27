import { splitVaultForQuadRobots, type VaultMap } from './vaultMap';

/** Strategy policy distinguishing Part 1 single-explorer and Part 2 quad-robot modes. */
export interface VaultPolicy {
  readonly id: 'part1-single' | 'part2-quad';
  readonly label: string;
  prepareMap(map: VaultMap): VaultMap;
}

/** Part 1 policy requiring a single `@` entrance. */
export const SINGLE_EXPLORER_POLICY: VaultPolicy = Object.freeze({
  id: 'part1-single',
  label: 'Part 1 · Single Explorer',
  prepareMap(map: VaultMap): VaultMap {
    if (map.entrances.length !== 1) {
      throw new Error(`Part 1 requires a single entrance (@), got ${map.entrances.length}`);
    }
    return map;
  },
});

/** Part 2 policy splitting a single `@` into 4 robots or accepting an already-split 4-robot vault. */
export const QUAD_ROBOT_POLICY: VaultPolicy = Object.freeze({
  id: 'part2-quad',
  label: 'Part 2 · Quad Robots',
  prepareMap(map: VaultMap): VaultMap {
    if (map.entrances.length === 4) return map;
    if (map.entrances.length === 1) return splitVaultForQuadRobots(map);
    throw new Error(`Part 2 requires 1 or 4 entrances, got ${map.entrances.length}`);
  },
});
