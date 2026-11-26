import { describe, expect, it } from 'vitest';
import { CARDINAL_DIR, CARDINAL_DIRS, ForestGrid } from './forest';
import { ForestSightlines } from './sightlines';

const OFFICIAL_EXAMPLE = ['30373', '25512', '65332', '33549', '35390'].join('\n');

describe('ForestSightlines (4-pass monotonic stack)', () => {
  it('solves official 5x5 example: visibleCount=21, exact interior visibility & scenic scores', () => {
    const forest = ForestGrid.parse(OFFICIAL_EXAMPLE);
    const s = ForestSightlines.analyze(forest);
    expect(Object.isFrozen(s)).toBe(true);
    expect(s.rows).toBe(5);
    expect(s.cols).toBe(5);
    expect(s.visibleCount).toBe(21);

    // 5 visible interior trees: (1,1), (1,2), (2,1), (2,3), (3,2)
    expect(s.isVisible(1, 1)).toBe(true);
    expect(s.isVisibleFrom(1, 1, CARDINAL_DIR.UP)).toBe(true);
    expect(s.isVisibleFrom(1, 1, CARDINAL_DIR.LEFT)).toBe(true);
    expect(s.isVisibleFrom(1, 1, CARDINAL_DIR.RIGHT)).toBe(false);
    expect(s.isVisibleFrom(1, 1, CARDINAL_DIR.DOWN)).toBe(false);
    expect(s.visibilityMaskAt(1, 1)).toBe((1 << CARDINAL_DIR.UP) | (1 << CARDINAL_DIR.LEFT));

    expect(s.isVisible(1, 2)).toBe(true);
    expect(s.isVisible(2, 1)).toBe(true);
    expect(s.isVisible(2, 3)).toBe(true);
    expect(s.isVisible(3, 2)).toBe(true);

    // 4 hidden interior trees: (1,3), (2,2), (3,1), (3,3)
    for (const [r, c] of [[1, 3], [2, 2], [3, 1], [3, 3]] as const) {
      expect(s.isVisible(r, c)).toBe(false);
      expect(s.visibilityMaskAt(r, c)).toBe(0);
    }

    // Official scenic score examples: (1,2)=4, (3,2)=8, perimeter=0
    expect(s.scenicScore(1, 2)).toBe(4);
    expect(s.scenicScore(3, 2)).toBe(8);
    expect(s.scenicScore(0, 2)).toBe(0);
    expect(s.scenicScore(2, 0)).toBe(0);
    expect(s.scenicScore(4, 2)).toBe(0);
    expect(s.scenicScore(2, 4)).toBe(0);
  });

  it('produces exact SightlineRay geometry and blocked flag including edge-blocker vs clear edge', () => {
    const forest = ForestGrid.parse(OFFICIAL_EXAMPLE);
    const s = ForestSightlines.analyze(forest);
    const upRay = s.rayFor(1, 2, CARDINAL_DIR.UP);
    expect(Object.isFrozen(upRay)).toBe(true);
    expect(upRay).toEqual({
      originRow: 1, originCol: 2, dir: CARDINAL_DIR.UP,
      distance: 1, endRow: 0, endCol: 2, blocked: false,
    });
    expect(s.rayFor(1, 2, CARDINAL_DIR.RIGHT)).toEqual({
      originRow: 1, originCol: 2, dir: CARDINAL_DIR.RIGHT,
      distance: 2, endRow: 1, endCol: 4, blocked: false,
    });
    expect(s.rayFor(1, 2, CARDINAL_DIR.DOWN)).toEqual({
      originRow: 1, originCol: 2, dir: CARDINAL_DIR.DOWN,
      distance: 2, endRow: 3, endCol: 2, blocked: true,
    });
    expect(s.rayFor(1, 2, CARDINAL_DIR.LEFT)).toEqual({
      originRow: 1, originCol: 2, dir: CARDINAL_DIR.LEFT,
      distance: 1, endRow: 1, endCol: 1, blocked: true,
    });

    // Edge-blocker 959 / 555 / 959: center 5 has distance 1 in all dirs, blocked in all dirs
    const edgeBlocked = ForestSightlines.analyze(ForestGrid.parse('959\n555\n959'));
    expect(edgeBlocked.visibleCount).toBe(8);
    expect(edgeBlocked.isVisible(1, 1)).toBe(false);
    expect(edgeBlocked.scenicScore(1, 1)).toBe(1);
    for (const dir of CARDINAL_DIRS) {
      expect(edgeBlocked.distanceAt(1, 1, dir)).toBe(1);
      expect(edgeBlocked.rayFor(1, 1, dir).blocked).toBe(true);
    }
  });

  it('exercises full 10-slot monotonic stack and duplicate height replacement', () => {
    const s = ForestSightlines.analyze(ForestGrid.parse('987654321009'));
    expect(s.visibleCount).toBe(12);
    // At col 11 ('9'), looking LEFT stops at col 0 ('9'), distance = 11, blocked = true
    expect(s.distanceAt(0, 11, CARDINAL_DIR.LEFT)).toBe(11);
    expect(s.isVisibleFrom(0, 11, CARDINAL_DIR.LEFT)).toBe(false);
    // At col 10 ('0'), looking LEFT stops at col 9 ('0'), distance = 1, blocked = true
    expect(s.distanceAt(0, 10, CARDINAL_DIR.LEFT)).toBe(1);
    // At col 9 ('0'), looking RIGHT stops at col 10 ('0'), distance = 1, blocked = true
    expect(s.distanceAt(0, 9, CARDINAL_DIR.RIGHT)).toBe(1);
  });

  it('handles degenerate grids (1x1, 1x5, 5x1, 2x2, all-0, all-9)', () => {
    const one = ForestSightlines.analyze(ForestGrid.parse('5'));
    expect(one.visibleCount).toBe(1);
    expect(one.scenicScore(0, 0)).toBe(0);

    const rowOnly = ForestSightlines.analyze(ForestGrid.parse('12321'));
    expect(rowOnly.visibleCount).toBe(5);
    expect(rowOnly.scenicScore(0, 2)).toBe(0);

    const colOnly = ForestSightlines.analyze(ForestGrid.parse('1\n2\n3\n2\n1'));
    expect(colOnly.visibleCount).toBe(5);
    expect(colOnly.scenicScore(2, 0)).toBe(0);

    const twoByTwo = ForestSightlines.analyze(ForestGrid.parse('00\n00'));
    expect(twoByTwo.visibleCount).toBe(4);

    const allZero = ForestSightlines.analyze(ForestGrid.parse('000\n000\n000'));
    expect(allZero.visibleCount).toBe(8);
    expect(allZero.isVisible(1, 1)).toBe(false);

    const allNine = ForestSightlines.analyze(ForestGrid.parse('999\n999\n999'));
    expect(allNine.visibleCount).toBe(8);
    expect(allNine.scenicScore(1, 1)).toBe(1);
  });

  it('throws RangeError for all out-of-bounds or non-integer queries', () => {
    const s = ForestSightlines.analyze(ForestGrid.parse(OFFICIAL_EXAMPLE));
    const badCoords: readonly [number, number][] = [[-1, 0], [0, -1], [5, 0], [0, 5], [1.2, 2], [2, 1.2]];
    for (const [r, c] of badCoords) {
      expect(() => s.visibilityMaskAt(r, c)).toThrow(RangeError);
      expect(() => s.isVisibleFrom(r, c, CARDINAL_DIR.UP)).toThrow(RangeError);
      expect(() => s.isVisible(r, c)).toThrow(RangeError);
      expect(() => s.distanceAt(r, c, CARDINAL_DIR.RIGHT)).toThrow(RangeError);
      expect(() => s.scenicScore(r, c)).toThrow(RangeError);
      expect(() => s.rayFor(r, c, CARDINAL_DIR.DOWN)).toThrow(RangeError);
    }
  });
});
