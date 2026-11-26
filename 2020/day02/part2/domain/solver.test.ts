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

function countValidWithXorOracle(raw: string): number {
  let valid = 0;
  for (const line of raw.split('\n')) {
    const [positions, letterToken, password] = line.split(' ');
    const [firstText, secondText] = positions!.split('-');
    const letter = letterToken![0]!;
    const hit1 = password![Number(firstText) - 1] === letter;
    const hit2 = password![Number(secondText) - 1] === letter;
    if (hit1 !== hit2) valid += 1;
  }
  return valid;
}

class StubClock implements Clock {
  #calls = 0;

  nowMs(): number {
    this.#calls += 1;
    return this.#calls === 1 ? 10 : 14;
  }
}

function createStubClock(): Clock {
  return new StubClock();
}

function parseEmptyInput(): void {
  solver.parse('');
}

function parseMalformedLine(): void {
  solver.parse('invalid line');
}

function traceWithZeroMaxSteps(): void {
  solver.trace!(solver.parse(EXAMPLE_INPUT), { maxSteps: 0 });
}

describe('2020 day02 part2 solver', () => {
  it('parses and solves the official example to 1', () => {
    const db = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(db)).toBe(1);
  });

  it('validates symmetric single-slot XOR matches including end-of-string', () => {
    expect(solver.solve(solver.parse('1-3 a: abcde'))).toBe(1);
    expect(solver.solve(solver.parse('1-3 c: xbcde'))).toBe(1);
    expect(solver.solve(solver.parse('1-4 z: abcz'))).toBe(1);
  });

  it('rejects invalid XOR pairs when neither or both positions match', () => {
    expect(solver.solve(solver.parse('1-3 b: cdefg'))).toBe(0);
    expect(solver.solve(solver.parse('2-9 c: ccccccccc'))).toBe(0);
  });

  it('handles part 1 count confusion and 0-based indexing traps', () => {
    expect(solver.solve(solver.parse('1-3 a: abcaaa'))).toBe(1);
    expect(solver.solve(solver.parse('1-3 a: bacd'))).toBe(0);
  });

  it('rejects entries with equal 1-based positions regardless of character match', () => {
    expect(solver.solve(solver.parse('2-2 a: bab'))).toBe(0);
    expect(solver.solve(solver.parse('2-2 a: bbb'))).toBe(0);
  });

  it('handles out-of-bounds second or both positions safely', () => {
    expect(solver.solve(solver.parse('1-5 a: ab'))).toBe(1);
    expect(solver.solve(solver.parse('5-7 a: ab'))).toBe(0);
  });

  it('matches an independent XOR oracle across 40 seeded PRNG entries', () => {
    const raw = buildSeededInput(40);
    const actual = solver.solve(solver.parse(raw));
    expect(actual).toBeGreaterThan(0);
    expect(actual).toBeLessThan(40);
    expect(actual).toBe(countValidWithXorOracle(raw));
  });

  it('produces uncapped, maxSteps-capped, and validated traces', () => {
    const db = solver.parse(EXAMPLE_INPUT);
    const uncapped = solver.trace!(db);
    expect(uncapped).toHaveLength(3);
    expect(uncapped[0]!.evaluation.policy.id).toBe('toboggan');
    expect([uncapped[0]!.isValid, uncapped[1]!.isValid, uncapped[2]!.isValid]).toEqual([
      true,
      false,
      false,
    ]);
    expect(uncapped.at(-1)!.validSoFar).toBe(1);

    const capped = solver.trace!(db, { maxSteps: 2 });
    expect(capped).toHaveLength(2);
    expect(capped[0]!.entryIndex).toBe(0);
    expect(capped[1]!.entryIndex).toBe(2);
    expect(capped[1]!.validSoFar).toBe(1);

    expect(traceWithZeroMaxSteps).toThrow(RangeError);
  });

  it('propagates parse errors on invalid raw input', () => {
    expect(parseEmptyInput).toThrow(RangeError);
    expect(parseMalformedLine).toThrow(SyntaxError);
  });

  it('integrates cleanly with executeSolver', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT, createStubClock());
    expect(execution.answer).toBe(1);
    expect(execution.elapsedMs).toBe(4);
    expect(execution.runtime).toBe('main-thread');
  });
});
