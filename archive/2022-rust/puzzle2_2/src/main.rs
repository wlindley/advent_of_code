use std::fs;

fn main() {
    let input = fs::read_to_string("input.txt").unwrap();
    let score = score_all(input);
    println!("Score: {score}");
}

#[derive(Debug, PartialEq, Eq, Copy, Clone)]
enum RPS {
    Rock,
    Paper,
    Scissors,
}

#[derive(Debug, PartialEq, Eq, Copy, Clone)]
enum Outcome {
    Lose = 0,
    Draw = 3,
    Win = 6,
}

fn score_all(all: String) -> u32 {
    let mut score = 0;
    for line in all.lines() {
        score += score_line(line.to_string());
    }
    return score;
}

fn score_line(line: String) -> u32 {
    let tokens = line.split_whitespace().collect::<Vec<&str>>();
    let elf_selection = convert_rps(tokens[0]);
    let outcome = convert_outcome(tokens[1]);
    let human_selection = achieve_outcome(outcome, elf_selection);
    return score_selection(human_selection) + score_outcome(outcome);
}

fn convert_rps(symbol: &str) -> RPS {
    if symbol == "A" {
        return RPS::Rock;
    } else if symbol == "B" {
        return RPS::Paper;
    } else {
        return RPS::Scissors;
    }
}

fn convert_outcome(symbol: &str) -> Outcome {
    if symbol == "X" {
        return Outcome::Lose;
    } else if symbol == "Y" {
        return Outcome::Draw;
    } else {
        return Outcome::Win;
    }
}

fn achieve_outcome(outcome: Outcome, other: RPS) -> RPS {
    return match other {
        RPS::Rock => match outcome {
            Outcome::Lose => RPS::Scissors,
            Outcome::Draw => RPS::Rock,
            Outcome::Win => RPS::Paper,
        },
        RPS::Paper => match outcome {
            Outcome::Lose => RPS::Rock,
            Outcome::Draw => RPS::Paper,
            Outcome::Win => RPS::Scissors,
        },
        RPS::Scissors => match outcome {
            Outcome::Lose => RPS::Paper,
            Outcome::Draw => RPS::Scissors,
            Outcome::Win => RPS::Rock,
        },
    };
}

fn score_selection(rps: RPS) -> u32 {
    return match rps {
        RPS::Rock => 1,
        RPS::Paper => 2,
        RPS::Scissors => 3,
    };
}

fn score_outcome(outcome: Outcome) -> u32 {
    return outcome as u32;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_force_win() {
        assert_eq!(score_line(String::from("A Y\n")), 4);
    }

    #[test]
    fn test_force_loss() {
        assert_eq!(score_line(String::from("B X\n")), 1);
    }

    #[test]
    fn test_force_draw() {
        assert_eq!(score_line(String::from("C Z\n")), 7);
    }
}
