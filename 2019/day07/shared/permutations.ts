function compareBigInt(a: bigint, b: bigint): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function swapItems(items: bigint[], i: number, j: number): void {
  const temp = items[i]!;
  items[i] = items[j]!;
  items[j] = temp;
}

function reverseSlice(items: bigint[], start: number, end: number): void {
  let left = start;
  let right = end;
  while (left < right) {
    swapItems(items, left, right);
    left += 1;
    right -= 1;
  }
}

function advancePermutation(items: bigint[]): boolean {
  let pivot = items.length - 2;
  while (pivot >= 0 && items[pivot]! >= items[pivot + 1]!) {
    pivot -= 1;
  }
  if (pivot < 0) {
    return false;
  }
  let successor = items.length - 1;
  while (items[successor]! <= items[pivot]!) {
    successor -= 1;
  }
  swapItems(items, pivot, successor);
  reverseSlice(items, pivot + 1, items.length - 1);
  return true;
}

/** Generates all distinct lexicographic permutations of `values` as frozen tuples. */
export function generatePermutations(values: readonly bigint[]): readonly (readonly bigint[])[] {
  if (values.length === 0) {
    return Object.freeze([Object.freeze([])]);
  }
  const current = [...values].sort(compareBigInt);
  const permutations: (readonly bigint[])[] = [Object.freeze([...current])];
  while (advancePermutation(current)) {
    permutations.push(Object.freeze([...current]));
  }
  return Object.freeze(permutations);
}
