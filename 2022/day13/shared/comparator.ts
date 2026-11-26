import type { PacketInt, PacketList, PacketValue } from './packet';

export type PacketOrder = -1 | 0 | 1;

/** Negates a `PacketOrder` without producing `-0`. */
export function negateOrder(order: PacketOrder): PacketOrder {
  return order === 0 ? 0 : order === -1 ? 1 : -1;
}

function compareLists(left: PacketList, right: PacketList): PacketOrder {
  const limit = Math.min(left.length, right.length);
  for (let i = 0; i < limit; i += 1) {
    const cmp = comparePackets(left.items[i]!, right.items[i]!);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return left.length < right.length ? -1 : left.length > right.length ? 1 : 0;
}

function compareIntToList(left: PacketInt, right: PacketList): PacketOrder {
  if (right.isEmpty) {
    return 1;
  }
  const firstCmp = comparePackets(left, right.items[0]!);
  if (firstCmp !== 0) {
    return firstCmp;
  }
  return right.length > 1 ? -1 : 0;
}

/** Compares two packet values using Distress Signal ordering rules without allocating wrapper lists. */
export function comparePackets(left: PacketValue, right: PacketValue): PacketOrder {
  if (left.kind === 'int') {
    if (right.kind === 'int') {
      return left.value < right.value ? -1 : left.value > right.value ? 1 : 0;
    }
    return compareIntToList(left, right);
  }
  if (right.kind === 'int') {
    return negateOrder(compareIntToList(right, left));
  }
  return compareLists(left, right);
}
