import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME } from './evaluator';
import { parseMonkeyRiddle } from './parser';
import { type MonkeyJob, MonkeyRiddle } from './riddle';
import {
  buildEqualitySolveTrace,
  buildEvaluationTrace,
  DEFAULT_TRACE_MAX_STEPS,
  MAX_FOCUSED_NODES,
} from './trace';

const OFFICIAL_EXAMPLE = [
  'root: pppw + sjmn',
  'dbpl: 5',
  'cczh: sllz + lgvd',
  'zczc: 2',
  'ptdq: humn - dvpt',
  'dvpt: 3',
  'lfqf: 4',
  'humn: 5',
  'ljgn: 2',
  'sjmn: drzm * dbpl',
  'sllz: 4',
  'pppw: cczh / lfqf',
  'lgvd: ljgn * ptdq',
  'drzm: hmdt - zczc',
  'hmdt: 32',
].join('\n');

function buildDeepChain(count: number): MonkeyRiddle {
  const jobs: MonkeyJob[] = [{ kind: 'literal', name: DEFAULT_UNKNOWN_NAME, value: 1n }];
  for (let i = 1; i < count - 1; i += 1) {
    const prev = i === 1 ? DEFAULT_UNKNOWN_NAME : `m${i - 1}`;
    const cName = `c${i}`;
    jobs.push({ kind: 'literal', name: cName, value: 1n });
    jobs.push({ kind: 'op', name: `m${i}`, left: prev, op: '+', right: cName });
  }
  jobs.push({ kind: 'literal', name: 'rhs', value: BigInt(count) });
  jobs.push({ kind: 'op', name: DEFAULT_ROOT_NAME, left: `m${count - 2}`, op: '+', right: 'rhs' });
  return new MonkeyRiddle(jobs);
}

describe('trace', () => {
  it('builds evaluation trace frames for official example and caps via maxSteps', () => {
    const riddle = parseMonkeyRiddle(OFFICIAL_EXAMPLE);
    const full = buildEvaluationTrace(riddle, DEFAULT_ROOT_NAME);

    expect(full.length).toBeLessThanOrEqual(DEFAULT_TRACE_MAX_STEPS);
    expect(full[0]!.mode).toBe('evaluate');
    expect(full[0]!.resolvedCount).toBe(0);
    expect(full[0]!.activeName).toBeNull();
    expect(full[0]!.answerText).toBe('?');
    expect(full[full.length - 1]!.resolvedCount).toBe(15);
    expect(full[full.length - 1]!.answerText).toBe('152');
    expect(full[full.length - 1]!.finalAnswerText).toBe('152');
    expect(full[full.length - 1]!.nodes.length).toBeLessThanOrEqual(MAX_FOCUSED_NODES);

    const capped = buildEvaluationTrace(riddle, DEFAULT_ROOT_NAME, { maxSteps: 4 });
    expect(capped).toHaveLength(4);
    expect(capped[3]!.answerText).toBe('152');
    expect(() => buildEvaluationTrace(riddle, DEFAULT_ROOT_NAME, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('bounds focused nodes and frames on large trees', () => {
    const deep = buildDeepChain(25);
    const evalTrace = buildEvaluationTrace(deep, DEFAULT_ROOT_NAME, { maxSteps: 6 });
    expect(evalTrace).toHaveLength(6);
    for (const frame of evalTrace) {
      expect(frame.nodes.length).toBeLessThanOrEqual(MAX_FOCUSED_NODES);
    }

    const eqTrace = buildEqualitySolveTrace(deep, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME, { maxSteps: 5 });
    expect(eqTrace).toHaveLength(5);
    expect(eqTrace[eqTrace.length - 1]!.answerText).toBe('2');
    for (const frame of eqTrace) {
      expect(frame.nodes.length).toBeLessThanOrEqual(MAX_FOCUSED_NODES);
    }
  });

  it('builds equality solve trace for single-path and multi-path affine riddles', () => {
    const example = parseMonkeyRiddle(OFFICIAL_EXAMPLE);
    const eqTrace = buildEqualitySolveTrace(example, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME);
    expect(eqTrace[0]!.mode).toBe('equality');
    expect(eqTrace[0]!.answerText).toBe('?');
    expect(eqTrace[eqTrace.length - 1]!.answerText).toBe('301');
    expect(eqTrace[eqTrace.length - 1]!.finalAnswerText).toBe('301');

    const multi = parseMonkeyRiddle([
      'root: lhs + rhs',
      'lhs: two * humn',
      'rhs: humn + five',
      'two: 2',
      'five: 5',
      'humn: 0',
    ].join('\n'));
    const multiTrace = buildEqualitySolveTrace(multi, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME);
    expect(multiTrace).toHaveLength(1);
    expect(multiTrace[0]!.answerText).toBe('5');
  });
});
