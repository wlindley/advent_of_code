import { SqrtCircularList } from './circularList';
import {
  type EncryptedFile,
  GROVE_OFFSETS,
  GroveCoordinates,
  type MixConfig,
  validateMixConfig,
} from './encryptedFile';

/** Result of mixing an EncryptedFile: final ID permutation and extracted grove coordinates. */
export interface MixedFileResult {
  readonly order: readonly number[];
  readonly coordinates: GroveCoordinates;
}

/** Validates a ring ID permutation and reads the 1000th, 2000th, and 3000th values after 0n. */
export function extractGroveCoordinates(
  order: readonly number[],
  file: EncryptedFile,
  decryptionKey: bigint,
): GroveCoordinates {
  if (order.length !== file.length) {
    throw new RangeError(`Expected order length ${file.length}, got ${order.length}`);
  }
  for (const id of order) {
    if (!Number.isInteger(id) || id < 0 || id >= file.length) {
      throw new RangeError(`Invalid element ID in order: ${id}`);
    }
  }
  const zeroIndex = order.indexOf(file.zeroId);
  if (zeroIndex < 0) {
    throw new RangeError(`Order does not contain zeroId ${file.zeroId}`);
  }
  const scaled = file.scaledValues(decryptionKey);
  const offsetIndices = [
    (zeroIndex + GROVE_OFFSETS[0]) % file.length,
    (zeroIndex + GROVE_OFFSETS[1]) % file.length,
    (zeroIndex + GROVE_OFFSETS[2]) % file.length,
  ] as const;
  return new GroveCoordinates(
    scaled[order[offsetIndices[0]]!]!,
    scaled[order[offsetIndices[1]]!]!,
    scaled[order[offsetIndices[2]]!]!,
    zeroIndex,
    offsetIndices,
  );
}

/** Mixes an EncryptedFile according to MixConfig and returns the final order and coordinates. */
export function mixEncryptedFile(file: EncryptedFile, config: MixConfig): MixedFileResult {
  validateMixConfig(config);
  const scaled = file.scaledValues(config.decryptionKey);
  const ring = new SqrtCircularList(file.length, config.blockSize);
  for (let round = 0; round < config.rounds; round += 1) {
    for (let id = 0; id < file.length; id += 1) {
      ring.move(id, scaled[id]!);
    }
  }
  const order = ring.toOrder();
  const coordinates = extractGroveCoordinates(order, file, config.decryptionKey);
  return Object.freeze({ order, coordinates });
}

/** Solves for the sum of the three grove coordinates after mixing. */
export function solveGroveCoordinates(file: EncryptedFile, config: MixConfig): bigint {
  return mixEncryptedFile(file, config).coordinates.sum;
}
