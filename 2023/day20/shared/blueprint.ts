import { type CircuitNode, createCircuitNode } from './nodes';
import {
  BROADCASTER_NAME,
  type ModuleDescriptor,
  type ModuleKind,
  validateModuleName,
} from './types';

/** Immutable validated specification for a single circuit module. */
export class ModuleSpec implements ModuleDescriptor {
  readonly name: string;
  readonly kind: ModuleKind;
  readonly destinations: readonly string[];

  constructor(name: string, kind: ModuleKind, destinations: readonly string[]) {
    this.name = validateModuleName(name);
    if ((kind === 'broadcaster') !== (this.name === BROADCASTER_NAME)) {
      throw new Error(`Module "${this.name}" cannot have kind "${kind}"`);
    }
    if (kind === 'sink' && destinations.length > 0) {
      throw new Error(`Sink module "${this.name}" cannot have destinations`);
    }
    this.kind = kind;
    this.destinations = Object.freeze(destinations.map(validateModuleName));
    Object.freeze(this);
  }
}

function registerDeclaredSpecs(
  specs: readonly ModuleSpec[],
  specsByName: Map<string, ModuleSpec>,
  inputsByName: Map<string, string[]>,
): void {
  for (const spec of specs) {
    if (specsByName.has(spec.name)) {
      throw new Error(`Duplicate module declaration: "${spec.name}"`);
    }
    specsByName.set(spec.name, spec);
    inputsByName.set(spec.name, []);
  }
  if (!specsByName.has(BROADCASTER_NAME)) {
    throw new Error(`Missing required "${BROADCASTER_NAME}" module`);
  }
}

function wireDestinationsAndSinks(
  specs: readonly ModuleSpec[],
  specsByName: Map<string, ModuleSpec>,
  inputsByName: Map<string, string[]>,
): void {
  for (const spec of specs) {
    for (const dest of spec.destinations) {
      if (!specsByName.has(dest)) {
        specsByName.set(dest, new ModuleSpec(dest, 'sink', []));
        inputsByName.set(dest, []);
      }
      const inputs = inputsByName.get(dest)!;
      if (!inputs.includes(spec.name)) {
        inputs.push(spec.name);
      }
    }
  }
}

/** Immutable circuit topology with synthesized sinks and deduplicated input wiring. */
export class CircuitBlueprint {
  private readonly specsByName: ReadonlyMap<string, ModuleSpec>;
  private readonly inputsByName: ReadonlyMap<string, readonly string[]>;

  constructor(specs: readonly ModuleSpec[]) {
    const specsMap = new Map<string, ModuleSpec>();
    const rawInputs = new Map<string, string[]>();
    registerDeclaredSpecs(specs, specsMap, rawInputs);
    wireDestinationsAndSinks(specs, specsMap, rawInputs);

    const frozenInputs = new Map<string, readonly string[]>();
    for (const [name, inputs] of rawInputs) {
      frozenInputs.set(name, Object.freeze(inputs));
    }
    this.specsByName = specsMap;
    this.inputsByName = frozenInputs;
    Object.freeze(this);
  }

  get moduleSpecs(): readonly ModuleSpec[] {
    return Object.freeze([...this.specsByName.values()]);
  }

  get nodeOrder(): readonly string[] {
    return Object.freeze([...this.specsByName.keys()]);
  }

  get moduleCount(): number {
    return this.specsByName.size;
  }

  hasModule(name: string): boolean {
    return this.specsByName.has(name);
  }

  specOf(name: string): ModuleSpec {
    const spec = this.specsByName.get(name);
    if (!spec) throw new Error(`Unknown module: "${name}"`);
    return spec;
  }

  inputsOf(name: string): readonly string[] {
    const inputs = this.inputsByName.get(name);
    if (!inputs) throw new Error(`Unknown module: "${name}"`);
    return inputs;
  }

  outputsOf(name: string): readonly string[] {
    return this.specOf(name).destinations;
  }

  instantiateNodes(): Map<string, CircuitNode> {
    const nodes = new Map<string, CircuitNode>();
    for (const [name, spec] of this.specsByName) {
      nodes.set(name, createCircuitNode(spec, this.inputsOf(name)));
    }
    return nodes;
  }
}
