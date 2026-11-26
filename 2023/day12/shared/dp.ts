import { validateUnfoldFactor, type SpringRecord } from './record';

function buildBaseRow(pattern: string): bigint[] {
  const row = new Array<bigint>(pattern.length + 1).fill(0n);
  row[pattern.length] = 1n;
  for (let i = pattern.length - 1; i >= 0; i -= 1) {
    if (pattern[i] === '#') break;
    row[i] = 1n;
  }
  return row;
}

function buildDotPrefix(pattern: string): Int32Array {
  const prefix = new Int32Array(pattern.length + 1);
  for (let i = 0; i < pattern.length; i += 1) {
    prefix[i + 1] = prefix[i]! + (pattern[i] === '.' ? 1 : 0);
  }
  return prefix;
}

function canPlaceGroup(
  pattern: string,
  dotPrefix: Int32Array,
  start: number,
  size: number,
): boolean {
  const end = start + size;
  if (end > pattern.length) return false;
  if (dotPrefix[end]! !== dotPrefix[start]!) return false;
  return end === pattern.length || pattern[end] !== '#';
}

function computeGroupRow(
  pattern: string,
  dotPrefix: Int32Array,
  size: number,
  nextRow: readonly bigint[],
): bigint[] {
  const cur = new Array<bigint>(pattern.length + 1).fill(0n);
  for (let i = pattern.length - 1; i >= 0; i -= 1) {
    let ways = pattern[i] === '#' ? 0n : cur[i + 1]!;
    if (canPlaceGroup(pattern, dotPrefix, i, size)) {
      ways += nextRow[Math.min(pattern.length, i + size + 1)]!;
    }
    cur[i] = ways;
  }
  return cur;
}

/** Counts valid `#`/`.` arrangements for `record` in O(L * G) time using rolling BigInt rows. */
export function countArrangements(record: SpringRecord): bigint {
  const dotPrefix = buildDotPrefix(record.pattern);
  let nextRow = buildBaseRow(record.pattern);
  for (let g = record.groups.length - 1; g >= 0; g -= 1) {
    nextRow = computeGroupRow(record.pattern, dotPrefix, record.groups[g]!, nextRow);
  }
  return nextRow[0]!;
}

/** Unfolds each record by `unfoldFactor` and sums arrangement counts in exact BigInt arithmetic. */
export function sumArrangements(
  records: readonly SpringRecord[],
  unfoldFactor: number,
): bigint {
  const factor = validateUnfoldFactor(unfoldFactor);
  let total = 0n;
  for (const record of records) {
    total += countArrangements(record.unfold(factor));
  }
  return total;
}

/** Builds a frozen (G + 1) x (L + 1) suffix-DP matrix where `table[g][i]` counts suffix ways. */
export function buildArrangementDpTable(
  record: SpringRecord,
): readonly (readonly bigint[])[] {
  const dotPrefix = buildDotPrefix(record.pattern);
  const rows = new Array<readonly bigint[]>(record.groups.length + 1);
  let nextRow = buildBaseRow(record.pattern);
  rows[record.groups.length] = Object.freeze(nextRow);
  for (let g = record.groups.length - 1; g >= 0; g -= 1) {
    nextRow = computeGroupRow(record.pattern, dotPrefix, record.groups[g]!, nextRow);
    rows[g] = Object.freeze(nextRow);
  }
  return Object.freeze(rows);
}

function assertDpTableShape(
  record: SpringRecord,
  table: readonly (readonly bigint[])[],
): void {
  const expectedRows = record.groupCount + 1;
  const expectedCols = record.length + 1;
  if (table.length !== expectedRows) {
    throw new RangeError(`DP table must have ${expectedRows} rows, got ${table.length}`);
  }
  for (let g = 0; g < table.length; g += 1) {
    if (table[g]!.length !== expectedCols) {
      throw new RangeError(`DP row ${g} must have ${expectedCols} columns, got ${table[g]!.length}`);
    }
  }
}

/** Reconstructs one valid concrete arrangement string from a precomputed suffix-DP table, or `null`. */
export function reconstructWitness(
  record: SpringRecord,
  table: readonly (readonly bigint[])[],
): string | null {
  assertDpTableShape(record, table);
  if (table[0]![0]! === 0n) return null;
  const { pattern, groups } = record;
  const len = pattern.length;
  const chars: string[] = [];
  let g = 0;
  let i = 0;
  while (g < groups.length) {
    if (pattern[i] !== '#' && table[g]![i + 1]! > 0n) {
      chars.push('.');
      i += 1;
      continue;
    }
    const size = groups[g]!;
    chars.push('#'.repeat(size));
    i += size;
    g += 1;
    if (i < len) {
      chars.push('.');
      i += 1;
    }
  }
  chars.push('.'.repeat(len - i));
  return chars.join('');
}
