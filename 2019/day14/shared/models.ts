import { DirectedGraph } from '../../../shared/core';

export const ORE_CHEMICAL = 'ORE';
export const FUEL_CHEMICAL = 'FUEL';

const CHEMICAL_RE = /^[A-Z]+$/;
const POSITIVE_INT_RE = /^[1-9]\d*$/;

/** Immutable chemical quantity pair participating in a reaction. */
export class Ingredient {
  readonly chemical: string;
  readonly quantity: bigint;

  constructor(chemical: string, quantity: bigint) {
    if (!CHEMICAL_RE.test(chemical)) {
      throw new Error(`Invalid chemical symbol: ${chemical}`);
    }
    if (quantity <= 0n) {
      throw new RangeError(`Ingredient quantity must be positive, got ${quantity}`);
    }
    this.chemical = chemical;
    this.quantity = quantity;
    Object.freeze(this);
  }
}

/** Immutable reaction converting distinct input ingredients into one output batch. */
export class Reaction {
  readonly inputs: readonly Ingredient[];
  readonly output: Ingredient;

  constructor(inputs: readonly Ingredient[], output: Ingredient) {
    if (inputs.length === 0) {
      throw new Error('Reaction must have at least one input ingredient');
    }
    if (output.chemical === ORE_CHEMICAL) {
      throw new Error('ORE cannot be produced by a reaction');
    }
    const seen = new Set<string>();
    for (const input of inputs) {
      if (seen.has(input.chemical)) {
        throw new Error(`Duplicate input chemical ${input.chemical} in reaction for ${output.chemical}`);
      }
      seen.add(input.chemical);
    }
    this.inputs = Object.freeze([...inputs]);
    this.output = output;
    Object.freeze(this);
  }
}

/** Validated, acyclic reaction network with FUEL-relevant demand ordering. */
export class ReactionNetwork {
  readonly reactions: readonly Reaction[];
  readonly demandGraph: DirectedGraph<string>;
  readonly orderedReactions: readonly Reaction[];
  private readonly byOutput: ReadonlyMap<string, Reaction>;

  constructor(
    reactions: readonly Reaction[],
    demandGraph: DirectedGraph<string>,
    orderedReactions: readonly Reaction[],
  ) {
    this.reactions = Object.freeze([...reactions]);
    this.demandGraph = demandGraph;
    this.orderedReactions = Object.freeze([...orderedReactions]);
    this.byOutput = new Map(this.reactions.map((rxn) => [rxn.output.chemical, rxn]));
    Object.freeze(this);
  }

  get reactionCount(): number {
    return this.reactions.length;
  }

  get activeReactionCount(): number {
    return this.orderedReactions.length;
  }

  reactionFor(chemical: string): Reaction | undefined {
    return this.byOutput.get(chemical);
  }
}

function parseIngredient(token: string): Ingredient {
  const parts = token.trim().split(/\s+/);
  if (parts.length !== 2) {
    throw new Error(`Malformed ingredient token: "${token}"`);
  }
  const [qtyRaw, chem] = parts as [string, string];
  if (!POSITIVE_INT_RE.test(qtyRaw)) {
    throw new Error(`Ingredient quantity must be a positive integer, got "${qtyRaw}"`);
  }
  return new Ingredient(chem, BigInt(qtyRaw));
}

function parseReactionLine(line: string): Reaction {
  const sides = line.split('=>');
  if (sides.length !== 2) {
    throw new Error(`Malformed reaction line: "${line}"`);
  }
  const [lhs, rhs] = sides as [string, string];
  const trimmedLhs = lhs.trim();
  if (!trimmedLhs) {
    throw new Error(`Missing input ingredients in line: "${line}"`);
  }
  const inputs = trimmedLhs.split(',').map(parseIngredient);
  const output = parseIngredient(rhs);
  return new Reaction(inputs, output);
}

function validateDefinedInputs(
  reactions: readonly Reaction[],
  byOutput: ReadonlyMap<string, Reaction>,
): void {
  for (const reaction of reactions) {
    for (const input of reaction.inputs) {
      if (input.chemical !== ORE_CHEMICAL && !byOutput.has(input.chemical)) {
        throw new Error(`Undefined input chemical: ${input.chemical}`);
      }
    }
  }
}

/** Parses and validates an AoC Day 14 reaction specification into a ReactionNetwork. */
export function parseReactionNetwork(raw: string): ReactionNetwork {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new Error('Reaction input cannot be empty');
  }
  const reactions = lines.map(parseReactionLine);
  const byOutput = new Map<string, Reaction>();
  for (const rxn of reactions) {
    if (byOutput.has(rxn.output.chemical)) {
      throw new Error(`Duplicate reaction output for ${rxn.output.chemical}`);
    }
    byOutput.set(rxn.output.chemical, rxn);
  }
  if (!byOutput.has(FUEL_CHEMICAL)) {
    throw new Error('Reaction network must define a FUEL output');
  }
  validateDefinedInputs(reactions, byOutput);

  const fullGraph = new DirectedGraph(
    reactions.map((rxn) => [rxn.output.chemical, rxn.inputs.map((i) => i.chemical)]),
  );
  const fullOrder = fullGraph.topologicalOrder();
  const demandGraph = fullGraph.relevantSubgraph(FUEL_CHEMICAL, ORE_CHEMICAL);
  const orderedReactions = fullOrder
    .filter((chem) => chem !== ORE_CHEMICAL && demandGraph.has(chem))
    .map((chem) => byOutput.get(chem)!);

  return new ReactionNetwork(reactions, demandGraph, orderedReactions);
}
