use std::cmp::Ordering;
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

impl PartialOrd for RPS {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        return match &self {
            RPS::Rock => {
                match other {
                    RPS::Rock => Option::Some(Ordering::Equal),
                    RPS::Paper => Option::Some(Ordering::Less),
                    RPS::Scissors => Option::Some(Ordering::Greater),
                }
            },
            RPS::Paper => {
                match other {
                    RPS::Rock => Option::Some(Ordering::Greater),
                    RPS::Paper => Option::Some(Ordering::Equal),
                    RPS::Scissors => Option::Some(Ordering::Less),
                }
            },
            RPS::Scissors => {
                match other {
                    RPS::Rock => Option::Some(Ordering::Less),
                    RPS::Paper => Option::Some(Ordering::Greater),
                    RPS::Scissors => Option::Some(Ordering::Equal),
                }
            },
        };
    }
}

fn score(elf: RPS, human: RPS) -> u32 {
    return selection_score(human) + winning_score(elf, human);
}

fn selection_score(rps: RPS) -> u32 {
    return match rps {
        RPS::Rock => 1,
        RPS::Paper => 2,
        RPS::Scissors => 3,
    };
}

fn winning_score(elf: RPS, human: RPS) -> u32 {
    if human > elf {
        return 6;
    } else if elf > human {
        return 0;
    } else {
        return 3;
    }
}

fn score_line(line: String) -> u32 {
    let tokens = line.split_whitespace().collect::<Vec<&str>>();
    return score(elf_conversion(tokens[0]), human_conversion(tokens[1]));
}

fn elf_conversion(symbol: &str) -> RPS {
    if symbol == "A" {
        return RPS::Rock;
    } else if symbol == "B" {
        return RPS::Paper;
    } else {
        return RPS::Scissors;
    }
}

fn human_conversion(symbol: &str) -> RPS {
    if symbol == "X" {
        return RPS::Rock;
    } else if symbol == "Y" {
        return RPS::Paper;
    } else {
        return RPS::Scissors;
    }
}

fn score_all(all: String) -> u32 {
    let mut score = 0;
    for line in all.lines() {
        score += score_line(line.to_string());
    }
    return score;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rock_paper() {
        assert_eq!(score(RPS::Rock, RPS::Paper), 8);
        assert_eq!(score_line(String::from("A Y\n")), 8);
    }
    
    #[test]
    fn test_paper_rock() {
        assert_eq!(score(RPS::Paper, RPS::Rock), 1);
        assert_eq!(score_line(String::from("B X\n")), 1);
    }

    #[test]
    fn test_scissor_scissor() {
        assert_eq!(score(RPS::Scissors, RPS::Scissors), 6);
        assert_eq!(score_line(String::from("C Z\n")), 6);
    }
}
