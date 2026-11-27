import type { AssembledGrid } from './assembler';
import { scanSeaMonsters } from './monsters';

export type JigsawMode = 'corners' | 'monsters';

/** Pluggable evaluation policy separating Part 1 corner-product from Part 2 sea-monster roughness. */
export interface JigsawPolicy {
  readonly id: JigsawMode;
  readonly label: string;
  readonly mode: JigsawMode;
  evaluate(grid: AssembledGrid): bigint;
}

export const CORNER_PRODUCT_POLICY: JigsawPolicy = {
  id: 'corners',
  label: 'Corner Product',
  mode: 'corners',
  evaluate: (grid) => grid.cornerProduct,
};

export const WATER_ROUGHNESS_POLICY: JigsawPolicy = {
  id: 'monsters',
  label: 'Water Roughness',
  mode: 'monsters',
  evaluate: (grid) => BigInt(scanSeaMonsters(grid.stitchBorderless()).waterRoughness),
};
