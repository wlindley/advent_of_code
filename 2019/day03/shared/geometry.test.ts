import { describe, expect, it } from 'vitest';
import { findCrossings, pickBestCrossing } from './geometry';
import { MANHATTAN_METRIC, SIGNAL_DELAY_METRIC } from './metric';
import { parseWirePair } from './parser';

describe('findCrossings orthogonal cases', () => {
  it('detects H-V and V-H crossings and ignores misses', () => {
    const pair = parseWirePair('R8,U5,L5,D3\nU7,R6,D4,L4');
    const crossings = findCrossings(pair);
    expect(crossings.map((c) => c.point)).toEqual([
      { x: 6n, y: 5n },
      { x: 3n, y: 3n },
    ]);
    expect(crossings[0]!.manhattanDistance).toBe(11n);
    expect(crossings[1]!.manhattanDistance).toBe(6n);
  });

  it('excludes origin revisits while keeping non-origin axis crossings', () => {
    const pair = parseWirePair('U2,R2,D2,L4\nR2,U2,L2,D4');
    const crossings = findCrossings(pair);
    const points = crossings.map((c) => `${c.point.x},${c.point.y}`);
    expect(points).not.toContain('0,0');
    expect(points).toContain('2,2');
  });

  it('returns empty array when orthogonal segments do not overlap', () => {
    const pair = parseWirePair('R5,U5\nL5,D5');
    expect(findCrossings(pair)).toEqual([]);
  });
});

describe('findCrossings collinear cases', () => {
  it('ignores parallel non-collinear and disjoint collinear segments', () => {
    const parallel = parseWirePair('U5,R4\nD2,R4');
    expect(findCrossings(parallel)).toEqual([]);

    const disjoint = parseWirePair('U5,R2\nD1,R10,U6,L2');
    expect(findCrossings(disjoint)).toEqual([]);
  });

  it('emits range endpoints and zero crossing for off-axis H and V overlaps', () => {
    const horiz = parseWirePair('U5,L3,R7\nU5,R4,L8');
    const hPoints = findCrossings(horiz).map((c) => `${c.point.x},${c.point.y}`);
    expect(hPoints).toContain('0,5');
    expect(hPoints).toContain('-3,5');
    expect(hPoints).toContain('4,5');

    const vert = parseWirePair('R5,D3,U7\nR5,U4,D8');
    const vPoints = findCrossings(vert).map((c) => `${c.point.x},${c.point.y}`);
    expect(vPoints).toContain('5,0');
    expect(vPoints).toContain('5,-3');
    expect(vPoints).toContain('5,4');
  });

  it('handles point touches and excludes origin on on-axis collinear overlaps', () => {
    const touch = parseWirePair('U3,R4\nR8,U3,L4');
    expect(findCrossings(touch).map((c) => c.point)).toEqual([{ x: 4n, y: 3n }]);

    const onAxis = parseWirePair('R5\nR3');
    expect(findCrossings(onAxis).map((c) => c.point)).toEqual([
      { x: 1n, y: 0n },
      { x: 3n, y: 0n },
    ]);

    const originTouchOnly = parseWirePair('R5\nL5');
    expect(findCrossings(originTouchOnly)).toEqual([]);
  });
});

describe('deduplication and pickBestCrossing', () => {
  it('keeps minimum steps and discoveryStep when both wires revisit a crossing', () => {
    const pair = parseWirePair('R4,U2,L2,D2,R2\nU2,R2,D4,U2,R2');
    const crossings = findCrossings(pair);
    const atTwoZero = crossings.find((c) => c.point.x === 2n && c.point.y === 0n);
    expect(atTwoZero).toBeDefined();
    expect(atTwoZero!.firstSteps).toBe(2n);
    expect(atTwoZero!.secondSteps).toBe(6n);
  });

  it('picks null for empty crossings and selects best by metric', () => {
    expect(pickBestCrossing([], MANHATTAN_METRIC)).toBeNull();
    const pair = parseWirePair('R8,U5,L5,D3\nU7,R6,D4,L4');
    const crossings = findCrossings(pair);
    expect(pickBestCrossing(crossings, MANHATTAN_METRIC)!.manhattanDistance).toBe(6n);
    expect(pickBestCrossing(crossings, SIGNAL_DELAY_METRIC)!.signalDelay).toBe(30n);
  });

  it('chooses the later crossing when its metric score is strictly lower', () => {
    const pair = parseWirePair('R10,U10,L8,D8\nU2,R2,U8,R8');
    const crossings = findCrossings(pair);
    expect(pickBestCrossing(crossings, MANHATTAN_METRIC)!.point).toEqual({ x: 2n, y: 2n });
  });

  it('handles 10^25 BigInt coordinates accurately', () => {
    const d = '10000000000000000000000000';
    const pair = parseWirePair(`R${d},U${d}\nU${d},R${d}`);
    const crossings = findCrossings(pair);
    expect(crossings).toHaveLength(1);
    expect(crossings[0]!.manhattanDistance).toBe(20000000000000000000000000n);
  });
});
