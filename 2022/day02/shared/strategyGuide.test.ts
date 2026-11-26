import { describe, expect, it } from 'vitest';
import { Shape } from './rules';
import {
  parseStrategyGuide,
  StrategyRound,
  type OpponentCode,
  type ResponseCode,
} from './strategyGuide';

describe('2022 day 02 strategyGuide', () => {
  it('constructs frozen StrategyRound instances and derives opponentShape', () => {
    const rock = new StrategyRound(1, 'A', 'Y');
    const paper = new StrategyRound(2, 'B', 'X');
    const scissors = new StrategyRound(3, 'C', 'Z');

    expect(Object.isFrozen(rock)).toBe(true);
    expect(rock.roundNumber).toBe(1);
    expect(rock.opponentCode).toBe('A');
    expect(rock.responseCode).toBe('Y');
    expect(rock.opponentShape).toBe(Shape.Rock);
    expect(paper.opponentShape).toBe(Shape.Paper);
    expect(scissors.opponentShape).toBe(Shape.Scissors);
  });

  it('validates StrategyRound constructor arguments', () => {
    expect(() => new StrategyRound(0, 'A', 'X')).toThrow(RangeError);
    expect(() => new StrategyRound(1.5, 'A', 'X')).toThrow(RangeError);
    expect(() => new StrategyRound(1, 'D' as OpponentCode, 'X')).toThrow(RangeError);
    expect(() => new StrategyRound(1, 'A', 'W' as ResponseCode)).toThrow(RangeError);
  });

  it('parses CRLF/blank lines into frozen sequential rounds', () => {
    const raw = '\n  A   Y \r\n\r\n B X\nC Z\n\n';
    const rounds = parseStrategyGuide(raw);

    expect(Object.isFrozen(rounds)).toBe(true);
    expect(rounds).toHaveLength(3);
    expect(rounds[0]).toMatchObject({ roundNumber: 1, opponentCode: 'A', responseCode: 'Y' });
    expect(rounds[1]).toMatchObject({ roundNumber: 2, opponentCode: 'B', responseCode: 'X' });
    expect(rounds[2]).toMatchObject({ roundNumber: 3, opponentCode: 'C', responseCode: 'Z' });
  });

  it('throws 1-based physical Line N errors for malformed lines and empty guides', () => {
    expect(() => parseStrategyGuide('')).toThrow(Error);
    expect(() => parseStrategyGuide('   \r\n\t\n')).toThrow(Error);
    expect(() => parseStrategyGuide('A Y\n\nB')).toThrow(/Line 3:/);
    expect(() => parseStrategyGuide('A Y\nB X Z')).toThrow(/Line 2:/);
    expect(() => parseStrategyGuide('D X')).toThrow(/Line 1:/);
    expect(() => parseStrategyGuide('A Y\nB W')).toThrow(/Line 2:/);
  });
});
