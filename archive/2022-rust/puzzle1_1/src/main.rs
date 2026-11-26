use std::fs;

fn main() {
    let contents = fs::read_to_string("input.txt").unwrap();
    let result = most_carried(contents);
    println!("Most calories carried: {result}");
}

fn most_carried(input: String) -> u32 {
    let mut current = 0;
    let mut max = 0;
    for line in input.lines() {
        match line.parse::<u32>() {
            Ok(num) => current += num,
            Err(_) => {
                if current > max {
                    max = current;
                }
                current = 0;
            },
        }
    }

    if current > max {
        max = current;
    }

    return max;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty() {
        let input = String::from("");
        assert_eq!(most_carried(input), 0);
    }

    #[test]
    fn test_one_elf_one_item() {
        let input = String::from("100");
        assert_eq!(most_carried(input), 100);
    }

    #[test]
    fn test_one_elf_two_items() {
        let input = String::from("100\n200");
        assert_eq!(most_carried(input), 300);
    }

    #[test]
    fn test_two_elves_two_items() {
        let input = String::from("100\n200\n\n300\n400");
        assert_eq!(most_carried(input), 700);
    }
}
