use std::fs;
use std::collections::HashSet;

fn main() {
    let input = fs::read_to_string("input.txt").unwrap();
    let result = score_sacks(input);
    println!("Total: {result}");
}

struct Rucksack {
    compartments: [HashSet<char>; 2]
}

impl Rucksack {
    fn new(contents: String) -> Rucksack {
        let c = contents.split_at(contents.len()/2);
        Rucksack { compartments: [Self::load(c.0), Self::load(c.1)] }
    }

    fn load(contents: &str) -> HashSet<char> {
        let mut counts = HashSet::new();
        for c in contents.chars() {
            counts.insert(c);
        }
        return counts;
    }

    fn get_duplicate(&self) -> Option<char> {
        for item in self.compartments[0].intersection(&self.compartments[1]) {
            return Option::Some(*item);
        }
        return Option::None;
    }
}

fn priority(input: char) -> u64 {
    if input.is_uppercase() {
        return ((input as u8) - ('A' as u8) + 27) as u64;
    }
    return ((input as u8) - ('a' as u8) + 1) as u64;
}

fn score_sacks(sacks: String) -> u64 {
    let mut total = 0;
    for line in sacks.lines() {
        let sack = Rucksack::new(String::from(line));
        total += priority(sack.get_duplicate().unwrap());
    }
    return total;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rucksack_find_duplicate_simple() {
        let sack = Rucksack::new(String::from("aa"));
        assert_eq!(sack.get_duplicate(), Option::Some('a'));
    }

    #[test]
    fn test_rucksack_find_duplicate_multi_char() {
        let sack = Rucksack::new(String::from("abbc"));
        assert_eq!(sack.get_duplicate(), Option::Some('b'));
    }

    #[test]
    fn test_priority_lowercase() {
        assert_eq!(priority('a'), 1);
        assert_eq!(priority('b'), 2);
        assert_eq!(priority('z'), 26);
    }

    #[test]
    fn test_priority_uppercase() {
        assert_eq!(priority('A'), 27);
        assert_eq!(priority('B'), 28);
        assert_eq!(priority('Z'), 52);
    }

    #[test]
    fn test_score_sacks() {
        let sacks = String::from("vJrwpWtwJgWrhcsFMMfFFhFp\njqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL\n");
        assert_eq!(score_sacks(sacks), 54);
    }
}
