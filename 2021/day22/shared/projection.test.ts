import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { Cuboid } from './cuboid';
import {
  computeSceneBounds,
  projectCuboid,
  projectCuboids,
  type Viewport,
} from './projection';

function box(x0: bigint, x1: bigint, y0: bigint, y1: bigint, z0: bigint, z1: bigint): Cuboid {
  return new Cuboid(new ClosedInterval(x0, x1), new ClosedInterval(y0, y1), new ClosedInterval(z0, z1));
}

const VIEWPORT: Viewport = { width: 640, height: 420, padding: 24 };

describe('3D isometric projection', () => {
  it('computes continuous half-open SceneBounds with maxSpan >= 1n even for a 1x1x1 cube', () => {
    const unit = box(5n, 5n, 5n, 5n, 5n, 5n);
    const bounds = computeSceneBounds([unit]);
    expect(bounds.minX).toBe(5n);
    expect(bounds.maxX).toBe(6n);
    expect(bounds.maxSpan).toBe(1n);
    expect(Object.isFrozen(bounds)).toBe(true);

    const multi = computeSceneBounds([
      box(0n, 5n, 0n, 10n, 0n, 3n),
      box(-2n, 3n, 2n, 12n, -1n, 8n),
    ]);
    expect(multi.minX).toBe(-2n);
    expect(multi.maxX).toBe(6n);
    expect(multi.minY).toBe(0n);
    expect(multi.maxY).toBe(13n);
    expect(multi.minZ).toBe(-1n);
    expect(multi.maxZ).toBe(9n);
    expect(multi.maxSpan).toBe(13n);
  });

  it('rejects empty cuboid lists and invalid maxCuboids limits', () => {
    expect(() => computeSceneBounds([])).toThrow(RangeError);
    const unit = box(0n, 0n, 0n, 0n, 0n, 0n);
    const bounds = computeSceneBounds([unit]);
    expect(() => projectCuboids([unit], bounds, VIEWPORT, 0)).toThrow(RangeError);
    expect(() => projectCuboids([unit], bounds, VIEWPORT, 1.5)).toThrow(RangeError);
  });

  it('projects > 2^63 bigint coordinates cleanly within viewport bounds', () => {
    const base = 1n << 70n;
    const huge = box(base, base + 99n, base - 50n, base + 49n, base, base + 99n);
    const bounds = computeSceneBounds([huge]);
    const projected = projectCuboid(huge, bounds, VIEWPORT);

    const allPoints = [...projected.topFace, ...projected.leftFace, ...projected.rightFace];
    for (const p of allPoints) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(VIEWPORT.padding - 0.01);
      expect(p.x).toBeLessThanOrEqual(VIEWPORT.width - VIEWPORT.padding + 0.01);
      expect(p.y).toBeGreaterThanOrEqual(VIEWPORT.padding - 0.01);
      expect(p.y).toBeLessThanOrEqual(VIEWPORT.height - VIEWPORT.padding + 0.01);
    }
  });

  it('depth-sorts back-to-front and truncates to largest maxCuboids when exceeded', () => {
    const back = box(0n, 1n, 0n, 1n, 0n, 1n);
    const front = box(4n, 6n, 4n, 6n, 4n, 6n);
    const tiny = box(2n, 2n, 2n, 2n, 2n, 2n);
    const bounds = computeSceneBounds([back, front, tiny]);

    const full = projectCuboids([front, back], bounds, VIEWPORT, 10);
    expect(full.truncatedCount).toBe(0);
    expect(full.cuboids[0]!.cuboid).toBe(back);
    expect(full.cuboids[1]!.cuboid).toBe(front);

    const capped = projectCuboids([tiny, back, front, tiny], bounds, VIEWPORT, 2);
    expect(capped.truncatedCount).toBe(2);
    expect(capped.cuboids).toHaveLength(2);
    expect(capped.cuboids[0]!.cuboid).toBe(back);
    expect(capped.cuboids[1]!.cuboid).toBe(front);
  });
});
