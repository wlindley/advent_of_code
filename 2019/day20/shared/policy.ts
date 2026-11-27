import type { PortalSide } from './maze';

export type DonutPolicyId = 'flat' | 'recursive';

export interface DonutPolicy {
  readonly id: DonutPolicyId;
  readonly label: string;
  readonly tracksDepth: boolean;
  maxDepthFor(portalCount: number): number;
  isGoalDepth(depth: number): boolean;
  nextDepth(depth: number, side: PortalSide, maxDepth: number): number | null;
}

export const FLAT_DONUT_POLICY: DonutPolicy = Object.freeze({
  id: 'flat',
  label: 'Flat Torus',
  tracksDepth: false,
  maxDepthFor: () => 0,
  isGoalDepth: () => true,
  nextDepth: () => 0,
});

export const RECURSIVE_DONUT_POLICY: DonutPolicy = Object.freeze({
  id: 'recursive',
  label: 'Recursive Levels',
  tracksDepth: true,
  maxDepthFor: (portalCount: number) => portalCount * 2,
  isGoalDepth: (depth: number) => depth === 0,
  nextDepth: (depth: number, side: PortalSide, maxDepth: number) => {
    const next = side === 'inner' ? depth + 1 : depth - 1;
    return next < 0 || next > maxDepth ? null : next;
  },
});
