import { EncryptedFile } from './encryptedFile';

const INTEGER_LINE_RE = /^-?\d+$/;

/** Parses newline-separated signed integers into a validated EncryptedFile. */
export function parseEncryptedFile(raw: string): EncryptedFile {
  const values: bigint[] = [];
  const lines = raw.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index]!.trim();
    if (trimmed.length === 0) continue;
    if (!INTEGER_LINE_RE.test(trimmed)) {
      throw new SyntaxError(`Invalid integer on line ${index + 1}: "${trimmed}"`);
    }
    values.push(BigInt(trimmed));
  }
  return new EncryptedFile(values);
}
