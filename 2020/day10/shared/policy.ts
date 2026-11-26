import { computeArrangementTable } from './arrangements';
import type { AdapterChain } from './chain';
import { countJoltDifferences } from './differences';
import { type AdapterTraceFrame, traceArrangements, traceDifferences } from './trace';

/** Policy identifier distinguishing Part 1 differences from Part 2 arrangements. */
export type AdapterChainPolicyId = 'joltage-diff-product' | 'arrangement-count';

/** Strategy contract encapsulating solving and tracing an adapter chain problem. */
export interface AdapterChainPolicy {
  readonly id: AdapterChainPolicyId;
  readonly label: string;
  readonly metricLabel: string;
  solve(chain: AdapterChain): bigint;
  trace(chain: AdapterChain, maxSteps: number): readonly AdapterTraceFrame[];
}

/** Part 1 policy: multiply consecutive 1-jolt and 3-jolt step counts across the full chain. */
export const JOLTAGE_DIFF_PRODUCT_POLICY: AdapterChainPolicy = Object.freeze({
  id: 'joltage-diff-product',
  label: 'Jolt Differences',
  metricLabel: '1J * 3J Product',
  solve(chain: AdapterChain): bigint {
    return countJoltDifferences(chain).part1Product;
  },
  trace(chain: AdapterChain, maxSteps: number): readonly AdapterTraceFrame[] {
    return traceDifferences(chain, maxSteps);
  },
});

/** Part 2 policy: count distinct valid adapter arrangements from outlet 0 to device max + 3. */
export const ARRANGEMENT_COUNT_POLICY: AdapterChainPolicy = Object.freeze({
  id: 'arrangement-count',
  label: 'Arrangements DP',
  metricLabel: 'Distinct Arrangements',
  solve(chain: AdapterChain): bigint {
    return computeArrangementTable(chain).totalArrangements;
  },
  trace(chain: AdapterChain, maxSteps: number): readonly AdapterTraceFrame[] {
    return traceArrangements(chain, maxSteps);
  },
});
