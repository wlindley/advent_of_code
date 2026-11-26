use std::fs;
use priority_queue::PriorityQueue;

fn main() {
    let contents = fs::read_to_string("input.txt").unwrap();
    let result = most_carried(contents);
    println!("Most calories carried: {}, {}, {}", result[0], result[1], result[2]);
}

fn most_carried(input: String) -> [u32; 3] {
    let mut current = 0;
    let mut count = 0;
    let mut pq = PriorityQueue::new();
    let mut result = [0; 3];

    for line in input.lines() {
        match line.parse::<u32>() {
            Ok(num) => current += num,
            Err(_) => {
                pq.push(count.to_string(), current);
                current = 0;
                count += 1;
            },
        }
    }
    pq.push(count.to_string(), current);

    for i in 0..3 {
        if let Some((_, num)) = pq.pop() {
            result[i] = num;
        }
    }
    return result;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty() {
        let input = String::from("");
        assert_eq!(most_carried(input), [0, 0, 0]);
    }

    #[test]
    fn test_one_elf_one_item() {
        let input = String::from("100");
        assert_eq!(most_carried(input), [100, 0, 0]);
    }

    #[test]
    fn test_one_elf_two_items() {
        let input = String::from("100\n200");
        assert_eq!(most_carried(input), [300, 0, 0]);
    }

    #[test]
    fn test_two_elves_two_items() {
        let input = String::from("100\n200\n\n300\n400");
        assert_eq!(most_carried(input), [700, 300, 0]);
    }
}
