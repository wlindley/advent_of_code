import {
  BananaSequenceCandidate,
  BuyerOutcome,
  DELTA_BASE,
  DELTA_KEY_SPACE,
  DELTA_OFFSET,
  DELTA_ROLL_MOD,
  MIN_PRICE_WINDOW_SIZE,
  MarketOptimizationResult,
  MarketPriceWindow,
  SecretSumResult,
} from './model';
import {
  advanceSecret,
  advanceSecretN,
  assertNonNegativeSafeInt,
  assertPositiveSafeInt,
  secretPrice,
} from './prng';

/** Sums the `steps`-th secret numbers across all initial buyer `seeds`. */
export function sumNthSecrets(seeds: readonly number[], steps: number): bigint {
  return evaluateBuyers(seeds, steps).totalFinalSecret;
}

/** Evaluates all buyers after `steps` PRNG transitions and returns an immutable `SecretSumResult`. */
export function evaluateBuyers(seeds: readonly number[], steps: number): SecretSumResult {
  assertNonNegativeSafeInt(steps, 'steps');
  const buyers: BuyerOutcome[] = [];
  for (let i = 0; i < seeds.length; i += 1) {
    const initial = seeds[i]!;
    buyers.push(new BuyerOutcome(i, initial, advanceSecretN(initial, steps)));
  }
  return new SecretSumResult(steps, buyers);
}

function scanBuyerBananas(
  initialSecret: number,
  stamp: number,
  steps: number,
  totals: Int32Array,
  seenStamp: Int32Array,
  buyerCounts: Int32Array,
): void {
  let cur = initialSecret;
  let prevPrice = secretPrice(cur);
  let key = 0;
  for (let t = 1; t <= steps; t += 1) {
    cur = advanceSecret(cur);
    const price = cur % 10;
    key = (key % DELTA_ROLL_MOD) * DELTA_BASE + (price - prevPrice + DELTA_OFFSET);
    prevPrice = price;
    if (t >= 4 && seenStamp[key] !== stamp) {
      seenStamp[key] = stamp;
      totals[key] = totals[key]! + price;
      buyerCounts[key] = buyerCounts[key]! + 1;
    }
  }
}

function insertTopCandidate(
  top: BananaSequenceCandidate[],
  candidate: BananaSequenceCandidate,
  topK: number,
): void {
  // Why: key is scanned in strictly ascending order, so an equal total can never beat an earlier key.
  if (top.length === topK && candidate.totalBananas <= top[top.length - 1]!.totalBananas) return;
  let pos = top.length;
  while (pos > 0 && top[pos - 1]!.totalBananas < candidate.totalBananas) {
    pos -= 1;
  }
  top.splice(pos, 0, candidate);
  if (top.length > topK) top.pop();
}

function collectTopCandidates(
  totals: Int32Array,
  buyerCounts: Int32Array,
  topK: number,
): readonly BananaSequenceCandidate[] {
  const top: BananaSequenceCandidate[] = [];
  for (let k = 0; k < DELTA_KEY_SPACE; k += 1) {
    const matched = buyerCounts[k]!;
    if (matched === 0) continue;
    insertTopCandidate(top, new BananaSequenceCandidate(k, totals[k]!, matched), topK);
  }
  return top;
}

/** Finds the top-K 4-delta trigger sequences maximizing total bananas on first match per buyer. */
export function findBestBananaSequence(
  seeds: readonly number[],
  steps: number,
  topK: number,
): MarketOptimizationResult {
  assertNonNegativeSafeInt(steps, 'steps');
  assertPositiveSafeInt(topK, 'topK');
  for (const seed of seeds) assertNonNegativeSafeInt(seed, 'seed');
  if (seeds.length === 0 || steps < 4) {
    return new MarketOptimizationResult(steps, seeds.length, []);
  }
  const totals = new Int32Array(DELTA_KEY_SPACE);
  const seenStamp = new Int32Array(DELTA_KEY_SPACE);
  const buyerCounts = new Int32Array(DELTA_KEY_SPACE);
  for (let i = 0; i < seeds.length; i += 1) {
    scanBuyerBananas(seeds[i]!, i + 1, steps, totals, seenStamp, buyerCounts);
  }
  return new MarketOptimizationResult(steps, seeds.length, collectTopCandidates(totals, buyerCounts, topK));
}

function computeWindowStart(steps: number, matchedStep: number | null, windowSize: number): number {
  if (steps + 1 <= windowSize) return 0;
  if (matchedStep === null) return steps + 1 - windowSize;
  const minStart = Math.max(0, matchedStep - windowSize + 1);
  const maxStart = Math.min(steps + 1 - windowSize, matchedStep - 4);
  const ideal = matchedStep - Math.floor(windowSize * 0.7);
  return Math.max(minStart, Math.min(maxStart, ideal));
}

function fillPriceStream(
  initialSecret: number,
  steps: number,
  targetKey: number | null,
): { readonly prices: Uint8Array; readonly matchedStep: number | null } {
  const prices = new Uint8Array(steps + 1);
  let cur = initialSecret;
  prices[0] = secretPrice(cur);
  let key = 0;
  let matchedStep: number | null = null;
  for (let t = 1; t <= steps; t += 1) {
    cur = advanceSecret(cur);
    const price = cur % 10;
    prices[t] = price;
    key = (key % DELTA_ROLL_MOD) * DELTA_BASE + (price - prices[t - 1]! + DELTA_OFFSET);
    if (targetKey !== null && matchedStep === null && t >= 4 && key === targetKey) matchedStep = t;
  }
  return { prices, matchedStep };
}

/** Builds a bounded price window around the buyer's first occurrence of `targetKey` (if any). */
export function buildBuyerPriceWindow(
  initialSecret: number,
  steps: number,
  targetKey: number | null,
  windowSize: number,
): MarketPriceWindow {
  assertNonNegativeSafeInt(initialSecret, 'initialSecret');
  assertNonNegativeSafeInt(steps, 'steps');
  if (!Number.isSafeInteger(windowSize) || windowSize < MIN_PRICE_WINDOW_SIZE) {
    throw new RangeError(`windowSize must be integer >= ${MIN_PRICE_WINDOW_SIZE}, got ${windowSize}`);
  }
  if (targetKey !== null && (!Number.isSafeInteger(targetKey) || targetKey < 0 || targetKey >= DELTA_KEY_SPACE)) {
    throw new RangeError(`targetKey out of range: ${targetKey}`);
  }
  const { prices, matchedStep } = fillPriceStream(initialSecret, steps, targetKey);
  const startStep = computeWindowStart(steps, matchedStep, windowSize);
  const endStep = Math.min(steps, startStep + windowSize - 1);
  return new MarketPriceWindow(startStep, Array.from(prices.subarray(startStep, endStep + 1)), matchedStep);
}
