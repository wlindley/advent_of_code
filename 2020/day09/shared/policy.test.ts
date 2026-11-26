import { describe, expect, it } from 'vitest';
import { ENCRYPTION_WEAKNESS_POLICY, FIRST_INVALID_POLICY } from './policy';
import { XmasStream } from './stream';

const OFFICIAL_W5 = new XmasStream([
  35n, 20n, 15n, 25n, 47n, 40n, 62n, 55n, 65n, 95n,
  102n, 117n, 150n, 182n, 127n, 219n, 299n, 277n, 309n, 576n,
]);

describe('XmasAttackPolicy strategies', () => {
  it('solves and traces Part 1 with FIRST_INVALID_POLICY', () => {
    expect(Object.isFrozen(FIRST_INVALID_POLICY)).toBe(true);
    expect(FIRST_INVALID_POLICY.id).toBe('first-invalid');
    expect(FIRST_INVALID_POLICY.solve(OFFICIAL_W5, 5)).toBe(127n);
    const trace = FIRST_INVALID_POLICY.trace(OFFICIAL_W5, 5, 240);
    expect(trace).toHaveLength(10);
    expect(trace[9]!.phase).toBe('preamble');
  });

  it('solves and traces Part 2 with ENCRYPTION_WEAKNESS_POLICY', () => {
    expect(Object.isFrozen(ENCRYPTION_WEAKNESS_POLICY)).toBe(true);
    expect(ENCRYPTION_WEAKNESS_POLICY.id).toBe('encryption-weakness');
    expect(ENCRYPTION_WEAKNESS_POLICY.solve(OFFICIAL_W5, 5)).toBe(62n);
    const trace = ENCRYPTION_WEAKNESS_POLICY.trace(OFFICIAL_W5, 5, 240);
    expect(trace).toHaveLength(16);
    expect(trace[15]!.phase).toBe('weakness');
  });
});
