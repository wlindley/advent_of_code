import { describe, expect, it } from 'vitest';
import { parseCustomsBatch } from './declaration';
import {
  ALL_YES_POLICY,
  ANY_YES_POLICY,
  AllYesPolicy,
  AnyYesPolicy,
  GroupConsensusResult,
  sumGroupConsensus,
} from './policy';

describe('2020 day06 consensus policies', () => {
  it('constructs frozen GroupConsensusResult with derived count and letters', () => {
    const result = new GroupConsensusResult('any-yes', 0b1010);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.policyId).toBe('any-yes');
    expect(result.count).toBe(2);
    expect(result.letters).toBe('bd');
    expect(() => new GroupConsensusResult('all-yes', -1)).toThrow(RangeError);
  });

  it('evaluates group union and intersection via frozen AnyYesPolicy and AllYesPolicy', () => {
    const batch = parseCustomsBatch('ab\nac');
    const group = batch.groups[0]!;
    expect(Object.isFrozen(ANY_YES_POLICY)).toBe(true);
    expect(Object.isFrozen(ALL_YES_POLICY)).toBe(true);
    expect(ANY_YES_POLICY).toBeInstanceOf(AnyYesPolicy);
    expect(ALL_YES_POLICY).toBeInstanceOf(AllYesPolicy);
    expect(ANY_YES_POLICY.label.length).toBeGreaterThan(0);
    expect(ANY_YES_POLICY.description.length).toBeGreaterThan(0);

    const anyRes = ANY_YES_POLICY.evaluate(group);
    expect(anyRes.policyId).toBe('any-yes');
    expect(anyRes.count).toBe(3);
    expect(anyRes.letters).toBe('abc');

    const allRes = ALL_YES_POLICY.evaluate(group);
    expect(allRes.policyId).toBe('all-yes');
    expect(allRes.count).toBe(1);
    expect(allRes.letters).toBe('a');
  });

  it('sums group consensus counts across a batch for both policies', () => {
    const batch = parseCustomsBatch('abc\n\na\nb\nc\n\nab\nac\n\na\na\na\na\n\nb');
    expect(sumGroupConsensus(batch, ANY_YES_POLICY)).toBe(11);
    expect(sumGroupConsensus(batch, ALL_YES_POLICY)).toBe(6);
  });
});
