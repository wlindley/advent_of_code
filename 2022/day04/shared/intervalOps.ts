import { ClosedInterval } from '../../../shared/core';

/** Returns true when `outer` completely covers `inner` (`outer.start <= inner.start && outer.end >= inner.end`). */
export function containsInterval(outer: ClosedInterval, inner: ClosedInterval): boolean {
  return outer.start <= inner.start && outer.end >= inner.end;
}

/** Returns true when `a` and `b` share at least one integer section. */
export function overlaps(a: ClosedInterval, b: ClosedInterval): boolean {
  return a.start <= b.end && b.start <= a.end;
}

/** Returns the overlapping closed sub-interval of `a` and `b`, or `null` if disjoint. */
export function intersection(a: ClosedInterval, b: ClosedInterval): ClosedInterval | null {
  const start = a.start >= b.start ? a.start : b.start;
  const end = a.end <= b.end ? a.end : b.end;
  return start <= end ? new ClosedInterval(start, end) : null;
}

/** Computes the minimal bounding `ClosedInterval` covering all provided intervals. */
export function computeGlobalBounds(intervals: readonly ClosedInterval[]): ClosedInterval {
  if (intervals.length === 0) {
    throw new RangeError('computeGlobalBounds requires at least one interval');
  }
  let minStart = intervals[0]!.start;
  let maxEnd = intervals[0]!.end;
  for (let i = 1; i < intervals.length; i += 1) {
    const current = intervals[i]!;
    if (current.start < minStart) minStart = current.start;
    if (current.end > maxEnd) maxEnd = current.end;
  }
  return new ClosedInterval(minStart, maxEnd);
}
