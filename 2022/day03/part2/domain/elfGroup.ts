import {
  extractSinglePriority,
  parseRucksacks,
  priorityToItem,
  type Rucksack,
} from '../../shared';

export const ELF_GROUP_SIZE = 3;

/** Immutable 3-elf group storing only `groupNumber` and its 3 `Rucksack`s. */
export class ElfGroup {
  readonly groupNumber: number;
  readonly rucksacks: readonly [Rucksack, Rucksack, Rucksack];

  constructor(groupNumber: number, first: Rucksack, second: Rucksack, third: Rucksack) {
    if (!Number.isSafeInteger(groupNumber) || groupNumber < 1) {
      throw new RangeError(`groupNumber must be a positive safe integer, got ${groupNumber}`);
    }
    this.groupNumber = groupNumber;
    this.rucksacks = Object.freeze([first, second, third] as const);
    Object.freeze(this);
  }

  get badgeMask(): bigint {
    const [first, second, third] = this.rucksacks;
    return first.allMask & second.allMask & third.allMask;
  }

  get badgePriority(): number {
    return extractSinglePriority(this.badgeMask);
  }

  get badgeItem(): string {
    return priorityToItem(this.badgePriority);
  }
}

/** Partitions a flat list of rucksacks into frozen 3-elf `ElfGroup` instances. */
export function partitionElfGroups(rucksacks: readonly Rucksack[]): readonly ElfGroup[] {
  if (rucksacks.length === 0 || rucksacks.length % ELF_GROUP_SIZE !== 0) {
    throw new RangeError(
      `Rucksack count must be a positive multiple of ${ELF_GROUP_SIZE}, got ${rucksacks.length}`,
    );
  }
  const groups: ElfGroup[] = [];
  for (let i = 0; i < rucksacks.length; i += ELF_GROUP_SIZE) {
    groups.push(
      new ElfGroup(
        groups.length + 1,
        rucksacks[i]!,
        rucksacks[i + 1]!,
        rucksacks[i + 2]!,
      ),
    );
  }
  return Object.freeze(groups);
}

/** Parses newline-delimited rucksack lines into frozen 3-elf `ElfGroup` instances. */
export function parseElfGroups(raw: string): readonly ElfGroup[] {
  return partitionElfGroups(parseRucksacks(raw));
}
