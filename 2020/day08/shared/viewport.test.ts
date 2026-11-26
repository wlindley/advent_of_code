import { describe, expect, it } from 'vitest';
import { LOOP_ACCUMULATOR_POLICY, REPAIR_BOOT_POLICY } from './policy';
import { parseBootProgram } from './program';
import { traceBootDiagnosis } from './trace';
import {
  computeDebuggerWindow,
  DebuggerWindow,
  DEFAULT_WINDOW_ROWS,
  JumpArcProjection,
} from './viewport';

const EXAMPLE_INPUT = [
  'nop +0',
  'acc +1',
  'jmp +4',
  'acc +3',
  'jmp -3',
  'acc -99',
  'acc +1',
  'jmp -4',
  'acc +6',
].join('\n');

describe('viewport', () => {
  it('validates JumpArcProjection and derives row projections and clipping flags', () => {
    const forward = new JumpArcProjection(2, 6, 0, 9);
    expect(Object.isFrozen(forward)).toBe(true);
    expect(forward.fromRow).toBe(2);
    expect(forward.toRow).toBe(6);
    expect(forward.delta).toBe(4);
    expect(forward.isBackward).toBe(false);
    expect(forward.isFromClipped).toBe(false);
    expect(forward.isToClipped).toBe(false);

    const clipped = new JumpArcProjection(2, 25, 5, 15);
    expect(clipped.isFromClipped).toBe(true);
    expect(clipped.isToClipped).toBe(true);
    expect(clipped.fromRow).toBe(0);
    expect(clipped.toRow).toBe(9);

    const backwardClipped = new JumpArcProjection(12, 1, 5, 15);
    expect(backwardClipped.isBackward).toBe(true);
    expect(backwardClipped.isFromClipped).toBe(false);
    expect(backwardClipped.isToClipped).toBe(true);
    expect(backwardClipped.fromRow).toBe(7);
    expect(backwardClipped.toRow).toBe(0);

    expect(() => new JumpArcProjection(0, 1, -1, 5)).toThrow(RangeError);
    expect(() => new JumpArcProjection(0, 1, 5, 5)).toThrow(RangeError);
  });

  it('validates DebuggerWindow invariants and derived pagination flags', () => {
    const win = new DebuggerWindow(30, 5, 15, 10, null);
    expect(Object.isFrozen(win)).toBe(true);
    expect(win.visibleCount).toBe(10);
    expect(win.hasRowsAbove).toBe(true);
    expect(win.hasRowsBelow).toBe(true);
    expect(win.jumpArc).toBeNull();

    const full = new DebuggerWindow(9, 0, 9, 0, null);
    expect(full.hasRowsAbove).toBe(false);
    expect(full.hasRowsBelow).toBe(false);

    expect(() => new DebuggerWindow(0, 0, 1, 0, null)).toThrow(RangeError);
    expect(() => new DebuggerWindow(5, 0, 6, 0, null)).toThrow(RangeError);
  });

  it('computes full window when program fits within maxVisibleRows', () => {
    expect(DEFAULT_WINDOW_ROWS).toBe(19);
    const frames = traceBootDiagnosis(parseBootProgram(EXAMPLE_INPUT), LOOP_ACCUMULATOR_POLICY);

    const nopWin = computeDebuggerWindow(frames[0]!, DEFAULT_WINDOW_ROWS);
    expect(nopWin.startPc).toBe(0);
    expect(nopWin.endPc).toBe(9);
    expect(nopWin.visibleCount).toBe(9);
    expect(nopWin.jumpArc).toBeNull();

    const jmpForwardWin = computeDebuggerWindow(frames[2]!, DEFAULT_WINDOW_ROWS);
    expect(jmpForwardWin.jumpArc).not.toBeNull();
    expect(jmpForwardWin.jumpArc!.fromRow).toBe(2);
    expect(jmpForwardWin.jumpArc!.toRow).toBe(6);
    expect(jmpForwardWin.jumpArc!.isBackward).toBe(false);

    const jmpBackwardWin = computeDebuggerWindow(frames[4]!, DEFAULT_WINDOW_ROWS);
    expect(jmpBackwardWin.jumpArc!.isBackward).toBe(true);
    expect(jmpBackwardWin.jumpArc!.fromRow).toBe(7);
    expect(jmpBackwardWin.jumpArc!.toRow).toBe(3);
  });

  it('centers window on activePc for long programs and handles terminated exit pc', () => {
    const lines: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      lines.push(i === 39 ? 'jmp -39' : 'acc +1');
    }
    const program = parseBootProgram(lines.join('\n'));
    const frames = traceBootDiagnosis(program, REPAIR_BOOT_POLICY, { maxSteps: 50 });

    const middleWin = computeDebuggerWindow(frames[20]!, 11);
    expect(middleWin.visibleCount).toBe(11);
    expect(middleWin.startPc).toBe(15);
    expect(middleWin.endPc).toBe(26);
    expect(middleWin.hasRowsAbove).toBe(true);
    expect(middleWin.hasRowsBelow).toBe(true);

    const endWin = computeDebuggerWindow(frames[frames.length - 1]!, 11);
    expect(endWin.startPc).toBe(29);
    expect(endWin.endPc).toBe(40);
    expect(endWin.hasRowsBelow).toBe(false);

    expect(() => computeDebuggerWindow(frames[0]!, 0)).toThrow(RangeError);
  });
});
