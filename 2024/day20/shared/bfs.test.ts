import { describe, expect, it } from 'vitest';
import { computeBfsDistances, DistanceField } from './bfs';
import { UNREACHABLE } from './model';
import { parseRacetrack } from './parser';

describe('computeBfsDistances & DistanceField', () => {
  it('computes start/end distances and reachable order on a borderless grid', () => {
    const track = parseRacetrack('S..\n.#.\n..E');
    const field = computeBfsDistances(track);

    expect(Object.isFrozen(field)).toBe(true);
    expect(field.baseline).toBe(4);
    expect(field.reachableCount).toBe(8);
    expect(field.distanceFromStart(0, 0)).toBe(0);
    expect(field.distanceFromStart(1, 1)).toBe(UNREACHABLE);
    expect(field.distanceFromStart(2, 2)).toBe(4);
    expect(field.distanceFromEnd(0, 0)).toBe(4);
    expect(field.distanceFromEnd(1, 1)).toBe(UNREACHABLE);
    expect(field.distanceFromEnd(2, 2)).toBe(0);

    const startCopy = field.copyDistFromStart();
    const endCopy = field.copyDistFromEnd();
    const orderCopy = field.copyReachableCells();
    startCopy[0] = 999;
    endCopy[0] = 999;
    orderCopy[0] = 999;
    expect(field.distanceFromStart(0, 0)).toBe(0);
    expect(field.distanceFromEnd(0, 0)).toBe(4);
    expect(field.copyReachableCells()[0]).toBe(0);
  });

  it('reports UNREACHABLE baseline when end is disconnected', () => {
    const track = parseRacetrack('S#E\n###\n...');
    const field = computeBfsDistances(track);

    expect(field.baseline).toBe(UNREACHABLE);
    expect(field.reachableCount).toBe(1);
    expect(field.distanceFromStart(0, 2)).toBe(UNREACHABLE);
    expect(field.distanceFromEnd(0, 0)).toBe(UNREACHABLE);
    expect(field.distanceFromEnd(0, 2)).toBe(0);
  });

  it('validates DistanceField array lengths', () => {
    const track = parseRacetrack('S.E');
    const valid = new Int32Array(3);
    const invalid = new Int32Array(2);
    expect(() => new DistanceField(track, invalid, valid, valid)).toThrow(RangeError);
    expect(() => new DistanceField(track, valid, invalid, valid)).toThrow(RangeError);
  });
});
