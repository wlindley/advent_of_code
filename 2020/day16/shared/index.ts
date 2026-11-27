export {
  FieldRule,
  parseTicketDocument,
  Ticket,
  TicketDocument,
} from './model';
export {
  buildCompatibilityMasks,
  FieldResolution,
  PeelingStep,
  resolveFieldMapping,
  scanNearbyTickets,
  scanTicket,
  TicketScanResult,
  type FieldAssignment,
} from './scanner';
export {
  DEFAULT_MAX_TRACE_STEPS,
  DEPARTURE_FIELD_PREFIX,
  DEPARTURE_PRODUCT_POLICY,
  ERROR_RATE_POLICY,
  ErrorScanTraceFrame,
  FieldPeelingTraceFrame,
  type ErrorScanTraceFrameInit,
  type FieldPeelingTraceFrameInit,
  type TicketPolicy,
  type TicketPolicyId,
  type TicketTraceFrame,
} from './policies';
export { TicketTranslationSolver } from './solver';
export {
  normalizeBigInt,
  projectPeelingMatrix,
  projectSpectrum,
  type PeelingCellState,
  type PeelingMatrixProjection,
  type PeelingMatrixRow,
  type SpectrumBand,
  type SpectrumMarker,
  type SpectrumProjection,
} from './projection';
