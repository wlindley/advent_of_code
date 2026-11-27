import { describe, expect, it } from 'vitest';
import {
  alignScanners,
  DEFAULT_MIN_OVERLAP,
  findAxisOffsets,
  TrenchMap,
} from './aligner';
import { parseScannerReports } from './parser';
import { IDENTITY_ROTATION } from './rotation';
import { AlignedScanner, ScannerReport } from './scanner';
import { Vec3 } from './vec3';

function makeBlock(id: number, flat: readonly number[]): string {
  const lines = [`--- scanner ${id} ---`];
  for (let i = 0; i < flat.length; i += 3) {
    lines.push(`${flat[i]!},${flat[i + 1]!},${flat[i + 2]!}`);
  }
  return lines.join('\n');
}

const OFFICIAL_EXAMPLE = [
  makeBlock(0, [
    404,-588,-901, 528,-643,409, -838,591,734, 390,-675,-793, -537,-823,-458,
    -485,-357,347, -345,-311,381, -661,-816,-575, -876,649,763, -618,-824,-621,
    553,345,-567, 474,580,667, -447,-329,318, -584,868,-557, 544,-627,-890,
    564,392,-477, 455,729,728, -892,524,684, -689,845,-530, 423,-701,434,
    7,-33,-71, 630,319,-379, 443,580,662, -789,900,-551, 459,-707,401,
  ]),
  makeBlock(1, [
    686,422,578, 605,423,415, 515,917,-361, -336,658,858, 95,138,22,
    -476,619,847, -340,-569,-846, 567,-361,727, -460,603,-452, 669,-402,600,
    729,430,532, -500,-761,534, -322,571,750, -466,-666,-811, -429,-592,574,
    -355,545,-477, 703,-491,-529, -328,-685,520, 413,935,-424, -391,539,-444,
    586,-435,557, -364,-763,-893, 807,-499,-711, 755,-354,-619, 553,889,-390,
  ]),
  makeBlock(2, [
    649,640,665, 682,-795,504, -784,533,-524, -644,584,-595, -588,-843,648,
    -30,6,44, -674,560,763, 500,723,-460, 609,671,-379, -555,-800,653,
    -675,-892,-343, 697,-426,-610, 578,704,681, 493,664,-388, -671,-858,530,
    -667,343,800, 571,-461,-707, -138,-166,112, -889,563,-600, 646,-828,498,
    640,759,510, -630,509,768, -681,-892,-333, 673,-379,-804, -742,-814,-386,
    577,-820,562,
  ]),
  makeBlock(3, [
    -589,542,597, 605,-692,669, -500,565,-823, -660,373,557, -458,-679,-417,
    -488,449,543, -626,468,-788, 338,-750,-386, 528,-832,-391, 562,-778,733,
    -938,-730,414, 543,643,-506, -524,371,-870, 407,773,750, -104,29,83,
    378,-903,-323, -778,-728,485, 426,699,580, -438,-605,-362, -469,-447,-387,
    509,732,623, 647,635,-688, -868,-804,481, 614,-800,639, 595,780,-596,
  ]),
  makeBlock(4, [
    727,592,562, -293,-554,779, 441,611,-461, -714,465,-776, -743,427,-804,
    -660,-479,-426, 832,-632,460, 927,-485,-438, 408,393,-506, 466,436,-512,
    110,16,151, -258,-428,682, -393,719,612, -211,-452,876, 808,-476,-593,
    -575,615,604, -485,667,467, -680,325,-822, -627,-443,-432, 872,-547,-609,
    833,512,582, 807,604,487, 839,-516,451, 891,-625,532, -652,-548,-490,
    30,-46,-14,
  ]),
].join('\n');

