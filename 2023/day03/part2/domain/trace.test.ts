import { describe, expect, it } from 'vitest';
import { PartNumber, SchematicSymbol } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, GearTraceFrame, solver, traceGears } from './index';

const EXAMPLE_INPUT = [
  '467..114..',
  '...*......',
  '..35..633.',
  '......#...',
  '617*......',
  '.....+.58.',
  '..592.....',
  '......755.',
  '...$.*....',
  '.664.598..',
].join('\n');

describe('2023 Day 03 Part 2 trace', () => {
  it('returns an empty frozen array when no star candidates exist', () => {
    const noSymbols = solver.parse('123.456\n.......');
    const nonStarOnly = solver.parse('12+34\n..#..');
    for (const schematic of [noSymbols, nonStarOnly]) {
      const frames = traceGears(schematic);
      expect(frames).toEqual([]);
      expect(Object.isFrozen(frames)).toBe(true);
    }
  });

  it('traces all-decoy candidates with isGear false and zero ratio', () => {
    const schematic = solver.parse('*..\n1*.\n1*2\n.3.');
    const frames = traceGears(schematic);
    expect(frames).toHaveLength(3);
    for (const frame of frames) {
      expect(frame.isGear).toBe(false);
      expect(frame.ratio).toBe(0n);
      expect(frame.gearCount).toBe(0);
      expect(frame.runningSum).toBe(0n);
    }
  });

  it('traces the official 3-candidate progression with dynamic getters and frozen snapshots', () => {
    const schematic = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(schematic);
    expect(frames).toHaveLength(3);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(Object.isFrozen(frames[0]!.adjacentParts)).toBe(true);
    expect(Object.isFrozen(frames[0]!.confirmedGearIds)).toBe(true);
    expect(Object.isFrozen(frames[0]!.gearPartIds)).toBe(true);

    expect(frames[0]!.candidateIndex).toBe(0);
    expect(frames[0]!.totalCandidates).toBe(3);
    expect(frames[0]!.isGear).toBe(true);
    expect(frames[0]!.ratio).toBe(16345n);
    expect(frames[0]!.gearCount).toBe(1);
    expect(frames[0]!.runningSum).toBe(16345n);

    expect(frames[1]!.isGear).toBe(false);
    expect(frames[1]!.ratio).toBe(0n);
    expect(frames[1]!.gearCount).toBe(1);
    expect(frames[1]!.runningSum).toBe(16345n);

    expect(frames[2]!.isGear).toBe(true);
    expect(frames[2]!.ratio).toBe(451490n);
    expect(frames[2]!.gearCount).toBe(2);
    expect(frames[2]!.runningSum).toBe(467835n);
  });

  it('treats 0*5 as a valid gear with ratio 0n and deduplicates shared gearPartIds', () => {
    const zeroFrames = traceGears(solver.parse('0*5'));
    expect(zeroFrames).toHaveLength(1);
    expect(zeroFrames[0]!.isGear).toBe(true);
    expect(zeroFrames[0]!.ratio).toBe(0n);
    expect(zeroFrames[0]!.gearCount).toBe(1);
    expect(zeroFrames[0]!.gearPartIds).toEqual([0, 1]);
    expect(zeroFrames[0]!.runningSum).toBe(0n);

    const sharedFrames = traceGears(solver.parse('10*20*30'));
    expect(sharedFrames).toHaveLength(2);
    expect(sharedFrames[0]!.gearPartIds).toEqual([0, 1]);
    expect(sharedFrames[1]!.gearPartIds).toEqual([0, 1, 2]);
    expect(sharedFrames[1]!.confirmedGearIds).toEqual([0, 1]);
    expect(sharedFrames[1]!.runningSum).toBe(800n);
  });

  it('samples trace frames cleanly and validates maxSteps and GearTraceFrame invariants', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const schematic = solver.parse(EXAMPLE_INPUT);

    const twoFrames = traceGears(schematic, { maxSteps: 2 });
    expect(twoFrames).toHaveLength(2);
    expect(twoFrames[0]!.candidateIndex).toBe(0);
    expect(twoFrames[1]!.candidateIndex).toBe(2);
    expect(twoFrames[1]!.runningSum).toBe(467835n);

    const oneFrame = traceGears(schematic, { maxSteps: 1 });
    expect(oneFrame).toHaveLength(1);
    expect(oneFrame[0]!.candidateIndex).toBe(2);
    expect(oneFrame[0]!.runningSum).toBe(467835n);

    expect(() => traceGears(schematic, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceGears(schematic, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => traceGears(schematic, { maxSteps: 1.5 })).toThrow(RangeError);
    expect(() => traceGears(schematic, { maxSteps: Number.NaN })).toThrow(RangeError);

    const nonStar = new SchematicSymbol(0, 0, 0, '+');
    expect(() => new GearTraceFrame(0, 1, nonStar, [], [], [], 0n)).toThrow(RangeError);

    const star = new SchematicSymbol(0, 0, 1, '*');
    const adj = [new PartNumber(0, 0, 0, 0, 3), new PartNumber(1, 0, 2, 2, 4)];
    const confirmed = [0];
    const partIds = [0, 1];
    const frame = new GearTraceFrame(0, 1, star, adj, confirmed, partIds, 12n);
    adj.pop();
    confirmed.pop();
    partIds.pop();
    expect(frame.adjacentParts).toHaveLength(2);
    expect(frame.confirmedGearIds).toEqual([0]);
    expect(frame.gearPartIds).toEqual([0, 1]);
  });
});
