import { CaveBounds, type CaveBoundaryPolicy, type CaveScan, SOURCE_X } from '../../shared';

/** Part 1 abyss boundary policy: sand escapes once it falls past the deepest rock row. */
export const ABYSS_BOUNDARY_POLICY: CaveBoundaryPolicy = Object.freeze({
  label: 'Abyss',
  computeBounds(scan: CaveScan): CaveBounds {
    const maxY = scan.maxY + 1;
    const minX = Math.max(SOURCE_X - maxY, Math.min(scan.minX, SOURCE_X) - 1);
    const maxX = Math.min(SOURCE_X + maxY, Math.max(scan.maxX, SOURCE_X) + 1);
    return new CaveBounds(minX, maxX, maxY, null);
  },
  isEscape: (y: number, bounds: CaveBounds): boolean => y >= bounds.maxY,
});
