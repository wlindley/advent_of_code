import { describe, expect, it } from 'vitest';
import { parseBurrow } from './parser';
import { STANDARD_BURROW_POLICY, StandardBurrowPolicy } from './policy';

const SAMPLE = [
  '#############',
  '#...........#',
  '###B#C#B#D###',
  '  #A#D#C#A#',
  '  #########',
].join('\n');

describe('BurrowPolicy', () => {
  it('prepares a depth-2 BurrowState under StandardBurrowPolicy', () => {
    const diagram = parseBurrow(SAMPLE);
    const policy = new StandardBurrowPolicy();
    expect(policy.id).toBe('standard');
    expect(policy.label).toBe('Standard (depth 2)');
    expect(policy.roomDepth).toBe(2);
    expect(Object.isFrozen(STANDARD_BURROW_POLICY)).toBe(true);

    const state = STANDARD_BURROW_POLICY.prepare(diagram);
    expect(state.roomDepth).toBe(2);
    expect(state.key).toBe('.......BACDBCDA');
  });
});
