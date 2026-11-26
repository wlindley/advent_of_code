import { describe, expect, it } from 'vitest';
import { parseBrickSnapshot } from './brickSnapshot';
import { settleBricks } from './settleStack';
import { buildSlabTrace, DEFAULT_MAX_TRACE_STEPS, formatBrickLabel } from './slabTrace';
import { SupportGraph } from './supportAnalysis';

const OFFICIAL_EXAMPLE = [
  '1,0,1~1,2,1',
  '0,0,2~2,0,2',
  '0,2,3~2,2,3',
  '0,0,4~0,2,4',
  '2,0,5~2,2,5',
  '0,1,6~2,1,6',
  '1,1,8~1,1,9',
].join('\n');

describe('formatBrickLabel', () => {
  it('formats ids 0..25 as A..Z and >= 26 as #id', () => {
    expect(formatBrickLabel(0)).toBe('A');
    expect(formatBrickLabel(25)).toBe('Z');
    expect(formatBrickLabel(26)).toBe('#26');
    expect(formatBrickLabel(100)).toBe('#100');
  });

  it('throws RangeError on negative or non-integer ids', () => {
    expect(() => formatBrickLabel(-1)).toThrow(RangeError);
    expect(() => formatBrickLabel(1.5)).toThrow(RangeError);
  });
});

describe('buildSlabTrace', () => {
  it('produces complete scalar-only frames for the 7-brick example', () => {
    const stack = settleBricks(parseBrickSnapshot(OFFICIAL_EXAMPLE));
    const graph = new SupportGraph(stack);
    const frames = buildSlabTrace(stack, graph);

    expect(frames.length).toBe(8);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);

    expect(frames[0]).toMatchObject({
      step: 0,
      totalSteps: 7,
      settledCount: 0,
      totalBricks: 7,
      lastBrickIndex: -1,
      lastBrickDrop: 0,
      cumulativeDrop: 0,
      isFinal: false,
      safeCount: 0,
      loadBearingCount: 0,
    });
    expect(frames[1]).toMatchObject({
      step: 1,
      settledCount: 1,
      lastBrickIndex: 0,
      lastBrickDrop: 0,
      cumulativeDrop: 0,
      isFinal: false,
    });
    expect(frames[3]).toMatchObject({
      step: 3,
      settledCount: 3,
      lastBrickIndex: 2,
      lastBrickDrop: 1,
      cumulativeDrop: 1,
      isFinal: false,
    });
    expect(frames[7]).toMatchObject({
      step: 7,
      totalSteps: 7,
      settledCount: 7,
      totalBricks: 7,
      lastBrickIndex: 6,
      lastBrickDrop: 3,
      cumulativeDrop: 9,
      isFinal: true,
      safeCount: 5,
      loadBearingCount: 2,
    });
  });

  it('bounds long inputs to maxSteps while preserving start and end frames', () => {
    const lines: string[] = [];
    for (let i = 0; i < 150; i += 1) {
      lines.push(`0,0,${i * 2 + 1}~0,0,${i * 2 + 1}`);
    }
    const stack = settleBricks(parseBrickSnapshot(lines.join('\n')));
    const graph = new SupportGraph(stack);
    const frames = buildSlabTrace(stack, graph);
    expect(frames.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]!.step).toBe(0);
    expect(frames[frames.length - 1]!.isFinal).toBe(true);

    const singleFrame = buildSlabTrace(stack, graph, { maxSteps: 1 });
    expect(singleFrame.length).toBe(1);
    expect(singleFrame[0]!.isFinal).toBe(true);

    expect(() => buildSlabTrace(stack, graph, { maxSteps: 0 })).toThrow(RangeError);
  });
});
