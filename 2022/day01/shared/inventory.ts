const POSITIVE_INT_PATTERN = /^\d+$/;

function validatePositiveSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
}

function copyValidatedItems(items: readonly number[]): readonly number[] {
  if (items.length === 0) {
    throw new RangeError('ElfInventory must contain at least one calorie item');
  }
  const copy: number[] = [];
  let sum = 0;
  for (const item of items) {
    validatePositiveSafeInt(item, 'Calorie item');
    // Guard against silent IEEE-754 precision loss when totaling an Elf's items.
    if (Number.MAX_SAFE_INTEGER - sum < item) {
      throw new RangeError('ElfInventory total calories exceeds Number.MAX_SAFE_INTEGER');
    }
    sum += item;
    copy.push(item);
  }
  return Object.freeze(copy);
}

/** Immutable value object representing one Elf's carried calorie items. */
export class ElfInventory {
  readonly elfNumber: number;
  readonly items: readonly number[];

  constructor(elfNumber: number, items: readonly number[]) {
    validatePositiveSafeInt(elfNumber, 'elfNumber');
    this.elfNumber = elfNumber;
    this.items = copyValidatedItems(items);
    Object.freeze(this);
  }

  get itemCount(): number {
    return this.items.length;
  }

  get totalCalories(): number {
    let total = 0;
    for (const item of this.items) {
      total += item;
    }
    return total;
  }
}

function parseCalorieLine(rawLine: string, lineNumber: number): number | null {
  const trimmed = rawLine.trim();
  if (trimmed.length === 0) return null;
  if (!POSITIVE_INT_PATTERN.test(trimmed)) {
    throw new Error(`Line ${lineNumber}: expected a positive integer, got "${trimmed}"`);
  }
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`Line ${lineNumber}: calorie value must be a positive safe integer, got ${trimmed}`);
  }
  return value;
}

function flushInventoryBlock(inventories: ElfInventory[], pendingItems: number[]): void {
  if (pendingItems.length === 0) return;
  inventories.push(new ElfInventory(inventories.length + 1, pendingItems));
  pendingItems.length = 0;
}

/** Parses blank-line-separated calorie blocks into frozen ElfInventory instances. */
export function parseCalorieInventories(raw: string): readonly ElfInventory[] {
  const lines = raw.split(/\r?\n/);
  const inventories: ElfInventory[] = [];
  const pendingItems: number[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const calories = parseCalorieLine(lines[i]!, i + 1);
    if (calories === null) {
      flushInventoryBlock(inventories, pendingItems);
    } else {
      pendingItems.push(calories);
    }
  }
  flushInventoryBlock(inventories, pendingItems);

  if (inventories.length === 0) {
    throw new Error('Input must contain at least one Elf inventory');
  }
  return Object.freeze(inventories);
}
