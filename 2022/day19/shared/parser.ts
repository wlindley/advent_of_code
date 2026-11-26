import { Blueprint } from './blueprint';

const BLUEPRINT_PATTERN =
  /^Blueprint (\d+): Each ore robot costs (\d+) ore\. Each clay robot costs (\d+) ore\. Each obsidian robot costs (\d+) ore and (\d+) clay\. Each geode robot costs (\d+) ore and (\d+) obsidian\.$/;

function parseChunk(chunk: string): Blueprint {
  const match = BLUEPRINT_PATTERN.exec(chunk.trim());
  if (!match) {
    throw new SyntaxError(`Malformed blueprint entry: ${chunk.trim()}`);
  }
  return new Blueprint({
    id: Number(match[1]!),
    oreRobotOreCost: Number(match[2]!),
    clayRobotOreCost: Number(match[3]!),
    obsidianRobotOreCost: Number(match[4]!),
    obsidianRobotClayCost: Number(match[5]!),
    geodeRobotOreCost: Number(match[6]!),
    geodeRobotObsidianCost: Number(match[7]!),
  });
}

/** Parses single-line or multi-line wrapped blueprint descriptions into frozen Blueprints. */
export function parseBlueprints(raw: string): readonly Blueprint[] {
  const normalized = raw.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    throw new SyntaxError('Blueprint input must not be empty');
  }
  const chunks = normalized.split(/(?=Blueprint\s+)/);
  const seenIds = new Set<number>();
  const blueprints: Blueprint[] = [];
  for (const chunk of chunks) {
    const bp = parseChunk(chunk);
    if (seenIds.has(bp.id)) {
      throw new RangeError(`Duplicate blueprint id ${bp.id}`);
    }
    seenIds.add(bp.id);
    blueprints.push(bp);
  }
  return Object.freeze(blueprints);
}
