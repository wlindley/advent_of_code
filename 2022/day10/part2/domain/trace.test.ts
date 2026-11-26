import { describe, expect, it } from 'vitest';
import { CpuProgram, CpuTimeline } from '../../shared';
import {
  CrtBeamTraceFrame,
  buildCrtBeamTrace,
  slotCompletionCycle,
  type SlotDecodeState,
} from './index';

function buildConstantProgram(xValue: number, cycles: number): CpuProgram {
  const lines = [`addx ${xValue - 1}`, ...Array.from({ length: cycles - 2 }, () => 'noop')];
  return CpuProgram.parse(lines.join('\n'));
}

function buildAllNoopProgram(cycles: number): CpuProgram {
  return CpuProgram.parse(Array.from({ length: cycles }, () => 'noop').join('\n'));
}

describe('Day 10 Part 2 CRT beam trace', () => {
  it('computes and validates slot completion cycles 0..7', () => {
    expect(slotCompletionCycle(0)).toBe(205);
    expect(slotCompletionCycle(1)).toBe(210);
    expect(slotCompletionCycle(7)).toBe(240);

    for (const bad of [-1, 8, 1.5, Number.NaN]) {
      expect(() => slotCompletionCycle(bad)).toThrow(/slot/i);
    }
  });

  it('validates CrtBeamTraceFrame arguments, freezes slots, and computes derived getters', () => {
    const timeline = CpuTimeline.execute(buildAllNoopProgram(10));
    const snap = timeline.snapshotAt(5);
    const slots: SlotDecodeState[] = [
      { status: 'decoded', letter: 'E' },
      { status: 'unknown' },
      ...Array.from({ length: 6 }, () => ({ status: 'pending' }) as const),
    ];
    const frame = new CrtBeamTraceFrame(snap, 10, slots);

    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.slots)).toBe(true);
    expect(Object.isFrozen(frame.slots[0])).toBe(true);
    expect(frame.cycle).toBe(5);
    expect(frame.drawnPixelCount).toBe(5);
    expect(frame.isScreenComplete).toBe(false);
    expect(frame.isComplete).toBe(false);
    expect(frame.decodedText).toBe('E?______');

    expect(() => new CrtBeamTraceFrame(snap, 4, slots)).toThrow(/totalCycles/i);
    expect(() => new CrtBeamTraceFrame(snap, 10, slots.slice(0, 7))).toThrow(/8/);
  });

  it('traces short (10), partial (212), exact (240), and long (600) timelines with bounded steps', () => {
    const shortTrace = buildCrtBeamTrace(CpuTimeline.execute(buildAllNoopProgram(10)));
    expect(shortTrace).toHaveLength(10);
    expect(shortTrace[9]!.isComplete).toBe(true);
    expect(shortTrace[9]!.isScreenComplete).toBe(false);
    expect(shortTrace[9]!.drawnPixelCount).toBe(10);
    expect(shortTrace[9]!.decodedText).toBe('________');

    const partialTrace = buildCrtBeamTrace(CpuTimeline.execute(buildAllNoopProgram(212)));
    expect(partialTrace).toHaveLength(212);
    expect(partialTrace[203]!.cycle).toBe(204);
    expect(partialTrace[203]!.decodedText).toBe('________');
    expect(partialTrace[204]!.cycle).toBe(205);
    expect(partialTrace[204]!.decodedText).toBe('?_______');
    expect(partialTrace[211]!.decodedText).toBe('??______');

    const exactTrace = buildCrtBeamTrace(CpuTimeline.execute(buildAllNoopProgram(240)));
    expect(exactTrace).toHaveLength(240);
    expect(exactTrace[239]!.isScreenComplete).toBe(true);
    expect(exactTrace[239]!.isComplete).toBe(true);
    expect(exactTrace[239]!.drawnPixelCount).toBe(240);
    expect(exactTrace[239]!.decodedText).toBe('????????');

    const longTimeline = CpuTimeline.execute(buildConstantProgram(1, 600));
    const longTrace = buildCrtBeamTrace(longTimeline);
    expect(longTrace).toHaveLength(240);
    expect(longTrace[0]!.cycle).toBe(1);
    expect(longTrace[239]!.cycle).toBe(600);
    expect(longTrace[239]!.drawnPixelCount).toBe(240);
    expect(longTrace[239]!.isScreenComplete).toBe(true);
    expect(longTrace[239]!.isComplete).toBe(true);

    const customTrace = buildCrtBeamTrace(longTimeline, { maxSteps: 12 });
    expect(customTrace).toHaveLength(12);
    expect(customTrace[11]!.cycle).toBe(600);

    expect(() => buildCrtBeamTrace(longTimeline, { maxSteps: 0 })).toThrow(/maxSteps/i);
  });
});
