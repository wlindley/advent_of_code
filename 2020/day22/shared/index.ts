export { DeckRingBuffer, encodeStateKey } from './deck';
export { simulateCombat, simulateCombatTrace, type CombatResult } from './engine';
export { CombatDecks, MAX_CARD_VALUE, parseCombatDecks, scoreDeck, type PlayerId } from './model';
export {
  RECURSIVE_COMBAT_POLICY,
  STANDARD_COMBAT_POLICY,
  type CombatPolicy,
  type CombatPolicyId,
} from './policies';
export {
  MAX_VISIBLE_CARDS,
  projectCombatArena,
  type CombatArenaProjection,
  type DeckProjection,
  type ProjectedCard,
} from './projection';
export { CombatSolver } from './solver';
export {
  CombatTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  sampleCombatTrace,
  type RawTraceRecord,
  type RoundOutcome,
} from './trace';
