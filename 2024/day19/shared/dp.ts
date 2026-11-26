import { DesignAnalysis, type LinenLayout, assertValidStripeSequence, stripeToIndex } from './model';
import { NO_CHILD, PatternTrie } from './trie';

function encodeDesign(design: string): Uint8Array {
  assertValidStripeSequence(design, 'design');
  const encoded = new Uint8Array(design.length);
  for (let i = 0; i < design.length; i += 1) {
    encoded[i] = stripeToIndex(design[i]!);
  }
  return encoded;
}

function reconstructWitness(design: string, prevSplit: Int32Array): readonly string[] {
  const tiles: string[] = [];
  for (let pos = design.length; pos > 0; pos = prevSplit[pos]!) {
    tiles.push(design.slice(prevSplit[pos]!, pos));
  }
  tiles.reverse();
  return tiles;
}

/** Computes exact prefix BigInt arrangement counts and a canonical witness for one design. */
export function analyzeDesign(trie: PatternTrie, design: string): DesignAnalysis {
  const encoded = encodeDesign(design);
  const len = encoded.length;
  const dp = new Array<bigint>(len + 1).fill(0n);
  const prevSplit = new Int32Array(len + 1).fill(-1);
  dp[0] = 1n;

  for (let i = 0; i < len; i += 1) {
    const ways = dp[i]!;
    if (ways === 0n) continue;
    let node = 0;
    for (let j = i; j < len; j += 1) {
      node = trie.next(node, encoded[j]!);
      if (node === NO_CHILD) break;
      if (trie.isTerminal(node)) {
        const nextPos = j + 1;
        dp[nextPos] = dp[nextPos]! + ways;
        if (prevSplit[nextPos]! === -1) prevSplit[nextPos] = i;
      }
    }
  }

  const witness = dp[len]! > 0n ? reconstructWitness(design, prevSplit) : null;
  return new DesignAnalysis(design, dp, witness);
}

/** Analyzes every target design in `layout` against a single compiled `PatternTrie`. */
export function analyzeLayout(layout: LinenLayout): readonly DesignAnalysis[] {
  const trie = PatternTrie.fromPatterns(layout.patterns);
  return Object.freeze(layout.designs.map((design) => analyzeDesign(trie, design)));
}

/** Counts how many target designs in `layout` have at least one valid decomposition (Part 1). */
export function countPossibleDesigns(layout: LinenLayout): number {
  let possible = 0;
  for (const analysis of analyzeLayout(layout)) {
    if (analysis.possible) possible += 1;
  }
  return possible;
}

/** Sums the exact BigInt arrangement counts across all target designs in `layout` (Part 2). */
export function countTotalArrangements(layout: LinenLayout): bigint {
  let total = 0n;
  for (const analysis of analyzeLayout(layout)) {
    total += analysis.wayCount;
  }
  return total;
}
