import { createMarkerSolver, type MarkerSolver } from '../../shared';

export const PACKET_MARKER_LENGTH = 4;

/** Start-of-packet marker solver (`K = 4`). */
export const solver: MarkerSolver = createMarkerSolver(PACKET_MARKER_LENGTH);
