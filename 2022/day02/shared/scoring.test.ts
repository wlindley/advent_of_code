import { describe, expect, it } from 'vitest';
import { Outcome, Shape } from './rules';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MatchupSummary,
  ResolvedRound,
  scoreStrategyGuide,
  traceStrategyGuide,
  type RoundResolver,
} from './scoring';
import { parseStrategyGuide, StrategyRound } from './strategyGuide';

const playPaperResolver: RoundResolver = {
  resolve: (round) => new ResolvedRound(round, Shape.Paper),
};

describe('2022 day 02 scoring', () => {
  it('computes dynamic ResolvedRound getters and freezes the instance', () => {
    const winRound = new ResolvedRound(new StrategyRound(1, 'A', 'Y'), Shape.Paper);
    const lossRound = new ResolvedRound(new StrategyRound(2, 'B', 'X'), Shape.Rock);
    const drawRound = new ResolvedRound(new StrategyRound(3, 'C', 'Z'), Shape.Scissors);

    expect(Object.isFrozen(winRound)).toBe(true);
    expect(winRound.opponentShape).toBe(Shape.Rock);
    expect(winRound.outcome).toBe(Outcome.Win);
    expect(winRound.shapeScore).toBe(2);
    expect(winRound.outcomeScore).toBe(6);
    expect(winRound.totalScore).toBe(8);

    expect(lossRound.outcome).toBe(Outcome.Loss);
    expect(lossRound.totalScore).toBe(1);

    expect(drawRound.outcome).toBe(Outcome.Draw);
    expect(drawRound.totalScore).toBe(6);
  });

  it('rejects invalid playerShape in ResolvedRound', () => {
    const round = new StrategyRound(1, 'A', 'X');
    expect(() => new ResolvedRound(round, 3 as Shape)).toThrow(RangeError);
  });

  it('constructs MatchupSummary defensively and derives counts and scores', () => {
    const rawCounts = [
      1, 2, 0, // opponent Rock: (R,R)=1 draw(4), (R,P)=2 win(8*2=16)
      0, 0, 1, // opponent Paper: (P,S)=1 win(9)
      1, 0, 1, // opponent Scissors: (S,R)=1 win(7), (S,S)=1 draw(6)
    ];
    const summary = new MatchupSummary(rawCounts);
    rawCounts[0] = 99;

    expect(Object.isFrozen(summary)).toBe(true);
    expect(Object.isFrozen(summary.counts)).toBe(true);
    expect(summary.totalRounds).toBe(6);
    expect(summary.wins).toBe(4);
    expect(summary.draws).toBe(2);
    expect(summary.losses).toBe(0);
    expect(summary.totalScore).toBe(4 + 16 + 9 + 7 + 6);
    expect(summary.countOf(Shape.Rock, Shape.Rock)).toBe(1);
    expect(summary.countOf(Shape.Rock, Shape.Paper)).toBe(2);
    expect(summary.countOf(Shape.Paper, Shape.Scissors)).toBe(1);
  });

  it('validates MatchupSummary counts and countOf shape arguments', () => {
    expect(() => new MatchupSummary([0, 0, 0])).toThrow(RangeError);
    expect(() => new MatchupSummary([0, -1, 0, 0, 0, 0, 0, 0, 0])).toThrow(RangeError);
    expect(() => new MatchupSummary([0, 1.5, 0, 0, 0, 0, 0, 0, 0])).toThrow(RangeError);

    const summary = new MatchupSummary([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(() => summary.countOf(-1 as Shape, Shape.Rock)).toThrow(RangeError);
    expect(() => summary.countOf(Shape.Rock, 3 as Shape)).toThrow(RangeError);
  });

  it('scores and traces rounds with bounded frame sampling', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const rounds = parseStrategyGuide('A Y\nB X\nC Z');
    // Always Paper: vs Rock = 8, vs Paper = 5, vs Scissors = 2 => 15
    expect(scoreStrategyGuide(rounds, playPaperResolver)).toBe(15);

    const frames = traceStrategyGuide(rounds, playPaperResolver);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(3);
    expect(frames[0]?.summary.totalScore).toBe(8);
    expect(frames[1]?.summary.totalScore).toBe(13);
    expect(frames[2]?.summary.totalScore).toBe(15);
    expect(frames[2]?.summary.wins).toBe(1);
    expect(frames[2]?.summary.draws).toBe(1);
    expect(frames[2]?.summary.losses).toBe(1);
  });

  it('samples long traces to maxSteps while preserving final aggregate totals', () => {
    const lines = Array.from({ length: 200 }, (_, i) => (i % 2 === 0 ? 'A Y' : 'B X')).join('\n');
    const rounds = parseStrategyGuide(lines);
    const frames = traceStrategyGuide(rounds, playPaperResolver, { maxSteps: 5 });

    expect(frames).toHaveLength(5);
    expect(frames[0]?.roundIndex).toBe(0);
    const last = frames[4]!;
    expect(last.stepIndex).toBe(4);
    expect(last.totalSteps).toBe(5);
    expect(last.roundIndex).toBe(199);
    expect(last.totalRounds).toBe(200);
    expect(last.summary.totalRounds).toBe(200);
    expect(last.summary.totalScore).toBe(100 * 8 + 100 * 5);
  });

  it('rejects empty rounds and invalid maxSteps', () => {
    expect(() => scoreStrategyGuide([], playPaperResolver)).toThrow(RangeError);
    expect(() => traceStrategyGuide([], playPaperResolver)).toThrow(RangeError);
    const rounds = parseStrategyGuide('A Y');
    expect(() => traceStrategyGuide(rounds, playPaperResolver, { maxSteps: 0 })).toThrow(RangeError);
  });
});
