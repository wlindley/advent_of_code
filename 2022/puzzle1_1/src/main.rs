fn main() {
    println!("Hello, world!");
}

fn most_carried(input: String) -> u32 {
    let mut total = 0;
    for line in input.lines() {
        if let Ok(num) = line.parse::<u32>() {
            total += num;
        }
    }
    return total;
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
}
