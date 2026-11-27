import { describe, expect, it } from 'vitest';
import { MAX_SCANNER_MANHATTAN_POLICY, ROTATIONS_24, Rotation3D, Vec3 } from '../../shared';
import { solver } from './index';

function formatBlock(id: number, flat: readonly number[]): string {
  const lines = [`--- scanner ${id} ---`];
  for (let i = 0; i < flat.length; i += 3) {
    lines.push(`${flat[i]!},${flat[i + 1]!},${flat[i + 2]!}`);
  }
  return lines.join('\n');
}

function worldToLocal(world: Vec3, pos: Vec3, rot: Rotation3D): Vec3 {
  const d = world.subtract(pos);
  const c: [number, number, number] = [0, 0, 0];
  c[rot.xAxis] = rot.xSign * d.x;
  c[rot.yAxis] = rot.ySign * d.y;
  c[rot.zAxis] = rot.zSign * d.z;
  return new Vec3(c[0], c[1], c[2]);
}

function makeCloud(origin: Vec3, seed: number): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i < 14; i += 1) {
    const dx = i * (53 + seed * 17) + ((i * i * (11 + seed)) % 37) - 350;
    const dy = i * (89 + seed * 23) + ((i * i * i * (7 + seed)) % 41) - 550;
    const dz = i * (131 + seed * 29) + (((i + 3) * (i + 5) * (13 + seed)) % 43) - 700;
    pts.push(origin.add(new Vec3(dx, dy, dz)));
  }
  return pts;
}

function formatScanner(id: number, worlds: readonly Vec3[], pos: Vec3, rot: Rotation3D): string {
  const lines = [`--- scanner ${id} ---`];
  for (const w of worlds) {
    const local = worldToLocal(w, pos, rot);
    lines.push(`${local.x},${local.y},${local.z}`);
  }
  return lines.join('\n');
}

const EXAMPLE_BLOCKS = [
  formatBlock(0, [
    404,-588,-901, 528,-643,409, -838,591,734, 390,-675,-793, -537,-823,-458,
    -485,-357,347, -345,-311,381, -661,-816,-575, -876,649,763, -618,-824,-621,
    553,345,-567, 474,580,667, -447,-329,318, -584,868,-557, 544,-627,-890,
    564,392,-477, 455,729,728, -892,524,684, -689,845,-530, 423,-701,434,
    7,-33,-71, 630,319,-379, 443,580,662, -789,900,-551, 459,-707,401,
  ]),
  formatBlock(1, [
    686,422,578, 605,423,415, 515,917,-361, -336,658,858, 95,138,22,
    -476,619,847, -340,-569,-846, 567,-361,727, -460,603,-452, 669,-402,600,
    729,430,532, -500,-761,534, -322,571,750, -466,-666,-811, -429,-592,574,
    -355,545,-477, 703,-491,-529, -328,-685,520, 413,935,-424, -391,539,-444,
    586,-435,557, -364,-763,-893, 807,-499,-711, 755,-354,-619, 553,889,-390,
  ]),
  formatBlock(2, [
    649,640,665, 682,-795,504, -784,533,-524, -644,584,-595, -588,-843,648,
    -30,6,44, -674,560,763, 500,723,-460, 609,671,-379, -555,-800,653,
    -675,-892,-343, 697,-426,-610, 578,704,681, 493,664,-388, -671,-858,530,
    -667,343,800, 571,-461,-707, -138,-166,112, -889,563,-600, 646,-828,498,
    640,759,510, -630,509,768, -681,-892,-333, 673,-379,-804, -742,-814,-386,
    577,-820,562,
  ]),
  formatBlock(3, [
    -589,542,597, 605,-692,669, -500,565,-823, -660,373,557, -458,-679,-417,
    -488,449,543, -626,468,-788, 338,-750,-386, 528,-832,-391, 562,-778,733,
    -938,-730,414, 543,643,-506, -524,371,-870, 407,773,750, -104,29,83,
    378,-903,-323, -778,-728,485, 426,699,580, -438,-605,-362, -469,-447,-387,
    509,732,623, 647,635,-688, -868,-804,481, 614,-800,639, 595,780,-596,
  ]),
  formatBlock(4, [
    727,592,562, -293,-554,779, 441,611,-461, -714,465,-776, -743,427,-804,
    -660,-479,-426, 832,-632,460, 927,-485,-438, 408,393,-506, 466,436,-512,
    110,16,151, -258,-428,682, -393,719,612, -211,-452,876, 808,-476,-593,
    -575,615,604, -485,667,467, -680,325,-822, -627,-443,-432, 872,-547,-609,
    833,512,582, 807,604,487, 839,-516,451, 891,-625,532, -652,-548,-490,
    30,-46,-14,
  ]),
];

const OFFICIAL_EXAMPLE = EXAMPLE_BLOCKS.join('\n');