describe('aligner and TrenchMap', () => {
  it('aligns the official 5-scanner example to 79 beacons and 3621 max Manhattan', () => {
    const reports = parseScannerReports(OFFICIAL_EXAMPLE);
    const map = alignScanners(reports, DEFAULT_MIN_OVERLAP);
    expect(map.scannerCount).toBe(5);
    expect(map.beaconCount).toBe(79);
    expect(map.maxScannerManhattan).toBe(3621);
    expect(map.farthestScannerPair).toEqual({ aId: 2, bId: 3, distance: 3621 });

    const byId = new Map(map.scanners.map((s) => [s.id, s.position]));
    expect(byId.get(0)!.equals(new Vec3(0, 0, 0))).toBe(true);
    expect(byId.get(1)!.equals(new Vec3(68, -1246, -43))).toBe(true);
    expect(byId.get(2)!.equals(new Vec3(1105, -1205, 1229))).toBe(true);
    expect(byId.get(3)!.equals(new Vec3(-92, -2380, -20))).toBe(true);
    expect(byId.get(4)!.equals(new Vec3(-20, -1133, 1061))).toBe(true);
  });

  it('handles single-scanner input, reordered [1, 0], and non-zero IDs [5, 9]', () => {
    const s0 = new ScannerReport(0, [new Vec3(1, 2, 9), new Vec3(1, 2, 3), new Vec3(1, 5, 6)]);
    const single = alignScanners([s0], 2);
    expect(single.scannerCount).toBe(1);
    expect(single.beaconCount).toBe(3);
    expect(single.beacons.map((b) => b.format())).toEqual(['(1, 2, 3)', '(1, 2, 9)', '(1, 5, 6)']);
    expect(single.maxScannerManhattan).toBe(0);
    expect(single.farthestScannerPair).toEqual({ aId: 0, bId: 0, distance: 0 });

    const s1 = new ScannerReport(1, [new Vec3(11, 2, 3), new Vec3(11, 5, 6)]);
    const reordered = alignScanners([s1, s0], 2);
    expect(reordered.scanners[0]!.id).toBe(0);
    expect(reordered.scanners[1]!.position.equals(new Vec3(-10, 0, 0))).toBe(true);

    const s5 = new ScannerReport(5, [new Vec3(0, 0, 0), new Vec3(1, 2, 3)]);
    const s9 = new ScannerReport(9, [new Vec3(5, 5, 5), new Vec3(6, 7, 8)]);
    const nonZero = alignScanners([s5, s9], 2);
    expect(nonZero.scanners[0]!.id).toBe(5);
    expect(nonZero.scanners[1]!.position.equals(new Vec3(-5, -5, -5))).toBe(true);
  });

  it('returns all qualifying 1D axis offsets and falls back past 1D argmax decoys', () => {
    expect(findAxisOffsets([0, 100, 1000, 1010], [0, 100, 2000, 2010], 2)).toEqual([0, -1000]);

    const a = new ScannerReport(0, [
      new Vec3(500, 901, 1),
      new Vec3(500, 902, 20),
      new Vec3(500, 903, 300),
      new Vec3(500, 904, 4000),
      new Vec3(0, 0, 0),
      new Vec3(1, 10, 20),
      new Vec3(2, 30, 41),
    ]);
    const b = new ScannerReport(1, [
      new Vec3(500, 10, 200),
      new Vec3(500, -50, 7),
      new Vec3(500, 333, -9),
      new Vec3(500, -800, 42),
      new Vec3(100, 0, 0),
      new Vec3(101, 10, 20),
      new Vec3(102, 30, 41),
    ]);
    const map = alignScanners([a, b], 3);
    expect(map.scanners[1]!.position.equals(new Vec3(-100, 0, 0))).toBe(true);
  });

  it('rejects mirror-reflected (det = -1) scanners, disconnected graphs, and invalid args', () => {
    const basePts = [
      new Vec3(0, 0, 0),
      new Vec3(1, 3, 7),
      new Vec3(4, 11, 2),
      new Vec3(9, 2, 17),
    ];
    const reflectedPts = basePts.map((p) => new Vec3(-p.x, p.y, p.z));
    const s0 = new ScannerReport(0, basePts);
    const sMirror = new ScannerReport(1, reflectedPts);
    expect(() => alignScanners([s0, sMirror], 3)).toThrow(Error);

    const sFar = new ScannerReport(2, [new Vec3(100, 200, 300), new Vec3(101, 205, 310)]);
    expect(() => alignScanners([s0, sFar], 2)).toThrow(Error);
    expect(() => alignScanners([], 12)).toThrow(RangeError);
    expect(() => alignScanners([s0], 1)).toThrow(RangeError);
    expect(() => alignScanners([s0], 2.5)).toThrow(RangeError);
    const dummy = new AlignedScanner(0, new Vec3(0, 0, 0), IDENTITY_ROTATION, null, 1, [basePts[0]!]);
    expect(() => new TrenchMap([], [basePts[0]!])).toThrow(RangeError);
    expect(() => new TrenchMap([dummy], [])).toThrow(RangeError);
  });
});
