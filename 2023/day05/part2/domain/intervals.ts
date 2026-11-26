import { ClosedInterval, IntervalUnion } from '../../../../shared/core';
import { assertNonNegativeBigInt, type RangeMap, type RangeRule } from '../../shared';

/** Immutable piecewise segment of an input interval mapped either by a `RangeRule` or identity. */
export class FlowRibbon {
  readonly source: ClosedInterval;
  readonly matchedRule: RangeRule | undefined;

  constructor(source: ClosedInterval, matchedRule: RangeRule | undefined) {
    if (
      matchedRule !== undefined &&
      (source.start < matchedRule.source.start || source.end > matchedRule.source.end)
    ) {
      throw new RangeError(
        `FlowRibbon source [${source.start}, ${source.end}] exceeds rule [${matchedRule.source.start}, ${matchedRule.source.end}]`,
      );
    }
    this.source = source;
    this.matchedRule = matchedRule;
    Object.freeze(this);
  }

  get delta(): bigint {
    return this.matchedRule !== undefined ? this.matchedRule.delta : 0n;
  }

  get destination(): ClosedInterval {
    return this.matchedRule === undefined
      ? this.source
      : new ClosedInterval(this.source.start + this.matchedRule.delta, this.source.end + this.matchedRule.delta);
  }

  get isIdentity(): boolean {
    return this.matchedRule === undefined;
  }
}

/** Interprets Part 2 `(start, length)` seed pairs as a normalized `IntervalUnion`. */
export function parseSeedRanges(seeds: readonly bigint[]): IntervalUnion {
  if (seeds.length === 0 || seeds.length % 2 !== 0) {
    throw new RangeError(`Expected non-empty even-length seed pairs, got ${seeds.length}`);
  }
  const intervals: ClosedInterval[] = [];
  for (let i = 0; i < seeds.length; i += 2) {
    const start = assertNonNegativeBigInt(seeds[i]!, `seeds[${i}]`);
    const length = seeds[i + 1]!;
    if (length < 1n) {
      throw new RangeError(`Seed range length at seeds[${i + 1}] must be >= 1n, got ${length}`);
    }
    intervals.push(new ClosedInterval(start, start + length - 1n));
  }
  return new IntervalUnion(intervals);
}

function advanceToRelevantRule(
  rules: readonly RangeRule[],
  startIndex: number,
  targetStart: bigint,
): number {
  let idx = startIndex;
  while (idx < rules.length && rules[idx]!.source.end < targetStart) {
    idx += 1;
  }
  return idx;
}

function splitIntervalFrom(
  interval: ClosedInterval,
  rules: readonly RangeRule[],
  startRuleIndex: number,
  out: FlowRibbon[],
): number {
  let cursor = interval.start;
  let ruleIdx = advanceToRelevantRule(rules, startRuleIndex, cursor);
  while (cursor <= interval.end && ruleIdx < rules.length) {
    const rule = rules[ruleIdx]!;
    if (cursor < rule.source.start) {
      const gapEnd = interval.end < rule.source.start - 1n ? interval.end : rule.source.start - 1n;
      out.push(new FlowRibbon(new ClosedInterval(cursor, gapEnd), undefined));
      cursor = gapEnd + 1n;
    } else {
      const matchEnd = interval.end < rule.source.end ? interval.end : rule.source.end;
      out.push(new FlowRibbon(new ClosedInterval(cursor, matchEnd), rule));
      cursor = matchEnd + 1n;
      // Advance only when the rule's right boundary is consumed so disjoint intervals share wide rules.
      if (matchEnd === rule.source.end) ruleIdx += 1;
    }
  }
  if (cursor <= interval.end) {
    out.push(new FlowRibbon(new ClosedInterval(cursor, interval.end), undefined));
  }
  return ruleIdx;
}

/** Splits a single `ClosedInterval` into ordered `FlowRibbon` segments against a `RangeMap`. */
export function splitIntervalByMap(interval: ClosedInterval, map: RangeMap): readonly FlowRibbon[] {
  const out: FlowRibbon[] = [];
  splitIntervalFrom(interval, map.rules, 0, out);
  return Object.freeze(out);
}

/** Splits every interval in a normalized `IntervalUnion` across a `RangeMap` in a single sweep. */
export function splitUnionByMap(union: IntervalUnion, map: RangeMap): readonly FlowRibbon[] {
  const out: FlowRibbon[] = [];
  let ruleIdx = 0;
  for (const interval of union.intervals) {
    ruleIdx = splitIntervalFrom(interval, map.rules, ruleIdx, out);
  }
  return Object.freeze(out);
}

/** Applies a `RangeMap` to an `IntervalUnion` and coalesces the resulting destination intervals. */
export function mapIntervalUnion(union: IntervalUnion, map: RangeMap): IntervalUnion {
  const ribbons = splitUnionByMap(union, map);
  const destinations: ClosedInterval[] = [];
  for (const ribbon of ribbons) {
    destinations.push(ribbon.destination);
  }
  return new IntervalUnion(destinations);
}
