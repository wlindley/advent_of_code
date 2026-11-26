export const DEFAULT_TARGET_COLOR = 'shiny gold';

const BAG_COLOR_RE = /^[a-z]+(?: [a-z]+)*$/;
const RULE_LINE_RE = /^(.+?) bags contain (.+)\.$/;
const CONTAINMENT_RE = /^([1-9]\d*) (.+?) (bags?)$/;

/** Validates a lowercase space-separated bag color name. */
export function validateBagColor(color: string): string {
  if (!BAG_COLOR_RE.test(color)) {
    throw new RangeError(`Invalid bag color: "${color}"`);
  }
  return color;
}

/** Immutable inner bag containment requirement with positive BigInt quantity. */
export class BagContainment {
  readonly color: string;
  readonly quantity: bigint;

  constructor(color: string, quantity: bigint) {
    this.color = validateBagColor(color);
    if (quantity < 1n) {
      throw new RangeError(`Bag quantity must be >= 1n, got ${quantity}`);
    }
    this.quantity = quantity;
    Object.freeze(this);
  }
}

/** Immutable outer bag color rule with unique inner containment entries. */
export class BagRule {
  readonly color: string;
  readonly contents: readonly BagContainment[];

  constructor(color: string, contents: readonly BagContainment[]) {
    this.color = validateBagColor(color);
    const seen = new Set<string>();
    for (const item of contents) {
      if (seen.has(item.color)) {
        throw new Error(`Duplicate inner bag color "${item.color}" in rule for "${this.color}"`);
      }
      seen.add(item.color);
    }
    this.contents = Object.freeze([...contents]);
    Object.freeze(this);
  }
}

function parseContainmentClause(clause: string): BagContainment {
  const match = CONTAINMENT_RE.exec(clause);
  if (!match) {
    throw new SyntaxError(`Invalid bag containment clause: "${clause}"`);
  }
  const quantity = BigInt(match[1]!);
  const color = match[2]!;
  const unit = match[3]!;
  if ((quantity === 1n) !== (unit === 'bag')) {
    throw new SyntaxError(`Mismatched singular/plural unit in clause: "${clause}"`);
  }
  return new BagContainment(color, quantity);
}

/** Parses one luggage rule line into an immutable BagRule. */
export function parseBagRule(line: string): BagRule {
  const match = RULE_LINE_RE.exec(line.trim());
  if (!match) {
    throw new SyntaxError(`Invalid bag rule syntax: "${line}"`);
  }
  const outerColor = match[1]!;
  const body = match[2]!;
  if (body === 'no other bags') {
    return new BagRule(outerColor, []);
  }
  const contents = body.split(', ').map(parseContainmentClause);
  return new BagRule(outerColor, contents);
}
