import { BurrowState } from './burrow';
import { HALL_COUNT } from './constants';
import type { BurrowDiagram } from './parser';

export type BurrowPolicyId = 'standard' | 'unfolded';

/** Strategy interface preparing initial BurrowState from a parsed diagram (Part 1 vs Part 2). */
export interface BurrowPolicy {
  readonly id: BurrowPolicyId;
  readonly label: string;
  readonly roomDepth: number;
  prepare(diagram: BurrowDiagram): BurrowState;
}

/** Part 1 policy using the original depth-2 side rooms as parsed. */
export class StandardBurrowPolicy implements BurrowPolicy {
  readonly id = 'standard' as const;
  readonly label = 'Standard (depth 2)';
  readonly roomDepth = 2;

  prepare(diagram: BurrowDiagram): BurrowState {
    const roomsKey = diagram.rooms.map(([top, bottom]) => `${top}${bottom}`).join('');
    return new BurrowState('.'.repeat(HALL_COUNT) + roomsKey, this.roomDepth);
  }
}

export const STANDARD_BURROW_POLICY: BurrowPolicy = Object.freeze(new StandardBurrowPolicy());
