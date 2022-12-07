use std::fs;
use std::collections::HashSet;

fn main() {
    let input = fs::read_to_string("input.txt").unwrap();
    let result = score_groups(input);
    println!("Total: {result}");
}

struct Group {
    elves: Vec<HashSet<char>>
}

impl Group {
    fn new() -> Group {
        Group { elves: Vec::new() }
    }

    fn add(&mut self, contents: &str) {
        self.elves.push(Self::load(contents));
    }

    fn load(contents: &str) -> HashSet<char> {
        let mut counts = HashSet::new();
        for c in contents.chars() {
            counts.insert(c);
        }
        return counts;
    }

    fn get_duplicate(&self) -> Option<char> {
        for item in &self.elves[0] {
            if self.elves[1].contains(item) && self.elves[2].contains(item) {
                return Option::Some(*item);
            }
        }
        return Option::None;
    }

    fn count(&self) -> usize {
        return self.elves.len();
    }
}

fn priority(input: char) -> u64 {
    if input.is_uppercase() {
        return ((input as u8) - ('A' as u8) + 27) as u64;
    }
    return ((input as u8) - ('a' as u8) + 1) as u64;
}

fn score_groups(sacks: String) -> u64 {
    let mut total = 0;
    let mut group = Group::new();
    for line in sacks.lines() {
        group.add(line);
        if group.count() == 3 {
            total += priority(group.get_duplicate().unwrap());
            group = Group::new();
        }
    }
    //total += priority(group.get_duplicate().unwrap());
    return total;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_group_find_duplicate_simple() {
        let mut group = Group::new();
        group.add("aa");
        group.add("aa");
        group.add("aa");
        assert_eq!(group.get_duplicate(), Option::Some('a'));
    }

    #[test]
    fn test_group_find_duplicate_multi_char() {
        let mut group = Group::new();
        group.add("ab");
        group.add("bc");
        group.add("bd");
        assert_eq!(group.get_duplicate(), Option::Some('b'));
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
    fn test_score_groups() {
        let groups = String::from("vJrwpWtwJgWrhcsFMMfFFhFp\njqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL\nPmmdzqPrVvPwwTWBwg\nwMqvLMZHhHMvwLHjbvcjnnSBnvTQFn\nttgJtRGJQctTZtZT\nCrZsJsPPZsGzwwsLwLmpwMDw\n");
        assert_eq!(score_groups(groups), 70);
    }
}
