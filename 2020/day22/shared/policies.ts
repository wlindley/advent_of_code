export type CombatPolicyId = 'standard-combat' | 'recursive-combat';

export interface CombatPolicy {
  readonly id: CombatPolicyId;
  readonly label: string;
  readonly recursive: boolean;
}

export const STANDARD_COMBAT_POLICY: CombatPolicy = Object.freeze({
  id: 'standard-combat',
  label: 'Standard Combat',
  recursive: false,
});

export const RECURSIVE_COMBAT_POLICY: CombatPolicy = Object.freeze({
  id: 'recursive-combat',
  label: 'Recursive Combat',
  recursive: true,
});