describe('2021 Day 19 Part 2 solver', () => {
  it('solves the official 5-scanner example to 3621 with MAX_SCANNER_MANHATTAN_POLICY', () => {
    expect(solver.policy).toBe(MAX_SCANNER_MANHATTAN_POLICY);
    const reports = solver.parse(OFFICIAL_EXAMPLE);
    const answer = solver.solve(reports);
    expect(answer).toBe(3621);
    expect(solver.formatAnswer(answer)).toBe('3621');
  });

  it('returns 0 and a single complete frame with no links for a single scanner', () => {
    const reports = solver.parse(EXAMPLE_BLOCKS[0]!);
    expect(solver.solve(reports)).toBe(0);
    const frames = solver.trace(reports);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.metricValue).toBe(0);
    expect(frames[0]!.projection.links).toHaveLength(0);
    expect(frames[0]!.isComplete).toBe(true);
  });

  it('is invariant to input scanner block permutation', () => {
    const reordered = [4, 2, 0, 3, 1].map((idx) => EXAMPLE_BLOCKS[idx]!).join('\n');
    expect(solver.solve(solver.parse(reordered))).toBe(3621);
  });

  it('aligns a multi-hop 4-scanner chain with negative coordinates and non-identity rotations', () => {
    const p0 = new Vec3(0, 0, 0);
    const p1 = new Vec3(1100, -450, 720);
    const p2 = new Vec3(-600, 1250, -840);
    const p3 = new Vec3(2300, -1400, 1600);
    const cloudA = makeCloud(p0, 0);
    const cloudB = makeCloud(p1.add(new Vec3(4000, 0, 0)), 1);
    const cloudC = makeCloud(p2.add(new Vec3(0, -4000, 0)), 2);
    const raw = [
      formatScanner(0, cloudA, p0, ROTATIONS_24[0]!),
      formatScanner(1, [...cloudA, ...cloudB], p1, ROTATIONS_24[5]!),
      formatScanner(2, [...cloudB, ...cloudC], p2, ROTATIONS_24[11]!),
      formatScanner(3, cloudC, p3, ROTATIONS_24[19]!),
    ].join('\n');
    expect(solver.solve(solver.parse(raw))).toBe(7990);
  });

  it('recovers 7035 across all 24 proper cube rotations for S1@(-1234, 2345, -3456)', () => {
    const p0 = new Vec3(0, 0, 0);
    const p1 = new Vec3(-1234, 2345, -3456);
    const cloud = makeCloud(p0, 0);
    const s0 = formatScanner(0, cloud, p0, ROTATIONS_24[0]!);
    for (const rot of ROTATIONS_24) {
      const raw = `${s0}\n${formatScanner(1, cloud, p1, rot)}`;
      expect(solver.solve(solver.parse(raw))).toBe(7035);
    }
  });

  it('traces bounded progressive frames monotonically up to 3621', () => {
    const reports = solver.parse(OFFICIAL_EXAMPLE);
    const f4 = solver.trace(reports, { maxSteps: 4 });
    expect(f4).toHaveLength(4);
    expect(f4[0]!.activeScanner.isAnchor).toBe(true);
    expect(f4[0]!.activeScanner.id).toBe(0);
    for (let i = 1; i < f4.length; i += 1) {
      expect(f4[i]!.metricValue).toBeGreaterThanOrEqual(f4[i - 1]!.metricValue);
    }
    expect(f4[3]!.metricValue).toBe(3621);
    expect(f4[3]!.projection.links).toHaveLength(4);
    expect(f4[3]!.isComplete).toBe(true);

    const f2 = solver.trace(reports, { maxSteps: 2 });
    expect(f2).toHaveLength(2);
    expect(f2[1]!.metricValue).toBe(3621);
    expect(f2[1]!.isComplete).toBe(true);

    const f1 = solver.trace(reports, { maxSteps: 1 });
    expect(f1).toHaveLength(1);
    expect(f1[0]!.metricValue).toBe(3621);
    expect(f1[0]!.isComplete).toBe(true);

    const fDefault = solver.trace(reports);
    expect(fDefault).toHaveLength(5);
    expect(fDefault[4]!.metricValue).toBe(3621);
    expect(fDefault[4]!.isComplete).toBe(true);
  });

  it('rejects empty input with SyntaxError', () => {
    expect(() => solver.parse('')).toThrow(SyntaxError);
  });

  it('rejects malformed beacon coordinates with SyntaxError', () => {
    expect(() => solver.parse('--- scanner 0 ---\n1,2')).toThrow(SyntaxError);
  });

  it('rejects duplicate scanner IDs with SyntaxError', () => {
    expect(() => solver.parse('--- scanner 0 ---\n1,2,3\n--- scanner 0 ---\n4,5,6')).toThrow(SyntaxError);
  });

  it('rejects disconnected scanners with Error', () => {
    const reports = solver.parse('--- scanner 0 ---\n1,2,3\n--- scanner 1 ---\n10,20,30');
    expect(() => solver.solve(reports)).toThrow(Error);
  });

  it('rejects maxSteps <= 0 with RangeError', () => {
    const reports = solver.parse(EXAMPLE_BLOCKS[0]!);
    expect(() => solver.trace(reports, { maxSteps: 0 })).toThrow(RangeError);
  });
});
