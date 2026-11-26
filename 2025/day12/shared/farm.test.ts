import { describe, expect, it } from 'vitest';
import { PolyominoShape, TreeFarm, TreeRegion, parseTreeFarm } from './index';

const OFFICIAL_EXAMPLE = [
  '0:', '###', '##.', '##.', '', '1:', '###', '##.', '.##', '',
  '2:', '.##', '###', '##.', '', '3:', '##.', '###', '##.', '',
  '4:', '###', '#..', '###', '', '5:', '###', '.#.', '###', '',
  '4x4: 0 0 0 0 2 0', '12x5: 1 0 1 0 2 2', '12x5: 1 0 1 0 3 2',
].join('\n');

describe('TreeRegion, TreeFarm, and parseTreeFarm', () => {
  it('parses the official example and computes derived getters', () => {
    const farm = parseTreeFarm(OFFICIAL_EXAMPLE);
    expect(farm.shapes).toHaveLength(6);
    expect(farm.regions).toHaveLength(3);
    expect(farm.shapes[4]!.area).toBe(7);
    expect([farm.regions[0]!.area, farm.regions[0]!.totalPieces, farm.regions[2]!.totalPieces]).toEqual([16, 2, 7]);
    expect(Object.isFrozen(farm)).toBe(true);
    expect(Object.isFrozen(farm.regions[0])).toBe(true);
  });

  it('handles CRLF, extra blank lines, and dot-padded shapes', () => {
    const farm = parseTreeFarm('\r\n0:\r\n...\r\n.#.\r\n\r\n3x2: 2\r\n');
    expect(farm.shapes[0]!.cells).toEqual([{ row: 0, col: 0 }]);
    expect([farm.regions[0]!.width, farm.regions[0]!.height]).toEqual([3, 2]);
  });

  it('rejects invalid TreeRegion parameters', () => {
    expect(() => new TreeRegion(0, 2, [1])).toThrow(RangeError);
    expect(() => new TreeRegion(2, 0, [1])).toThrow(RangeError);
    expect(() => new TreeRegion(2, 2, [])).toThrow(RangeError);
    expect(() => new TreeRegion(2, 2, [-1])).toThrow(RangeError);
  });

  it('rejects invalid TreeFarm invariants', () => {
    const s0 = new PolyominoShape(0, [{ row: 0, col: 0 }]);
    const s2 = new PolyominoShape(2, [{ row: 0, col: 0 }]);
    const r = new TreeRegion(2, 2, [1]);
    expect(() => new TreeFarm([], [r])).toThrow(RangeError);
    expect(() => new TreeFarm([s0], [])).toThrow(RangeError);
    expect(() => new TreeFarm([s2], [r])).toThrow(Error);
    expect(() => new TreeFarm([s0], [new TreeRegion(2, 2, [1, 0])])).toThrow(Error);
  });

  it('rejects empty input, missing shapes, or missing regions', () => {
    expect(() => parseTreeFarm('  \n\r\n ')).toThrow(Error);
    expect(() => parseTreeFarm('4x4: 1')).toThrow(Error);
    expect(() => parseTreeFarm('0:\n#')).toThrow(Error);
  });

  it('rejects shape block after region line and unexpected top-level lines', () => {
    expect(() => parseTreeFarm('0:\n#\n2x2: 1\n1:\n#')).toThrow(Error);
    expect(() => parseTreeFarm('0:\n#\n\nnot-a-region')).toThrow(Error);
  });

  it('rejects bad shape characters, jagged rows, empty blocks, and all-dot shapes', () => {
    expect(() => parseTreeFarm('0:\n#x\n2x2: 1')).toThrow(Error);
    expect(() => parseTreeFarm('0:\n##\n#\n2x2: 1')).toThrow(Error);
    expect(() => parseTreeFarm('0:\n1:\n#\n2x2: 1 1')).toThrow(Error);
    expect(() => parseTreeFarm('0:\n2x2: 1')).toThrow(Error);
    expect(() => parseTreeFarm('0:\n..\n2x2: 1')).toThrow(Error);
  });

  it('rejects duplicate or non-sequential shape IDs and malformed region lines', () => {
    expect(() => parseTreeFarm('0:\n#\n0:\n#\n2x2: 1 1')).toThrow(Error);
    expect(() => parseTreeFarm('1:\n#\n2x2: 1')).toThrow(Error);
    expect(() => parseTreeFarm('0:\n#\n2x2: 1 x')).toThrow(Error);
  });
});
