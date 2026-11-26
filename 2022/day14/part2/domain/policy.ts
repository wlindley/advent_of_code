import { CaveBounds, type CaveBoundaryPolicy, type CaveScan, SOURCE_X } from '../../shared';

/** Part 2 bedrock floor boundary policy: infinite horizontal floor at maxY + 2. */
export const FLOOR_BOUNDARY_POLICY: CaveBoundaryPolicy = Object.freeze({
  label: 'Bedrock floor',
  computeBounds(scan: CaveScan): CaveBounds {
    const floorY = scan.maxY + 2;
    return new CaveBounds(SOURCE_X - floorY, SOURCE_X + floorY, floorY, floorY);
  },
  isEscape: (): boolean => false,
});
