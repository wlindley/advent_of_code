const TOKEN_RE = /^[a-z]+$/;

interface ParsedFoodLine {
  readonly ingredients: readonly string[];
  readonly allergens: readonly string[];
}

/** Immutable single food entry referencing sorted ingredient and allergen indices. */
export class Food {
  readonly index: number;
  readonly ingredientIds: readonly number[];
  readonly allergenIds: readonly number[];

  constructor(index: number, ingredientIds: readonly number[], allergenIds: readonly number[]) {
    this.index = index;
    this.ingredientIds = Object.freeze([...ingredientIds]);
    this.allergenIds = Object.freeze([...allergenIds]);
    Object.freeze(this);
  }

  get ingredientMask(): bigint {
    let mask = 0n;
    for (const id of this.ingredientIds) mask |= 1n << BigInt(id);
    return mask;
  }

  get ingredientCount(): number {
    return this.ingredientIds.length;
  }

  get allergenCount(): number {
    return this.allergenIds.length;
  }
}

/** Immutable parsed allergen document with ASCII-sorted vocabularies and derived statistics. */
export class AllergenDocument {
  readonly ingredients: readonly string[];
  readonly allergens: readonly string[];
  readonly foods: readonly Food[];

  constructor(ingredients: readonly string[], allergens: readonly string[], foods: readonly Food[]) {
    this.ingredients = Object.freeze([...ingredients]);
    this.allergens = Object.freeze([...allergens]);
    this.foods = Object.freeze([...foods]);
    Object.freeze(this);
  }

  get ingredientCount(): number {
    return this.ingredients.length;
  }

  get allergenCount(): number {
    return this.allergens.length;
  }

  get foodCount(): number {
    return this.foods.length;
  }

  get allIngredientsMask(): bigint {
    return (1n << BigInt(this.ingredients.length)) - 1n;
  }

  get ingredientFrequencies(): readonly number[] {
    const counts = new Array<number>(this.ingredients.length).fill(0);
    for (const food of this.foods) {
      for (const id of food.ingredientIds) counts[id] = counts[id]! + 1;
    }
    return Object.freeze(counts);
  }

  get totalAppearances(): number {
    let total = 0;
    for (const food of this.foods) total += food.ingredientCount;
    return total;
  }
}

function splitFoodClause(trimmed: string, lineNum: number): {
  readonly ingredientPart: string;
  readonly allergenPart: string | null;
} {
  const openIdx = trimmed.indexOf('(');
  if (openIdx === -1) {
    if (trimmed.includes(')')) throw new Error(`Line ${lineNum}: unexpected closing parenthesis`);
    return { ingredientPart: trimmed, allergenPart: null };
  }
  if (!trimmed.endsWith(')') || trimmed.indexOf('(', openIdx + 1) !== -1 || trimmed.indexOf(')') !== trimmed.length - 1) {
    throw new Error(`Line ${lineNum}: malformed contains parentheses`);
  }
  const inside = trimmed.slice(openIdx + 1, -1).trim();
  if (!inside.startsWith('contains')) throw new Error(`Line ${lineNum}: malformed contains keyword`);
  const rest = inside.slice('contains'.length);
  if (rest.length === 0) throw new Error(`Line ${lineNum}: empty allergen list`);
  if (!/^\s/.test(rest)) throw new Error(`Line ${lineNum}: malformed contains keyword`);
  return { ingredientPart: trimmed.slice(0, openIdx).trim(), allergenPart: rest.trim() };
}

function validateUniqueTokens(tokens: readonly string[], kind: string, lineNum: number): readonly string[] {
  const seen = new Set<string>();
  for (const tok of tokens) {
    if (!TOKEN_RE.test(tok)) throw new Error(`Line ${lineNum}: invalid ${kind} token "${tok}"`);
    if (seen.has(tok)) throw new Error(`Line ${lineNum}: duplicate ${kind} "${tok}"`);
    seen.add(tok);
  }
  return tokens;
}

function parseFoodLine(rawLine: string, lineNum: number): ParsedFoodLine {
  const trimmed = rawLine.trim();
  if (trimmed === '') throw new Error(`Line ${lineNum}: empty food line`);
  const { ingredientPart, allergenPart } = splitFoodClause(trimmed, lineNum);
  if (ingredientPart === '') throw new Error(`Line ${lineNum}: missing ingredients`);
  const ingredients = validateUniqueTokens(ingredientPart.split(/\s+/), 'ingredient', lineNum);
  const allergens = allergenPart === null
    ? []
    : validateUniqueTokens(allergenPart.split(',').map((part) => part.trim()), 'allergen', lineNum);
  return { ingredients, allergens };
}

function buildIndexMap(sortedNames: readonly string[]): ReadonlyMap<string, number> {
  const map = new Map<string, number>();
  sortedNames.forEach((name, idx) => map.set(name, idx));
  return map;
}

/** Parses an AoC 2020 Day 21 food list into an immutable AllergenDocument. */
export function parseAllergenDocument(raw: string): AllergenDocument {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized === '') throw new Error('Allergen document is empty');
  const parsedLines = normalized.split('\n').map((line, i) => parseFoodLine(line, i + 1));
  const ingredientSet = new Set<string>();
  const allergenSet = new Set<string>();
  for (const line of parsedLines) {
    for (const ing of line.ingredients) ingredientSet.add(ing);
    for (const alg of line.allergens) allergenSet.add(alg);
  }
  const ingredients = [...ingredientSet].sort();
  const allergens = [...allergenSet].sort();
  const ingIdx = buildIndexMap(ingredients);
  const algIdx = buildIndexMap(allergens);
  const foods = parsedLines.map((line, index) => new Food(
    index,
    line.ingredients.map((name) => ingIdx.get(name)!),
    line.allergens.map((name) => algIdx.get(name)!),
  ));
  return new AllergenDocument(ingredients, allergens, foods);
}
