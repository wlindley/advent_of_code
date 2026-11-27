import {
  MOVE_COMMANDS,
  pointKey,
  stepPoint,
  type GridPoint,
  type ShipMap,
} from './oxygenModels';

/** Immutable shortest-path distance field computed from a single traversable source cell. */
export class DistanceField {
  readonly source: GridPoint;
  readonly distances: ReadonlyMap<string, number>;
  readonly parents: ReadonlyMap<string, GridPoint>;

  constructor(
    source: GridPoint,
    distances: ReadonlyMap<string, number>,
    parents: ReadonlyMap<string, GridPoint>,
  ) {
    this.source = source;
    this.distances = distances;
    this.parents = parents;
    Object.freeze(this);
  }

  get maxDistance(): number {
    let max = 0;
    for (const distance of this.distances.values()) {
      if (distance > max) {
        max = distance;
      }
    }
    return max;
  }

  get reachedCount(): number {
    return this.distances.size;
  }

  distanceTo(target: GridPoint): number | null {
    const distance = this.distances.get(pointKey(target.x, target.y));
    return distance !== undefined ? distance : null;
  }

  requireDistance(target: GridPoint): number {
    const distance = this.distanceTo(target);
    if (distance === null) {
      throw new Error(
        `Target (${target.x},${target.y}) is unreachable from (${this.source.x},${this.source.y})`,
      );
    }
    return distance;
  }
}

/** Runs O(V) head-index queue BFS over traversable compartment tiles from source. */
export function computeDistanceField(map: ShipMap, source: GridPoint): DistanceField {
  if (!map.isTraversable(source.x, source.y)) {
    throw new Error(`BFS source (${source.x},${source.y}) is not traversable`);
  }
  const distances = new Map<string, number>([[pointKey(source.x, source.y), 0]]);
  const parents = new Map<string, GridPoint>();
  const queue: GridPoint[] = [Object.freeze({ x: source.x, y: source.y })];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head]!;
    head += 1;
    const nextDistance = distances.get(pointKey(current.x, current.y))! + 1;
    for (const command of MOVE_COMMANDS) {
      const next = stepPoint(current, command);
      const key = pointKey(next.x, next.y);
      if (!map.isTraversable(next.x, next.y) || distances.has(key)) {
        continue;
      }
      distances.set(key, nextDistance);
      parents.set(key, current);
      queue.push(next);
    }
  }
  return new DistanceField(source, distances, parents);
}

/** Reconstructs the shortest path from field.source to target inclusive. */
export function reconstructPath(field: DistanceField, target: GridPoint): readonly GridPoint[] {
  field.requireDistance(target);
  const path: GridPoint[] = [];
  let cursor: GridPoint | undefined = Object.freeze({ x: target.x, y: target.y });
  while (cursor !== undefined) {
    path.push(cursor);
    cursor = field.parents.get(pointKey(cursor.x, cursor.y));
  }
  path.reverse();
  return Object.freeze(path);
}

/** Returns the discovered oxygen system coordinate or throws if absent. */
export function requireOxygenPoint(map: ShipMap): GridPoint {
  if (map.oxygen === null) {
    throw new Error('Oxygen system was not discovered in compartment map');
  }
  return map.oxygen;
}
