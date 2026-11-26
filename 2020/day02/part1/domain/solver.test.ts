import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = '1-3 a: abcde\n1-3 b: cdefg\n2-9 c: ccccccccc';
const ALPHABET = 'abcd';

function nextSeededInt(state: { value: number }, maxExclusive: number): number {
  state.value = (state.value * 1664525 + 1013904223) >>> 0;
  return state.value % maxExclusive;
}

function generateSeededLine(state: { value: number }): string {
  const first = 1 + nextSeededInt(state, 4);
  const second = first + nextSeededInt(state, 5);
  const letter = ALPHABET[nextSeededInt(state, ALPHABET.length)]!;
  const length = 1 + nextSeededInt(state, 10);
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += ALPHABET[nextSeededInt(state, ALPHABET.length)]!;
  }
  return `${first}-${second} ${letter}: ${password}`;
}

function buildSeededInput(entryCount: number): string {
  const state = { value: 20201202 };
  const lines: string[] = [];
  for (let i = 0; i < entryCount; i += 1) {
    lines.push(generateSeededLine(state));
  }
  return lines.join('\n');
}

function countValidWithSplitOracle(raw: string): number {
  let valid = 0;
  for (const line of raw.split('\n')) {
    const [bounds, letterToken, password] = line.split(' ');
    const [minText, maxText] = bounds!.split('-');
    const letter = letterToken![0]!;
    const count = password!.split(letter).length - 1;
    if (count >= Number(minText) && count <= Number(maxText)) valid += 1;
  }
  return valid;
}

function createStubClock(): Clock {
  let calls = 0;
  return {
    nowMs() {
      calls += 1;
      return calls === 1 ? 10 : 14;
    },
  };
}

describe('2020 day02 part1 solver', () => {
  it('parses and solves the official example to 2', () => {
    const db = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(db)).toBe(2);
  });

  it('produces uncapped and maxSteps-capped traces', () => {
    const db = solver.parse(EXAMPLE_INPUT);
    const uncapped = solver.trace!(db);
    expect(uncapped).toHaveLength(3);
    expect(uncapped.at(-1)!.validSoFar).toBe(2);

    const capped = solver.trace!(db, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped[0]!.entryIndex).toBe(0);
    expect(capped[1]!.entryIndex).toBe(2);
    expect(capped[1]!.validSoFar).toBe(2);
  });

  it('propagates parse errors on invalid raw input', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('invalid line')).toThrow(SyntaxError);
  });

  it('integrates cleanly with executeSolver', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT, createStubClock());
    expect(execution.answer).toBe(2);
    expect(execution.elapsedMs).toBe(4);
    expect(execution.runtime).toBe('main-thread');
  });

  it('matches an independent split-based differential oracle across 40 seeded PRNG entries', () => {
    const raw = buildSeededInput(40);
    const db = solver.parse(raw);
    expect(solver.solve(db)).toBe(countValidWithSplitOracle(raw));
  });
});
