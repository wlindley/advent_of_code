import { describe, expect, it } from 'vitest';
import { Chamber, floodRow } from './chamber';
import { parseJetPattern } from './jetPattern';
import { FULL_ROW, ROCK_LABELS, rockMaskAt } from './rocks';

const EXAMPLE_JETS = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';

describe('floodRow', () => {
  it('expands sideways through contiguous empty cells and stops at rock walls', () => {
    expect(floodRow(0b0001000, 0b0000000)).toBe(0);
    expect(floodRow(0b0010000, 0b0111011)).toBe(0b0111000);
    expect(floodRow(0b0000001, 0b1101111)).toBe(0b0001111);
  });
});

describe('Chamber', () => {
  it('starts empty at height 0 with frozen initial window snapshot', () => {
    const chamber = new Chamber(parseJetPattern('<>'));
    expect(chamber.height).toBe(0);
    expect(chamber.nextRockIndex).toBe(0);
    expect(chamber.nextJetIndex).toBe(0);
    expect(chamber.reachableProfile()).toEqual([]);
    expect(chamber.stateKey()).toBe('0:0:');

    const snap = chamber.snapshotWindow(24);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap.windowRows)).toBe(true);
    expect(Object.isFrozen(snap.reachableRows)).toBe(true);
    expect(snap).toEqual({ windowBaseY: 0, windowRows: [FULL_ROW], reachableRows: [0] });
  });

  it('drops the first 5 rocks on the official example to expected heights and positions', () => {
    const chamber = new Chamber(parseJetPattern(EXAMPLE_JETS));
    const expectedHeights = [1, 4, 6, 7, 9];
    const expectedBottomY = [1, 2, 4, 4, 8];

    for (let i = 0; i < 5; i += 1) {
      const settled = chamber.dropNextRock();
      expect(settled.shapeIndex).toBe(i);
      expect(settled.bottomY).toBe(expectedBottomY[i]);
      expect(settled.jetsUsed).toBeGreaterThan(0);
      expect(chamber.height).toBe(expectedHeights[i]);
    }
    expect(chamber.nextRockIndex).toBe(0);
    expect(ROCK_LABELS).toEqual(['-', '+', 'J', 'I', 'O']);
    expect(rockMaskAt(4)).toBe(0x00001818);
  });

  it('handles left and right wall collisions and stops reachableProfile at full seals', () => {
    // Push everything hard left then hard right across rocks to seal all 7 columns across adjacent rows
    const chamber = new Chamber(parseJetPattern('<<<<>>>>'));
    // Drop '-' pushed left (bits 6,5,4,3 = 0x78 at y=1), then '+' pushed right, etc.
    for (let i = 0; i < 12; i += 1) {
      chamber.dropNextRock();
    }
    const fullSnap = chamber.snapshotWindow(24);
    expect(fullSnap.windowBaseY).toBe(0);
    expect(fullSnap.windowRows.length).toBe(chamber.height + 1);

    const slicedSnap = chamber.snapshotWindow(4);
    expect(slicedSnap.windowBaseY).toBe(chamber.height - 3);
    expect(slicedSnap.windowRows.length).toBe(4);
    expect(slicedSnap.reachableRows.length).toBe(4);

    // Explicitly seal y=1: '-' pushed left (x=0..3 at y=1), then '+' pushed right (x=4..6 at y=2, x=5 at y=1)
    const sealChamber = new Chamber(parseJetPattern('<<<<>>>>>'));
    sealChamber.dropNextRock();
    sealChamber.dropNextRock();
    expect(sealChamber.height).toBe(3);
    expect(sealChamber.reachableProfile().length).toBe(2);
    expect(sealChamber.stateKey()).toContain(':');
  });
});
